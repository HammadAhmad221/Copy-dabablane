
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Input } from "@/admin/components/ui/input"
import { Button } from "@/admin/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/admin/components/ui/card"
import { Label } from "@/admin/components/ui/label"
import { Textarea } from "@/admin/components/ui/textarea"
import { Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/admin/hooks/use-toast"
import { mobileBannerApi } from "@/admin/lib/api/services/mobileBannerService"

 const getMediaUrl = (media: unknown): string | null => {
   if (!media) return null

   const candidate = (() => {
     if (Array.isArray(media)) {
       for (const item of media) {
         const resolved = getMediaUrl(item)
         if (resolved) return resolved
       }
       return null
     }
     if (typeof media === "string") return media
     if (typeof media === "object") {
       const obj: any = media
       return (
         obj?.url ||
         obj?.src ||
         obj?.path ||
         obj?.data?.url ||
         obj?.data?.src ||
         obj?.data?.path ||
         obj?.data?.attributes?.url ||
         obj?.data?.attributes?.src ||
         obj?.data?.attributes?.path ||
         obj?.attributes?.url ||
         obj?.attributes?.src ||
         obj?.attributes?.path ||
         obj?.file?.url ||
         obj?.file?.path ||
         obj?.image_link ||
         obj?.image_url ||
         obj?.image ||
         null
       )
     }
     return null
   })()

   if (!candidate || typeof candidate !== "string") return null

   const trimmed = candidate.trim()
   if (!trimmed) return null

   if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
     return trimmed
   }

   const apiBaseUrl = import.meta.env.VITE_API_URL || "https://dev.dabablane.com/api"
   const baseDomain = apiBaseUrl.replace(/\/?api\/?$/, "")

   let cleanPath = trimmed
   if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1)

   if (cleanPath.startsWith("storage/app/public/")) {
     cleanPath = `storage/${cleanPath.slice("storage/app/public/".length)}`
   } else if (cleanPath.startsWith("public/storage/")) {
     cleanPath = `storage/${cleanPath.slice("public/storage/".length)}`
   } else if (cleanPath.startsWith("public/")) {
     cleanPath = cleanPath.slice("public/".length)
   }

   if (cleanPath.startsWith("storage/") || cleanPath.startsWith("uploads/") || cleanPath.startsWith("public/")) {
     return `${baseDomain}/${cleanPath}`
   }

   return `${baseDomain}/storage/${cleanPath}`
 }

interface BannerFormData {
  title: string
  description: string
  image: File | string | null
  order: number
  is_active: boolean
}

function MobileBanner() {
  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    description: "",
    image: null,
    order: 1,
    is_active: false,
  })

  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [failedMedia, setFailedMedia] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true)
      const response = await mobileBannerApi.getBanners()

      const body: any = response?.data
      const candidates = [
        body,
        body?.data,
        body?.data?.data,
        body?.items,
        body?.mobile_banners,
        body?.banners,
        body?.results,
      ]

      const bannersData = candidates.find((c) => Array.isArray(c)) || []

      setBanners(bannersData)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch banners",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "order") {
      setFormData({ ...formData, order: Number(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, image: file })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      if (formData.image instanceof File) {
        formDataToSend.append("image", formData.image)
      }
      formDataToSend.append("order", formData.order.toString())
      formDataToSend.append("is_active", formData.is_active ? "1" : "0")

      await mobileBannerApi.createBanner(formDataToSend)
      toast({
        title: "Success",
        description: "Banner created successfully",
      })
      fetchBanners()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create banner",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setLoading(true)
      await mobileBannerApi.deleteBanner(id)
      toast({
        title: "Success",
        description: "Banner deleted successfully",
      })
      fetchBanners()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete banner",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container p-6 w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des bannières mobiles</h1>
      <Card className="border-0 shadow-lg overflow-hidden bg-white">
        <CardHeader className="bg-[#00897B] text-white p-6">
          <CardTitle className="text-2xl">Ajouter une nouvelle bannière</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Titre
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Entrez le titre de la bannière"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Entrez la description de la bannière"
                  rows={3}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                  Image de la bannière
                </Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="order" className="text-sm font-medium text-gray-700">
                  Order
                </Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Is Active?
              </Label>
              <Input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mt-1 w-4 h-4"
              />
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-[#00897B] hover:bg-[#00796B] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement en cours...
                  </div>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Bannières existantes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {banners.map((banner, idx) => {
            const rawMedia =
              banner.image_link ||
              banner.image_url ||
              banner.image ||
              banner.banner_image ||
              banner.banner ||
              banner.media ||
              banner.file ||
              banner.path ||
              banner.image_path
            const mediaSrc = getMediaUrl(rawMedia)
            const isVideoMedia =
              typeof mediaSrc === "string" &&
              [".mp4", ".mov", ".webm", ".ogg"].some((ext) => mediaSrc.toLowerCase().includes(ext))
            const videoType = typeof mediaSrc === "string" && mediaSrc.toLowerCase().includes(".mov")
              ? "video/quicktime"
              : "video/mp4"
            const isActive = typeof banner.is_active === "boolean"
              ? banner.is_active
              : Boolean(Number(banner.is_active))

            const bannerKey = String(banner.id ?? banner.uuid ?? idx)
            const mediaFailed = Boolean(failedMedia[bannerKey])

            return (
              <Card key={banner.id ?? banner.uuid ?? idx} className="border-0 shadow-lg overflow-hidden bg-white">
                {mediaSrc && !mediaFailed ? (
                  isVideoMedia ? (
                    <video
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-48 object-cover"
                      onError={() => setFailedMedia((prev) => ({ ...prev, [bannerKey]: true }))}
                    >
                      <source src={mediaSrc} type={videoType} />
                    </video>
                  ) : (
                    <img
                      src={mediaSrc}
                      alt={banner.title}
                      className="w-full h-48 object-cover"
                      onError={() => setFailedMedia((prev) => ({ ...prev, [bannerKey]: true }))}
                    />
                  )
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                    {mediaSrc ? (
                      <a
                        href={mediaSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00897B] underline"
                      >
                        Open media
                      </a>
                    ) : (
                      "Aucune image"
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold">{banner.title || banner.name || ""}</h3>
                  <p className="text-sm text-gray-600">{banner.description || banner.text || ""}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`text-xs font-semibold ${isActive ? "text-green-500" : "text-red-500"}`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MobileBanner
