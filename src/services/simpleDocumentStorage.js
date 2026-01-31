import { openDB } from 'idb';
import textExtractor from './textExtraction';

class SimpleDocumentStorage {
  constructor() {
    this.dbName = 'StudyGenieDocuments';
    this.dbVersion = 1;
    this.db = null;
    this.userId = this.getUserId(); // Get or create user ID
  }

  // Get or generate user ID for personalized storage
  getUserId() {
    let userId = localStorage.getItem('studyGenieUserId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('studyGenieUserId', userId);
      console.log('Created new user ID:', userId);
    }
    return userId;
  }

  // Initialize IndexedDB
  async initDB() {
    if (this.db) return this.db;

    try {
      console.log('Initializing IndexedDB...');
      this.db = await openDB(this.dbName, this.dbVersion, {
        upgrade(db) {
          console.log('Upgrading IndexedDB schema...');
          // Create documents store
          if (!db.objectStoreNames.contains('documents')) {
            const documentsStore = db.createObjectStore('documents', {
              keyPath: 'id',
              autoIncrement: false
            });
            documentsStore.createIndex('name', 'name');
            documentsStore.createIndex('uploadDate', 'uploadDate');
            console.log('Documents store created');
          }
        }
      });
      console.log('IndexedDB initialized successfully');
      return this.db;
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
      throw error;
    }
  }

