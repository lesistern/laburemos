/**
 * Projects JavaScript Manager
 * LaburAR Complete Platform
 * 
 * Handles project management, proposals, milestones,
 * and real-time updates for project workflows
 */

class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.activeTab = 'all';
        this.filters = {
            search: '',
            status: '',
            category: '',
            budget_min: '',
            budget_max: '',
            deadline: ''
        };
        this.projects = [];
        this.proposals = [];
        this.milestones = [];
        
        this.init();
    }
    
    // ===== Initialization =====
    
    init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.initializeComponents();
    }
    
    setupEventListeners() {
        // Tab navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-tab]')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
        
        // Search and filters
        const searchInput = document.getElementById('projectSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.filters.search = e.target.value;
                this.loadProjects();
            }, 300));
        }
        
        // Filter selects
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.filters[e.target.name] = e.target.value;
                this.loadProjects();
            });
        });
        
        // Project actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                this.handleProjectAction(e.target.dataset.action, e.target.dataset.projectId);
            }
        });
        
        // Modal handling
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-backdrop')) {
                this.closeModal();
            }
        });
        
        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#createProjectForm')) {
                e.preventDefault();
                this.createProject(new FormData(e.target));
            }
            
            if (e.target.matches('#proposalForm')) {
                e.preventDefault();
                this.submitProposal(new FormData(e.target));
            }
        });
    }
    
    initializeComponents() {
        // Initialize date pickers
        this.initDatePickers();
        
        // Initialize file uploads
        this.initFileUploads();
        
        // Initialize tooltips
        this.initTooltips();
        
        // Setup periodic updates
        this.setupPeriodicUpdates();
    }
    
    // ===== Data Loading =====
    
    async loadInitialData() {
        try {
            this.showLoading(true);
            
            // Load projects based on current tab
            await this.loadProjects();
            
            // Load user-specific data
            if (this.isClient()) {
                await this.loadClientData();
            } else if (this.isFreelancer()) {
                await this.loadFreelancerData();
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Error al cargar los datos iniciales');
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadProjects() {
        try {
            const params = new URLSearchParams({
                action: 'my-projects',
                ...this.filters,
                page: 1,
                limit: 20
            });
            
            const response = await fetch(`/api/ProjectController.php?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.projects = data.data.projects;
                this.renderProjects();
                this.updateProjectCounts();
            } else {
                throw new Error(data.error || 'Error loading projects');
            }
            
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showError('Error al cargar los proyectos');
        }
    }
    
    async loadClientData() {
        // Load client-specific data
        await this.loadProjectTemplates();
        await this.loadInvitations();
    }
    
    async loadFreelancerData() {
        // Load freelancer-specific data
        await this.loadAvailableProjects();
        await this.loadProposals();
    }
    
    // ===== UI Rendering =====
    
    renderProjects() {
        const container = document.getElementById('projectsGrid');
        if (!container) return;
        
        if (this.projects.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }
        
        container.innerHTML = this.projects
            .map(project => this.renderProjectCard(project))
            .join('');
    }
    
    renderProjectCard(project) {
        const statusClass = `status-${project.status.replace('_', '-')}`;
        const userRole = this.getUserRole();
        
        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <div>
                        <h3 class="project-title">${escapeHtml(project.title)}</h3>
                        <span class="project-status ${statusClass}">${this.getStatusLabel(project.status)}</span>
                    </div>
                </div>
                
                <div class="project-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <span>Creado ${formatDate(project.created_at)}</span>
                    </div>
                    ${project.deadline ? `
                        <div class="meta-item">
                            <span class="meta-icon">⏰</span>
                            <span>Entrega ${formatDate(project.deadline)}</span>
                        </div>
                    ` : ''}
                    <div class="meta-item">
                        <span class="meta-icon">📁</span>
                        <span>${project.category_name || 'Sin categoría'}</span>
                    </div>
                </div>
                
                <div class="project-description">
                    ${escapeHtml(project.description)}
                </div>
                
                <div class="project-budget">
                    ${project.formatted_budget}
                </div>
                
                ${project.tags ? `
                    <div class="project-tags">
                        ${project.tags.split(',').map(tag => 
                            `<span class="project-tag">${escapeHtml(tag.trim())}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="project-footer">
                    <div class="project-stats">
                        ${project.proposals_count ? `<span>${project.proposals_count} propuestas</span>` : ''}
                        ${project.progress_percentage ? `<span>${project.progress_percentage}% completado</span>` : ''}
                    </div>
                    
                    <div class="project-actions-mini">
                        <button class="btn-mini btn-mini-primary" data-action="view" data-project-id="${project.id}">
                            Ver
                        </button>
                        ${this.renderProjectActions(project, userRole)}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderProjectActions(project, userRole) {
        const actions = [];
        
        if (userRole === 'client' && project.client_id === this.getCurrentUserId()) {
            if (project.status === 'draft') {
                actions.push(`<button class="btn-mini btn-mini-secondary" data-action="edit" data-project-id="${project.id}">Editar</button>`);
                actions.push(`<button class="btn-mini btn-mini-primary" data-action="publish" data-project-id="${project.id}">Publicar</button>`);
            } else if (project.status === 'proposals_review') {
                actions.push(`<button class="btn-mini btn-mini-primary" data-action="proposals" data-project-id="${project.id}">Ver Propuestas</button>`);
            }
        } else if (userRole === 'freelancer') {
            if (project.status === 'posted' && !project.has_proposal) {
                actions.push(`<button class="btn-mini btn-mini-primary" data-action="propose" data-project-id="${project.id}">Proponer</button>`);
            }
        }
        
        return actions.join('');
    }
    
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No hay proyectos</h3>
                <p>Aún no tienes proyectos en esta categoría.</p>
                ${this.isClient() ? `
                    <button class="btn-primary" data-action="create">
                        Crear Primer Proyecto
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    // ===== Project Management =====
    
    async createProject(formData) {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/ProjectController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create',
                    ...Object.fromEntries(formData)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Proyecto creado exitosamente');
                this.closeModal();
                await this.loadProjects();
                
                // Auto-open created project
                this.viewProject(data.data.project.id);
            } else {
                throw new Error(data.error || 'Error creating project');
            }
            
        } catch (error) {
            console.error('Error creating project:', error);
            this.showError('Error al crear el proyecto');
        } finally {
            this.showLoading(false);
        }
    }
    
    async updateProjectStatus(projectId, newStatus, notes = '') {
        try {
            const response = await fetch('/api/ProjectController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'update-status',
                    project_id: projectId,
                    status: newStatus,
                    notes: notes
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Estado del proyecto actualizado');
                await this.loadProjects();
                
                if (this.currentProject && this.currentProject.id === projectId) {
                    this.currentProject = data.data.project;
                    this.renderProjectDetail();
                }
            } else {
                throw new Error(data.error || 'Error updating project status');
            }
            
        } catch (error) {
            console.error('Error updating project status:', error);
            this.showError('Error al actualizar el estado del proyecto');
        }
    }
    
    // ===== Proposal Management =====
    
    async submitProposal(formData) {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/ProjectController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create-proposal',
                    ...Object.fromEntries(formData)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Propuesta enviada exitosamente');
                this.closeModal();
                await this.loadProjects();
            } else {
                throw new Error(data.error || 'Error submitting proposal');
            }
            
        } catch (error) {
            console.error('Error submitting proposal:', error);
            this.showError('Error al enviar la propuesta');
        } finally {
            this.showLoading(false);
        }
    }
    
    async acceptProposal(proposalId) {
        if (!confirm('¿Estás seguro de que quieres aceptar esta propuesta?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/ProjectController.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'accept-proposal',
                    proposal_id: proposalId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Propuesta aceptada. ¡El proyecto ha comenzado!');
                await this.loadProjects();
                this.viewProject(data.data.project.id);
            } else {
                throw new Error(data.error || 'Error accepting proposal');
            }
            
        } catch (error) {
            console.error('Error accepting proposal:', error);
            this.showError('Error al aceptar la propuesta');
        }
    }
    
    // ===== UI Components =====
    
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.project-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        this.activeTab = tabName;
        
        // Update filters based on tab
        switch (tabName) {
            case 'active':
                this.filters.status = ['posted', 'proposals_review', 'in_progress', 'review'];
                break;
            case 'completed':
                this.filters.status = 'completed';
                break;
            case 'draft':
                this.filters.status = 'draft';
                break;
            default:
                this.filters.status = '';
        }
        
        this.loadProjects();
    }
    
    updateProjectCounts() {
        // Update tab counters based on loaded projects
        const counts = {
            all: this.projects.length,
            active: this.projects.filter(p => ['posted', 'proposals_review', 'in_progress', 'review'].includes(p.status)).length,
            completed: this.projects.filter(p => p.status === 'completed').length,
            draft: this.projects.filter(p => p.status === 'draft').length
        };
        
        Object.entries(counts).forEach(([tab, count]) => {
            const tabElement = document.querySelector(`[data-tab="${tab}"] .count`);
            if (tabElement) {
                tabElement.textContent = count;
            }
        });
    }
    
    async viewProject(projectId) {
        try {
            const response = await fetch(`/api/ProjectController.php?action=get&project_id=${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentProject = data.data.project;
                this.showProjectModal();
            } else {
                throw new Error(data.error || 'Error loading project');
            }
            
        } catch (error) {
            console.error('Error viewing project:', error);
            this.showError('Error al cargar el proyecto');
        }
    }
    
    showProjectModal() {
        const modal = document.getElementById('projectModal');
        const content = document.getElementById('projectModalContent');
        
        if (modal && content && this.currentProject) {
            content.innerHTML = this.renderProjectDetail();
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    renderProjectDetail() {
        if (!this.currentProject) return '';
        
        const project = this.currentProject;
        const userRole = this.getUserRole();
        
        return `
            <div class="project-detail">
                <div class="project-detail-header">
                    <h2 class="project-detail-title">${escapeHtml(project.title)}</h2>
                    <div class="project-detail-meta">
                        <div>Cliente: ${escapeHtml(project.client_name)}</div>
                        <div>Estado: ${this.getStatusLabel(project.status)}</div>
                        <div>Presupuesto: ${project.formatted_budget}</div>
                        ${project.deadline ? `<div>Entrega: ${formatDate(project.deadline)}</div>` : ''}
                    </div>
                </div>
                
                <div class="project-detail-content">
                    <div class="detail-section">
                        <h3>Descripción</h3>
                        <p>${escapeHtml(project.description).replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    ${project.requirements ? `
                        <div class="detail-section">
                            <h3>Requerimientos</h3>
                            <p>${escapeHtml(project.requirements).replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}
                    
                    ${this.renderProjectProposals(project, userRole)}
                    ${this.renderProjectMilestones(project, userRole)}
                    ${this.renderProjectFiles(project, userRole)}
                </div>
            </div>
        `;
    }
    
    // ===== Event Handlers =====
    
    handleProjectAction(action, projectId) {
        switch (action) {
            case 'view':
                this.viewProject(projectId);
                break;
            case 'edit':
                this.editProject(projectId);
                break;
            case 'publish':
                this.updateProjectStatus(projectId, 'posted');
                break;
            case 'proposals':
                this.viewProposals(projectId);
                break;
            case 'propose':
                this.showProposalForm(projectId);
                break;
            case 'create':
                this.showCreateProjectForm();
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }
    
    // ===== Utility Methods =====
    
    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    
    getCurrentUserId() {
        const payload = this.getTokenPayload();
        return payload ? payload.user_id : null;
    }
    
    getUserRole() {
        const payload = this.getTokenPayload();
        return payload ? payload.user_type : null;
    }
    
    getTokenPayload() {
        const token = this.getAuthToken();
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            return null;
        }
    }
    
    isClient() {
        return this.getUserRole() === 'client';
    }
    
    isFreelancer() {
        return this.getUserRole() === 'freelancer';
    }
    
    getStatusLabel(status) {
        const labels = {
            'draft': 'Borrador',
            'posted': 'Publicado',
            'proposals_review': 'Revisando Propuestas',
            'in_progress': 'En Progreso',
            'review': 'En Revisión',
            'completed': 'Completado',
            'cancelled': 'Cancelado',
            'disputed': 'En Disputa'
        };
        
        return labels[status] || status;
    }
    
    showLoading(show) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        // Create and show notification
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
    
    closeModal() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
    
    setupPeriodicUpdates() {
        // Update project data every 30 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadProjects();
            }
        }, 30000);
    }
    
    initDatePickers() {
        // Initialize date picker components
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                input.min = tomorrow.toISOString().split('T')[0];
            }
        });
    }
    
    initFileUploads() {
        // Initialize file upload components
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileUpload(e.target);
            });
        });
    }
    
    initTooltips() {
        // Initialize tooltip components
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
}

// ===== Utility Functions =====

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount, currency = 'ARS') {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount);
}

// ===== Auto-initialization =====

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('projectsContainer')) {
        window.projectManager = new ProjectManager();
    }
});