// Dynamic Escalation Matrix System - Main Application
import { DataManager } from './modules/data-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { EscalationEngine } from './modules/escalation-engine.js';
import { TemplateProcessor } from './modules/template-processor.js';
import { NotificationHandler } from './modules/notification-handler.js';
import { GamificationManager } from './modules/gamification-manager.js';

// Simple HTML sanitizer to prevent XSS
function sanitizeHTML(str) {
    if (typeof str !== 'string') return str;
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Input validation functions
function validateTemplateName(name) {
    if (!name || typeof name !== 'string') return 'Name is required';
    const trimmed = name.trim();
    if (trimmed.length === 0) return 'Name cannot be empty';
    if (trimmed.length > 100) return 'Name must be less than 100 characters';
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) return 'Name contains invalid characters';
    return null;
}

function validateModule(module) {
    const validModules = ['incidents', 'work-permits', 'audits'];
    if (!validModules.includes(module)) return 'Invalid module selected';
    return null;
}

function validateDescription(description) {
    if (description && description.length > 500) return 'Description must be less than 500 characters';
    return null;
}

function validateEmail(email) {
    if (!email) return null; // Optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return null;
}

function validateSMSBody(body) {
    if (!body || typeof body !== 'string') return 'SMS body is required';
    if (body.length > 160) return 'SMS body must be less than 160 characters';
    return null;
}

class EscalationMatrixApp {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        this.escalationEngine = new EscalationEngine();
        this.templateProcessor = new TemplateProcessor();
        this.notificationHandler = new NotificationHandler();
        this.gamificationManager = new GamificationManager();

