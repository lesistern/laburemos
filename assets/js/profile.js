/**
 * Profile Management JavaScript
 * LaburAR Complete Platform
 * 
 * Interactive profile pages with portfolio management,
 * skills editing, and real-time updates
 */

class ProfileManager {
    constructor() {
        this.apiBase = '/Laburar/api';
        this.currentUser = null;
        this.isOwner = false;
        this.profileData = null;
        this.editMode = false;
        
        this.init();
    }
    
    init() {
        this.loadProfile();
        this.initEventListeners();
        this.initTabs();
        this.initModals();
        this.setupFileUploads();
    }
    
    // ===== Profile Loading =====
    async loadProfile() {
        try {
            this.showLoading();
            
            // Get user ID from URL or current user
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('user_id');
            
            let endpoint = `${this.apiBase}/ProfileController.php?action=get-profile`;
            if (userId) {
                endpoint = `${this.apiBase}/ProfileController.php?action=get-public-profile&user_id=${userId}`;
            }
            
            const response = await this.makeAuthenticatedRequest(endpoint);
            
            if (response.success) {
                this.profileData = response.data;
                this.isOwner = !userId; // If no user_id in URL, it's the owner's profile
                this.renderProfile();
                this.loadPortfolio();
            } else {
                this.showError('Error loading profile: ' + response.error);
            }
        } catch (error) {
            console.error('Profile loading error:', error);
            this.showError('Failed to load profile');
        }
    }
    
    renderProfile() {
        const profile = this.profileData;
        
        // Update basic info
        this.updateElement('.profile-name', profile.user.first_name + ' ' + profile.user.last_name);
        this.updateElement('.profile-title', this.getProfileTitle(profile));
        this.updateElement('.profile-location', this.getLocation(profile));
        
        // Update avatar
        if (profile.user.avatar_url) {
            this.updateElement('.avatar-image', '', 'src', profile.user.avatar_url);
        }
        
        // Update status
        this.updateStatus(profile.user.last_activity);
        
        // Update stats
        this.updateStats(profile);
        
        // Update rating
        this.updateRating(profile);
        
        // Update skills
        this.updateSkills(profile.skills || []);
        
        // Update completeness
        if (profile.completeness) {
            this.updateCompleteness(profile.completeness);
        }
        
        // Update about section
        this.updateAboutSection(profile);
        
        // Show/hide owner-only elements
        this.toggleOwnerElements();
        
        this.hideLoading();
    }
    
