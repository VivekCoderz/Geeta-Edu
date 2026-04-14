const express = require('express');
const router = express.Router();
const { getLeaderboard, awardPoints } = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

router.get('/leaderboard', protect, getLeaderboard);
router.post('/award', protect, awardPoints);

module.exports = router;
