import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/admin/components/ui/input"
import { Button } from "@/admin/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent} from "@/admin/components/ui/card"
import { Label } from "@/admin/components/ui/label"
import { Textarea } from "@/admin/components/ui/textarea"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import BannerPreview from "../components/BannerPreview";
import { bannerApi } from "@/admin/lib/api/services/bannerService"
import { BannerType } from "@/admin/lib/api/types/banner";
import { useToast } from "@/admin/hooks/use-toast";

interface BannerFormData {
  title: string
  description: string
  image1: File | string | null
  image2: File | string | null
  btname1: string
  link: string
  title2: string
  description2: string
  btname2: string
  link2: string
  isVideo1?: boolean
  isVideo2?: boolean
}

function DynamiqueBanner() {
  const [formData, setFormData] = useState<BannerFormData>({
    title: "",
    description: "",
    image1: null,
    image2: null,
    btname1: "",
    link: "",
    title2: "",
    description2: "",
    btname2: "",
    link2: "",
    isVideo1: false,
    isVideo2: false,
  })

  const [activeSection, setActiveSection] = useState<"hero" | "banner" | null>("hero")
  const [banner, setBanner] = useState<BannerType | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] || null
    if (index === 1) {
      setFormData({ ...formData, image1: file })
    } else {
      setFormData({ ...formData, image2: file })
    }
  }

  const fetchBanner = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bannerApi.getBanners();
      
      if (response.data) {
        const bannerData = response.data;
        setBanner(bannerData);
        
        setFormData(prevFormData => ({
          ...prevFormData,
          title: bannerData.title || "",
          description: bannerData.description || "",
          image1: (bannerData.image_link && typeof bannerData.image_link === 'string') 
            ? bannerData.image_link 
            : null,
          image2: (bannerData.image_link2 && typeof bannerData.image_link2 === 'string')
            ? bannerData.image_link2
            : (bannerData.image_url2 && typeof bannerData.image_url2 === 'string')
              ? bannerData.image_url2.startsWith('http')
                ? bannerData.image_url2
                : `http://localhost/storage/uploads/banner_images/${bannerData.image_url2}`
              : null,
          btname1: bannerData.btname1 || "",
          link: bannerData.link || "",
          title2: bannerData.title2 || "",
          description2: bannerData.description2 || "",
          btname2: bannerData.btname2 || "",
          link2: bannerData.link2 || "",
          isVideo1: bannerData.is_video1 || false,
          isVideo2: bannerData.is_video2 || false,
        }));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch banners"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {    
    fetchBanner();
  }, [fetchBanner]); // Only fetchBanner as a dependency

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!banner?.id) {
        throw new Error("Banner ID is missing. Please refresh the page and try again.");
      }

      const formDataToSend = new FormData();
  
      // Append text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('btname1', formData.btname1);
      formDataToSend.append('link', formData.link);
      formDataToSend.append('title2', formData.title2);
      formDataToSend.append('description2', formData.description2);
      formDataToSend.append('btname2', formData.btname2);
      formDataToSend.append('link2', formData.link2);
      
      // Append video type fields
      formDataToSend.append('is_video1', formData.isVideo1 ? '1' : '0');
      formDataToSend.append('is_video2', formData.isVideo2 ? '1' : '0');
  
      // Append files with correct field names
      if (formData.image1 instanceof File) {
        formDataToSend.append('image', formData.image1);
      }
      if (formData.image2 instanceof File) {
        formDataToSend.append('image2', formData.image2);
      }
  
      // Show loading toast
      toast({
        title: "Saving changes...",
        description: "Please wait while we update the banner",
        variant: "default",
        duration: 3000,
      });

      const response = await bannerApi.updateBanner(banner.id.toString(), formDataToSend);
  
      if (response) {
        toast({
          title: "Success",
          description: "Banner updated successfully",
          variant: "default",
          duration: 3000,
        });
        // Update the banner data with the new image URLs
        await fetchBanner();
      } else {
        throw new Error("No response received from the API");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update banner",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: "hero" | "banner") => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <>
      <div className="container p-6 w-[100%]">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des bannières</h1>
        <Card className="border-0 shadow-lg overflow-hidden bg-white">
          <CardHeader className="bg-[#00897B] text-white p-6">
            <CardTitle className="text-2xl">Configurer les bannières</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <motion.div
                  className={`p-4 cursor-pointer rounded-lg ${
                    activeSection === "hero" ? "bg-[#00897B] text-white" : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => toggleSection("hero")}
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Section Hero</h2>
                    {activeSection === "hero" ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </motion.div>
                <AnimatePresence initial={false}>
                  {activeSection === "hero" && (
                    <motion.div
                      key="hero-content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 },
                      }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="space-y-4 mt-4">
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
                              placeholder="Entrez le titre de la section hero"
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
                              placeholder="Entrez la description de la section hero"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="btname1" className="text-sm font-medium text-gray-700">
                              Texte du bouton
                            </Label>
                            <Input
                              id="btname1"
                              name="btname1"
                              value={formData.btname1}
                              onChange={handleChange}
                              className="mt-1"
                              placeholder="Entrez le texte du bouton"
                            />
                          </div>
                          <div>
                            <Label htmlFor="link" className="text-sm font-medium text-gray-700">
                              Lien du bouton
                            </Label>
                            <Input
                              id="link"
                              name="link"
                              value={formData.link}
                              onChange={handleChange}
                              className="mt-1"
                              placeholder="Entrez le lien du bouton"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="image1" className="text-sm font-medium text-gray-700">
                            Image de la section hero
                          </Label>
                          <Input
                            id="image1"
                            name="image1"
                            type="file"
                            onChange={(e) => handleFileChange(e, 1)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="isVideo1" className="text-sm font-medium text-gray-700">
                            Est-ce une vidéo ?
                          </Label>
                          <Input
                            id="isVideo1"
                            name="isVideo1"
                            type="checkbox"
                            checked={formData.isVideo1}
                            onChange={(e) => setFormData({ ...formData, isVideo1: e.target.checked })}
                            className="mt-1 w-4 h-4"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
  
              <div className="space-y-2">
                <motion.div
                  className={`p-4 cursor-pointer rounded-lg ${
                    activeSection === "banner" ? "bg-[#00897B] text-white" : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => toggleSection("banner")}
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Section Bannière</h2>
                    {activeSection === "banner" ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </motion.div>
                <AnimatePresence initial={false}>
                  {activeSection === "banner" && (
                    <motion.div
                      key="banner-content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 },
                      }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="space-y-4 mt-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="title2" className="text-sm font-medium text-gray-700">
                              Titre de la bannière
                            </Label>
                            <Input
                              id="title2"
                              name="title2"
                              value={formData.title2}
                              onChange={handleChange}
                              className="mt-1"
                              placeholder="Entrez le titre de la bannière"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description2" className="text-sm font-medium text-gray-700">
                              Description de la bannière
                            </Label>
                            <Textarea
                              id="description2"
                              name="description2"
                              value={formData.description2}
                              onChange={handleChange}
                              className="mt-1"
                              placeholder="Entrez la description de la bannière"
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="btname2" className="text-sm font-medium text-gray-700">
                              Texte du bouton de la bannière
                            </Label>
                            <Input
                              id="btname2"
                              name="btname2"
                              value={formData.btname2}
                              onChange={handleChange}
                              className="mt-1"
                              placeholder="Entrez le texte du bouton de la bannière"
                            />
                          </div>
                          <div>
                            <Label htmlFor="link2" className="text-sm font-medium text-gray-700">
                              Lien du bouton de la bannière
                            </Label>
                            <Input
                              id="link2"
                              name="link2"
                              value={formData.link2}
                              onChange={handleChange}
                              className="mt-1"
                              placeholder="Entrez le lien du bouton de la bannière"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="image2" className="text-sm font-medium text-gray-700">
                            Image de la bannière
                          </Label>
                          <Input
                            id="image2"
                            name="image2"
                            type="file"
                            onChange={(e) => handleFileChange(e, 2)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="isVideo2" className="text-sm font-medium text-gray-700">
                            Est-ce une vidéo ?
                          </Label>
                          <Input
                            id="isVideo2"
                            name="isVideo2"
                            type="checkbox"
                            checked={formData.isVideo2}
                            onChange={(e) => setFormData({ ...formData, isVideo2: e.target.checked })}
                            className="mt-1 w-4 h-4"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
  
        <div className="mt-12 space-y-8">
          <BannerPreview
            title={formData.title}
            description={formData.description}
            buttonText={formData.btname1}
            buttonLink={formData.link}
            imageUrl={
              typeof formData.image1 === 'string' 
                ? formData.image1 
                : formData.image1 instanceof File
                  ? URL.createObjectURL(formData.image1)
                  : (banner?.image_link && typeof banner.image_link === 'string')
                    ? banner.image_link
                    : banner?.image_url || "/placeholder.svg"
            }
            type="hero"
            isVideo={formData.isVideo1}
          />
          <BannerPreview
            title={formData.title2}
            description={formData.description2}
            buttonText={formData.btname2}
            buttonLink={formData.link2}
            imageUrl={
              typeof formData.image2 === 'string' 
                ? formData.image2 
                : formData.image2 instanceof File
                  ? URL.createObjectURL(formData.image2)
                  : (banner?.image_link2 && typeof banner.image_link2 === 'string')
                    ? banner.image_link2
                    : banner?.image_url2 || "/placeholder.svg"
            }
            type="banner"
            isVideo={formData.isVideo2}
          />
        </div>
      </div>
    </>
  );
}

export default DynamiqueBanner
