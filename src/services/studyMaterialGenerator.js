// Service to generate quiz questions and flashcards from document text using Gemini AI
import aiService from "./aiService";

class StudyMaterialGenerator {
  async generateQuestions(documentText) {
    if (!documentText || documentText.length < 50) return [];

    const prompt = `You are an expert teacher. Generate exactly 10 high-quality, challenging multiple-choice questions based on the following text. 
Ensure plausible distractors and deep conceptual understanding. Do NOT base questions on trivial details.
Return carefully formatted JSON ONLY. The JSON must be an array of objects matching this exact structure:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Correct Option", "Distractor 1", "Distractor 2", "Distractor 3"],
    "correctAnswer": 0,
    "difficulty": "Medium",
    "explanation": "Detailed explanation of why the answer is correct."
  }
]
Note: Ensure correctAnswer is the integer index of the correct option (0, 1, 2, or 3). Shuffle the correct option randomly! 

=== SOURCE TEXT ===
${documentText.substring(0, 500000)}
`;

    try {
      console.log("🤖 Generating Quiz via Gemini [Primary]...");
      
      const config = {
        responseMimeType: "application/json",
        temperature: 0.7,
      };
      
      const primaryModel = aiService.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: config,
      });
      const fallbackModel = aiService.genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: config,
      });

      let text = "";
      try {
        const response = await primaryModel.generateContent(prompt);
        text = response.response.text();
      } catch (err) {
        const isQuotaError = 
          err?.status === 429 || 
          err?.message?.toLowerCase().includes("quota") || 
          err?.message?.toLowerCase().includes("rate limit") ||
          err?.message?.toLowerCase().includes("exhausted");
        
        if (isQuotaError) {
          console.warn("⚠️ Primary Gemini model quota exceeded for Quiz! Switching to Flash-Lite backup...");
          const fallbackResponse = await fallbackModel.generateContent(prompt);
          text = fallbackResponse.response.text();
        } else {
          throw err;
        }
      }

      let questions = [];

      try {
        // Find the first '[' and last ']' to extract purely the JSON array
        const startIdx = text.indexOf("[");
        const endIdx = text.lastIndexOf("]");

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          let jsonStr = text.substring(startIdx, endIdx + 1);
          // Quick fix for trailing commas before closing brackets
          jsonStr = jsonStr.replace(/,\s*]/g, "]");
          jsonStr = jsonStr.replace(/,\s*}/g, "}");
          questions = JSON.parse(jsonStr);
        } else {
          throw new Error("Could not find array brackets");
        }
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        console.log("Raw Gemini Response:", text);
      }

      if (!Array.isArray(questions) || questions.length === 0)
        throw new Error("Parsed result is not a valid array of questions");

      return questions.map((q, i) => ({
        id: i + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty || "Medium",
        explanation: q.explanation || "",
      }));
    } catch (e) {
      console.error("Quiz generation failed:", e);
      return [];
    }
  }

  async generateFlashcards(documentText) {
    if (!documentText || documentText.length < 50) return [];

    const prompt = `You are an expert tutor. Create exactly 10 essential flashcards covering the most core concepts, terms, and processes from the following text.
Return carefully formatted JSON ONLY. The JSON must be an array of objects matching this exact structure:
[
  {
    "id": 1,
    "front": "Concept name or Question",
    "back": "Detailed but concise answer or definition",
    "category": "Main Ideas",
    "difficulty": "Medium"
  }
]

=== SOURCE TEXT ===
${documentText.substring(0, 500000)}
`;

    try {
      console.log("🤖 Generating Flashcards via Gemini [Primary]...");
      
      const config = {
        responseMimeType: "application/json",
        temperature: 0.7,
      };
      
      const primaryModel = aiService.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: config,
      });
      const fallbackModel = aiService.genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: config,
      });

      let text = "";
      try {
        const response = await primaryModel.generateContent(prompt);
        text = response.response.text();
      } catch (err) {
        const isQuotaError = 
          err?.status === 429 || 
          err?.message?.toLowerCase().includes("quota") || 
          err?.message?.toLowerCase().includes("rate limit") ||
          err?.message?.toLowerCase().includes("exhausted");
        
        if (isQuotaError) {
          console.warn("⚠️ Primary Gemini model quota exceeded for Flashcards! Switching to Flash-Lite backup...");
          const fallbackResponse = await fallbackModel.generateContent(prompt);
          text = fallbackResponse.response.text();
        } else {
          throw err;
        }
      }

      let flashcards = [];

      try {
        const startIdx = text.indexOf("[");
        const endIdx = text.lastIndexOf("]");

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          let jsonStr = text.substring(startIdx, endIdx + 1);
          // Quick fix for trailing commas before closing brackets
          jsonStr = jsonStr.replace(/,\s*]/g, "]");
          jsonStr = jsonStr.replace(/,\s*}/g, "}");
          flashcards = JSON.parse(jsonStr);
        } else {
          throw new Error("Could not find array brackets");
        }
      } catch (parseError) {
        console.error("Flashcard JSON parsing error:", parseError);
        console.log("Raw Gemini Response:", text);
      }

      if (!Array.isArray(flashcards) || flashcards.length === 0)
        throw new Error("Parsed result is not a valid array of flashcards");

      return flashcards.map((f, i) => ({
        id: i + 1,
        front: f.front,
        back: f.back,
        category: f.category || "Concepts",
        difficulty: f.difficulty || "Medium",
      }));
    } catch (e) {
      console.error("Flashcard generation failed:", e);
      return [];
    }
  }

  async generateStudyMaterials(documentText) {
    if (!documentText || documentText.length < 50) {
      throw new Error("Document text is too short to generate materials.");
    }

    try {
      const [questions, flashcards] = await Promise.all([
        this.generateQuestions(documentText),
        this.generateFlashcards(documentText),
      ]);

      return {
        questions: questions || [],
        flashcards: flashcards || [],
        isGenerated: true,
      };
    } catch (err) {
      console.error("Failed to generate complete materials:", err);
      return {
        questions: [],
        flashcards: [],
        isGenerated: false,
      };
    }
  }
}

export default new StudyMaterialGenerator();
