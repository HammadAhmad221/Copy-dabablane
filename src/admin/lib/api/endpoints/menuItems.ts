const FRONT_MENU_ITEMS_ENDPOINTS = {
  BASE: '/back/v1/menu-items',
  getAllMenuItems: () => `${FRONT_MENU_ITEMS_ENDPOINTS.BASE}`,
  getMenuItemById: (id: string) => `${FRONT_MENU_ITEMS_ENDPOINTS.BASE}/${id}`,
  createMenuItem: () => `${FRONT_MENU_ITEMS_ENDPOINTS.BASE}`,
  updateMenuItem: (id: string) => `${FRONT_MENU_ITEMS_ENDPOINTS.BASE}/${id}`,
  deleteMenuItem: (id: string) => `${FRONT_MENU_ITEMS_ENDPOINTS.BASE}/${id}`,
};

export default FRONT_MENU_ITEMS_ENDPOINTS;