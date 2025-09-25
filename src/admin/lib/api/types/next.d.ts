/**
 * Type definitions for Next.js specific global variables
 */

interface NextData {
  props: Record<string, any>;
  page: string;
  query: Record<string, string>;
  buildId: string;
  assetPrefix?: string;
  runtimeConfig?: Record<string, any>;
  nextExport?: boolean;
  autoExport?: boolean;
  isFallback?: boolean;
  dynamicIds?: string[];
  err?: Error & { statusCode?: number };
  gsp?: boolean;
  gssp?: boolean;
  customServer?: boolean;
  gip?: boolean;
  appGip?: boolean;
  locale?: string;
  locales?: string[];
  defaultLocale?: string;
  domainLocales?: any[];
  scriptLoader?: any[];
  env?: Record<string, string>;
}

declare global {
  interface Window {
    __NEXT_DATA__?: NextData;
  }
} 