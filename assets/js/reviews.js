/**
 * Reviews JavaScript Manager
 * LaburAR Complete Platform - Phase 5
 * 
 * Handles review creation, voting, moderation,
 * star ratings, and reputation display
 */

class ReviewManager {
    constructor() {
        this.currentReviews = [];
        this.userReputation = null;
        this.reviewFilters = {
            rating: 'all',
            sort: 'newest',
            type: 'all'
        };
        
        this.init();
    }
    
    // ===== Initialization =====
    
    async init() {
        this.setupEventListeners();
        this.initializeStarRatings();
        await this.loadInitialData();
    }
    
    setupEventListeners() {
        // Star rating interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.rating-stars.interactive .star')) {
                this.handleStarClick(e.target);
            }
        });
        
        // Review voting
        document.addEventListener('click', (e) => {
            if (e.target.matches('.helpful-button')) {
                this.handleVoteClick(e.target);
            }
        });
        
        // Review actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.dataset.action;
                this.handleReviewAction(action, e.target);
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#reviewForm')) {
                e.preventDefault();
                this.submitReview(new FormData(e.target));
            }
            
            if (e.target.matches('#responseForm')) {
                e.preventDefault();
                this.submitResponse(new FormData(e.target));
            }
        });
        
        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('.filter-select')) {
                this.handleFilterChange(e.target);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('.filter-chip')) {
                this.handleChipFilter(e.target);
            }
        });
        
        // Moderation actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-approve')) {
                this.moderateReview(e.target.dataset.reviewId, 'approve');
            }
            
            if (e.target.matches('.btn-reject')) {
                this.moderateReview(e.target.dataset.reviewId, 'reject');
            }
        });
    }
    
    initializeStarRatings() {
        document.querySelectorAll('.rating-stars').forEach(container => {
            const rating = parseFloat(container.dataset.rating || 0);
            this.renderStars(container, rating);
        });
    }
    
    // ===== Data Loading =====
    
    async loadInitialData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('user_id');
            const projectId = urlParams.get('project_id');
            
            if (userId) {
                await Promise.all([
                    this.loadUserReviews(userId),
                    this.loadUserReputation(userId)
                ]);
            } else if (projectId) {
                await this.loadProjectReviews(projectId);
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Error al cargar los datos de reviews');
        }
    }
    
    async loadUserReviews(userId, asReviewee = true) {
        try {
            const response = await fetch(`/api/ReviewController.php?action=user-reviews&user_id=${userId}&as_reviewee=${asReviewee}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentReviews = data.data.reviews;
                this.renderReviews();
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error loading user reviews:', error);
            this.showError('Error al cargar las reviews del usuario');
        }
    }
    
    async loadProjectReviews(projectId) {
        try {
            const response = await fetch(`/api/ReviewController.php?action=project-reviews&project_id=${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentReviews = data.data.reviews;
                this.renderReviews();
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error loading project reviews:', error);
            this.showError('Error al cargar las reviews del proyecto');
        }
    }
    
    async loadUserReputation(userId) {
        try {
            const response = await fetch(`/api/ReviewController.php?action=user-reputation&user_id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.userReputation = data.data.reputation;
                this.renderReputation();
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error loading user reputation:', error);
            this.showError('Error al cargar la reputación del usuario');
        }
    }
    
    // ===== Star Rating System =====
    
    renderStars(container, rating, interactive = false) {
        const maxStars = 5;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        container.innerHTML = '';
        container.className = `rating-stars ${interactive ? 'interactive' : ''}`;
        
        for (let i = 1; i <= maxStars; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.dataset.rating = i;
            star.innerHTML = '★';
            
            if (i <= fullStars) {
                star.classList.add('filled');
            } else if (i === fullStars + 1 && hasHalfStar) {
                star.classList.add('half-filled');
            }
            
            container.appendChild(star);
        }
        
        if (interactive) {
            this.setupStarInteraction(container);
        }
    }
    
    setupStarInteraction(container) {
        const stars = container.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            star.addEventListener('mouseenter', () => {
                this.highlightStars(stars, index + 1);
            });
            
            star.addEventListener('mouseleave', () => {
                const currentRating = container.dataset.currentRating || 0;
                this.highlightStars(stars, currentRating);
            });
        });
    }
    
    highlightStars(stars, rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
    }
    
    handleStarClick(star) {
        const container = star.closest('.rating-stars');
        const rating = parseInt(star.dataset.rating);
        const inputName = container.dataset.inputName;
        
        container.dataset.currentRating = rating;
        this.highlightStars(container.querySelectorAll('.star'), rating);
        
        // Update hidden input if exists
        if (inputName) {
            const input = document.querySelector(`input[name="${inputName}"]`);
            if (input) input.value = rating;
        }
        
        // Trigger change event
        container.dispatchEvent(new CustomEvent('ratingChange', {
            detail: { rating, inputName }
        }));
    }
    
    // ===== Review Rendering =====
    
    renderReviews() {
        const container = document.getElementById('reviewsList');
        if (!container) return;
        
        if (this.currentReviews.length === 0) {
            container.innerHTML = `
                <div class="review-empty">
                    <div class="review-empty-icon">💭</div>
                    <h3>No hay reviews disponibles</h3>
                    <p>Aún no se han publicado reviews para mostrar</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.currentReviews
            .map(review => this.renderReviewCard(review))
            .join('');
    }
    
    renderReviewCard(review) {
        const hasResponse = review.response && review.response.trim();
        const isModeration = this.isAdminUser();
        
        return `
            <div class="review-card" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="review-author">
                        <div class="review-avatar">
                            ${review.reviewer_avatar_url ? 
                                `<img src="${review.reviewer_avatar_url}" alt="${review.reviewer_name}">` :
                                this.getInitials(review.reviewer_name)
                            }
                        </div>
                        <div class="review-author-info">
                            <h4>${escapeHtml(review.reviewer_name)}</h4>
                            <div class="review-date">${review.formatted_created_at}</div>
                        </div>
                    </div>
                    <div class="review-meta">
                        ${review.project_title ? `
                            <div class="review-project">${escapeHtml(review.project_title)}</div>
                        ` : ''}
                        ${review.moderation_status === 'approved' ? `
                            <div class="review-verified">
                                <i class="fas fa-check-circle"></i>
                                Verificado
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="review-content">
                    <div class="review-rating">
                        <div class="rating-stars" data-rating="${review.overall_rating}"></div>
                        <span class="rating-number">${review.formatted_overall_rating}</span>
                    </div>
                    
                    ${review.title ? `
                        <h3 class="review-title">${escapeHtml(review.title)}</h3>
                    ` : ''}
                    
                    ${review.comment ? `
                        <p class="review-text">${escapeHtml(review.comment)}</p>
                    ` : ''}
                    
                    ${this.hasDetailedRatings(review) ? this.renderDetailedRatings(review) : ''}
                    
                    ${hasResponse ? `
                        <div class="review-response">
                            <div class="response-header">
                                <i class="fas fa-reply"></i>
                                Respuesta del freelancer
                                <span class="response-date">${review.formatted_response_date}</span>
                            </div>
                            <div class="response-text">${escapeHtml(review.response)}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="review-footer">
                    <div class="review-helpful">
                        <span>¿Te resultó útil?</span>
                        <button class="helpful-button ${review.user_voted === 'helpful' ? 'voted' : ''}" 
                                data-review-id="${review.id}" data-vote="helpful">
                            <i class="fas fa-thumbs-up"></i>
                            Sí (${review.helpful_votes})
                        </button>
                        <button class="helpful-button ${review.user_voted === 'not_helpful' ? 'voted' : ''}" 
                                data-review-id="${review.id}" data-vote="not_helpful">
                            <i class="fas fa-thumbs-down"></i>
                            No
                        </button>
                    </div>
                    
                    <div class="review-actions">
                        ${review.can_respond && !hasResponse ? `
                            <button class="btn-secondary" data-action="respond" data-review-id="${review.id}">
                                <i class="fas fa-reply"></i>
                                Responder
                            </button>
                        ` : ''}
                        
                        <button class="btn-secondary" data-action="flag" data-review-id="${review.id}">
                            <i class="fas fa-flag"></i>
                            Reportar
                        </button>
                    </div>
                </div>
                
                ${isModeration ? this.renderModerationPanel(review) : ''}
            </div>
        `;
    }
    
    hasDetailedRatings(review) {
        return review.communication_rating || review.quality_rating || 
               review.timeliness_rating || review.professionalism_rating;
    }
    
    renderDetailedRatings(review) {
        const ratings = [
            { label: 'Comunicación', value: review.communication_rating },
            { label: 'Calidad', value: review.quality_rating },
            { label: 'Puntualidad', value: review.timeliness_rating },
            { label: 'Profesionalismo', value: review.professionalism_rating }
        ].filter(r => r.value);
        
        if (ratings.length === 0) return '';
        
        return `
            <div class="review-ratings">
                ${ratings.map(rating => `
                    <div class="rating-item">
                        <span class="rating-label">${rating.label}</span>
                        <div class="rating-stars small" data-rating="${rating.value}"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderModerationPanel(review) {
        return `
            <div class="moderation-panel">
                <div class="moderation-header">
                    <div class="moderation-status ${review.moderation_status}">
                        ${this.getModerationStatusLabel(review.moderation_status)}
                    </div>
                    <div class="fraud-score">
                        Fraud Score: ${(review.fraud_score * 100).toFixed(1)}%
                    </div>
                </div>
                
                ${review.moderation_status === 'pending' || review.moderation_status === 'flagged' ? `
                    <div class="moderation-actions">
                        <button class="btn-approve" data-review-id="${review.id}">
                            <i class="fas fa-check"></i>
                            Aprobar
                        </button>
                        <button class="btn-reject" data-review-id="${review.id}">
                            <i class="fas fa-times"></i>
                            Rechazar
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // ===== Reputation Display =====
    
    renderReputation() {
        if (!this.userReputation) return;
        
        const container = document.getElementById('reputationContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="reputation-card">
                <div class="reputation-header">
                    <div class="reputation-score">${this.userReputation.formatted_reputation_score}</div>
                    <p class="reputation-label">Puntuación de Reputación</p>
                </div>
                
                <div class="reputation-stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.userReputation.formatted_average_rating}</div>
                        <div class="stat-label">Rating Promedio</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.userReputation.total_reviews}</div>
                        <div class="stat-label">Total Reviews</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.userReputation.formatted_recommendation_rate}</div>
                        <div class="stat-label">Recomendaciones</div>
                    </div>
                </div>
                
                ${this.renderRatingBreakdown()}
                ${this.renderBadges()}
            </div>
        `;
        
        // Re-initialize star ratings in reputation display
        container.querySelectorAll('.rating-stars').forEach(stars => {
            const rating = parseFloat(stars.dataset.rating);
            this.renderStars(stars, rating);
        });
    }
    
    renderRatingBreakdown() {
        if (!this.userReputation.rating_distribution) return '';
        
        return `
            <div class="rating-breakdown">
                <h3>Distribución de Ratings</h3>
                ${[5, 4, 3, 2, 1].map(rating => `
                    <div class="rating-bar">
                        <div class="rating-bar-label">
                            <span>${rating}</span>
                            <div class="rating-stars small" data-rating="${rating}"></div>
                        </div>
                        <div class="rating-bar-progress">
                            <div class="rating-bar-fill" style="width: ${this.userReputation.rating_distribution[rating]}%"></div>
                        </div>
                        <div class="rating-bar-count">${this.userReputation.rating_distribution[rating]}%</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderBadges() {
        if (!this.userReputation.badges || this.userReputation.badges.length === 0) return '';
        
        const badges = JSON.parse(this.userReputation.badges);
        
        return `
            <div class="badges-section">
                <h3>Insignias</h3>
                <div class="badges-grid">
                    ${badges.map(badge => `
                        <div class="badge ${this.getBadgeClass(badge)}">
                            <i class="badge-icon ${this.getBadgeIcon(badge)}"></i>
                            ${this.getBadgeLabel(badge)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // ===== Review Actions =====
    
    async submitReview(formData) {
        try {
            this.showLoading(true);
            
            const reviewData = {
                action: 'create-review',
                project_id: formData.get('project_id'),
                reviewee_id: formData.get('reviewee_id'),
                overall_rating: parseFloat(formData.get('overall_rating')),
                communication_rating: parseFloat(formData.get('communication_rating')) || null,
                quality_rating: parseFloat(formData.get('quality_rating')) || null,
                timeliness_rating: parseFloat(formData.get('timeliness_rating')) || null,
                professionalism_rating: parseFloat(formData.get('professionalism_rating')) || null,
                title: formData.get('title'),
                comment: formData.get('comment'),
                would_recommend: formData.get('would_recommend') === 'on',
                would_work_again: formData.get('would_work_again') === 'on'
            };
            
            const response = await fetch('/api/ReviewController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Review enviada exitosamente');
                document.getElementById('reviewForm').reset();
                await this.loadInitialData(); // Reload reviews
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error submitting review:', error);
            this.showError('Error al enviar la review: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleVoteClick(button) {
        try {
            const reviewId = button.dataset.reviewId;
            const voteType = button.dataset.vote;
            
            const response = await fetch('/api/ReviewController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'vote-review',
                    review_id: reviewId,
                    vote_type: voteType
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update button states
                const reviewCard = button.closest('.review-card');
                const buttons = reviewCard.querySelectorAll('.helpful-button');
                buttons.forEach(btn => btn.classList.remove('voted'));
                button.classList.add('voted');
                
                this.showSuccess('Voto registrado');
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error voting on review:', error);
            this.showError('Error al votar: ' + error.message);
        }
    }
    
    async moderateReview(reviewId, action) {
        try {
            const reason = prompt(`Ingresá la razón para ${action === 'approve' ? 'aprobar' : 'rechazar'} esta review:`);
            if (!reason && action === 'reject') return;
            
            const response = await fetch('/api/ReviewController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'moderate-review',
                    review_id: reviewId,
                    moderation_action: action,
                    reason: reason
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess(`Review ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`);
                await this.loadInitialData(); // Reload reviews
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error moderating review:', error);
            this.showError('Error en moderación: ' + error.message);
        }
    }
    
    // ===== Helper Methods =====
    
    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    
    isAdminUser() {
        const token = this.getAuthToken();
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_type === 'admin';
        } catch (error) {
            return false;
        }
    }
    
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    getBadgeClass(badge) {
        const classMap = {
            'elite_expert': 'elite',
            'legendary_master': 'elite',
            'trusted_professional': 'trusted',
            'rising_star': 'verified'
        };
        return classMap[badge] || '';
    }
    
    getBadgeIcon(badge) {
        const iconMap = {
            'new_user': 'fas fa-seedling',
            'rising_star': 'fas fa-star',
            'trusted_professional': 'fas fa-shield-alt',
            'elite_expert': 'fas fa-crown',
            'legendary_master': 'fas fa-trophy',
            'perfect_rating': 'fas fa-gem',
            'highly_recommended': 'fas fa-thumbs-up',
            'consistent_quality': 'fas fa-medal'
        };
        return iconMap[badge] || 'fas fa-award';
    }
    
    getBadgeLabel(badge) {
        const labelMap = {
            'new_user': 'Nuevo Usuario',
            'rising_star': 'Estrella Emergente',
            'trusted_professional': 'Profesional Confiable',
            'elite_expert': 'Experto Elite',
            'legendary_master': 'Maestro Legendario',
            'perfect_rating': 'Rating Perfecto',
            'highly_recommended': 'Altamente Recomendado',
            'consistent_quality': 'Calidad Consistente'
        };
        return labelMap[badge] || badge.replace('_', ' ');
    }
    
    getModerationStatusLabel(status) {
        const labelMap = {
            'pending': 'Pendiente',
            'approved': 'Aprobado',
            'rejected': 'Rechazado',
            'flagged': 'Marcado'
        };
        return labelMap[status] || status;
    }
    
    showLoading(show) {
        const loader = document.getElementById('reviewLoadingIndicator');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// ===== Utility Functions =====

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== Auto-initialization =====

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reviewsContainer') || document.getElementById('reputationContainer')) {
        window.reviewManager = new ReviewManager();
    }
});