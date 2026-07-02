import axios from 'axios';
import textExtractor from './textExtraction';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('studygenie_token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  };
};

class SimpleDocumentStorage {
  constructor() {
    this.clearOldIndexedDB();
  }

  get userId() {
    let userId = localStorage.getItem('studyGenieUserId');
    if (!userId) {
      userId = localStorage.getItem('studyGenieUserId_legacy');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('studyGenieUserId_legacy', userId);
      }
    }
    return userId;
  }

  // Clear old browser-based IndexedDB data to save disk space
  async clearOldIndexedDB() {
    try {
      const dbName = 'StudyGenieDocuments';
      // Attempt to check database names and delete the legacy IndexedDB
      if (window.indexedDB && window.indexedDB.databases) {
        const databases = await window.indexedDB.databases();
        const exists = databases.some(db => db.name === dbName);
        if (exists) {
          console.log('🧹 Legacy IndexedDB detected. Clearing local documents store to free browser space...');
          window.indexedDB.deleteDatabase(dbName);
          console.log('✅ Legacy IndexedDB database deleted.');
        }
      }
    } catch (e) {
      console.warn('Unable to clear legacy IndexedDB (this is normal on some browsers/settings):', e.message);
    }
  }

  getUserId() {
    return this.userId;
  }

  // Map MongoDB schema to frontend UI expectations
  mapMongoDoc(doc) {
    if (!doc) return null;
    return {
      id: doc._id || doc.id,
      userId: doc.userId,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploadDate: doc.createdAt || doc.uploadDate,
      textContent: doc.textContent || '',
      textExtractionMethod: doc.textExtractionMethod || 'none',
      canExtractText: doc.type === 'application/pdf' || doc.type?.startsWith('text/') || doc.type?.startsWith('image/'),
      hasText: !!(doc.textContent && doc.textContent.length > 0),
      summaries: doc.summaries || {},
      studyMaterials: doc.studyMaterials || {},
      status: doc.status || 'completed'
    };
  }

  // Upload document directly to Cloudflare R2 via pre-signed PUT URLs
  async storeDocument(file, onProgress = null) {
    try {
      if (onProgress) onProgress({ stage: 'Initiating secure connection...', progress: 5 });

      // 1. Get pre-signed PUT URL from the backend
      const uploadUrlRes = await axios.get(
        `${API_URL}/documents/upload-url?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}&fileSize=${file.size}`,
        getHeaders()
      );

      const { uploadUrl, r2Key } = uploadUrlRes.data;

      // 2. Upload file binary directly to Cloudflare R2
      if (onProgress) onProgress({ stage: 'Uploading raw file to Cloudflare R2...', progress: 10 });
      
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Scale progress bar to map to 10% - 50% for visual feedback
          const scaledProgress = 10 + (percentCompleted * 0.4);
          if (onProgress) {
            onProgress({
              stage: `Uploading to cloud (${percentCompleted}%)...`,
              progress: Math.round(scaledProgress)
            });
          }
        }
      });

      // 3. Extract text content locally so RAG/AI summaries still work on upload
      let extractedText = '';
      let textExtractionMethod = 'none';
      const canExtract = textExtractor.canExtractText(file);

      if (canExtract) {
        try {
          if (onProgress) onProgress({ stage: 'Extracting text content...', progress: 60 });

          const textResult = await textExtractor.extractText(file, (textProgress) => {
            // Scale text extraction progress to 60% - 90%
            const scaledProgress = 60 + (textProgress.progress * 0.3);
            if (onProgress) {
              onProgress({
                stage: textProgress.stage || 'Extracting text...',
                progress: Math.round(scaledProgress)
              });
            }
          });

          if (textResult.success && textResult.text) {
            extractedText = textResult.text;
            textExtractionMethod = textResult.method;
          }
        } catch (textErr) {
          console.warn('Text extraction failed during storage:', textErr.message);
          textExtractionMethod = 'failed';
        }
      }

      // 4. Register the document metadata in MongoDB
      if (onProgress) onProgress({ stage: 'Registering upload metadata...', progress: 95 });

      const registerRes = await axios.post(
        `${API_URL}/documents`,
        {
          name: file.name,
          type: file.type,
          size: file.size,
          r2Key,
          textContent: extractedText,
          textExtractionMethod
        },
        getHeaders()
      );

      const savedDoc = this.mapMongoDoc(registerRes.data.document);

      if (onProgress) onProgress({ stage: 'Upload completed successfully!', progress: 100 });

      return {
        success: true,
        documentId: savedDoc.id,
        document: savedDoc,
        textExtracted: savedDoc.hasText,
        textLength: savedDoc.textContent.length
      };
    } catch (error) {
      console.error('Error storing document via R2 proxy:', error);
      if (onProgress) onProgress({ stage: 'Upload failed', progress: 0, error: error.message });
      throw error;
    }
  }

  // Get raw file from Cloudflare R2 using pre-signed GET URL
  async getDocumentFile(documentId) {
    try {
      // 1. Fetch pre-signed GET URL from the server
      const downloadUrlRes = await axios.get(`${API_URL}/documents/${documentId}/download-url`, getHeaders());
      const { downloadUrl } = downloadUrlRes.data;

      // 2. Fetch document metadata
      const docRes = await axios.get(`${API_URL}/documents/${documentId}`, getHeaders());
      const mappedDoc = this.mapMongoDoc(docRes.data.document);

      // 3. Fetch file binary bytes from pre-signed URL
      const fileResponse = await fetch(downloadUrl);
      const blob = await fileResponse.blob();
      const file = new File([blob], mappedDoc.name, { type: mappedDoc.type });

      return {
        success: true,
        documentId,
        document: mappedDoc,
        file,
        blob,
        base64Data: downloadUrl, // Return the URL itself for file source references
        metadata: {
          name: mappedDoc.name,
          type: mappedDoc.type,
          size: mappedDoc.size,
          uploadDate: mappedDoc.uploadDate
        }
      };
    } catch (error) {
      console.error('Error fetching document file from R2:', error);
      throw error;
    }
  }

  // Triggers browser download of original file from R2
  async downloadDocument(documentId) {
    try {
      const fileData = await this.getDocumentFile(documentId);
      
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
      console.error('Error downloading document from R2:', error);
      throw error;
    }
  }

  // Returns array of all files for batch processing
  async getAllDocumentFiles() {
    try {
      const documents = await this.getAllDocuments();
      const fileDataArray = [];

      for (const doc of documents) {
        try {
          const fileData = await this.getDocumentFile(doc.id);
          fileDataArray.push(fileData);
        } catch (e) {
          console.warn(`Could not fetch binary file for ${doc.name}, skipping:`, e.message);
        }
      }

      return {
        success: true,
        files: fileDataArray,
        count: fileDataArray.length
      };
    } catch (error) {
      console.error('Error retrieving batch document files:', error);
      throw error;
    }
  }

  // Exports document metadata + base64 file data as JSON
  async exportDocumentData(documentId) {
    try {
      const fileData = await this.getDocumentFile(documentId);
      
      // Convert blob to base64 dynamically for the JSON export package
      const reader = new FileReader();
      const base64File = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(fileData.blob);
      });

      return {
        success: true,
        data: {
          documentId,
          name: fileData.metadata.name,
          type: fileData.metadata.type,
          size: fileData.metadata.size,
          uploadDate: fileData.metadata.uploadDate,
          base64File,
          textContent: fileData.document.textContent || '',
          hasText: fileData.document.hasText,
          textExtractionMethod: fileData.document.textExtractionMethod,
          canExtractText: fileData.document.canExtractText
        }
      };
    } catch (error) {
      console.error('Error exporting document details:', error);
      throw error;
    }
  }

  // Retrieve text content from MongoDB
  async getDocumentText(documentId) {
    try {
      const res = await axios.get(`${API_URL}/documents/${documentId}`, getHeaders());
      const mappedDoc = this.mapMongoDoc(res.data.document);

      return {
        success: true,
        documentId,
        documentName: mappedDoc.name,
        textContent: mappedDoc.textContent,
        hasText: mappedDoc.hasText,
        textExtractionMethod: mappedDoc.textExtractionMethod,
        extractedAt: mappedDoc.uploadDate
      };
    } catch (error) {
      console.error('Error fetching document text content:', error);
      throw error;
    }
  }

  // Re-run text extraction locally and save updated text back to MongoDB
  async reExtractDocumentText(documentId, onProgress = null) {
    try {
      if (onProgress) onProgress({ stage: 'Retrieving source file...', progress: 10 });
      
      const fileData = await this.getDocumentFile(documentId);
      
      if (onProgress) onProgress({ stage: 'Running local text extractor...', progress: 30 });
      
      const textResult = await textExtractor.extractText(fileData.file, (textProgress) => {
        const scaledProgress = 30 + (textProgress.progress * 0.6);
        if (onProgress) {
          onProgress({ 
            stage: textProgress.stage || 'Extracting text...', 
            progress: Math.round(scaledProgress) 
          });
        }
      });

      if (onProgress) onProgress({ stage: 'Updating database...', progress: 90 });

      // Save the text back to MongoDB
      await axios.put(
        `${API_URL}/documents/${documentId}/ai-results`,
        {
          textContent: textResult.text || '',
          textExtractionMethod: textResult.method || 'failed'
        },
        getHeaders()
      );

      if (onProgress) onProgress({ stage: 'Extraction completed!', progress: 100 });

      return {
        success: true,
        documentId,
        textContent: textResult.text || '',
        textLength: (textResult.text || '').length,
        method: textResult.method
      };
    } catch (error) {
      console.error('Error re-extracting document text content:', error);
      if (onProgress) onProgress({ stage: 'Text extraction failed', progress: 0, error: error.message });
      throw error;
    }
  }

  // Save AI summaries or study guides to the MongoDB record
  async updateAiResults(documentId, aiData) {
    try {
      await axios.put(
        `${API_URL}/documents/${documentId}/ai-results`,
        aiData,
        getHeaders()
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating document AI results:', error);
      throw error;
    }
  }

  // Get all documents metadata for current user
  async getAllDocuments() {
    try {
      const res = await axios.get(`${API_URL}/documents`, getHeaders());
      if (res.data && res.data.success) {
        return res.data.documents.map(doc => this.mapMongoDoc(doc));
      }
      return [];
    } catch (error) {
      console.error('Error getting all documents from server:', error);
      return [];
    }
  }

  // Get specific document metadata
  async getDocument(documentId) {
    try {
      const res = await axios.get(`${API_URL}/documents/${documentId}`, getHeaders());
      if (res.data && res.data.success) {
        return this.mapMongoDoc(res.data.document);
      }
      return null;
    } catch (error) {
      console.error('Error getting single document details:', error);
      return null;
    }
  }

  // Delete a document from R2 and MongoDB
  async deleteDocument(documentId) {
    try {
      console.log('Requesting document deletion for:', documentId);
      const res = await axios.delete(`${API_URL}/documents/${documentId}`, getHeaders());
      return !!(res.data && res.data.success);
    } catch (error) {
      console.error('Error deleting document from cloud storage:', error);
      return false;
    }
  }

  // Bulk delete helper
  async deleteMultipleDocuments(documentIds) {
    try {
      const results = [];
      for (const id of documentIds) {
        const result = await this.deleteDocument(id);
        results.push({ id, success: result });
      }
      return results;
    } catch (error) {
      console.error('Error during bulk document deletion:', error);
      return documentIds.map(id => ({ id, success: false }));
    }
  }

  // Generate storage statistics using server files list
  async getStorageStats() {
    try {
      const documents = await this.getAllDocuments();
      const fileTypes = {};

      for (const doc of documents) {
        const type = doc.type || 'unknown';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      }

      return {
        totalDocuments: documents.length,
        fileTypes,
        recentDocuments: documents
          .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error compiling storage stats:', error);
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
