import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { extractKeywords, analyzeImportance } from './textExtraction';

// List of question templates for different types of content
const questionTemplates = {
  definition: [
    "What is {term}?",
    "Define {term}.",
    "Explain the concept of {term}.",
  ],
  process: [
    "What are the steps involved in {term}?",
    "How does {term} work?",
    "Describe the process of {term}.",
  ],
  comparison: [
    "What is the difference between {term1} and {term2}?",
    "Compare and contrast {term1} and {term2}.",
    "How are {term1} and {term2} related?",
  ],
  application: [
    "How is {term} applied in real-world scenarios?",
    "Give an example of {term} in practice.",
    "What are the practical applications of {term}?",
  ],
};

// Types of flashcards we can generate
const flashcardTypes = {
  TERM_DEFINITION: 'term-definition',
  CONCEPT_EXAMPLE: 'concept-example',
  PROCESS_STEPS: 'process-steps',
  KEY_POINTS: 'key-points',
};

export class LearningMaterialGenerator {
  constructor() {
    this.auth = getAuth();
    this.db = getFirestore();
  }

  async generateFromSummary(summary, documentId) {
    try {
      // Extract important keywords and concepts
      const keywords = await extractKeywords(summary);
      
      // Analyze the importance and context of each keyword
      const analyzedKeywords = keywords.map(keyword => ({
        ...keyword,
        importance: analyzeImportance(keyword, summary)
      })).filter(k => k.importance > 0.5); // Only keep relevant keywords

      // Generate questions and flashcards
      const questions = await this.generateQuestions(summary, analyzedKeywords);
      const flashcards = await this.generateFlashcards(summary, analyzedKeywords);

      // Store the generated content
      await this.saveLearningMaterials(documentId, questions, flashcards);

      return {
        questions,
        flashcards
      };
    } catch (error) {
      console.error('Error generating learning materials:', error);
      throw error;
    }
  }

  async generateQuestions(summary, keywords) {
    const questions = [];
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim());
    
