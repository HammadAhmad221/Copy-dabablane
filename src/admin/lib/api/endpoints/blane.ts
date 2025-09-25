import { get } from "lodash";

const BACK_BLANE_ENDPOINTS = {
  BASE: '/back/v1/blanes',
  getAllBlanes: () => `${BACK_BLANE_ENDPOINTS.BASE}`,
  getBlaneById: (id: string) => `${BACK_BLANE_ENDPOINTS.BASE}/${id}`,
  createBlane: () => `${BACK_BLANE_ENDPOINTS.BASE}`,
  updateBlane: (id: string) => `${BACK_BLANE_ENDPOINTS.BASE}/${id}`,
  deleteBlane: (id: string) => `${BACK_BLANE_ENDPOINTS.BASE}/${id}`,
  updateStatusBlane: (id: string) => `${BACK_BLANE_ENDPOINTS.BASE}/${id}/update-status`,
  getBlaneType: (type: string) => `${BACK_BLANE_ENDPOINTS.BASE}?type=${type}`,
  bulkDelete: () => `${BACK_BLANE_ENDPOINTS.BASE}/bulk-delete`,
};

export default BACK_BLANE_ENDPOINTS;
