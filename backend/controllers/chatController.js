const Message = require('../models/Message');

// @desc    Get messages for a specific room (batch)
// @route   GET /api/chat/:room
// @access  Private (Valid Token)
exports.getMessages = async (req, res) => {
  try {
    const { room } = req.params;
    
    // Fetch the latest 50 messages, then put them back in time order (oldest first).
    // Sorting ascending before limit() returned the *first* 50 messages ever, so once a
    // room had more than 50, new messages never showed up after a reload.
    const messages = (await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name profileImage')) // Populate sender details
      .reverse();

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching messages'
    });
  }
};
