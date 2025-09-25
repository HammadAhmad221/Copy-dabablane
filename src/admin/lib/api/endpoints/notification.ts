type NotificationEndpoints = {
  BASE: string;
  GET_ALL: () => string;
  MARK_AS_READ: (id: string) => string;
  MARK_ALL_AS_READ: string;
  DELETE: (id: string) => string;
  DELETE_ALL: string;
  CHECK_EXPIRATION: string;
};

// Base path matches the actual API endpoint
const BASE = '/back/v1/notifications';

const BACK_NOTIFICATION_ENDPOINTS: NotificationEndpoints = {
  BASE,
  // GET / - index
  GET_ALL: () => BASE,
  // POST /mark-as-read/{id} - markAsRead
  MARK_AS_READ: (id: string) => `${BASE}/mark-as-read/${id}`,
  // POST /mark-all-as-read - markAllAsRead
  MARK_ALL_AS_READ: `${BASE}/mark-all-as-read`,
  // DELETE /{id} - destroy
  DELETE: (id: string) => `${BASE}/${id}`,
  // DELETE / - destroyAll
  DELETE_ALL: BASE,
  // POST /check-expiration - checkExpiration
  CHECK_EXPIRATION: `${BASE}/check-expiration`
} as const;

export default BACK_NOTIFICATION_ENDPOINTS;