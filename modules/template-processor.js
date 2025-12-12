// Template Processor - Handles template validation, processing, and rule evaluation
export class TemplateProcessor {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // Validate template structure and rules
    validateTemplate(template) {
        const errors = [];

        // Required fields
        if (!template.name || template.name.trim().length === 0) {
            errors.push('Template name is required');
        } else if (template.name.trim().length > 100) {
            errors.push('Template name must be less than 100 characters');
        } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(template.name.trim())) {
            errors.push('Template name contains invalid characters');
        }

        if (!template.module || !['incidents', 'work-permits', 'audits'].includes(template.module)) {
            errors.push('Valid module type is required');
        }

        // Description validation
        if (template.description && template.description.length > 500) {
            errors.push('Description must be less than 500 characters');
        }

        // Validate applicability rules
        if (template.applicabilityRules) {
            template.applicabilityRules.forEach((rule, index) => {
                if (!rule.field || rule.field.trim().length === 0) {
                    errors.push(`Rule ${index + 1}: Field is required`);
                }

                if (!rule.operator || !['equals', 'contains', 'greaterThan', 'lessThan'].includes(rule.operator)) {
                    errors.push(`Rule ${index + 1}: Valid operator is required`);
                }

                if (rule.value === undefined || rule.value === null) {
                    errors.push(`Rule ${index + 1}: Value is required`);
                }

                if (rule.logic && !['AND', 'OR'].includes(rule.logic)) {
                    errors.push(`Rule ${index + 1}: Logic must be AND or OR`);
                }
            });
        }

