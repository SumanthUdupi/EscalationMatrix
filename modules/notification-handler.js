// Notification Handler - Manages notification generation and delivery
export class NotificationHandler {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.duplicateCache = new Map();
        this.deliveryStats = {
            sent: 0,
            failed: 0,
            duplicatesPrevented: 0
        };
    }

    // Generate notification content for a template and record
    async generateNotification(template, record, level) {
        const notificationTemplate = template.notificationTemplates;

        // Interpolate email content
        const emailSubject = this.interpolate(notificationTemplate.email.subject, record);
        const emailBody = this.interpolate(notificationTemplate.email.body, record);

        // Interpolate SMS content
        const smsBody = this.interpolate(notificationTemplate.sms, record);

        // Generate action URL
        const actionUrl = this.generateActionUrl(record);

        // Add escalation level information
        const levelInfo = this.getLevelInfo(template, level);

        return {
            level,
            emailSubject: `${levelInfo.prefix} ${emailSubject}`,
            emailBody: this.formatEmailBody(emailBody, actionUrl, levelInfo),
            smsBody: `${levelInfo.prefix} ${smsBody}`,
            actionUrl,
            recordId: record.id,
            templateId: template.id,
            priority: levelInfo.priority
        };
    }

    // Interpolate template variables
    interpolate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value != null ? String(value) : match;
        });
    }

    // Get nested object value
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    // Generate action URL for record access
    generateActionUrl(record) {
        // In a real system, this would generate a secure, authenticated URL
        const baseUrl = window.location.origin;
        return `${baseUrl}/ehs/record/${record.id}?ref=escalation`;
    }

    // Get escalation level information
    getLevelInfo(template, level) {
        const levelData = template.hierarchy.find(h => h.level === level);

        switch (level) {
            case 1:
                return {
                    prefix: 'REMINDER:',
                    priority: 'normal',
                    description: 'Initial notification'
                };
            case 2:
                return {
                    prefix: 'FOLLOW-UP:',
                    priority: 'high',
                    description: 'Escalation to management'
                };
            case 3:
                return {
                    prefix: 'URGENT:',
                    priority: 'critical',
                    description: 'Critical escalation'
                };
            case 4:
                return {
                    prefix: 'EMERGENCY:',
                    priority: 'critical',
                    description: 'Maximum escalation'
                };
            default:
                return {
                    prefix: 'NOTICE:',
                    priority: 'normal',
                    description: 'General notification'
                };
        }
    }

    // Format email body with proper HTML structure
    formatEmailBody(body, actionUrl, levelInfo) {
        const escalationNotice = levelInfo.level > 1 ?
            `<div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
                <strong>Escalation Level ${levelInfo.level}:</strong> ${levelInfo.description}
            </div>` : '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Escalation Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
                ${escalationNotice}

                <div style="margin: 1rem 0;">
                    ${body}
                </div>

                <div style="background: #f8fafc; padding: 1rem; border-radius: 4px; margin: 1rem 0; text-align: center;">
                    <a href="${actionUrl}" style="background: #2563eb; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                        View Record
                    </a>
                </div>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 2rem; color: #64748b; font-size: 0.875rem;">
                    <p>This is an automated notification from the Dynamic Escalation Matrix System.</p>
                    <p>If you believe this notification was sent in error, please contact your safety coordinator.</p>
                </div>
            </body>
            </html>
        `;
    }

    // Send notification to recipients
    async sendNotification(notification, recipients) {
        const results = [];

        for (const recipient of recipients) {
            try {
                // Check for duplicates (24-hour window)
                if (this.isDuplicate(notification, recipient)) {
                    this.deliveryStats.duplicatesPrevented++;
                    results.push({
                        recipient,
                        status: 'duplicate',
                        message: 'Duplicate notification prevented'
                    });
                    continue;
                }

                // Send email if recipient has email
                if (recipient.email) {
                    const emailResult = await this.sendEmail(recipient, notification);
                    results.push(emailResult);
                }

                // Send SMS for critical notifications if recipient has phone
                if (recipient.phone && notification.priority === 'critical') {
                    const smsResult = await this.sendSMS(recipient, notification);
                    results.push(smsResult);
                }

                // Cache for duplicate prevention
                this.cacheNotification(notification, recipient);

            } catch (error) {
                console.error('Failed to send notification:', error);
                results.push({
                    recipient,
                    status: 'failed',
                    message: error.message
                });
                this.deliveryStats.failed++;
            }
        }

        return results;
    }

    // Check if notification is a duplicate
    isDuplicate(notification, recipient) {
        const cacheKey = `${notification.recordId}-${notification.level}-${recipient.email || recipient.phone}`;
        const cached = this.duplicateCache.get(cacheKey);

        if (!cached) return false;

        const cacheTime = new Date(cached.timestamp);
        const now = new Date();
        const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);

        return hoursDiff < 24;
    }

    // Cache notification for duplicate prevention
    cacheNotification(notification, recipient) {
        const cacheKey = `${notification.recordId}-${notification.level}-${recipient.email || recipient.phone}`;

        this.duplicateCache.set(cacheKey, {
            timestamp: new Date().toISOString(),
            notification,
            recipient
        });

        // Clean up old cache entries (older than 24 hours)
        const now = new Date();
        for (const [key, value] of this.duplicateCache) {
            const cacheTime = new Date(value.timestamp);
            const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
            if (hoursDiff >= 24) {
                this.duplicateCache.delete(key);
            }
        }
    }

    // Send email notification
    async sendEmail(recipient, notification) {
        // In a real system, this would integrate with SMTP
        // For the prototype, we'll simulate the API call

        try {
            const response = await this.simulateEmailAPI({
                to: recipient.email,
                subject: notification.emailSubject,
                body: notification.emailBody,
                priority: notification.priority
            });

            if (response.success) {
                this.deliveryStats.sent++;
                return {
                    recipient,
                    status: 'sent',
                    type: 'email',
                    messageId: response.messageId
                };
            } else {
                throw new Error(response.error || 'Email delivery failed');
            }
        } catch (error) {
            return {
                recipient,
                status: 'failed',
                type: 'email',
                message: error.message
            };
        }
    }

    // Send SMS notification
    async sendSMS(recipient, notification) {
        // In a real system, this would integrate with SMS gateway
        // For the prototype, we'll simulate the API call

        try {
            const response = await this.simulateSMSAPI({
                to: recipient.phone,
                message: notification.smsBody,
                priority: notification.priority
            });

            if (response.success) {
                this.deliveryStats.sent++;
                return {
                    recipient,
                    status: 'sent',
                    type: 'sms',
                    messageId: response.messageId
                };
            } else {
                throw new Error(response.error || 'SMS delivery failed');
            }
        } catch (error) {
            return {
                recipient,
                status: 'failed',
                type: 'sms',
                message: error.message
            };
        }
    }

    // Simulate email API call
    async simulateEmailAPI(emailData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
            return {
                success: false,
                error: 'SMTP server temporarily unavailable'
            };
        }

        // Simulate successful delivery
        return {
            success: true,
            messageId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    }

    // Simulate SMS API call
    async simulateSMSAPI(smsData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

        // Simulate occasional failures
        if (Math.random() < 0.08) { // 8% failure rate
            return {
                success: false,
                error: 'SMS gateway error'
            };
        }

        // Simulate successful delivery
        return {
            success: true,
            messageId: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    }

    // Get delivery statistics
    getDeliveryStats() {
        return { ...this.deliveryStats };
    }

    // Reset delivery statistics
    resetDeliveryStats() {
        this.deliveryStats = {
            sent: 0,
            failed: 0,
            duplicatesPrevented: 0
        };
    }

    // Preview notification without sending
    async previewNotification(template, record, level) {
        const notification = await this.generateNotification(template, record, level);

        return {
            email: {
                subject: notification.emailSubject,
                body: notification.emailBody,
                recipient: 'preview@example.com'
            },
            sms: {
                body: notification.smsBody,
                recipient: '+1234567890'
            },
            actionUrl: notification.actionUrl
        };
    }

    // Test notification delivery
    async testNotification(templateId, testEmail, testPhone) {
        const template = await this.dataManager.getTemplate(templateId);
        const sampleRecord = await this.dataManager.getSampleRecord(template.module);

        if (!template || !sampleRecord) {
            throw new Error('Template or sample record not found');
        }

        const notification = await this.generateNotification(template, sampleRecord, 1);

        const results = [];

        // Send test email
        if (testEmail) {
            const emailResult = await this.sendEmail(
                { email: testEmail, name: 'Test Recipient' },
                notification
            );
            results.push({
                type: 'email',
                recipient: testEmail,
                ...emailResult
            });
        }

        // Send test SMS
        if (testPhone) {
            const smsResult = await this.sendSMS(
                { phone: testPhone, name: 'Test Recipient' },
                notification
            );
            results.push({
                type: 'sms',
                recipient: testPhone,
                ...smsResult
            });
        }

        return results;
    }

    // Format notification for in-app display
    formatInAppNotification(notification, recipient) {
        return {
            id: `inapp-${Date.now()}`,
            title: notification.emailSubject,
            message: this.extractPreviewText(notification.emailBody),
            actionUrl: notification.actionUrl,
            priority: notification.priority,
            timestamp: new Date().toISOString(),
            read: false
        };
    }

    // Extract preview text from HTML email body
    extractPreviewText(htmlBody) {
        // Simple HTML text extraction for preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlBody;
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    // Batch send notifications (for efficiency)
    async sendBatchNotifications(notifications) {
        const results = [];

        for (const batch of notifications) {
            const batchResults = await this.sendNotification(batch.notification, batch.recipients);
            results.push(...batchResults);
        }

        return results;
    }
}