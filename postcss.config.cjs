module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'cssnano': process.env.NODE_ENV === 'production' ? {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        // Disable SVG optimization to fix parsing errors
        svgo: false
      }]
    } : false
  }
}; 