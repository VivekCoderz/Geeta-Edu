const mongoose = require('mongoose');

const pointHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'enrollment',       // +50
      'video_watched',    // +10
      'assignment_submit', // +30
      'test_complete',    // +20 to +50 based on score
      'ai_lesson',        // +15
      'daily_login',      // +5
      'streak_bonus',     // +10 per day
      'quiz_perfect',     // +25
    ]
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'pointsHistory.referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Course', 'Batch', 'Test', 'Assignment', null],
    default: null
  },
  earnedAt: {
    type: Date,
    default: Date.now
  }
});

const badgeSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  icon: String, // emoji or icon name
  earnedAt: {
    type: Date,
    default: Date.now
  }
});

const gamificationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  totalPoints: {
    type: Number,
    default: 0
  },
  
  level: {
    type: Number,
    default: 1
  },
  
  levelTitle: {
    type: String,
    default: 'Beginner'
  },
  
  badges: [badgeSchema],
  
  pointsHistory: [pointHistorySchema],
  
  // Streak tracking
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  
  // Weekly activity (last 7 days points)
  weeklyActivity: [{
    date: String,  // YYYY-MM-DD
    points: Number
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate level from points
gamificationSchema.methods.recalculateLevel = function() {
  const pts = this.totalPoints;
  if (pts >= 2000) { this.level = 10; this.levelTitle = 'Grandmaster'; }
  else if (pts >= 1500) { this.level = 9; this.levelTitle = 'Master'; }
  else if (pts >= 1100) { this.level = 8; this.levelTitle = 'Expert'; }
  else if (pts >= 800) { this.level = 7; this.levelTitle = 'Specialist'; }
  else if (pts >= 600) { this.level = 6; this.levelTitle = 'Advanced'; }
  else if (pts >= 400) { this.level = 5; this.levelTitle = 'Intermediate'; }
  else if (pts >= 250) { this.level = 4; this.levelTitle = 'Learner'; }
  else if (pts >= 150) { this.level = 3; this.levelTitle = 'Explorer'; }
  else if (pts >= 50) { this.level = 2; this.levelTitle = 'Starter'; }
  else { this.level = 1; this.levelTitle = 'Beginner'; }
  return this;
};

// Check and award badges
gamificationSchema.methods.checkBadges = function() {
  const hasBadge = (id) => this.badges.some(b => b.badgeId === id);
  
  // First enrollment
  const enrollActions = this.pointsHistory.filter(p => p.action === 'enrollment');
  if (enrollActions.length >= 1 && !hasBadge('first_enrollment')) {
    this.badges.push({ badgeId: 'first_enrollment', title: 'First Step', description: 'Enrolled in your first course', icon: '🎯' });
  }
  
  // Streak badges
  if (this.currentStreak >= 7 && !hasBadge('streak_7')) {
    this.badges.push({ badgeId: 'streak_7', title: 'Week Warrior', description: '7-day learning streak', icon: '🔥' });
  }
  if (this.currentStreak >= 30 && !hasBadge('streak_30')) {
    this.badges.push({ badgeId: 'streak_30', title: 'Monthly Master', description: '30-day learning streak', icon: '🏆' });
  }
  
  // Quiz/Test perfection
  const perfectQuizzes = this.pointsHistory.filter(p => p.action === 'quiz_perfect');
  if (perfectQuizzes.length >= 1 && !hasBadge('quiz_master')) {
    this.badges.push({ badgeId: 'quiz_master', title: 'Quiz Master', description: 'Got a perfect quiz score', icon: '🧠' });
  }
  
  // 5 assignments submitted
  const assignSubs = this.pointsHistory.filter(p => p.action === 'assignment_submit');
  if (assignSubs.length >= 5 && !hasBadge('assignment_ace')) {
    this.badges.push({ badgeId: 'assignment_ace', title: 'Assignment Ace', description: 'Submitted 5 assignments', icon: '📝' });
  }
  
  // 10 videos watched
  const vids = this.pointsHistory.filter(p => p.action === 'video_watched');
  if (vids.length >= 10 && !hasBadge('fast_learner')) {
    this.badges.push({ badgeId: 'fast_learner', title: 'Fast Learner', description: 'Watched 10 videos', icon: '⚡' });
  }
  
  // Points milestones
  if (this.totalPoints >= 500 && !hasBadge('500_club')) {
    this.badges.push({ badgeId: '500_club', title: '500 Club', description: 'Earned 500 points', icon: '⭐' });
  }
  if (this.totalPoints >= 1000 && !hasBadge('1000_club')) {
    this.badges.push({ badgeId: '1000_club', title: 'Elite Learner', description: 'Earned 1000 points', icon: '💎' });
  }
  
  return this;
};

// Update streak
gamificationSchema.methods.updateStreak = function() {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = this.lastActiveDate ? new Date(this.lastActiveDate).toISOString().split('T')[0] : null;
  
  if (lastDate === today) return this; // Already active today
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastDate === yesterday) {
    this.currentStreak += 1;
  } else {
    this.currentStreak = 1;
  }
  
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  
  this.lastActiveDate = new Date();
  
  // Update weekly activity
  const existing = this.weeklyActivity.find(w => w.date === today);
  if (!existing) {
    this.weeklyActivity.push({ date: today, points: 0 });
    // Keep only last 7 days
    if (this.weeklyActivity.length > 7) {
      this.weeklyActivity = this.weeklyActivity.slice(-7);
    }
  }
  
  return this;
};

module.exports = mongoose.model('Gamification', gamificationSchema);