        // Validate hierarchy
        if (!template.hierarchy || template.hierarchy.length === 0) {
            errors.push('At least one hierarchy level is required');
        } else {
            template.hierarchy.forEach((level, index) => {
                if (!level.level || level.level < 1) {
                    errors.push(`Hierarchy level ${index + 1}: Valid level number is required`);
                }

                if ((!level.roles || level.roles.length === 0) && !level.fallbackEmail) {
                    errors.push(`Hierarchy level ${index + 1}: Roles or fallback email is required`);
                }

                // Validate fallback email
                if (level.fallbackEmail) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(level.fallbackEmail)) {
                        errors.push(`Hierarchy level ${index + 1}: Invalid fallback email format`);
                    }
                }
            });
        }

        // Validate triggers
        if (!template.triggers || template.triggers.length === 0) {
            errors.push('At least one trigger is required');
        } else {
            template.triggers.forEach((trigger, index) => {
                if (!trigger.type || !['time-based', 'event-based'].includes(trigger.type)) {
                    errors.push(`Trigger ${index + 1}: Valid trigger type is required`);
                }

                if (!trigger.level || trigger.level < 1) {
                    errors.push(`Trigger ${index + 1}: Valid level number is required`);
                }

                if (trigger.type === 'time-based') {
                    if (!trigger.referenceField) {
                        errors.push(`Trigger ${index + 1}: Reference field is required for time-based triggers`);
                    }
                } else if (trigger.type === 'event-based') {
                    if (!trigger.field) {
                        errors.push(`Trigger ${index + 1}: Field is required for event-based triggers`);
                    }
                    if (trigger.value === undefined) {
                        errors.push(`Trigger ${index + 1}: Value is required for event-based triggers`);
                    }
                }
            });
        }

        // Validate notification templates
        if (!template.notificationTemplates) {
            errors.push('Notification templates are required');
        } else {
            if (!template.notificationTemplates.email) {
                errors.push('Email notification template is required');
            } else {
                if (!template.notificationTemplates.email.subject) {
                    errors.push('Email subject is required');
                }
                if (!template.notificationTemplates.email.body) {
                    errors.push('Email body is required');
                }
            }

            if (!template.notificationTemplates.sms) {
                errors.push('SMS notification template is required');
            } else if (template.notificationTemplates.sms.length > 160) {
                errors.push('SMS body must be less than 160 characters');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Process template for a specific record
    async processTemplate(template, record) {
        const result = {
            applicable: false,
            triggeredLevels: [],
            notifications: []
        };

        // Check applicability
        result.applicable = this.evaluateApplicability(template.applicabilityRules, record);

        if (!result.applicable) {
            return result;
        }

        // Evaluate triggers
        const now = new Date();
        result.triggeredLevels = this.evaluateTriggers(template.triggers, record, now);

        // Generate notifications for triggered levels
        for (const level of result.triggeredLevels) {
            const notification = await this.generateNotification(template, record, level);
            result.notifications.push(notification);
        }

        return result;
    }

    // Evaluate applicability rules
    evaluateApplicability(rules, record) {
        if (!rules || rules.length === 0) {
            return true; // No rules means always applicable
        }

        let result = true; // Default for AND logic

        for (const rule of rules) {
            const fieldValue = this.getNestedValue(record, rule.field);
            const ruleResult = this.evaluateRule(rule.operator, fieldValue, rule.value);

            if (rule.logic === 'OR') {
                result = result || ruleResult;
            } else {
                result = result && ruleResult;
            }
        }

        return result;
    }

    // Evaluate individual rule
    evaluateRule(operator, fieldValue, expectedValue) {
        // Handle null/undefined values
        if (fieldValue == null) {
            return expectedValue == null || expectedValue === '';
        }

        switch (operator) {
            case 'equals':
                return fieldValue == expectedValue;
            case 'contains':
                return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
            case 'greaterThan':
                const numField = Number(fieldValue);
                const numExpected = Number(expectedValue);
                return !isNaN(numField) && !isNaN(numExpected) && numField > numExpected;
            case 'lessThan':
                const numField2 = Number(fieldValue);
                const numExpected2 = Number(expectedValue);
                return !isNaN(numField2) && !isNaN(numExpected2) && numField2 < numExpected2;
            default:
                return false;
        }
    }

    // Evaluate triggers
    evaluateTriggers(triggers, record, now) {
        const triggeredLevels = [];

        for (const trigger of triggers) {
            if (this.evaluateTrigger(trigger, record, now)) {
                if (!triggeredLevels.includes(trigger.level)) {
                    triggeredLevels.push(trigger.level);
                }
            }
        }

        return triggeredLevels.sort((a, b) => a - b);
    }

    // Evaluate individual trigger
    evaluateTrigger(trigger, record, now) {
        if (trigger.type === 'time-based') {
            return this.evaluateTimeTrigger(trigger, record, now);
        } else if (trigger.type === 'event-based') {
            return this.evaluateEventTrigger(trigger, record, now);
        }
        return false;
    }

    // Evaluate time-based trigger
    evaluateTimeTrigger(trigger, record, now) {
        const referenceDate = new Date(record[trigger.referenceField]);

        if (isNaN(referenceDate.getTime())) {
            return false; // Invalid date
        }

        const daysDiff = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24));

        // Handle future and past reference dates differently
        if (referenceDate > now) {
            // Future reference date: trigger when within daysBefore period
            return daysDiff <= -(trigger.daysBefore || 0);
        } else {
            // Past reference date: trigger when daysAfter period has passed
            return daysDiff >= (trigger.daysAfter || 0);
        }
    }

    // Evaluate event-based trigger
    evaluateEventTrigger(trigger, record, now) {
        const fieldValue = this.getNestedValue(record, trigger.field);
        return fieldValue === trigger.value;
    }

    // Generate notification content
    async generateNotification(template, record, level) {
        const notificationTemplate = template.notificationTemplates;

        // Interpolate email content
        const emailSubject = this.interpolate(notificationTemplate.email.subject, record);
        const emailBody = this.interpolate(notificationTemplate.email.body, record);

        // Interpolate SMS content
        const smsBody = this.interpolate(notificationTemplate.sms, record);

        // Generate action URL
        const actionUrl = this.generateActionUrl(record);

        return {
            level,
            emailSubject,
            emailBody: emailBody.replace('{{actionUrl}}', actionUrl),
            smsBody,
            actionUrl,
            recordId: record.id,
            templateId: template.id
        };
    }

    // Interpolate template variables
    interpolate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value != null ? String(value) : match;
        });
    }

    // Generate action URL for record access
    generateActionUrl(record) {
        // In a real system, this would generate a proper URL to the EHS system
        return `${window.location.origin}/record/${record.id}`;
    }

    // Get nested object value
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    // Create template preview
    async createTemplatePreview(template) {
        const preview = {
            name: template.name,
            module: template.module,
            applicabilitySummary: this.summarizeRules(template.applicabilityRules),
            hierarchySummary: this.summarizeHierarchy(template.hierarchy),
            triggerSummary: this.summarizeTriggers(template.triggers),
            sampleNotification: null
        };

        // Generate sample notification if possible
        try {
            const sampleRecord = await this.dataManager.getSampleRecord(template.module);
            if (sampleRecord) {
                preview.sampleNotification = await this.generateNotification(template, sampleRecord, 1);
            }
        } catch (error) {
            console.warn('Could not generate sample notification:', error);
        }

        return preview;
    }

    // Summarize rules for display
    summarizeRules(rules) {
        if (!rules || rules.length === 0) {
            return 'Always applicable';
        }

        const summaries = rules.map(rule =>
            `${rule.field} ${rule.operator} "${rule.value}"`
        );

        return summaries.join(` ${rules[0].logic || 'AND'} `);
    }

    // Summarize hierarchy for display
    summarizeHierarchy(hierarchy) {
        if (!hierarchy || hierarchy.length === 0) {
            return 'No hierarchy defined';
        }

        return hierarchy.map(level =>
            `Level ${level.level}: ${level.roles ? level.roles.join(', ') : 'Fallback: ' + level.fallbackEmail}`
        ).join('; ');
    }

    // Summarize triggers for display
    summarizeTriggers(triggers) {
        if (!triggers || triggers.length === 0) {
            return 'No triggers defined';
        }

        return triggers.map(trigger => {
            if (trigger.type === 'time-based') {
                return `Time: ${trigger.daysBefore || 0} days before ${trigger.referenceField}`;
            } else {
                return `Event: ${trigger.field} = "${trigger.value}"`;
            }
        }).join('; ');
    }

    // Clone template for duplication
    cloneTemplate(template) {
        const cloned = JSON.parse(JSON.stringify(template));
        cloned.id = `template-${Date.now()}`;
        cloned.name = `${template.name} (Copy)`;
        cloned.createdAt = new Date().toISOString();
        delete cloned.updatedAt;
        return cloned;
    }

    // Export template to JSON
    exportTemplate(template) {
        const exportData = {
            ...template,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Import template from JSON
    importTemplate(jsonString) {
        try {
            const template = JSON.parse(jsonString);

            // Validate imported template
            const validation = this.validateTemplate(template);
            if (!validation.isValid) {
                throw new Error('Invalid template: ' + validation.errors.join(', '));
            }

            // Clean up import metadata
            delete template.exportedAt;
            delete template.version;

            return template;
        } catch (error) {
            throw new Error('Failed to import template: ' + error.message);
        }
    }
}