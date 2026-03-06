import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testQuota() {
  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemma-2-9b-it", // not generative ai, wait, gemma-3-12b-it is in list!
  ];

  for (const modelName of modelsToTest) {
    console.log(`Testing ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      const text = await result.response.text();
      console.log(`✅ ${modelName} works. Output: ${text.substring(0, 20)}`);
    } catch (e) {
      console.log(`❌ ${modelName} failed: ${e.message.split("\n")[0]}`);
    }
  }
}

testQuota();
