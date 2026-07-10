import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getR2BucketName } from '../utils/r2.js';

/**
 * Generate a pre-signed PUT URL for uploading a file directly to Cloudflare R2
 * 
 * @param {string} fileName - Original name of the file
 * @param {string} fileType - MIME type of the file
 * @param {string} userId - ID of the user uploading the file
 * @returns {Promise<{ uploadUrl: string, r2Key: string }>}
 */
export const getPresignedUploadUrl = async (fileName, fileType, userId) => {
  const r2Client = getR2Client();
  const bucketName = getR2BucketName();

  // Sanitize filename to prevent directory traversal or URL issues
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const r2Key = `uploads/${userId}/${Date.now()}-${sanitizedName}`;

  console.log(`Generating pre-signed R2 PUT URL for: ${r2Key} (Type: ${fileType})`);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: r2Key,
    ContentType: fileType
  });

  // Generate link valid for 10 minutes (600 seconds)
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });

  return {
    uploadUrl,
    r2Key
  };
};

/**
 * Download a file from Cloudflare R2 and return it as a Node.js Buffer
 * 
 * @param {string} r2Key - The R2 storage key/path of the file
 * @returns {Promise<Buffer>} - Downloaded file content buffer
 */
export const downloadFile = async (r2Key) => {
  const r2Client = getR2Client();
  const bucketName = getR2BucketName();

  console.log(`🔗 Downloading file from R2: ${r2Key}`);
  
  const response = await r2Client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: r2Key
  }));

  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
};

/**
 * Delete a file from Cloudflare R2
 * 
 * @param {string} r2Key - The R2 storage key/path of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFile = async (r2Key) => {
  const r2Client = getR2Client();
  const bucketName = getR2BucketName();

  console.log(`🗑️ Deleting file from R2: ${r2Key}`);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: r2Key
  });

  await r2Client.send(deleteCommand);
};
