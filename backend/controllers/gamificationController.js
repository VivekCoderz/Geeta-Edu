const User = require('../models/User');

const BADGES = [
  { name: 'First Step', threshold: 10, icon: '🌟', description: 'Earned 10 points' },
  { name: 'Learner', threshold: 50, icon: '📚', description: 'Earned 50 points' },
  { name: 'Scholar', threshold: 100, icon: '🎓', description: 'Earned 100 points' },
  { name: 'Master', threshold: 500, icon: '👑', description: 'Earned 500 points' }
];

exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ role: 'student' })
      .sort({ points: -1 })
      .limit(10)
      .select('name profileImage points badges learningLevel');
    res.json({ success: true, data: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.awardPoints = async (req, res) => {
  try {
    const { pointsToAdd, reason } = req.body;
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.points += pointsToAdd;
    
    // Check for new badges
    let newBadgesEarned = [];
    BADGES.forEach(b => {
      const alreadyHas = user.badges.find(badge => badge.name === b.name);
      if (!alreadyHas && user.points >= b.threshold) {
        user.badges.push({ name: b.name, icon: b.icon, description: b.description });
        newBadgesEarned.push(b);
      }
    });

    await user.save();

    res.json({ 
      success: true, 
      data: {
        points: user.points,
        newBadges: newBadgesEarned
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
