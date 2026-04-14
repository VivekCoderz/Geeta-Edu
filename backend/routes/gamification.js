const express = require('express');
const { getMyPoints, getLeaderboard } = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/me', getMyPoints);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
