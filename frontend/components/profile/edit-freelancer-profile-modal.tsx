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
  Briefcase, 
  Award,
  Clock,
  BookOpen 
} from 'lucide-react'

interface EditFreelancerProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FreelancerFormData {
  title: string
  professionalOverview: string
  skills: string[]
  experienceYears: number
  education: {
    degree: string
    institution: string
    year: number
  }[]
  certifications: string[]
  portfolioItems: {
    title: string
    description: string
    url: string
    image: string
  }[]
  availability: 'FULL_TIME' | 'PART_TIME' | 'HOURLY' | 'NOT_AVAILABLE'
  responseTime: string
}

export function EditFreelancerProfileModal({ isOpen, onClose }: EditFreelancerProfileModalProps) {
  const { user, updateFreelancerProfile } = useAuthStore()
  const [loading, setLoading] = React.useState(false)
  const [skillInput, setSkillInput] = React.useState('')
  const [certificationInput, setCertificationInput] = React.useState('')
  const [formData, setFormData] = React.useState<FreelancerFormData>({
    title: user?.freelancerProfile?.title || '',
    professionalOverview: user?.freelancerProfile?.professionalOverview || '',
    skills: user?.freelancerProfile?.skills || [],
    experienceYears: user?.freelancerProfile?.experienceYears || 0,
    education: user?.freelancerProfile?.education || [],
    certifications: user?.freelancerProfile?.certifications || [],
    portfolioItems: user?.freelancerProfile?.portfolioItems || [],
    availability: user?.freelancerProfile?.availability || 'FULL_TIME',
    responseTime: user?.freelancerProfile?.responseTime || 'Dentro de 24 horas'
  })

  const [errors, setErrors] = React.useState<Partial<Record<keyof FreelancerFormData, string>>>({})

  const handleInputChange = (field: keyof FreelancerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const addCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()]
      }))
      setCertificationInput('')
    }
  }

  const removeCertification = (certToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certToRemove)
    }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: new Date().getFullYear() }]
    }))
  }

  const updateEducation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FreelancerFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'El título profesional es requerido'
    }
    if (!formData.professionalOverview.trim()) {
      newErrors.professionalOverview = 'La descripción profesional es requerida'
    } else if (formData.professionalOverview.length > 2000) {
      newErrors.professionalOverview = 'La descripción no puede exceder 2000 caracteres'
    }
    if (formData.experienceYears < 0 || formData.experienceYears > 50) {
      newErrors.experienceYears = 'Los años de experiencia deben estar entre 0 y 50'
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
      await updateFreelancerProfile(formData)
      onClose()
    } catch (error) {
      console.error('Error updating freelancer profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || user?.role !== 'freelancer') return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-laburar-sky-blue-50 to-laburar-sky-blue-100">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-laburar-sky-blue-600" />
            <h2 className="text-2xl font-bold text-black">Perfil Profesional</h2>
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
            {/* Professional Title & Overview */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-laburar-sky-blue-600" />
                Información Profesional
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título Profesional *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="ej. Desarrollador Full-Stack, Diseñador UX/UI"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="professionalOverview">Descripción Profesional *</Label>
                  <textarea
                    id="professionalOverview"
                    value={formData.professionalOverview}
                    onChange={(e) => handleInputChange('professionalOverview', e.target.value)}
                    placeholder="Describe tu experiencia, especialidades y qué te hace único como profesional..."
                    rows={5}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500 resize-none ${errors.professionalOverview ? 'border-red-500' : ''}`}
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.professionalOverview && (
                      <p className="text-red-500 text-sm">{errors.professionalOverview}</p>
                    )}
                    <p className="text-sm text-gray-500 ml-auto">
                      {formData.professionalOverview.length}/2000 caracteres
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experienceYears">Años de Experiencia</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experienceYears}
                      onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                      className={errors.experienceYears ? 'border-red-500' : ''}
                    />
                    {errors.experienceYears && (
                      <p className="text-red-500 text-sm mt-1">{errors.experienceYears}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="availability">Disponibilidad</Label>
                    <select
                      id="availability"
                      value={formData.availability}
                      onChange={(e) => handleInputChange('availability', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500"
                    >
                      <option value="FULL_TIME">Tiempo Completo</option>
                      <option value="PART_TIME">Medio Tiempo</option>
                      <option value="HOURLY">Por Horas</option>
                      <option value="NOT_AVAILABLE">No Disponible</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="responseTime">Tiempo de Respuesta</Label>
                  <select
                    id="responseTime"
                    value={formData.responseTime}
                    onChange={(e) => handleInputChange('responseTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-laburar-sky-blue-500"
                  >
                    <option value="Dentro de 1 hora">Dentro de 1 hora</option>
                    <option value="Dentro de 2 horas">Dentro de 2 horas</option>
                    <option value="Dentro de 6 horas">Dentro de 6 horas</option>
                    <option value="Dentro de 12 horas">Dentro de 12 horas</option>
                    <option value="Dentro de 24 horas">Dentro de 24 horas</option>
                    <option value="Dentro de 48 horas">Dentro de 48 horas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-laburar-sky-blue-600" />
                Habilidades
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Agregar habilidad (ej. React, Node.js, Python)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Agregar
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-laburar-sky-blue-100 text-laburar-sky-blue-700 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-laburar-sky-blue-500 hover:text-laburar-sky-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-laburar-sky-blue-600" />
                Educación
              </h3>
              <div className="space-y-4">
                {formData.education.map((edu, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Título/Grado</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          placeholder="ej. Ingeniería en Sistemas"
                        />
                      </div>
                      <div>
                        <Label>Institución</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          placeholder="ej. Universidad de Buenos Aires"
                        />
                      </div>
                      <div>
                        <Label>Año</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={1950}
                            max={new Date().getFullYear()}
                            value={edu.year}
                            onChange={(e) => updateEducation(index, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeEducation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addEducation}>
                  Agregar Educación
                </Button>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-laburar-sky-blue-600" />
                Certificaciones
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={certificationInput}
                    onChange={(e) => setCertificationInput(e.target.value)}
                    placeholder="Agregar certificación (ej. AWS Certified Developer)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                  />
                  <Button type="button" onClick={addCertification} variant="outline">
                    Agregar
                  </Button>
                </div>
                {formData.certifications.length > 0 && (
                  <div className="space-y-2">
                    {formData.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-black">{cert}</span>
                        <button
                          type="button"
                          onClick={() => removeCertification(cert)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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