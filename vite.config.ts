import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, Plugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

// Custom plugin to handle "use client" directives
const removeUseClientDirective = (): Plugin => {
  return {
    name: 'remove-use-client-directive',
    transform(code, id) {
      // Check if the file starts with "use client"
      if (code.trim().startsWith('"use client"') || code.trim().startsWith("'use client'")) {
        // Remove the directive and return the rest of the code
        return code.replace(/"use client"[\s]*;?|'use client'[\s]*;?/, '');
      }
      return null; // Return null to indicate no transformation needed
    }
  };
};

// Plugin to suppress "use client" warnings
const suppressUseClientWarnings = (): Plugin => {
  return {
    name: 'suppress-use-client-warnings',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const originalWrite = res.write;
        const originalEnd = res.end;

        // Override write
        res.write = function(chunk, ...args) {
          if (chunk && typeof chunk === 'string' && chunk.includes('Module level directives cause errors when bundled, "use client"')) {
            // Filter out the warnings
            chunk = chunk.replace(/node_modules.*Module level directives cause errors when bundled, "use client".*ignored\./g, '');
          }
          return originalWrite.call(this, chunk, ...args);
        };

        // Override end
        res.end = function(chunk, ...args) {
          if (chunk && typeof chunk === 'string' && chunk.includes('Module level directives cause errors when bundled, "use client"')) {
            // Filter out the warnings
            chunk = chunk.replace(/node_modules.*Module level directives cause errors when bundled, "use client".*ignored\./g, '');
          }
          return originalEnd.call(this, chunk, ...args);
        };

        next();
      });
    }
  };
};

// Plugin to set cache headers for static assets
const cachePolicyPlugin = (): Plugin => {
  return {
    name: 'cache-policy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Skip non-assets
        if (!req.url || !req.url.startsWith('/assets/')) {
          return next();
        }

        // Set cache headers based on file type
        const fileExtension = path.extname(req.url).toLowerCase();
        
        // Images and fonts - long cache (1 year)
        if (/\.(jpe?g|png|gif|svg|webp|woff2?|ttf|eot|otf)$/.test(fileExtension)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } 
        // JS and CSS - shorter cache (1 week) due to possible updates
        else if (/\.(js|css)$/.test(fileExtension)) {
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
        // Other assets - medium cache (1 month)
        else {
          res.setHeader('Cache-Control', 'public, max-age=2592000');
        }
        
        next();
      });
    },
  };
};

// Plugin to reduce unused JavaScript
const treeshakePlugin = (): Plugin => {
  return {
    name: 'treeshake-unused-js',
    // This plugin optimizes how code gets bundled
    resolveId(source, importer) {
      // Special handling to better tree-shake large dependencies
      if (source === 'lodash' || source === 'lodash-es' || source.startsWith('lodash/')) {
        return this.resolve(`${source}-es`, importer, { skipSelf: true });
      }
      return null;
    }
  };
};

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd());
  const isProd = mode === 'production';
  
  return {
    plugins: [
      removeUseClientDirective(),
      suppressUseClientWarnings(),
      react(),
      treeshakePlugin(),
      cachePolicyPlugin(),
      // Add compression for production builds
      isProd && compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      isProd && compression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      // Add bundle visualization in production
      isProd && visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      assetsDir: 'assets',
      // Enable chunk size warnings
      chunkSizeWarningLimit: 250,
      // Improve code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': [
              '@radix-ui/react-avatar',
              '@radix-ui/react-popover',
              '@radix-ui/react-dropdown-menu',
              'framer-motion',
              '@radix-ui/react-dialog',
              '@radix-ui/react-tabs',
            ],
            'vendor-utils': ['axios', 'date-fns', 'dayjs', 'zod'],
            'vendor-tanstack': ['@tanstack/react-query'],
          },
          // Ensure assets are properly organized
          assetFileNames: (assetInfo) => {
            if (/\.(gif|jpe?g|png|svg|webp)$/.test(assetInfo.name ?? '')) {
              return 'assets/images/[name].[hash].[ext]';
            }
            if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name ?? '')) {
              return 'assets/fonts/[name].[hash].[ext]';
            }
            return 'assets/[name].[hash].[ext]';
          },
          // Optimize chunk filenames
          chunkFileNames: 'assets/js/[name].[hash].js',
          entryFileNames: 'assets/js/[name].[hash].js',
        },
      },
      // Add esbuild options to handle "use client" directives during build
      target: 'es2015',
      minify: 'esbuild',
      // Disable sourcemaps in production for smaller files
      sourcemap: !isProd,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      // Tree shaking improvements
      modulePreload: {
        polyfill: true,
      },
      // CSS optimization
      cssCodeSplit: true,
      cssMinify: true,
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      esbuildOptions: {
        define: {
          // This helps esbuild ignore "use client" directives
          'process.env.NODE_ENV': JSON.stringify(mode)
        },
        legalComments: 'none',
        // Improve tree shaking
        treeShaking: true,
      }
    },
    server: {
      // Cache optimization for dev server
      hmr: {
        overlay: true,
      },
    },
    preview: {
      // Enable compression in preview mode
      compress: true,
      port: 4173,
    }
  };
});