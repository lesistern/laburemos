<?php
/**
 * VideollamadasArgentinas - Sistema nativo de videollamadas
 * 
 * Diferenciador clave de LaburAR:
 * - Videollamadas integradas en plataforma
 * - Scheduling con zona horaria argentina
 * - Grabación automática de reuniones
 * - Integración con proyectos y Mi Red
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

require_once __DIR__ . '/../models/MiRed.php';

class VideollamadasArgentinas {
    
    private $user;
    private $timezone;
    private $googleMeetConfig;
    
    // Configuración de videollamadas
    private const ZOOM_SDK_KEY = 'your-zoom-sdk-key';
    private const GOOGLE_MEET_API = 'your-google-meet-api-key';
    private const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';
    
    // Tipos de videollamada
    private const CALL_TYPE_CONSULTATION = 'consultation';
    private const CALL_TYPE_PROJECT_KICKOFF = 'project_kickoff';
    private const CALL_TYPE_MILESTONE_REVIEW = 'milestone_review';
    private const CALL_TYPE_PROJECT_DELIVERY = 'project_delivery';
    private const CALL_TYPE_RELATIONSHIP_BUILDING = 'relationship_building';
    
    // Estados de videollamada
    private const STATUS_SCHEDULED = 'scheduled';
    private const STATUS_CONFIRMED = 'confirmed';
    private const STATUS_PENDING = 'pending';
    private const STATUS_IN_PROGRESS = 'in_progress';
    private const STATUS_COMPLETED = 'completed';
    private const STATUS_CANCELLED = 'cancelled';
    private const STATUS_NO_SHOW = 'no_show';
    
    public function __construct($userData) {
        $this->user = $userData;
        $this->timezone = self::ARGENTINA_TIMEZONE;
        $this->googleMeetConfig = $this->initializeGoogleMeet();
    }
    
    /**
     * Renderizar interface completa de videollamadas
     */
    public function render() {
        return "
        <div class='videollamadas-container'>
            <div class='videollamadas-header'>
                {$this->renderHeader()}
            </div>
            
            <div class='videollamadas-content'>
                <div class='videollamadas-main'>
                    {$this->renderScheduler()}
                    {$this->renderUpcomingCalls()}
                    {$this->renderCallHistory()}
                </div>
                
                <div class='videollamadas-sidebar'>
                    {$this->renderQuickActions()}
                    {$this->renderAvailability()}
                    {$this->renderIntegrations()}
                </div>
            </div>
            
            {$this->renderCallModal()}
            {$this->renderScheduleModal()}
            {$this->renderJavaScriptIntegration()}
        </div>";
    }
    
    /**
     * Header con estadísticas y acciones rápidas
     */
    private function renderHeader() {
        $stats = $this->getCallStats();
        
        return "
        <div class='videollamadas-header-content'>
            <div class='header-title'>
                <h2>
                    <i class='icon-video'></i>
                    Videollamadas
                </h2>
                <p class='header-subtitle'>
                    Conectá cara a cara con tus clientes y freelancers
                </p>
            </div>
            
            <div class='header-stats'>
                <div class='stat-card'>
                    <span class='stat-number'>{$stats['this_month']}</span>
                    <span class='stat-label'>Este mes</span>
                </div>
                <div class='stat-card'>
                    <span class='stat-number'>{$stats['total_hours']}</span>
                    <span class='stat-label'>Horas totales</span>
                </div>
                <div class='stat-card'>
                    <span class='stat-number'>{$stats['avg_rating']}</span>
                    <span class='stat-label'>Rating promedio</span>
                </div>
            </div>
            
            <div class='header-actions'>
                <button class='btn btn-primary' onclick='videollamadasManager.scheduleCall()'>
                    <i class='icon-calendar-plus'></i>
                    Programar videollamada
                </button>
                <button class='btn btn-outline' onclick='videollamadasManager.instantCall()'>
                    <i class='icon-video'></i>
                    Llamada instantánea
                </button>
            </div>
        </div>";
    }
    
    /**
     * Scheduler inteligente con zona horaria argentina
     */
    private function renderScheduler() {
        return "
        <div class='scheduler-section'>
            <h3 class='section-title'>
                <i class='icon-calendar'></i>
                Programar videollamada
            </h3>
            
            <div class='scheduler-form'>
                <div class='form-row'>
                    <div class='form-group'>
                        <label class='form-label'>Participante</label>
                        <select class='form-select' id='call-participant'>
                            <option value=''>Seleccionar de Mi Red...</option>
                            {$this->renderNetworkOptions()}
                        </select>
                    </div>
                    
                    <div class='form-group'>
                        <label class='form-label'>Tipo de videollamada</label>
                        <select class='form-select' id='call-type'>
                            <option value='" . self::CALL_TYPE_CONSULTATION . "'>Consulta inicial</option>
                            <option value='" . self::CALL_TYPE_PROJECT_KICKOFF . "'>Inicio de proyecto</option>
                            <option value='" . self::CALL_TYPE_MILESTONE_REVIEW . "'>Revisión de milestone</option>
                            <option value='" . self::CALL_TYPE_PROJECT_DELIVERY . "'>Entrega de proyecto</option>
                            <option value='" . self::CALL_TYPE_RELATIONSHIP_BUILDING . "'>Fortalecimiento de relación</option>
                        </select>
                    </div>
                </div>
                
                <div class='form-row'>
                    <div class='form-group'>
                        <label class='form-label'>Fecha y hora (Argentina)</label>
                        <div class='datetime-picker'>
                            <input type='date' 
                                   class='form-input' 
                                   id='call-date'
                                   min='{$this->getMinDate()}'>
                            <select class='form-select' id='call-time'>
                                {$this->renderTimeOptions()}
                            </select>
                        </div>
                        <small class='form-help'>
                            <i class='icon-clock'></i>
                            Zona horaria: Argentina (UTC-3)
                        </small>
                    </div>
                    
                    <div class='form-group'>
                        <label class='form-label'>Duración estimada</label>
                        <select class='form-select' id='call-duration'>
                            <option value='15'>15 minutos</option>
                            <option value='30' selected>30 minutos</option>
                            <option value='45'>45 minutos</option>
                            <option value='60'>1 hora</option>
                            <option value='90'>1.5 horas</option>
                            <option value='120'>2 horas</option>
                        </select>
                    </div>
                </div>
                
                <div class='form-group'>
                    <label class='form-label'>Agenda y objetivos</label>
                    <textarea class='form-textarea' 
                              id='call-agenda' 
                              placeholder='Describí brevemente los temas a tratar y objetivos de la videollamada...'
                              rows='3'></textarea>
                </div>
                
                <div class='form-group'>
                    <label class='form-label'>Configuración de la llamada</label>
                    <div class='checkbox-group'>
                        <label class='checkbox-option'>
                            <input type='checkbox' id='call-recording' checked>
                            <span class='checkbox-custom'></span>
                            <span class='checkbox-label'>Grabar videollamada</span>
                            <small class='checkbox-description'>La grabación estará disponible para ambos participantes</small>
                        </label>
                        
                        <label class='checkbox-option'>
                            <input type='checkbox' id='call-transcription'>
                            <span class='checkbox-custom'></span>
                            <span class='checkbox-label'>Transcripción automática</span>
                            <small class='checkbox-description'>Transcripción en español argentino</small>
                        </label>
                        
                        <label class='checkbox-option'>
                            <input type='checkbox' id='call-screen-share' checked>
                            <span class='checkbox-custom'></span>
                            <span class='checkbox-label'>Permitir compartir pantalla</span>
                        </label>
                        
                        <label class='checkbox-option'>
                            <input type='checkbox' id='call-reminders' checked>
                            <span class='checkbox-custom'></span>
                            <span class='checkbox-label'>Recordatorios automáticos</span>
                            <small class='checkbox-description'>1 día antes y 1 hora antes</small>
                        </label>
                    </div>
                </div>
                
                <div class='form-actions'>
                    <button class='btn btn-primary' onclick='videollamadasManager.scheduleCall()'>
                        <i class='icon-calendar-check'></i>
                        Programar videollamada
                    </button>
                    <button class='btn btn-outline' onclick='videollamadasManager.previewInvite()'>
                        <i class='icon-eye'></i>
                        Previsualizar invitación
                    </button>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Próximas videollamadas
     */
    private function renderUpcomingCalls() {
        $upcomingCalls = $this->getUpcomingCalls();
        
        $callsHtml = '';
        foreach ($upcomingCalls as $call) {
            $callsHtml .= $this->renderCallCard($call);
        }
        
        return "
        <div class='upcoming-calls-section'>
            <h3 class='section-title'>
                <i class='icon-calendar-clock'></i>
                Próximas videollamadas
                <span class='calls-count'>(" . count($upcomingCalls) . ")</span>
            </h3>
            
            <div class='calls-list'>
                {$callsHtml}
            </div>
            
            " . (empty($upcomingCalls) ? "
            <div class='empty-state'>
                <i class='icon-calendar-x'></i>
                <h4>No tenés videollamadas programadas</h4>
                <p>Programá una videollamada para conectar mejor con tus clientes</p>
                <button class='btn btn-primary' onclick='videollamadasManager.scheduleCall()'>
                    Programar primera videollamada
                </button>
            </div>" : '') . "
        </div>";
    }
    
    /**
     * Card individual de videollamada
     */
    private function renderCallCard($call) {
        $localTime = $this->convertToArgentineTime($call['scheduled_at']);
        $timeUntil = $this->getTimeUntilCall($call['scheduled_at']);
        $statusClass = $this->getCallStatusClass($call['status']);
        
        return "
        <div class='call-card {$statusClass}' data-call-id='{$call['id']}'>
            <div class='call-header'>
                <div class='call-participant'>
                    <img src='{$call['participant_avatar']}' alt='Participante' class='participant-avatar'>
                    <div class='participant-info'>
                        <h4 class='participant-name'>{$call['participant_name']}</h4>
                        <p class='call-type-label'>{$this->getCallTypeLabel($call['call_type'])}</p>
                    </div>
                </div>
                
                <div class='call-status'>
                    <span class='status-badge {$call['status']}'>{$this->getStatusLabel($call['status'])}</span>
                    <span class='time-until'>{$timeUntil}</span>
                </div>
            </div>
            
            <div class='call-details'>
                <div class='call-time'>
                    <i class='icon-clock'></i>
                    <span>{$localTime['date']} a las {$localTime['time']}</span>
                    <small class='timezone-info'>(Hora Argentina)</small>
                </div>
                
                <div class='call-duration'>
                    <i class='icon-timer'></i>
                    <span>{$call['duration']} minutos</span>
                </div>
                
                " . (!empty($call['agenda']) ? "
                <div class='call-agenda'>
                    <i class='icon-list'></i>
                    <span>{$call['agenda']}</span>
                </div>" : '') . "
            </div>
            
            <div class='call-actions'>
                {$this->renderCallActions($call)}
            </div>
            
            " . (!empty($call['meeting_link']) ? "
            <div class='call-link'>
                <div class='link-info'>
                    <i class='icon-link'></i>
                    <span>Link de videollamada generado</span>
                </div>
                <div class='link-actions'>
                    <button class='btn btn-small btn-outline' 
                            onclick='videollamadasManager.copyLink(\"{$call['meeting_link']}\")'>
                        <i class='icon-copy'></i>
                        Copiar
                    </button>
                    <button class='btn btn-small btn-outline' 
                            onclick='videollamadasManager.testConnection(\"{$call['id']}\")'>
                        <i class='icon-activity'></i>
                        Test
                    </button>
                </div>
            </div>" : '') . "
        </div>";
    }
    
    /**
     * Historial de videollamadas
     */
    private function renderCallHistory() {
        $historyCall = $this->getCallHistory();
        
        return "
        <div class='call-history-section'>
            <h3 class='section-title'>
                <i class='icon-history'></i>
                Historial de videollamadas
            </h3>
            
            <div class='history-filters'>
                <select class='form-select' onchange='videollamadasManager.filterHistory(this.value)'>
                    <option value='all'>Todas las videollamadas</option>
                    <option value='completed'>Completadas</option>
                    <option value='cancelled'>Canceladas</option>
                    <option value='no_show'>No asistió</option>
                </select>
                
                <input type='month' 
                       class='form-input' 
                       onchange='videollamadasManager.filterByMonth(this.value)'
                       max='{$this->getCurrentMonth()}'>
            </div>
            
            <div class='history-list' id='call-history-list'>
                {$this->renderHistoryItems($historyCall)}
            </div>
        </div>";
    }
    
    /**
     * Acciones rápidas en sidebar
     */
    private function renderQuickActions() {
        return "
        <div class='quick-actions-section'>
            <h3 class='section-title'>
                <i class='icon-zap'></i>
                Acciones rápidas
            </h3>
            
            <div class='quick-actions-grid'>
                <button class='quick-action-btn' onclick='videollamadasManager.instantCall()'>
                    <i class='icon-video'></i>
                    <span>Llamada instantánea</span>
                </button>
                
                <button class='quick-action-btn' onclick='videollamadasManager.scheduleWithMiRed()'>
                    <i class='icon-users'></i>
                    <span>Llamar a Mi Red</span>
                </button>
                
                <button class='quick-action-btn' onclick='videollamadasManager.recordingLibrary()'>
                    <i class='icon-play-circle'></i>
                    <span>Mis grabaciones</span>
                </button>
                
                <button class='quick-action-btn' onclick='videollamadasManager.settingsModal()'>
                    <i class='icon-settings'></i>
                    <span>Configuración</span>
                </button>
            </div>
            
            <div class='quick-stats'>
                <div class='stat-item'>
                    <span class='stat-value'>12</span>
                    <span class='stat-label'>Llamadas pendientes</span>
                </div>
                <div class='stat-item'>
                    <span class='stat-value'>4.8</span>
                    <span class='stat-label'>Rating promedio</span>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Disponibilidad del usuario
     */
    private function renderAvailability() {
        $availability = $this->getUserAvailability();
        
        return "
        <div class='availability-section'>
            <h3 class='section-title'>
                <i class='icon-clock'></i>
                Mi disponibilidad
            </h3>
            
            <div class='availability-current'>
                <div class='status-indicator {$availability['current_status']}'>
                    <span class='status-dot'></span>
                    <span class='status-text'>{$this->getAvailabilityLabel($availability['current_status'])}</span>
                </div>
                
                " . (!empty($availability['next_available']) ? "
                <div class='next-available'>
                    <small>Próximo disponible: {$availability['next_available']}</small>
                </div>" : '') . "
            </div>
            
            <div class='availability-schedule'>
                <h4 class='schedule-title'>Horarios disponibles</h4>
                <div class='schedule-grid'>
                    {$this->renderWeeklySchedule($availability['weekly_schedule'])}
                </div>
                
                <button class='btn btn-outline btn-small' 
                        onclick='videollamadasManager.editAvailability()'>
                    <i class='icon-edit'></i>
                    Editar disponibilidad
                </button>
            </div>
        </div>";
    }
    
    /**
     * Integraciones disponibles
     */
    private function renderIntegrations() {
        return "
        <div class='integrations-section'>
            <h3 class='section-title'>
                <i class='icon-link'></i>
                Integraciones
            </h3>
            
            <div class='integrations-list'>
                <div class='integration-item active'>
                    <img src='/assets/img/google-meet.png' alt='Google Meet' class='integration-logo'>
                    <div class='integration-info'>
                        <h4>Google Meet</h4>
                        <p>Conectado</p>
                    </div>
                    <span class='integration-status connected'>✓</span>
                </div>
                
                <div class='integration-item'>
                    <img src='/assets/img/zoom.png' alt='Zoom' class='integration-logo'>
                    <div class='integration-info'>
                        <h4>Zoom</h4>
                        <p>Disponible</p>
                    </div>
                    <button class='btn btn-small btn-outline' onclick='videollamadasManager.connectZoom()'>
                        Conectar
                    </button>
                </div>
                
                <div class='integration-item'>
                    <img src='/assets/img/calendar.png' alt='Calendario' class='integration-logo'>
                    <div class='integration-info'>
                        <h4>Google Calendar</h4>
                        <p>Sincronización automática</p>
                    </div>
                    <span class='integration-status connected'>✓</span>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Modal para videollamada en curso
     */
    private function renderCallModal() {
        return "
        <div class='call-modal' id='call-modal' style='display: none;'>
            <div class='call-modal-content'>
                <div class='call-modal-header'>
                    <h3>Videollamada en curso</h3>
                    <button class='close-modal' onclick='videollamadasManager.endCall()'>
                        <i class='icon-x'></i>
                    </button>
                </div>
                
                <div class='call-modal-body'>
                    <div class='video-container'>
                        <video id='remote-video' autoplay></video>
                        <video id='local-video' autoplay muted></video>
                    </div>
                    
                    <div class='call-controls'>
                        <button class='control-btn' id='mute-btn' onclick='videollamadasManager.toggleMute()'>
                            <i class='icon-mic'></i>
                        </button>
                        <button class='control-btn' id='video-btn' onclick='videollamadasManager.toggleVideo()'>
                            <i class='icon-video'></i>
                        </button>
                        <button class='control-btn' id='screen-share-btn' onclick='videollamadasManager.toggleScreenShare()'>
                            <i class='icon-monitor'></i>
                        </button>
                        <button class='control-btn danger' onclick='videollamadasManager.endCall()'>
                            <i class='icon-phone-off'></i>
                        </button>
                    </div>
                    
                    <div class='call-info'>
                        <span class='call-duration' id='call-duration'>00:00</span>
                        <span class='participant-name' id='call-participant-name'></span>
                    </div>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Modal para programar videollamada
     */
    private function renderScheduleModal() {
        return "
        <div class='schedule-modal' id='schedule-modal' style='display: none;'>
            <div class='schedule-modal-content'>
                <div class='schedule-modal-header'>
                    <h3>Programar Videollamada</h3>
                    <button class='close-modal' onclick='videollamadasManager.closeScheduleModal()'>
                        <i class='icon-x'></i>
                    </button>
                </div>
                
                <div class='schedule-modal-body'>
                    <!-- Formulario de programación aquí -->
                    <div class='schedule-form-container'>
                        <!-- Reutilizar el formulario del scheduler principal -->
                    </div>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Integración JavaScript
     */
    private function renderJavaScriptIntegration() {
        return "
        <script>
            // Configuración inicial para VideollamadasManager
            window.videollamadasConfig = {
                userId: {$this->user['id']},
                userType: '{$this->user['user_type']}',
                timezone: '{$this->timezone}',
                googleMeetEnabled: true,
                zoomEnabled: false,
                recordingEnabled: true,
                transcriptionEnabled: true
            };
            
            // Inicializar cuando el DOM esté listo
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof VideollamadasManager !== 'undefined') {
                    window.videollamadasManager = new VideollamadasManager(window.videollamadasConfig);
                }
            });
        </script>";
    }
    
    // Métodos auxiliares y de datos
    
    /**
     * Obtener estadísticas de videollamadas
     */
    private function getCallStats() {
        // En implementación real vendría de BD
        return [
            'this_month' => 12,
            'total_hours' => 48,
            'avg_rating' => 4.8
        ];
    }
    
    /**
     * Obtener próximas videollamadas
     */
    private function getUpcomingCalls() {
        // En implementación real vendría de BD
        return [
            [
                'id' => 1,
                'participant_name' => 'María González',
                'participant_avatar' => '/assets/img/avatars/maria.jpg',
                'call_type' => self::CALL_TYPE_PROJECT_KICKOFF,
                'scheduled_at' => '2025-07-21 14:30:00',
                'duration' => 60,
                'status' => self::STATUS_CONFIRMED,
                'agenda' => 'Revisión de requerimientos del proyecto de diseño web',
                'meeting_link' => 'https://meet.google.com/abc-defg-hij'
            ],
            [
                'id' => 2,
                'participant_name' => 'Carlos Rodríguez',
                'participant_avatar' => '/assets/img/avatars/carlos.jpg',
                'call_type' => self::CALL_TYPE_CONSULTATION,
                'scheduled_at' => '2025-07-22 10:00:00',
                'duration' => 30,
                'status' => self::STATUS_PENDING,
                'agenda' => 'Consulta inicial sobre desarrollo mobile',
                'meeting_link' => null
            ]
        ];
    }
    
    /**
     * Obtener opciones de Mi Red para participantes
     */
    private function renderNetworkOptions() {
        $network = MiRed::getMyNetwork($this->user['id'], $this->user['user_type']);
        
        $options = '';
        foreach ($network as $connection) {
            $name = $connection['freelancer_username'] ?? $connection['client_username'];
            $firstName = $connection['freelancer_first_name'] ?? $connection['client_first_name'];
            $lastName = $connection['freelancer_last_name'] ?? $connection['client_last_name'];
            $displayName = trim("{$firstName} {$lastName}") ?: $name;
            
            $options .= "<option value='{$connection['id']}'>{$displayName}</option>";
        }
        
        return $options;
    }
    
    /**
     * Opciones de horarios de trabajo argentinos
     */
    private function renderTimeOptions() {
        $options = '';
        $businessHours = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
            '17:00', '17:30', '18:00'
        ];
        
        foreach ($businessHours as $time) {
            $options .= "<option value='{$time}'>{$time}</option>";
        }
        
        return $options;
    }
    
    /**
     * Fecha mínima para programar (mañana)
     */
    private function getMinDate() {
        return date('Y-m-d', strtotime('+1 day'));
    }
    
    /**
     * Convertir a hora argentina
     */
    private function convertToArgentineTime($utcTime) {
        $date = new DateTime($utcTime, new DateTimeZone('UTC'));
        $date->setTimezone(new DateTimeZone(self::ARGENTINA_TIMEZONE));
        
        return [
            'date' => $date->format('d/m/Y'),
            'time' => $date->format('H:i'),
            'full' => $date->format('d/m/Y H:i')
        ];
    }
    
    /**
     * Tiempo hasta la videollamada
     */
    private function getTimeUntilCall($scheduledAt) {
        $now = new DateTime('now', new DateTimeZone(self::ARGENTINA_TIMEZONE));
        $callTime = new DateTime($scheduledAt, new DateTimeZone('UTC'));
        $callTime->setTimezone(new DateTimeZone(self::ARGENTINA_TIMEZONE));
        
        $diff = $now->diff($callTime);
        
        if ($diff->days > 0) {
            return "En {$diff->days} días";
        } elseif ($diff->h > 0) {
            return "En {$diff->h} horas";
        } elseif ($diff->i > 0) {
            return "En {$diff->i} minutos";
        } else {
            return "Ahora";
        }
    }
    
    /**
     * Label del tipo de videollamada
     */
    private function getCallTypeLabel($type) {
        $labels = [
            self::CALL_TYPE_CONSULTATION => 'Consulta inicial',
            self::CALL_TYPE_PROJECT_KICKOFF => 'Inicio de proyecto',
            self::CALL_TYPE_MILESTONE_REVIEW => 'Revisión de milestone',
            self::CALL_TYPE_PROJECT_DELIVERY => 'Entrega de proyecto',
            self::CALL_TYPE_RELATIONSHIP_BUILDING => 'Fortalecimiento de relación'
        ];
        
        return $labels[$type] ?? 'Videollamada';
    }
    
    /**
     * Acciones disponibles para cada videollamada
     */
    private function renderCallActions($call) {
        $actions = '';
        
        switch ($call['status']) {
            case self::STATUS_CONFIRMED:
                $actions = "
                <button class='btn btn-primary btn-small' 
                        onclick='videollamadasManager.joinCall(\"{$call['id']}\")'>
                    <i class='icon-video'></i>
                    Unirse
                </button>
                <button class='btn btn-outline btn-small' 
                        onclick='videollamadasManager.rescheduleCall(\"{$call['id']}\")'>
                    <i class='icon-calendar'></i>
                    Reprogramar
                </button>";
                break;
                
            case self::STATUS_PENDING:
                $actions = "
                <button class='btn btn-success btn-small' 
                        onclick='videollamadasManager.confirmCall(\"{$call['id']}\")'>
                    <i class='icon-check'></i>
                    Confirmar
                </button>
                <button class='btn btn-danger btn-small' 
                        onclick='videollamadasManager.declineCall(\"{$call['id']}\")'>
                    <i class='icon-x'></i>
                    Declinar
                </button>";
                break;
                
            case self::STATUS_SCHEDULED:
                $actions = "
                <button class='btn btn-outline btn-small' 
                        onclick='videollamadasManager.editCall(\"{$call['id']}\")'>
                    <i class='icon-edit'></i>
                    Editar
                </button>
                <button class='btn btn-outline btn-small' 
                        onclick='videollamadasManager.cancelCall(\"{$call['id']}\")'>
                    <i class='icon-x'></i>
                    Cancelar
                </button>";
                break;
        }
        
        return $actions;
    }
    
    /**
     * Inicializar configuración Google Meet
     */
    private function initializeGoogleMeet() {
        return [
            'api_key' => self::GOOGLE_MEET_API,
            'calendar_id' => 'primary',
            'timezone' => self::ARGENTINA_TIMEZONE
        ];
    }
    
    // Métodos auxiliares simplificados
    private function getCallStatusClass($status) { 
        return "status-{$status}"; 
    }
    
    private function getStatusLabel($status) { 
        $labels = [
            self::STATUS_CONFIRMED => 'Confirmada',
            self::STATUS_PENDING => 'Pendiente',
            self::STATUS_SCHEDULED => 'Programada',
            self::STATUS_COMPLETED => 'Completada',
            self::STATUS_CANCELLED => 'Cancelada',
            self::STATUS_NO_SHOW => 'No asistió'
        ];
        return $labels[$status] ?? ucfirst($status);
    }
    
    private function getCurrentMonth() { 
        return date('Y-m'); 
    }
    
    private function getCallHistory() { 
        // En implementación real vendría de BD
        return []; 
    }
    
    private function renderHistoryItems($items) { 
        return '<div class="empty-history">No hay historial disponible</div>'; 
    }
    
    private function getUserAvailability() { 
        return [
            'current_status' => 'available',
            'next_available' => 'Hoy 14:00',
            'weekly_schedule' => []
        ]; 
    }
    
    private function getAvailabilityLabel($status) { 
        $labels = [
            'available' => 'Disponible',
            'busy' => 'Ocupado',
            'away' => 'Ausente'
        ];
        return $labels[$status] ?? ucfirst($status);
    }
    
    private function renderWeeklySchedule($schedule) { 
        return '<div class="schedule-placeholder">Configurar horarios</div>'; 
    }
    
    /**
     * Método estático para uso rápido
     */
    public static function quickRender($userData) {
        $instance = new self($userData);
        return $instance->render();
    }
}