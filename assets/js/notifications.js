/**
 * Notifications JavaScript Manager
 * LaburAR Complete Platform - Phase 6
 * 
 * Handles real-time WebSocket notifications,
 * push notifications, and notification UI
 */

class NotificationManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.authToken = this.getAuthToken();
        this.userId = this.getUserId();
        this.notifications = [];
        this.unreadCount = 0;
        
        this.init();
    }
    
    // ===== Initialization =====
    
    init() {
        this.setupNotificationUI();
        this.requestNotificationPermission();
        this.registerServiceWorker();
        this.connectWebSocket();
        this.loadInitialNotifications();
        this.setupEventListeners();
        this.startPeriodicSync();
    }
    
    setupNotificationUI() {
        // Create notification bell in navigation if it doesn't exist
        const nav = document.querySelector('.nav-user');
        if (nav && !document.getElementById('notificationBell')) {
            const bellContainer = document.createElement('div');
            bellContainer.className = 'notification-bell-container';
            bellContainer.innerHTML = `
                <button class="notification-bell" id="notificationBell">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                </button>
                <div class="notification-dropdown" id="notificationDropdown">
                    <div class="notification-header">
                        <h3>Notificaciones</h3>
                        <button class="mark-all-read" id="markAllRead">
                            <i class="fas fa-check-double"></i>
                            Marcar todas como leídas
                        </button>
                    </div>
                    <div class="notification-list" id="notificationList">
                        <div class="notification-loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            Cargando notificaciones...
                        </div>
                    </div>
                    <div class="notification-footer">
                        <a href="/notifications.html" class="view-all-notifications">
                            Ver todas las notificaciones
                        </a>
                    </div>
                </div>
            `;
            
            nav.insertBefore(bellContainer, nav.firstChild);
        }
    }
    
    setupEventListeners() {
        // Notification bell click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#notificationBell')) {
                this.toggleNotificationDropdown();
            }
        });
        
        // Mark all as read
        document.addEventListener('click', (e) => {
            if (e.target.closest('#markAllRead')) {
                this.markAllAsRead();
            }
        });
        
        // Notification click
        document.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
                this.handleNotificationClick(notificationItem);
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-bell-container')) {
                this.closeNotificationDropdown();
            }
        });
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isConnected) {
                this.syncNotifications();
            }
        });
        
        // Window focus
        window.addEventListener('focus', () => {
            if (this.isConnected) {
                this.syncNotifications();
            }
        });
    }
    
    // ===== WebSocket Connection =====
    
    connectWebSocket() {
        if (!this.authToken) {
            console.warn('No auth token available for WebSocket connection');
            return;
        }
        
        try {
            const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${location.hostname}:8080`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('[Notifications] WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.authenticate();
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.ws.onclose = (event) => {
                console.log('[Notifications] WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('[Notifications] WebSocket error:', error);
                this.isConnected = false;
            };
            
        } catch (error) {
            console.error('[Notifications] Failed to connect WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    
    authenticate() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'authenticate',
                token: this.authToken
            }));
        }
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`[Notifications] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, delay);
        } else {
            console.error('[Notifications] Max reconnect attempts reached');
        }
    }
    
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('[Notifications] Received:', message);
            
            switch (message.type) {
                case 'connection_established':
                    console.log('[Notifications] Connection established:', message.client_id);
                    break;
                    
                case 'authenticated':
                    console.log('[Notifications] Authenticated for user:', message.user_id);
                    this.requestPendingNotifications();
                    break;
                    
                case 'notification_created':
                    this.handleNewNotification(message.data);
                    break;
                    
                case 'pending_notifications':
                    this.handlePendingNotifications(message.notifications);
                    break;
                    
                case 'unread_count':
                    this.updateUnreadCount(message.count);
                    break;
                    
                case 'notifications_marked_read':
                    this.handleNotificationsMarkedRead(message.notification_ids);
                    break;
                    
                case 'pong':
                    // Heartbeat response
                    break;
                    
                case 'error':
                    console.error('[Notifications] Server error:', message.error);
                    this.showToast(message.error, 'error');
                    break;
                    
                default:
                    console.log('[Notifications] Unknown message type:', message.type);
            }
            
        } catch (error) {
            console.error('[Notifications] Error parsing WebSocket message:', error);
        }
    }
    
    // ===== Notification Handling =====
    
    async loadInitialNotifications() {
        try {
            const response = await fetch('/api/NotificationController.php?action=list&limit=20&unread_only=false', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.notifications = data.data.notifications;
                this.renderNotifications();
                
                // Get unread count
                await this.updateUnreadCountFromServer();
            }
            
        } catch (error) {
            console.error('[Notifications] Error loading initial notifications:', error);
        }
    }
    
    async updateUnreadCountFromServer() {
        try {
            const response = await fetch('/api/NotificationController.php?action=unread-count', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateUnreadCount(data.data.unread_count);
            }
            
        } catch (error) {
            console.error('[Notifications] Error getting unread count:', error);
        }
    }
    
    handleNewNotification(notificationData) {
        // Add to notifications array
        this.notifications.unshift(notificationData);
        
        // Keep only last 50 notifications in memory
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        
        // Update UI
        this.renderNotifications();
        this.incrementUnreadCount();
        
        // Show browser notification if supported
        this.showBrowserNotification(notificationData);
        
        // Show toast notification
        this.showToast(notificationData.title, 'info');
        
        // Play notification sound
        this.playNotificationSound();
    }
    
    handlePendingNotifications(notifications) {
        if (notifications && notifications.length > 0) {
            // Merge with existing notifications, avoiding duplicates
            const existingIds = new Set(this.notifications.map(n => n.id));
            const newNotifications = notifications.filter(n => !existingIds.has(n.id));
            
            this.notifications = [...newNotifications, ...this.notifications];
            this.renderNotifications();
        }
    }
    
    handleNotificationsMarkedRead(notificationIds) {
        // Update local notifications
        this.notifications.forEach(notification => {
            if (notificationIds.includes(notification.id)) {
                notification.read_at = new Date().toISOString();
                notification.interaction_status = 'read';
            }
        });
        
        this.renderNotifications();
        this.decrementUnreadCount(notificationIds.length);
    }
    
    // ===== UI Rendering =====
    
    renderNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No hay notificaciones</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.notifications
            .slice(0, 10) // Show only first 10 in dropdown
            .map(notification => this.renderNotificationItem(notification))
            .join('');
    }
    
    renderNotificationItem(notification) {
        const isUnread = !notification.read_at;
        const iconClass = notification.icon || 'fas fa-bell';
        const priorityClass = notification.priority === 'urgent' ? 'urgent' : 
                            notification.priority === 'high' ? 'high' : '';
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''} ${priorityClass}" 
                 data-notification-id="${notification.id}"
                 data-action-url="${notification.action_url || ''}">
                <div class="notification-icon">
                    <i class="${iconClass}" style="color: ${notification.color || '#0078D4'}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                    <div class="notification-body">${this.escapeHtml(notification.body)}</div>
                    <div class="notification-time">${notification.formatted_time_ago || notification.formatted_created_at}</div>
                </div>
                ${isUnread ? '<div class="notification-unread-dot"></div>' : ''}
            </div>
        `;
    }
    
    updateUnreadCount(count) {
        this.unreadCount = count;
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Update page title
        this.updatePageTitle();
    }
    
    incrementUnreadCount() {
        this.updateUnreadCount(this.unreadCount + 1);
    }
    
    decrementUnreadCount(amount = 1) {
        this.updateUnreadCount(Math.max(0, this.unreadCount - amount));
    }
    
    updatePageTitle() {
        const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
        
        if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) ${originalTitle}`;
        } else {
            document.title = originalTitle;
        }
    }
    
    // ===== User Interactions =====
    
    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            
            if (dropdown.classList.contains('show')) {
                this.syncNotifications();
            }
        }
    }
    
    closeNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
    
    async handleNotificationClick(notificationItem) {
        const notificationId = notificationItem.dataset.notificationId;
        const actionUrl = notificationItem.dataset.actionUrl;
        
        // Mark as clicked
        await this.markAsClicked(notificationId);
        
        // Navigate to action URL if exists
        if (actionUrl && actionUrl !== 'null' && actionUrl !== '') {
            window.location.href = actionUrl;
        }
        
        // Close dropdown
        this.closeNotificationDropdown();
    }
    
    async markAsClicked(notificationId) {
        try {
            const response = await fetch('/api/NotificationController.php?action=mark-clicked', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notification_id: parseInt(notificationId)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update local notification
                const notification = this.notifications.find(n => n.id == notificationId);
                if (notification && !notification.read_at) {
                    notification.read_at = new Date().toISOString();
                    notification.clicked_at = new Date().toISOString();
                    notification.interaction_status = 'clicked';
                    this.decrementUnreadCount();
                    this.renderNotifications();
                }
            }
            
        } catch (error) {
            console.error('[Notifications] Error marking as clicked:', error);
        }
    }
    
    async markAllAsRead() {
        try {
            const response = await fetch('/api/NotificationController.php?action=mark-all-read', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update all local notifications
                this.notifications.forEach(notification => {
                    notification.read_at = new Date().toISOString();
                    notification.interaction_status = 'read';
                });
                
                this.updateUnreadCount(0);
                this.renderNotifications();
                this.showToast('Todas las notificaciones marcadas como leídas', 'success');
            }
            
        } catch (error) {
            console.error('[Notifications] Error marking all as read:', error);
            this.showToast('Error al marcar notificaciones como leídas', 'error');
        }
    }
    
    // ===== Browser Notifications =====
    
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('[Notifications] Permission:', permission);
        }
    }
    
    showBrowserNotification(notificationData) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(notificationData.title, {
                body: notificationData.body,
                icon: '/assets/img/logo-notification.png',
                badge: '/assets/img/logo-badge.png',
                tag: 'laburar-notification-' + notificationData.id,
                requireInteraction: notificationData.priority === 'urgent',
                silent: false
            });
            
            notification.onclick = () => {
                window.focus();
                if (notificationData.action_url) {
                    window.location.href = notificationData.action_url;
                }
                notification.close();
            };
            
            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);
        }
    }
    
    // ===== Service Worker & Push Notifications =====
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('[Notifications] Service Worker registered:', registration);
                
                // Register for push notifications
                await this.subscribeToPushNotifications(registration);
                
            } catch (error) {
                console.error('[Notifications] Service Worker registration failed:', error);
            }
        }
    }
    
    async subscribeToPushNotifications(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Replace with actual VAPID key
            });
            
            // Send subscription to server
            await this.savePushSubscription(subscription);
            
        } catch (error) {
            console.error('[Notifications] Push subscription failed:', error);
        }
    }
    
    async savePushSubscription(subscription) {
        try {
            const response = await fetch('/api/NotificationController.php?action=save-push-token', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: subscription.endpoint,
                    platform: 'web',
                    endpoint: subscription.endpoint,
                    p256dh_key: this.arrayBufferToBase64(subscription.getKey('p256dh')),
                    auth_key: this.arrayBufferToBase64(subscription.getKey('auth'))
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('[Notifications] Push subscription saved');
            }
            
        } catch (error) {
            console.error('[Notifications] Error saving push subscription:', error);
        }
    }
    
    // ===== Utility Methods =====
    
    async syncNotifications() {
        await this.updateUnreadCountFromServer();
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'get_unread_count'
            }));
        }
    }
    
    requestPendingNotifications() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'get_unread_count'
            }));
        }
    }
    
    startPeriodicSync() {
        // Sync every 30 seconds
        setInterval(() => {
            if (!document.hidden) {
                this.syncNotifications();
            }
        }, 30000);
        
        // Send ping every 60 seconds to keep WebSocket alive
        setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'ping'
                }));
            }
        }, 60000);
    }
    
    playNotificationSound() {
        try {
            const audio = new Audio('/assets/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore play errors (autoplay restrictions)
            });
        } catch (error) {
            // Ignore audio errors
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    
    getUserId() {
        const token = this.getAuthToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_id;
        } catch (error) {
            return null;
        }
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is authenticated
    const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (authToken) {
        window.notificationManager = new NotificationManager();
    }
});

// Export for manual initialization
window.NotificationManager = NotificationManager;