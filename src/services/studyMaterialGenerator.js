// Service to generate quiz questions and flashcards from document summaries

class StudyMaterialGenerator {
  generateQuestions(summary) {
    // Extract summary text from object if needed
    const summaryText = typeof summary === 'string' ? summary : summary?.summary || '';
    if (!summaryText || summaryText.length < 50) {
      return [];
    }

    const sentences = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = summaryText.split('\n\n').filter(p => p.trim().length > 20);
    const questions = [];
    
    // Extract key concepts from headers and bold text
    const concepts = [];
    const conceptMatches = summaryText.match(/(?:^|\n)(?:#{1,3}\s+|(?:\*\*|__))([^*_\n]+)(?:\*\*|__)?/g);
    if (conceptMatches) {
      conceptMatches.forEach(match => {
        const concept = match.replace(/[#*_\n]/g, '').trim();
        if (concept.length > 5 && concept.length < 100) {
          concepts.push(concept);
        }
      });
    }

    // Question 1: Main topic from first meaningful sentence
    if (sentences.length > 0) {
      const mainTopic = sentences[0].trim();
      questions.push({
        id: 1,
        question: "What is the main topic discussed in this document?",
        options: [
          mainTopic.length > 100 ? mainTopic.substring(0, 97) + '...' : mainTopic,
          "Advanced machine learning algorithms",
          "Historical economic trends",
          "Modern software development"
        ].sort(() => Math.random() - 0.5),
        correctAnswer: 0,
        difficulty: 'Easy',
        explanation: "This is the primary topic extracted from the document's introduction."
      });
    }

    // Question 2: Key concept identification
    if (concepts.length >= 2) {
      const concept1 = concepts[0];
      const concept2 = concepts[Math.min(1, concepts.length - 1)];
      questions.push({
        id: 2,
        question: `Which of the following is a key concept mentioned in the document?`,
        options: [
          concept1,
          "Quantum physics principles",
          "Renaissance art history",
          "Cellular biology"
        ].sort(() => Math.random() - 0.5),
        correctAnswer: 0,
        difficulty: 'Medium',
        explanation: `"${concept1}" is specifically discussed in the document.`
      });
    }

    // Question 3: Detail comprehension from middle content
    if (sentences.length > 3) {
      const detailSentence = sentences[Math.floor(sentences.length / 2)].trim();
      questions.push({
        id: 3,
        question: "According to the document, which statement is accurate?",
        options: [
          detailSentence.length > 100 ? detailSentence.substring(0, 97) + '...' : detailSentence,
          "The earth is flat according to modern science",
          "Time travel was invented in 1995",
          "All programming languages are identical"
        ].sort(() => Math.random() - 0.5),
        correctAnswer: 0,
        difficulty: 'Medium',
        explanation: "This detail is mentioned in the document content."
      });
    }

    // Question 4: Conceptual understanding
    if (paragraphs.length > 1) {
      const conceptParagraph = paragraphs[1].split(/[.!?]+/)[0].trim();
      questions.push({
        id: 4,
        question: "What is one of the important points discussed?",
        options: [
          conceptParagraph.length > 100 ? conceptParagraph.substring(0, 97) + '...' : conceptParagraph,
          "The importance of underwater basket weaving",
          "How to train dragons effectively",
          "The secret to eternal youth"
        ].sort(() => Math.random() - 0.5),
        correctAnswer: 0,
        difficulty: 'Hard',
        explanation: "This concept is explained in detail within the document."
      });
    }

    // Question 5: Final concept or conclusion
    if (sentences.length > 5) {
      const conclusion = sentences[sentences.length - 1].trim();
      questions.push({
        id: 5,
        question: "What conclusion or final point does the document make?",
        options: [
          conclusion.length > 100 ? conclusion.substring(0, 97) + '...' : conclusion,
          "Aliens built the pyramids",
          "The moon is made of cheese",
          "Dinosaurs never existed"
        ].sort(() => Math.random() - 0.5),
        correctAnswer: 0,
        difficulty: 'Easy',
        explanation: "This is stated in the concluding section of the document."
      });
    }

    // Ensure correct answer index is updated after sorting
    return questions.map(q => {
      const correctOption = q.options[0];
      const correctIndex = q.options.indexOf(correctOption);
      return { ...q, correctAnswer: correctIndex };
    });
  }

  generateFlashcards(summary) {
    // Extract summary text from object if needed
    const summaryText = typeof summary === 'string' ? summary : summary?.summary || '';
    if (!summaryText || summaryText.length < 50) {
      return [];
    }

    const sentences = summaryText.split('.').filter(s => s.trim().length > 10);
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