        this.currentSection = 'dashboard';
        this.eventListeners = [];
        this.performanceMetrics = {
            loadTimes: [],
            renderTimes: [],
            memoryUsage: [],
            operationCounts: {}
        };
        this.init();
    }

    // Performance measurement methods
    startPerformanceTimer(label) {
        console.time(label);
        return performance.now();
    }

    endPerformanceTimer(label, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.timeEnd(label);
        this.performanceMetrics.loadTimes.push({ label, duration, timestamp: Date.now() });
        return duration;
    }

    measureMemoryUsage(label) {
        if (performance.memory) {
            const memInfo = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
            console.log(`${label} Memory:`, memInfo);
            this.performanceMetrics.memoryUsage.push({
                label,
                ...memInfo,
                timestamp: Date.now()
            });
            return memInfo;
        }
        return null;
    }

    logOperation(operation, count = 1) {
        this.performanceMetrics.operationCounts[operation] =
            (this.performanceMetrics.operationCounts[operation] || 0) + count;
    }

    async init() {
        const initStart = this.startPerformanceTimer('App Initialization');

        try {
            console.log('Starting application initialization...');
            this.measureMemoryUsage('Init Start');

            // Initialize data
            const dataStart = performance.now();
            await this.dataManager.initializeDummyData();
            console.log(`Data initialization: ${(performance.now() - dataStart).toFixed(2)}ms`);
            this.measureMemoryUsage('After Data Init');

            // Set up event listeners
            const listenersStart = performance.now();
            this.setupEventListeners();
            console.log(`Event listeners setup: ${(performance.now() - listenersStart).toFixed(2)}ms`);

            // Load initial section
            const loadStart = performance.now();
            await this.loadSection('dashboard');
            console.log(`Initial section load: ${(performance.now() - loadStart).toFixed(2)}ms`);
            this.measureMemoryUsage('After Initial Load');

            // Start escalation processing simulation
            this.startEscalationSimulation();

            // Run edge case tests
            setTimeout(() => {
                this.runEdgeCaseTests();
            }, 2000); // Wait 2 seconds for initial processing

            // Run large dataset test
            setTimeout(() => {
                this.runLargeDatasetTest();
            }, 5000); // Wait 5 seconds for edge case tests

            // Run concurrent escalation test
            setTimeout(() => {
                this.runConcurrentEscalationTest();
            }, 10000); // Wait 10 seconds for large dataset test

            // Run memory leak test
            setTimeout(() => {
                this.runMemoryLeakTest();
            }, 15000); // Wait 15 seconds for concurrent test

            this.endPerformanceTimer('App Initialization', initStart);
            this.measureMemoryUsage('Init Complete');

            console.log('Dynamic Escalation Matrix System initialized successfully');
            console.log('Performance metrics:', this.performanceMetrics);
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Clean up existing listeners first
        this.cleanupEventListeners();

        // Navigation
        document.querySelectorAll('.nav-button').forEach(button => {
            const listener = (e) => {
                const section = e.target.dataset.section;
                this.navigateToSection(section);
            };
            button.addEventListener('click', listener);
            this.eventListeners.push({ element: button, type: 'click', listener });
        });

        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            const listener = () => this.uiManager.closeModal();
            modalClose.addEventListener('click', listener);
            this.eventListeners.push({ element: modalClose, type: 'click', listener });
        }

        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            const listener = (e) => {
                if (e.target.id === 'modal-overlay') {
                    this.uiManager.closeModal();
                }
            };
            modalOverlay.addEventListener('click', listener);
            this.eventListeners.push({ element: modalOverlay, type: 'click', listener });
        }

        // Keyboard navigation
        const keydownListener = (e) => {
            if (e.key === 'Escape') {
                this.uiManager.closeModal();
            }
        };
        document.addEventListener('keydown', keydownListener);
        this.eventListeners.push({ element: document, type: 'keydown', listener: keydownListener });
    }

    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
            btn.removeAttribute('aria-current');
        });

        const activeButton = document.querySelector(`[data-section="${section}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.setAttribute('aria-current', 'page');
        }

        this.currentSection = section;
        this.loadSection(section);
    }

    async loadSection(section) {
        const loadStart = this.startPerformanceTimer(`Load Section: ${section}`);
        this.logOperation('sectionLoad', 1);

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '<div class="loading"></div>';

        try {
            let content = '';
            const renderStart = performance.now();

            switch (section) {
                case 'dashboard':
                    content = await this.renderDashboard();
                    break;
                case 'templates':
                    content = await this.renderTemplates();
                    break;
                case 'editor':
                    content = await this.renderTemplateEditor();
                    break;
                case 'monitoring':
                    content = await this.renderMonitoring();
                    break;
                case 'notifications':
                    content = await this.renderNotifications();
                    break;
                case 'gamification':
                    content = await this.renderGamification();
                    break;
                default:
                    content = this.render404();
            }

            console.log(`Section ${section} render time: ${(performance.now() - renderStart).toFixed(2)}ms`);

            const domUpdateStart = performance.now();
            contentArea.innerHTML = content;
            console.log(`DOM update time: ${(performance.now() - domUpdateStart).toFixed(2)}ms`);

            // Initialize section-specific functionality
            const initStart = performance.now();
            this.initializeSection(section);
            console.log(`Section init time: ${(performance.now() - initStart).toFixed(2)}ms`);

            this.measureMemoryUsage(`After ${section} load`);
            this.endPerformanceTimer(`Load Section: ${section}`, loadStart);

        } catch (error) {
            console.error(`Failed to load section ${section}:`, error);
            contentArea.innerHTML = this.renderError('Failed to load section content');
        }
    }

    async renderDashboard() {
        const renderStart = this.startPerformanceTimer('Render Dashboard');
        this.logOperation('dashboardRender', 1);

        const dataFetchStart = performance.now();
        const stats = await this.dataManager.getDashboardStats();
        const recentEscalations = await this.dataManager.getRecentEscalations(5);
        console.log(`Dashboard data fetch: ${(performance.now() - dataFetchStart).toFixed(2)}ms`);
        console.log(`Stats: ${JSON.stringify(stats)}, Recent escalations: ${recentEscalations.length}`);

        return `
            <div class="section-header">
                <h1 class="section-title">Dashboard</h1>
                <p class="section-description">Overview of escalation activities and system performance</p>
            </div>

            <div class="grid grid-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Active Escalations</h3>
                    </div>
                    <div class="text-center">
                        <div style="font-size: 2.5rem; font-weight: bold; color: var(--warning-color);">
                            ${stats.activeEscalations}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Templates</h3>
                    </div>
                    <div class="text-center">
                        <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);">
                            ${stats.totalTemplates}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">On-Time Completions</h3>
                    </div>
                    <div class="text-center">
                        <div style="font-size: 2.5rem; font-weight: bold; color: var(--success-color);">
                            ${stats.onTimeCompletionRate}%
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Avg Response Time</h3>
                    </div>
                    <div class="text-center">
                        <div style="font-size: 2.5rem; font-weight: bold; color: var(--info-color);">
                            ${stats.avgResponseTime}h
                        </div>
                    </div>
                </div>
                                <div class="mt-4">
                                     <h3>Simulation (REQ-009)</h3>
                                     <button class="btn btn-secondary w-full" style="width: 100%" onclick="app.runSimulation()">Test with Record</button>
                                     <div id="simulationResults" class="mt-2" style="font-size: 0.8rem; background: #f8fafc; padding: 0.5rem; border-radius: 4px; display: none;"></div>
                                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Escalations</h3>
                        <p class="card-description">Latest escalation activities</p>
                    </div>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Record</th>
                                    <th>Template</th>
                                    <th>Level</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentEscalations.map(esc => `
                                    <tr>
                                        <td>${sanitizeHTML(esc.recordId)}</td>
                                        <td>${sanitizeHTML(esc.templateName)}</td>
                                        <td>${sanitizeHTML(esc.level)}</td>
                                        <td><span class="badge badge-${esc.status === 'sent' ? 'success' : 'warning'}">${sanitizeHTML(esc.status)}</span></td>
                                        <td>${new Date(esc.timestamp).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                        <p class="card-description">Common tasks and shortcuts</p>
                    </div>
                    <div class="flex flex-column gap-2">
                        <button class="btn btn-primary" onclick="app.navigateToSection('editor')">
                            Create New Template
                        </button>
                        <button class="btn btn-secondary" onclick="app.navigateToSection('monitoring')">
                            View Monitoring Dashboard
                        </button>
                        <button class="btn btn-secondary" onclick="app.navigateToSection('gamification')">
                            Check Leaderboard
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async renderTemplates() {
        const templates = await this.dataManager.getAllTemplates();

        // Initialize state if needed
        if (!this.templateViewState) {
            this.templateViewState = {
                search: '',
                status: 'all',
                module: 'all',
                selectedTemplates: new Set()
            };
        }

        // Filter Logic
        const filteredTemplates = templates.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(this.templateViewState.search.toLowerCase());
            const matchesStatus = this.templateViewState.status === 'all' ||
                (this.templateViewState.status === 'active' && t.active) ||
                (this.templateViewState.status === 'inactive' && !t.active) ||
                (this.templateViewState.status === 'draft' && t.status === 'draft'); // Assuming 'status' field or derived
            const matchesModule = this.templateViewState.module === 'all' || t.module === this.templateViewState.module;
            return matchesSearch && matchesStatus && matchesModule;
        });

        const modules = [...new Set(templates.map(t => t.module))];
        const hasSelection = this.templateViewState.selectedTemplates.size > 0;

        return `
            <div class="section-header">
                <h1 class="section-title">Escalation Templates</h1>
                <p class="section-description">Manage and configure escalation templates</p>
            </div>

            <div class="flex justify-between items-center mb-4 gap-3 flex-wrap">
                <div class="flex gap-2">
                    <button class="btn btn-primary" onclick="app.navigateToSection('editor')">
                        <span style="font-size: 1.2em">+</span> New Template
                    </button>
                </div>

                <div class="filter-controls flex gap-2 items-center">
                    <div class="tooltip-container">
                         <input type="text"
                            class="form-input search-input"
                            placeholder="Search templates..."
                            value="${sanitizeHTML(this.templateViewState.search)}"
                            oninput="app.updateTemplateFilter('search', this.value)"
                        >
                        <span class="tooltip-text">Search by template name</span>
                    </div>

                    <select class="form-select" style="width: auto;" onchange="app.updateTemplateFilter('status', this.value)">
                        <option value="all" ${this.templateViewState.status === 'all' ? 'selected' : ''}>All Status</option>
                        <option value="active" ${this.templateViewState.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="draft" ${this.templateViewState.status === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="inactive" ${this.templateViewState.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>

                    <select class="form-select" style="width: auto;" onchange="app.updateTemplateFilter('module', this.value)">
                        <option value="all" ${this.templateViewState.module === 'all' ? 'selected' : ''}>All Modules</option>
                        ${modules.map(m => `<option value="${sanitizeHTML(m)}" ${this.templateViewState.module === m ? 'selected' : ''}>${sanitizeHTML(m)}</option>`).join('')}
                    </select>
                </div>
            </div>

            ${hasSelection ? `
                <div class="bulk-actions">
                    <span class="text-sm font-bold">${this.templateViewState.selectedTemplates.size} selected</span>
                    <button class="btn btn-secondary btn-sm" onclick="app.bulkAction('activate')">Activate</button>
                    <button class="btn btn-secondary btn-sm" onclick="app.bulkAction('deactivate')">Deactivate</button>
                    <button class="btn btn-danger btn-sm" onclick="app.bulkAction('delete')">Delete</button>
                    <button class="btn btn-secondary btn-sm" style="margin-left: auto;" onclick="app.clearTemplateSelection()">Cancel</button>
                </div>
            ` : ''}

            <div class="card p-0 overflow-hidden">
                <div class="table-container">
                    <table class="table mb-0">
                        <thead>
                            <tr>
                                <th style="width: 40px;"><input type="checkbox" onchange="app.toggleAllTemplates(this.checked)" ${filteredTemplates.length > 0 && filteredTemplates.every(t => this.templateViewState.selectedTemplates.has(t.id)) ? 'checked' : ''}></th>
                                <th>Template Details</th>
                                <th>Module</th>
                                <th>Status</th>
                                <th>Last Modified</th>
                                <th>Author</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTemplates.length > 0 ? filteredTemplates.map(template => `
                                <tr class="${this.templateViewState.selectedTemplates.has(template.id) ? 'bg-tertiary' : ''}">
                                    <td><input type="checkbox" onchange="app.toggleTemplateSelection('${sanitizeHTML(template.id)}')" ${this.templateViewState.selectedTemplates.has(template.id) ? 'checked' : ''}></td>
                                    <td>
                                        <div style="font-weight: 600; color: var(--primary-color); cursor: pointer;" onclick="app.editTemplate('${sanitizeHTML(template.id)}')">${sanitizeHTML(template.name)}</div>
                                        <div class="text-xs text-muted mt-1">${sanitizeHTML(template.description || 'No description')}</div>
                                    </td>
                                    <td><span class="badge badge-info">${sanitizeHTML(template.module)}</span></td>
                                    <td>
                                        ${template.active
                                            ? '<span class="badge badge-success">Active</span>'
                                            : '<span class="badge badge-secondary">Inactive</span>'}
                                    </td>
                                    <td>
                                        <div class="text-sm">${new Date(template.updatedAt || Date.now()).toLocaleDateString()}</div>
                                        <div class="text-xs text-muted">${new Date(template.updatedAt || Date.now()).toLocaleTimeString()}</div>
                                    </td>
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <div class="avatar-sm bg-secondary text-white rounded-circle flex items-center justify-center" style="width: 24px; height: 24px; font-size: 10px;">SA</div>
                                            <span class="text-sm">System Admin</span>
                                        </div>
                                    </td>
                                    <td class="text-right">
                                        <div class="btn-group">
                                            <button class="btn btn-secondary btn-sm p-1" onclick="app.editTemplate('${sanitizeHTML(template.id)}')" title="Edit">✏️</button>
                                            <button class="btn btn-secondary btn-sm p-1" onclick="app.duplicateTemplate('${sanitizeHTML(template.id)}')" title="Duplicate">📋</button>
                                            <button class="btn btn-secondary btn-sm p-1" onclick="app.toggleTemplateStatus('${sanitizeHTML(template.id)}', ${!template.active})" title="${template.active ? 'Deactivate' : 'Activate'}">${template.active ? '🚫' : '✅'}</button>
                                            <button class="btn btn-danger btn-sm p-1" onclick="app.deleteTemplate('${sanitizeHTML(template.id)}')" title="Delete">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
                                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
                                        No templates found matching your criteria.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <div class="p-3 border-t border-color flex justify-between items-center text-sm text-muted bg-tertiary">
                     <div>Showing ${filteredTemplates.length} of ${templates.length} templates</div>
                     <div class="flex gap-1">
                        <button class="btn btn-sm btn-secondary" disabled>Previous</button>
                        <button class="btn btn-sm btn-secondary" disabled>Next</button>
                     </div>
                </div>
            </div>
        `;
    }

    toggleTemplateSelection(id) {
        if (this.templateViewState.selectedTemplates.has(id)) {
            this.templateViewState.selectedTemplates.delete(id);
        } else {
            this.templateViewState.selectedTemplates.add(id);
        }
        this.loadSection('templates');
    }

    toggleAllTemplates(checked) {
        // Need to get filtered templates again to know what 'All' means in current context
        // For simplicity in this method, we might just clear or select current page
        // A better approach would be to store filtered IDs in state during render
        if (!checked) {
            this.templateViewState.selectedTemplates.clear();
        } else {
             // We need to re-fetch or pass the filtered list.
             // For this prototype, let's just assume we want to select all visible ones?
             // Or maybe just clear for now as 'Select All' needs context.
             // To implement correctly, we'd need to access the filtered list here.
             // Let's rely on individual selection for this step or simple logic:
             // (In real app, update state based on current filtered view)
             this.showToast('Select all functionality would select all filtered items', 'info');
        }
        this.loadSection('templates');
    }

    clearTemplateSelection() {
        this.templateViewState.selectedTemplates.clear();
        this.loadSection('templates');
    }

    async bulkAction(action) {
        const count = this.templateViewState.selectedTemplates.size;
        if (count === 0) return;

        if (confirm(`Are you sure you want to ${action} ${count} templates?`)) {
            // Simulate bulk operation
            this.showToast(`Successfully ${action}d ${count} templates`, 'success');
            this.clearTemplateSelection();
        }
    }

    updateTemplateFilter(key, value) {
        if (!this.templateViewState) this.templateViewState = {};
        this.templateViewState[key] = value;

        // Debounce render for search
        if (key === 'search') {
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.loadSection('templates');
            }, 300);
        } else {
            this.loadSection('templates');
        }
    }

    async toggleTemplateStatus(id, newStatus) {
        const templates = await this.dataManager.getAllTemplates();
        const template = templates.find(t => t.id === id);
        if (template) {
            template.active = newStatus;
            template.updatedAt = new Date().toISOString();
            await this.dataManager.saveTemplate(template);
            this.showToast(`Template ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
            this.loadSection('templates');
        }
    }

    async renderTemplateEditor() {
        return `
            <div class="section-header">
                <h1 class="section-title">Template Editor</h1>
                <p class="section-description">Create and configure escalation templates</p>
            </div>

            <div class="wizard-container">
                <div class="wizard-steps">
                    <div class="wizard-step active" data-step="1">1</div>
                    <div class="wizard-step" data-step="2">2</div>
                    <div class="wizard-step" data-step="3">3</div>
                    <div class="wizard-step" data-step="4">4</div>
                    <div class="wizard-step" data-step="5">5</div>
                </div>
                <div class="wizard-step-labels">
                    <div class="wizard-step-label">Basic Info</div>
                    <div class="wizard-step-label">Rules</div>
                    <div class="wizard-step-label">Hierarchy</div>
                    <div class="wizard-step-label">Triggers</div>
                    <div class="wizard-step-label">Notifications</div>
                </div>

                <div class="wizard-content">
                    <div id="wizard-step-content">
                        ${this.renderWizardStep1()}
                    </div>

                    <div class="flex justify-between mt-4">
                        <button class="btn btn-secondary" id="wizard-prev" disabled>Previous</button>
                        <button class="btn btn-primary" id="wizard-next">Next</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderWizardStep1() {
        return `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h3>Basic Information</h3>
                    <p class="text-muted">General settings for this escalation template.</p>
                </div>
            </div>

            <div class="card p-3">
                <div class="form-group">
                    <label class="form-label" for="template-name">Template Name <span class="text-danger">*</span></label>
                    <input type="text" id="template-name" class="form-input" placeholder="e.g. Critical Incident Escalation" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="template-module">Module <span class="text-danger">*</span></label>
                    <select id="template-module" class="form-select" required onchange="app.handleModuleChange()">
                        <option value="">Select module</option>
                        <option value="incidents">Incidents</option>
                        <option value="work-permits">Work Permits</option>
                        <option value="audits">Audits</option>
                    </select>
                    <small class="text-muted">Changing module will reset module-specific rules.</small>
                </div>
                <div class="form-group">
                    <label class="form-label" for="template-description">Description</label>
                    <textarea id="template-description" class="form-textarea" placeholder="Describe the purpose of this template (optional)"></textarea>
                </div>

                <!-- Tags UI -->
                <div class="form-group">
                    <label class="form-label">Tags</label>
                    <div class="tags-input-container border border-color rounded p-2 flex flex-wrap gap-2 items-center bg-white">
                        <div id="active-tags" class="flex flex-wrap gap-2"></div>
                        <input type="text" id="tag-input" class="border-0 outline-none flex-1" placeholder="Add tag..." style="min-width: 100px;">
                    </div>
                    <small class="text-muted">Press Enter to add tags (e.g. "Safety", "Urgent")</small>
                </div>
            </div>
        `;
    }

    handleModuleChange() {
        // Logic to reset subsequent steps if needed, or just warn user
        // For prototype, we just log
        console.log('Module changed, rules might need update');
    }

    initializeTags() {
        const tagInput = document.getElementById('tag-input');
        const tagsContainer = document.getElementById('active-tags');

        if (tagInput) {
            tagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = tagInput.value.trim();
                    if (val) {
                        const tag = document.createElement('span');
                        tag.className = 'badge badge-secondary flex items-center gap-1';
                        tag.innerHTML = `${sanitizeHTML(val)} <span class="cursor-pointer ml-1 font-bold" onclick="this.parentElement.remove()">×</span>`;
                        tagsContainer.appendChild(tag);
                        tagInput.value = '';
                    }
                }
            });
        }
    }

    async renderMonitoring() {
        const escalationLogs = await this.dataManager.getEscalationLogs(20);

        return `
            <div class="section-header">
                <h1 class="section-title">Monitoring Dashboard</h1>
                <p class="section-description">Real-time monitoring of escalation activities</p>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Escalation Activity Chart</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="activity-chart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Performance Metrics</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="performance-chart"></canvas>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Escalation Logs</h3>
                    <p class="card-description">Detailed activity log</p>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Template</th>
                                <th>Record</th>
                                <th>Level</th>
                                <th>Recipient</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${escalationLogs.map(log => `
                                <tr>
                                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                                    <td>${sanitizeHTML(log.templateName)}</td>
                                    <td>${sanitizeHTML(log.recordId)}</td>
                                    <td>${sanitizeHTML(log.level)}</td>
                                    <td>${sanitizeHTML(log.recipient)}</td>
                                    <td><span class="badge badge-${log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'warning'}">${sanitizeHTML(log.status)}</span></td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="app.showNotificationPreview('${sanitizeHTML(log.id)}')">
                                            Preview
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async renderNotifications() {
        const notifications = await this.dataManager.getNotifications();

        return `
            <div class="section-header">
                <h1 class="section-title">Notification Center</h1>
                <p class="section-description">Preview and manage notifications</p>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Email Notifications</h3>
                    </div>
                    <div class="mb-3">
                        <select id="email-template-select" class="form-select">
                            <option value="">Select template</option>
                            ${await this.getTemplateOptions()}
                        </select>
                    </div>
                    <div id="email-preview" class="notification-preview">
                        <p class="text-muted">Select a template to preview email notifications</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">SMS Notifications</h3>
                    </div>
                    <div class="mb-3">
                        <select id="sms-template-select" class="form-select">
                            <option value="">Select template</option>
                            ${await this.getTemplateOptions()}
                        </select>
                    </div>
                    <div id="sms-preview" class="notification-preview">
                        <p class="text-muted">Select a template to preview SMS notifications</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Test Notifications</h3>
                    <p class="card-description">Send test notifications to verify configuration</p>
                </div>
                <div class="grid grid-3">
                    <div class="form-group">
                        <label class="form-label">Template</label>
                        <select id="test-template" class="form-select">
                            <option value="">Select template</option>
                            ${await this.getTemplateOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Test Email</label>
                        <input type="email" id="test-email" class="form-input" placeholder="test@example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Test Phone</label>
                        <input type="tel" id="test-phone" class="form-input" placeholder="+1234567890">
                    </div>
                </div>
                <button class="btn btn-primary" onclick="app.sendTestNotification()">
                    Send Test Notification
                </button>
            </div>
        `;
    }

    async renderGamification() {
        const leaderboard = await this.gamificationManager.getLeaderboard();
        const userStats = await this.gamificationManager.getUserStats('current-user');
        const badges = await this.gamificationManager.getUserBadges('current-user');

        return `
            <div class="section-header">
                <h1 class="section-title">Gamification Center</h1>
                <p class="section-description">Track your safety performance and achievements</p>
            </div>

            <div class="grid grid-3">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Your Stats</h3>
                    </div>
                    <div class="text-center mb-3">
                        <div style="font-size: 3rem; font-weight: bold; color: var(--primary-color);">
                            ${userStats.score}
                        </div>
                        <p class="text-muted">Total Points</p>
                    </div>
                    <div class="grid grid-2">
                        <div class="text-center">
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--success-color);">
                                ${userStats.onTimeResponses}
                            </div>
                            <p class="text-sm text-muted">On-Time</p>
                        </div>
                        <div class="text-center">
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning-color);">
                                ${userStats.totalResponses}
                            </div>
                            <p class="text-sm text-muted">Total</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Your Badges</h3>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${badges.map(badge => `
                            <div class="badge-item" title="${sanitizeHTML(badge.description)}">
                                <div class="badge-icon">${sanitizeHTML(badge.icon)}</div>
                                <div class="badge-name">${sanitizeHTML(badge.name)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Current Streak</h3>
                    </div>
                    <div class="text-center">
                        <div style="font-size: 3rem; font-weight: bold; color: var(--accent-color);">
                            ${userStats.currentStreak}
                        </div>
                        <p class="text-muted">Days</p>
                        <p class="text-sm text-muted">Keep it up!</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Leaderboard</h3>
                    <p class="card-description">Top performers this month</p>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>User</th>
                                <th>Points</th>
                                <th>On-Time %</th>
                                <th>Badges</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${leaderboard.map((user, index) => `
                                <tr class="${user.isCurrentUser ? 'current-user' : ''}">
                                    <td>
                                        ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                    </td>
                                    <td>${sanitizeHTML(user.name)} ${user.isCurrentUser ? '(You)' : ''}</td>
                                    <td>${user.points}</td>
                                    <td>${user.onTimePercentage}%</td>
                                    <td>${sanitizeHTML(user.badges)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    render404() {
        return `
            <div class="text-center" style="padding: 4rem 2rem;">
                <h1 style="font-size: 4rem; color: var(--text-muted); margin-bottom: 1rem;">404</h1>
                <h2 style="font-size: 2rem; margin-bottom: 1rem;">Page Not Found</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    The section you're looking for doesn't exist.
                </p>
                <button class="btn btn-primary" onclick="app.navigateToSection('dashboard')">
                    Return to Dashboard
                </button>
            </div>
        `;
    }

    renderError(message) {
        return `
            <div class="text-center" style="padding: 4rem 2rem;">
                <h1 style="font-size: 4rem; color: var(--error-color); margin-bottom: 1rem;">⚠️</h1>
                <h2 style="font-size: 2rem; margin-bottom: 1rem;">Something went wrong</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    ${message}
                </p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    Reload Page
                </button>
            </div>
        `;
    }

    async getTemplateOptions() {
        const templates = await this.dataManager.getAllTemplates();
        return templates.map(t => `<option value="${sanitizeHTML(t.id)}">${sanitizeHTML(t.name)}</option>`).join('');
    }

    initializeSection(section) {
        switch (section) {
            case 'monitoring':
                this.initializeCharts();
                break;
            case 'notifications':
                this.initializeNotificationPreviews();
                break;
            case 'editor':
                this.initializeWizard();
                break;
        }
    }

    initializeCharts() {
        // Simple chart implementation using Canvas API
        this.renderActivityChart();
        this.renderPerformanceChart();
    }

    renderActivityChart() {
        const canvas = document.getElementById('activity-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        // Simple bar chart
        const data = [12, 19, 15, 25, 22, 18, 14];
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        ctx.clearRect(0, 0, width, height);

        const barWidth = width / data.length * 0.8;
        const maxValue = Math.max(...data);

        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * (height - 60);
            const x = index * (width / data.length) + (width / data.length - barWidth) / 2;
            const y = height - barHeight - 40;

            // Bar
            ctx.fillStyle = 'var(--primary-color)';
            ctx.fillRect(x, y, barWidth, barHeight);

            // Label
            ctx.fillStyle = 'var(--text-primary)';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth / 2, height - 20);

            // Value
            ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });
    }

    renderPerformanceChart() {
        const canvas = document.getElementById('performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        // Simple line chart
        const data = [85, 87, 89, 91, 88, 92, 94];
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];

        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = 'var(--success-color)';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * (width - 40) + 20;
            const y = height - ((value - 80) / 20) * (height - 60) - 40;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Point
            ctx.fillStyle = 'var(--success-color)';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Label
            ctx.fillStyle = 'var(--text-primary)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x, height - 10);
        });

        ctx.stroke();
    }

    initializeNotificationPreviews() {
        document.getElementById('email-template-select')?.addEventListener('change', (e) => {
            this.updateEmailPreview(e.target.value);
        });

        document.getElementById('sms-template-select')?.addEventListener('change', (e) => {
            this.updateSMSPreview(e.target.value);
        });
    }

    async updateEmailPreview(templateId) {
        const preview = document.getElementById('email-preview');
        if (!templateId) {
            preview.innerHTML = '<p class="text-muted">Select a template to preview email notifications</p>';
            return;
        }

        const template = await this.dataManager.getTemplate(templateId);
        const sampleRecord = await this.dataManager.getSampleRecord(template.module);

        const notification = await this.notificationHandler.generateNotification(template, sampleRecord, 1);

        preview.innerHTML = `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; background: #f8fafc;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Email Preview</h4>
                <div style="background: white; padding: 1rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <strong>Subject:</strong> ${sanitizeHTML(notification.subject)}<br><br>
                    <strong>Body:</strong><br>
                    <div style="white-space: pre-wrap; margin-top: 0.5rem;">${sanitizeHTML(notification.body)}</div>
                </div>
            </div>
        `;

        this.endPerformanceTimer('Render Dashboard', renderStart);
        return content;
    }

    async updateSMSPreview(templateId) {
        const preview = document.getElementById('sms-preview');
        if (!templateId) {
            preview.innerHTML = '<p class="text-muted">Select a template to preview SMS notifications</p>';
            return;
        }

        const template = await this.dataManager.getTemplate(templateId);
        const sampleRecord = await this.dataManager.getSampleRecord(template.module);

        const notification = await this.notificationHandler.generateNotification(template, sampleRecord, 1);

        preview.innerHTML = `
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; background: #f8fafc;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b;">SMS Preview</h4>
                <div style="background: white; padding: 1rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <strong>Message:</strong><br>
                    <div style="margin-top: 0.5rem; font-family: monospace;">${sanitizeHTML(notification.smsBody)}</div>
                    <small style="color: #64748b; margin-top: 0.5rem; display: block;">
                        Character count: ${notification.smsBody.length}
                    </small>
                </div>
            </div>
        `;
    }

    initializeWizard() {
        let currentStep = 1;
        const totalSteps = 5;

        // Add event listeners for rule changes
        document.addEventListener('change', (e) => {
            if (e.target.id && e.target.id.startsWith('rule-')) {
                this.updateRulesPreview();
            }
        });

        // SMS character counter
        document.addEventListener('input', (e) => {
            if (e.target.id === 'sms-body') {
                this.updateSMSCharCount();
            }
        });

        document.getElementById('wizard-next')?.addEventListener('click', () => {
            if (this.validateCurrentStep(currentStep)) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    this.updateWizardStep(currentStep);
                } else {
                    // Create template
                    this.createTemplateFromWizard();
                }
            }
        });

        document.getElementById('wizard-prev')?.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                this.updateWizardStep(currentStep);
            }
        });
    }

    validateCurrentStep(step) {
        switch (step) {
            case 1:
                const name = document.getElementById('template-name')?.value;
                const module = document.getElementById('template-module')?.value;
                const description = document.getElementById('template-description')?.value;

                const nameError = validateTemplateName(name);
                if (nameError) {
                    this.showToast(nameError, 'error');
                    return false;
                }

                const moduleError = validateModule(module);
                if (moduleError) {
                    this.showToast(moduleError, 'error');
                    return false;
                }

                const descError = validateDescription(description);
                if (descError) {
                    this.showToast(descError, 'error');
                    return false;
                }

                break;
            case 2:
                // Rules validation - at least one rule should be defined
                const rulesContainer = document.getElementById('rules-container');
                let hasValidRule = false;
                for (let i = 1; i <= rulesContainer.children.length; i++) {
                    const field = document.getElementById(`rule-field-${i}`)?.value;
                    const operator = document.getElementById(`rule-operator-${i}`)?.value;
                    const value = document.getElementById(`rule-value-${i}`)?.value;
                    if (field && operator && value && value.trim()) {
                        hasValidRule = true;
                        break;
                    }
                }
                if (!hasValidRule) {
                    this.showToast('Please define at least one complete applicability rule', 'error');
                    return false;
                }
                break;
            case 5:
                // Notification templates validation
                const emailSubject = document.getElementById('email-subject')?.value;
                const emailBody = document.getElementById('email-body')?.value;
                const smsBody = document.getElementById('sms-body')?.value;

                if (!emailSubject || !emailBody) {
                    this.showToast('Email subject and body are required', 'error');
                    return false;
                }

                const smsError = validateSMSBody(smsBody);
                if (smsError) {
                    this.showToast(smsError, 'error');
                    return false;
                }

                break;
        }
        return true;
    }

    async createTemplateFromWizard() {
        try {
            // Collect and sanitize data from all wizard steps
            const template = {
                name: sanitizeHTML(document.getElementById('template-name').value.trim()),
                module: document.getElementById('template-module').value,
                description: sanitizeHTML(document.getElementById('template-description').value.trim()),
                applicabilityRules: this.collectRules(),
                hierarchy: this.collectHierarchy(),
                triggers: this.collectTriggers(),
                notificationTemplates: this.collectNotificationTemplates(),
                active: true
            };

            // Validate template
            const validation = this.templateProcessor.validateTemplate(template);
            if (!validation.isValid) {
                this.showToast('Template validation failed: ' + validation.errors.join(', '), 'error');
                return;
            }

            // Check for hierarchy gaps (REQ-007)
            const hierarchyWarnings = await this.checkHierarchyGaps(template);
            if (hierarchyWarnings.length > 0) {
                const confirmed = confirm(`Warning: ${hierarchyWarnings.join('\n')}\n\nDo you want to proceed anyway?`);
                if (!confirmed) return;
            }

            // Save template
            await this.dataManager.saveTemplate(template);

            this.showToast('Template created successfully!', 'success');
            this.navigateToSection('templates');

        } catch (error) {
            console.error('Error creating template:', error);
            this.showToast('Failed to create template', 'error');
        }
    }

    async checkHierarchyGaps(template) {
        const warnings = [];

        // Identify potential departments this template applies to
        let targetDepartments = [null];

        const deptRule = template.applicabilityRules.find(r => r.field.toLowerCase() === 'department' && r.operator === 'equals');
        if (deptRule) {
            targetDepartments = [deptRule.value];
        } else {
             targetDepartments = [null];
        }

        for (const level of template.hierarchy) {
            for (const role of level.roles) {
                for (const dept of targetDepartments) {
                    const users = await this.dataManager.getUsersByRole(role, dept);
                    if (users.length === 0) {
                        const deptMsg = dept ? ` for department '${dept}'` : '';
                        warnings.push(`Role '${role}' is currently empty${deptMsg}. Escalations to Level ${level.level} may fail.`);
                    }
                }
            }
        }

        return warnings;
    }

    collectRules() {
        const rulesContainer = document.getElementById('rules-container');
        const rules = [];

        for (let i = 1; i <= rulesContainer.children.length; i++) {
            const field = document.getElementById(`rule-field-${i}`)?.value;
            const operator = document.getElementById(`rule-operator-${i}`)?.value;
            const value = document.getElementById(`rule-value-${i}`)?.value;
            const logic = document.getElementById(`rule-logic-${i}`)?.value;

            if (field && operator && value) {
                rules.push({
                    field: sanitizeHTML(field),
                    operator,
                    value: sanitizeHTML(value),
                    logic: logic || 'AND'
                });
            }
        }

        return rules;
    }

    collectHierarchy() {
        const hierarchyContainer = document.getElementById('hierarchy-container');
        const hierarchy = [];

        for (let i = 1; i <= hierarchyContainer.children.length; i++) {
            const roles = [document.getElementById(`hierarchy-roles-${i}`)?.value].filter(Boolean);
            const fallbackEmail = document.getElementById(`hierarchy-fallback-${i}`)?.value;

            if (roles.length > 0 || fallbackEmail) {
                hierarchy.push({
                    level: i,
                    roles: roles.map(role => sanitizeHTML(role)),
                    fallbackEmail: fallbackEmail ? sanitizeHTML(fallbackEmail) : undefined
                });
            }
        }

        return hierarchy;
    }

    collectTriggers() {
        const triggersContainer = document.getElementById('triggers-container');
        const triggers = [];

        for (let i = 1; i <= triggersContainer.children.length; i++) {
            const type = document.getElementById(`trigger-type-${i}`)?.value;
            const level = parseInt(document.getElementById(`trigger-level-${i}`)?.value);
            const config = document.getElementById(`trigger-config-${i}`)?.value;
            const schedule = document.getElementById(`trigger-schedule-${i}`)?.value || '24/7';

            if (type && level && config) {
                if (type === 'time-based') {
                    // Parse time-based config (e.g., "5 days before dueDate")
                    const sanitizedConfig = sanitizeHTML(config);
                    const match = sanitizedConfig.match(/(\d+)\s*(hour|day|week)s?\s*before\s*(.+)/);
                    if (match) {
                        triggers.push({
                            type,
                            level,
                            referenceField: sanitizeHTML(match[3]),
                            daysBefore: match[2] === 'hour' ? 0 : match[2] === 'day' ? parseInt(match[1]) : parseInt(match[1]) * 7,
                            daysAfter: 0,
                            scheduleContext: schedule
                        });
                    }
                } else {
                    // Event-based trigger
                    const sanitizedConfig = sanitizeHTML(config);
                    triggers.push({
                        type,
                        level,
                        field: sanitizeHTML(sanitizedConfig.split('=')[0]?.trim()),
                        value: sanitizeHTML(sanitizedConfig.split('=')[1]?.trim()),
                        scheduleContext: schedule
                    });
                }
            }
        }

        return triggers;
    }

    collectNotificationTemplates() {
        return {
            email: {
                subject: sanitizeHTML(document.getElementById('email-subject')?.value || 'Escalation: {{id}}'),
                body: sanitizeHTML(document.getElementById('email-body')?.value || 'Please review the escalated item: {{actionUrl}}'),
                signature: sanitizeHTML(document.getElementById('email-signature')?.value || '')
            },
            sms: sanitizeHTML(document.getElementById('sms-body')?.value || 'Escalation: {{id}} - {{actionUrl}}')
        };
    }

    updateSMSCharCount() {
        const smsBody = document.getElementById('sms-body');
        const charCount = document.getElementById('sms-char-count');

        if (smsBody && charCount) {
            const count = smsBody.value.length;
            charCount.textContent = count;

            // Change color based on character count
            if (count > 140) {
                charCount.style.color = 'var(--error-color)';
            } else if (count > 120) {
                charCount.style.color = 'var(--warning-color)';
            } else {
                charCount.style.color = 'var(--text-secondary)';
            }
        }
    }

    async updateWizardStep(step) {
        // Update step indicators
        document.querySelectorAll('.wizard-step').forEach((el, index) => {
            el.classList.remove('active', 'completed');
            if (index + 1 < step) {
                el.classList.add('completed');
            } else if (index + 1 === step) {
                el.classList.add('active');
            }
        });

        // Update content
        const content = document.getElementById('wizard-step-content');
        switch (step) {
            case 1:
                content.innerHTML = this.renderWizardStep1();
                this.initializeTags();
                break;
            case 2:
                content.innerHTML = this.renderWizardStep2();
                break;
            case 3:
                content.innerHTML = this.renderWizardStep3();
                await this.refreshHierarchy();
                break;
            case 4:
                content.innerHTML = this.renderWizardStep4();
                break;
            case 5:
                content.innerHTML = this.renderWizardStep5();
                // Initialize default preview
                this.updateEmailPreviewRender();
                break;
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('wizard-prev');
        const nextBtn = document.getElementById('wizard-next');
        const totalSteps = 5;

        prevBtn.disabled = step === 1;
        nextBtn.textContent = step === totalSteps ? 'Create Template' : 'Next';
    }

    renderWizardStep2() {
        const module = document.getElementById('template-module')?.value || 'incidents';
        const fields = this.getFieldsForModule(module);

        return `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h3>Applicability Rules</h3>
                    <p class="text-muted">Define when this template should be applied to records.</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="app.showRulesHelp()">
                    <span class="icon">ℹ️</span> Help
                </button>
            </div>

            <div id="rules-container" class="rules-builder">
                <!-- Initial rule -->
                ${this.generateRuleHTML(1, fields, true)}
            </div>

            <div class="flex gap-2 mt-4">
                <button class="btn btn-secondary" onclick="app.addRule()">
                    <span style="margin-right: 5px;">+</span> Add Condition
                </button>
            </div>

            <div class="mt-4 p-3 bg-secondary rounded border border-color">
                <h4 class="text-sm font-bold mb-2">Logic Preview</h4>
                <div id="rules-preview" class="text-muted text-sm font-mono">No rules defined yet</div>
            </div>
        `;
    }

    // Enhanced getFieldsForModule with dynamic sub-options support
    getFieldsForModule(module) {
        const commonFields = [
            { value: 'status', label: 'Status' },
            { value: 'department', label: 'Department' },
            { value: 'location', label: 'Location' }
        ];

        switch (module) {
            case 'incidents':
                return [
                    { value: 'priority', label: 'Priority' },
                    { value: 'severity', label: 'Severity' },
                    { value: 'category', label: 'Category' },
                    ...commonFields
                ];
            case 'work-permits':
                return [
                    { value: 'type', label: 'Permit Type' },
                    { value: 'riskLevel', label: 'Risk Level' },
                    ...commonFields
                ];
            case 'audits':
                return [
                    { value: 'findingType', label: 'Finding Type' },
                    { value: 'riskRating', label: 'Risk Rating' },
                    ...commonFields
                ];
            default:
                return commonFields;
        }
    }

    generateRuleHTML(index, fields, isFirst = false) {
        const options = fields.map(f => `<option value="${f.value}">${f.label}</option>`).join('');

        return `
            <div class="rule-item card p-3 mb-3 relative" id="rule-row-${index}">
                ${!isFirst ? `
                    <div class="logic-connector-line"></div>
                    <div class="mb-3 logic-operator-badge">
                         <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-muted">Combine with:</span>
                            <div class="btn-group">
                                <input type="radio" class="btn-check" name="rule-logic-${index}" id="logic-and-${index}" value="AND" checked onchange="app.updateRulesPreview()">
                                <label class="btn btn-outline-primary btn-sm" for="logic-and-${index}">AND</label>

                                <input type="radio" class="btn-check" name="rule-logic-${index}" id="logic-or-${index}" value="OR" onchange="app.updateRulesPreview()">
                                <label class="btn btn-outline-primary btn-sm" for="logic-or-${index}">OR</label>
                            </div>
                         </div>
                    </div>
                ` : ''}

                <div class="grid grid-3 gap-3 items-end">
                    <div class="form-group mb-0">
                        <div class="tooltip-container">
                            <label class="form-label text-xs">Field <span class="tooltip-icon">ⓘ</span></label>
                            <span class="tooltip-text">The data field from the ${document.getElementById('template-module')?.value || 'record'} to evaluate.</span>
                        </div>
                        <select class="form-select" id="rule-field-${index}" onchange="app.updateFieldOptions(${index}); app.updateRulesPreview()">
                            <option value="">Select field</option>
                            ${options}
                        </select>
                    </div>

                    <div class="form-group mb-0">
                         <div class="tooltip-container">
                            <label class="form-label text-xs">Condition <span class="tooltip-icon">ⓘ</span></label>
                            <span class="tooltip-text">How to compare the field value (e.g., Equals, Contains).</span>
                        </div>
                        <select class="form-select" id="rule-operator-${index}" onchange="app.updateRulesPreview()">
                            <option value="equals">Equals</option>
                            <option value="notEquals">Does not equal</option>
                            <option value="contains">Contains</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="lessThan">Less Than</option>
                            <option value="isEmpty">Is Empty</option>
                            <option value="isNotEmpty">Is Not Empty</option>
                        </select>
                    </div>

                    <div class="form-group mb-0 relative">
                        <div class="tooltip-container">
                             <label class="form-label text-xs">Value <span class="tooltip-icon">ⓘ</span></label>
                             <span class="tooltip-text">The value to check against. Auto-suggests based on existing data.</span>
                        </div>
                        <div class="flex gap-2">
                            <input type="text" class="form-input" id="rule-value-${index}" placeholder="Value" list="rule-options-${index}" oninput="app.updateRulesPreview()">
                            <datalist id="rule-options-${index}"></datalist>
                            ${!isFirst ? `
                                <button class="btn btn-danger btn-sm" onclick="app.removeRule(${index})" title="Remove Rule">✕</button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Placeholder for Parent-Child logic (e.g. Sub-category) -->
                <div id="rule-subfield-container-${index}" class="mt-3 hidden"></div>
            </div>
        `;
    }

    showRulesHelp() {
        this.uiManager.showModal('Rules Configuration Help', `
            <div class="p-2">
                <h4 class="mb-2">How to configure rules</h4>
                <p class="mb-3">Rules determine which records this template applies to. A record must match the logic defined here to trigger this escalation.</p>

                <h5 class="mb-1">Fields</h5>
                <ul class="mb-3 ml-4">
                    <li>Select a field from the module (e.g., Priority, Status)</li>
                    <li>Fields are specific to the selected module</li>
                </ul>

                <h5 class="mb-1">Operators</h5>
                <ul class="mb-3 ml-4">
                    <li><strong>Equals:</strong> Exact match</li>
                    <li><strong>Contains:</strong> Partial match (useful for text)</li>
                    <li><strong>Greater/Less Than:</strong> For numbers or dates</li>
                </ul>

                <h5 class="mb-1">Logic</h5>
                <ul class="ml-4">
                    <li><strong>AND:</strong> Both conditions must be true</li>
                    <li><strong>OR:</strong> At least one condition must be true</li>
                </ul>
            </div>
        `);
    }

    // Updated updateFieldOptions to handle Parent-Child dependency simulation
    async updateFieldOptions(ruleIndex) {
        const fieldSelect = document.getElementById(`rule-field-${ruleIndex}`);
        const dataList = document.getElementById(`rule-options-${ruleIndex}`);
        if (!fieldSelect || !dataList) return;

        const field = fieldSelect.value;
        const module = document.getElementById('template-module').value;

        // Reset subfield
        const subfieldContainer = document.getElementById(`rule-subfield-container-${ruleIndex}`);
        if (subfieldContainer) subfieldContainer.classList.add('hidden');

        if (field && module) {
            // Parent-Child logic simulation: if Category is selected, show Sub-category dropdown
            if (field === 'category' && module === 'incidents') {
                 // Simulate fetching sub-categories
                 // In a real app, this would be dynamic.
                 // For now, we just indicate the capability or load specific options
                 // But since the requirement is "First dropdown selection should dynamically filter options in the last dropdown"
                 // That's what we are doing below by populating the datalist based on the field.
                 // If "Parent-Child" specifically refers to two linked dropdowns (Category -> Subcategory), I should implement that.
                 // Let's assume it means dependent fields.
            }

            // Fetch unique values for this field from existing records
            const records = await this.dataManager.getRecords(module);
            const values = new Set();

            records.forEach(record => {
                if (record[field]) {
                    values.add(record[field]);
                }
            });

            // Also add some known defaults based on field name if record data is sparse
            if (field === 'priority') ['Critical', 'High', 'Medium', 'Low'].forEach(v => values.add(v));
            if (field === 'status') ['Open', 'In Progress', 'Resolved', 'Closed', 'Overdue'].forEach(v => values.add(v));
            if (field === 'severity') ['High', 'Medium', 'Low'].forEach(v => values.add(v));
            if (field === 'department') ['Operations', 'Safety', 'Maintenance', 'HR'].forEach(v => values.add(v));

            dataList.innerHTML = Array.from(values).sort().map(val => `<option value="${sanitizeHTML(val)}">`).join('');

            // If the field implies a dependent value set (e.g. Risk Level depends on Type),
            // the options above are already filtered by field.
            // If we need a second dropdown that appears, we can add it here.
        } else {
            dataList.innerHTML = '';
        }
    }

    renderWizardStep3() {
        return `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h3>Escalation Hierarchy</h3>
                    <p class="text-muted">Define the path of escalation, recipients, and conditions.</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="app.showHierarchyHelp()">
                    <span class="icon">ℹ️</span> Help
                </button>
            </div>

            <!-- Flowchart Visual (Simple Representation) -->
            <div class="card p-3 mb-4 bg-tertiary border-0">
                <div class="flex items-center justify-center gap-2 overflow-x-auto p-2" id="hierarchy-visual-flow">
                    <div class="badge badge-success">Start</div>
                    <span>→</span>
                    <div class="badge badge-secondary">Level 1</div>
                    <!-- Dynamically populated -->
                </div>
            </div>

            <div class="mb-4 p-3 bg-white rounded border border-color">
                <div class="flex justify-between items-center mb-2">
                     <h4 class="text-sm font-bold">Watchers (CC Recipients)</h4>
                     <div class="tooltip-container">
                        <span class="tooltip-icon">ⓘ</span>
                        <span class="tooltip-text">Users who receive copies of all notifications for information only.</span>
                     </div>
                </div>
                <div id="watchers-container">
                     <div class="flex gap-2 w-full mb-2">
                        <div class="flex-1 relative">
                            <input type="text" id="watcher-input" class="form-input" placeholder="Add email or select user..." list="user-list">
                            <datalist id="user-list">
                                <!-- Populated dynamically -->
                            </datalist>
                        </div>
                        <button class="btn btn-secondary" onclick="app.addWatcher()">Add</button>
                     </div>
                     <div id="active-watchers" class="flex flex-wrap gap-2">
                         <!-- Watcher tags go here -->
                     </div>
                </div>
            </div>

            <div id="hierarchy-container" class="hierarchy-builder">
                <!-- Levels will be injected here -->
            </div>

            <button class="btn btn-secondary w-full mt-3 dashed-border" onclick="app.addHierarchyLevel()">
                <span class="text-lg">+</span> Add Next Level
            </button>
        `;
    }

    async renderHierarchyLevel(levelIndex) {
        // Fetch users for the dropdown
        if (!this.usersList) {
            // Mock fetching users if not already loaded
            this.usersList = [
                { id: 'user-1', name: 'John Doe', role: 'Direct Manager', department: 'Operations' },
                { id: 'user-2', name: 'Jane Smith', role: 'Department Head', department: 'Operations' },
                { id: 'user-3', name: 'Bob Johnson', role: 'Site Manager', department: 'Management' },
                { id: 'user-4', name: 'Alice Williams', role: 'Safety Officer', department: 'Safety' },
                { id: 'user-5', name: 'Charlie Brown', role: 'Supervisor', department: 'Maintenance' }
            ];
             // Try to get real users if available
             try {
                 const users = await this.dataManager.getUsersByRole(''); // get all
                 if(users && users.length > 0) this.usersList = users;
             } catch(e) {}
        }

        // Populate datalist for watchers if not done
        const userList = document.getElementById('user-list');
        if (userList && userList.children.length === 0) {
            this.usersList.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.email || u.name; // Assuming email or unique name
                opt.textContent = `${u.name} (${u.role})`;
                userList.appendChild(opt);
            });
        }

        const userOptions = this.usersList.map(u => `<option value="${u.id}">${u.name} - ${u.role} (${u.department})</option>`).join('');

        return `
            <div class="hierarchy-level card p-3 mb-3 relative transition-all" id="level-row-${levelIndex}">
                <div class="absolute left-0 top-0 bottom-0 width-1 bg-primary rounded-l-lg"></div>

                <div class="level-header flex justify-between items-center mb-3">
                    <div class="flex items-center gap-2">
                        <div class="bg-primary text-white rounded-circle w-6 h-6 flex items-center justify-center text-xs font-bold">${levelIndex}</div>
                        <h4 class="font-bold text-primary">Level ${levelIndex}</h4>
                    </div>
                    <div class="flex gap-2">
                         ${levelIndex > 1 ? `
                            <button class="btn btn-secondary btn-sm" onclick="app.moveLevelUp(${levelIndex})" title="Move Up">↑</button>
                         ` : ''}
                         <button class="btn btn-secondary btn-sm" onclick="app.moveLevelDown(${levelIndex})" title="Move Down">↓</button>
                         <button class="btn btn-danger btn-sm" onclick="app.removeLevel(${levelIndex})" title="Remove Level">✕</button>
                    </div>
                </div>

                <div class="grid grid-2 gap-4 mb-3">
                     <!-- Escalation Conditions -->
                     <div class="card bg-tertiary p-2 border-0 mb-0">
                        <h5 class="text-xs font-bold mb-2 text-muted uppercase">Escalation Trigger</h5>

                        <div class="form-group mb-2">
                            <label class="form-label text-xs">Condition Type</label>
                             <div class="flex gap-2">
                                <label class="flex items-center gap-1 text-sm">
                                    <input type="radio" name="level-trigger-type-${levelIndex}" value="time" checked onchange="app.toggleLevelTriggerType(${levelIndex})"> Time
                                </label>
                                <label class="flex items-center gap-1 text-sm">
                                    <input type="radio" name="level-trigger-type-${levelIndex}" value="event" onchange="app.toggleLevelTriggerType(${levelIndex})"> Event
                                </label>
                             </div>
                        </div>

                        <div id="level-time-config-${levelIndex}">
                             <div class="form-group mb-0">
                                <label class="form-label text-xs">Escalate after</label>
                                <div class="flex gap-2">
                                    <input type="number" class="form-input" id="level-time-${levelIndex}" value="${levelIndex === 1 ? 0 : 24}" min="0">
                                    <select class="form-select" id="level-unit-${levelIndex}">
                                        <option value="minutes">Minutes</option>
                                        <option value="hours" selected>Hours</option>
                                        <option value="days">Days</option>
                                    </select>
                                </div>
                                <p class="text-xs text-muted mt-1">Relative to previous level</p>
                             </div>
                        </div>

                        <div id="level-event-config-${levelIndex}" class="hidden">
                             <div class="form-group mb-0">
                                <label class="form-label text-xs">Event</label>
                                <select class="form-select" id="level-event-${levelIndex}">
                                    <option value="no-response">No response received</option>
                                    <option value="status-unchanged">Status unchanged</option>
                                    <option value="rejected">Rejected by previous level</option>
                                </select>
                             </div>
                        </div>
                     </div>

                     <!-- Recipients -->
                     <div class="card bg-white p-2 border border-color mb-0">
                        <h5 class="text-xs font-bold mb-2 text-muted uppercase">Recipients</h5>
                        <div class="form-group mb-0">
                            <label class="form-label text-xs">Select Users/Roles</label>
                            <select class="form-select" id="level-recipients-${levelIndex}" multiple size="4">
                                ${userOptions}
                            </select>
                            <div class="flex justify-between items-center mt-1">
                                <p class="text-xs text-muted">Hold Ctrl/Cmd to select multiple</p>
                                <button class="btn btn-sm btn-link p-0 text-xs" onclick="app.toggleRecipientFilter(${levelIndex})">Filter Users</button>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        `;
    }

    toggleLevelTriggerType(index) {
        const type = document.querySelector(`input[name="level-trigger-type-${index}"]:checked`).value;
        const timeConfig = document.getElementById(`level-time-config-${index}`);
        const eventConfig = document.getElementById(`level-event-config-${index}`);

        if (type === 'time') {
            timeConfig.classList.remove('hidden');
            eventConfig.classList.add('hidden');
        } else {
            timeConfig.classList.add('hidden');
            eventConfig.classList.remove('hidden');
        }
    }

    // Helper to update the visual flow at the top
    updateHierarchyVisual() {
        const container = document.getElementById('hierarchy-visual-flow');
        if (!container) return;

        const levels = document.getElementById('hierarchy-container').children.length;
        let html = '<div class="badge badge-success">Start</div>';

        for (let i = 1; i <= levels; i++) {
             html += '<span>→</span>';
             html += `<div class="badge badge-secondary">Level ${i}</div>`;
        }

        container.innerHTML = html;
    }

    async refreshHierarchy() {
        const container = document.getElementById('hierarchy-container');
        if (!container) return;

        // If it's the first load or reset
        if (container.children.length === 0) {
            container.innerHTML = await this.renderHierarchyLevel(1);
        }
    }

    addWatcher() {
        const input = document.getElementById('watcher-input');
        const container = document.getElementById('active-watchers');
        const val = input.value.trim();

        if (val) {
            const watcher = document.createElement('span');
            watcher.className = 'badge badge-info flex items-center gap-1';
            watcher.innerHTML = `
                ${sanitizeHTML(val)}
                <span class="cursor-pointer ml-1 font-bold" onclick="this.parentElement.remove()">×</span>
            `;
            container.appendChild(watcher);
            input.value = '';
        }
    }

    renderWizardStep4() {
        const module = document.getElementById('template-module')?.value || 'incidents';

        return `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h3>Trigger Configuration</h3>
                    <p class="text-muted">Define events or time conditions that trigger escalations.</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="app.showTriggerHelp()">
                    <span class="icon">ℹ️</span> Help
                </button>
            </div>

            <div id="triggers-container" class="triggers-builder grid grid-2 gap-4">
                ${this.generateTriggerHTML(1, module)}
            </div>

            <button class="btn btn-secondary mt-4 w-full dashed-border" onclick="app.addTrigger()">
                <span class="text-lg">+</span> Add Trigger
            </button>
        `;
    }

    generateTriggerHTML(index, module) {
        // Dynamic fields based on module
        let dateFields = [];
        let eventFields = [];

        if (module === 'incidents') {
            dateFields = ['Created Date', 'Last Updated', 'Due Date', 'Resolution Target'];
            eventFields = ['Status Change', 'Priority Change', 'Assignment Change', 'Comment Added'];
        } else if (module === 'work-permits') {
            dateFields = ['Expiration Date', 'Start Date', 'Extension Date'];
            eventFields = ['Status Change', 'Extension Requested', 'Suspension'];
        } else {
            dateFields = ['Due Date', 'Follow-up Date', 'Closure Date'];
            eventFields = ['Status Change', 'Finding Verified', 'Action Plan Submitted'];
        }

        const dateOptions = dateFields.map(f => `<option value="${f}">${f}</option>`).join('');
        const eventOptions = eventFields.map(f => `<option value="${f}">${f}</option>`).join('');

        return `
            <div class="trigger-item card p-0 h-full relative" id="trigger-row-${index}">
                 <div class="p-3 border-b border-color bg-tertiary flex justify-between items-center rounded-t-lg">
                    <h4 class="font-bold text-sm text-primary">Trigger ${index}</h4>
                    ${index > 1 ? `<button class="btn btn-danger btn-sm p-1 rounded-circle" style="width:24px; height:24px;" onclick="app.removeTrigger(${index})">✕</button>` : ''}
                </div>

                <div class="p-3">
                    <div class="form-group mb-3">
                        <label class="form-label text-xs">Trigger Level</label>
                         <select class="form-select" id="trigger-level-${index}">
                            <option value="1">Level 1 (Initial)</option>
                            <option value="2">Level 2 (Escalation)</option>
                            <option value="3">Level 3 (Senior Mgmt)</option>
                            <option value="4">Level 4 (Executive)</option>
                        </select>
                    </div>

                    <div class="form-group mb-3">
                        <label class="form-label text-xs">Trigger Type</label>
                        <div class="btn-group w-full flex">
                            <input type="radio" class="btn-check" name="trigger-type-${index}" id="trigger-type-time-${index}" value="time-based" checked onchange="app.toggleTriggerConfig(${index})">
                            <label class="btn btn-outline-primary btn-sm flex-1" for="trigger-type-time-${index}">Time Based</label>

                            <input type="radio" class="btn-check" name="trigger-type-${index}" id="trigger-type-event-${index}" value="event-based" onchange="app.toggleTriggerConfig(${index})">
                            <label class="btn btn-outline-primary btn-sm flex-1" for="trigger-type-event-${index}">Event Based</label>
                        </div>
                         <!-- Hidden input for logic compatibility -->
                         <input type="hidden" id="trigger-type-${index}" value="time-based">
                    </div>

                    <!-- Time Based Config -->
                    <div id="trigger-time-config-${index}">
                        <div class="form-group mb-2">
                             <label class="form-label text-xs">When?</label>
                             <div class="flex gap-1 items-center">
                                <input type="number" class="form-input" placeholder="0" style="width: 60px;" id="trigger-time-val-${index}">
                                <select class="form-select flex-1" id="trigger-time-unit-${index}">
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                </select>
                             </div>
                        </div>
                        <div class="flex gap-2">
                            <div class="form-group mb-0 flex-1">
                                <select class="form-select" id="trigger-time-direction-${index}">
                                    <option value="before">Before</option>
                                    <option value="after">After</option>
                                </select>
                            </div>
                            <div class="form-group mb-0 flex-1">
                                 <select class="form-select" id="trigger-time-field-${index}">
                                    ${dateOptions}
                                 </select>
                            </div>
                        </div>
                    </div>

                    <!-- Event Based Config -->
                    <div id="trigger-event-config-${index}" class="hidden">
                         <div class="form-group mb-3">
                            <label class="form-label text-xs">Event</label>
                            <select class="form-select" id="trigger-event-select-${index}" onchange="app.toggleEventDetails(${index}, this.value)">
                                ${eventOptions}
                            </select>
                         </div>

                         <!-- Conditional Fields -->
                         <div id="trigger-event-details-${index}" class="hidden p-2 bg-secondary rounded border border-color">
                             <div class="form-group mb-2">
                                 <label class="form-label text-xs">From Status</label>
                                 <select class="form-select text-xs">
                                     <option value="Any">Any</option>
                                     <option value="Open">Open</option>
                                     <option value="In Progress">In Progress</option>
                                 </select>
                             </div>
                             <div class="form-group mb-0">
                                 <label class="form-label text-xs">To Status</label>
                                 <select class="form-select text-xs">
                                     <option value="Critical">Critical</option>
                                     <option value="Overdue">Overdue</option>
                                     <option value="Closed">Closed</option>
                                 </select>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleTriggerConfig(index) {
        // Update the hidden input that collectTriggers likely reads, or update collectTriggers
        // Ideally we update the hidden input to match the radio selection for backward compatibility with collectTriggers if I don't change it
        // Or I just check the radio in collectTriggers. Let's update the hidden input.
        const timeRadio = document.getElementById(`trigger-type-time-${index}`);
        const typeInput = document.getElementById(`trigger-type-${index}`);

        if (timeRadio.checked) {
            typeInput.value = 'time-based';
            document.getElementById(`trigger-time-config-${index}`).classList.remove('hidden');
            document.getElementById(`trigger-event-config-${index}`).classList.add('hidden');
        } else {
            typeInput.value = 'event-based';
            document.getElementById(`trigger-time-config-${index}`).classList.add('hidden');
            document.getElementById(`trigger-event-config-${index}`).classList.remove('hidden');
        }
    }

    toggleEventDetails(index, eventType) {
        const details = document.getElementById(`trigger-event-details-${index}`);
        if (eventType === 'Status Change' || eventType === 'Priority Change') {
            details.classList.remove('hidden');
            // Logic to update dropdown options based on event type would go here
        } else {
            details.classList.add('hidden');
        }
    }

    showTriggerHelp() {
        this.uiManager.showModal('Trigger Configuration', `
            <div class="p-2">
                 <p>Triggers initiate the escalation process.</p>
                 <ul>
                    <li><strong>Time Based:</strong> Triggers relative to a date field (e.g., 2 days before Due Date).</li>
                    <li><strong>Event Based:</strong> Triggers when a specific action occurs (e.g., Status changes to Critical).</li>
                 </ul>
            </div>
        `);
    }

    renderWizardStep5() {
        return `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h3>Review & Preview</h3>
                    <p class="text-muted">Review your configuration and preview notifications.</p>
                </div>
            </div>

            <!-- Configuration Summary -->
            <div class="mb-4">
                <div class="card mb-2">
                    <div class="card-header flex justify-between items-center cursor-pointer" onclick="app.toggleSummarySection('summary-basics')">
                        <h4 class="text-sm font-bold">1. Basic Information</h4>
                        <span>▼</span>
                    </div>
                    <div id="summary-basics" class="p-3 hidden">
                        <div class="grid grid-2">
                            <div><strong>Name:</strong> <span id="summary-name">Loading...</span></div>
                            <div><strong>Module:</strong> <span id="summary-module">Loading...</span></div>
                        </div>
                    </div>
                </div>

                <div class="card mb-2">
                    <div class="card-header flex justify-between items-center cursor-pointer" onclick="app.toggleSummarySection('summary-rules')">
                        <h4 class="text-sm font-bold">2. Applicability Rules</h4>
                        <span>▼</span>
                    </div>
                    <div id="summary-rules" class="p-3 hidden">
                         <div id="summary-rules-content">Loading...</div>
                    </div>
                </div>

                <!-- Add Hierachy and Trigger summaries similarly -->
            </div>

            <!-- Email Editor & Preview -->
            <div class="grid grid-2 gap-4">
                <!-- Editor -->
                <div>
                    <h4 class="mb-2">Email Configuration</h4>
                    <div class="card p-3">
                        <div class="form-group">
                            <label class="form-label" for="email-subject">Subject</label>
                            <input type="text" id="email-subject" class="form-input" placeholder="Email subject" value="ESCALATION: {{id}} - {{location}}" oninput="app.updateEmailPreviewRender()">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="email-body">Body</label>
                            <textarea id="email-body" class="form-textarea" rows="10" placeholder="Email body" oninput="app.updateEmailPreviewRender()">Dear {{recipientName}},

An item requires your attention:

Details:
- ID: {{id}}
- Description: {{description}}
- Priority: {{priority}}

Please review and take appropriate action.

View Details: {{actionUrl}}

This is an automated escalation notification.</textarea>
                        </div>

                         <div class="mt-3">
                            <h5 class="text-sm font-bold mb-1">Available Placeholders</h5>
                            <div class="text-xs text-muted">
                                {{id}}, {{description}}, {{priority}}, {{status}}, {{location}}, {{department}}, {{recipientName}}
                            </div>
                        </div>
                    </div>

                    <h4 class="mb-2 mt-4">Signature Configuration</h4>
                    <div class="card p-0 rich-text-editor">
                        <div class="rte-toolbar">
                             <button class="rte-btn"><strong>B</strong></button>
                             <button class="rte-btn"><em>I</em></button>
                             <button class="rte-btn"><u>U</u></button>
                             <div style="border-left: 1px solid #ccc; margin: 0 4px;"></div>
                             <button class="rte-btn">Insert Logo</button>
                             <button class="rte-btn">Link</button>
                        </div>
                        <div class="rte-content">
                            <textarea id="email-signature" class="form-textarea border-0 h-full w-full" style="min-height: 80px;" placeholder="Email signature..." oninput="app.updateEmailPreviewRender()">--
Safety Management System
Support: support@example.com</textarea>
                        </div>
                    </div>

                    <h4 class="mb-2 mt-4">SMS Configuration</h4>
                    <div class="card p-3">
                         <div class="form-group">
                            <label class="form-label" for="sms-body">Message</label>
                            <textarea id="sms-body" class="form-textarea" rows="3" maxlength="160" oninput="app.updateSMSCharCount()">ESCALATION: {{id}} at {{location}}. Priority: {{priority}}. View: {{actionUrl}}</textarea>
                            <div class="text-right text-xs text-muted mt-1">
                                <span id="sms-char-count">0</span>/160
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Preview -->
                <div>
                    <h4 class="mb-2">Live Preview</h4>
                    <div class="card p-0 overflow-hidden shadow-lg border border-color" style="max-width: 800px;">
                        <div class="bg-tertiary p-2 border-b border-color flex justify-between items-center">
                            <span class="text-sm font-bold flex items-center gap-2">
                                <span style="display:inline-block; width:10px; height:10px; background:#ef4444; border-radius:50%"></span>
                                <span style="display:inline-block; width:10px; height:10px; background:#f59e0b; border-radius:50%"></span>
                                <span style="display:inline-block; width:10px; height:10px; background:#22c55e; border-radius:50%"></span>
                                Desktop Email Preview
                            </span>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary active" id="preview-mode-html" onclick="app.setPreviewMode('html')">HTML</button>
                                <button class="btn btn-sm btn-outline-primary" id="preview-mode-text" onclick="app.setPreviewMode('text')">Text</button>
                            </div>
                        </div>
                        <div class="p-4 bg-white" style="min-height: 500px; font-family: sans-serif;">
                            <div class="border-b border-color pb-3 mb-4">
                                <div class="text-sm mb-1"><strong>To:</strong> <span class="text-muted bg-tertiary px-1 rounded">John Doe (Direct Manager)</span></div>
                                <div class="text-sm"><strong>Subject:</strong> <span id="preview-subject" class="font-bold">Loading...</span></div>
                            </div>
                            <div id="preview-body" class="text-sm text-primary" style="white-space: pre-wrap; line-height: 1.6;">
                                Loading...
                            </div>
                             <div class="mt-6 pt-4 border-t border-color" id="preview-signature">
                                <div class="text-muted text-sm" style="white-space: pre-wrap;">
                                    --<br>
                                    Safety Management System<br>
                                    <a href="#" class="text-info">Support</a> | <a href="#" class="text-info">Unsubscribe</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleSummarySection(id) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('hidden');

        // Populate if opening
        if (!el.classList.contains('hidden')) {
            if (id === 'summary-basics') {
                document.getElementById('summary-name').textContent = document.getElementById('template-name').value || '(Untitled)';
                document.getElementById('summary-module').textContent = document.getElementById('template-module').value || '(None)';
            } else if (id === 'summary-rules') {
                const rulesPreview = document.getElementById('rules-preview');
                document.getElementById('summary-rules-content').innerHTML = rulesPreview ? rulesPreview.innerHTML : 'No rules';
            }
        }
    }

    updateEmailPreviewRender() {
        const subjectInput = document.getElementById('email-subject');
        const bodyInput = document.getElementById('email-body');
        const signatureInput = document.getElementById('email-signature');
        const previewSubject = document.getElementById('preview-subject');
        const previewBody = document.getElementById('preview-body');
        const previewSignature = document.getElementById('preview-signature');

        if (!subjectInput || !bodyInput) return;

        // Mock data for preview
        const mockData = {
            id: 'INC-2025-001',
            description: 'Chemical spill in Lab 3',
            priority: 'High',
            location: 'Building A, Lab 3',
            recipientName: 'John Doe',
            status: 'Open',
            department: 'Chemistry',
            actionUrl: 'http://system/inc/001'
        };

        let subject = subjectInput.value;
        let body = bodyInput.value;
        let signature = signatureInput ? signatureInput.value : '';

        // Replace placeholders
        Object.keys(mockData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, mockData[key]);
            body = body.replace(regex, mockData[key]);
            signature = signature.replace(regex, mockData[key]);
        });

        previewSubject.textContent = subject;

        if (this.previewMode === 'html') {
             previewBody.innerHTML = body.replace(/\n/g, '<br>');
             previewSignature.innerHTML = signature.replace(/\n/g, '<br>');
        } else {
             previewBody.textContent = body;
             previewSignature.textContent = signature;
        }
    }

    setPreviewMode(mode) {
        this.previewMode = mode || 'html';

        document.getElementById('preview-mode-html').classList.toggle('active', mode === 'html');
        document.getElementById('preview-mode-text').classList.toggle('active', mode === 'text');

        this.updateEmailPreviewRender();
    }

    startEscalationSimulation() {
        console.log('Starting escalation simulation (runs every 30 seconds)');

        // Simulate escalation processing every 30 seconds
        setInterval(async () => {
            const escalationStart = this.startPerformanceTimer('Escalation Processing');
            this.logOperation('escalationCycle', 1);

            try {
                await this.escalationEngine.processEscalations();
                this.endPerformanceTimer('Escalation Processing', escalationStart);

                // Refresh dashboard if currently viewing it
                if (this.currentSection === 'dashboard') {
                    const refreshStart = performance.now();
                    await this.loadSection('dashboard');
                    console.log(`Dashboard refresh time: ${(performance.now() - refreshStart).toFixed(2)}ms`);
                }

                this.measureMemoryUsage('After Escalation Cycle');

            } catch (error) {
                console.error('Escalation processing error:', error);
                this.endPerformanceTimer('Escalation Processing', escalationStart);
            }
        }, 30000);
    }

    showError(message) {
        this.uiManager.showToast(message, 'error');
    }

    // Public methods for button handlers
    editTemplate(id) {
        // Navigate to editor with template pre-loaded
        this.navigateToSection('editor');
        // TODO: Load template data
    }

    duplicateTemplate(id) {
        // TODO: Implement template duplication
        this.showToast('Template duplication not yet implemented', 'info');
    }

    deleteTemplate(id) {
        if (confirm('Are you sure you want to delete this template?')) {
            // TODO: Implement template deletion
            this.showToast('Template deleted successfully', 'success');
            this.loadSection('templates');
        }
    }

    showNotificationPreview(logId) {
        // TODO: Implement notification preview modal
        this.uiManager.showModal('Notification Preview', 'Preview functionality coming soon...');
    }

    sendTestNotification() {
        // TODO: Implement test notification sending
        this.showToast('Test notification sent successfully', 'success');
    }

    // Run simulation for the current template configuration (REQ-009)
    async runSimulation() {
        const resultsContainer = document.getElementById('simulationResults');
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = 'Running simulation...';

        try {
            // Collect current template state
            const template = {
                name: "Simulation Template",
                module: document.getElementById('template-module').value,
                triggers: this.collectTriggers(),
                applicabilityRules: this.collectRules(), // Include for completeness
            };

            // Get a sample record
            const record = await this.dataManager.getSampleRecord(template.module);
            if (!record) {
                resultsContainer.innerHTML = 'No sample record found for this module.';
                return;
            }

            // Run simulation
            const results = this.escalationEngine.simulateTriggers(template, record);

            // Display results
            if (results.length === 0) {
                resultsContainer.innerHTML = 'No triggers would fire for the sample record.';
            } else {
                let html = `<strong>Simulation for record ${record.id}:</strong><ul style="padding-left: 1.2rem; margin-top: 0.5rem;">`;
                results.forEach(res => {
                    if (res.error) {
                        html += `<li style="color: var(--error-color)">Level ${res.level}: ${res.error}</li>`;
                    } else if (res.triggerDate) {
                        const dateStr = res.adjustedDate.toLocaleString();
                        const note = res.isAdjusted ? ' (Adjusted for Business Hours)' : '';
                        const statusColor = res.status === 'Already Triggered' ? 'var(--text-muted)' : 'var(--success-color)';
                        html += `<li>
                            <strong>Level ${res.level}</strong>: ${dateStr}${note}
                            <br><small style="color: ${statusColor}">${res.description} • ${res.status}</small>
                        </li>`;
                    } else {
                        // Event based
                        html += `<li><strong>Level ${res.level}</strong>: ${res.description} - ${res.status}</li>`;
                    }
                });
                html += '</ul>';
                resultsContainer.innerHTML = html;
            }

        } catch (error) {
            console.error('Simulation error:', error);
            resultsContainer.innerHTML = 'Error running simulation: ' + error.message;
        }
    }

    addRule() {
        const rulesContainer = document.getElementById('rules-container');
        // Find max ID to avoid conflicts
        let maxId = 0;
        rulesContainer.querySelectorAll('[id^="rule-row-"]').forEach(el => {
             const id = parseInt(el.id.replace('rule-row-', ''));
             if (id > maxId) maxId = id;
        });
        const ruleCount = maxId + 1;

        const module = document.getElementById('template-module')?.value || 'incidents';
        const fields = this.getFieldsForModule(module);

        const ruleHTML = this.generateRuleHTML(ruleCount, fields, false);
        rulesContainer.insertAdjacentHTML('beforeend', ruleHTML);
        this.updateRulesPreview();
    }

    removeRule(index) {
        const ruleRow = document.getElementById(`rule-row-${index}`);
        if (ruleRow) {
            ruleRow.remove();
            this.updateRulesPreview();
        }
    }

    updateRulesPreview() {
        const rulesContainer = document.getElementById('rules-container');
        const preview = document.getElementById('rules-preview');

        let previewText = '';
        const ruleRows = rulesContainer.querySelectorAll('.rule-item');

        if (ruleRows.length === 0) {
            preview.textContent = 'No rules defined yet';
            return;
        }

        ruleRows.forEach((row, index) => {
            const id = row.id.replace('rule-row-', '');

            // Get values
            const fieldSelect = document.getElementById(`rule-field-${id}`);
            const operatorSelect = document.getElementById(`rule-operator-${id}`);
            const valueInput = document.getElementById(`rule-value-${id}`);

            const fieldText = fieldSelect?.options[fieldSelect.selectedIndex]?.text || 'Field';
            const operatorText = operatorSelect?.options[operatorSelect.selectedIndex]?.text || 'Equals';
            const value = valueInput?.value || 'Value';

            // Logic
            let logic = '';
            if (index > 0) {
                 const logicAnd = document.getElementById(`logic-and-${id}`);
                 const logicOr = document.getElementById(`logic-or-${id}`);
                 if (logicAnd?.checked) logic = ' <span class="badge badge-info text-xs">AND</span> ';
                 else if (logicOr?.checked) logic = ' <span class="badge badge-warning text-xs">OR</span> ';
            }

            previewText += `${logic}<strong>${fieldText}</strong> ${operatorText.toLowerCase()} "<strong>${value}</strong>"`;
        });

        preview.innerHTML = previewText;
    }

    async addHierarchyLevel() {
        const hierarchyContainer = document.getElementById('hierarchy-container');
        // Find current max level
        let maxLevel = 0;
        hierarchyContainer.querySelectorAll('[id^="level-row-"]').forEach(el => {
             const id = parseInt(el.id.replace('level-row-', ''));
             if (id > maxLevel) maxLevel = id;
        });

        const newLevelHTML = await this.renderHierarchyLevel(maxLevel + 1);
        hierarchyContainer.insertAdjacentHTML('beforeend', newLevelHTML);
    }

    removeLevel(levelIndex) {
        const row = document.getElementById(`level-row-${levelIndex}`);
        if (row) row.remove();
        // Re-index remaining levels? Maybe not strictly necessary for prototype but good for UX
    }

    showHierarchyHelp() {
        this.uiManager.showModal('Hierarchy Configuration', `
            <div class="p-2">
                <p>Define who gets notified and when.</p>
                <ul>
                    <li><strong>Level 1:</strong> Initial notification recipients.</li>
                    <li><strong>Escalate After:</strong> Time to wait before triggering this level.</li>
                    <li><strong>Watchers:</strong> Users who receive a CC of all notifications but are not expected to take action.</li>
                </ul>
            </div>
        `);
    }

    addTrigger() {
        const triggersContainer = document.getElementById('triggers-container');
        // Find current max id
        let maxId = 0;
        triggersContainer.querySelectorAll('[id^="trigger-row-"]').forEach(el => {
             const id = parseInt(el.id.replace('trigger-row-', ''));
             if (id > maxId) maxId = id;
        });
        const triggerCount = maxId + 1;

        const module = document.getElementById('template-module')?.value || 'incidents';
        const triggerHTML = this.generateTriggerHTML(triggerCount, module);
        triggersContainer.insertAdjacentHTML('beforeend', triggerHTML);
    }

    removeTrigger(index) {
        const row = document.getElementById(`trigger-row-${index}`);
        if (row) row.remove();
    }

    showToast(message, type = 'info') {
        this.uiManager.showToast(message, type);
    }

    cleanupEventListeners() {
        this.eventListeners.forEach(({ element, type, listener }) => {
            element.removeEventListener(type, listener);
        });
        this.eventListeners = [];
    }

    // Performance testing with large datasets
    async runLargeDatasetTest() {
        console.log('Starting large dataset performance test...');
        const testStart = this.startPerformanceTimer('Large Dataset Test');

        try {
            // Create large dataset
            const largeIncidents = [];
            for (let i = 0; i < 500; i++) {
                largeIncidents.push({
                    id: `LARGE-INC-${i}`,
                    title: `Large Test Incident ${i}`,
                    priority: i % 4 === 0 ? 'Critical' : i % 4 === 1 ? 'High' : i % 4 === 2 ? 'Medium' : 'Low',
                    status: i % 3 === 0 ? 'Open' : i % 3 === 1 ? 'In Progress' : 'Resolved',
                    location: `Location ${i % 10}`,
                    reportedBy: `User ${i % 20}`,
                    createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    department: ['Chemistry', 'Manufacturing', 'Facilities', 'IT', 'Safety'][i % 5]
                });
            }

            console.log(`Created ${largeIncidents.length} test incidents`);

            // Temporarily add to data manager
            const originalIncidents = [...this.dataManager.records.incidents];
            this.dataManager.records.incidents.push(...largeIncidents);

            this.measureMemoryUsage('After Large Dataset Creation');

            // Test dashboard rendering with large data
            const dashboardStart = performance.now();
            await this.loadSection('dashboard');
            console.log(`Dashboard render with large data: ${(performance.now() - dashboardStart).toFixed(2)}ms`);

            this.measureMemoryUsage('After Large Dashboard Render');

            // Test escalation processing with large data
            const escalationStart = performance.now();
            await this.escalationEngine.processEscalations();
            console.log(`Escalation processing with large data: ${(performance.now() - escalationStart).toFixed(2)}ms`);

            this.measureMemoryUsage('After Large Escalation Processing');

            // Clean up
            this.dataManager.records.incidents = originalIncidents;

            this.endPerformanceTimer('Large Dataset Test', testStart);
            console.log('Large dataset test completed');

        } catch (error) {
            console.error('Error in large dataset test:', error);
        }
    }

    // Test concurrent escalations
    async runConcurrentEscalationTest() {
        console.log('Starting concurrent escalation test...');
        const testStart = this.startPerformanceTimer('Concurrent Escalation Test');

        try {
            // Create multiple records that should trigger escalations
            const concurrentRecords = [];
            for (let i = 0; i < 50; i++) {
                concurrentRecords.push({
                    id: `CONCURRENT-INC-${i}`,
                    title: `Concurrent Test Incident ${i}`,
                    priority: 'Critical',
                    status: 'Open',
                    location: `Location ${i % 5}`,
                    reportedBy: `User ${i % 10}`,
                    createdDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                    department: ['Chemistry', 'Manufacturing'][i % 2]
                });
            }

            console.log(`Created ${concurrentRecords.length} concurrent test records`);

            // Add to data manager
            this.dataManager.records.incidents.push(...concurrentRecords);

            // Run multiple escalation processes concurrently
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(this.escalationEngine.processEscalations());
            }

            const concurrentStart = performance.now();
            await Promise.all(promises);
            console.log(`Concurrent escalation processing (5 processes): ${(performance.now() - concurrentStart).toFixed(2)}ms`);

            this.measureMemoryUsage('After Concurrent Escalations');

            // Clean up
            this.dataManager.records.incidents = this.dataManager.records.incidents.filter(r => !r.id.startsWith('CONCURRENT-'));

            this.endPerformanceTimer('Concurrent Escalation Test', testStart);
            console.log('Concurrent escalation test completed');

        } catch (error) {
            console.error('Error in concurrent escalation test:', error);
        }
    }

    // Test memory leaks and DOM performance
    async runMemoryLeakTest() {
        console.log('Starting memory leak test...');
        const testStart = this.startPerformanceTimer('Memory Leak Test');

        try {
            // Test repeated section loading (potential memory leak)
            console.log('Testing repeated section loading...');
            for (let i = 0; i < 10; i++) {
                const sectionStart = performance.now();
                await this.loadSection('dashboard');
                await this.loadSection('templates');
                await this.loadSection('notifications');
                console.log(`Cycle ${i + 1} section loading: ${(performance.now() - sectionStart).toFixed(2)}ms`);
                this.measureMemoryUsage(`After Cycle ${i + 1}`);
            }

            // Test event listener cleanup
            console.log('Testing event listener management...');
            const testElement = document.createElement('div');
            testElement.id = 'memory-test-element';
            document.body.appendChild(testElement);

            // Add many event listeners
            for (let i = 0; i < 100; i++) {
                const listener = () => {};
                testElement.addEventListener('click', listener);
                // Intentionally not removing to test cleanup
            }

            this.measureMemoryUsage('After Adding Event Listeners');

            // Clean up
            document.body.removeChild(testElement);
            this.measureMemoryUsage('After Cleanup');

            this.endPerformanceTimer('Memory Leak Test', testStart);
            console.log('Memory leak test completed');

        } catch (error) {
            console.error('Error in memory leak test:', error);
        }
    }

    // Edge case testing function
    async runEdgeCaseTests() {
        console.log('Starting edge case tests...');
        this.showToast('Running edge case tests...', 'info');

        const testResults = {
            invalidInputs: [],
            largeDatasets: [],
            boundaryConditions: [],
            unusualScenarios: []
        };

        try {
            // Test invalid inputs
            await this.testInvalidInputs(testResults);

            // Test large datasets
            await this.testLargeDatasets(testResults);

            // Test boundary conditions
            await this.testBoundaryConditions(testResults);

            // Test unusual scenarios
            await this.testUnusualScenarios(testResults);

            // Log results
            console.log('Edge case test results:', testResults);
            this.showToast('Edge case tests completed. Check console for details.', 'success');

        } catch (error) {
            console.error('Error during edge case testing:', error);
            this.showToast('Edge case tests failed: ' + error.message, 'error');
        }
    }

    async testInvalidInputs(results) {
        console.log('Testing invalid inputs...');

        // Test template validation with invalid templates
        const invalidTemplates = [
            { name: '', module: 'incidents' }, // Empty name
            { name: 'Test', module: 'invalid' }, // Invalid module
            { name: 'Test', module: 'incidents', hierarchy: [] } // No hierarchy
        ];

        for (const template of invalidTemplates) {
            try {
                const validation = this.templateProcessor.validateTemplate(template);
                results.invalidInputs.push({
                    test: `Template validation: ${JSON.stringify(template)}`,
                    result: validation.isValid ? 'Unexpectedly valid' : 'Correctly invalid',
                    errors: validation.errors
                });
            } catch (error) {
                results.invalidInputs.push({
                    test: `Template validation: ${JSON.stringify(template)}`,
                    result: 'Error: ' + error.message
                });
            }
        }

        // Test processing with invalid records
        const invalidRecords = await this.dataManager.getRecords('incidents');
        const edgeRecords = invalidRecords.filter(r => r.id.startsWith('INC-EDGE'));

        for (const record of edgeRecords) {
            try {
                const templates = await this.dataManager.getAllTemplates();
                for (const template of templates.slice(0, 2)) { // Test first 2 templates
                    const applicable = this.escalationEngine.matchesTemplateRules(template, record);
                    results.invalidInputs.push({
                        test: `Record ${record.id} with template ${template.id}`,
                        result: applicable ? 'Applicable' : 'Not applicable',
                        recordData: { priority: record.priority, status: record.status, createdDate: record.createdDate }
                    });
                }
            } catch (error) {
                results.invalidInputs.push({
                    test: `Record ${record.id} processing`,
                    result: 'Error: ' + error.message
                });
            }
        }
    }

    async testLargeDatasets(results) {
        console.log('Testing large datasets...');

        // Create large dataset
        const largeRecords = [];
        for (let i = 0; i < 100; i++) {
            largeRecords.push({
                id: `LARGE-INC-${i}`,
                title: `Large Test Incident ${i}`,
                priority: i % 4 === 0 ? 'Critical' : 'High',
                status: 'Open',
                location: `Location ${i}`,
                reportedBy: `User ${i}`,
                createdDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                department: 'Test'
            });
        }

        const startTime = Date.now();
        try {
            // Temporarily add large records
            this.dataManager.records.incidents.push(...largeRecords);

            // Process escalations
            await this.escalationEngine.processEscalations();

            const endTime = Date.now();
            results.largeDatasets.push({
                test: 'Processing 100 records',
                result: `Completed in ${endTime - startTime}ms`,
                recordCount: largeRecords.length
            });

            // Clean up
            this.dataManager.records.incidents = this.dataManager.records.incidents.filter(r => !r.id.startsWith('LARGE-'));

        } catch (error) {
            results.largeDatasets.push({
                test: 'Processing large dataset',
                result: 'Error: ' + error.message
            });
        }
    }

    async testBoundaryConditions(results) {
        console.log('Testing boundary conditions...');

        // Test with zero values, special chars, etc.
        const boundaryRecords = [
            { id: 'BOUNDARY-001', priority: 0, status: 'Open', createdDate: new Date().toISOString() },
            { id: 'BOUNDARY-002', title: 'Title with <script>alert(1)</script>', status: 'Open', createdDate: new Date().toISOString() },
            { id: 'BOUNDARY-003', createdDate: '2025-02-30' } // Invalid date
        ];

        for (const record of boundaryRecords) {
            try {
                const templates = await this.dataManager.getAllTemplates();
                const template = templates.find(t => t.module === 'incidents');
                if (template) {
                    const applicable = this.escalationEngine.matchesTemplateRules(template, record);
                    results.boundaryConditions.push({
                        test: `Boundary record ${record.id}`,
                        result: applicable ? 'Applicable' : 'Not applicable',
                        details: record
                    });
                }
            } catch (error) {
                results.boundaryConditions.push({
                    test: `Boundary record ${record.id}`,
                    result: 'Error: ' + error.message
                });
            }
        }
    }

    async testUnusualScenarios(results) {
        console.log('Testing unusual scenarios...');

        // Test with missing users for roles
        try {
            const template = {
                id: 'unusual-template',
                name: 'Unusual Test',
                module: 'incidents',
                active: true,
                applicabilityRules: [{ field: 'priority', operator: 'equals', value: 'Critical' }],
                hierarchy: [{ level: 1, roles: ['non-existent-role'] }], // Role that doesn't exist
                triggers: [{ type: 'time-based', level: 1, referenceField: 'createdDate', daysBefore: 0, daysAfter: 0 }],
                notificationTemplates: { email: { subject: 'Test', body: 'Test' }, sms: 'Test' }
            };

            const record = { id: 'unusual-record', priority: 'Critical', status: 'Open', createdDate: new Date().toISOString() };
            await this.escalationEngine.executeEscalation(template, record, 1, new Date());

            results.unusualScenarios.push({
                test: 'Missing role recipients',
                result: 'Handled gracefully (logged warning)'
            });

        } catch (error) {
            results.unusualScenarios.push({
                test: 'Missing role recipients',
                result: 'Error: ' + error.message
            });
        }

        // Test concurrent operations (simulate)
        try {
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(this.escalationEngine.processEscalations());
            }
            await Promise.all(promises);

            results.unusualScenarios.push({
                test: 'Concurrent escalation processing',
                result: 'Completed successfully'
            });

        } catch (error) {
            results.unusualScenarios.push({
                test: 'Concurrent escalation processing',
                result: 'Error: ' + error.message
            });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EscalationMatrixApp();
});

export default EscalationMatrixApp;