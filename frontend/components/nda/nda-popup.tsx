'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Modal, 
  ModalPortal,
  ModalOverlay,
  ModalHeader, 
  ModalFooter, 
  ModalTitle, 
  ModalDescription 
} from '@/components/ui/modal'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { AlertTriangle, FileText, Shield, Eye, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getOrGenerateFingerprint } from '@/lib/device-fingerprint'

interface NdaPopupProps {
  isOpen: boolean
  onAccept: (email: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const NDA_SHORT_TEXT = `⚠️ Acceso anticipado - Versión Alpha

Este sitio web se encuentra en fase de prueba Alpha. La experiencia, el diseño visual, las funcionalidades y el orden de los elementos están sujetos a cambios sin previo aviso.

Antes de continuar, necesitás aceptar nuestro Acuerdo de Confidencialidad (NDA), ya que el contenido y funcionalidades de esta plataforma son confidenciales y están protegidos.

Al hacer clic en "Aceptar y continuar", confirmás que entendés y aceptás:

• Que estás accediendo a una versión no final del producto
• Que no compartirás capturas, información ni detalles del sitio con terceros  
• Que toda la información e ideas vistas aquí están sujetas a propiedad intelectual del titular del sitio`

const NDA_FULL_TEXT = `ACUERDO DE CONFIDENCIALIDAD (NDA)

Entre:
Por una parte, LABUREMOS (Plataforma de Servicios Profesionales), con domicilio en Argentina, en adelante denominado "EL TITULAR".

Y por la otra parte, el usuario visitante del sitio web que accede a la versión Alpha del sitio ubicado en laburemos.com.ar, en adelante denominado "EL USUARIO".

Ambas partes acuerdan celebrar el presente Acuerdo de Confidencialidad, conforme a las siguientes cláusulas:

PRIMERA – OBJETO
El presente acuerdo tiene por objeto establecer las condiciones bajo las cuales EL USUARIO se obliga a mantener la confidencialidad respecto de toda la información que tenga acceso directa o indirectamente durante su visita y uso del sitio web en etapa Alpha desarrollado por EL TITULAR.

SEGUNDA – INFORMACIÓN CONFIDENCIAL
A los fines del presente acuerdo, se considerará Información Confidencial toda aquella información a la que EL USUARIO tenga acceso, incluyendo pero no limitada a:
• Diseño gráfico, estructura visual y/o interfaz del sitio
• Lógica de funcionamiento, código fuente o comportamiento del sistema
• Prototipos, funcionalidades en desarrollo y estructura de navegación
• Contenidos, nombres comerciales, marcas, procesos y métodos
• Datos técnicos, estratégicos, de negocio o de usuarios

TERCERA – OBLIGACIONES DEL USUARIO
EL USUARIO se compromete a:
• No revelar, divulgar ni compartir la Información Confidencial con terceros por ningún medio
• No copiar, reproducir ni almacenar dicha información, ya sea mediante capturas de pantalla, grabaciones, impresiones o cualquier otro método
• No utilizar dicha información en beneficio propio ni de terceros, directa o indirectamente
• No desarrollar ni colaborar en el desarrollo de productos, servicios o plataformas similares basadas en dicha información

CUARTA – PROPIEDAD INTELECTUAL
Toda la Información Confidencial es y seguirá siendo propiedad exclusiva de EL TITULAR. Ninguna disposición del presente acuerdo será interpretada como una cesión o licencia de derechos sobre dicha información.

QUINTA – DURACIÓN
La obligación de confidencialidad se mantendrá vigente por un período de cinco (5) años contados desde el momento en que EL USUARIO acceda al sitio web en fase Alpha, o hasta que la Información Confidencial se haga pública por medios legales, lo que ocurra primero.

SEXTA – INCUMPLIMIENTO
El incumplamiento por parte de EL USUARIO de cualquiera de las cláusulas del presente acuerdo dará derecho a EL TITULAR a:
• Reclamar indemnización por daños y perjuicios
• Iniciar acciones legales civiles y/o penales correspondientes
• Solicitar medidas cautelares para la protección inmediata de su información

SÉPTIMA – JURISDICCIÓN Y LEY APLICABLE
El presente acuerdo se regirá por las leyes de la República Argentina. Las partes se someten a la jurisdicción de los tribunales ordinarios de Argentina, renunciando a cualquier otro fuero que pudiera corresponder.

OCTAVA – ACEPTACIÓN DIGITAL
EL USUARIO declara haber leído y comprendido el presente Acuerdo, y acepta expresamente sus términos mediante la acción afirmativa de hacer clic en el botón "Aceptar y continuar", considerándose dicha acción como manifestación válida de consentimiento, con los mismos efectos legales que una firma ológrafa.

Fecha de última actualización: ${new Date().toLocaleDateString('es-AR')}`

// Crear un ModalContent personalizado sin botón de cerrar - OPTIMIZADO MÓVIL
const CustomModalContent = ({ className, children, ...props }: any) => (
  <ModalPortal>
    <ModalOverlay className="bg-black/60 backdrop-blur-sm" />
    <DialogPrimitive.Content
      className={cn(
        // Base modal positioning - mejorado para móvil
        'fixed z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background shadow-lg duration-200',
        // Animaciones de entrada/salida
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        
        // MÓVIL (320px - 767px): Pantalla completa con márgenes mínimos
        'left-[50%] top-[50%]',
        'w-[100vw] h-[100vh] max-h-[100vh]', // Pantalla completa en móvil
        'rounded-none p-0', // Sin padding ni border radius en móvil
        'overflow-hidden',
        
        // TABLET (768px - 1023px): Modal centrado con márgenes
        'sm:w-[95vw] sm:h-[95vh] sm:max-h-[95vh] sm:max-w-[640px]',
        'sm:rounded-lg sm:p-0',
        
        // DESKTOP (1024px+): Modal estándar con tamaño optimizado
        'lg:w-[90vw] lg:h-[90vh] lg:max-h-[90vh] lg:max-w-[1000px]',
        'lg:rounded-xl',
        
        // DESKTOP GRANDE (1280px+): Tamaño máximo controlado
        'xl:max-w-[1200px] xl:max-h-[85vh]',
        
        className
      )}
      {...props}
      // Prevenir cierre con Escape
      onEscapeKeyDown={(e) => e.preventDefault()}
      // Prevenir cierre con click fuera
      onPointerDownOutside={(e) => e.preventDefault()}
      // Prevenir cierre con foco fuera
      onInteractOutside={(e) => e.preventDefault()}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </DialogPrimitive.Content>
  </ModalPortal>
)

export function NdaPopup({ isOpen, onAccept, onCancel, isLoading = false }: NdaPopupProps) {
  const [email, setEmail] = useState('')
  const [showFullNda, setShowFullNda] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Generar device fingerprint cuando se abre el modal
      const fingerprint = getOrGenerateFingerprint()
      setDeviceFingerprint(fingerprint)
    }
  }, [isOpen])

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value)
    if (emailError && validateEmail(value)) {
      setEmailError('')
    }
  }, [emailError, validateEmail])

  const handleTermsChange = useCallback((checked: boolean) => {
    setTermsAccepted(checked)
  }, [])

  const isFormValid = useMemo(() => {
    return email.trim() && validateEmail(email) && termsAccepted
  }, [email, validateEmail, termsAccepted])

  const handleAccept = useCallback(async () => {
    if (!email.trim()) {
      setEmailError('El email es obligatorio')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Por favor ingresa un email válido')
      return
    }

    if (!termsAccepted) {
      setEmailError('Debe aceptar los términos del Acuerdo de Confidencialidad')
      return
    }

    try {
      await onAccept(email)
    } catch (error) {
      console.error('Error al aceptar NDA:', error)
      setEmailError('Error al procesar la aceptación. Intenta nuevamente.')
    }
  }, [email, validateEmail, termsAccepted, onAccept])

  const currentDate = useMemo(() => 
    new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), []
  )

  return (
    <Modal open={isOpen} onOpenChange={() => {}}>
      <CustomModalContent>
        {/* HEADER OPTIMIZADO MÓVIL */}
        <ModalHeader className="flex-shrink-0 border-b border-gray-200 p-4 sm:p-6">
          <ModalTitle className="flex items-center gap-2 sm:gap-3">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-orange-500 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-base sm:text-lg lg:text-xl font-semibold leading-tight">
                Acuerdo de Confidencialidad
              </span>
              <span className="text-sm sm:text-base lg:text-lg text-orange-600 font-medium">
                Versión Alpha
              </span>
            </div>
          </ModalTitle>
          <ModalDescription className="flex items-center gap-2 mt-2 sm:mt-3">
            <AlertTriangle className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-yellow-500 flex-shrink-0" />
            <span className="text-sm sm:text-base lg:text-lg text-gray-600">
              Acceso anticipado - {currentDate}
            </span>
          </ModalDescription>
        </ModalHeader>

        {/* CONTENIDO PRINCIPAL - LAYOUT DE 2 COLUMNAS */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Layout de 2 columnas: Mobile (1 col) | Desktop (2 cols) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* COLUMNA IZQUIERDA - CONTENIDO DE TEXTO (60-65%) */}
            <div className="flex-1 md:flex-[0.65] overflow-hidden border-r-0 md:border-r border-gray-200">
              <AnimatePresence mode="wait">
                {!showFullNda ? (
                  <motion.div
                    key="short-nda"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto"
                  >
                    {/* ALERTA NDA - Responsive */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 lg:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-3 sm:space-y-4 text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                          {NDA_SHORT_TEXT.split('\\n\\n').map((paragraph, index) => (
                            <p key={index} className="whitespace-pre-line">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* BOTÓN VER NDA COMPLETO - Centrado */}
                    <div className="flex justify-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFullNda(true)}
                        className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 text-sm sm:text-base lg:text-lg min-h-[44px] transition-all duration-200 hover:shadow-md active:scale-95"
                      >
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                        Ver NDA completo
                      </Button>
                    </div>

                    {/* AVISO CONFIDENCIALIDAD - Mejorado */}
                    <div className="p-3 sm:p-4 lg:p-5 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm sm:text-base lg:text-lg text-blue-800 text-center leading-relaxed">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 inline mr-2 flex-shrink-0" />
                        Para acceder a la plataforma, debe aceptar el acuerdo de confidencialidad
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="full-nda"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6"
                  >
                    {/* NAVEGACIÓN NDA COMPLETO */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-3 border-b border-gray-200 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowFullNda(false)}
                        className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base min-h-[44px] w-fit transition-all duration-200 hover:bg-gray-100 active:scale-95"
                      >
                        ← Volver al resumen
                      </Button>
                      <div className="flex items-center gap-2 text-sm sm:text-base lg:text-lg text-gray-600">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                        <span className="font-medium">NDA Completo</span>
                      </div>
                    </div>

                    {/* ÁREA DE SCROLL NDA - Mejorada */}
                    <ScrollArea.Root className="flex-1 w-full border rounded-lg bg-gray-50 min-h-0">
                      <ScrollArea.Viewport className="p-3 sm:p-4 lg:p-6 h-full w-full">
                        <div className="space-y-4 sm:space-y-5 lg:space-y-6 text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                          {NDA_FULL_TEXT.split('\\n\\n').map((paragraph, index) => (
                            <p key={index} className="whitespace-pre-line break-words">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </ScrollArea.Viewport>
                      {/* Scrollbar mejorada */}
                      <ScrollArea.Scrollbar 
                        className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-[160ms] ease-out hover:bg-gray-200 data-[orientation=vertical]:w-3 sm:data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-3 sm:data-[orientation=horizontal]:h-2.5" 
                        orientation="vertical"
                      >
                        <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                      </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* COLUMNA DERECHA - FORMULARIO Y ACCIONES (35-40%) */}
            <div className="w-full md:flex-[0.35] bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-200">
              <div className="h-full flex flex-col">
                {/* Formulario Sticky */}
                <div className="flex-1 md:sticky md:top-0 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
                  
                  {/* TÍTULO FORMULARIO */}
                  <div className="text-center md:text-left border-b border-gray-200 pb-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      Aceptación del NDA
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      Complete los campos para continuar
                    </p>
                  </div>

                  {/* FORMULARIO EMAIL */}
                  <div className="space-y-3 sm:space-y-4">
                    <Label htmlFor="email" className="text-sm sm:text-base lg:text-lg font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={cn(
                        'text-sm sm:text-base lg:text-lg min-h-[44px] sm:min-h-[48px] lg:min-h-[52px]',
                        'transition-all duration-200 rounded-lg sm:rounded-xl',
                        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                      )}
                      disabled={isLoading}
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>

                  {/* CHECKBOX DE ACEPTACIÓN */}
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg">
                    <Checkbox
                      id="terms-acceptance"
                      checked={termsAccepted}
                      onCheckedChange={handleTermsChange}
                      disabled={isLoading}
                      className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="terms-acceptance" 
                        className="text-sm sm:text-base text-gray-700 leading-relaxed cursor-pointer select-none"
                      >
                        <Check className="h-4 w-4 inline mr-1 text-green-600" />
                        Leí y estoy de acuerdo con los términos del Acuerdo de Confidencialidad
                      </Label>
                    </div>
                  </div>

                  {/* BOTÓN PRINCIPAL */}
                  <Button
                    type="button"
                    onClick={handleAccept}
                    disabled={isLoading || !isFormValid}
                    className={cn(
                      'w-full font-semibold text-white transition-all duration-200',
                      'min-h-[44px] sm:min-h-[48px] lg:min-h-[52px]',
                      'text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8',
                      'bg-green-600 hover:bg-green-700 focus:bg-green-700 active:bg-green-800',
                      'disabled:bg-gray-400 disabled:cursor-not-allowed disabled:active:scale-100',
                      'rounded-lg sm:rounded-xl',
                      'shadow-md hover:shadow-lg focus:shadow-lg active:shadow-xl',
                      'active:scale-95 transform'
                    )}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                        <span className="hidden sm:inline">Acepto el NDA y deseo continuar</span>
                        <span className="sm:hidden">Aceptar y continuar</span>
                      </div>
                    )}
                  </Button>

                  {/* DEVICE FINGERPRINT - Mejorado */}
                  {deviceFingerprint && (
                    <div className="text-xs sm:text-sm text-gray-500 bg-white border border-gray-200 p-3 sm:p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Dispositivo identificado</span>
                      </div>
                      <span className="font-mono break-all text-xs">
                        ID: {deviceFingerprint.substring(0, 20)}...
                      </span>
                    </div>
                  )}

                  {/* MENSAJES DE ERROR/VALIDACIÓN */}
                  {emailError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm sm:text-base text-red-600 text-center leading-relaxed">
                        {emailError}
                      </p>
                    </div>
                  )}

                  {!isFormValid && !emailError && (
                    <p className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed">
                      {!email.trim() || !validateEmail(email) ? 
                        'Complete un email válido' : 
                        !termsAccepted ? 
                        'Debe aceptar los términos para continuar' : 
                        'Complete los campos requeridos'
                      }
                    </p>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </CustomModalContent>
    </Modal>
  )
}