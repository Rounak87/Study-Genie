import { openDB } from "idb";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

class DocumentStorageService {
  constructor() {
    this.dbName = "StudyGenieDocuments";
    this.dbVersion = 2; // Incremented for new store
    this.db = null;
  }

  // Initialize IndexedDB
  async initDB() {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create documents store
        if (!db.objectStoreNames.contains("documents")) {
          const documentsStore = db.createObjectStore("documents", {
            keyPath: "id",
            autoIncrement: false,
          });
          documentsStore.createIndex("name", "name");
          documentsStore.createIndex("uploadDate", "uploadDate");
          documentsStore.createIndex("type", "type");
        }

        // Create text content store (separate for performance)
        if (!db.objectStoreNames.contains("textContent")) {
          db.createObjectStore("textContent", {
            keyPath: "documentId",
          });
        }

        // Create embeddings store
        if (!db.objectStoreNames.contains("embeddings")) {
          const embeddingsStore = db.createObjectStore("embeddings", {
            keyPath: "id",
            autoIncrement: true,
          });
          embeddingsStore.createIndex("documentId", "documentId");
        }
      },
    });

    return this.db;
  }

  // Generate unique ID for document
  generateDocumentId() {
    return (
      Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Extract text from PDF using PDF.js
  async extractPDFText(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let extractedText = "";
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        extractedText += pageText + "\n";
      }

      return {
        text: extractedText.trim(),
        pageCount: totalPages,
        hasText: extractedText.trim().length > 100, // Consider significant if >100 chars
      };
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      return {
        text: "",
        pageCount: 0,
        hasText: false,
      };
    }
  }

  // Convert PDF pages to images for OCR
  async convertPDFToImages(file, maxPages = 5) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const images = [];
      const totalPages = Math.min(pdf.numPages, maxPages); // Limit pages for performance

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        images.push(canvas.toDataURL("image/png"));
      }

      return images;
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      return [];
    }
  }

  // Run OCR on images using Tesseract.js
  async runOCR(images, onProgress = null) {
    try {
      const worker = await Tesseract.createWorker("eng");
      let ocrText = "";

      for (let i = 0; i < images.length; i++) {
        if (onProgress) {
          onProgress({
            page: i + 1,
            total: images.length,
            progress: Math.round((i / images.length) * 100),
          });
        }

        const {
          data: { text },
        } = await worker.recognize(images[i]);
        ocrText += text + "\n";
      }

      await worker.terminate();

      return {
        text: ocrText.trim(),
        pagesProcessed: images.length,
      };
    } catch (error) {
      console.error("Error running OCR:", error);
      return {
        text: "",
        pagesProcessed: 0,
      };
    }
  }

  // Main function to process and store document
  async processAndStoreDocument(file, onProgress = null) {
    try {
      await this.initDB();

      const documentId = this.generateDocumentId();
      const startTime = Date.now();

      // Update progress
      if (onProgress) onProgress({ stage: "starting", progress: 0 });

      // Step 1: Extract existing text from PDF
      if (onProgress) onProgress({ stage: "extracting_text", progress: 20 });
      const textExtraction = await this.extractPDFText(file);

      // Step 2: Convert to images for OCR (if needed)
      const needsOCR =
        !textExtraction.hasText || textExtraction.text.length < 500;
      let ocrResult = { text: "", pagesProcessed: 0 };

      if (needsOCR) {
        if (onProgress)
          onProgress({ stage: "converting_to_images", progress: 40 });
        const images = await this.convertPDFToImages(file);

        if (images.length > 0) {
          if (onProgress) onProgress({ stage: "running_ocr", progress: 60 });
          ocrResult = await this.runOCR(images, (ocrProgress) => {
            if (onProgress) {
              onProgress({
                stage: "running_ocr",
                progress: 60 + ocrProgress.progress * 0.3, // 60-90%
                ocrDetails: ocrProgress,
              });
            }
          });
        }
      }

      // Step 3: Combine texts
      const combinedText = (textExtraction.text + "\n" + ocrResult.text).trim();

      // Step 4: Store document metadata
      if (onProgress) onProgress({ stage: "saving", progress: 95 });

      const documentData = {
        id: documentId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        pageCount: textExtraction.pageCount,
        hasOriginalText: textExtraction.hasText,
        hasOCRText: ocrResult.text.length > 0,
        ocrPagesProcessed: ocrResult.pagesProcessed,
        textLength: combinedText.length,
        file: await this.fileToBase64(file), // Store file as base64
      };

      const textData = {
        documentId: documentId,
        extractedText: textExtraction.text,
        ocrText: ocrResult.text,
        combinedText: combinedText,
        lastAccessed: new Date().toISOString(),
      };

      // Step 5: Generate and Store Embeddings
      if (onProgress) onProgress({ stage: "embedding", progress: 98 });
      // We wrap this in a try/catch so setting up RAG doesn't break standard document upload if API fails
      try {
        await this.generateAndStoreEmbeddings(documentId, combinedText);
      } catch (embError) {
        console.error(
          "Failed to generate embeddings, continuing without RAG for this document:",
          embError,
        );
      }

      await this.db.put("documents", documentData);
      await this.db.put("textContent", textData);

      if (onProgress) onProgress({ stage: "completed", progress: 100 });

      return {
        success: true,
        documentId: documentId,
        document: documentData,
        textContent: textData,
      };
    } catch (error) {
      console.error("Error processing document:", error);
      if (onProgress)
        onProgress({ stage: "error", progress: 0, error: error.message });
      throw error;
    }
  }

  // --- RAG Specific Methods ---

  async generateAndStoreEmbeddings(documentId, text) {
    if (!text || text.trim().length === 0) return;

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn("No Gemini API key found, skipping embeddings generation.");
      return;
    }

    await this.initDB();

    // 1. Chunk the text
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // We create Document objects that langchain expects
    const docs = await textSplitter.createDocuments([text], [{ documentId }]);

    if (docs.length === 0) return;

    // 2. Initialize Embedder
    const embedder = new GoogleGenerativeAIEmbeddings({
      apiKey: geminiKey,
      modelName: "text-embedding-004", // Latest Google embedding model
    });

    // 3. Generate Vectors
    const textsToEmbed = docs.map((doc) => doc.pageContent);
    const vectors = await embedder.embedDocuments(textsToEmbed);

    // 4. Store in IndexedDB
    const tx = this.db.transaction("embeddings", "readwrite");
    for (let i = 0; i < docs.length; i++) {
      await tx.store.add({
        documentId: documentId,
        text: docs[i].pageContent,
        vector: vectors[i],
        chunkIndex: i,
      });
    }
    await tx.done;
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Search for relevant chunks given a question
  async searchSimilarChunks(question, documentId, topK = 4) {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) return [];

    await this.initDB();

    // 1. Embed the question
    const embedder = new GoogleGenerativeAIEmbeddings({
      apiKey: geminiKey,
      modelName: "text-embedding-004",
    });
    const questionVector = await embedder.embedQuery(question);

    // 2. Retrieve all chunks for this document
    const tx = this.db.transaction("embeddings", "readonly");
    const index = tx.store.index("documentId");
    const allChunks = await index.getAll(documentId);

    if (!allChunks || allChunks.length === 0) return [];

    // 3. Calculate similarity scores
    const scoredChunks = allChunks.map((chunk) => ({
      ...chunk,
      score: this.cosineSimilarity(questionVector, chunk.vector),
    }));

    // 4. Sort by highest score first and return topK
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  }

  // --- End RAG Specific Methods ---

  // Convert file to base64 for storage
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Get all documents
  async getAllDocuments() {
    await this.initDB();
    return await this.db.getAll("documents");
  }

  // Get document by ID
  async getDocument(documentId) {
    await this.initDB();
    return await this.db.get("documents", documentId);
  }

  // Get text content for document
  async getTextContent(documentId) {
    await this.initDB();
    const textContent = await this.db.get("textContent", documentId);

    // Update last accessed
    if (textContent) {
      textContent.lastAccessed = new Date().toISOString();
      await this.db.put("textContent", textContent);
    }

    return textContent;
  }

  // Delete document
  async deleteDocument(documentId) {
    await this.initDB();
    await this.db.delete("documents", documentId);
    await this.db.delete("textContent", documentId);

    // Also delete embeddings for this document
    const tx = this.db.transaction("embeddings", "readwrite");
    const index = tx.store.index("documentId");
    let cursor = await index.openCursor(documentId);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  // Get storage statistics
  async getStorageStats() {
    await this.initDB();
    const documents = await this.getAllDocuments();

    let totalSize = 0;
    let totalTextLength = 0;
    const fileTypes = {};

    for (const doc of documents) {
      totalSize += doc.size || 0;
      totalTextLength += doc.textLength || 0;

      const type = doc.type || "unknown";
      fileTypes[type] = (fileTypes[type] || 0) + 1;
    }

    return {
      totalDocuments: documents.length,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      totalTextLength: totalTextLength,
      fileTypes: fileTypes,
      recentDocuments: documents
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 5),
    };
  }

  // Search documents by text content
  async searchDocuments(searchTerm) {
    await this.initDB();
    const documents = await this.getAllDocuments();
    const results = [];

    for (const doc of documents) {
      const textContent = await this.getTextContent(doc.id);
      if (
        textContent &&
        textContent.combinedText
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        results.push({
          document: doc,
          textContent: textContent,
          relevanceScore: this.calculateRelevanceScore(
            textContent.combinedText,
            searchTerm,
          ),
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // Calculate relevance score for search
  calculateRelevanceScore(text, searchTerm) {
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const matches = (lowerText.match(new RegExp(lowerTerm, "g")) || []).length;
    return (matches / text.length) * 10000; // Normalize score
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorageService();
export default documentStorage;
