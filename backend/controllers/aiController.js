const aiService = require('../services/aiService');

// @desc    Start simple interview session
// @route   POST /api/ai/interview/start
// @access  Private
exports.startInterview = async (req, res) => {
  try {
    const { role, difficulty } = req.body;
    
    // Generate first question
    const question = await aiService.generateQuestion(role, difficulty || 'Junior');
    
    res.json({
      success: true,
      data: {
        message: `Hello! I am your AI Interviewer. Let's start the ${difficulty} ${role} interview.`,
        question: question
      }
    });
  } catch (error) {
    console.error("AI Start Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process user message
// @route   POST /api/ai/interview/chat
// @access  Private
exports.chat = async (req, res) => {
  try {
    const { role, question, answer } = req.body;
    const data = await aiService.evaluateAndNext(role, question, answer);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.endInterview = async (req, res) => {
  try {
    const { role, history } = req.body;
    const report = await aiService.generateFeedbackReport(role, history.length, history);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Report Generation Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report." });
  }
};

// ─────────────────────────────────────────────────────────────
// AI TUTOR ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @desc    Generate a lesson plan for a topic
// @route   POST /api/ai/tutor/lesson-plan
// @access  Private
exports.getTutorLessonPlan = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic is required.' });
    }
    const plan = await aiService.generateLessonPlan(topic.trim());
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Tutor Lesson Plan Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Teach one section of a lesson
// @route   POST /api/ai/tutor/teach
// @access  Private
exports.tutorTeachSection = async (req, res) => {
  try {
    const { topic, sectionTitle, sectionIndex, totalSections } = req.body;
    if (!topic || !sectionTitle) {
      return res.status(400).json({ success: false, message: 'topic and sectionTitle are required.' });
    }
    const data = await aiService.teachSection(topic, sectionTitle, sectionIndex || 0, totalSections || 3);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Tutor Teach Section Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Answer a follow-up question from the student
// @route   POST /api/ai/tutor/followup
// @access  Private
exports.tutorFollowup = async (req, res) => {
  try {
    const { topic, question } = req.body;
    if (!topic || !question) {
      return res.status(400).json({ success: false, message: 'topic and question are required.' });
    }
    const data = await aiService.answerFollowup(topic, question);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Tutor Followup Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a mini quiz for the completed lesson
// @route   POST /api/ai/tutor/quiz
// @access  Private
exports.tutorGenerateQuiz = async (req, res) => {
  try {
    const { topic, sections } = req.body;
    if (!topic) {
      return res.status(400).json({ success: false, message: 'topic is required.' });
    }
    const data = await aiService.generateQuiz(topic, sections || []);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Tutor Quiz Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────
// TRANSLATION ENDPOINT
// ─────────────────────────────────────────────────────────────

// @desc    Translate text to target language
// @route   POST /api/ai/translate
// @access  Private
exports.translateContent = async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ success: false, message: 'text and targetLang are required.' });
    }
    const translated = await aiService.translateText(text, targetLang);
    res.json({ success: true, data: { translated, targetLang } });
  } catch (error) {
    console.error('Translation Error:', error);
=======
// @desc    Translate text
// @route   POST /api/ai/tutor/translate
// @access  Private
exports.tutorTranslate = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ success: false, message: 'text and targetLanguage are required.' });
    }
    const translatedText = await aiService.translateText(text, targetLanguage);
    res.json({ success: true, data: { translatedText } });
  } catch (error) {
    console.error('Tutor Translate Error:', error);
>>>>>>> f71efa3a210e045657c37b6faeabc30f96cb0598
    res.status(500).json({ success: false, message: error.message });
  }
};

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────
// LECTURE SUMMARY ENDPOINT
// ─────────────────────────────────────────────────────────────

// @desc    Generate AI summary for a lecture/video
// @route   POST /api/ai/summarize
// @access  Private
exports.summarizeContent = async (req, res) => {
  try {
    const { title, description, targetLang } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }
    const data = await aiService.generateSummary(title, description || '', targetLang || 'en');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Summary Error:', error);
=======
// @desc    Summarize lecture
// @route   POST /api/ai/tutor/summarize
// @access  Private
exports.tutorSummarize = async (req, res) => {
  try {
    const { content, language, level } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'content is required.' });
    }
    const data = await aiService.summarizeLecture(content, language || 'English', level || 'Beginner');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Tutor Summarize Error:', error);
>>>>>>> f71efa3a210e045657c37b6faeabc30f96cb0598
    res.status(500).json({ success: false, message: error.message });
  }
};
