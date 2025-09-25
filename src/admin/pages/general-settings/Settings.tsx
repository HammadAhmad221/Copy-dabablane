import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Card } from "@/admin/components/ui/card";
import { Label } from "@/admin/components/ui/label";
import { toast } from 'react-hot-toast';
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { userApi } from "@/admin/lib/api/services/userService";
import { useAuth } from '@/contexts/AuthContext';

// Validation schema
const profileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .optional()
    .refine(val => !val || val.length >= 8, {
      message: 'Password must be at least 8 characters'
    })
    .refine(val => !val || /[A-Z]/.test(val), {
      message: 'Password must contain at least one uppercase letter'
    })
    .refine(val => !val || /[a-z]/.test(val), {
      message: 'Password must contain at least one lowercase letter'
    })
    .refine(val => !val || /[0-9]/.test(val), {
      message: 'Password must contain at least one number'
    })
    .refine(val => !val || /[^A-Za-z0-9]/.test(val), {
      message: 'Password must contain at least one special character'
    }),
  password_confirmation: z.string().optional(),
}).refine((data) => {
  if (data.password) {
    return data.password === data.password_confirmation;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: Array<{
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    pivot?: {
      model_type: string;
      model_id: number;
      role_id: number;
    };
  }>;
}

const Settings = () => {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Get admin data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setAdmin(parsedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          password: '',
          password_confirmation: '',
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        toast.error('Error loading user data');
      }
    }
  }, []);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      profileSchema.parse(formData);
      setErrors({});

      if (!admin?.id) {
        throw new Error('User ID not found');
      }

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password_confirmation;
      }

      // Call the API to update the user
      const response = await userApi.updateUser(admin.id.toString(), updateData);

      if (response) {
        // Update localStorage with new user data
        const updatedUserData = {
          ...admin,
          name: formData.name,
          email: formData.email,
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setAdmin(updatedUserData);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setErrors(errorMap);
        toast.error('Please fix the form errors');
      } else {
        // Improved API error handling
        let errorMessage = 'Failed to update profile';
        
        if (error.response?.data) {
          const responseData = error.response.data;
          
          // Handle Laravel validation errors
          if (responseData.errors) {
            const newErrors: Record<string, string> = {};
            Object.entries(responseData.errors).forEach(([key, value]) => {
              newErrors[key] = Array.isArray(value) ? value[0] : value as string;
            });
            setErrors(newErrors);
            errorMessage = 'Please fix the form errors';
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
    
    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData(prev => ({ 
      ...prev, 
      password: newPassword,
      password_confirmation: newPassword
    }));
    setShowPassword(true);
    toast.success('Password generated!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        {/* Section En-tête */}
        <div className="p-4 md:p-6 bg-gradient-to-r from-[#00897B] to-[#00796B]">
          <div className="text-white">
            <h2 className="text-2xl font-bold">Paramètres du profil</h2>
            <p className="text-gray-100 mt-1">Gérez les paramètres de votre compte</p>
          </div>
        </div>
  
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Informations sur le rôle */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Rôle</h3>
              <div className="flex gap-2">
                {admin?.role && (
                  <span className="px-3 py-1 bg-[#00897B] text-white rounded-full text-sm">
                    {admin.role}
                  </span>
                )}
              </div>
            </div>
  
            {/* Informations personnelles */}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  disabled={!isEditing}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={!isEditing}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {isEditing && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nouveau mot de passe (optionnel)</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="w-full space-y-2">
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleInputChange('password')}
                            className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>

                        {formData.password && (
                          <div className="text-sm space-y-1 text-gray-600">
                            <p className={/[A-Z]/.test(formData.password) ? "text-green-600" : "text-gray-600"}>
                              • Au moins une lettre majuscule
                            </p>
                            <p className={/[a-z]/.test(formData.password) ? "text-green-600" : "text-gray-600"}>
                              • Au moins une lettre minuscule
                            </p>
                            <p className={/[0-9]/.test(formData.password) ? "text-green-600" : "text-gray-600"}>
                              • Au moins un chiffre
                            </p>
                            <p className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-600" : "text-gray-600"}>
                              • Au moins un caractère spécial
                            </p>
                            <p className={formData.password.length >= 8 ? "text-green-600" : "text-gray-600"}>
                              • Minimum 8 caractères
                            </p>
                          </div>
                        )}

                        <div className="relative">
                          <Input
                            id="password_confirmation"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password_confirmation}
                            onChange={handleInputChange('password_confirmation')}
                            className={errors.password_confirmation ? "border-red-500 pr-10" : "pr-10"}
                            placeholder="Confirmer le mot de passe"
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGeneratePassword}
                        className="w-full sm:w-auto"
                      >
                        Générer un mot de passe
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                    {errors.password_confirmation && (
                      <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#00897B] hover:bg-[#00796B]"
                >
                  Modifier le profil
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setErrors({});
                      // Réinitialiser les données du formulaire avec les données actuelles de l'admin
                      if (admin) {
                        setFormData({
                          name: admin.name,
                          email: admin.email,
                          password: '',
                          password_confirmation: '',
                        });
                      }
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-[#00897B] hover:bg-[#00796B]"
                  >
                    Enregistrer les modifications
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default Settings;