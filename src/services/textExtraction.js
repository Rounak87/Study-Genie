// Text extraction service for various file types (lazy loaded)

class TextExtractionService {
  constructor() {
    this.ocrWorker = null;
    this.isPDFJSInitialized = false;
    this.pdfjsLib = null;
  }

  // Initialize PDF.js with proper error handling
  async initPDFJS() {
    if (this.isPDFJSInitialized) return;
    
    try {
      console.log('📦 Dynamically loading PDF.js...');
      this.pdfjsLib = await import('pdfjs-dist');
      // Set up PDF.js worker - use a more reliable approach
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${this.pdfjsLib.version}/pdf.worker.min.js`;
      this.isPDFJSInitialized = true;
    } catch (error) {
      console.warn('CDN worker failed, trying alternative approach:', error);
      
      // Fallback: Use a version that definitely exists
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
      this.isPDFJSInitialized = true;
    }
  }

  // Initialize OCR worker (lazy initialization)
  async initOCRWorker() {
    if (!this.ocrWorker) {
      console.log('📦 Dynamically loading Tesseract.js...');
      const { createWorker } = await import('tesseract.js');
      this.ocrWorker = await createWorker('eng');
    }
    return this.ocrWorker;
  }

  // Extract text from PDF files
  async extractTextFromPDF(file, onProgress = null) {
    try {
      console.log('📄 Starting PDF text extraction for:', file.name);
      if (onProgress) onProgress({ stage: 'Loading PDF...', progress: 10 });

      // Ensure PDF.js is initialized
      await this.initPDFJS();
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('📄 PDF loaded, size:', arrayBuffer.byteLength, 'bytes');
      
      const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('📄 PDF parsed, pages:', pdf.numPages);
      
      const totalPages = pdf.numPages;
      let fullText = '';
      
      if (onProgress) onProgress({ stage: 'Extracting text...', progress: 20 });

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`📄 Processing page ${pageNum}/${totalPages}`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .trim();
        
        console.log(`📄 Page ${pageNum} text length:`, pageText.length);
        
        if (pageText) {
          fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        }

        // Update progress
        const progress = 20 + (pageNum / totalPages) * 70;
        if (onProgress) onProgress({ 
          stage: `Processing page ${pageNum}/${totalPages}...`, 
          progress: Math.round(progress) 
        });
      }

      console.log('📄 Total extracted text length:', fullText.length);
      if (onProgress) onProgress({ stage: 'Text extraction completed', progress: 100 });

      return {
        success: true,
        text: fullText.trim(),
        pages: totalPages,
        method: 'PDF.js'
      };

    } catch (error) {
      console.error('❌ Error extracting text from PDF:', error);
      if (onProgress) onProgress({ stage: 'Error extracting text', progress: 0, error: error.message });
      throw new Error(`PDF text extraction failed: ${error.message}`);
    }
  }

  // Extract text from images using OCR
  async extractTextFromImage(file, onProgress = null) {
    try {
      console.log('🖼️ Starting OCR for image:', file.name, 'Type:', file.type);
      if (onProgress) onProgress({ stage: 'Initializing OCR...', progress: 10 });

      const worker = await this.initOCRWorker();
      console.log('🖼️ OCR worker initialized');
      
      if (onProgress) onProgress({ stage: 'Processing image...', progress: 30 });

      const { data: { text } } = await worker.recognize(file, {
        logger: (m) => {
          console.log('🖼️ OCR progress:', m);
          if (m.status === 'recognizing text' && onProgress) {
            const progress = 30 + (m.progress * 60);
            onProgress({ 
              stage: `OCR processing... ${Math.round(m.progress * 100)}%`, 
              progress: Math.round(progress) 
            });
          }
        }
      });

      console.log('🖼️ OCR completed, text length:', text.length);
      if (onProgress) onProgress({ stage: 'OCR completed', progress: 100 });

      return {
        success: true,
        text: text.trim(),
        method: 'Tesseract.js OCR'
      };

    } catch (error) {
      console.error('❌ Error extracting text from image:', error);
      if (onProgress) onProgress({ stage: 'Error processing image', progress: 0, error: error.message });
      throw new Error(`Image OCR failed: ${error.message}`);
    }
  }

  // Extract text from plain text files
  async extractTextFromTextFile(file, onProgress = null) {
    try {
      console.log('📝 Starting text file extraction for:', file.name, 'Type:', file.type);
      if (onProgress) onProgress({ stage: 'Reading text file...', progress: 50 });

      const text = await file.text();
      console.log('📝 Text file read, length:', text.length);
      
      if (onProgress) onProgress({ stage: 'Text file processed', progress: 100 });

      return {
        success: true,
        text: text.trim(),
        method: 'Direct text read'
      };

    } catch (error) {
      console.error('❌ Error reading text file:', error);
      if (onProgress) onProgress({ stage: 'Error reading file', progress: 0, error: error.message });
      throw new Error(`Text file reading failed: ${error.message}`);
    }
  }

  // Main text extraction method - determines file type and uses appropriate method
  async extractText(file, onProgress = null) {
    try {
      const fileType = file.type.toLowerCase();
      console.log('🔍 Starting text extraction for file type:', fileType, 'File name:', file.name);
      
      if (onProgress) onProgress({ stage: 'Analyzing file type...', progress: 5 });

      // PDF files
      if (fileType === 'application/pdf') {
        console.log('📄 Extracting from PDF...');
        return await this.extractTextFromPDF(file, onProgress);
      }
      
      // Text files
      if (fileType.startsWith('text/') || 
          fileType === 'application/msword' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('📝 Extracting from text file...');
        return await this.extractTextFromTextFile(file, onProgress);
      }
      
      // Image files
      if (fileType.startsWith('image/')) {
        console.log('🖼️ Extracting from image with OCR...');
        return await this.extractTextFromImage(file, onProgress);
      }

      console.warn('❌ Unsupported file type for text extraction:', fileType);
      throw new Error(`Unsupported file type for text extraction: ${fileType}`);

    } catch (error) {
      console.error('❌ Text extraction error:', error);
      if (onProgress) onProgress({ stage: 'Text extraction failed', progress: 0, error: error.message });
      throw error;
    }
  }

  // Check if file type supports text extraction
  canExtractText(file) {
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/html',
      'text/css',
      'text/javascript',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ];
    
    const canExtract = supportedTypes.some(type => file.type.toLowerCase().includes(type.toLowerCase()));
    console.log('🔍 canExtractText check:', {
      fileName: file.name,
      fileType: file.type,
      canExtract: canExtract,
      supportedTypes: supportedTypes
    });
    
    return canExtract;
  }

  // Clean up OCR worker
  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }

  // Test function for debugging
  testExtraction() {
    console.log('🧪 Text extraction service initialized (lazy loading active)');
    return true;
  }
}

// Export singleton instance
export const textExtractor = new TextExtractionService();
export default textExtractor;