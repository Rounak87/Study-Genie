import { useState, useCallback, useEffect } from 'react'
import { useSummary } from '../contexts/SummaryContext'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { DocumentViewer } from '../components/DocumentViewer'
import { useNavigate } from 'react-router-dom'
import { 
  DocumentArrowUpIcon, 
  XMarkIcon, 
  SparklesIcon, 
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  AcademicCapIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import documentStorage from '../services/simpleDocumentStorage'
import { dataTracker } from '../services/dataTracker'
import textExtractor from '../services/textExtraction'
import summarizationService from '../services/summarizationService'

const Upload = () => {
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [storedDocuments, setStoredDocuments] = useState([])
  const { summary, setSummary, generateStudyMaterials } = useSummary()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    documentData: null,
    isGeneratingSummary: false,
  })
  const navigate = useNavigate()

  // Load stored documents on component mount
  useEffect(() => {
    loadStoredDocuments()
    
    // Test text extraction service
    console.log('🧪 Testing text extraction service...')
    textExtractor.testExtraction()
  }, [])

  const loadStoredDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading stored documents...');
      const documents = await documentStorage.getAllDocuments()
      
      console.log('Found documents:', documents.length);
      setStoredDocuments(documents) // Show all documents for current user
    } catch (error) {
      console.error('Error loading stored documents:', error)
      setError('Failed to load documents: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles) => {
    const processedFiles = acceptedFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      progress: 0,
      status: 'ready',
      stage: '',
      textContent: null,
      documentId: null,
      canExtractText: canExtractText(file),
      processingDetails: null,
      textExtracted: false,
      textLength: 0
    }))

    setFiles(prev => [...prev, ...processedFiles])
  }, [])

  const canExtractText = (file) => {
    const supportedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff'
    ]
    return supportedTypes.some(type => file.type.toLowerCase().includes(type.toLowerCase()))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'text/*': ['.txt', '.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  // Store only the latest summary in context for use in StudyGuide
  const summarizeText = async (docId, text) => {
    try {
      if (summary) return;
      console.log('Starting summarization for document:', docId);
      const result = await summarizationService.summarizeText(text);
      console.log('Summarization result:', result);
      if (result.success) {
        setSummary(result.summary);
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw error;
    }
  };

  const processFiles = async () => {
    setProcessing(true)
    
    const filesToProcess = files.filter(f => f.status === 'ready')
    
    for (const fileObj of filesToProcess) {
      try {
        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'processing', progress: 0, stage: 'Starting...' }
            : f
        ))

        // Store document using simple storage
        const result = await documentStorage.storeDocument(
          fileObj.file,
          (progressData) => {
            setFiles(prev => prev.map(f => 
              f.id === fileObj.id 
                ? { 
                    ...f, 
                    progress: progressData.progress || 0, 
                    stage: progressData.stage || 'Processing...'
                  }
                : f
            ))
          }
        )

        // If text was extracted, generate summary
        if (result.textExtracted) {
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, stage: 'Generating summary...' }
              : f
          ));

          try {
            const textData = await documentStorage.getDocumentText(result.documentId);
            const summaryResult = await summarizationService.summarizeText(textData.textContent);
            
            if (summaryResult.success) {
              setSummary(summaryResult.summary);
            }
          } catch (error) {
            console.error('Error generating summary:', error);
          }
        }

        // Update file status to completed
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100, 
                stage: result.textExtracted ? 
                  `Completed! Text extracted and summarized` : 
                  'Completed! (No text extracted)',
                documentId: result.documentId,
                textExtracted: result.textExtracted,
                textLength: result.textLength
              }
            : f
        ))

        // Track the upload for analytics
        await dataTracker.trackFileUpload(fileObj.file.name, fileObj.file.type, fileObj.file.size)

        console.log('Document stored successfully:', result)

      } catch (error) {
        console.error('Error processing file:', error)
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id 
            ? { 
                ...f, 
                status: 'error', 
                stage: 'Failed to upload',
                processingDetails: error.message
              }
            : f
        ))
      }
    }

    setProcessing(false)
    
    // Reload stored documents to show newly uploaded files
    await loadStoredDocuments()
    
    // Clear completed files after a delay
    setTimeout(() => {
      setFiles(prev => prev.filter(f => f.status !== 'completed'))
    }, 3000)
  }

  const deleteDocument = async (documentId, documentName) => {
    if (window.confirm(`Are you sure you want to delete "${documentName}"?`)) {
      try {
        await documentStorage.deleteDocument(documentId)
        await loadStoredDocuments() // Refresh the list
        console.log('Document deleted successfully')
      } catch (error) {
        console.error('Error deleting document:', error)
        alert('Failed to delete document. Please try again.')
      }
    }
  }

  const deleteAllDocuments = async () => {
    if (window.confirm(`Are you sure you want to delete all ${storedDocuments.length} documents? This action cannot be undone.`)) {
      try {
        const documentIds = storedDocuments.map(doc => doc.id)
        await documentStorage.deleteMultipleDocuments(documentIds)
        await loadStoredDocuments() // Refresh the list
        console.log('All documents deleted successfully')
      } catch (error) {
        console.error('Error deleting all documents:', error)
        alert('Failed to delete all documents. Please try again.')
      }
    }
  }

  const downloadDocument = async (documentId, documentName) => {
    try {
      await documentStorage.downloadDocument(documentId)
      console.log('✅ Download started for:', documentName)
    } catch (error) {
      console.error('❌ Download failed:', error)
      alert('Failed to download document. Please try again.')
    }
  }

  const exportDocumentData = async (documentId, documentName) => {
    try {
      const exportData = await documentStorage.exportDocumentData(documentId)
      
      // Create and download JSON file with document data
      const jsonData = JSON.stringify(exportData.data, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${documentName}_data.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('✅ Document data exported:', documentName)
    } catch (error) {
      console.error('❌ Export failed:', error)
      alert('Failed to export document data. Please try again.')
    }
  }

  const getFileForExternalProcessing = async (documentId) => {
    try {
      const fileData = await documentStorage.getDocumentFile(documentId)
      
      // You can now use fileData.file, fileData.blob, or fileData.base64Data
      // for external processing
      console.log('📄 File data ready for processing:', {
        name: fileData.metadata.name,
        type: fileData.metadata.type,
        size: fileData.metadata.size,
        file: fileData.file,
        blob: fileData.blob,
        base64: fileData.base64Data.substring(0, 100) + '...' // Show first 100 chars
      })
      
      // Example: Send to external API
      // await sendToExternalAPI(fileData.base64Data, fileData.metadata)
      
      alert(`File ready for processing!\nName: ${fileData.metadata.name}\nType: ${fileData.metadata.type}\nSize: ${(fileData.metadata.size / 1024 / 1024).toFixed(2)}MB\n\nCheck console for file data details.`)
      
      return fileData
    } catch (error) {
      console.error('❌ Failed to get file for processing:', error)
      alert('Failed to get file data. Please try again.')
    }
  }

  const processAllDocuments = async () => {
    try {
      const allFiles = await documentStorage.getAllDocumentFiles()
      
      console.log('📦 All documents ready for processing:', {
        count: allFiles.count,
        files: allFiles.files.map(f => ({
          name: f.metadata.name,
          type: f.metadata.type,
          size: f.metadata.size,
          hasText: f.metadata.hasText
        }))
      })
      
      // Example: You can now process all files
      // for (const fileData of allFiles.files) {
      //   await sendToExternalAPI(fileData.base64Data, fileData.metadata)
      // }
      
      alert(`Ready to process ${allFiles.count} documents!\nCheck console for details.`)
      
      return allFiles
    } catch (error) {
      console.error('❌ Failed to get all documents:', error)
      alert('Failed to get documents for processing.')
    }
  }

  const testTextExtraction = async () => {
    // Create a test text file
    const testContent = "This is a test document for text extraction. Hello world!"
    const testFile = new File([testContent], "test.txt", { type: "text/plain" })
    
    console.log('🧪 Testing with file:', testFile)
    
    try {
      const result = await textExtractor.extractText(testFile, (progress) => {
        console.log('🧪 Test progress:', progress)
      })
      console.log('🧪 Test result:', result)
      alert(`Test successful! Extracted: "${result.text}"`)
    } catch (error) {
      console.error('🧪 Test failed:', error)
      alert(`Test failed: ${error.message}`)
    }
  }

  const viewDocument = async (documentId) => {
    try {
      const textData = await documentStorage.getDocumentText(documentId)
      
      if (textData.hasText) {
        // Create a modal or new page to show the extracted text
        const textWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
        if (!textWindow) {
          alert('Please allow popups to view the document');
          return;
        }

        const createViewerContent = (textData, documentId, hasSummary, summary) => {
          // Fix the HTML content by removing JSX-like syntax
          return `
          <html>
            <head>
              <title>Extracted Text - ${textData.documentName}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  margin: 20px; 
                  background: #f5f5f5; 
                }
                .header { 
                  background: #2563eb; 
                  color: white; 
                  padding: 20px; 
                  margin: -20px -20px 20px -20px;
                  border-radius: 0 0 10px 10px;
                }
                .content { 
                  background: white; 
                  padding: 20px; 
                  border-radius: 10px; 
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  white-space: pre-wrap;
                  font-family: 'Courier New', monospace;
                }
                .meta {
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 5px;
                  margin-bottom: 20px;
                  font-size: 14px;
                  color: #666;
                }
                .summary-section {
                  margin: 20px 0;
                  padding: 20px;
                  background: #fff;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .summary-content {
                  margin-top: 10px;
                  padding: 15px;
                  background: #f0f9ff;
                  border-radius: 5px;
                  border-left: 4px solid #2563eb;
                }
                .button {
                  background: #2563eb;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 14px;
                  transition: background-color 0.3s;
                }
                .button:hover {
                  background: #1d4ed8;
                }
                .button:disabled {
                  background: #93c5fd;
                  cursor: not-allowed;
                }
                #summary-loading {
                  color: #2563eb;
                  margin: 10px 0;
                }
                .error {
                  color: #dc2626;
                  padding: 10px;
                  background: #fee2e2;
                  border-radius: 5px;
                  margin: 10px 0;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>📄 ${textData.documentName}</h1>
                <p>Extracted Text Content</p>
              </div>
              <div class="meta">
                <strong>Extraction Method:</strong> ${textData.textExtractionMethod}<br>
                <strong>Extracted At:</strong> ${new Date(textData.extractedAt).toLocaleString()}<br>
                <strong>Text Length:</strong> ${textData.textContent.length} characters
              </div>
              <div class="summary-section">
                ${hasSummary ? `
                  <div class="summary-content" style="display: block;">
                    <h4 class="text-sm font-medium text-indigo-300 mb-2">Summary:</h4>
                    <p class="text-sm text-gray-300">${summary}</p>
                  </div>
                ` : `
                  <button id="summarize-btn" class="button">
                    Generate Summary
                  </button>
                  <div id="summary-loading" style="display: none;">
                    Generating summary... Please wait...
                  </div>
                  <div id="summary-content" class="summary-content" style="display: none;"></div>
                  <div id="summary-error" class="error" style="display: none;"></div>
                `}
              </div>
              <div class="content">${textData.textContent || 'No text content found.'}</div>
              <script>
                document.addEventListener('DOMContentLoaded', function() {
                  const summarizeBtn = document.getElementById('summarize-btn');
                  if (summarizeBtn) {
                    summarizeBtn.addEventListener('click', handleSummarize);
                  }
                });

                async function handleSummarize() {
                  const btn = document.getElementById('summarize-btn');
                  const loading = document.getElementById('summary-loading');
                  const content = document.getElementById('summary-content');
                  const error = document.getElementById('summary-error');
                  
                  if (!btn || !loading || !content || !error) return;
                  
                  btn.disabled = true;
                  loading.style.display = 'block';
                  content.style.display = 'none';
                  error.style.display = 'none';
                  
                  try {
                    const message = {
                      type: 'summarize',
                      docId: '${documentId}',
                      text: document.querySelector('.content').textContent
                    };
                    
                    window.addEventListener('message', function handleMessage(event) {
                      const result = event.data;
                      if (result.type === 'summary_result') {
                        window.removeEventListener('message', handleMessage);
                        
                        if (result.error) {
                          error.textContent = result.error;
                          error.style.display = 'block';
                        } else {
                          content.innerHTML = result.summary;
                          content.style.display = 'block';
                        }
                        
                        loading.style.display = 'none';
                        btn.disabled = false;
                      }
                    });
                    
                    window.opener.postMessage(message, '*');
                  } catch (err) {
                    error.textContent = 'Failed to generate summary: ' + err.message;
                    error.style.display = 'block';
                    loading.style.display = 'none';
                    btn.disabled = false;
                  }
                }
              </script>
            </body>
          </html>
          `;
        };

  const hasSummary = !!summary;
  textWindow.document.write(createViewerContent(textData, documentId, hasSummary, summary || ''));
  textWindow.document.close();

        // Set up message handler in the opener window
        const messageHandler = async function(event) {
          if (event.data.type === 'summarize') {
            try {
              console.log('Starting summarization...');
              const result = await summarizationService.summarizeText(event.data.text);
              console.log('Summarization result:', result);
              
              if (result.success) {
                setSummary(result.summary);
                
                event.source.postMessage({
                  type: 'summary_result',
                  summary: result.summary
                }, '*');
              } else {
                throw new Error(result.error || 'Failed to generate summary');
              }
            } catch (error) {
              console.error('Error in summarization:', error);
              const errorMessage = error.message || 'Failed to generate summary';
              
              setSummary('');
              
              event.source.postMessage({
                type: 'summary_result',
                error: errorMessage
              }, '*');
            }
          }
        };

        window.addEventListener('message', messageHandler);
        
        // Clean up the message handler when the window is closed
        textWindow.addEventListener('beforeunload', () => {
          window.removeEventListener('message', messageHandler);
        });
      } else {
        alert('No text content available for this document. Text extraction may have failed or the document may not contain readable text.')
      }
    } catch (error) {
      console.error('Error viewing document:', error)
      alert('Failed to load document text. Please try again.')
    }
  }

  const handleGenerateSummary = async (documentId, textContent) => {
    setViewerState(prev => ({ ...prev, isGeneratingSummary: true }));
    try {
      await summarizeText(documentId, textContent);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setViewerState(prev => ({ ...prev, isGeneratingSummary: false }));
    }
  };

  const handleGenerateQuizAndFlashcards = async (docId) => {
    try {
      let currentSummary = summary;
      
      // If no summary exists, generate it first
      if (!currentSummary) {
        const textData = await documentStorage.getDocumentText(docId);
        const result = await summarizationService.summarizeText(textData.textContent);
        if (result.success) {
          setSummary(result.summary);
          currentSummary = result.summary;
        } else {
          throw new Error('Failed to generate summary');
        }
      }
      
      // Generate study materials from the summary
      generateStudyMaterials(currentSummary);
      
      // Navigate to study guide with the materials
      navigate('/study-guide');
    } catch (error) {
      console.error('Error preparing materials:', error);
      alert('Failed to prepare study materials. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setError(null);
            loadStoredDocuments();
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  const handleCloseViewer = () => {
    setViewerState({ isOpen: false, documentData: null, isGeneratingSummary: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Document Viewer Modal */}
      {viewerState.isOpen && viewerState.documentData && (
        <DocumentViewer
          isOpen={viewerState.isOpen}
          onClose={handleCloseViewer}
          documentData={viewerState.documentData}
          summary={summary}
          isGeneratingSummary={viewerState.isGeneratingSummary}
          onGenerateSummary={() => handleGenerateSummary(
            viewerState.documentData.id,
            viewerState.documentData.textContent
          )}
        />
      )}
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <DocumentArrowUpIcon className="inline-block w-12 h-12 mr-4 text-yellow-400" />
            Document Upload
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Upload PDFs, documents, and images. Files are stored locally for future AI text extraction and processing.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl"
        >
          <div
            {...getRootProps()}
            className={"border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 " + (
              isDragActive 
                ? 'border-yellow-400 bg-yellow-400/10 scale-105' 
                : 'border-white/30 hover:border-yellow-400/50 hover:bg-white/5'
            )}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mb-6"
            >
              <CloudArrowUpIcon className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            </motion.div>
            
            <motion.p 
              className="text-xl font-semibold text-white mb-2"
              animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
            >
              {isDragActive
                ? "Drop your files here!"
                : "Drag & drop files here, or click to select"
              }
            </motion.p>
            <p className="text-gray-400 mb-4">
              Supports: PDF, DOC, DOCX, TXT, PNG, JPG, GIF (Max 50MB each)
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
              <span className="px-3 py-1 bg-white/10 rounded-full">📄 Documents</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">🖼️ Images</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">📝 Text Files</span>
            </div>
            <div className="mt-4">
              <button
                onClick={testTextExtraction}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg border border-blue-500/30 transition-all duration-300 text-sm"
              >
                🧪 Test Text Extraction
              </button>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 space-y-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400" />
                Files Ready for Upload ({files.length})
              </h3>

              {files.map((fileObj) => (
                <motion.div
                  key={fileObj.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {fileObj.status === 'completed' ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-400" />
                      ) : fileObj.status === 'error' ? (
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                      ) : fileObj.file.type.startsWith('image/') ? (
                        <PhotoIcon className="w-6 h-6 text-purple-400" />
                      ) : (
                        <DocumentTextIcon className="w-6 h-6 text-blue-400" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{fileObj.file.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span>{fileObj.file.type} • {(fileObj.file.size / 1024 / 1024).toFixed(1)}MB</span>
                          {fileObj.canExtractText && (
                            <span className="text-green-400 text-xs">• Text extraction supported</span>
                          )}
                        </div>
                        {fileObj.status === 'completed' && fileObj.textExtracted && (
                          <p className="text-xs text-green-400 mt-1">
                            ✅ Text extracted ({fileObj.textLength} characters)
                          </p>
                        )}
                      </div>
                    </div>

                    {fileObj.status === 'ready' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeFile(fileObj.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(fileObj.status === 'processing' || fileObj.status === 'completed') && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{fileObj.stage}</span>
                        <span className="text-yellow-400">{fileObj.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            fileObj.status === 'completed' ? 'bg-green-500' :
                            fileObj.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${fileObj.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Error Details */}
                  {fileObj.status === 'error' && fileObj.processingDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                    >
                      <p className="text-sm text-red-300">{fileObj.processingDetails}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFiles([])}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium"
                >
                  Clear All
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={processFiles}
                  disabled={processing || files.filter(f => f.status === 'ready').length === 0}
                  className="flex-1 px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg"
                >
                  {processing ? '🔄 Uploading to Library...' : 
                   files.filter(f => f.status === 'ready').length > 0 ? 
                   `✨ Upload & Store ${files.filter(f => f.status === 'ready').length} Files` : 
                   '✅ All Files Uploaded'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Document Library Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mt-12 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10"
          >
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-green-400" />
                Your Document Library ({storedDocuments.length} documents)
              </div>
              <div className="flex gap-2">
                {storedDocuments.length > 0 && (
                  <button
                    onClick={processAllDocuments}
                    className="text-sm px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 rounded-lg border border-purple-500/30 transition-all duration-300 flex items-center mr-2"
                    title="Get all documents for external processing"
                  >
                    <CodeBracketIcon className="w-4 h-4 mr-1" />
                    Process All
                  </button>
                )}
                {storedDocuments.length > 0 && (
                  <button
                    onClick={deleteAllDocuments}
                    className="text-sm px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 transition-all duration-300 flex items-center"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Delete All
                  </button>
                )}
              </div>
            </h4>
            
            {storedDocuments.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h5 className="text-xl font-semibold text-gray-300 mb-2">No documents yet</h5>
                <p className="text-gray-400 mb-4">Upload your first document to start building your library</p>
                <div className="text-sm text-gray-500">
                  <p>• Supported formats: PDF, DOC, DOCX, TXT, and images</p>
                  <p>• Files are stored locally in your browser</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-white/10 rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                          onClick={() => viewDocument(doc.id)}
                        >
                          <div className="relative">
                            <DocumentTextIcon className="w-8 h-8 text-blue-400" />
                            {doc.hasText && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{doc.name}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(doc.uploadDate).toLocaleDateString()} • {(doc.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                            {doc.hasText && (
                              <p className="text-xs text-green-400 mt-1">
                                ✅ Text extracted ({doc.textContent?.length || 0} chars)
                              </p>
                            )}
                            {doc.canExtractText && !doc.hasText && (
                              <p className="text-xs text-yellow-400 mt-1">
                                ⚠️ Text extraction available
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDocument(doc.id, doc.name);
                          }}
                          className="ml-3 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 group"
                          title={`Delete ${doc.name}`}
                        >
                          <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="space-y-3 mt-4">
                        {/* Primary Actions Row */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => viewDocument(doc.id)}
                            className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl border border-blue-400/30 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <EyeIcon className="w-5 h-5 mr-2" />
                            {doc.hasText ? 'View Text' : 'View Doc'}
                          </button>
                          
                          {doc.hasText && (
                            <button
                              onClick={() => summarizeText(doc.id)}
                              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl border border-indigo-400/30 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2" />
                              Generate Summary
                            </button>
                          )}
                        </div>

                        {/* Study Materials Row */}
                        {summary && (
                          <button
                            onClick={() => handleGenerateQuizAndFlashcards(doc.id)}
                            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl border border-yellow-400/30 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <AcademicCapIcon className="w-5 h-5 mr-2" />
                            <LightBulbIcon className="w-5 h-5 mr-1" />
                            Generate Quiz & Flashcards
                          </button>
                        )}

                        {/* Secondary Actions Row */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => downloadDocument(doc.id, doc.name)}
                            className="flex items-center justify-center px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg border border-green-500/30 transition-all duration-300 text-xs"
                            title="Download original file"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => getFileForExternalProcessing(doc.id)}
                            className="flex items-center justify-center px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 rounded-lg border border-purple-500/30 transition-all duration-300 text-xs"
                            title="Get file for external processing"
                          >
                            <CodeBracketIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => exportDocumentData(doc.id, doc.name)}
                            title="Export document data as JSON"
                            className="flex items-center justify-center px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 rounded-lg border border-yellow-500/30 transition-all duration-300 text-xs"
                          >
                            📄
                          </button>
                        </div>
                      </div>

                      {/* Summary section */}
                      {summary && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-indigo-300 flex items-center">
                              <SparklesIcon className="w-4 h-4 mr-2" />
                              AI Summary
                            </h4>
                            <span className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-1 rounded-full">
                              Ready for Study
                            </span>
                          </div>
                          <div className="prose prose-invert prose-sm max-w-none">
                            {summary.split('\n').map((line, index) => {
                              if (line.startsWith('# ')) {
                                return <h3 key={index} className="text-lg font-bold text-indigo-300 mt-2 mb-3">{line.substring(2)}</h3>;
                              } else if (line.startsWith('## ')) {
                                return <h4 key={index} className="text-base font-semibold text-indigo-300 mt-3 mb-2">{line.substring(3)}</h4>;
                              } else if (line.startsWith('### ')) {
                                return <h5 key={index} className="text-sm font-medium text-indigo-300 mt-2 mb-1">{line.substring(4)}</h5>;
                              } else if (line.startsWith('• ')) {
                                return (
                                  <div key={index} className="flex items-start space-x-2 my-1">
                                    <span className="text-indigo-400 mt-1">•</span>
                                    <p className="text-sm text-gray-300 flex-1">{line.substring(2)}</p>
                                  </div>
                                );
                              } else if (line.trim()) {
                                return <p key={index} className="text-sm text-gray-300 my-1">{line}</p>;
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Documents are stored locally in your browser for privacy and offline access
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click on a document to view details • Click the trash icon to delete
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Upload