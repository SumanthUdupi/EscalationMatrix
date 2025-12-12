// Data Manager - Handles all data operations and dummy data
export class DataManager {
    constructor() {
        this.templates = [];
        this.records = {
            incidents: [],
            'work-permits': [],
            audits: []
        };
        this.escalationLogs = [];
        this.users = [];
        this.notifications = [];
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

    async initializeDummyData() {
        console.log('Starting dummy data initialization...');
        const startTime = performance.now();

        console.time('Templates Generation');
        await this.generateDummyTemplates();
        console.timeEnd('Templates Generation');

        console.time('Records Generation');
        await this.generateDummyRecords();
        console.timeEnd('Records Generation');

        console.time('Users Generation');
        await this.generateDummyUsers();
        console.timeEnd('Users Generation');

        console.time('Logs Generation');
        await this.generateDummyEscalationLogs();
        console.timeEnd('Logs Generation');

        console.time('Notifications Generation');
        await this.generateDummyNotifications();
        console.timeEnd('Notifications Generation');

        const totalTime = performance.now() - startTime;
        console.log(`Dummy data initialization completed in ${totalTime.toFixed(2)}ms`);
        console.log(`Generated: ${this.templates.length} templates, ${Object.values(this.records).flat().length} records, ${this.users.length} users, ${this.escalationLogs.length} logs, ${this.notifications.length} notifications`);
    }

    addEdgeCaseTemplates() {
        // Edge case templates for testing
        this.templates.unshift(
            // Invalid template - empty name
            {
                id: 'template-edge-001',
                name: '', // Empty name
                module: 'incidents',
                description: 'Test template',
                active: true,
                applicabilityRules: [],
                hierarchy: [],
                triggers: [],
                notificationTemplates: { email: { subject: '', body: '' }, sms: '' }
            },
            // Invalid module
            {
                id: 'template-edge-002',
                name: 'Invalid Module Template',
                module: 'invalid-module', // Invalid module
                description: 'Test template',
                active: true,
                applicabilityRules: [{ field: 'priority', operator: 'equals', value: 'High' }],
                hierarchy: [{ level: 1, roles: ['direct-manager'] }],
                triggers: [{ type: 'time-based', level: 1, referenceField: 'createdDate', daysBefore: 0, daysAfter: 0 }],
                notificationTemplates: { email: { subject: 'Test', body: 'Test' }, sms: 'Test' }
            },
            // No hierarchy
            {
                id: 'template-edge-003',
                name: 'No Hierarchy Template',
                module: 'incidents',
                description: 'Test template',
                active: true,
                applicabilityRules: [{ field: 'priority', operator: 'equals', value: 'High' }],
                hierarchy: [], // Empty hierarchy
                triggers: [{ type: 'time-based', level: 1, referenceField: 'createdDate', daysBefore: 0, daysAfter: 0 }],
                notificationTemplates: { email: { subject: 'Test', body: 'Test' }, sms: 'Test' }
            },
            // Invalid trigger level
            {
                id: 'template-edge-004',
                name: 'Invalid Trigger Level',
                module: 'incidents',
                description: 'Test template',
                active: true,
                applicabilityRules: [{ field: 'priority', operator: 'equals', value: 'High' }],
                hierarchy: [{ level: 1, roles: ['direct-manager'] }],
                triggers: [{ type: 'time-based', level: -1, referenceField: 'createdDate', daysBefore: 0, daysAfter: 0 }], // Negative level
                notificationTemplates: { email: { subject: 'Test', body: 'Test' }, sms: 'Test' }
            }
        );
    }

    async generateDummyTemplates() {
        // Add edge case templates for testing
        this.addEdgeCaseTemplates();

        this.templates = [
            // INCIDENT TEMPLATES
            {
                id: 'template-1',
                name: 'Critical Incident Escalation',
                module: 'incidents',
                description: 'Handles critical safety incidents requiring immediate attention',
                active: true,
                applicabilityRules: [
                    { field: 'priority', operator: 'equals', value: 'Critical', logic: 'AND' },
                    { field: 'status', operator: 'equals', value: 'Open', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'safety-manager@company.com',
                        delay: 0
                    },
                    {
                        level: 2,
                        roles: ['department-head'],
                        fallbackEmail: 'dept-head@company.com',
                        delay: 2
                    },
                    {
                        level: 3,
                        roles: ['site-manager'],
                        fallbackEmail: 'site-manager@company.com',
                        delay: 4
                    },
                    {
                        level: 4,
                        roles: ['general-manager'],
                        fallbackEmail: 'gm@company.com',
                        delay: 8
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'createdDate',
                        daysBefore: 0,
                        daysAfter: 0
                    },
                    {
                        type: 'event-based',
                        level: 1,
                        field: 'priority',
                        value: 'Critical'
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'CRITICAL: Incident {{id}} - {{location}}',
                        body: `Dear {{recipientName}},

A critical incident has been reported and requires immediate attention:

Incident Details:
- ID: {{id}}
- Location: {{location}}
- Description: {{description}}
- Priority: {{priority}}
- Reported By: {{reportedBy}}

Please review and take appropriate action immediately.

View Incident: {{actionUrl}}

Safety Management System`
                    },
                    sms: 'CRITICAL INCIDENT: {{id}} at {{location}}. Priority: {{priority}}. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-2',
                name: 'High Priority Incident Follow-up',
                module: 'incidents',
                description: 'Follows up on high priority incidents to ensure timely resolution',
                active: true,
                applicabilityRules: [
                    { field: 'priority', operator: 'equals', value: 'High', logic: 'AND' },
                    { field: 'status', operator: 'equals', value: 'Open', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'safety-coordinator@company.com',
                        delay: 4
                    },
                    {
                        level: 2,
                        roles: ['department-head'],
                        fallbackEmail: 'dept-head@company.com',
                        delay: 24
                    },
                    {
                        level: 3,
                        roles: ['site-manager'],
                        fallbackEmail: 'site-manager@company.com',
                        delay: 48
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'createdDate',
                        daysBefore: 0,
                        daysAfter: 1
                    },
                    {
                        type: 'time-based',
                        level: 2,
                        referenceField: 'createdDate',
                        daysBefore: 0,
                        daysAfter: 3
                    },
                    {
                        type: 'time-based',
                        level: 3,
                        referenceField: 'createdDate',
                        daysBefore: 0,
                        daysAfter: 7
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'HIGH PRIORITY: Incident {{id}} - {{location}}',
                        body: `Dear {{recipientName}},

A high priority incident requires your attention:

Incident Details:
- ID: {{id}}
- Location: {{location}}
- Description: {{description}}
- Priority: {{priority}}
- Reported By: {{reportedBy}}
- Created: {{createdDate}}

Please review and ensure appropriate action is taken.

View Incident: {{actionUrl}}

Safety Management System`
                    },
                    sms: 'HIGH PRIORITY INCIDENT: {{id}} at {{location}}. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-3',
                name: 'Medium Priority Incident Monitoring',
                module: 'incidents',
                description: 'Monitors medium priority incidents for timely closure',
                active: true,
                applicabilityRules: [
                    { field: 'priority', operator: 'equals', value: 'Medium', logic: 'AND' },
                    { field: 'status', operator: 'equals', value: 'Open', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'supervisor@company.com',
                        delay: 24
                    },
                    {
                        level: 2,
                        roles: ['department-head'],
                        fallbackEmail: 'dept-head@company.com',
                        delay: 72
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'createdDate',
                        daysBefore: 0,
                        daysAfter: 3
                    },
                    {
                        type: 'time-based',
                        level: 2,
                        referenceField: 'createdDate',
                        daysBefore: 0,
                        daysAfter: 7
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'Incident {{id}} Update Required - {{location}}',
                        body: `Dear {{recipientName}},

Please review the following incident:

Incident Details:
- ID: {{id}}
- Location: {{location}}
- Description: {{description}}
- Priority: {{priority}}
- Status: {{status}}

Ensure timely resolution and update status as needed.

View Incident: {{actionUrl}}

Safety Management System`
                    },
                    sms: 'INCIDENT {{id}} needs attention. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-4',
                name: 'Low Priority Incident Review',
                module: 'incidents',
                description: 'Weekly review of low priority incidents',
                active: true,
                applicabilityRules: [
                    { field: 'priority', operator: 'equals', value: 'Low', logic: 'AND' },
                    { field: 'status', operator: 'equals', value: 'Open', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'supervisor@company.com',
                        delay: 168 // 1 week
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'createdDate',
                        daysBefore: 0,
                        daysAfter: 7
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'Weekly Incident Review - {{id}}',
                        body: `Dear {{recipientName}},

Weekly review of open incidents:

Incident Details:
- ID: {{id}}
- Location: {{location}}
- Description: {{description}}
- Priority: {{priority}}

Please review and close if resolved.

View Incident: {{actionUrl}}

Safety Management System`
                    },
                    sms: 'WEEKLY REVIEW: Incident {{id}}. View: {{actionUrl}}'
                }
            },

            // WORK PERMIT TEMPLATES
            {
                id: 'template-5',
                name: 'Permit Expiration Warning',
                module: 'work-permits',
                description: 'Warns about upcoming work permit expirations',
                active: true,
                applicabilityRules: [
                    { field: 'status', operator: 'equals', value: 'Active', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'permit-coordinator@company.com',
                        delay: 0
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'expirationDate',
                        daysBefore: 7,
                        daysAfter: 0
                    },
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'expirationDate',
                        daysBefore: 1,
                        daysAfter: 0
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'Permit {{id}} Expires Soon - {{location}}',
                        body: `Dear {{recipientName}},

Work Permit {{id}} is approaching expiration:

Permit Details:
- ID: {{id}}
- Location: {{location}}
- Description: {{description}}
- Expires: {{expirationDate}}
- Issued To: {{issuedTo}}

Please ensure renewal or closure as appropriate.

View Permit: {{actionUrl}}

Permit Management System`
                    },
                    sms: 'PERMIT {{id}} expires {{expirationDate}}. Location: {{location}}. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-6',
                name: 'High Risk Permit Monitoring',
                module: 'work-permits',
                description: 'Enhanced monitoring for high-risk work permits',
                active: true,
                applicabilityRules: [
                    { field: 'status', operator: 'equals', value: 'Active', logic: 'AND' },
                    { field: 'location', operator: 'contains', value: 'High Risk', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'safety-coordinator@company.com',
                        delay: 0
                    },
                    {
                        level: 2,
                        roles: ['department-head'],
                        fallbackEmail: 'dept-head@company.com',
                        delay: 12
                    },
                    {
                        level: 3,
                        roles: ['site-manager'],
                        fallbackEmail: 'site-manager@company.com',
                        delay: 24
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'expirationDate',
                        daysBefore: 3,
                        daysAfter: 0
                    },
                    {
                        type: 'time-based',
                        level: 2,
                        referenceField: 'expirationDate',
                        daysBefore: 1,
                        daysAfter: 0
                    },
                    {
                        type: 'time-based',
                        level: 3,
                        referenceField: 'expirationDate',
                        daysBefore: 0,
                        daysAfter: 1
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'HIGH RISK: Permit {{id}} Requires Attention - {{location}}',
                        body: `Dear {{recipientName}},

HIGH RISK Work Permit requires immediate attention:

Permit Details:
- ID: {{id}}
- Location: {{location}}
- Description: {{description}}
- Expires: {{expirationDate}}
- Issued To: {{issuedTo}}

This is a high-risk permit requiring enhanced monitoring.

View Permit: {{actionUrl}}

Permit Management System`
                    },
                    sms: 'HIGH RISK PERMIT {{id}} expires {{expirationDate}}. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-7',
                name: 'Expired Permit Follow-up',
                module: 'work-permits',
                description: 'Follows up on expired permits to ensure proper closure',
                active: true,
                applicabilityRules: [
                    { field: 'status', operator: 'equals', value: 'Expired', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'permit-coordinator@company.com',
                        delay: 0
                    },
                    {
                        level: 2,
                        roles: ['department-head'],
                        fallbackEmail: 'dept-head@company.com',
                        delay: 24
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'expirationDate',
                        daysBefore: 0,
                        daysAfter: 1
                    },
                    {
                        type: 'time-based',
                        level: 2,
                        referenceField: 'expirationDate',
                        daysBefore: 0,
                        daysAfter: 3
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'EXPIRED: Permit {{id}} Requires Closure - {{location}}',
                        body: `Dear {{recipientName}},

Work Permit has expired and requires immediate closure:

Permit Details:
- ID: {{id}}
- Location: {{location}}
- Description: {{description}}
- Expired: {{expirationDate}}
- Issued To: {{issuedTo}}

Please ensure work has stopped and permit is properly closed.

View Permit: {{actionUrl}}

Permit Management System`
                    },
                    sms: 'EXPIRED PERMIT {{id}}. Ensure closure. View: {{actionUrl}}'
                }
            },

            // AUDIT TEMPLATES
            {
                id: 'template-8',
                name: 'Audit Finding Follow-up',
                module: 'audits',
                description: 'Ensures timely resolution of audit findings',
                active: true,
                applicabilityRules: [
                    { field: 'severity', operator: 'equals', value: 'High', logic: 'AND' },
                    { field: 'status', operator: 'equals', value: 'Open', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'audit-coordinator@company.com',
                        delay: 0
                    },
                    {
                        level: 2,
                        roles: ['department-head'],
                        fallbackEmail: 'compliance@company.com',
                        delay: 7
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 3
                    },
                    {
                        type: 'time-based',
                        level: 2,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 7
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'Audit Finding {{id}} - Action Required',
                        body: `Dear {{recipientName}},

An audit finding requires your attention:

Finding Details:
- ID: {{id}}
- Description: {{description}}
- Severity: {{severity}}
- Due Date: {{dueDate}}
- Assigned To: {{assignedTo}}

Please take corrective action by the due date.

View Finding: {{actionUrl}}

Audit Management System`
                    },
                    sms: 'AUDIT FINDING {{id}} due {{dueDate}}. Severity: {{severity}}. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-9',
                name: 'Medium Severity Audit Follow-up',
                module: 'audits',
                description: 'Follows up on medium severity audit findings',
                active: true,
                applicabilityRules: [
                    { field: 'severity', operator: 'equals', value: 'Medium', logic: 'AND' },
                    { field: 'status', operator: 'equals', value: 'Open', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'audit-coordinator@company.com',
                        delay: 14
                    },
                    {
                        level: 2,
                        roles: ['department-head'],
                        fallbackEmail: 'compliance@company.com',
                        delay: 30
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 7
                    },
                    {
                        type: 'time-based',
                        level: 2,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 14
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'Audit Finding {{id}} - Follow-up Required',
                        body: `Dear {{recipientName}},

Please follow up on this audit finding:

Finding Details:
- ID: {{id}}
- Description: {{description}}
- Severity: {{severity}}
- Due Date: {{dueDate}}
- Assigned To: {{assignedTo}}

Progress update required.

View Finding: {{actionUrl}}

Audit Management System`
                    },
                    sms: 'AUDIT FOLLOW-UP {{id}} due {{dueDate}}. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-10',
                name: 'Low Severity Audit Monitoring',
                module: 'audits',
                description: 'Monthly monitoring of low severity audit findings',
                active: true,
                applicabilityRules: [
                    { field: 'severity', operator: 'equals', value: 'Low', logic: 'AND' },
                    { field: 'status', operator: 'equals', value: 'Open', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['direct-manager'],
                        fallbackEmail: 'audit-coordinator@company.com',
                        delay: 30
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 15
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'Monthly Audit Review - Finding {{id}}',
                        body: `Dear {{recipientName}},

Monthly review of audit findings:

Finding Details:
- ID: {{id}}
- Description: {{description}}
- Severity: {{severity}}
- Due Date: {{dueDate}}
- Assigned To: {{assignedTo}}

Please provide status update.

View Finding: {{actionUrl}}

Audit Management System`
                    },
                    sms: 'MONTHLY AUDIT REVIEW {{id}}. View: {{actionUrl}}'
                }
            },
            {
                id: 'template-11',
                name: 'Overdue Audit Finding Escalation',
                module: 'audits',
                description: 'Escalates overdue audit findings',
                active: true,
                applicabilityRules: [
                    { field: 'status', operator: 'equals', value: 'Overdue', logic: 'AND' }
                ],
                hierarchy: [
                    {
                        level: 1,
                        roles: ['department-head'],
                        fallbackEmail: 'compliance@company.com',
                        delay: 0
                    },
                    {
                        level: 2,
                        roles: ['general-manager'],
                        fallbackEmail: 'gm@company.com',
                        delay: 7
                    },
                    {
                        level: 3,
                        roles: ['executive'],
                        fallbackEmail: 'executive@company.com',
                        delay: 14
                    }
                ],
                triggers: [
                    {
                        type: 'time-based',
                        level: 1,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 1
                    },
                    {
                        type: 'time-based',
                        level: 2,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 7
                    },
                    {
                        type: 'time-based',
                        level: 3,
                        referenceField: 'dueDate',
                        daysBefore: 0,
                        daysAfter: 14
                    }
                ],
                notificationTemplates: {
                    email: {
                        subject: 'OVERDUE: Audit Finding {{id}} - Immediate Action Required',
                        body: `Dear {{recipientName}},

CRITICAL: Audit finding is overdue and requires immediate attention:

Finding Details:
- ID: {{id}}
- Description: {{description}}
- Severity: {{severity}}
- Due Date: {{dueDate}} (OVERDUE)
- Assigned To: {{assignedTo}}

Immediate corrective action required.

View Finding: {{actionUrl}}

Audit Management System`
                    },
                    sms: 'OVERDUE AUDIT {{id}}. IMMEDIATE ACTION REQUIRED. View: {{actionUrl}}'
                }
            }
        ];
    }

    async generateDummyRecords() {
        const now = new Date();

        // Add edge case records for testing
        this.addEdgeCaseRecords(now);

        // Generate incidents with various priorities, statuses, and dates
        this.records.incidents = [
            // Critical incidents - should trigger immediate escalation
            {
                id: 'INC-2025-001',
                title: 'Chemical Spill in Lab A',
                description: 'Hazardous chemical spill occurred during transfer operation',
                priority: 'Critical',
                status: 'Open',
                location: 'Laboratory A',
                reportedBy: 'John Smith',
                createdDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                department: 'Chemistry'
            },
            {
                id: 'INC-2025-002',
                title: 'Gas Leak in Production Area',
                description: 'Natural gas leak detected in production facility',
                priority: 'Critical',
                status: 'Open',
                location: 'Production Area C',
                reportedBy: 'Maria Rodriguez',
                createdDate: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                department: 'Manufacturing'
            },
            {
                id: 'INC-2025-003',
                title: 'Electrical Fire Hazard',
                description: 'Overheated electrical panel smoking',
                priority: 'Critical',
                status: 'Resolved',
                location: 'Electrical Room B',
                reportedBy: 'David Chen',
                createdDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                department: 'Facilities'
            },

            // High priority incidents
            {
                id: 'INC-2025-004',
                title: 'Near Miss - Forklift Incident',
                description: 'Forklift nearly collided with worker',
                priority: 'High',
                status: 'Open',
                location: 'Warehouse B',
                reportedBy: 'Mike Davis',
                createdDate: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                department: 'Logistics'
            },
            {
                id: 'INC-2025-005',
                title: 'Slippery Floor Hazard',
                description: 'Water leak creating slippery conditions in hallway',
                priority: 'High',
                status: 'Open',
                location: 'Main Corridor - Floor 2',
                reportedBy: 'Lisa Wong',
                createdDate: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
                department: 'Facilities'
            },
            {
                id: 'INC-2025-006',
                title: 'Equipment Guard Missing',
                description: 'Safety guard removed from conveyor belt',
                priority: 'High',
                status: 'In Progress',
                location: 'Production Line 3',
                reportedBy: 'Robert Taylor',
                createdDate: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                department: 'Manufacturing'
            },
            {
                id: 'INC-2025-007',
                title: 'Improper PPE Usage',
                description: 'Workers not wearing required safety glasses',
                priority: 'High',
                status: 'Open',
                location: 'Welding Station A',
                reportedBy: 'Jennifer Kim',
                createdDate: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
                department: 'Manufacturing'
            },

            // Medium priority incidents
            {
                id: 'INC-2025-008',
                title: 'Minor Equipment Malfunction',
                description: 'Conveyor belt stopped unexpectedly',
                priority: 'Medium',
                status: 'Open',
                location: 'Production Line 2',
                reportedBy: 'Sarah Johnson',
                createdDate: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                department: 'Manufacturing'
            },
            {
                id: 'INC-2025-009',
                title: 'Broken Handrail',
                description: 'Handrail on staircase is loose',
                priority: 'Medium',
                status: 'Open',
                location: 'Stairwell B - Floor 3',
                reportedBy: 'Tom Anderson',
                createdDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                department: 'Facilities'
            },
            {
                id: 'INC-2025-010',
                title: 'Lighting Issue',
                description: 'Emergency light not functioning',
                priority: 'Medium',
                status: 'Resolved',
                location: 'Office Area D',
                reportedBy: 'Anna Petrov',
                createdDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                department: 'Facilities'
            },
            {
                id: 'INC-2025-011',
                title: 'Noise Complaint',
                description: 'Excessive noise from equipment',
                priority: 'Medium',
                status: 'Open',
                location: 'Packaging Area',
                reportedBy: 'Carlos Mendez',
                createdDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                department: 'Manufacturing'
            },

            // Low priority incidents
            {
                id: 'INC-2025-012',
                title: 'Cluttered Walkway',
                description: 'Boxes blocking emergency exit path',
                priority: 'Low',
                status: 'Open',
                location: 'Storage Area F',
                reportedBy: 'Emma Wilson',
                createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                department: 'Logistics'
            },
            {
                id: 'INC-2025-013',
                title: 'Outdated Safety Sign',
                description: 'Safety sign is faded and hard to read',
                priority: 'Low',
                status: 'Open',
                location: 'Loading Dock',
                reportedBy: 'James Brown',
                createdDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
                department: 'Facilities'
            },
            {
                id: 'INC-2025-014',
                title: 'Minor Office Hazard',
                description: 'Loose cable under desk',
                priority: 'Low',
                status: 'Resolved',
                location: 'Office 205',
                reportedBy: 'Sophie Martin',
                createdDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
                department: 'Administration'
            }
        ];

        // Generate work permits with various statuses and expiration dates
        this.records['work-permits'] = [
            // Active permits - various expiration times
            {
                id: 'WP-2025-001',
                title: 'Electrical Maintenance - Panel Replacement',
                description: 'Replace faulty electrical panel in server room',
                status: 'Active',
                location: 'Server Room A',
                issuedTo: 'Electrical Team',
                expirationDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
                department: 'IT'
            },
            {
                id: 'WP-2025-002',
                title: 'Roof Repair Work',
                description: 'Repair leaking roof section',
                status: 'Active',
                location: 'Building C - Roof',
                issuedTo: 'Maintenance Team',
                expirationDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
                department: 'Facilities'
            },
            {
                id: 'WP-2025-003',
                title: 'High Risk Confined Space Entry',
                description: 'Maintenance work in chemical storage tank',
                status: 'Active',
                location: 'Chemical Storage Tank B',
                issuedTo: 'Specialized Maintenance Team',
                expirationDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
                department: 'Chemistry'
            },
            {
                id: 'WP-2025-004',
                title: 'HVAC System Maintenance',
                description: 'Replace air filters and clean ducts',
                status: 'Active',
                location: 'Mechanical Room 2',
                issuedTo: 'HVAC Team',
                expirationDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
                department: 'Facilities'
            },
            {
                id: 'WP-2025-005',
                title: 'Welding Work on Pipeline',
                description: 'Repair weld on water pipeline',
                status: 'Active',
                location: 'Utility Corridor',
                issuedTo: 'Welding Team',
                expirationDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
                department: 'Facilities'
            },

            // Expired permits
            {
                id: 'WP-2025-006',
                title: 'Floor Cleaning and Waxing',
                description: 'Deep clean and wax production floor',
                status: 'Expired',
                location: 'Production Floor A',
                issuedTo: 'Cleaning Crew',
                expirationDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                department: 'Facilities'
            },
            {
                id: 'WP-2025-007',
                title: 'Painting Work in Office Area',
                description: 'Paint office walls and ceiling',
                status: 'Expired',
                location: 'Office Wing B',
                issuedTo: 'Painting Contractor',
                expirationDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                department: 'Facilities'
            },

            // Closed permits
            {
                id: 'WP-2025-008',
                title: 'Emergency Plumbing Repair',
                description: 'Fix burst pipe in bathroom',
                status: 'Closed',
                location: 'Bathroom Floor 1',
                issuedTo: 'Plumbing Team',
                expirationDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                department: 'Facilities'
            }
        ];

        // Generate audits with various severities, statuses, and due dates
        this.records.audits = [
            // High severity - should trigger immediate escalation
            {
                id: 'AUD-2025-001',
                title: 'Safety Procedure Compliance Review',
                description: 'Review of PPE usage in manufacturing areas',
                severity: 'High',
                status: 'Open',
                assignedTo: 'Manufacturing Manager',
                dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
                department: 'Manufacturing'
            },
            {
                id: 'AUD-2025-002',
                title: 'Emergency Equipment Maintenance',
                description: 'Monthly inspection of fire extinguishers and alarms',
                severity: 'High',
                status: 'Open',
                assignedTo: 'Safety Coordinator',
                dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
                department: 'Safety'
            },
            {
                id: 'AUD-2025-003',
                title: 'Hazardous Material Storage',
                description: 'Audit of chemical storage compliance',
                severity: 'High',
                status: 'Overdue',
                assignedTo: 'Chemistry Lab Manager',
                dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                department: 'Chemistry'
            },

            // Medium severity
            {
                id: 'AUD-2025-004',
                title: 'Emergency Exit Accessibility',
                description: 'Verify all emergency exits are accessible',
                severity: 'Medium',
                status: 'Open',
                assignedTo: 'Facilities Manager',
                dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
                department: 'Facilities'
            },
            {
                id: 'AUD-2025-005',
                title: 'Office Ergonomics Assessment',
                description: 'Review workstation setups for ergonomics',
                severity: 'Medium',
                status: 'Open',
                assignedTo: 'HR Manager',
                dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
                department: 'Human Resources'
            },
            {
                id: 'AUD-2025-006',
                title: 'Waste Disposal Procedures',
                description: 'Audit of hazardous waste handling',
                severity: 'Medium',
                status: 'In Progress',
                assignedTo: 'Environmental Coordinator',
                dueDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
                department: 'Environmental'
            },

            // Low severity
            {
                id: 'AUD-2025-007',
                title: 'Office Supply Inventory',
                description: 'Quarterly inventory of safety supplies',
                severity: 'Low',
                status: 'Open',
                assignedTo: 'Office Manager',
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                department: 'Administration'
            },
            {
                id: 'AUD-2025-008',
                title: 'Parking Lot Lighting',
                description: 'Inspect parking area lighting',
                severity: 'Low',
                status: 'Open',
                assignedTo: 'Security Manager',
                dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
                department: 'Security'
            },
            {
                id: 'AUD-2025-009',
                title: 'First Aid Kit Inspection',
                description: 'Monthly check of first aid supplies',
                severity: 'Low',
                status: 'Resolved',
                assignedTo: 'Safety Coordinator',
                dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                department: 'Safety'
            },
            {
                id: 'AUD-2025-010',
                title: 'Document Control Review',
                description: 'Annual review of safety documentation',
                severity: 'Low',
                status: 'Open',
                assignedTo: 'Quality Manager',
                dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
                department: 'Quality'
            }
        ];
    }

    addEdgeCaseRecords(now) {
        // Edge case records for testing
        this.records.incidents.unshift(
            // Invalid inputs
            {
                id: 'INC-EDGE-001',
                title: '', // Empty title
                description: null, // Null description
                priority: 'Invalid', // Invalid priority
                status: 'Open',
                location: 'Test Location',
                reportedBy: '',
                createdDate: 'invalid-date', // Invalid date
                department: 'Test'
            },
            {
                id: 'INC-EDGE-002',
                title: 'Very Long Title '.repeat(100), // Very long title
                description: 'Normal description',
                priority: 'Critical',
                status: 'Open',
                location: 'Location with <script>alert("XSS")</script>', // Special chars
                reportedBy: 'User',
                createdDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                department: 'Test'
            },
            {
                id: 'INC-EDGE-003',
                title: 'Zero Priority Test',
                description: 'Testing zero values',
                priority: 0, // Zero priority
                status: 'Open',
                location: 'Test',
                reportedBy: 'User',
                createdDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year future
                department: 'Test'
            }
        );

        // Add to work-permits
        this.records['work-permits'].unshift(
            {
                id: 'WP-EDGE-001',
                title: null, // Null title
                description: '',
                status: 'Invalid', // Invalid status
                location: 'Test',
                issuedTo: '',
                expirationDate: null, // Null date
                department: 'Test'
            }
        );

        // Add to audits
        this.records.audits.unshift(
            {
                id: 'AUD-EDGE-001',
                title: 'Audit with Special Chars: @#$%^&*()',
                description: 'Description with unicode: 你好世界 🌍',
                severity: 'Extreme', // Invalid severity
                status: 'Open',
                assignedTo: null, // Null assignedTo
                dueDate: '2025-02-30', // Invalid date (Feb 30)
                department: 'Test'
            }
        );
    }

    async generateDummyUsers() {
        this.users = [
            // Executive Level
            {
                id: 'user-1',
                name: 'Robert CEO',
                email: 'robert.ceo@company.com',
                phone: '+1234567001',
                role: 'CEO',
                department: 'Executive',
                manager: null
            },
            {
                id: 'user-2',
                name: 'Jennifer CFO',
                email: 'jennifer.cfo@company.com',
                phone: '+1234567002',
                role: 'CFO',
                department: 'Executive',
                manager: 'user-1'
            },
            {
                id: 'user-3',
                name: 'Michael COO',
                email: 'michael.coo@company.com',
                phone: '+1234567003',
                role: 'COO',
                department: 'Executive',
                manager: 'user-1'
            },

            // Site Management
            {
                id: 'user-4',
                name: 'David SiteManager',
                email: 'david.sitemanager@company.com',
                phone: '+1234567004',
                role: 'site-manager',
                department: 'Operations',
                manager: 'user-3'
            },
            {
                id: 'user-5',
                name: 'Karen PlantManager',
                email: 'karen.plantmanager@company.com',
                phone: '+1234567005',
                role: 'general-manager',
                department: 'Manufacturing',
                manager: 'user-3'
            },

            // Department Heads
            {
                id: 'user-6',
                name: 'Sarah Johnson',
                email: 'sarah.johnson@company.com',
                phone: '+1234567006',
                role: 'department-head',
                department: 'Chemistry',
                manager: 'user-5'
            },
            {
                id: 'user-7',
                name: 'Mike Davis',
                email: 'mike.davis@company.com',
                phone: '+1234567007',
                role: 'department-head',
                department: 'Manufacturing',
                manager: 'user-5'
            },
            {
                id: 'user-8',
                name: 'Lisa Brown',
                email: 'lisa.brown@company.com',
                phone: '+1234567008',
                role: 'department-head',
                department: 'Facilities',
                manager: 'user-4'
            },
            {
                id: 'user-9',
                name: 'Tom Anderson',
                email: 'tom.anderson@company.com',
                phone: '+1234567009',
                role: 'department-head',
                department: 'IT',
                manager: 'user-3'
            },
            {
                id: 'user-10',
                name: 'Anna Petrov',
                email: 'anna.petrov@company.com',
                phone: '+1234567010',
                role: 'department-head',
                department: 'Safety',
                manager: 'user-4'
            },

            // Managers
            {
                id: 'user-11',
                name: 'John Smith',
                email: 'john.smith@company.com',
                phone: '+1234567011',
                role: 'direct-manager',
                department: 'Chemistry',
                manager: 'user-6'
            },
            {
                id: 'user-12',
                name: 'Maria Rodriguez',
                email: 'maria.rodriguez@company.com',
                phone: '+1234567012',
                role: 'direct-manager',
                department: 'Manufacturing',
                manager: 'user-7'
            },
            {
                id: 'user-13',
                name: 'David Chen',
                email: 'david.chen@company.com',
                phone: '+1234567013',
                role: 'direct-manager',
                department: 'Facilities',
                manager: 'user-8'
            },
            {
                id: 'user-14',
                name: 'Jennifer Kim',
                email: 'jennifer.kim@company.com',
                phone: '+1234567014',
                role: 'direct-manager',
                department: 'IT',
                manager: 'user-9'
            },
            {
                id: 'user-15',
                name: 'Robert Taylor',
                email: 'robert.taylor@company.com',
                phone: '+1234567015',
                role: 'direct-manager',
                department: 'Logistics',
                manager: 'user-7'
            },

            // Safety Coordinators
            {
                id: 'user-16',
                name: 'Sophie Martin',
                email: 'sophie.martin@company.com',
                phone: '+1234567016',
                role: 'safety-coordinator',
                department: 'Safety',
                manager: 'user-10'
            },
            {
                id: 'user-17',
                name: 'Carlos Mendez',
                email: 'carlos.mendez@company.com',
                phone: '+1234567017',
                role: 'safety-coordinator',
                department: 'Manufacturing',
                manager: 'user-7'
            },

            // Technicians and Specialists
            {
                id: 'user-18',
                name: 'Emma Wilson',
                email: 'emma.wilson@company.com',
                phone: '+1234567018',
                role: 'Technician',
                department: 'Chemistry',
                manager: 'user-11'
            },
            {
                id: 'user-19',
                name: 'James Brown',
                email: 'james.brown@company.com',
                phone: '+1234567019',
                role: 'Technician',
                department: 'Manufacturing',
                manager: 'user-12'
            },
            {
                id: 'user-20',
                name: 'Lisa Wong',
                email: 'lisa.wong@company.com',
                phone: '+1234567020',
                role: 'Technician',
                department: 'Facilities',
                manager: 'user-13'
            },
            {
                id: 'user-21',
                name: 'Alex Johnson',
                email: 'alex.johnson@company.com',
                phone: '+1234567021',
                role: 'Technician',
                department: 'IT',
                manager: 'user-14'
            },
            {
                id: 'user-22',
                name: 'Nina Patel',
                email: 'nina.patel@company.com',
                phone: '+1234567022',
                role: 'Technician',
                department: 'Logistics',
                manager: 'user-15'
            },

            // Contractors and External Teams
            {
                id: 'user-23',
                name: 'Electrical Team Lead',
                email: 'electrical@contractor.com',
                phone: '+1234567023',
                role: 'contractor',
                department: 'External',
                manager: 'user-14'
            },
            {
                id: 'user-24',
                name: 'Maintenance Team Lead',
                email: 'maintenance@contractor.com',
                phone: '+1234567024',
                role: 'contractor',
                department: 'External',
                manager: 'user-13'
            },
            {
                id: 'user-25',
                name: 'Cleaning Crew Supervisor',
                email: 'cleaning@contractor.com',
                phone: '+1234567025',
                role: 'contractor',
                department: 'External',
                manager: 'user-8'
            },

            // Additional staff for comprehensive hierarchy
            {
                id: 'user-26',
                name: 'Rachel Green',
                email: 'rachel.green@company.com',
                phone: '+1234567026',
                role: 'specialist',
                department: 'Quality',
                manager: 'user-5'
            },
            {
                id: 'user-27',
                name: 'Kevin White',
                email: 'kevin.white@company.com',
                phone: '+1234567027',
                role: 'specialist',
                department: 'Environmental',
                manager: 'user-4'
            },
            {
                id: 'user-28',
                name: 'Amanda Black',
                email: 'amanda.black@company.com',
                phone: '+1234567028',
                role: 'specialist',
                department: 'HR',
                manager: 'user-1'
            },
            {
                id: 'user-29',
                name: 'Brian Blue',
                email: 'brian.blue@company.com',
                phone: '+1234567029',
                role: 'specialist',
                department: 'Security',
                manager: 'user-4'
            },
            {
                id: 'user-30',
                name: 'Diana Silver',
                email: 'diana.silver@company.com',
                phone: '+1234567030',
                role: 'executive',
                department: 'Executive',
                manager: 'user-1'
            }
        ];
    }

    async generateDummyEscalationLogs() {
        const now = new Date();
        this.escalationLogs = [
            // Recent escalations (last 24 hours)
            {
                id: 'log-1',
                timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                templateId: 'template-1',
                templateName: 'Critical Incident Escalation',
                recordId: 'INC-2025-001',
                level: 1,
                recipient: 'sarah.johnson@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-2',
                timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
                templateId: 'template-2',
                templateName: 'Permit Expiration Warning',
                recordId: 'WP-2025-002',
                level: 1,
                recipient: '+1234567894',
                status: 'sent',
                notificationType: 'sms'
            },
            {
                id: 'log-3',
                timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
                templateId: 'template-3',
                templateName: 'Audit Finding Follow-up',
                recordId: 'AUD-2025-001',
                level: 1,
                recipient: 'mike.davis@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-4',
                timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
                templateId: 'template-1',
                templateName: 'Critical Incident Escalation',
                recordId: 'INC-2025-002',
                level: 1,
                recipient: 'maria.rodriguez@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-5',
                timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
                templateId: 'template-6',
                templateName: 'High Risk Permit Monitoring',
                recordId: 'WP-2025-003',
                level: 1,
                recipient: 'david.chen@company.com',
                status: 'sent',
                notificationType: 'email'
            },

            // Escalations from last few days
            {
                id: 'log-6',
                timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                templateId: 'template-2',
                templateName: 'High Priority Incident Follow-up',
                recordId: 'INC-2025-004',
                level: 1,
                recipient: 'robert.taylor@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-7',
                timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
                templateId: 'template-3',
                templateName: 'Audit Finding Follow-up',
                recordId: 'AUD-2025-002',
                level: 1,
                recipient: 'anna.petrov@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-8',
                timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                templateId: 'template-4',
                templateName: 'Medium Priority Incident Monitoring',
                recordId: 'INC-2025-008',
                level: 1,
                recipient: 'maria.rodriguez@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-9',
                timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                templateId: 'template-5',
                templateName: 'Permit Expiration Warning',
                recordId: 'WP-2025-001',
                level: 1,
                recipient: 'jennifer.kim@company.com',
                status: 'sent',
                notificationType: 'email'
            },

            // Level 2 escalations
            {
                id: 'log-10',
                timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
                templateId: 'template-1',
                templateName: 'Critical Incident Escalation',
                recordId: 'INC-2025-001',
                level: 2,
                recipient: 'karen.plantmanager@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-11',
                timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
                templateId: 'template-2',
                templateName: 'High Priority Incident Follow-up',
                recordId: 'INC-2025-005',
                level: 2,
                recipient: 'lisa.brown@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-12',
                timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                templateId: 'template-3',
                templateName: 'Audit Finding Follow-up',
                recordId: 'AUD-2025-001',
                level: 2,
                recipient: 'michael.coo@company.com',
                status: 'sent',
                notificationType: 'email'
            },

            // Failed notifications
            {
                id: 'log-13',
                timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
                templateId: 'template-1',
                templateName: 'Critical Incident Escalation',
                recordId: 'INC-2025-003',
                level: 1,
                recipient: 'invalid.email@domain',
                status: 'failed',
                notificationType: 'email',
                error: 'Invalid email address'
            },
            {
                id: 'log-14',
                timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
                templateId: 'template-6',
                templateName: 'High Risk Permit Monitoring',
                recordId: 'WP-2025-003',
                level: 2,
                recipient: '+12345678999',
                status: 'failed',
                notificationType: 'sms',
                error: 'Invalid phone number'
            },

            // Level 3 and higher escalations
            {
                id: 'log-15',
                timestamp: new Date(now.getTime() - 16 * 60 * 60 * 1000).toISOString(), // 16 hours ago
                templateId: 'template-1',
                templateName: 'Critical Incident Escalation',
                recordId: 'INC-2025-001',
                level: 3,
                recipient: 'david.sitemanager@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-16',
                timestamp: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
                templateId: 'template-11',
                templateName: 'Overdue Audit Finding Escalation',
                recordId: 'AUD-2025-003',
                level: 1,
                recipient: 'lisa.brown@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-17',
                timestamp: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
                templateId: 'template-11',
                templateName: 'Overdue Audit Finding Escalation',
                recordId: 'AUD-2025-003',
                level: 2,
                recipient: 'robert.ceo@company.com',
                status: 'sent',
                notificationType: 'email'
            },

            // Older escalations (last week)
            {
                id: 'log-18',
                timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                templateId: 'template-4',
                templateName: 'Low Priority Incident Review',
                recordId: 'INC-2025-012',
                level: 1,
                recipient: 'emma.wilson@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-19',
                timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                templateId: 'template-7',
                templateName: 'Expired Permit Follow-up',
                recordId: 'WP-2025-006',
                level: 1,
                recipient: 'maintenance@contractor.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-20',
                timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                templateId: 'template-9',
                templateName: 'Medium Severity Audit Follow-up',
                recordId: 'AUD-2025-004',
                level: 1,
                recipient: 'lisa.brown@company.com',
                status: 'sent',
                notificationType: 'email'
            },
            {
                id: 'log-21',
                timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
                templateId: 'template-10',
                templateName: 'Low Severity Audit Monitoring',
                recordId: 'AUD-2025-007',
                level: 1,
                recipient: 'rachel.green@company.com',
                status: 'sent',
                notificationType: 'email'
            },

            // SMS notifications
            {
                id: 'log-22',
                timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
                templateId: 'template-5',
                templateName: 'Permit Expiration Warning',
                recordId: 'WP-2025-002',
                level: 1,
                recipient: '+1234567894',
                status: 'sent',
                notificationType: 'sms'
            },
            {
                id: 'log-23',
                timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                templateId: 'template-8',
                templateName: 'Audit Finding Follow-up',
                recordId: 'AUD-2025-001',
                level: 1,
                recipient: '+1234567895',
                status: 'sent',
                notificationType: 'sms'
            }
        ];
    }

    async generateDummyNotifications() {
        const now = new Date();
        this.notifications = [
            // Recent email notifications
            {
                id: 'notif-1',
                type: 'email',
                templateId: 'template-1',
                subject: 'CRITICAL: Incident INC-2025-001 - Laboratory A',
                body: 'Dear Sarah Johnson,\n\nA critical incident has been reported and requires immediate attention:\n\nIncident Details:\n- ID: INC-2025-001\n- Location: Laboratory A\n- Description: Hazardous chemical spill occurred during transfer operation\n- Priority: Critical\n- Reported By: John Smith\n\nPlease review and take appropriate action immediately.\n\nView Incident: http://example.com/incidents/INC-2025-001\n\nSafety Management System',
                recipient: 'sarah.johnson@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-2',
                type: 'email',
                templateId: 'template-1',
                subject: 'CRITICAL: Incident INC-2025-002 - Production Area C',
                body: 'Dear Maria Rodriguez,\n\nA critical incident has been reported and requires immediate attention:\n\nIncident Details:\n- ID: INC-2025-002\n- Location: Production Area C\n- Description: Natural gas leak detected in production facility\n- Priority: Critical\n- Reported By: Maria Rodriguez\n\nPlease review and take appropriate action immediately.\n\nView Incident: http://example.com/incidents/INC-2025-002\n\nSafety Management System',
                recipient: 'maria.rodriguez@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-3',
                type: 'email',
                templateId: 'template-2',
                subject: 'HIGH PRIORITY: Incident INC-2025-004 - Warehouse B',
                body: 'Dear Robert Taylor,\n\nA high priority incident requires your attention:\n\nIncident Details:\n- ID: INC-2025-004\n- Location: Warehouse B\n- Description: Near miss - forklift nearly collided with worker\n- Priority: High\n- Reported By: Mike Davis\n\nPlease review and ensure appropriate action is taken.\n\nView Incident: http://example.com/incidents/INC-2025-004\n\nSafety Management System',
                recipient: 'robert.taylor@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
            },

            // SMS notifications
            {
                id: 'notif-4',
                type: 'sms',
                templateId: 'template-5',
                body: 'PERMIT WP-2025-002 expires tomorrow. Location: Building C - Roof. View: http://example.com/wp/002',
                recipient: '+1234567894',
                status: 'sent',
                timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-5',
                type: 'sms',
                templateId: 'template-6',
                body: 'HIGH RISK PERMIT WP-2025-003 expires in 2 days. View: http://example.com/wp/003',
                recipient: '+1234567895',
                status: 'sent',
                timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-6',
                type: 'sms',
                templateId: 'template-8',
                body: 'AUDIT FINDING AUD-2025-001 due 2025-12-16. Severity: High. View: http://example.com/audits/001',
                recipient: '+1234567896',
                status: 'sent',
                timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
            },

            // Audit notifications
            {
                id: 'notif-7',
                type: 'email',
                templateId: 'template-3',
                subject: 'Audit Finding AUD-2025-001 - Action Required',
                body: 'Dear Mike Davis,\n\nAn audit finding requires your attention:\n\nFinding Details:\n- ID: AUD-2025-001\n- Description: Review of PPE usage in manufacturing areas\n- Severity: High\n- Due Date: 2025-12-16\n- Assigned To: Manufacturing Manager\n\nPlease take corrective action by the due date.\n\nView Finding: http://example.com/audits/AUD-2025-001\n\nAudit Management System',
                recipient: 'mike.davis@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-8',
                type: 'email',
                templateId: 'template-9',
                subject: 'Audit Finding AUD-2025-004 - Follow-up Required',
                body: 'Dear Lisa Brown,\n\nPlease follow up on this audit finding:\n\nFinding Details:\n- ID: AUD-2025-004\n- Description: Verify all emergency exits are accessible\n- Severity: Medium\n- Due Date: 2025-12-21\n- Assigned To: Facilities Manager\n\nProgress update required.\n\nView Finding: http://example.com/audits/AUD-2025-004\n\nAudit Management System',
                recipient: 'lisa.brown@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },

            // Permit notifications
            {
                id: 'notif-9',
                type: 'email',
                templateId: 'template-5',
                subject: 'Permit WP-2025-001 Expires Soon - Server Room A',
                body: 'Dear Jennifer Kim,\n\nWork Permit WP-2025-001 is approaching expiration:\n\nPermit Details:\n- ID: WP-2025-001\n- Location: Server Room A\n- Description: Replace faulty electrical panel in server room\n- Expires: 2025-12-17\n- Issued To: Electrical Team\n\nPlease ensure renewal or closure as appropriate.\n\nView Permit: http://example.com/permits/WP-2025-001\n\nPermit Management System',
                recipient: 'jennifer.kim@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-10',
                type: 'email',
                templateId: 'template-7',
                subject: 'EXPIRED: Permit WP-2025-006 Requires Closure - Production Floor A',
                body: 'Dear Maintenance Contractor,\n\nWork Permit has expired and requires immediate closure:\n\nPermit Details:\n- ID: WP-2025-006\n- Location: Production Floor A\n- Description: Deep clean and wax production floor\n- Expired: 2025-12-08\n- Issued To: Cleaning Crew\n\nPlease ensure work has stopped and permit is properly closed.\n\nView Permit: http://example.com/permits/WP-2025-006\n\nPermit Management System',
                recipient: 'maintenance@contractor.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },

            // Level 2 escalation notifications
            {
                id: 'notif-11',
                type: 'email',
                templateId: 'template-1',
                subject: 'LEVEL 2 ESCALATION: Critical Incident INC-2025-001',
                body: 'Dear Karen Plant Manager,\n\nCRITICAL INCIDENT ESCALATION - LEVEL 2\n\nThis incident has not been resolved within the expected timeframe:\n\nIncident Details:\n- ID: INC-2025-001\n- Location: Laboratory A\n- Description: Hazardous chemical spill\n- Priority: Critical\n- Escalated from: Sarah Johnson (Chemistry Dept Head)\n\nImmediate attention required at executive level.\n\nView Incident: http://example.com/incidents/INC-2025-001\n\nSafety Management System',
                recipient: 'karen.plantmanager@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-12',
                type: 'email',
                templateId: 'template-11',
                subject: 'OVERDUE: Audit Finding AUD-2025-003 - Immediate Action Required',
                body: 'Dear Robert CEO,\n\nCRITICAL: Audit finding is overdue and requires immediate attention:\n\nFinding Details:\n- ID: AUD-2025-003\n- Description: Audit of chemical storage compliance\n- Severity: High\n- Due Date: 2025-12-08 (OVERDUE)\n- Assigned To: Chemistry Lab Manager\n\nImmediate corrective action required.\n\nView Finding: http://example.com/audits/AUD-2025-003\n\nAudit Management System',
                recipient: 'robert.ceo@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString()
            },

            // Failed notifications
            {
                id: 'notif-13',
                type: 'email',
                templateId: 'template-1',
                subject: 'CRITICAL: Incident INC-2025-003 - Electrical Room B',
                body: 'Failed to send notification - invalid email address',
                recipient: 'invalid.email@domain',
                status: 'failed',
                timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                error: 'Invalid email address'
            },
            {
                id: 'notif-14',
                type: 'sms',
                templateId: 'template-6',
                body: 'Failed to send SMS - invalid phone number',
                recipient: '+12345678999',
                status: 'failed',
                timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
                error: 'Invalid phone number'
            },

            // Older notifications
            {
                id: 'notif-15',
                type: 'email',
                templateId: 'template-4',
                subject: 'Incident INC-2025-008 Update Required - Production Line 2',
                body: 'Dear Maria Rodriguez,\n\nPlease review the following incident:\n\nIncident Details:\n- ID: INC-2025-008\n- Location: Production Line 2\n- Description: Conveyor belt stopped unexpectedly\n- Priority: Medium\n- Status: Open\n\nEnsure timely resolution and update status as needed.\n\nView Incident: http://example.com/incidents/INC-2025-008\n\nSafety Management System',
                recipient: 'maria.rodriguez@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'notif-16',
                type: 'email',
                templateId: 'template-10',
                subject: 'Monthly Audit Review - Finding AUD-2025-007',
                body: 'Dear Rachel Green,\n\nMonthly review of audit findings:\n\nFinding Details:\n- ID: AUD-2025-007\n- Description: Quarterly inventory of safety supplies\n- Severity: Low\n- Due Date: 2026-01-10\n- Assigned To: Office Manager\n\nPlease provide status update.\n\nView Finding: http://example.com/audits/AUD-2025-007\n\nAudit Management System',
                recipient: 'rachel.green@company.com',
                status: 'sent',
                timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }

    async getDashboardStats() {
        const activeEscalations = this.escalationLogs.filter(log =>
            log.status === 'sent' &&
            new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length;

        const totalTemplates = this.templates.filter(t => t.active).length;

        // Calculate on-time completion rate (simulated)
        const onTimeCompletionRate = 87;

        // Average response time in hours (simulated)
        const avgResponseTime = 3.2;

        return {
            activeEscalations,
            totalTemplates,
            onTimeCompletionRate,
            avgResponseTime
        };
    }

    async getRecentEscalations(limit = 5) {
        return this.escalationLogs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    async getAllTemplates() {
        return this.templates;
    }

    async getTemplate(id) {
        return this.templates.find(t => t.id === id);
    }

    async getRecords(module) {
        return this.records[module] || [];
    }

    async getSampleRecord(module) {
        const records = this.records[module] || [];
        return records.length > 0 ? records[0] : null;
    }

    async getEscalationLogs(limit = 20) {
        return this.escalationLogs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    async getNotifications() {
        return this.notifications;
    }

    async getUsersByRole(role, department) {
        return this.users.filter(user =>
            user.role.toLowerCase().includes(role.toLowerCase()) &&
            (!department || user.department === department)
        );
    }

    async saveTemplate(template) {
        const existingIndex = this.templates.findIndex(t => t.id === template.id);
        if (existingIndex >= 0) {
            this.templates[existingIndex] = { ...template, updatedAt: new Date().toISOString() };
        } else {
            template.id = `template-${Date.now()}`;
            template.createdAt = new Date().toISOString();
            this.templates.push(template);
        }
        return template;
    }

    async logEscalation(templateId, recordId, level, recipients) {
        const logEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            templateId,
            templateName: this.templates.find(t => t.id === templateId)?.name || 'Unknown',
            recordId,
            level,
            recipients,
            status: 'sent',
            notificationType: 'email'
        };

        this.escalationLogs.unshift(logEntry);
        return logEntry;
    }

    async logCancellation(templateId, recordId) {
        const logEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            templateId,
            templateName: this.templates.find(t => t.id === templateId)?.name || 'Unknown',
            recordId,
            action: 'cancelled'
        };

        this.escalationLogs.unshift(logEntry);
        return logEntry;
    }

    // Simulate real-time escalation processing
    async processPendingEscalations() {
        const now = new Date();

        for (const template of this.templates) {
            if (!template.active) continue;

            const records = this.records[template.module] || [];

            for (const record of records) {
                // Check if record matches template rules
                if (this.evaluateApplicability(template.applicabilityRules, record)) {
                    // Check triggers
                    for (const trigger of template.triggers) {
                        if (this.shouldTriggerEscalation(trigger, record, now)) {
                            // Create escalation log
                            await this.logEscalation(
                                template.id,
                                record.id,
                                trigger.level,
                                ['test@example.com']
                            );
                        }
                    }
                }
            }
        }
    }

    evaluateApplicability(rules, record) {
        if (!rules || rules.length === 0) return true;

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

    shouldTriggerEscalation(trigger, record, now) {
        if (trigger.type === 'time-based') {
            const referenceDate = this.safeDateParse(record[trigger.referenceField]);
            if (!referenceDate) return false;

            const daysDiff = Math.floor((now - referenceDate) / (1000 * 60 * 60 * 24));

            return daysDiff >= trigger.daysBefore && daysDiff <= trigger.daysAfter;
        } else if (trigger.type === 'event-based') {
            return record[trigger.field] === trigger.value;
        }
        return false;
    }
}