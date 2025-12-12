// Escalation Engine - Core logic for processing escalations
export class EscalationEngine {
    constructor(dataManager, notificationHandler) {
        this.dataManager = dataManager;
        this.notificationHandler = notificationHandler;
        this.activeEscalations = new Map();
        this.processingInterval = null;
        this.isProcessing = false;
    }

    // Safe date parsing with validation
    safeDateParse(dateValue) {
        if (!dateValue) return null;

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            console.error(`Invalid date value: ${dateValue}`);
            return null;
        }

        // Additional validation: check if date is reasonable (not too far in past/future)
        const now = new Date();
        const tenYearsAgo = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
        const tenYearsFromNow = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);

        if (date < tenYearsAgo || date > tenYearsFromNow) {
            console.warn(`Date seems unreasonable: ${dateValue}`);
        }

        return date;
    }

    async initialize() {
        // Start periodic processing
        this.startProcessing();
    }

    async processEscalations() {
        if (this.isProcessing) {
            console.log('Escalation processing already in progress, skipping to prevent race conditions');
            return;
        }

        this.isProcessing = true;
        const startTime = performance.now();
        console.log('Starting escalation processing cycle...');

        try {
            const templatesStart = performance.now();
            const templates = await this.dataManager.getAllTemplates();
            console.log(`Fetched ${templates.length} templates in ${(performance.now() - templatesStart).toFixed(2)}ms`);

            const now = new Date();
            let processedRecords = 0;
            let triggeredEscalations = 0;

            for (const template of templates) {
                if (!template.active) continue;

                const templateStart = performance.now();
                const recordsProcessed = await this.processTemplate(template, now);
                processedRecords += recordsProcessed;
                console.log(`Template ${template.id}: processed ${recordsProcessed} records in ${(performance.now() - templateStart).toFixed(2)}ms`);
            }

            // Clean up old escalations
            const cleanupStart = performance.now();
            this.cleanupOldEscalations();
            console.log(`Cleanup completed in ${(performance.now() - cleanupStart).toFixed(2)}ms`);

            const totalTime = performance.now() - startTime;
            console.log(`Escalation processing completed in ${totalTime.toFixed(2)}ms. Processed ${processedRecords} records, ${this.activeEscalations.size} active escalations.`);

        } catch (error) {
            console.error('Error processing escalations:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async processTemplate(template, now) {
        try {
            const records = await this.dataManager.getRecords(template.module);
            let processedCount = 0;

            for (const record of records) {
                try {
                    processedCount++;
                    // Check if record matches template applicability rules
                    if (this.matchesTemplateRules(template, record)) {
                        await this.evaluateRecordTriggers(template, record, now);
                    }
                } catch (recordError) {
                    console.error(`Error processing record ${record.id} in template ${template.id}:`, recordError);
                    // Continue processing other records
                }
            }

            return processedCount;
        } catch (error) {
            console.error(`Error processing template ${template.id}:`, error);
            // Continue processing other templates
            return 0;
        }
    }

    matchesTemplateRules(template, record) {
        try {
            if (!template.applicabilityRules || template.applicabilityRules.length === 0) {
                return true; // No rules means always applicable
            }

            let result = true; // Default for AND logic

            for (const rule of template.applicabilityRules) {
                const fieldValue = this.getNestedValue(record, rule.field);
                const ruleResult = this.evaluateRule(rule.operator, fieldValue, rule.value);

                if (rule.logic === 'OR') {
                    result = result || ruleResult;
                } else {
                    result = result && ruleResult;
                }
            }

            return result;
        } catch (error) {
            console.error(`Error evaluating rules for template ${template.id}, record ${record.id}:`, error);
            return false; // Fail safe
        }
    }

    evaluateRule(operator, fieldValue, expectedValue) {
        switch (operator) {
            case 'equals':
                return fieldValue == expectedValue;
            case 'contains':
                return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
            case 'greaterThan':
                return Number(fieldValue) > Number(expectedValue);
            case 'lessThan':
                return Number(fieldValue) < Number(expectedValue);
            default:
                return false;
        }
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    async evaluateRecordTriggers(template, record, now) {
        const escalationKey = `${template.id}-${record.id}`;

        for (const trigger of template.triggers) {
            if (this.shouldTrigger(trigger, record, now)) {
                // Check if escalation already exists
                if (!this.activeEscalations.has(escalationKey)) {
                    this.activeEscalations.set(escalationKey, {
                        template,
                        record,
                        triggeredLevels: new Set(),
                        createdAt: now
                    });
                }

                const escalation = this.activeEscalations.get(escalationKey);

                // Check if this level has already been triggered
                if (!escalation.triggeredLevels.has(trigger.level)) {
                    await this.executeEscalation(template, record, trigger.level, now);
                    escalation.triggeredLevels.add(trigger.level);
                }
            }
        }
    }

    shouldTrigger(trigger, record, now) {
        if (trigger.type === 'time-based') {
            return this.checkTimeTrigger(trigger, record, now);
        } else if (trigger.type === 'event-based') {
            return this.checkEventTrigger(trigger, record, now);
        }
        return false;
    }

    checkTimeTrigger(trigger, record, now) {
        try {
            const referenceDate = this.safeDateParse(record[trigger.referenceField]);

            if (!referenceDate) {
                console.warn(`Invalid date in record ${record.id}, field ${trigger.referenceField}: ${record[trigger.referenceField]}`);
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
        } catch (error) {
            console.error(`Error checking time trigger for record ${record.id}:`, error);
            return false;
        }
    }

    checkEventTrigger(trigger, record, now) {
        // For event triggers, we need to check if the field value matches
        // In a real system, this would be triggered by field changes
        return record[trigger.field] === trigger.value;
    }

    async executeEscalation(template, record, level, now) {
        try {
            const hierarchyLevel = template.hierarchy.find(h => h.level === level);

            if (!hierarchyLevel) {
                console.warn(`No hierarchy level ${level} found for template ${template.id}`);
                return;
            }

            // Resolve recipients
            const recipients = await this.resolveRecipients(hierarchyLevel, record);

            if (recipients.length === 0) {
                console.warn(`No recipients found for escalation level ${level} in template ${template.id}`);
                return;
            }

            // Generate notification
            const notification = await this.notificationHandler.generateNotification(template, record, level);

            // Send notifications
            await this.notificationHandler.sendNotification(notification, recipients);

            // Log escalation
            await this.dataManager.logEscalation(template.id, record.id, level, recipients);

            console.log(`Escalation executed: ${template.name} - Level ${level} - ${record.id}`);

        } catch (error) {
            console.error('Error executing escalation:', error);
        }
    }

    async resolveRecipients(hierarchyLevel, record) {
        const recipients = [];

        // Get users by roles
        for (const role of hierarchyLevel.roles || []) {
            const users = await this.dataManager.getUsersByRole(role, record.department);
            recipients.push(...users);
        }

        // If no recipients found, use fallback
        if (recipients.length === 0 && hierarchyLevel.fallbackEmail) {
            recipients.push({
                email: hierarchyLevel.fallbackEmail,
                name: 'Fallback Recipient'
            });
        }

        return recipients;
    }

    async cancelEscalation(recordId) {
        // Cancel all active escalations for a record (when task is completed)
        for (const [key, escalation] of this.activeEscalations) {
            if (escalation.record.id === recordId) {
                this.activeEscalations.delete(key);
                await this.dataManager.logCancellation(escalation.template.id, recordId);
                console.log(`Escalation cancelled for record ${recordId}`);
            }
        }
    }

    cleanupOldEscalations() {
        const now = new Date();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        for (const [key, escalation] of this.activeEscalations) {
            if (now - escalation.createdAt > maxAge) {
                this.activeEscalations.delete(key);
            }
        }
    }

    startProcessing() {
        // Process escalations every 5 minutes (as per NFR-001)
        this.processingInterval = setInterval(() => {
            this.processEscalations();
        }, 5 * 60 * 1000);

        // Also process immediately
        this.processEscalations();
    }

    stopProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
    }

    // Get escalation statistics
    getStats() {
        return {
            activeEscalations: this.activeEscalations.size,
            processedToday: 0, // Would need to track this
            failedEscalations: 0 // Would need to track this
        };
    }

    // Manual trigger for testing
    async triggerEscalation(templateId, recordId, level = 1) {
        const template = await this.dataManager.getTemplate(templateId);
        const record = await this.getRecordById(template.module, recordId);

        if (template && record) {
            await this.executeEscalation(template, record, level, new Date());
        }
    }

    async getRecordById(module, recordId) {
        const records = await this.dataManager.getRecords(module);
        return records.find(r => r.id === recordId);
    }
}