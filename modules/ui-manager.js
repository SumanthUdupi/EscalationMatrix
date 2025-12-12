// UI Manager - Handles user interface interactions and modal management
export class UIManager {
    constructor() {
        this.toastContainer = null;
        this.modal = null;
        this.eventListeners = [];
        this.init();
    }

    init() {
        this.createToastContainer();
        this.setupModal();
    }

    createToastContainer() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        this.toastContainer.setAttribute('aria-live', 'polite');
        this.toastContainer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.toastContainer);
    }

    setupModal() {
        this.modal = document.getElementById('modal-overlay');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        const icon = this.getToastIcon(type);

        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Close notification" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);

        // Allow manual dismissal
        toast.addEventListener('click', () => {
            toast.remove();
        });
    }

    getToastIcon(type) {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    }

    showModal(title, content, options = {}) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;

        // Add custom buttons if provided
        if (options.buttons) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex justify-end gap-2 mt-4';

            options.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `btn ${button.class || 'btn-secondary'}`;
                btn.textContent = button.text;
                btn.onclick = button.onClick;
                buttonContainer.appendChild(btn);
            });

            modalBody.appendChild(buttonContainer);
        }

        this.modal.classList.remove('hidden');
        this.modal.style.display = 'flex';

        // Focus management
        const focusableElements = this.modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (firstFocusable) {
            firstFocusable.focus();
        }

        // Trap focus within modal
        const modalKeydownListener = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        };
        this.modal.addEventListener('keydown', modalKeydownListener);
        this.eventListeners.push({ element: this.modal, type: 'keydown', listener: modalKeydownListener });
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.modal.style.display = 'none';

        // Return focus to the element that opened the modal
        const triggerElement = document.activeElement;
        if (triggerElement && triggerElement !== document.body) {
            triggerElement.focus();
        }
    }

    showLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.add('loading');
        }
    }

    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.remove('loading');
        }
    }

    // Form validation helpers
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        let isValid = true;
        const errors = [];

        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                this.showFieldError(input, 'This field is required');
                isValid = false;
                errors.push(`${input.name || input.id} is required`);
            } else {
                this.clearFieldError(input);
            }

            // Email validation
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    this.showFieldError(input, 'Please enter a valid email address');
                    isValid = false;
                    errors.push('Invalid email format');
                }
            }

            // Phone validation
            if (input.type === 'tel' && input.value) {
                const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
                if (!phoneRegex.test(input.value)) {
                    this.showFieldError(input, 'Please enter a valid phone number');
                    isValid = false;
                    errors.push('Invalid phone format');
                }
            }
        });

        return { isValid, errors };
    }

    showFieldError(input, message) {
        this.clearFieldError(input);

        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');

        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');

        input.parentElement.appendChild(errorElement);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        input.removeAttribute('aria-invalid');

        const errorElement = input.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Table helpers
    createTable(headers, data, options = {}) {
        const table = document.createElement('table');
        table.className = 'table';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');

        data.forEach((row, index) => {
            const tr = document.createElement('tr');

            if (options.rowClass) {
                tr.className = options.rowClass(row, index);
            }

            headers.forEach(header => {
                const td = document.createElement('td');
                const value = row[header.toLowerCase().replace(/\s+/g, '')];

                if (options.cellRenderer && options.cellRenderer[header]) {
                    td.innerHTML = options.cellRenderer[header](value, row, index);
                } else {
                    td.textContent = value || '';
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);

        return table;
    }

    // Chart helpers (simple implementations)
    createBarChart(data, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width || 400;
        canvas.height = options.height || 200;
        canvas.className = 'chart-canvas';

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const barWidth = width / data.length * 0.8;
        const maxValue = Math.max(...data.map(d => d.value));
        const colors = options.colors || ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 60);
            const x = index * (width / data.length) + (width / data.length - barWidth) / 2;
            const y = height - barHeight - 40;

            // Bar
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            // Value label
            ctx.fillStyle = '#1e293b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, height - 20);

            // Value
            ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
        });

        return canvas;
    }

    createLineChart(data, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width || 400;
        canvas.height = options.height || 200;
        canvas.className = 'chart-canvas';

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = options.color || '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();

        const maxValue = Math.max(...data.map(d => d.value));

        data.forEach((item, index) => {
            const x = (index / (data.length - 1)) * (width - 40) + 20;
            const y = height - ((item.value - (options.minValue || 0)) / (maxValue - (options.minValue || 0))) * (height - 60) - 40;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Point
            ctx.fillStyle = options.color || '#2563eb';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Label
            ctx.fillStyle = '#64748b';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x, height - 10);
        });

        ctx.stroke();

        return canvas;
    }

    // Badge and status helpers
    createBadge(text, type = 'info') {
        const badge = document.createElement('span');
        badge.className = `badge badge-${type}`;
        badge.textContent = text;
        return badge;
    }

    createStatusIndicator(status, text) {
        const container = document.createElement('div');
        container.className = 'flex items-center gap-2';

        const indicator = document.createElement('span');
        indicator.className = `status-indicator status-${status}`;
        indicator.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.textContent = text;

        container.appendChild(indicator);
        container.appendChild(label);

        return container;
    }

    // Progress indicators
    createProgressBar(value, max = 100, options = {}) {
        const container = document.createElement('div');
        container.className = 'progress-container';

        const progress = document.createElement('div');
        progress.className = 'progress-bar';
        progress.style.width = `${(value / max) * 100}%`;

        if (options.color) {
            progress.style.backgroundColor = options.color;
        }

        const label = document.createElement('span');
        label.className = 'progress-label';
        label.textContent = options.showValue ? `${value}/${max}` : `${Math.round((value / max) * 100)}%`;

        container.appendChild(progress);
        container.appendChild(label);

        return container;
    }

    // Wizard helpers
    createWizardStepIndicator(steps, currentStep) {
        const container = document.createElement('div');
        container.className = 'wizard-steps';

        steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'wizard-step';
            stepElement.textContent = index + 1;

            if (index + 1 < currentStep) {
                stepElement.classList.add('completed');
            } else if (index + 1 === currentStep) {
                stepElement.classList.add('active');
            }

            container.appendChild(stepElement);
        });

        return container;
    }

    // Accessibility helpers
    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Responsive helpers
    isMobile() {
        return window.innerWidth < 768;
    }

    isTablet() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    }

    isDesktop() {
        return window.innerWidth >= 1024;
    }

    // Utility methods
    debounce(func, wait) {
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

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    cleanupEventListeners() {
        this.eventListeners.forEach(({ element, type, listener }) => {
            element.removeEventListener(type, listener);
        });
        this.eventListeners = [];
    }
}