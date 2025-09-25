// Endpoint constants for blane visibility API
export const BLANE_VISIBILITY_ENDPOINTS = {
  BASE: '/back/v1/blanes',
  SHARE_LINK: (id: string) => `${BLANE_VISIBILITY_ENDPOINTS.BASE}/${id}/share`,
  VISIBILITY: (id: string) => `${BLANE_VISIBILITY_ENDPOINTS.BASE}/${id}/visibility`,
  SHARED: (slug: string, token: string) => `/front/v1/blanes/shared/${slug}/${token}`,
};
