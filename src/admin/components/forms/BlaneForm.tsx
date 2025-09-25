import * as React from "react"
import { useState } from "react"
import { Calendar, Clock, MapPin, Minus, Plus, Users } from "lucide-react"
import { Card, CardContent } from "@/admin/components/ui/card"
import { Input } from "@/admin/components/ui/input"
import { Label } from "@/admin/components/ui/label"
import { Textarea } from "@/admin/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/admin/components/ui/radio-group"
import { Button } from "@/admin/components/ui/button"
import { Checkbox } from "@/admin/components/ui/checkbox"
import { Switch } from "@/admin/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/admin/components/ui/tabs"
import { Category } from "@/lib/types/category"
import { Subcategory } from "@/lib/types/subcategory"
import { City } from "@/lib/types/city"
import { BlaneFormData } from "@/lib/types/blane"
import { BlaneImage } from "@/lib/types/blaneImg"
import { motion } from "framer-motion"

interface BlaneFormProps {
  categories: Category[]
  subcategories: Subcategory[]
  citiesList: City[]
  onSubmit: (data: FormData) => Promise<void>
  initialData: BlaneFormData | null
  onCancel?: () => void
  existingImages?: BlaneImage[]
  onImageDelete?: (imageId: number) => Promise<void>
}

export function BlaneForm({ 
  categories, 
  subcategories, 
  citiesList, 
  onSubmit, 
  initialData, 
  onCancel,
  existingImages,
  onImageDelete 
}: BlaneFormProps) {
  const [activeTab, setActiveTab] = useState<"reservation" | "order">("reservation")
  const [formData, setFormData] = useState<BlaneFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    city: initialData?.city?.toString() || "",
    categories_id: initialData?.categories_id || 0,
    subcategories_id: initialData?.subcategories_id || null,
    price_current: initialData?.price_current || 0,
    price_old: initialData?.price_old || 0,
    advantages: initialData?.advantages || "",
    conditions: initialData?.conditions || "",
    commerce_name: initialData?.commerce_name || "",
    type: initialData?.type || "order",
    status: initialData?.status || "active",
    online: initialData?.online || false,
    partiel: initialData?.partiel || false,
    cash: initialData?.cash || false,
    on_top: initialData?.on_top || false,
    stock: initialData?.stock || 0,
    start_date: initialData?.start_date || "",
    expiration_date: initialData?.expiration_date || null,
    reservation_type: initialData?.reservation_type || "instante",
    type_time: initialData?.type_time || "time",
    heure_debut: initialData?.type_time === "date" ? null : initialData?.heure_debut || "",
    heure_fin: initialData?.type_time === "date" ? null : initialData?.heure_fin || "",
    intervale_reservation: initialData?.type_time === "date" ? null : initialData?.intervale_reservation || 60,
    // ... other fields from your existing formData
  })

  const [images, setImages] = useState<File[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)])
    }
  }

  const handleImageDelete = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleTypeTimeChange = (value: "date" | "time") => {
    setFormData(prev => ({
      ...prev,
      type_time: value,
      heure_debut: value === "date" ? null : prev.heure_debut,
      heure_fin: value === "date" ? null : prev.heure_fin,
      intervale_reservation: value === "date" ? null : (prev.intervale_reservation || 0)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submitFormData = new FormData()
    
    // Add your existing form submission logic here
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        submitFormData.set(key, value.toString())
      }
    })

    // Add images to FormData
    images.forEach((image, index) => {
      submitFormData.append(`images[${index}]`, image)
    })

    await onSubmit(submitFormData)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {initialData ? "Modifier le BLANE" : "Création d'un nouveau BLANE"}
        </h1>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "reservation" | "order")} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reservation" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              Réservation
            </TabsTrigger>
            <TabsTrigger value="order" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              Order
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid lg:grid-cols-[1fr,400px] gap-6">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date début</Label>
                  <div className="relative">
                    <Input 
                      type="date" 
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full" 
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date fin</Label>
                  <div className="relative">
                    <Input 
                      type="date"
                      value={formData.expiration_date || ""}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                      className="w-full" 
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Basic Info Section */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Information Générale</h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nom du commerce</Label>
                    <Input 
                      type="text" 
                      value={formData.commerce_name || ''} 
                      onChange={(e) => setFormData({ ...formData, commerce_name: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full min-h-32"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <Label>Moyen de paiement</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="online"
                      checked={formData.online}
                      onCheckedChange={(checked) => setFormData({ ...formData, online: checked })}
                    />
                    <Label htmlFor="online">En ligne</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="partial"
                      checked={formData.partiel}
                      onCheckedChange={(checked) => setFormData({ ...formData, partiel: checked })}
                    />
                    <Label htmlFor="partial">Partiel</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="cash"
                      checked={formData.cash}
                      onCheckedChange={(checked) => setFormData({ ...formData, cash: checked })}
                    />
                    <Label htmlFor="cash">Sur place 👑</Label>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <Label>Images</Label>
                <div className="flex flex-wrap gap-4">
                  {existingImages?.map((image) => (
                    <div key={image.id} className="relative group">
                      <img 
                        src={image.imageLink} 
                        alt="Blane Image" 
                        className="w-32 h-32 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = image.imageUrl;
                        }}
                      />
                      <Button 
                        type="button" 
                        onClick={() => onImageDelete?.(image.id)}
                        className="absolute top-1 right-1 p-1 h-6 w-6 bg-red-500 hover:bg-red-600"
                        variant="destructive"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(image)} 
                        alt="New Blane Image" 
                        className="w-32 h-32 object-cover rounded-lg shadow-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={() => handleImageDelete(index)}
                        className="absolute top-1 right-1 p-1 h-6 w-6 bg-red-500 hover:bg-red-600"
                        variant="destructive"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <Input type="file" multiple onChange={handleImageChange} />
              </div>

              <div className="space-y-4">
                <Label>Type de temps</Label>
                <RadioGroup
                  value={formData.type_time}
                  onValueChange={handleTypeTimeChange}
                >
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="time" id="time-type" />
                      <Label htmlFor="time-type">Plage horaire</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="date" id="date-type" />
                      <Label htmlFor="date-type">Plage journalière</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {formData.type_time === "time" && (
                <>
                  <div className="space-y-4">
                    <Label>Créneaux horaires</Label>
                    <div className="flex flex-wrap gap-4">
                      {[
                        "Lundi",
                        "Mardi",
                        "Mercredi",
                        "Jeudi",
                        "Vendredi",
                        "Samedi",
                        "Dimanche",
                      ].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={formData.jours_creneaux.includes(day)}
                            onCheckedChange={() => handleCheckboxChange(day)}
                          />
                          <Label htmlFor={day}>{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Heure début</Label>
                      <Input
                        type="time"
                        value={formData.heure_debut || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            heure_debut: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Heure fin</Label>
                      <Input
                        type="time"
                        value={formData.heure_fin || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            heure_fin: e.target.value,
                          })
                        }
                        className="w-full"
                        min={formData.heure_debut}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {formData.type_time === "date" && (
                        <div className="space-y-2">
                          <Label>Intervalle de réservation (minutes)</Label>
                          <Input
                            type="text"
                            value={formData.intervale_reservation === 0 ? 0 : formData.intervale_reservation?.toString() || ""}
                            onChange={(e) => {
                              if (isNumeric(e.target.value)) {
                                setFormData({
                                  ...formData,
                                  intervale_reservation: e.target.value === "" ? 0 : Number(e.target.value),
                                });
                              }
                            }}
                            className="w-full"
                            placeholder="Intervalle de réservation"
                          />
                        </div>
                      )}
                      
                      <div className={`space-y-2 ${formData.type_time === "date" ? "" : "sm:col-span-2"}`}>
                        <Label>Personnes par prestation</Label>
                        <Input
                          type="text"
                          value={formData.personnes_prestation === 0 ? "" : formData.personnes_prestation.toString()}
                          onChange={(e) => {
                            if (isNumeric(e.target.value)) {
                              setFormData({
                                ...formData,
                                personnes_prestation: e.target.value === "" ? 0 : Number(e.target.value),
                              });
                            }
                          }}
                          className="w-full"
                          placeholder="Personnes par prestation"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={onCancel}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="h-fit sticky top-6">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold">{formData.name || "Nouveau Blane"}</h2>
            <p className="text-gray-500 text-sm mb-4">
              {formData.description || "Description du blane..."}
            </p>
            
            {/* Add image previews */}
            <div className="flex flex-wrap gap-2 mb-6">
              {existingImages?.map((image) => (
                <img
                  key={image.id}
                  src={image.imageLink}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = image.imageUrl;
                  }}
                />
              ))}
              {images.map((image, index) => (
                <img
                  key={`new-${index}`}
                  src={URL.createObjectURL(image)}
                  alt="New preview"
                  className="w-16 h-16 object-cover rounded-md"
                />
              ))}
            </div>

            <div className="text-2xl font-bold text-teal-600 mb-6">
              {formData.price_current} DH
              {formData.price_old > 0 && (
                <span className="text-gray-400 line-through ml-2">
                  {formData.price_old} DH
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Du {formData.start_date} 
                  au {formData.expiration_date || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>Stock: {formData.stock}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 