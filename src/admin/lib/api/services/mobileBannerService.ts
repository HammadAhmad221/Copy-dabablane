
import { adminApiClient } from "../client";

const API_URL = "/back/v1/mobile-banners";

export const mobileBannerApi = {
  getBanners: () => {
    return adminApiClient.get(API_URL);
  },
  createBanner: (formData: FormData) => {
    return adminApiClient.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteBanner: (id: number) => {
    return adminApiClient.delete(`${API_URL}/${id}`);
  },
};
