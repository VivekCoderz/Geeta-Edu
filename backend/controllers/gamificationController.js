const Gamification = require('../models/Gamification');
const User = require('../models/User');

// ── Helper: Award Points (called internally by other controllers) ──
const awardPoints = async (studentId, action, points, description = '', reference = null, referenceModel = null) => {
  try {
    let record = await Gamification.findOne({ student: studentId });
    
    if (!record) {
      record = await Gamification.create({ student: studentId });
    }
    
    // Add to history
    record.pointsHistory.push({
      action,
      points,
      description,
      reference,
      referenceModel
    });
    
    record.totalPoints += points;
    
    // Update today's weekly activity
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = record.weeklyActivity.find(w => w.date === today);
    if (todayEntry) {
      todayEntry.points += points;
    } else {
      record.weeklyActivity.push({ date: today, points });
      if (record.weeklyActivity.length > 7) {
        record.weeklyActivity = record.weeklyActivity.slice(-7);
      }
    }
    
    // Update streak, level, badges
    record.updateStreak();
    record.recalculateLevel();
    record.checkBadges();
    record.updatedAt = Date.now();
    
    await record.save();
    
    console.log(`🏆 Awarded ${points} pts to ${studentId} for ${action}`);
    return record;
  } catch (err) {
    console.error('Award Points Error:', err.message);
    return null;
  }
};

// ── GET /api/gamification/me ──
const getMyPoints = async (req, res) => {
  try {
    let record = await Gamification.findOne({ student: req.user.id });
    
    if (!record) {
      record = await Gamification.create({ student: req.user.id });
    }
    
    // Recalculate on fetch
    record.updateStreak();
    record.recalculateLevel();
    record.checkBadges();
    await record.save();
    
    res.json({
      success: true,
      data: {
        totalPoints: record.totalPoints,
        level: record.level,
        levelTitle: record.levelTitle,
        badges: record.badges,
        currentStreak: record.currentStreak,
        longestStreak: record.longestStreak,
        weeklyActivity: record.weeklyActivity,
        recentHistory: record.pointsHistory.slice(-10).reverse()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/gamification/leaderboard ──
const getLeaderboard = async (req, res) => {
  try {
    const records = await Gamification.find()
      .sort({ totalPoints: -1 })
      .limit(20)
      .populate('student', 'name email profileImage');
    
    const leaderboard = records.map((r, index) => ({
      rank: index + 1,
      student: r.student,
      totalPoints: r.totalPoints,
      level: r.level,
      levelTitle: r.levelTitle,
      badges: r.badges.length,
      currentStreak: r.currentStreak
    }));
    
    // Find current user's rank
    let myRank = null;
    if (req.user) {
      const allSorted = await Gamification.find().sort({ totalPoints: -1 }).select('student totalPoints');
      const idx = allSorted.findIndex(r => r.student.toString() === req.user.id);
      if (idx !== -1) {
        myRank = {
          rank: idx + 1,
          totalPoints: allSorted[idx].totalPoints,
          totalParticipants: allSorted.length
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        leaderboard,
        myRank
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  awardPoints,
  getMyPoints,
  getLeaderboard
};
