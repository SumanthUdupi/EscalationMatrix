// Gamification Manager - Handles scoring, leaderboards, and achievement system
export class GamificationManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.userScores = new Map();
        this.achievements = new Map();
        this.initializeAchievements();
    }

    // Initialize achievement definitions
    initializeAchievements() {
        this.achievements.set('first-response', {
            id: 'first-response',
            name: 'First Responder',
            description: 'Respond to your first escalation notification',
            icon: '🚀',
            points: 10,
            rarity: 'common'
        });

        this.achievements.set('speed-demon', {
            id: 'speed-demon',
            name: 'Speed Demon',
            description: 'Respond to an escalation within 1 hour',
            icon: '⚡',
            points: 25,
            rarity: 'uncommon'
        });

        this.achievements.set('streak-master', {
            id: 'streak-master',
            name: 'Streak Master',
            description: 'Maintain a 7-day response streak',
            icon: '🔥',
            points: 50,
            rarity: 'rare'
        });

        this.achievements.set('safety-hero', {
            id: 'safety-hero',
            name: 'Safety Hero',
            description: 'Prevent 10 safety incidents through timely responses',
            icon: '🦸',
            points: 100,
            rarity: 'epic'
        });

        this.achievements.set('template-creator', {
            id: 'template-creator',
            name: 'Template Creator',
            description: 'Create your first escalation template',
            icon: '⚙️',
            points: 15,
            rarity: 'common'
        });

        this.achievements.set('efficiency-expert', {
            id: 'efficiency-expert',
            name: 'Efficiency Expert',
            description: 'Achieve 95% on-time completion rate for a month',
            icon: '📊',
            points: 75,
            rarity: 'rare'
        });

        this.achievements.set('team-player', {
            id: 'team-player',
            name: 'Team Player',
            description: 'Help team members with 20 escalations',
            icon: '🤝',
            points: 40,
            rarity: 'uncommon'
        });

        this.achievements.set('legendary', {
            id: 'legendary',
            name: 'Legendary Responder',
            description: 'Earn 1000 points total',
            icon: '👑',
            points: 200,
            rarity: 'legendary'
        });
    }

    // Award points for user actions
    async awardPoints(userId, action, metadata = {}) {
        let points = 0;
        let achievements = [];

        switch (action) {
            case 'escalation-response':
                points = 5;
                if (metadata.responseTime < 60) { // Within 1 hour
                    points += 10;
                    achievements.push('speed-demon');
                }
                break;

            case 'on-time-completion':
                points = 15;
                break;

            case 'prevented-incident':
                points = 50;
                break;

            case 'template-created':
                points = 20;
                achievements.push('template-creator');
                break;

            case 'escalation-cancelled':
                points = 5;
                break;

            default:
                points = 1;
        }

        // Update user score
        const currentScore = this.userScores.get(userId) || {
            userId,
            totalPoints: 0,
            currentStreak: 0,
            longestStreak: 0,
            onTimeResponses: 0,
            totalResponses: 0,
            achievements: [],
            lastActivity: null
        };

        currentScore.totalPoints += points;
        currentScore.totalResponses += 1;
        currentScore.lastActivity = new Date().toISOString();

        if (action === 'on-time-completion') {
            currentScore.onTimeResponses += 1;
        }

        // Update streak
        this.updateStreak(currentScore, action);

        // Check for new achievements
        const newAchievements = await this.checkAchievements(currentScore, achievements);
        currentScore.achievements.push(...newAchievements);

        this.userScores.set(userId, currentScore);

        return {
            pointsAwarded: points,
            newAchievements,
            totalScore: currentScore.totalPoints
        };
    }

    // Update user streak
    updateStreak(userScore, action) {
        const now = new Date();
        const lastActivity = userScore.lastActivity ? new Date(userScore.lastActivity) : null;

        if (action === 'escalation-response' || action === 'on-time-completion') {
            if (!lastActivity || (now - lastActivity) > 24 * 60 * 60 * 1000) {
                // Reset streak if more than 24 hours passed
                userScore.currentStreak = 1;
            } else {
                userScore.currentStreak += 1;
            }

            if (userScore.currentStreak > userScore.longestStreak) {
                userScore.longestStreak = userScore.currentStreak;
            }
        }
    }

    // Check for new achievements
    async checkAchievements(userScore, triggeredAchievements) {
        const newAchievements = [];

        // Check triggered achievements
        for (const achievementId of triggeredAchievements) {
            if (!userScore.achievements.includes(achievementId)) {
                newAchievements.push(achievementId);
            }
        }

        // Check milestone achievements
        if (userScore.totalPoints >= 1000 && !userScore.achievements.includes('legendary')) {
            newAchievements.push('legendary');
        }

        if (userScore.currentStreak >= 7 && !userScore.achievements.includes('streak-master')) {
            newAchievements.push('streak-master');
        }

        if (userScore.onTimeResponses >= 10 && !userScore.achievements.includes('safety-hero')) {
            newAchievements.push('safety-hero');
        }

        const onTimeRate = userScore.totalResponses > 0 ?
            (userScore.onTimeResponses / userScore.totalResponses) * 100 : 0;

        if (onTimeRate >= 95 && !userScore.achievements.includes('efficiency-expert')) {
            newAchievements.push('efficiency-expert');
        }

        if (userScore.totalResponses >= 20 && !userScore.achievements.includes('team-player')) {
            newAchievements.push('team-player');
        }

        return newAchievements;
    }

    // Get leaderboard
    async getLeaderboard(limit = 10) {
        const users = Array.from(this.userScores.values());

        // Add some dummy users for demonstration
        const dummyUsers = [
            {
                userId: 'dummy-1',
                name: 'Alice Johnson',
                totalPoints: 450,
                currentStreak: 5,
                onTimeResponses: 45,
                totalResponses: 50,
                achievements: ['first-response', 'speed-demon', 'streak-master']
            },
            {
                userId: 'dummy-2',
                name: 'Bob Smith',
                totalPoints: 380,
                currentStreak: 3,
                onTimeResponses: 38,
                totalResponses: 42,
                achievements: ['first-response', 'template-creator']
            },
            {
                userId: 'dummy-3',
                name: 'Carol Davis',
                totalPoints: 290,
                currentStreak: 8,
                onTimeResponses: 28,
                totalResponses: 30,
                achievements: ['first-response', 'speed-demon', 'streak-master', 'efficiency-expert']
            }
        ];

        const allUsers = [...users, ...dummyUsers];

        // Sort by total points descending
        allUsers.sort((a, b) => b.totalPoints - a.totalPoints);

        return allUsers.slice(0, limit).map((user, index) => ({
            rank: index + 1,
            name: user.name || `User ${user.userId}`,
            points: user.totalPoints,
            onTimePercentage: user.totalResponses > 0 ?
                Math.round((user.onTimeResponses / user.totalResponses) * 100) : 0,
            badges: user.achievements.length,
            isCurrentUser: user.userId === 'current-user'
        }));
    }

    // Get user stats
    async getUserStats(userId) {
        const userScore = this.userScores.get(userId);

        if (!userScore) {
            // Return default stats for new users
            return {
                score: 0,
                currentStreak: 0,
                longestStreak: 0,
                onTimeResponses: 0,
                totalResponses: 0,
                achievements: [],
                rank: 'Unranked'
            };
        }

        const leaderboard = await this.getLeaderboard(100);
        const userRank = leaderboard.find(user => user.isCurrentUser)?.rank || 'Unranked';

        return {
            score: userScore.totalPoints,
            currentStreak: userScore.currentStreak,
            longestStreak: userScore.longestStreak,
            onTimeResponses: userScore.onTimeResponses,
            totalResponses: userScore.totalResponses,
            achievements: userScore.achievements,
            rank: userRank
        };
    }

    // Get user badges/achievements
    async getUserBadges(userId) {
        const userScore = this.userScores.get(userId);

        if (!userScore || !userScore.achievements) {
            return [];
        }

        return userScore.achievements.map(achievementId => {
            const achievement = this.achievements.get(achievementId);
            return achievement ? {
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                rarity: achievement.rarity,
                earnedAt: new Date().toISOString() // In real system, store actual earn date
            } : null;
        }).filter(Boolean);
    }

    // Get achievement definitions
    getAllAchievements() {
        return Array.from(this.achievements.values());
    }

    // Get achievement by ID
    getAchievement(id) {
        return this.achievements.get(id);
    }

    // Calculate team performance metrics
    async getTeamStats() {
        const allUsers = Array.from(this.userScores.values());
        const dummyUsers = [
            { totalPoints: 450, onTimeResponses: 45, totalResponses: 50 },
            { totalPoints: 380, onTimeResponses: 38, totalResponses: 42 },
            { totalPoints: 290, onTimeResponses: 28, totalResponses: 30 }
        ];

        const teamUsers = [...allUsers, ...dummyUsers];

        if (teamUsers.length === 0) {
            return {
                averageScore: 0,
                totalPoints: 0,
                averageOnTimeRate: 0,
                activeUsers: 0
            };
        }

        const totalPoints = teamUsers.reduce((sum, user) => sum + user.totalPoints, 0);
        const totalResponses = teamUsers.reduce((sum, user) => sum + user.totalResponses, 0);
        const totalOnTime = teamUsers.reduce((sum, user) => sum + user.onTimeResponses, 0);

        return {
            averageScore: Math.round(totalPoints / teamUsers.length),
            totalPoints,
            averageOnTimeRate: totalResponses > 0 ? Math.round((totalOnTime / totalResponses) * 100) : 0,
            activeUsers: teamUsers.length
        };
    }

    // Get gamification statistics
    async getGamificationStats() {
        const allUsers = Array.from(this.userScores.values());
        const achievements = Array.from(this.achievements.values());

        const totalAchievements = achievements.length;
        const earnedAchievements = new Set();

        allUsers.forEach(user => {
            user.achievements.forEach(achievement => {
                earnedAchievements.add(achievement);
            });
        });

        return {
            totalUsers: allUsers.length + 3, // Including dummy users
            totalPoints: allUsers.reduce((sum, user) => sum + user.totalPoints, 0) + 1120, // Including dummy points
            totalAchievements,
            earnedAchievements: earnedAchievements.size,
            averageStreak: allUsers.length > 0 ?
                Math.round(allUsers.reduce((sum, user) => sum + user.currentStreak, 0) / allUsers.length) : 0
        };
    }

    // Simulate user activity for demo purposes
    async simulateUserActivity(userId, days = 30) {
        const actions = ['escalation-response', 'on-time-completion', 'escalation-cancelled'];
        const results = [];

        for (let i = 0; i < days; i++) {
            const dailyActions = Math.floor(Math.random() * 3) + 1; // 1-3 actions per day

            for (let j = 0; j < dailyActions; j++) {
                const action = actions[Math.floor(Math.random() * actions.length)];
                const metadata = action === 'escalation-response' ?
                    { responseTime: Math.floor(Math.random() * 120) } : {};

                const result = await this.awardPoints(userId, action, metadata);
                results.push(result);
            }
        }

        return results;
    }

    // Reset user progress (for testing)
    resetUserProgress(userId) {
        this.userScores.delete(userId);
    }

    // Export gamification data
    exportData() {
        return {
            userScores: Array.from(this.userScores.entries()),
            achievements: Array.from(this.achievements.entries()),
            exportedAt: new Date().toISOString()
        };
    }

    // Import gamification data
    importData(data) {
        if (data.userScores) {
            this.userScores = new Map(data.userScores);
        }
        if (data.achievements) {
            this.achievements = new Map(data.achievements);
        }
    }
}