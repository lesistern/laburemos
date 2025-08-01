/**
 * Chat JavaScript Manager
 * LaburAR Complete Platform - Phase 6
 * 
 * Handles real-time chat functionality, WebSocket integration,
 * message rendering, file uploads, and typing indicators
 */

class ChatManager {
    constructor() {
        this.ws = null;
        this.currentConversationId = null;
        this.conversations = [];
        this.messages = {};
        this.typingUsers = {};
        this.isTyping = false;
        this.typingTimer = null;
        this.authToken = this.getAuthToken();
        this.userId = this.getUserId();
        this.unreadCount = 0;
        this.lastMessageId = null;
        this.isLoadingMessages = false;
        this.hasMoreMessages = true;
        
        this.init();
    }
    
    // ===== Initialization =====
    
    async init() {
        this.setupEventListeners();
        this.connectWebSocket();
        await this.loadConversations();
        this.setupFileUpload();
        this.setupMessageInput();
        this.startPeriodicUpdates();
    }
    
    setupEventListeners() {
        // Conversation selection
        document.addEventListener('click', (e) => {
            if (e.target.matches('.conversation-item')) {
                const conversationId = e.target.dataset.conversationId;
                this.selectConversation(conversationId);
            }
        });
        
        // Message input
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('#messageInput')) {
                this.handleMessageInput(e);
            }
        });
        
        // Send message button
        document.addEventListener('click', (e) => {
            if (e.target.matches('#sendMessageBtn')) {
                this.sendMessage();
            }
        });
        
        // File upload
        document.addEventListener('change', (e) => {
            if (e.target.matches('#fileInput')) {
                this.handleFileSelect(e.target.files);
            }
        });
        
        // Message actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.message-reaction-btn')) {
                this.handleReactionClick(e.target);
            }
            
            if (e.target.matches('.message-reply-btn')) {
                this.handleReplyClick(e.target);
            }
            
            if (e.target.matches('.message-delete-btn')) {
                this.handleDeleteClick(e.target);
            }
        });
        
        // Search
        document.addEventListener('input', (e) => {
            if (e.target.matches('#chatSearch')) {
                this.handleSearch(e.target.value);
            }
        });
        
        // New conversation
        document.addEventListener('click', (e) => {
            if (e.target.matches('#newChatBtn')) {
                this.showNewChatModal();
            }
        });
        
        // Scroll to load more messages
        document.addEventListener('scroll', (e) => {
            if (e.target.matches('#messagesContainer')) {
                this.handleMessagesScroll(e.target);
            }
        });
    }
    
    // ===== WebSocket Integration =====
    
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
                console.log('[Chat] WebSocket connected');
                this.authenticate();
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.ws.onclose = (event) => {
                console.log('[Chat] WebSocket disconnected:', event.code, event.reason);
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('[Chat] WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('[Chat] Failed to connect WebSocket:', error);
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
        setTimeout(() => {
            this.connectWebSocket();
        }, 5000);
    }
    
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('[Chat] Received:', message);
            
            switch (message.type) {
                case 'authenticated':
                    console.log('[Chat] Authenticated for user:', message.user_id);
                    this.joinChatRooms();
                    break;
                    
                case 'chat_message':
                    this.handleIncomingMessage(message.data.message);
                    break;
                    
                case 'typing_indicator':
                    this.handleTypingIndicator(message.data);
                    break;
                    
                case 'message_read':
                    this.handleMessageRead(message.data);
                    break;
                    
                case 'conversation_updated':
                    this.handleConversationUpdate(message.data);
                    break;
                    
                case 'error':
                    console.error('[Chat] Server error:', message.error);
                    break;
            }
            
        } catch (error) {
            console.error('[Chat] Error parsing WebSocket message:', error);
        }
    }
    
    joinChatRooms() {
        // Join rooms for all active conversations
        this.conversations.forEach(conversation => {
            this.joinRoom(`conversation_${conversation.id}`);
        });
    }
    
    joinRoom(room) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'join_room',
                room: room
            }));
        }
    }
    
    // ===== Conversation Management =====
    
    async loadConversations() {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/ChatController.php?action=conversations&limit=50', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.conversations = data.data.conversations;
                this.renderConversations();
                
                // Select first conversation if available
                if (this.conversations.length > 0 && !this.currentConversationId) {
                    this.selectConversation(this.conversations[0].id);
                }
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showError('Error al cargar las conversaciones');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderConversations() {
        const container = document.getElementById('conversationsList');
        if (!container) return;
        
        if (this.conversations.length === 0) {
            container.innerHTML = `
                <div class="chat-empty">
                    <i class="fas fa-comments"></i>
                    <h3>No hay conversaciones</h3>
                    <p>Comenzá un nuevo chat para empezar</p>
                    <button class="btn-primary" onclick="chatManager.showNewChatModal()">
                        <i class="fas fa-plus"></i>
                        Nuevo Chat
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.conversations
            .map(conversation => this.renderConversationItem(conversation))
            .join('');
    }
    
    renderConversationItem(conversation) {
        const isActive = conversation.id == this.currentConversationId;
        const unreadBadge = conversation.unread_count > 0 ? 
            `<span class="unread-badge">${conversation.unread_count}</span>` : '';
        
        const participantNames = conversation.other_participants || 'Chat';
        const lastMessage = conversation.last_message_preview || 'No hay mensajes';
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                 data-conversation-id="${conversation.id}">
                <div class="conversation-avatar">
                    ${this.getConversationAvatar(conversation)}
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <h4 class="conversation-title">${this.escapeHtml(participantNames)}</h4>
                        <span class="conversation-time">${conversation.formatted_last_message}</span>
                    </div>
                    <div class="conversation-preview">
                        <span class="last-message">${this.escapeHtml(lastMessage)}</span>
                        ${unreadBadge}
                    </div>
                </div>
                <div class="conversation-status">
                    ${conversation.type === 'project' ? '<i class="fas fa-project-diagram"></i>' : ''}
                    ${conversation.type === 'group' ? '<i class="fas fa-users"></i>' : ''}
                </div>
            </div>
        `;
    }
    
    getConversationAvatar(conversation) {
        if (conversation.type === 'group') {
            return '<i class="fas fa-users"></i>';
        } else if (conversation.type === 'project') {
            return '<i class="fas fa-project-diagram"></i>';
        } else {
            // For private chats, use first letter of participant name
            const name = conversation.other_participants || 'U';
            return name.charAt(0).toUpperCase();
        }
    }
    
    async selectConversation(conversationId) {
        if (this.currentConversationId === conversationId) return;
        
        this.currentConversationId = conversationId;
        this.hasMoreMessages = true;
        this.lastMessageId = null;
        
        // Update UI
        this.updateConversationSelection();
        
        // Load conversation details and messages
        await Promise.all([
            this.loadConversationDetails(conversationId),
            this.loadMessages(conversationId, true)
        ]);
        
        // Mark messages as read
        await this.markMessagesAsRead(conversationId);
        
        // Join WebSocket room
        this.joinRoom(`conversation_${conversationId}`);
        
        // Focus message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }
    
    updateConversationSelection() {
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-conversation-id="${this.currentConversationId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }
    
    async loadConversationDetails(conversationId) {
        try {
            const response = await fetch(`/api/ChatController.php?action=conversation-details&conversation_id=${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.renderConversationHeader(data.data.conversation);
            }
            
        } catch (error) {
            console.error('Error loading conversation details:', error);
        }
    }
    
    renderConversationHeader(conversation) {
        const header = document.getElementById('chatHeader');
        if (!header) return;
        
        const participantNames = conversation.participants
            .filter(p => p.user_id != this.userId && p.status === 'active')
            .map(p => `${p.first_name} ${p.last_name}`)
            .join(', ') || 'Chat';
        
        header.innerHTML = `
            <div class="chat-header-info">
                <div class="chat-avatar">
                    ${this.getConversationAvatar(conversation)}
                </div>
                <div class="chat-details">
                    <h3 class="chat-title">${this.escapeHtml(participantNames)}</h3>
                    <div class="chat-status">
                        <span class="participant-count">${conversation.participant_count} participantes</span>
                        <div class="typing-indicator" id="typingIndicator" style="display: none;">
                            <span class="typing-text"></span>
                            <div class="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn" onclick="chatManager.showConversationInfo()">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button class="chat-action-btn" onclick="chatManager.searchInConversation()">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        `;
    }
    
    // ===== Message Management =====
    
    async loadMessages(conversationId, reset = false) {
        if (this.isLoadingMessages || (!this.hasMoreMessages && !reset)) return;
        
        this.isLoadingMessages = true;
        
        try {
            const params = new URLSearchParams({
                action: 'messages',
                conversation_id: conversationId,
                limit: 50
            });
            
            if (!reset && this.lastMessageId) {
                params.append('before_message_id', this.lastMessageId);
            }
            
            const response = await fetch(`/api/ChatController.php?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const messages = data.data.messages;
                
                if (reset) {
                    this.messages[conversationId] = messages;
                } else {
                    this.messages[conversationId] = [
                        ...messages,
                        ...(this.messages[conversationId] || [])
                    ];
                }
                
                this.hasMoreMessages = data.data.has_more;
                
                if (messages.length > 0) {
                    this.lastMessageId = messages[0].id; // First message (oldest)
                }
                
                this.renderMessages(conversationId, reset);
            }
            
        } catch (error) {
            console.error('Error loading messages:', error);
            this.showError('Error al cargar los mensajes');
        } finally {
            this.isLoadingMessages = false;
        }
    }
    
    renderMessages(conversationId, scrollToBottom = false) {
        if (conversationId !== this.currentConversationId) return;
        
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        const messages = this.messages[conversationId] || [];
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="messages-empty">
                    <i class="fas fa-comment"></i>
                    <p>No hay mensajes en esta conversación</p>
                    <p>Envía el primer mensaje para comenzar</p>
                </div>
            `;
            return;
        }
        
        const previousScrollHeight = container.scrollHeight;
        const previousScrollTop = container.scrollTop;
        
        container.innerHTML = messages
            .map(message => this.renderMessage(message))
            .join('');
        
        if (scrollToBottom) {
            container.scrollTop = container.scrollHeight;
        } else {
            // Maintain scroll position when loading older messages
            container.scrollTop = container.scrollHeight - previousScrollHeight + previousScrollTop;
        }
    }
    
    renderMessage(message) {
        const isOwn = message.sender_id == this.userId;
        const showAvatar = !isOwn;
        const messageClass = isOwn ? 'message-own' : 'message-other';
        
        let contentHtml = '';
        
        switch (message.message_type) {
            case 'text':
                contentHtml = `<div class="message-text">${this.escapeHtml(message.content)}</div>`;
                break;
            case 'image':
                contentHtml = `
                    <div class="message-image">
                        <img src="${message.attachment_url}" alt="${message.attachment_name}" onclick="chatManager.showImageModal('${message.attachment_url}')">
                    </div>
                `;
                break;
            case 'file':
                contentHtml = `
                    <div class="message-file">
                        <i class="fas fa-file"></i>
                        <div class="file-info">
                            <div class="file-name">${this.escapeHtml(message.attachment_name)}</div>
                            <div class="file-size">${this.formatFileSize(message.attachment_size)}</div>
                        </div>
                        <a href="${message.attachment_url}" class="file-download" download>
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                `;
                break;
            case 'deleted':
                contentHtml = `<div class="message-deleted"><i>Mensaje eliminado</i></div>`;
                break;
            default:
                contentHtml = `<div class="message-text">${this.escapeHtml(message.content || '')}</div>`;
        }
        
        const replyHtml = message.reply_content ? `
            <div class="message-reply">
                <div class="reply-author">${this.escapeHtml(message.reply_author_name)}</div>
                <div class="reply-content">${this.escapeHtml(message.reply_content.substring(0, 100))}</div>
            </div>
        ` : '';
        
        const reactionsHtml = this.renderMessageReactions(message.reactions);
        
        return `
            <div class="message ${messageClass}" data-message-id="${message.id}">
                ${showAvatar ? `
                    <div class="message-avatar">
                        ${message.avatar_url ? 
                            `<img src="${message.avatar_url}" alt="${message.first_name}">` :
                            `<span>${message.first_name.charAt(0)}</span>`
                        }
                    </div>
                ` : ''}
                <div class="message-content">
                    ${!isOwn ? `<div class="message-author">${this.escapeHtml(message.first_name)} ${this.escapeHtml(message.last_name)}</div>` : ''}
                    ${replyHtml}
                    ${contentHtml}
                    ${reactionsHtml}
                    <div class="message-footer">
                        <span class="message-time">${message.formatted_time}</span>
                        ${isOwn ? this.renderMessageStatus(message) : ''}
                        <div class="message-actions">
                            <button class="message-action-btn message-reaction-btn" data-message-id="${message.id}">
                                <i class="fas fa-smile"></i>
                            </button>
                            <button class="message-action-btn message-reply-btn" data-message-id="${message.id}">
                                <i class="fas fa-reply"></i>
                            </button>
                            ${isOwn ? `
                                <button class="message-action-btn message-delete-btn" data-message-id="${message.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderMessageReactions(reactions) {
        if (!reactions || Object.keys(reactions).length === 0) {
            return '';
        }
        
        const reactionItems = Object.entries(reactions)
            .map(([emoji, userIds]) => `
                <span class="reaction-item ${userIds.includes(this.userId) ? 'own-reaction' : ''}" 
                      data-emoji="${emoji}" onclick="chatManager.toggleReaction('${emoji}', this)">
                    ${emoji} ${userIds.length}
                </span>
            `)
            .join('');
        
        return `<div class="message-reactions">${reactionItems}</div>`;
    }
    
    renderMessageStatus(message) {
        const readByCount = message.read_by ? message.read_by.length : 0;
        
        let statusIcon = 'fas fa-check';
        let statusText = 'Enviado';
        
        if (readByCount > 0) {
            statusIcon = 'fas fa-check-double';
            statusText = 'Leído';
        }
        
        return `
            <span class="message-status" title="${statusText}">
                <i class="${statusIcon}"></i>
            </span>
        `;
    }
    
    async sendMessage(content = null, attachmentData = null) {
        const messageInput = document.getElementById('messageInput');
        const messageContent = content || (messageInput ? messageInput.value.trim() : '');
        
        if (!messageContent && !attachmentData) return;
        
        if (!this.currentConversationId) {
            this.showError('Selecciona una conversación');
            return;
        }
        
        try {
            const messageData = {
                conversation_id: this.currentConversationId,
                content: messageContent,
                message_type: attachmentData ? attachmentData.type : 'text'
            };
            
            if (attachmentData) {
                messageData.attachment_url = attachmentData.url;
                messageData.attachment_name = attachmentData.name;
            }
            
            const response = await fetch('/api/ChatController.php?action=send-message', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear input
                if (messageInput) {
                    messageInput.value = '';
                }
                
                // Add message to local state
                this.addMessageToConversation(this.currentConversationId, data.data.message);
                
                // Stop typing indicator
                this.setTyping(false);
                
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Error al enviar el mensaje');
        }
    }
    
    addMessageToConversation(conversationId, message) {
        if (!this.messages[conversationId]) {
            this.messages[conversationId] = [];
        }
        
        this.messages[conversationId].push(message);
        
        if (conversationId === this.currentConversationId) {
            this.renderMessages(conversationId, true);
        }
        
        // Update conversation list
        this.updateConversationPreview(conversationId, message);
    }
    
    updateConversationPreview(conversationId, message) {
        const conversation = this.conversations.find(c => c.id == conversationId);
        if (conversation) {
            conversation.last_message_at = message.created_at;
            conversation.last_message_preview = message.content || 'Archivo adjunto';
            conversation.formatted_last_message = message.formatted_time;
            
            // Re-render conversations
            this.renderConversations();
        }
    }
    
    // ===== Message Input Handling =====
    
    setupMessageInput() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;
        
        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        });
    }
    
    handleMessageInput(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        } else {
            // Handle typing indicator
            this.handleTypingInput();
        }
    }
    
    handleTypingInput() {
        if (!this.currentConversationId) return;
        
        if (!this.isTyping) {
            this.setTyping(true);
        }
        
        // Reset typing timer
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            this.setTyping(false);
        }, 3000);
    }
    
    async setTyping(isTyping) {
        if (this.isTyping === isTyping) return;
        
        this.isTyping = isTyping;
        
        try {
            await fetch('/api/ChatController.php?action=set-typing', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: this.currentConversationId,
                    is_typing: isTyping
                })
            });
        } catch (error) {
            console.error('Error setting typing indicator:', error);
        }
    }
    
    // ===== Real-time Event Handlers =====
    
    handleIncomingMessage(message) {
        this.addMessageToConversation(message.conversation_id, message);
        
        // Play notification sound if not current conversation
        if (message.conversation_id != this.currentConversationId) {
            this.playNotificationSound();
            this.updateUnreadCount();
        }
    }
    
    handleTypingIndicator(data) {
        if (data.conversation_id == this.currentConversationId) {
            this.updateTypingIndicator(data.user_id, data.is_typing);
        }
    }
    
    updateTypingIndicator(userId, isTyping) {
        if (userId == this.userId) return; // Ignore own typing
        
        const indicator = document.getElementById('typingIndicator');
        if (!indicator) return;
        
        if (isTyping) {
            this.typingUsers[userId] = true;
        } else {
            delete this.typingUsers[userId];
        }
        
        const typingUserIds = Object.keys(this.typingUsers);
        
        if (typingUserIds.length > 0) {
            const typingText = typingUserIds.length === 1 ? 
                'está escribiendo...' : 
                `${typingUserIds.length} personas están escribiendo...`;
            
            indicator.querySelector('.typing-text').textContent = typingText;
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }
    
    // ===== File Upload =====
    
    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const attachBtn = document.getElementById('attachBtn');
        
        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        // Drag and drop support
        const chatArea = document.getElementById('messagesContainer');
        if (chatArea) {
            chatArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                chatArea.classList.add('drag-over');
            });
            
            chatArea.addEventListener('dragleave', () => {
                chatArea.classList.remove('drag-over');
            });
            
            chatArea.addEventListener('drop', (e) => {
                e.preventDefault();
                chatArea.classList.remove('drag-over');
                this.handleFileSelect(e.dataTransfer.files);
            });
        }
    }
    
    async handleFileSelect(files) {
        if (!files || files.length === 0) return;
        
        if (!this.currentConversationId) {
            this.showError('Selecciona una conversación');
            return;
        }
        
        for (const file of files) {
            await this.uploadFile(file);
        }
    }
    
    async uploadFile(file) {
        try {
            this.showFileUploadProgress(file.name, 0);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('conversation_id', this.currentConversationId);
            
            const response = await fetch('/api/ChatController.php?action=upload-file', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.hideFileUploadProgress();
                
                // Send message with file attachment
                const attachmentData = {
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    url: data.data.file_url,
                    name: data.data.original_name
                };
                
                await this.sendMessage('', attachmentData);
                
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error uploading file:', error);
            this.hideFileUploadProgress();
            this.showError('Error al subir el archivo');
        }
    }
    
    showFileUploadProgress(fileName, progress) {
        // Implementation for showing upload progress
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.innerHTML = `
                <div class="upload-item">
                    <div class="upload-info">
                        <i class="fas fa-file"></i>
                        <span>${this.escapeHtml(fileName)}</span>
                    </div>
                    <div class="upload-progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
            progressContainer.style.display = 'block';
        }
    }
    
    hideFileUploadProgress() {
        const progressContainer = document.getElementById('uploadProgress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }
    
    // ===== Message Actions =====
    
    async toggleReaction(emoji, element) {
        const messageId = element.closest('.message').dataset.messageId;
        const hasReaction = element.classList.contains('own-reaction');
        
        try {
            const action = hasReaction ? 'remove-reaction' : 'add-reaction';
            
            await fetch(`/api/ChatController.php?action=${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message_id: messageId,
                    emoji: emoji
                })
            });
            
            // Toggle local state
            element.classList.toggle('own-reaction');
            
        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    }
    
    async markMessagesAsRead(conversationId) {
        try {
            await fetch('/api/ChatController.php?action=mark-read', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: conversationId
                })
            });
            
            // Update local conversation state
            const conversation = this.conversations.find(c => c.id == conversationId);
            if (conversation) {
                conversation.unread_count = 0;
                this.renderConversations();
            }
            
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
    
    // ===== Utility Methods =====
    
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
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    playNotificationSound() {
        try {
            const audio = new Audio('/assets/sounds/message.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore play errors
            });
        } catch (error) {
            // Ignore audio errors
        }
    }
    
    showLoading(show) {
        const loader = document.getElementById('chatLoadingIndicator');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
    
    showError(message) {
        if (window.notificationManager) {
            window.notificationManager.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
    
    showSuccess(message) {
        if (window.notificationManager) {
            window.notificationManager.showToast(message, 'success');
        }
    }
    
    updateUnreadCount() {
        // Update global unread count
        this.unreadCount = this.conversations.reduce((total, conv) => total + conv.unread_count, 0);
    }
    
    startPeriodicUpdates() {
        // Update conversations every 30 seconds
        setInterval(() => {
            if (!document.hidden) {
                this.loadConversations();
            }
        }, 30000);
    }
    
    handleMessagesScroll(container) {
        // Load more messages when scrolled to top
        if (container.scrollTop === 0 && this.hasMoreMessages && !this.isLoadingMessages) {
            this.loadMessages(this.currentConversationId, false);
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is authenticated and on chat page
    const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (authToken && (window.location.pathname.includes('chat') || document.getElementById('chatContainer'))) {
        window.chatManager = new ChatManager();
    }
});

// Export for manual initialization
window.ChatManager = ChatManager;