import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract text content from a file buffer based on its MIME type.
 * Easily extensible to add additional document types like Word (docx) or Images.
 * 
 * @param {Buffer} buffer - File data buffer
 * @param {string} mimeType - The content type of the file
 * @returns {Promise<string>} - Extracted text content
 */
export const parseDocumentBuffer = async (buffer, mimeType) => {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  const normalizedMime = mimeType ? mimeType.toLowerCase().trim() : '';

  switch (normalizedMime) {
    case 'application/pdf':
      console.log('📄 Parsing PDF buffer using pdf-parse...');
      try {
        const data = await pdfParse(buffer);
        // Clean up double spaces/newlines slightly if needed, but keep core layout
        return data.text || '';
      } catch (err) {
        console.error('Error parsing PDF content:', err);
        throw new Error('Failed to parse PDF document content: ' + err.message);
      }

    case 'text/plain':
    case 'text/csv':
    case 'text/markdown':
    case 'text/html':
      console.log('📝 Reading text buffer directly...');
      return buffer.toString('utf-8');

    // PLACEHOLDER: Add additional cases here in the future
    // case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
    //   return parseDocxBuffer(buffer);

    default:
      console.warn(`⚠️ MimeType "${mimeType}" is not officially supported. Attempting raw text decoding fallback.`);
      try {
        return buffer.toString('utf-8');
      } catch (err) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
  }
};