    // ===== Event Listeners =====
    initEventListeners() {
        // Edit profile button
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-edit-profile')) {
                this.openEditModal();
            }
        });
        
        // Avatar upload
        document.addEventListener('change', (e) => {
            if (e.target.matches('#avatarUpload')) {
                this.handleAvatarUpload(e.target.files[0]);
            }
        });
        
        // Skills management
        document.addEventListener('click', (e) => {
            if (e.target.matches('.skills-edit')) {
                this.openSkillsModal();
            }
        });
        
        // Portfolio actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.portfolio-add')) {
                this.openPortfolioModal();
            } else if (e.target.matches('.portfolio-edit')) {
                const itemId = e.target.dataset.itemId;
                this.openPortfolioModal(itemId);
            } else if (e.target.matches('.portfolio-delete')) {
                const itemId = e.target.dataset.itemId;
                this.deletePortfolioItem(itemId);
            }
        });
        
        // Contact buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-contact')) {
                this.openContactModal();
            } else if (e.target.matches('.btn-hire')) {
                this.openHireModal();
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#editProfileForm')) {
                e.preventDefault();
                this.saveProfile(e.target);
            } else if (e.target.matches('#skillsForm')) {
                e.preventDefault();
                this.saveSkills(e.target);
            } else if (e.target.matches('#portfolioForm')) {
                e.preventDefault();
                this.savePortfolioItem(e.target);
            }
        });
    }
    
    // ===== Tab Management =====
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Update active states
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                // Load tab content if needed
                this.loadTabContent(targetTab);
            });
        });
    }
    
    loadTabContent(tabName) {
        switch (tabName) {
            case 'portfolio':
                this.loadPortfolio();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'activity':
                this.loadActivity();
                break;
        }
    }
    
    // ===== Portfolio Management =====
    async loadPortfolio() {
        try {
            const userId = this.profileData?.user?.id;
            if (!userId) return;
            
            let endpoint = `${this.apiBase}/ProfileController.php?action=get-portfolio`;
            if (!this.isOwner) {
                endpoint = `${this.apiBase}/ProfileController.php?action=get-public-portfolio&user_id=${userId}`;
            }
            
            const response = await this.makeAuthenticatedRequest(endpoint);
            
            if (response.success) {
                this.renderPortfolio(response.data.portfolio);
            }
        } catch (error) {
            console.error('Portfolio loading error:', error);
        }
    }
    
    renderPortfolio(portfolioItems) {
        const container = document.querySelector('.portfolio-grid');
        if (!container) return;
        
        if (!portfolioItems || portfolioItems.length === 0) {
            container.innerHTML = this.getEmptyPortfolioHTML();
            return;
        }
        
        const portfolioHTML = portfolioItems.map(item => this.createPortfolioItemHTML(item)).join('');
        container.innerHTML = portfolioHTML;
    }
    
    createPortfolioItemHTML(item) {
        const technologies = item.technologies || [];
        const tagsHTML = technologies.map(tech => `<span class="portfolio-tag">${tech}</span>`).join('');
        const actionsHTML = this.isOwner ? `
            <div class="portfolio-actions">
                <button class="portfolio-action portfolio-edit" data-item-id="${item.id}" title="Edit">
                    ✏️
                </button>
                <button class="portfolio-action portfolio-delete" data-item-id="${item.id}" title="Delete">
                    🗑️
                </button>
            </div>
        ` : '';
        
        return `
            <div class="portfolio-item fade-in">
                <div class="portfolio-image">
                    ${item.featured_image ? 
                        `<img src="${item.featured_image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
                        `<span>📁 ${item.title}</span>`
                    }
                </div>
                <div class="portfolio-content">
                    <h3 class="portfolio-item-title">${item.title}</h3>
                    <p class="portfolio-description">${item.description}</p>
                    <div class="portfolio-tags">${tagsHTML}</div>
                    <div class="portfolio-meta">
                        <div class="portfolio-date">
                            <span>📅</span>
                            <span>${this.formatDate(item.completion_date || item.created_at)}</span>
                        </div>
                        ${actionsHTML}
                    </div>
                </div>
            </div>
        `;
    }
    
    // ===== Skills Management =====
    updateSkills(skills) {
        const container = document.querySelector('.skills-list');
        if (!container || !skills) return;
        
        const skillsHTML = skills.map(skill => `
            <span class="skill-tag ${skill.verified ? 'verified' : ''}">
                ${skill.name}
            </span>
        `).join('');
        
        container.innerHTML = skillsHTML;
    }
    
    async openSkillsModal() {
        try {
            // Load available skills
            const response = await this.makeAuthenticatedRequest(`${this.apiBase}/ProfileController.php?action=get-skills`);
            
            if (response.success) {
                this.showSkillsModal(response.data.skills);
            }
        } catch (error) {
            console.error('Skills loading error:', error);
            this.showError('Failed to load skills');
        }
    }
    
    showSkillsModal(availableSkills) {
        const modalHTML = this.createSkillsModalHTML(availableSkills);
        this.showModal('Skills Management', modalHTML);
        
        // Initialize skill selection
        this.initSkillSelection();
    }
    
    initSkillSelection() {
        const currentSkills = this.profileData.skills || [];
        const checkboxes = document.querySelectorAll('#skillsForm input[type="checkbox"]');
        
        // Mark current skills as checked
        currentSkills.forEach(skill => {
            const checkbox = document.querySelector(`#skillsForm input[value="${skill.id}"]`);
            if (checkbox) {
                checkbox.checked = true;
                
                // Set proficiency level
                const proficiencySelect = checkbox.closest('.skill-item').querySelector('.skill-proficiency');
                if (proficiencySelect) {
                    proficiencySelect.value = skill.proficiency_level || 'intermediate';
                }
            }
        });
        
        // Show/hide proficiency selects based on checkbox state
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const skillItem = e.target.closest('.skill-item');
                const proficiencySelect = skillItem.querySelector('.skill-proficiency');
                proficiencySelect.style.display = e.target.checked ? 'block' : 'none';
            });
        });
    }
    
    // ===== File Upload Handling =====
    setupFileUploads() {
        // Portfolio media upload
        const portfolioUpload = document.getElementById('portfolioMediaUpload');
        if (portfolioUpload) {
            portfolioUpload.addEventListener('change', (e) => {
                this.handlePortfolioMediaUpload(e.target.files);
            });
        }
    }
    
    async handleAvatarUpload(file) {
        if (!file) return;
        
        try {
            this.showUploadProgress('avatar');
            
            const formData = new FormData();
            formData.append('avatar', file);
            
            const response = await this.makeAuthenticatedRequest(
                `${this.apiBase}/ProfileController.php?action=upload-avatar`,
                'POST',
                formData
            );
            
            if (response.success) {
                // Update avatar immediately
                const avatarImg = document.querySelector('.avatar-image');
                if (avatarImg) {
                    avatarImg.src = response.data.avatar_url;
                }
                
                this.showSuccess('Avatar updated successfully');
            } else {
                this.showError('Avatar upload failed: ' + response.error);
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showError('Avatar upload failed');
        } finally {
            this.hideUploadProgress('avatar');
        }
    }
    
    // ===== Profile Editing =====
    openEditModal() {
        const modalHTML = this.createEditProfileModalHTML();
        this.showModal('Edit Profile', modalHTML);
        this.populateEditForm();
    }
    
    populateEditForm() {
        const profile = this.profileData;
        if (!profile) return;
        
        // Basic info
        this.setFormValue('first_name', profile.user.first_name);
        this.setFormValue('last_name', profile.user.last_name);
        this.setFormValue('phone', profile.user.phone);
        
        // Freelancer specific
        if (profile.freelancer) {
            this.setFormValue('professional_title', profile.freelancer.professional_title);
            this.setFormValue('bio', profile.freelancer.bio);
            this.setFormValue('hourly_rate', profile.freelancer.hourly_rate);
            this.setFormValue('experience_level', profile.freelancer.experience_level);
            this.setFormValue('availability_status', profile.freelancer.availability_status);
        }
        
        // Client specific
        if (profile.client) {
            this.setFormValue('company_name', profile.client.company_name);
            this.setFormValue('company_description', profile.client.company_description);
            this.setFormValue('industry', profile.client.industry);
            this.setFormValue('company_size', profile.client.company_size);
            this.setFormValue('website', profile.client.website);
        }
    }
    
    async saveProfile(form) {
        try {
            this.showFormLoading(form, true);
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            const response = await this.makeAuthenticatedRequest(
                `${this.apiBase}/ProfileController.php?action=update-profile`,
                'POST',
                JSON.stringify(data),
                { 'Content-Type': 'application/json' }
            );
            
            if (response.success) {
                this.showSuccess('Profile updated successfully');
                this.closeModal();
                this.loadProfile(); // Reload to show changes
            } else {
                this.showError('Profile update failed: ' + response.error);
            }
        } catch (error) {
            console.error('Profile save error:', error);
            this.showError('Profile update failed');
        } finally {
            this.showFormLoading(form, false);
        }
    }
    
    // ===== Modal Management =====
    initModals() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-overlay')) {
                this.closeModal();
            } else if (e.target.matches('.modal-close')) {
                this.closeModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    showModal(title, content) {
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal slide-up">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }
    
    // ===== Helper Methods =====
    async makeAuthenticatedRequest(url, method = 'GET', body = null, headers = {}) {
        const token = localStorage.getItem('access_token');
        
        const config = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                ...headers
            }
        };
        
        if (body && method !== 'GET') {
            config.body = body;
        }
        
        const response = await fetch(url, config);
        return await response.json();
    }
    
    updateElement(selector, text = '', attribute = null, value = null) {
        const element = document.querySelector(selector);
        if (element) {
            if (attribute) {
                element.setAttribute(attribute, value);
            } else {
                element.textContent = text;
            }
        }
    }
    
    setFormValue(name, value) {
        const input = document.querySelector(`[name="${name}"]`);
        if (input && value !== null && value !== undefined) {
            input.value = value;
        }
    }
    
    getProfileTitle(profile) {
        if (profile.freelancer) {
            return profile.freelancer.professional_title || 'Freelancer';
        } else if (profile.client) {
            return profile.client.company_name || 'Client';
        }
        return 'User';
    }
    
    getLocation(profile) {
        // TODO: Add location field to profile
        return '📍 Buenos Aires, Argentina';
    }
    
    updateStatus(lastActivity) {
        const statusElement = document.querySelector('.profile-status');
        if (!statusElement) return;
        
        const now = new Date();
        const lastActive = new Date(lastActivity);
        const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));
        
        if (diffMinutes < 5) {
            statusElement.className = 'profile-status online';
        } else if (diffMinutes < 60) {
            statusElement.className = 'profile-status away';
        } else {
            statusElement.className = 'profile-status offline';
        }
    }
    
    updateStats(profile) {
        if (profile.freelancer) {
            this.updateElement('[data-stat="projects"]', profile.freelancer.completed_projects || '0');
            this.updateElement('[data-stat="success"]', (profile.freelancer.success_rate || 100) + '%');
        } else if (profile.client) {
            this.updateElement('[data-stat="projects"]', profile.client.projects_posted || '0');
            this.updateElement('[data-stat="spent"]', this.formatCurrency(profile.client.total_spent || 0));
        }
    }
    
    updateRating(profile) {
        const ratingContainer = document.querySelector('.profile-rating');
        if (!ratingContainer) return;
        
        // TODO: Get actual rating from profile data
        const rating = 4.8; // Placeholder
        const maxStars = 5;
        
        const starsHTML = Array.from({ length: maxStars }, (_, i) => {
            const filled = i < Math.floor(rating);
            return `<span class="rating-star ${filled ? '' : 'empty'}">★</span>`;
        }).join('');
        
        ratingContainer.innerHTML = `
            <div class="rating-stars">${starsHTML}</div>
            <span class="rating-text">${rating} (120 reviews)</span>
        `;
    }
    
    updateCompleteness(completeness) {
        this.updateElement('.completeness-percentage', completeness.percentage.toFixed(0) + '%');
        
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = completeness.percentage + '%';
        }
        
        const stepsList = document.querySelector('.completeness-steps');
        if (stepsList && completeness.next_steps) {
            const stepsHTML = completeness.next_steps.map(step => `
                <li class="completeness-step">
                    <span class="step-icon"></span>
                    <span>${step}</span>
                </li>
            `).join('');
            stepsList.innerHTML = stepsHTML;
        }
    }
    
    updateAboutSection(profile) {
        const aboutText = document.querySelector('.about-text');
        if (aboutText) {
            const bio = profile.freelancer?.bio || profile.client?.company_description || 'No description available.';
            aboutText.textContent = bio;
        }
        
        // Update details
        this.updateProfileDetails(profile);
    }
    
    updateProfileDetails(profile) {
        const details = document.querySelector('.about-details');
        if (!details) return;
        
        let detailsHTML = '';
        
        if (profile.freelancer) {
            detailsHTML = `
                <div class="detail-item">
                    <span class="detail-label">Hourly Rate</span>
                    <span class="detail-value">${this.formatCurrency(profile.freelancer.hourly_rate)}/hour</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Experience Level</span>
                    <span class="detail-value">${this.capitalizeFirst(profile.freelancer.experience_level)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Response Time</span>
                    <span class="detail-value">${profile.freelancer.response_time_hours} hours</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Member Since</span>
                    <span class="detail-value">${this.formatDate(profile.user.created_at)}</span>
                </div>
            `;
        }
        
        details.innerHTML = detailsHTML;
    }
    
    toggleOwnerElements() {
        const ownerElements = document.querySelectorAll('.owner-only');
        const visitorElements = document.querySelectorAll('.visitor-only');
        
        ownerElements.forEach(el => {
            el.style.display = this.isOwner ? 'block' : 'none';
        });
        
        visitorElements.forEach(el => {
            el.style.display = this.isOwner ? 'none' : 'block';
        });
    }
    
    showLoading() {
        // TODO: Implement loading skeleton
        console.log('Loading profile...');
    }
    
    hideLoading() {
        // TODO: Hide loading skeleton
        console.log('Profile loaded');
    }
    
    showError(message) {
        // TODO: Implement proper error display
        alert(message);
    }
    
    showSuccess(message) {
        // TODO: Implement proper success display
        console.log('Success:', message);
    }
    
    showFormLoading(form, loading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? 'Saving...' : 'Save Changes';
        }
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }
    
    formatDate(dateString) {
        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(dateString));
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    // ===== HTML Templates =====
    createEditProfileModalHTML() {
        const profile = this.profileData;
        const userType = profile.user.user_type;
        
        return `
            <form id="editProfileForm">
                <div class="form-group">
                    <label class="form-label">First Name</label>
                    <input type="text" name="first_name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input type="text" name="last_name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-input">
                </div>
                
                ${userType === 'freelancer' ? this.getFreelancerFormFields() : this.getClientFormFields()}
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.profileManager.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `;
    }
    
    getFreelancerFormFields() {
        return `
            <div class="form-group">
                <label class="form-label">Professional Title</label>
                <input type="text" name="professional_title" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea name="bio" class="form-textarea" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Hourly Rate (ARS)</label>
                <input type="number" name="hourly_rate" class="form-input" min="0" step="50">
            </div>
            <div class="form-group">
                <label class="form-label">Experience Level</label>
                <select name="experience_level" class="form-select">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Availability Status</label>
                <select name="availability_status" class="form-select">
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                </select>
            </div>
        `;
    }
    
    getClientFormFields() {
        return `
            <div class="form-group">
                <label class="form-label">Company Name</label>
                <input type="text" name="company_name" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Company Description</label>
                <textarea name="company_description" class="form-textarea" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Industry</label>
                <select name="industry" class="form-select">
                    <option value="">Select Industry</option>
                    <option value="technology">Technology</option>
                    <option value="marketing">Marketing</option>
                    <option value="design">Design</option>
                    <option value="education">Education</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="retail">Retail</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Company Size</label>
                <select name="company_size" class="form-select">
                    <option value="">Select Size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Website</label>
                <input type="url" name="website" class="form-input">
            </div>
        `;
    }
    
    getEmptyPortfolioHTML() {
        if (this.isOwner) {
            return `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                    <h3>No portfolio items yet</h3>
                    <p>Add your first project to showcase your work</p>
                    <button class="btn-primary-profile portfolio-add" style="margin-top: 1rem;">
                        Add Portfolio Item
                    </button>
                </div>
            `;
        } else {
            return `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                    <h3>No portfolio items</h3>
                    <p>This user hasn't added any portfolio items yet</p>
                </div>
            `;
        }
    }
}

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});

// ===== Export for use in other scripts =====
window.ProfileManager = ProfileManager;