import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './firebase';
import { trackDataPoint } from './dataTracker';

class StorageService {
  constructor() {
    this.storage = storage;
  }

  /**
   * Upload a file to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} folder - The folder to upload to (default: 'uploads')
   * @param {string} userId - Optional user ID for organization
   * @returns {Promise<{url: string, path: string, metadata: object}>}
   */
  async uploadFile(file, folder = 'uploads', userId = null) {
    try {
      // Create unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      
      // Create storage path
      const basePath = userId ? `${folder}/${userId}` : folder;
      const filePath = `${basePath}/${fileName}`;
      
      // Create storage reference
      const storageRef = ref(this.storage, filePath);
      
      // Upload file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString(),
          userId: userId || 'anonymous'
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const result = {
        url: downloadURL,
        path: filePath,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          fullPath: snapshot.ref.fullPath
        }
      };

      // Track upload analytics
      await this.trackUpload(file, result);

      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files
   * @param {FileList|Array} files - Files to upload
   * @param {string} folder - Folder to upload to
   * @param {string} userId - Optional user ID
   * @returns {Promise<Array>}
   */
  async uploadMultipleFiles(files, folder = 'uploads', userId = null) {
    const uploadPromises = Array.from(files).map(file => 
      this.uploadFile(file, folder, userId)
    );
    
    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * @param {string} filePath - Path to the file in storage
   * @returns {Promise<boolean>}
   */
  async deleteFile(filePath) {
    try {
      const fileRef = ref(this.storage, filePath);
      await deleteObject(fileRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * List all files in a folder
   * @param {string} folderPath - Path to the folder
   * @returns {Promise<Array>}
   */
  async listFiles(folderPath = 'uploads') {
    try {
      const folderRef = ref(this.storage, folderPath);
      const result = await listAll(folderRef);
      
      const filePromises = result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url: url
        };
      });

      return await Promise.all(filePromises);
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error(`List files failed: ${error.message}`);
    }
  }

  /**
   * Get file URL by path
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>}
   */
  async getFileURL(filePath) {
    try {
      const fileRef = ref(this.storage, filePath);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw new Error(`Get URL failed: ${error.message}`);
    }
  }

  /**
   * Check if file type is supported for PDF text extraction
   * @param {File|string} file - File object or file type
   * @returns {boolean}
   */
  isSupportedForTextExtraction(file) {
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown'
    ];
    
    const fileType = typeof file === 'string' ? file : file.type;
    return supportedTypes.includes(fileType);
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {object} options - Validation options
   * @returns {object}
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB default
      allowedTypes = ['application/pdf', 'text/plain', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    } = options;

    const errors = [];
    
    if (file.size > maxSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSize / 1024 / 1024}MB)`);
    }

    const isTypeAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isTypeAllowed) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Track upload analytics
   * @param {File} file - Uploaded file
   * @param {object} result - Upload result
   */
  async trackUpload(file, result) {
    try {
      await trackDataPoint('file_uploads', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadPath: result.path,
        timestamp: new Date().toISOString(),
        supportedForExtraction: this.isSupportedForTextExtraction(file)
      });
    } catch (error) {
      console.error('Error tracking upload:', error);
    }
  }
}

// Create and export singleton instance
const storageService = new StorageService();
export default storageService;
