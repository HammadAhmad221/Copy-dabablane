
import apiClient from "../apiClient"

const API_URL = "https://dev.dabablane.com/api/back/v1/mobile-banners"

export const mobileBannerApi = {
  getBanners: () => {
    return apiClient.get(API_URL)
  },
  createBanner: (formData: FormData) => {
    return apiClient.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },
  deleteBanner: (id: number) => {
    return apiClient.delete(`${API_URL}/${id}`)
  },
}
