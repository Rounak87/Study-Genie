import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getR2BucketName } from '../utils/r2.js';
import Document from '../models/Document.js';

/**
 * Generate a pre-signed upload URL for Cloudflare R2
 * GET /api/documents/upload-url
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'fileName and fileType query parameters are required'
      });
    }

    const r2Client = getR2Client();
    const bucketName = getR2BucketName();

    // Sanitize filename to prevent directory traversal or URL issues
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const r2Key = `uploads/${req.user.id}/${Date.now()}-${sanitizedName}`;

    console.log(`Generating pre-signed R2 PUT URL for: ${r2Key} (Type: ${fileType})`);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      ContentType: fileType
    });

    // Generate link valid for 10 minutes (600 seconds)
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });

    res.json({
      success: true,
      uploadUrl,
      r2Key
    });
  } catch (error) {
    console.error('Error generating pre-signed upload URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate upload URL'
    });
  }
};

/**
 * Register document metadata in MongoDB after direct R2 upload
 * POST /api/documents
 */
export const createDocument = async (req, res) => {
  try {
    const { name, type, size, r2Key, textContent, textExtractionMethod } = req.body;

    if (!name || !type || !size || !r2Key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required document fields (name, type, size, r2Key)'
      });
    }

    const document = new Document({
      userId: req.user.id,
      name,
      type,
      size,
      r2Key,
      textContent: textContent || '',
      textExtractionMethod: textExtractionMethod || 'none',
      status: 'completed' // Marked completed since the frontend sends text content along with it
    });

    await document.save();

    res.status(201).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error registering document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register document in database'
    });
  }
};

/**
 * Fetch all documents metadata for the current user
 * GET /api/documents
 */
export const getDocuments = async (req, res) => {
  try {
    // Exclude textContent from list response to optimize payload size
    const documents = await Document.find({ userId: req.user.id })
      .select('-textContent')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents'
    });
  }
};

/**
 * Fetch a single document's complete details
 * GET /api/documents/:id
 */
export const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Verify ownership
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this document'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error fetching document details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document details'
    });
  }
};

/**
 * Generate a pre-signed GET download URL from Cloudflare R2
 * GET /api/documents/:id/download-url
 */
export const getDownloadUrl = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Verify ownership
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this document'
      });
    }

    const r2Client = getR2Client();
    const bucketName = getR2BucketName();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: document.r2Key
    });

    // Link expires in 1 hour (3600 seconds)
    const downloadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      downloadUrl
    });
  } catch (error) {
    console.error('Error generating pre-signed download URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate download URL'
    });
  }
};

/**
 * Delete a document from Cloudflare R2 and MongoDB
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Verify ownership
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this document'
      });
    }

    // 1. Delete binary from Cloudflare R2
    try {
      const r2Client = getR2Client();
      const bucketName = getR2BucketName();

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: document.r2Key
      });

      await r2Client.send(deleteCommand);
      console.log(`Deleted object from R2: ${document.r2Key}`);
    } catch (r2Error) {
      // Log the error but continue deleting metadata from Mongo so database state remains clean
      console.error('Cloudflare R2 deletion failed:', r2Error);
    }

    // 2. Delete metadata from MongoDB
    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully from cloud storage and database'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
};

/**
 * Update AI generated summaries/study materials
 * PUT /api/documents/:id/ai-results
 */
export const updateAiResults = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Verify ownership
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not own this document'
      });
    }

    const { summaries, studyMaterials, textContent, textExtractionMethod } = req.body;

    // Update text content if re-extracted
    if (textContent !== undefined) {
      document.textContent = textContent;
    }

    if (textExtractionMethod !== undefined) {
      document.textExtractionMethod = textExtractionMethod;
    }

    // Merge summaries safely
    if (summaries) {
      for (const [style, text] of Object.entries(summaries)) {
        document.summaries.set(style, text);
      }
    }

    // Update study materials if provided
    if (studyMaterials) {
      document.studyMaterials = {
        ...(document.studyMaterials || {}),
        ...studyMaterials
      };
    }

    await document.save();

    res.json({
      success: true,
      message: 'AI results updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update AI results'
    });
  }
};
