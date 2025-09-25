export const BACK_AUTH_ENDPOINTS = {
  BaseUrl: '/',
  login: () => `${BACK_AUTH_ENDPOINTS.BaseUrl}login`,
  register: () => `${BACK_AUTH_ENDPOINTS.BaseUrl}register`,
  logout: () => `${BACK_AUTH_ENDPOINTS.BaseUrl}logout`,
};