    for (const keyword of keywords) {
      const relevantSentences = sentences.filter(s => 
        s.toLowerCase().includes(keyword.term.toLowerCase())
      );

      if (relevantSentences.length === 0) continue;

      // Determine the type of question to generate based on the context
      const questionType = this.determineQuestionType(keyword, relevantSentences);
      const templates = questionTemplates[questionType];
      
      if (templates) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        const question = {
          type: questionType,
          question: template.replace('{term}', keyword.term),
          correctAnswer: this.extractAnswer(keyword, relevantSentences),
          relatedContent: relevantSentences.join(' '),
          difficulty: this.calculateDifficulty(keyword, summary),
        };
        
        questions.push(question);
      }
    }

    return questions.slice(0, 10); // Limit to 10 most relevant questions
  }

  async generateFlashcards(summary, keywords) {
    const flashcards = [];
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim());

    for (const keyword of keywords) {
      const relevantSentences = sentences.filter(s => 
        s.toLowerCase().includes(keyword.term.toLowerCase())
      );

      if (relevantSentences.length === 0) continue;

      // Create different types of flashcards based on the content
      const flashcardType = this.determineFlashcardType(keyword, relevantSentences);
      
      switch (flashcardType) {
        case flashcardTypes.TERM_DEFINITION:
          flashcards.push({
            front: keyword.term,
            back: this.extractDefinition(keyword, relevantSentences),
            type: flashcardType,
          });
          break;

        case flashcardTypes.CONCEPT_EXAMPLE:
          flashcards.push({
            front: `Give an example of ${keyword.term}`,
            back: this.extractExample(keyword, relevantSentences),
            type: flashcardType,
          });
          break;

        case flashcardTypes.PROCESS_STEPS:
          const steps = this.extractProcessSteps(keyword, sentences);
          if (steps.length > 0) {
            flashcards.push({
              front: `Steps in ${keyword.term}`,
              back: steps.join('\n'),
              type: flashcardType,
            });
          }
          break;

        case flashcardTypes.KEY_POINTS:
          flashcards.push({
            front: `Key points about ${keyword.term}`,
            back: this.extractKeyPoints(keyword, relevantSentences),
            type: flashcardType,
          });
          break;
      }
    }

    return flashcards.slice(0, 15); // Limit to 15 most relevant flashcards
  }

  determineQuestionType(keyword, sentences) {
    const text = sentences.join(' ').toLowerCase();
    if (text.includes('process') || text.includes('steps') || text.includes('method')) {
      return 'process';
    }
    if (text.includes('versus') || text.includes('compared to') || text.includes('while') || text.includes('whereas')) {
      return 'comparison';
    }
    if (text.includes('used in') || text.includes('applied to') || text.includes('example')) {
      return 'application';
    }
    return 'definition';
  }

  determineFlashcardType(keyword, sentences) {
    const text = sentences.join(' ').toLowerCase();
    if (text.includes('process') || text.includes('steps')) {
      return flashcardTypes.PROCESS_STEPS;
    }
    if (text.includes('example') || text.includes('such as')) {
      return flashcardTypes.CONCEPT_EXAMPLE;
    }
    if (sentences.length > 2) {
      return flashcardTypes.KEY_POINTS;
    }
    return flashcardTypes.TERM_DEFINITION;
  }

  extractAnswer(keyword, sentences) {
    // Find the most relevant sentence for the answer
    const relevantSentence = sentences.find(s => 
      s.toLowerCase().includes(keyword.term.toLowerCase())
    ) || sentences[0];

    // Clean up the sentence to make it a proper answer
    return relevantSentence
      .trim()
      .replace(/^[,\s]+/, '')
      .replace(/[,\s]+$/, '')
      + '.';
  }

  extractDefinition(keyword, sentences) {
    return this.extractAnswer(keyword, sentences);
  }

  extractExample(keyword, sentences) {
    const exampleSentence = sentences.find(s => 
      s.toLowerCase().includes('example') || 
      s.toLowerCase().includes('such as') ||
      s.toLowerCase().includes('like')
    );
    return exampleSentence || sentences[0];
  }

  extractProcessSteps(keyword, sentences) {
    const steps = sentences
      .filter(s => s.includes('1') || s.includes('first') || s.includes('then') || 
                   s.includes('next') || s.includes('finally'))
      .map(s => s.trim());
    return steps;
  }

  extractKeyPoints(keyword, sentences) {
    return sentences
      .map(s => '• ' + s.trim())
      .join('\n');
  }

  calculateDifficulty(keyword, summary) {
    const frequency = (summary.match(new RegExp(keyword.term, 'gi')) || []).length;
    const complexity = keyword.term.split(' ').length;
    return Math.min(1, (frequency * complexity) / 20); // Scale from 0 to 1
  }

  async saveLearningMaterials(documentId, questions, flashcards) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Save questions
      await addDoc(collection(this.db, 'learningMaterials'), {
        userId,
        documentId,
        type: 'questions',
        content: questions,
        createdAt: new Date(),
      });

      // Save flashcards
      await addDoc(collection(this.db, 'learningMaterials'), {
        userId,
        documentId,
        type: 'flashcards',
        content: flashcards,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving learning materials:', error);
      throw error;
    }
  }

  async getLearningMaterials(documentId) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const q = query(
        collection(this.db, 'learningMaterials'),
        where('userId', '==', userId),
        where('documentId', '==', documentId)
      );

      const querySnapshot = await getDocs(q);
      const materials = {
        questions: [],
        flashcards: []
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'questions') {
          materials.questions = data.content;
        } else if (data.type === 'flashcards') {
          materials.flashcards = data.content;
        }
      });

      return materials;
    } catch (error) {
      console.error('Error getting learning materials:', error);
      throw error;
    }
  }
}
