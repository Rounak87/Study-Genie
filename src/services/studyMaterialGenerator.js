// Service to generate quiz questions and flashcards from document summaries

class StudyMaterialGenerator {
  generateQuestions(summary) {
    if (!summary || summary.length < 50) {
      return [];
    }

    const sentences = summary.split('.').filter(s => s.trim().length > 10);
    const words = summary.split(' ');
    const questions = [];

    // Question 1: Main topic identification
    if (sentences.length > 0) {
      questions.push({
        id: 1,
        question: "What is the main topic discussed in this document?",
        options: [
          sentences[0].trim() + '...',
          "Unrelated topic about technology",
          "Business management principles",
          "Historical events and dates"
        ],
        correctAnswer: 0,
        difficulty: 'Easy',
        explanation: "This is extracted from the opening statement of the document summary."
      });
    }

    // Question 2: Key concepts
    if (sentences.length > 1) {
      questions.push({
        id: 2,
        question: "Which of the following best describes the key concepts mentioned?",
        options: [
          "Generic concept A",
          sentences[1] ? sentences[1].trim() : "Key concepts from the document",
          "Unrelated concept B",
          "None of the above"
        ],
        correctAnswer: 1,
        difficulty: 'Medium',
        explanation: "This represents the core ideas discussed in the document."
      });
    }

    // Question 3: Details and conclusions
    if (sentences.length > 2) {
      const lastSentence = sentences[sentences.length - 1];
      questions.push({
        id: 3,
        question: "Based on the document, what can you conclude?",
        options: [
          "Conclusion not mentioned",
          "Generic conclusion B",
          lastSentence ? lastSentence.trim() : "The main conclusion from the summary",
          "All of the above"
        ],
        correctAnswer: 2,
        difficulty: 'Hard',
        explanation: "This conclusion is drawn from the overall content analysis."
      });
    }

    // Question 4: True/False question
    if (words.length > 20) {
      const keyPhrase = words.slice(10, 20).join(' ');
      questions.push({
        id: 4,
        question: `True or False: The document mentions "${keyPhrase}"`,
        options: [
          "True",
          "False"
        ],
        correctAnswer: 0,
        difficulty: 'Easy',
        explanation: "This phrase appears in the document summary."
      });
    }

    return questions;
  }

  generateFlashcards(summary) {
    if (!summary || summary.length < 50) {
      return [];
    }

    const sentences = summary.split('.').filter(s => s.trim().length > 10);
    const flashcards = [];

    // Main topic flashcard
    if (sentences.length > 0) {
      flashcards.push({
        id: 1,
        front: "Main Topic",
        back: sentences[0].trim(),
        difficulty: 'Easy',
        category: 'Overview'
      });
    }

    // Key points flashcard
    if (sentences.length > 1) {
      flashcards.push({
        id: 2,
        front: "Key Points",
        back: sentences.slice(0, 3).join('. ') + '.',
        difficulty: 'Medium',
        category: 'Details'
      });
    }

    // Important concept flashcard
    if (sentences.length > 2) {
      flashcards.push({
        id: 3,
        front: "Important Concept",
        back: sentences[Math.floor(sentences.length / 2)].trim(),
        difficulty: 'Medium',
        category: 'Concepts'
      });
    }

    // Summary flashcard
    flashcards.push({
      id: 4,
      front: "Document Summary",
      back: summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
      difficulty: 'Easy',
      category: 'Overview'
    });

    // Additional concept flashcards
    if (sentences.length > 3) {
      for (let i = 3; i < Math.min(sentences.length, 6); i++) {
        flashcards.push({
          id: i + 2,
          front: `Concept ${i - 2}`,
          back: sentences[i].trim(),
          difficulty: i % 2 === 0 ? 'Medium' : 'Easy',
          category: 'Details'
        });
      }
    }

    return flashcards;
  }

  generateStudyMaterials(summary) {
    return {
      questions: this.generateQuestions(summary),
      flashcards: this.generateFlashcards(summary),
      isGenerated: true
    };
  }
}

export default new StudyMaterialGenerator();
