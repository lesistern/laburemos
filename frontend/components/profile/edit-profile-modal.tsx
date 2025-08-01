'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MotionCard } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Camera,
  Upload
} from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  city: string
  stateProvince: string
  postalCode: string
  address: string
  dniCuit: string
  bio: string
  profileImage: string
  hourlyRate: string
  currency: string
  language: string
  timezone: string
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuthStore()
  const [loading, setLoading] = React.useState(false)
  const [imageUploading, setImageUploading] = React.useState(false)
  const [formData, setFormData] = React.useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'Argentina',
    city: user?.city || '',
    stateProvince: user?.stateProvince || '',
    postalCode: user?.postalCode || '',
    address: user?.address || '',
    dniCuit: user?.dniCuit || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
    hourlyRate: user?.hourlyRate?.toString() || '',
    currency: user?.currency || 'ARS',
    language: user?.language || 'es',
    timezone: user?.timezone || 'America/Argentina/Buenos_Aires'
  })

  const [errors, setErrors] = React.useState<Partial<ProfileFormData>>({})

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }
    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'El formato del teléfono no es válido'
    }
    if (formData.hourlyRate && (isNaN(Number(formData.hourlyRate)) || Number(formData.hourlyRate) < 0)) {
      newErrors.hourlyRate = 'La tarifa por hora debe ser un número válido'
    }
    if (formData.bio && formData.bio.length > 1000) {
      newErrors.bio = 'La biografía no puede exceder 1000 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Convert hourlyRate to number if provided
      const updateData = {
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined
      }

      await updateProfile(updateData)
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      // Handle error (could show toast notification)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageUploading(true)
    try {
      // Here you would implement actual image upload to your storage service
      // For now, we'll create a temporary URL
      const imageUrl = URL.createObjectURL(file)
      setFormData(prev => ({ ...prev, profileImage: imageUrl }))
      
      // In a real app, you'd upload to S3/CloudFront and get the actual URL
      // const uploadedUrl = await uploadToS3(file)
      // setFormData(prev => ({ ...prev, profileImage: uploadedUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setImageUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-laburar-sky-blue-50 to-laburar-sky-blue-100">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-laburar-sky-blue-600" />
            <h2 className="text-2xl font-bold text-black">Editar Perfil</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
          <div className="space-y-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-laburar-sky-blue-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-laburar-sky-blue-500 to-laburar-sky-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                  </div>
                )}
                <label
                  htmlFor="profile-image"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-laburar-sky-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-laburar-sky-blue-700 transition-colors"
                >
                  {imageUploading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageUploading}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Haz clic en el ícono de cámara para cambiar tu foto de perfil
              </p>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-laburar-sky-blue-600" />
                Información Personal
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Tu nombre"
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Tu apellido"
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dniCuit">DNI/CUIT</Label>
                  <Input
                    id="dniCuit"
                    value={formData.dniCuit}
                    onChange={(e) => handleInputChange('dniCuit', e.target.value)}
                    placeholder="12345678 o 20-12345678-9"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-laburar-sky-blue-600" />
                Ubicación
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">País</Label>
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500"
                  >
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Mexico">México</option>
                    <option value="Peru">Perú</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Venezuela">Venezuela</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="stateProvince">Provincia/Estado</Label>
                  <Input
                    id="stateProvince"
                    value={formData.stateProvince}
                    onChange={(e) => handleInputChange('stateProvince', e.target.value)}
                    placeholder="Buenos Aires"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ciudad Autónoma de Buenos Aires"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Av. Corrientes 1234"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-laburar-sky-blue-600" />
                Información Profesional
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Tarifa por Hora (ARS)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    placeholder="2500.00"
                    className={errors.hourlyRate ? 'border-red-500' : ''}
                  />
                  {errors.hourlyRate && (
                    <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500"
                  >
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar Estadounidense</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500"
                  >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                    <option value="America/Santiago">Santiago (GMT-3)</option>
                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                    <option value="America/Mexico_City">México (GMT-6)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div>
              <Label htmlFor="bio">Biografía</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Cuéntanos sobre ti, tu experiencia y qué te hace único..."
                rows={4}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500 resize-none ${errors.bio ? 'border-red-500' : ''}`}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && (
                  <p className="text-red-500 text-sm">{errors.bio}</p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.bio.length}/1000 caracteres
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}