
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
  const { toast } = useToast()

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true)
      const response = await mobileBannerApi.getBanners()
      setBanners(response.data)
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
    setFormData({ ...formData, [name]: value })
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
          {banners.map((banner) => (
            <Card key={banner.id} className="border-0 shadow-lg overflow-hidden bg-white">
              <img src={banner.image_url} alt={banner.title} className="w-full h-48 object-cover" />
              <CardContent className="p-4">
                <h3 className="text-lg font-bold">{banner.title}</h3>
                <p className="text-sm text-gray-600">{banner.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className={`text-xs font-semibold ${banner.is_active ? "text-green-500" : "text-red-500"}`}>
                    {banner.is_active ? "Active" : "Inactive"}
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
          ))}
        </div>
      </div>
    </div>
  )
}

export default MobileBanner