  // Generate unique ID for document
  generateDocumentId() {
    return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Convert file to base64 for storage
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Enhanced file storage with text extraction
  async storeDocument(file, onProgress = null) {
    try {
      await this.initDB();
      
      const documentId = this.generateDocumentId();
      const startTime = Date.now();
      let extractedText = '';
      let textExtractionMethod = 'none';

      if (onProgress) onProgress({ stage: 'Starting upload...', progress: 0 });

      // Convert file to base64
      if (onProgress) onProgress({ stage: 'Converting file...', progress: 20 });
      const fileData = await this.fileToBase64(file);

      // Extract text if supported
      const canExtractText = textExtractor.canExtractText(file);
      console.log('🔍 Text extraction check:', {
        fileName: file.name,
        fileType: file.type,
        canExtractText: canExtractText
      });
      
      if (canExtractText) {
        try {
          console.log('✨ Starting text extraction for:', file.name);
          if (onProgress) onProgress({ stage: 'Extracting text...', progress: 40 });
          
          const textResult = await textExtractor.extractText(file, (textProgress) => {
            // Scale text extraction progress to 40-70% of total progress
            const scaledProgress = 40 + (textProgress.progress * 0.3);
            console.log('📊 Text extraction progress:', textProgress.progress + '%', textProgress.stage);
            if (onProgress) onProgress({ 
              stage: textProgress.stage || 'Extracting text...', 
              progress: Math.round(scaledProgress) 
            });
          });

          if (textResult.success && textResult.text) {
            extractedText = textResult.text;
            textExtractionMethod = textResult.method;
            console.log(`✅ Text extracted using ${textResult.method}, length: ${textResult.text.length}`);
          } else {
            console.log('⚠️ Text extraction returned no text');
          }
        } catch (textError) {
          console.warn('❌ Text extraction failed, but continuing with file storage:', textError.message);
          extractedText = '';
          textExtractionMethod = 'failed';
        }
      } else {
        console.log('❌ File type not supported for text extraction:', file.type);
      }

      // Store document
      if (onProgress) onProgress({ stage: 'Saving to database...', progress: 90 });
      
      const documentData = {
        id: documentId,
        userId: this.userId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        file: fileData,
        textContent: extractedText,
        textExtractionMethod: textExtractionMethod,
        canExtractText: canExtractText,
        hasText: extractedText.length > 0
      };

      await this.db.put('documents', documentData);

      if (onProgress) onProgress({ stage: 'Upload completed!', progress: 100 });

      return {
        success: true,
        documentId: documentId,
        document: documentData,
        textExtracted: extractedText.length > 0,
        textLength: extractedText.length
      };

    } catch (error) {
      console.error('Error storing document:', error);
      if (onProgress) onProgress({ stage: 'Upload failed', progress: 0, error: error.message });
      throw error;
    }
  }

  // Get the raw file data from a stored document
  async getDocumentFile(documentId) {
    try {
      await this.initDB();
      const document = await this.db.get('documents', documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Check if user owns this document
      if (document.userId !== this.userId) {
        throw new Error('Access denied - document belongs to another user');
      }
      
      // Convert base64 back to file/blob
      const response = await fetch(document.file);
      const blob = await response.blob();
      const file = new File([blob], document.name, { type: document.type });
      
      return {
        success: true,
        documentId: documentId,
        document: document,
        file: file,
        blob: blob,
        base64Data: document.file,
        metadata: {
          name: document.name,
          type: document.type,
          size: document.size,
          uploadDate: document.uploadDate
        }
      };
      
    } catch (error) {
      console.error('Error getting document file:', error);
      throw error;
    }
  }

  // Download a stored document
  async downloadDocument(documentId) {
    try {
      const fileData = await this.getDocumentFile(documentId);
      
      // Create download link
      const url = URL.createObjectURL(fileData.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.metadata.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Download started'
      };
      
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  // Get all document files as an array (for batch processing)
  async getAllDocumentFiles() {
    try {
      await this.initDB();
      const documents = await this.getAllDocuments();
      
      const fileDataArray = [];
      
      for (const doc of documents) {
        const response = await fetch(doc.file);
        const blob = await response.blob();
        const file = new File([blob], doc.name, { type: doc.type });
        
        fileDataArray.push({
          documentId: doc.id,
          file: file,
          blob: blob,
          base64Data: doc.file,
          metadata: {
            name: doc.name,
            type: doc.type,
            size: doc.size,
            uploadDate: doc.uploadDate,
            hasText: doc.hasText,
            textContent: doc.textContent
          }
        });
      }
      
      return {
        success: true,
        files: fileDataArray,
        count: fileDataArray.length
      };
      
    } catch (error) {
      console.error('Error getting all document files:', error);
      throw error;
    }
  }

  // Export document data as JSON (for external processing)
  async exportDocumentData(documentId) {
    try {
      await this.initDB();
      const document = await this.db.get('documents', documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      if (document.userId !== this.userId) {
        throw new Error('Access denied - document belongs to another user');
      }
      
      const exportData = {
        documentId: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        uploadDate: document.uploadDate,
        base64File: document.file,
        textContent: document.textContent || '',
        hasText: document.hasText || false,
        textExtractionMethod: document.textExtractionMethod || 'none',
        canExtractText: document.canExtractText || false
      };
      
      return {
        success: true,
        data: exportData
      };
      
    } catch (error) {
      console.error('Error exporting document data:', error);
      throw error;
    }
  }

  // Get extracted text from a document
  async getDocumentText(documentId) {
    try {
      await this.initDB();
      const document = await this.db.get('documents', documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Check if user owns this document
      if (document.userId !== this.userId) {
        throw new Error('Access denied - document belongs to another user');
      }
      
      return {
        success: true,
        documentId: documentId,
        documentName: document.name,
        textContent: document.textContent || '',
        hasText: document.hasText || false,
        textExtractionMethod: document.textExtractionMethod || 'none',
        extractedAt: document.uploadDate
      };
      
    } catch (error) {
      console.error('Error getting document text:', error);
      throw error;
    }
  }

  // Re-extract text from a stored document
  async reExtractDocumentText(documentId, onProgress = null) {
    try {
      await this.initDB();
      const document = await this.db.get('documents', documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      if (document.userId !== this.userId) {
        throw new Error('Access denied - document belongs to another user');
      }

      if (onProgress) onProgress({ stage: 'Loading document...', progress: 10 });
      
      // Convert base64 back to file
      const response = await fetch(document.file);
      const blob = await response.blob();
      const file = new File([blob], document.name, { type: document.type });
      
      if (onProgress) onProgress({ stage: 'Re-extracting text...', progress: 30 });
      
      // Extract text
      const textResult = await textExtractor.extractText(file, (textProgress) => {
        const scaledProgress = 30 + (textProgress.progress * 0.6);
        if (onProgress) onProgress({ 
          stage: textProgress.stage || 'Extracting text...', 
          progress: Math.round(scaledProgress) 
        });
      });

      // Update document with new text
      const updatedDocument = {
        ...document,
        textContent: textResult.text || '',
        textExtractionMethod: textResult.method || 'failed',
        hasText: (textResult.text || '').length > 0,
        lastTextExtraction: new Date().toISOString()
      };

      await this.db.put('documents', updatedDocument);
      
      if (onProgress) onProgress({ stage: 'Text extraction completed!', progress: 100 });

      return {
        success: true,
        documentId: documentId,
        textContent: textResult.text || '',
        textLength: (textResult.text || '').length,
        method: textResult.method
      };

    } catch (error) {
      console.error('Error re-extracting document text:', error);
      if (onProgress) onProgress({ stage: 'Text extraction failed', progress: 0, error: error.message });
      throw error;
    }
  }

  // Get all documents for current user
  async getAllDocuments() {
    try {
      await this.initDB();
      const allDocuments = await this.db.getAll('documents');
      // Filter documents by current user ID
      return allDocuments.filter(doc => doc.userId === this.userId);
    } catch (error) {
      console.error('Error getting documents:', error);
      return [];
    }
  }

  // Get document by ID
  async getDocument(documentId) {
    try {
      await this.initDB();
      return await this.db.get('documents', documentId);
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  // Delete document
  async deleteDocument(documentId) {
    try {
      await this.initDB();
      console.log('Deleting document:', documentId);
      await this.db.delete('documents', documentId);
      console.log('Document deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  // Delete multiple documents
  async deleteMultipleDocuments(documentIds) {
    try {
      await this.initDB();
      const results = [];
      
      for (const id of documentIds) {
        const result = await this.deleteDocument(id);
        results.push({ id, success: result });
      }
      
      return results;
    } catch (error) {
      console.error('Error deleting multiple documents:', error);
      return documentIds.map(id => ({ id, success: false }));
    }
  }

  // Get storage statistics for current user
  async getStorageStats() {
    try {
      await this.initDB();
      const documents = await this.getAllDocuments(); // Already filtered by user
      
      const fileTypes = {};

      for (const doc of documents) {
        const type = doc.type || 'unknown';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      }

      return {
        totalDocuments: documents.length,
        fileTypes: fileTypes,
        recentDocuments: documents
          .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
          .slice(0, 10) // Show more recent documents
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalDocuments: 0,
        fileTypes: {},
        recentDocuments: []
      };
    }
  }
}

// Export singleton instance
export const simpleDocumentStorage = new SimpleDocumentStorage();
export default simpleDocumentStorage;
