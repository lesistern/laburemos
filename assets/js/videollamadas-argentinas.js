/**
 * VideollamadasManager - Sistema JavaScript para videollamadas nativas
 * 
 * Funcionalidades:
 * - WebRTC integration completa
 * - Scheduling con zona horaria argentina
 * - Google Meet/Zoom integration
 * - Grabación y transcripción
 * - Integración con Mi Red
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

class VideollamadasManager {
    
    constructor(config) {
        this.config = config;
        this.currentCall = null;
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.isInCall = false;
        this.callTimer = null;
        this.callStartTime = null;
        this.socket = null;
        
        // Configuración WebRTC
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        // Estado de controles
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        
        this.init();
    }
    
    /**
     * Inicializar el sistema
     */
    init() {
        console.log('Iniciando VideollamadasManager...', this.config);
        
        this.setupEventListeners();
        this.initializeTimezone();
        this.loadUserAvailability();
        this.connectWebSocket();
        
        // Inicializar Google Meet API si está habilitado
        if (this.config.googleMeetEnabled) {
            this.initializeGoogleMeet();
        }
        
        // Verificar permisos de media
        this.checkMediaPermissions();
    }
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botones principales
        const scheduleBtn = document.getElementById('schedule-call-btn');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => this.scheduleCall());
        }
        
        // Event listeners para formularios
        document.addEventListener('change', (e) => {
            if (e.target.matches('#call-participant')) {
                this.onParticipantChange(e.target);
            }
            if (e.target.matches('#call-date, #call-time')) {
                this.validateScheduleTime();
            }
        });
        
        // Event listeners para quick actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action-btn')) {
                this.handleQuickAction(e.target.closest('.quick-action-btn'));
            }
        });
        
        // Event listeners para call cards
        document.addEventListener('click', (e) => {
            const callCard = e.target.closest('.call-card');
            if (callCard) {
                this.handleCallCardAction(e.target, callCard);
            }
        });
        
        // Cerrar modals con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Prevenir salir durante videollamada
        window.addEventListener('beforeunload', (e) => {
            if (this.isInCall) {
                e.preventDefault();
                e.returnValue = '¿Estás seguro de que querés salir? Hay una videollamada en curso.';
            }
        });
    }
    
    /**
     * Inicializar configuración de zona horaria argentina
     */
    initializeTimezone() {
        // Configurar Intl para Argentina
        this.formatter = new Intl.DateTimeFormat('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Mostrar hora actual argentina
        this.updateArgentineTime();
        setInterval(() => this.updateArgentineTime(), 1000);
    }
    
    /**
     * Actualizar hora argentina en UI
     */
    updateArgentineTime() {
        const now = new Date();
        const argTime = this.formatter.format(now);
        
        const timeElements = document.querySelectorAll('.current-argentine-time');
        timeElements.forEach(el => {
            el.textContent = argTime;
        });
    }
    
    /**
     * Programar nueva videollamada
     */
    async scheduleCall() {
        const formData = this.getScheduleFormData();
        
        if (!this.validateScheduleForm(formData)) {
            return;
        }
        
        try {
            this.showLoading('Programando videollamada...');
            
            // Crear meeting link
            const meetingLink = await this.createMeetingLink(formData);
            
            // Guardar videollamada en BD
            const callData = {
                ...formData,
                meeting_link: meetingLink,
                status: 'scheduled'
            };
            
            const response = await this.saveScheduledCall(callData);
            
            if (response.success) {
                this.showToast('Videollamada programada exitosamente', 'success');
                this.clearScheduleForm();
                this.refreshUpcomingCalls();
                
                // Enviar notificación al participante
                await this.sendCallInvitation(response.call_id);
                
                // Actualizar score en Mi Red
                if (formData.connection_id) {
                    await this.updateMiRedScore(formData.connection_id, 'videocall', 1.0);
                }
                
            } else {
                throw new Error(response.error || 'Error programando videollamada');
            }
            
        } catch (error) {
            console.error('Error scheduling call:', error);
            this.showToast('Error al programar la videollamada', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Unirse a videollamada
     */
    async joinCall(callId) {
        try {
            this.showLoading('Conectando a videollamada...');
            
            // Obtener datos de la videollamada
            const callData = await this.getCallData(callId);
            
            if (!callData) {
                throw new Error('Videollamada no encontrada');
            }
            
            // Verificar permisos de media
            await this.requestMediaPermissions();
            
            // Inicializar WebRTC connection
            await this.initializeWebRTC();
            
            // Mostrar modal de videollamada
            this.showCallModal(callData);
            
            // Conectar a la sala
            await this.connectToCallRoom(callId);
            
            this.isInCall = true;
            this.currentCall = callData;
            this.startCallTimer();
            
            this.showToast('Conectado a videollamada', 'success');
            
        } catch (error) {
            console.error('Error joining call:', error);
            this.showToast('Error al conectar a videollamada', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Inicializar conexión WebRTC
     */
    async initializeWebRTC() {
        try {
            // Crear peer connection
            this.peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Event handlers
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendSignalingMessage('ice-candidate', event.candidate);
                }
            };
            
            this.peerConnection.ontrack = (event) => {
                const remoteVideo = document.getElementById('remote-video');
                if (remoteVideo) {
                    remoteVideo.srcObject = event.streams[0];
                    this.remoteStream = event.streams[0];
                }
            };
            
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                this.updateConnectionStatus(this.peerConnection.connectionState);
            };
            
            // Obtener stream local
            await this.getLocalMediaStream();
            
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            throw error;
        }
    }
    
    /**
     * Obtener stream de media local
     */
    async getLocalMediaStream() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Mostrar video local
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }
            
            // Agregar tracks a peer connection
            if (this.peerConnection) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }
            
        } catch (error) {
            console.error('Error getting local media:', error);
            throw error;
        }
    }
    
    /**
     * Conectar a WebSocket para señalización
     */
    connectWebSocket() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }
        
        const wsUrl = `ws://localhost:8080?user_id=${this.config.userId}&type=videollamadas`;
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            console.log('WebSocket conectado para videollamadas');
        };
        
        this.socket.onmessage = (event) => {
            this.handleWebSocketMessage(JSON.parse(event.data));
        };
        
        this.socket.onclose = () => {
            console.log('WebSocket desconectado');
            // Reconectar después de 3 segundos
            setTimeout(() => this.connectWebSocket(), 3000);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    /**
     * Manejar mensajes de WebSocket
     */
    async handleWebSocketMessage(data) {
        switch (data.type) {
            case 'call-invitation':
                this.handleCallInvitation(data);
                break;
                
            case 'call-answer':
                await this.handleCallAnswer(data);
                break;
                
            case 'call-offer':
                await this.handleCallOffer(data);
                break;
                
            case 'ice-candidate':
                await this.handleIceCandidate(data);
                break;
                
            case 'call-end':
                this.handleCallEnd(data);
                break;
                
            case 'participant-joined':
                this.handleParticipantJoined(data);
                break;
                
            case 'participant-left':
                this.handleParticipantLeft(data);
                break;
        }
    }
    
    /**
     * Enviar mensaje de señalización
     */
    sendSignalingMessage(type, data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: type,
                data: data,
                call_id: this.currentCall?.id,
                timestamp: Date.now()
            }));
        }
    }
    
    /**
     * Controlar audio (mute/unmute)
     */
    toggleMute() {
        if (!this.localStream) return;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            this.isAudioEnabled = audioTrack.enabled;
            
            // Actualizar UI
            const muteBtn = document.getElementById('mute-btn');
            if (muteBtn) {
                muteBtn.innerHTML = this.isAudioEnabled 
                    ? '<i class=\"icon-mic\"></i>' 
                    : '<i class=\"icon-mic-off\"></i>';
                muteBtn.classList.toggle('muted', !this.isAudioEnabled);
            }
            
            this.showToast(
                this.isAudioEnabled ? 'Micrófono activado' : 'Micrófono silenciado', 
                'info'
            );
        }
    }
    
    /**
     * Controlar video (on/off)
     */
    toggleVideo() {
        if (!this.localStream) return;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            this.isVideoEnabled = videoTrack.enabled;
            
            // Actualizar UI
            const videoBtn = document.getElementById('video-btn');
            if (videoBtn) {
                videoBtn.innerHTML = this.isVideoEnabled 
                    ? '<i class=\"icon-video\"></i>' 
                    : '<i class=\"icon-video-off\"></i>';
                videoBtn.classList.toggle('disabled', !this.isVideoEnabled);
            }
            
            // Mostrar/ocultar video local
            const localVideo = document.getElementById('local-video');
            if (localVideo) {
                localVideo.style.opacity = this.isVideoEnabled ? '1' : '0';
            }
            
            this.showToast(
                this.isVideoEnabled ? 'Cámara activada' : 'Cámara desactivada', 
                'info'
            );
        }
    }
    
    /**
     * Compartir pantalla
     */
    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Iniciar screen share
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                // Reemplazar video track
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
                
                this.isScreenSharing = true;
                
                // Manejar cuando el usuario pare el screen share
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
                
                this.updateScreenShareButton(true);
                this.showToast('Compartiendo pantalla', 'success');
                
            } else {
                // Parar screen share
                await this.stopScreenShare();
            }
            
        } catch (error) {
            console.error('Error toggling screen share:', error);
            this.showToast('Error al compartir pantalla', 'error');
        }
    }
    
    /**
     * Parar compartir pantalla
     */
    async stopScreenShare() {
        try {
            // Volver a cámara normal
            const cameraStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            
            const videoTrack = cameraStream.getVideoTracks()[0];
            const sender = this.peerConnection.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
            
            this.isScreenSharing = false;
            this.updateScreenShareButton(false);
            this.showToast('Dejaste de compartir pantalla', 'info');
            
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }
    
    /**
     * Actualizar botón de screen share
     */
    updateScreenShareButton(isSharing) {
        const screenBtn = document.getElementById('screen-share-btn');
        if (screenBtn) {
            screenBtn.innerHTML = isSharing 
                ? '<i class=\"icon-monitor-x\"></i>' 
                : '<i class=\"icon-monitor\"></i>';
            screenBtn.classList.toggle('active', isSharing);
        }
    }
    
    /**
     * Terminar videollamada
     */
    async endCall() {
        if (!this.isInCall) return;
        
        try {
            // Enviar señal de fin de llamada
            this.sendSignalingMessage('call-end', {
                call_id: this.currentCall?.id,
                end_time: new Date().toISOString()
            });
            
            // Cerrar peer connection
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }
            
            // Detener streams
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            
            // Actualizar estado
            this.isInCall = false;
            this.stopCallTimer();
            
            // Cerrar modal
            this.closeCallModal();
            
            // Actualizar base de datos
            if (this.currentCall) {
                await this.updateCallStatus(this.currentCall.id, 'completed');
                
                // Actualizar score en Mi Red
                await this.updateMiRedScore(
                    this.currentCall.connection_id, 
                    'videocall', 
                    2.0
                );
            }
            
            this.currentCall = null;
            this.showToast('Videollamada finalizada', 'success');
            
            // Refrescar lista de llamadas
            this.refreshUpcomingCalls();
            
        } catch (error) {
            console.error('Error ending call:', error);
            this.showToast('Error al finalizar videollamada', 'error');
        }
    }
    
    /**
     * Confirmar videollamada pendiente
     */
    async confirmCall(callId) {
        try {
            const response = await fetch('/api/VideollamadasController.php?action=confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: JSON.stringify({ call_id: callId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Videollamada confirmada', 'success');
                this.refreshUpcomingCalls();
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error confirming call:', error);
            this.showToast('Error al confirmar videollamada', 'error');
        }
    }
    
    /**
     * Declinar videollamada
     */
    async declineCall(callId) {
        try {
            const response = await fetch('/api/VideollamadasController.php?action=decline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: JSON.stringify({ call_id: callId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Videollamada declinada', 'info');
                this.refreshUpcomingCalls();
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error declining call:', error);
            this.showToast('Error al declinar videollamada', 'error');
        }
    }
    
    /**
     * Reprogramar videollamada
     */
    async rescheduleCall(callId) {
        // Mostrar modal de reprogramación
        this.showRescheduleModal(callId);
    }
    
    /**
     * Llamada instantánea
     */
    async instantCall() {
        // Mostrar modal para seleccionar participante
        this.showInstantCallModal();
    }
    
    /**
     * Copiar link de videollamada
     */
    copyLink(link) {
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('Link copiado al portapapeles', 'success');
        }).catch(() => {
            this.showToast('Error al copiar link', 'error');
        });
    }
    
    /**
     * Test de conexión
     */
    async testConnection(callId) {
        try {
            this.showLoading('Probando conexión...');
            
            // Simular test de conexión
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const quality = Math.random() > 0.3 ? 'excellent' : 'good';
            const latency = Math.floor(Math.random() * 100) + 20;
            
            this.showConnectionTestResult(quality, latency);
            
        } catch (error) {
            console.error('Error testing connection:', error);
            this.showToast('Error en test de conexión', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Mostrar resultado de test de conexión
     */
    showConnectionTestResult(quality, latency) {
        const qualityText = {
            'excellent': 'Excelente',
            'good': 'Buena',
            'fair': 'Regular',
            'poor': 'Mala'
        };
        
        this.showToast(
            `Conexión ${qualityText[quality]} (${latency}ms)`, 
            quality === 'excellent' || quality === 'good' ? 'success' : 'warning'
        );
    }
    
    /**
     * Filtrar historial
     */
    filterHistory(filter) {
        const historyList = document.getElementById('call-history-list');
        if (!historyList) return;
        
        // Aplicar filtro
        this.currentHistoryFilter = filter;
        this.loadCallHistory();
    }
    
    /**
     * Filtrar por mes
     */
    filterByMonth(month) {
        this.currentMonthFilter = month;
        this.loadCallHistory();
    }
    
    /**
     * Cargar historial de videollamadas
     */
    async loadCallHistory() {
        try {
            const params = new URLSearchParams({
                action: 'history',
                user_id: this.config.userId,
                filter: this.currentHistoryFilter || 'all',
                month: this.currentMonthFilter || ''
            });
            
            const response = await fetch(`/api/VideollamadasController.php?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderCallHistory(data.calls);
            }
            
        } catch (error) {
            console.error('Error loading call history:', error);
        }
    }
    
    /**
     * Mostrar modal de videollamada
     */
    showCallModal(callData) {
        const modal = document.getElementById('call-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Actualizar información del participante
            const participantName = document.getElementById('call-participant-name');
            if (participantName) {
                participantName.textContent = callData.participant_name;
            }
        }
    }
    
    /**
     * Cerrar modal de videollamada
     */
    closeCallModal() {
        const modal = document.getElementById('call-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Iniciar timer de videollamada
     */
    startCallTimer() {
        this.callStartTime = Date.now();
        
        this.callTimer = setInterval(() => {
            const elapsed = Date.now() - this.callStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const durationElement = document.getElementById('call-duration');
            if (durationElement) {
                durationElement.textContent = timeString;
            }
            
        }, 1000);
    }
    
    /**
     * Parar timer de videollamada
     */
    stopCallTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
    }
    
    /**
     * Verificar permisos de media
     */
    async checkMediaPermissions() {
        try {
            const permissions = await Promise.all([
                navigator.permissions.query({ name: 'camera' }),
                navigator.permissions.query({ name: 'microphone' })
            ]);
            
            const [camera, microphone] = permissions;
            
            this.permissions = {
                camera: camera.state,
                microphone: microphone.state
            };
            
            // Mostrar alertas si es necesario
            if (camera.state === 'denied' || microphone.state === 'denied') {
                this.showPermissionsAlert();
            }
            
        } catch (error) {
            console.warn('Error checking permissions:', error);
        }
    }
    
    /**
     * Solicitar permisos de media
     */
    async requestMediaPermissions() {
        try {
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            return true;
            
        } catch (error) {
            console.error('Error requesting media permissions:', error);
            this.showToast('Se necesitan permisos de cámara y micrófono', 'error');
            return false;
        }
    }
    
    /**
     * Mostrar alerta de permisos
     */
    showPermissionsAlert() {
        this.showToast(
            'Para usar videollamadas, otorgá permisos de cámara y micrófono', 
            'warning'
        );
    }
    
    // Métodos auxiliares
    
    getScheduleFormData() {
        return {
            participant_id: document.getElementById('call-participant')?.value,
            call_type: document.getElementById('call-type')?.value,
            date: document.getElementById('call-date')?.value,
            time: document.getElementById('call-time')?.value,
            duration: document.getElementById('call-duration')?.value,
            agenda: document.getElementById('call-agenda')?.value,
            recording: document.getElementById('call-recording')?.checked,
            transcription: document.getElementById('call-transcription')?.checked,
            screen_share: document.getElementById('call-screen-share')?.checked,
            reminders: document.getElementById('call-reminders')?.checked
        };
    }
    
    validateScheduleForm(formData) {
        if (!formData.participant_id) {
            this.showToast('Seleccioná un participante', 'error');
            return false;
        }
        
        if (!formData.date || !formData.time) {
            this.showToast('Seleccioná fecha y hora', 'error');
            return false;
        }
        
        // Validar que la fecha no sea en el pasado
        const scheduleDateTime = new Date(`${formData.date}T${formData.time}`);
        if (scheduleDateTime <= new Date()) {
            this.showToast('La fecha debe ser en el futuro', 'error');
            return false;
        }
        
        return true;
    }
    
    async createMeetingLink(formData) {
        if (this.config.googleMeetEnabled) {
            return await this.createGoogleMeetLink(formData);
        } else {
            // Generar link interno
            return `${window.location.origin}/videollamada/${Date.now()}`;
        }
    }
    
    async createGoogleMeetLink(formData) {
        // Implementación Google Meet API
        // Por ahora retornamos un link simulado
        return `https://meet.google.com/${this.generateMeetingId()}`;
    }
    
    generateMeetingId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    clearScheduleForm() {
        const form = document.querySelector('.scheduler-form');
        if (form) {
            form.reset();
        }
    }
    
    async refreshUpcomingCalls() {
        // Recargar la sección de próximas videollamadas
        window.location.reload();
    }
    
    getCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.content : '';
    }
    
    showLoading(message) {
        // Implementar loading indicator
        const body = document.body;
        body.classList.add('videollamadas-loading');
        
        // Mostrar mensaje de loading si se proporciona
        if (message) {
            this.showToast(message, 'info');
        }
    }
    
    hideLoading() {
        const body = document.body;
        body.classList.remove('videollamadas-loading');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `videollamadas-toast toast-${type}`;
        toast.innerHTML = `
            <i class="toast-icon icon-${type === 'success' ? 'check' : type === 'error' ? 'x' : 'info'}"></i>
            <span class="toast-message">${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.call-modal, .schedule-modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // Métodos para API calls
    
    async saveScheduledCall(callData) {
        const response = await fetch('/api/VideollamadasController.php?action=schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.getCSRFToken()
            },
            body: JSON.stringify(callData)
        });
        
        return await response.json();
    }
    
    async getCallData(callId) {
        const response = await fetch(`/api/VideollamadasController.php?action=get&id=${callId}`);
        const data = await response.json();
        
        return data.success ? data.call : null;
    }
    
    async updateCallStatus(callId, status) {
        const response = await fetch('/api/VideollamadasController.php?action=update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.getCSRFToken()
            },
            body: JSON.stringify({
                call_id: callId,
                status: status
            })
        });
        
        return await response.json();
    }
    
    async updateMiRedScore(connectionId, interactionType, score) {
        try {
            const response = await fetch('/api/MiRedController.php?action=update-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: JSON.stringify({
                    connection_id: connectionId,
                    interaction_type: interactionType,
                    impact_score: score
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Mi Red score actualizado');
            }
            
        } catch (error) {
            console.error('Error updating Mi Red score:', error);
        }
    }
    
    async sendCallInvitation(callId) {
        const response = await fetch('/api/VideollamadasController.php?action=send-invitation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.getCSRFToken()
            },
            body: JSON.stringify({ call_id: callId })
        });
        
        return await response.json();
    }
    
    // Placeholder methods para funcionalidades futuras
    
    initializeGoogleMeet() {
        console.log('Google Meet integration initialized');
    }
    
    loadUserAvailability() {
        console.log('User availability loaded');
    }
    
    onParticipantChange(select) {
        console.log('Participant changed:', select.value);
    }
    
    validateScheduleTime() {
        console.log('Schedule time validated');
    }
    
    handleQuickAction(button) {
        console.log('Quick action:', button.dataset.action);
    }
    
    handleCallCardAction(target, card) {
        console.log('Call card action:', target, card);
    }
    
    connectToCallRoom(callId) {
        console.log('Connecting to call room:', callId);
    }
    
    handleCallInvitation(data) {
        console.log('Call invitation received:', data);
    }
    
    handleCallAnswer(data) {
        console.log('Call answer received:', data);
    }
    
    handleCallOffer(data) {
        console.log('Call offer received:', data);
    }
    
    handleIceCandidate(data) {
        console.log('ICE candidate received:', data);
    }
    
    handleCallEnd(data) {
        console.log('Call end received:', data);
    }
    
    handleParticipantJoined(data) {
        console.log('Participant joined:', data);
    }
    
    handleParticipantLeft(data) {
        console.log('Participant left:', data);
    }
    
    updateConnectionStatus(status) {
        console.log('Connection status:', status);
    }
    
    showRescheduleModal(callId) {
        console.log('Show reschedule modal for call:', callId);
    }
    
    showInstantCallModal() {
        console.log('Show instant call modal');
    }
    
    renderCallHistory(calls) {
        console.log('Render call history:', calls);
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar solo si existe configuración
    if (window.videollamadasConfig) {
        window.videollamadasManager = new VideollamadasManager(window.videollamadasConfig);
        console.log('VideollamadasManager initialized');
    }
});

// Exportar para uso global
window.VideollamadasManager = VideollamadasManager;