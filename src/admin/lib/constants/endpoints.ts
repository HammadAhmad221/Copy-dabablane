export const BACK_USER_ENDPOINTS = {
  BASE: '/back/v1/users',
  getAllUsers: () => '/back/v1/users',
  getUserById: (id: string) => `/back/v1/users/${id}`,
  createUser: () => '/back/v1/users',
  updateUser: (id: string) => `/back/v1/users/${id}`,
  deleteUser: (id: string) => `/back/v1/users/${id}`,
  updateUserStatus: (id: string) => `/back/v1/users/${id}/status`,
  exportUsers: () => '/back/v1/users/export',
}; 