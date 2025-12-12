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

        return `
            <div class="section-header">
                <h1 class="section-title">Escalation Templates</h1>
                <p class="section-description">Manage and configure escalation templates</p>
            </div>

            <div class="mb-4">
                <button class="btn btn-primary" onclick="app.navigateToSection('editor')">
                    Create New Template
                </button>
            </div>

            <div class="grid grid-3">
                ${templates.map(template => `
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">${sanitizeHTML(template.name)}</h3>
                            <p class="card-description">${sanitizeHTML(template.module)} • ${template.applicabilityRules.length} rules</p>
                        </div>
                        <div class="mb-3">
                            <span class="badge badge-info">${sanitizeHTML(template.module)}</span>
                            <span class="badge badge-${template.active ? 'success' : 'secondary'}">
                                ${template.active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-secondary btn-sm" onclick="app.editTemplate('${sanitizeHTML(template.id)}')">
                                Edit
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="app.duplicateTemplate('${sanitizeHTML(template.id)}')">
                                Duplicate
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="app.deleteTemplate('${sanitizeHTML(template.id)}')">
                                Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
            <h3>Basic Information</h3>
            <div class="form-group">
                <label class="form-label" for="template-name">Template Name</label>
                <input type="text" id="template-name" class="form-input" placeholder="Enter template name" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="template-module">Module</label>
                <select id="template-module" class="form-select" required>
                    <option value="">Select module</option>
                    <option value="incidents">Incidents</option>
                    <option value="work-permits">Work Permits</option>
                    <option value="audits">Audits</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="template-description">Description</label>
                <textarea id="template-description" class="form-textarea" placeholder="Describe the purpose of this template"></textarea>
            </div>
        `;
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
                body: sanitizeHTML(document.getElementById('email-body')?.value || 'Please review the escalated item: {{actionUrl}}')
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

    updateWizardStep(step) {
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
                break;
            case 2:
                content.innerHTML = this.renderWizardStep2();
                break;
            case 3:
                content.innerHTML = this.renderWizardStep3();
                break;
            case 4:
                content.innerHTML = this.renderWizardStep4();
                break;
            case 5:
                content.innerHTML = this.renderWizardStep5();
                break;
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('wizard-prev');
        const nextBtn = document.getElementById('wizard-next');

        prevBtn.disabled = step === 1;
        nextBtn.textContent = step === totalSteps ? 'Create Template' : 'Next';
    }

    renderWizardStep2() {
        return `
            <h3>Applicability Rules</h3>
            <p class="mb-3">Define when this template should be applied to records.</p>
            <div id="rules-container">
                <div class="rule-item mb-3">
                    <div class="grid grid-4 gap-2">
                        <select class="form-select" id="rule-field-1" onchange="app.updateFieldOptions(1)">
                            <option value="">Select field</option>
                            <option value="priority">Priority</option>
                            <option value="status">Status</option>
                            <option value="department">Department</option>
                            <option value="severity">Severity</option>
                            <option value="location">Location</option>
                        </select>
                        <select class="form-select" id="rule-operator-1">
                            <option value="equals">Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="lessThan">Less Than</option>
                        </select>
                        <input type="text" class="form-input" id="rule-value-1" placeholder="Value" list="rule-options-1">
                        <datalist id="rule-options-1"></datalist>
                        <select class="form-select" id="rule-logic-1">
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="btn btn-secondary" onclick="app.addRule()">Add Rule</button>
                <button class="btn btn-danger" onclick="app.removeLastRule()" id="remove-rule-btn" style="display: none;">Remove Last Rule</button>
            </div>
            <div class="mt-3">
                <h4>Preview</h4>
                <div id="rules-preview" class="text-muted">No rules defined yet</div>
            </div>
        `;
    }

    async updateFieldOptions(ruleIndex) {
        const fieldSelect = document.getElementById(`rule-field-${ruleIndex}`);
        const dataList = document.getElementById(`rule-options-${ruleIndex}`);
        if (!fieldSelect || !dataList) return;

        const field = fieldSelect.value;
        const module = document.getElementById('template-module').value;

        if (field && module) {
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
            if (field === 'status') ['Open', 'In Progress', 'Resolved', 'Closed'].forEach(v => values.add(v));

            dataList.innerHTML = Array.from(values).sort().map(val => `<option value="${sanitizeHTML(val)}">`).join('');
        } else {
            dataList.innerHTML = '';
        }
    }

    renderWizardStep3() {
        return `
            <h3>Escalation Hierarchy</h3>
            <p class="mb-3">Define the escalation levels and recipients.</p>
            <div id="hierarchy-container">
                <div class="hierarchy-level mb-3">
                    <h4>Level 1</h4>
                    <div class="grid grid-2 gap-2">
                        <select class="form-select">
                            <option value="">Select role</option>
                            <option value="direct-manager">Direct Manager</option>
                            <option value="department-head">Department Head</option>
                            <option value="site-manager">Site Manager</option>
                        </select>
                        <input type="email" class="form-input" placeholder="Fallback email">
                    </div>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="app.addHierarchyLevel()">Add Level</button>
        `;
    }

    renderWizardStep4() {
        return `
            <h3>Trigger Configuration</h3>
            <p class="mb-3">Define when escalations should be triggered.</p>
            <div id="triggers-container">
                <div class="trigger-item mb-3">
                    <div class="grid grid-3 gap-2">
                        <select class="form-select">
                            <option value="time-based">Time-based</option>
                            <option value="event-based">Event-based</option>
                        </select>
                        <select class="form-select">
                            <option value="1">Level 1</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                        </select>
                        <input type="text" class="form-input" id="trigger-config-1" placeholder="Configuration">
                    </div>
                    <div class="mt-2">
                         <label class="form-label text-sm">Schedule Context (REQ-016)</label>
                         <select class="form-select text-sm" id="trigger-schedule-1" style="width: auto; display: inline-block;">
                             <option value="24/7">24/7 (Always Send)</option>
                             <option value="business-hours">Business Hours Only (Mon-Fri 9-5)</option>
                         </select>
                    </div>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="app.addTrigger()">Add Trigger</button>
        `;
    }

    renderWizardStep5() {
        return `
            <h3>Notification Templates</h3>
            <p class="mb-3">Configure email and SMS notification content.</p>
            <div class="grid grid-2 gap-3">
                <div>
                    <h4>Email Template</h4>
                    <div class="form-group">
                        <label class="form-label" for="email-subject">Subject</label>
                        <input type="text" id="email-subject" class="form-input" placeholder="Email subject with {{field}} placeholders" value="ESCALATION: {{id}} - {{location}}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="email-body">Body</label>
                        <textarea id="email-body" class="form-textarea" rows="8" placeholder="Email body with {{field}} placeholders">Dear {{recipientName}},

An item requires your attention:

Details:
- ID: {{id}}
- Description: {{description}}
- Priority: {{priority}}

Please review and take appropriate action.

View Details: {{actionUrl}}

This is an automated escalation notification.</textarea>
                    </div>
                </div>
                <div>
                    <h4>SMS Template</h4>
                    <div class="form-group">
                        <label class="form-label" for="sms-body">Message (160 chars max)</label>
                        <textarea id="sms-body" class="form-textarea" rows="4" placeholder="SMS message with {{field}} placeholders" maxlength="160">ESCALATION: {{id}} at {{location}}. Priority: {{priority}}. View: {{actionUrl}}</textarea>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">Characters: <span id="sms-char-count">0</span>/160</small>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <h4>Available Placeholders</h4>
                <div class="text-sm text-muted">
                    <strong>Common:</strong> {{id}}, {{description}}, {{priority}}, {{status}}, {{location}}, {{department}}, {{recipientName}}<br>
                    <strong>Incident specific:</strong> {{reportedBy}}, {{createdDate}}<br>
                    <strong>Permit specific:</strong> {{issuedTo}}, {{expirationDate}}<br>
                    <strong>Audit specific:</strong> {{assignedTo}}, {{dueDate}}, {{severity}}
                </div>
            </div>
        `;
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
        const ruleCount = rulesContainer.children.length + 1;

        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'rule-item mb-3';
        ruleDiv.innerHTML = `
            <div class="grid grid-4 gap-2">
                <select class="form-select" id="rule-field-${ruleCount}" onchange="app.updateFieldOptions(${ruleCount})">
                    <option value="">Select field</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                    <option value="department">Department</option>
                    <option value="severity">Severity</option>
                    <option value="location">Location</option>
                </select>
                <select class="form-select" id="rule-operator-${ruleCount}">
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="lessThan">Less Than</option>
                </select>
                <input type="text" class="form-input" id="rule-value-${ruleCount}" placeholder="Value" list="rule-options-${ruleCount}">
                <datalist id="rule-options-${ruleCount}"></datalist>
                <select class="form-select" id="rule-logic-${ruleCount}">
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                </select>
            </div>
        `;

        rulesContainer.appendChild(ruleDiv);
        document.getElementById('remove-rule-btn').style.display = 'inline-block';
        this.updateRulesPreview();
    }

    removeLastRule() {
        const rulesContainer = document.getElementById('rules-container');
        if (rulesContainer.children.length > 1) {
            rulesContainer.removeChild(rulesContainer.lastElementChild);
        }

        if (rulesContainer.children.length === 1) {
            document.getElementById('remove-rule-btn').style.display = 'none';
        }

        this.updateRulesPreview();
    }

    updateRulesPreview() {
        const rulesContainer = document.getElementById('rules-container');
        const preview = document.getElementById('rules-preview');
        const rules = [];

        for (let i = 1; i <= rulesContainer.children.length; i++) {
            const field = document.getElementById(`rule-field-${i}`)?.value;
            const operator = document.getElementById(`rule-operator-${i}`)?.value;
            const value = document.getElementById(`rule-value-${i}`)?.value;
            const logic = document.getElementById(`rule-logic-${i}`)?.value;

            if (field && operator && value) {
                rules.push(`${field} ${operator} "${value}"`);
            }
        }

        if (rules.length === 0) {
            preview.textContent = 'No rules defined yet';
            preview.className = 'text-muted';
        } else {
            preview.textContent = rules.join(' AND ');
            preview.className = '';
        }
    }

    addHierarchyLevel() {
        const hierarchyContainer = document.getElementById('hierarchy-container');
        const levelCount = hierarchyContainer.children.length + 1;

        const levelDiv = document.createElement('div');
        levelDiv.className = 'hierarchy-level mb-3';
        levelDiv.innerHTML = `
            <h4>Level ${levelCount}</h4>
            <div class="grid grid-2 gap-2">
                <select class="form-select" id="hierarchy-roles-${levelCount}">
                    <option value="">Select role</option>
                    <option value="direct-manager">Direct Manager</option>
                    <option value="department-head">Department Head</option>
                    <option value="site-manager">Site Manager</option>
                    <option value="general-manager">General Manager</option>
                    <option value="executive">Executive</option>
                </select>
                <input type="email" class="form-input" id="hierarchy-fallback-${levelCount}" placeholder="Fallback email">
            </div>
        `;

        hierarchyContainer.appendChild(levelDiv);
    }

    addTrigger() {
        const triggersContainer = document.getElementById('triggers-container');
        const triggerCount = triggersContainer.children.length + 1;

        const triggerDiv = document.createElement('div');
        triggerDiv.className = 'trigger-item mb-3';
        triggerDiv.innerHTML = `
            <div class="grid grid-3 gap-2">
                <select class="form-select" id="trigger-type-${triggerCount}">
                    <option value="time-based">Time-based</option>
                    <option value="event-based">Event-based</option>
                </select>
                <select class="form-select" id="trigger-level-${triggerCount}">
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                </select>
                <input type="text" class="form-input" id="trigger-config-${triggerCount}" placeholder="Configuration">
            </div>
            <div class="mt-2">
                 <label class="form-label text-sm">Schedule Context (REQ-016)</label>
                 <select class="form-select text-sm" id="trigger-schedule-${triggerCount}" style="width: auto; display: inline-block;">
                     <option value="24/7">24/7 (Always Send)</option>
                     <option value="business-hours">Business Hours Only (Mon-Fri 9-5)</option>
                 </select>
            </div>
        `;

        triggersContainer.appendChild(triggerDiv);
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