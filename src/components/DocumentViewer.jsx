import { useState } from 'react';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export const DocumentViewer = ({ 
  isOpen, 
  onClose, 
  documentData, 
  onGenerateSummary, 
  summary, 
  isGeneratingSummary 
}) => {
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  
  const getShortenedSummary = (text) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= 20) return text;
    return words.slice(0, 20).join(' ') + '...';
  };
  
  if (!isOpen || !documentData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl m-4">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">📄 {documentData.documentName}</h2>
            <p className="text-sm text-blue-100">Extracted Text Content</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <strong>Extraction Method:</strong> {documentData.textExtractionMethod}
              </div>
              <div>
                <strong>Extracted At:</strong>{' '}
                {new Date(documentData.extractedAt).toLocaleString()}
              </div>
              <div>
                <strong>Text Length:</strong> {documentData.textContent.length} characters
              </div>
            </div>
          </div>

          {/* Summary Button */}
          <div className="flex justify-center mb-6">
            {summary ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSummaryModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <DocumentTextIcon className="w-6 h-6" />
                <span className="text-lg font-semibold">View Document Summary</span>
              </motion.button>
            ) : (
              <div className="text-center py-4">
                {isGeneratingSummary ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600">Generating summary...</p>
                  </div>
                ) : (
                  <button
                    onClick={onGenerateSummary}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate Summary
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {documentData.textContent}
            </pre>
          </div>
        </div>

        {/* Summary Modal */}
        <AnimatePresence>
          {showSummaryModal && summary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
              onClick={() => setShowSummaryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-[70%] max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Summary Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Document Summary</h2>
                    <p className="text-blue-100">AI-Generated Overview</p>
                  </div>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Summary Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
                  <div className="prose prose-lg max-w-none">
                    {!showFullSummary ? (
                      <div>
                        <p className="text-gray-600 leading-relaxed">
                          {getShortenedSummary(summary)}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowFullSummary(true)}
                          className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors inline-flex items-center gap-2"
                        >
                          <span>Show Full Summary</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </motion.button>
                      </div>
                    ) : (
                      summary.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return (
                          <h2 key={index} className="text-3xl font-bold text-gray-900 mt-6 mb-4">
                            {line.substring(2)}
                          </h2>
                        );
                      } else if (line.startsWith('## ')) {
                        return (
                          <h3 key={index} className="text-2xl font-semibold text-gray-800 mt-5 mb-3">
                            {line.substring(3)}
                          </h3>
                        );
                      } else if (line.startsWith('### ')) {
                        return (
                          <h4 key={index} className="text-xl font-medium text-gray-700 mt-4 mb-2">
                            {line.substring(4)}
                          </h4>
                        );
                      } else if (line.startsWith('• ')) {
                        return (
                          <div key={index} className="flex items-start space-x-3 my-2">
                            <span className="text-blue-500 mt-1 text-xl">•</span>
                            <p className="text-gray-600 flex-1">{line.substring(2)}</p>
                          </div>
                        );
                      } else if (line.trim()) {
                        return (
                          <p key={index} className="text-gray-600 my-3 leading-relaxed">
                            {line}
                          </p>
                        );
                      }
                      return null;
                    }))
                    }
                    {showFullSummary && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowFullSummary(false)}
                        className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors inline-flex items-center gap-2"
                      >
                        <span>Show Less</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-180" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};