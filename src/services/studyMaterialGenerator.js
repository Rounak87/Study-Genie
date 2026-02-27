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
${documentText.substring(0, 30000)}
`;

    try {
      console.log("🤖 Generating Quiz via Gemini...");
      const response = await aiService.model.generateContent(prompt);
      const text = response.response.text();

      let questions = [];

      try {
        // Try direct parsing first
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        questions = JSON.parse(cleaned);

        // If it's wrapped in an object like { "questions": [...] }
        if (!Array.isArray(questions) && typeof questions === "object") {
          const possibleArray = Object.values(questions).find((val) =>
            Array.isArray(val),
          );
          if (possibleArray) questions = possibleArray;
        }
      } catch (parseErr) {
        // Fallback: extract array using regex
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch)
          throw new Error("Could not find JSON array in response");
        questions = JSON.parse(jsonMatch[0]);
      }

      if (!Array.isArray(questions))
        throw new Error("Parsed result is not an array");

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
${documentText.substring(0, 30000)}
`;

    try {
      console.log("🤖 Generating Flashcards via Gemini...");
      const response = await aiService.model.generateContent(prompt);
      const text = response.response.text();

      let flashcards = [];

      try {
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        flashcards = JSON.parse(cleaned);

        if (!Array.isArray(flashcards) && typeof flashcards === "object") {
          const possibleArray = Object.values(flashcards).find((val) =>
            Array.isArray(val),
          );
          if (possibleArray) flashcards = possibleArray;
        }
      } catch (parseErr) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch)
          throw new Error("Could not find JSON array in response");
        flashcards = JSON.parse(jsonMatch[0]);
      }

      if (!Array.isArray(flashcards))
        throw new Error("Parsed result is not an array");

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
