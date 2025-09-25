const BASE_USER_URL = '/back/v1/users';

const BACK_USER_ENDPOINTS = {
  BASE: BASE_USER_URL,
  getAllUsers: () => `${BASE_USER_URL}`,
  getUserById: (id: string) => `${BASE_USER_URL}/${id}`,
  createUser: () => `${BASE_USER_URL}`,
  updateUser: (id: string) => `${BASE_USER_URL}/${id}`,
  assignUserRole: (id: string) => `${BASE_USER_URL}/${id}/assign-roles`,
  deleteUser: (id: string) => `${BASE_USER_URL}/${id}`,
  exportUsers: () => `${BASE_USER_URL}/export`,
};

export default BACK_USER_ENDPOINTS;
