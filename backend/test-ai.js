require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-pro-vision"];
  for(const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello!");
      console.log("SUCCESS on:", modelName);
      break;
    } catch (e) {
      console.log("FAILED on:", modelName, e.message);
    }
  }
}
run();
