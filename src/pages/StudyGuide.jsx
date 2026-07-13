import { useState, useEffect, useCallback } from "react";
import { useSummary } from "../contexts/SummaryContext";
import ragTutorService from "../services/ragTutorService";
import documentStorage from "../services/simpleDocumentStorage";
import summarizationService from "../services/summarizationService";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  DocumentTextIcon,
  AcademicCapIcon,
  LightBulbIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CloudArrowUpIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  Bars3Icon,
  ClockIcon,
  DocumentIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const getRandomGradient = () => {
  const gradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-orange-500",
    "from-red-500 to-pink-500",
    "from-indigo-500 to-purple-500",
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

const StudyGuide = () => {
  const [activeTab, setActiveTab] = useState("summaries");
  const {
    summary,
    setSummary,
    studyMaterials,
    setStudyMaterials,
    generateStudyMaterials,
    clearStudyMaterials,
  } = useSummary();

  const [notesStyle, setNotesStyle] = useState("detailed");
  const [currentDocText, setCurrentDocText] = useState("");
  const [activeDocId, setActiveDocId] = useState(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  // Sidebar / History State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [historyDocs, setHistoryDocs] = useState([]);

  // Quiz & Flashcards State
  const [flippedCard, setFlippedCard] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // DKT Quiz Analytics States
  const [quizStarted, setQuizStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [hintsCount, setHintsCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [interactionsList, setInteractionsList] = useState([]);
  const [showMastery, setShowMastery] = useState(false);
  const [masteryData, setMasteryData] = useState(null);
  const [isLoadingMastery, setIsLoadingMastery] = useState(false);
  const [wrongConcepts, setWrongConcepts] = useState([]);

  // QnA State
  const [qnaHistory, setQnaHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  // Poll for pending/processing documents in the history
  useEffect(() => {
    const hasPendingDocs = historyDocs.some(doc => doc.status === 'pending' || doc.status === 'processing');
    if (!hasPendingDocs) return;

    console.log("🔍 Pending documents detected in history. Polling for updates...");
    const interval = setInterval(() => {
      loadHistory();
    }, 3000);

    return () => clearInterval(interval);
  }, [historyDocs]);

  const loadHistory = async () => {
    try {
      const docs = await documentStorage.getAllDocuments();
      setHistoryDocs(
        docs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)),
      );
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleDeleteDocument = async (docObj, e) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this document from your history?",
      )
    ) {
      await documentStorage.deleteDocument(docObj.id);
      loadHistory();
      if (currentDocText && summary) {
        // optional: clear if it was the active doc, but let's just leave the active view intact
      }
    }
  };

  const handleRegenerateNotes = async () => {
    if (!currentDocText) return;
    setIsProcessing(true);
    setProcessingStage(`Regenerating ${notesStyle} study notes...`);
    setProcessingProgress(50);
    try {
      const sumResult = await summarizationService.summarizeText(
        currentDocText,
        notesStyle,
      );
      if (!sumResult.success)
        throw new Error(sumResult.error || "Failed to generate notes.");
      const generatedSummary =
        typeof sumResult.summary === "string"
          ? sumResult.summary
          : sumResult.summary?.summary;
      setSummary(generatedSummary);
      
      if (activeDocId) {
        await documentStorage.updateAiResults(activeDocId, {
          summaries: { [notesStyle]: generatedSummary }
        });
        loadHistory();
      }

      setTimeout(() => setIsProcessing(false), 500);
    } catch (err) {
      alert("Error generating notes: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleDocumentClick = async (docObj) => {
    if (isProcessing) return;

    // Check if the document is still processing on the server
    if (docObj.status === 'pending' || docObj.status === 'processing') {
      alert("This document is still being analyzed on the server. Please wait a moment until it completes!");
      return;
    }
    if (docObj.status === 'failed') {
      alert("This document failed server-side text extraction. Please try deleting and re-uploading.");
      return;
    }

    setIsProcessing(true);
    setProcessingStage("Loading study notes...");
    setProcessingProgress(30);
    clearStudyMaterials();
    setSummary("");
    setCurrentQuestionIndex(0);
    setScore({ correct: 0, total: 0 });
    setShowAnswer(false);
    setSelectedAnswer(null);
    setFlippedCard(null);
    setQnaHistory([]);
    setCurrentQuestion("");
    ragTutorService.resetConversation();
    setQuizStarted(false);
    setShowMastery(false);
    setMasteryData(null);
    setInteractionsList([]);
    setAttemptsCount(0);
    setHintsCount(0);
    setShowHint(false);
    setWrongConcepts([]);

    try {
      let textToUse = docObj.textContent;
      if (!textToUse) {
        const textData = await documentStorage.getDocumentText(docObj.id);
        textToUse = textData.textContent;
      }

      setCurrentDocText(textToUse);
      setActiveDocId(docObj.id);

      const cachedSummary = docObj.summaries && docObj.summaries[notesStyle];
      const cachedMaterials = docObj.studyMaterials && docObj.studyMaterials.isGenerated;

      if (cachedSummary && cachedMaterials) {
        setProcessingStage(`Loading cached ${notesStyle} notes and materials...`);
        setProcessingProgress(90);
        setSummary(cachedSummary);
        setStudyMaterials(docObj.studyMaterials);
        setProcessingProgress(100);
        setProcessingStage("Done!");
        setTimeout(() => {
          setIsProcessing(false);
          setActiveTab("summaries");
          setCurrentQuestionIndex(0);
          setScore({ correct: 0, total: 0 });
          setShowAnswer(false);
          setSelectedAnswer(null);
        }, 500);
        return;
      }

      setProcessingStage(`Generating ${notesStyle} study notes...`);
      setProcessingProgress(50);
      let finalSummary = cachedSummary;
      if (!cachedSummary) {
        const sumResult = await summarizationService.summarizeText(textToUse, notesStyle);
        if (!sumResult.success) throw new Error(sumResult.error || "Failed to generate notes.");
        finalSummary = typeof sumResult.summary === "string" ? sumResult.summary : sumResult.summary?.summary;
      }
      setSummary(finalSummary);

      let finalMaterials = docObj.studyMaterials;
      if (!cachedMaterials) {
        setProcessingStage("Crafting exact questions and flashcards from source...");
        setProcessingProgress(75);
        finalMaterials = await generateStudyMaterials(textToUse);
      } else {
        setStudyMaterials(finalMaterials);
      }

      await documentStorage.updateAiResults(docObj.id, {
        summaries: { [notesStyle]: finalSummary },
        studyMaterials: finalMaterials
      });
      loadHistory();

      setProcessingProgress(100);
      setProcessingStage("Done!");
      setTimeout(() => {
        setIsProcessing(false);
        setActiveTab("summaries");
        setCurrentQuestionIndex(0);
        setScore({ correct: 0, total: 0 });
        setShowAnswer(false);
        setSelectedAnswer(null);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Error loading document: " + err.message);
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      setIsProcessing(true);
      setProcessingStage("Extracting text from document...");
      setProcessingProgress(25);
      clearStudyMaterials();
      setSummary("");
      setCurrentQuestionIndex(0);
      setScore({ correct: 0, total: 0 });
      setShowAnswer(false);
      setSelectedAnswer(null);
      setFlippedCard(null);
      setQnaHistory([]);
      setCurrentQuestion("");
      ragTutorService.resetConversation();
      setQuizStarted(false);
      setShowMastery(false);
      setMasteryData(null);
      setInteractionsList([]);
      setAttemptsCount(0);
      setHintsCount(0);
      setShowHint(false);
      setWrongConcepts([]);

      try {
        const storeResult = await documentStorage.storeDocument(
          file,
          (prog) => {
            if (prog.progress) setProcessingProgress(prog.progress * 0.4); // 0-40% for upload stage
          },
        );

        const docId = storeResult.documentId;
        setActiveDocId(docId);
        
        // Refresh history to show new doc (in pending state)
        loadHistory();

        // Start polling for server-side processing completion
        setProcessingStage("Server is analyzing document content (this may take a few seconds)...");
        setProcessingProgress(50);

        let finishedDoc = null;
        const pollInterval = 2000;

        while (!finishedDoc) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          const docCheck = await documentStorage.getDocument(docId);
          if (docCheck) {
            if (docCheck.status === 'completed') {
              finishedDoc = docCheck;
            } else if (docCheck.status === 'failed') {
              throw new Error("Server failed to extract text from this document. Please verify the file is not corrupted.");
            } else {
              // Document is still processing
              setProcessingStage(`Server is analyzing document... (Status: ${docCheck.status})`);
            }
          } else {
            throw new Error("Unable to retrieve document status from server.");
          }
        }

        setProcessingProgress(60);
        
        // Fetch the extracted text from MongoDB
        const textData = await documentStorage.getDocumentText(docId);
        setCurrentDocText(textData.textContent);

        setProcessingStage(
          `Analyzing content & generating smart ${notesStyle} notes (this may take a minute)...`,
        );
        setProcessingProgress(70);
        
        const sumResult = await summarizationService.summarizeText(
          textData.textContent,
          notesStyle,
        );

        if (!sumResult.success)
          throw new Error(sumResult.error || "Failed to generate notes.");

        const generatedSummary =
          typeof sumResult.summary === "string"
            ? sumResult.summary
            : sumResult.summary?.summary;
        setSummary(generatedSummary);

        setProcessingStage(
          "Crafting interactive flashcards & practice quiz automatically...",
        );
        setProcessingProgress(85);
        
        // Pass raw text to generator
        const generatedMaterials = await generateStudyMaterials(textData.textContent);

        await documentStorage.updateAiResults(docId, {
          summaries: { [notesStyle]: generatedSummary },
          studyMaterials: generatedMaterials
        });
        
        loadHistory();

        setProcessingProgress(100);
        setProcessingStage("Done!");
        setTimeout(() => {
          setIsProcessing(false);
          setActiveTab("summaries");
        }, 1000);
      } catch (error) {
        console.error("Processing error:", error);
        alert("Error: " + error.message);
        setIsProcessing(false);
      }
    },
    [clearStudyMaterials, setSummary, setStudyMaterials, generateStudyMaterials, notesStyle],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "text/*": [".txt", ".md"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const startQuiz = () => {
    setQuizStarted(true);
    setShowMastery(false);
    setMasteryData(null);
    setScore({ correct: 0, total: 0 });
    setCurrentQuestionIndex(0);
    setInteractionsList([]);
    setStartTime(Date.now());
    setAttemptsCount(0);
    setHintsCount(0);
    setShowHint(false);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setWrongConcepts([]);
  };

  const retakeQuiz = () => {
    startQuiz();
  };

  const submitQuizResults = async (finalInteractions) => {
    setIsLoadingMastery(true);
    try {
      const prediction = await ragTutorService.getDKTMasteryPrediction(finalInteractions);
      setMasteryData(prediction);
      setShowMastery(true);
    } catch (err) {
      console.error(err);
      alert("Failed to evaluate mastery level: " + err.message);
    } finally {
      setIsLoadingMastery(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer !== null && studyMaterials.questions.length > 0) {
      const currentQ = studyMaterials.questions[currentQuestionIndex];
      const isCorrect = selectedAnswer === currentQ.correctAnswer;
      
      setScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

      // Calculate response speed metrics
      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      const timeTaken = Math.min(elapsedSeconds, 60); // Cap at 60s
      
      const newInteraction = {
        is_correct: isCorrect ? 1 : 0,
        time_taken: timeTaken,
        attempt_count: Math.max(attemptsCount, 1),
        hint_count: hintsCount
      };

      setInteractionsList((prev) => [...prev, newInteraction]);
      setShowAnswer(true);
    }
  };

  const nextQuestion = () => {
    const isLastQuestion = currentQuestionIndex >= studyMaterials.questions.length - 1;
    
    setSelectedAnswer(null);
    setShowAnswer(false);
    setShowHint(false);
    setAttemptsCount(0);
    setHintsCount(0);

    if (studyMaterials.questions.length > 0) {
      if (isLastQuestion) {
        // Compile incorrect concepts to review
        const reviewList = [];
        interactionsList.forEach((interaction, idx) => {
          if (interaction.is_correct === 0) {
            const questionObj = studyMaterials.questions[idx];
            if (questionObj) {
              const explanation = questionObj.explanation || "";
              const firstSentence = explanation.split(/[.!?]/)[0] || "Review this concept.";
              reviewList.push({
                question: questionObj.question,
                concept: firstSentence.trim() + "."
              });
            }
          }
        });
        setWrongConcepts(reviewList);

        submitQuizResults(interactionsList);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setStartTime(Date.now());
      }
    }
  };

  const shuffleFlashcards = () => setFlippedCard(null);

  const generateAnswer = async (question) => {
    if (!question.trim()) return;
    if (!activeDocId) {
      const warnQnA = {
        id: Date.now(),
        question: question.trim(),
        answer: "⚠️ Please select or upload a document first so I can answer questions about it!",
        timestamp: new Date().toLocaleTimeString(),
        type: "error",
      };
      setQnaHistory((prev) => [...prev, warnQnA]);
      return;
    }

    const qnaId = Date.now();
    const initialQnA = {
      id: qnaId,
      question: question.trim(),
      answer: "",
      timestamp: new Date().toLocaleTimeString(),
      type: "success",
    };
    setQnaHistory((prev) => [...prev, initialQnA]);
    setCurrentQuestion("");
    setIsLoadingAnswer(true);

    try {
      await ragTutorService.generateAnswer(
        question,
        activeDocId,
        qnaHistory.map((q) => ({ question: q.question, answer: q.answer })),
        (chunk) => {
          setQnaHistory((prev) =>
            prev.map((q) =>
              q.id === qnaId ? { ...q, answer: q.answer + chunk } : q
            )
          );
        }
      );
    } catch (error) {
      console.error("RAG Tutor Error:", error);
      setQnaHistory((prev) =>
        prev.map((q) =>
          q.id === qnaId
            ? {
                ...q,
                answer: "I'm sorry, I had trouble generating an answer. Please try again in a moment.",
                type: "error",
              }
            : q
        )
      );
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (currentQuestion.trim()) generateAnswer(currentQuestion);
  };

  const getSmartQuestionSuggestions = () => {
    if (!currentDocText && !summary) return [];
    return ragTutorService.getSmartSuggestions(currentDocText || "");
  };

  const tabs = [
    {
      id: "summaries",
      label: "Study Notes",
      icon: DocumentTextIcon,
      count: summary ? 1 : 0,
    },
    {
      id: "flashcards",
      label: "Flashcards",
      icon: LightBulbIcon,
      count: studyMaterials?.flashcards?.length || 0,
    },
    {
      id: "quiz",
      label: "Practice Quiz",
      icon: AcademicCapIcon,
      count: studyMaterials?.questions?.length || 0,
    },
    {
      id: "qna",
      label: "AI Tutor",
      icon: ChatBubbleLeftRightIcon,
      count: qnaHistory.length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1015] text-white flex overflow-hidden font-sans">
      {/* Sidebar - Local Document History */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-screen bg-black/40 border-r border-white/10 flex flex-col shrink-0 flex-nowrap overflow-hidden backdrop-blur-xl relative z-20"
          >
            <div className="p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold flex items-center text-white">
                <ClockIcon className="w-6 h-6 mr-3 text-blue-400" />
                History
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {historyDocs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No previous documents.
                </p>
              ) : (
                historyDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleDocumentClick(doc)}
                    className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/40 transition-all flex flex-col items-start gap-2 group cursor-pointer relative"
                  >
                    <div className="flex items-center w-full pr-8">
                      <DocumentIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 mr-2 shrink-0" />
                      <span className="truncate font-medium text-gray-200 group-hover:text-white">
                        {doc.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full mt-1 pr-8">
                      <span className="text-xs text-gray-500">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </span>
                      {doc.status === 'pending' || doc.status === 'processing' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold animate-pulse">
                          Analyzing...
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold">
                          Failed
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={(e) => handleDeleteDocument(doc, e)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      title="Delete document"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 h-screen overflow-y-auto relative custom-scrollbar flex flex-col">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-10 w-full">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition backdrop-blur-md border border-white/10"
            >
              <Bars3Icon className="w-6 h-6 text-white" />
            </button>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center flex-1"
            >
              <div className="flex items-center justify-center mb-2">
                <SparklesIcon className="w-8 h-8 text-blue-400 mr-3" />
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  Study Workspace
                </h1>
              </div>
              <p className="text-md text-gray-400 max-w-2xl mx-auto">
                Upload your document, and let AI build you a comprehensive
                Cornell study guide.
              </p>
            </motion.div>
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {!summary && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center -mt-20"
            >
              <div
                {...getRootProps()}
                className={`w-full max-w-3xl border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 bg-white/5 backdrop-blur-xl ${isDragActive ? "border-blue-400 bg-blue-500/10 scale-105" : "border-white/10 hover:border-blue-400/50 hover:bg-white/10"}`}
              >
                <input {...getInputProps()} />
                <CloudArrowUpIcon className="w-24 h-24 text-blue-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4 text-white">
                  Drag & drop your document here
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                  PDF, DOCX, TXT, or Images (Max 50MB)
                </p>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mx-auto mb-8 flex items-center bg-black/40 p-1.5 rounded-full border border-white/10 w-max"
                >
                  <button
                    onClick={() => setNotesStyle("detailed")}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${notesStyle === "detailed" ? "bg-white/20 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                  >
                    Detailed Cornell Notes
                  </button>
                  <button
                    onClick={() => setNotesStyle("concise")}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${notesStyle === "concise" ? "bg-white/20 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                  >
                    Concise Summary
                  </button>
                </div>
                <button className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-lg transition shadow-lg shadow-blue-500/30">
                  Browse Files
                </button>
              </div>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full -mt-20"
            >
              <div className="w-24 h-24 mb-8 relative">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                <SparklesIcon className="w-10 h-10 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Applying AI Magic...
              </h2>
              <p className="text-xl text-gray-300 mb-8">{processingStage}</p>
              <div className="w-full bg-white/10 rounded-full h-3 mb-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                ></motion.div>
              </div>
              <p className="text-sm text-gray-400">
                {Math.round(processingProgress)}% Complete
              </p>
            </motion.div>
          )}

          {summary && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex-1 flex flex-col"
            >
              <div className="flex flex-wrap justify-center mb-8 gap-3">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 ${isActive ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 transform scale-105" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"}`}
                    >
                      <TabIcon
                        className={`w-5 h-5 mr-2 ${isActive ? "text-white" : "text-blue-400"}`}
                      />
                      {tab.label}
                      <span
                        className={`ml-3 px-2.5 py-0.5 rounded-full text-xs ${isActive ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-400"}`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}

                {activeTab === "summaries" && currentDocText && (
                  <div className="ml-auto items-center bg-black/40 p-1 rounded-full border border-white/10 hidden md:flex">
                    <button
                      onClick={() => setNotesStyle("detailed")}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition ${notesStyle === "detailed" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                      Detailed
                    </button>
                    <button
                      onClick={() => setNotesStyle("concise")}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition ${notesStyle === "concise" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"}`}
                    >
                      Concise
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                    <button
                      onClick={handleRegenerateNotes}
                      className="flex items-center px-4 py-2 text-xs font-semibold text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-full transition"
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-1.5" /> Regenerate
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Upload a new document? This will close the current active notes.",
                      )
                    ) {
                      setSummary("");
                      clearStudyMaterials();
                      setCurrentQuestionIndex(0);
                      setScore({ correct: 0, total: 0 });
                      setShowAnswer(false);
                      setSelectedAnswer(null);
                      setFlippedCard(null);
                      setQnaHistory([]);
                      setCurrentQuestion("");
                    }
                  }}
                  className={`${activeTab === "summaries" ? "ml-4" : "ml-auto"} flex items-center px-5 py-3 rounded-full font-semibold text-gray-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10 border-dashed`}
                >
                  <CloudArrowUpIcon className="w-5 h-5 mr-2 text-blue-400" />{" "}
                  New Upload
                </button>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl flex-1 flex flex-col h-full overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === "summaries" && (
                    <motion.div
                      key="summaries"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="prose prose-invert prose-lg max-w-none prose-headings:text-transparent prose-headings:bg-clip-text prose-headings:bg-gradient-to-r prose-headings:from-blue-400 prose-headings:to-purple-400 prose-a:text-blue-400 flex-1 overflow-y-auto custom-scrollbar pr-4"
                    >
                      <div
                        className="markdown-content"
                        dangerouslySetInnerHTML={{
                          __html: summary
                            .replace(/\n/g, "<br/>")
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/### (.*?)<br\/>/g, "<h3>$1</h3>")
                            .replace(/## (.*?)<br\/>/g, "<h2>$1</h2>")
                            .replace(/# (.*?)<br\/>/g, "<h1>$1</h1>")
                            .replace(/- (.*?)<br\/>/g, "<li>$1</li>"),
                        }}
                      />
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `
                        .markdown-content h1 { font-size: 2.8rem; margin-bottom: 2rem; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; }
                        .markdown-content h2 { font-size: 2rem; margin-top: 3rem; margin-bottom: 1rem; font-weight: 800; color: #60a5fa !important; -webkit-text-fill-color: #60a5fa; }
                        .markdown-content h3 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; font-weight: 700; color: #a5b4fc !important; -webkit-text-fill-color: #a5b4fc; }
                        .markdown-content li { margin-bottom: 0.75rem; list-style-type: disc; margin-left: 1.5rem; line-height: 1.6; }
                        .markdown-content strong { color: #fff; }
                      `,
                        }}
                      />
                    </motion.div>
                  )}

                  {activeTab === "flashcards" && (
                    <motion.div
                      key="flashcards"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex-1 overflow-y-auto custom-scrollbar h-full pr-4 pb-8"
                    >
                      <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#16171d]/80 backdrop-blur-md pt-2 pb-4 z-10 rounded-b-xl border-b border-white/5">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                          Interactive Flashcards
                        </h2>
                        <button
                          onClick={shuffleFlashcards}
                          className="flex items-center px-5 py-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition font-medium"
                        >
                          <ArrowPathIcon className="w-5 h-5 mr-2" /> Reset View
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {studyMaterials?.flashcards?.map((card, index) => {
                          const isFlipped = flippedCard === index;
                          return (
                            <div
                              key={index}
                              className="relative w-full h-[320px] cursor-pointer group perspective-1000"
                              onClick={() =>
                                setFlippedCard(isFlipped ? null : index)
                              }
                            >
                              <motion.div
                                className="w-full h-full relative preserve-3d transition-transform duration-700"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                              >
                                <div
                                  className={`absolute inset-0 w-full h-full bg-gradient-to-br ${getRandomGradient()} rounded-3xl p-8 flex flex-col justify-between text-white backface-hidden shadow-xl border border-white/20`}
                                >
                                  <div>
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 bg-black/30 backdrop-blur-md`}
                                    >
                                      {card.category}
                                    </span>
                                    <h3 className="text-2xl font-bold leading-tight">
                                      {card.front}
                                    </h3>
                                  </div>
                                  <p className="text-sm font-medium opacity-70 text-center uppercase tracking-widest flex items-center justify-center">
                                    <ArrowPathIcon className="w-4 h-4 mr-2" />{" "}
                                    Tap to flip
                                  </p>
                                </div>
                                <div
                                  className="absolute inset-0 w-full h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col justify-center text-white backface-hidden shadow-xl"
                                  style={{ transform: "rotateY(180deg)" }}
                                >
                                  <p className="text-xl font-medium leading-relaxed text-center text-blue-100">
                                    {card.back}
                                  </p>
                                </div>
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "quiz" && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex-1 overflow-y-auto custom-scrollbar h-full pr-4 pb-8"
                    >
                      {(() => {
                        if (!studyMaterials?.questions?.length) {
                          return (
                            <p className="text-center text-gray-400 py-12 text-xl">
                              No questions generated yet. Try re-uploading the
                              document.
                            </p>
                          );
                        }

                        // State 1: Quiz Loader
                        if (isLoadingMastery) {
                          return (
                            <div className="flex flex-col items-center justify-center text-center p-12 max-w-2xl mx-auto my-auto h-full justify-center">
                              <div className="w-20 h-20 mb-8 relative">
                                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                                <SparklesIcon className="w-10 h-10 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                              </div>
                              <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Calculating Mastery Roadmap...
                              </h2>
                              <p className="text-gray-400">
                                Our PyTorch LSTM Model is assessing your response patterns.
                              </p>
                            </div>
                          );
                        }

                        // State 2: Mastery Dashboard Results
                        if (showMastery && masteryData) {
                          const percentage = Math.round(masteryData.mastery_probability * 100);
                          
                          let difficultyBadge = "bg-green-500/20 text-green-400 border-green-500/30";
                          if (masteryData.suggested_difficulty === "easy") {
                            difficultyBadge = "bg-red-500/20 text-red-400 border-red-500/30";
                          } else if (masteryData.suggested_difficulty === "medium") {
                            difficultyBadge = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                          }

                          return (
                            <div className="max-w-4xl mx-auto h-full flex flex-col overflow-y-auto custom-scrollbar pr-2 pb-10">
                              <div className="text-center mb-10 shrink-0">
                                <h2 className="text-3xl font-extrabold text-white mb-2">
                                  Knowledge Mastery Assessment
                                </h2>
                                <p className="text-gray-400">Powered by PyTorch Deep Knowledge Tracing</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 shrink-0">
                                {/* Score Card */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-md">
                                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Quiz Score</span>
                                  <span className="text-4xl font-extrabold text-blue-400 mb-1">{score.correct} / {score.total}</span>
                                  <span className="text-xs text-gray-500">Correct answers</span>
                                </div>

                                {/* Mastery Gauge */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-md relative overflow-hidden">
                                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Mastery Level</span>
                                  <span className="text-4xl font-extrabold text-purple-400 mb-1">{percentage}%</span>
                                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                                  </div>
                                </div>

                                {/* Recommended Difficulty */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-md">
                                  <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Recommendation</span>
                                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${difficultyBadge} mt-1 mb-2 capitalize`}>
                                    {masteryData.suggested_difficulty} Path
                                  </span>
                                  <span className="text-xs text-gray-500">Suggested study track</span>
                                </div>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-10 backdrop-blur-md shrink-0">
                                <h3 className="text-xl font-bold mb-4 flex items-center text-blue-400">
                                  <SparklesIcon className="w-6 h-6 mr-2" />
                                  Model Assessment
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-lg">
                                  {masteryData.detail}
                                </p>
                              </div>

                              {/* Wrong Concepts Card */}
                              {wrongConcepts.length > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-10 backdrop-blur-md shrink-0">
                                  <h3 className="text-xl font-bold mb-4 flex items-center text-red-400">
                                    <XCircleIcon className="w-6 h-6 mr-2" />
                                    Targeted Concepts to Review
                                  </h3>
                                  <p className="text-gray-400 mb-6 text-base">
                                    Based on your quiz performance, we recommend reviewing these specific topics:
                                  </p>
                                  <div className="space-y-4">
                                    {wrongConcepts.map((item, idx) => (
                                      <div key={idx} className="flex items-start bg-red-500/5 border border-red-500/10 rounded-2xl p-5">
                                        <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-xs mr-4 shrink-0 mt-0.5">
                                          {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-white font-semibold text-lg leading-snug">{item.question}</p>
                                          <p className="text-gray-300 text-base mt-2 flex items-start gap-1.5">
                                            <span className="text-red-400 font-bold shrink-0">💡 Topic to revise:</span>
                                            <span className="text-red-100/90 font-medium">{item.concept}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recommended Roadmap */}
                              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-10 backdrop-blur-md">
                                <h3 className="text-xl font-bold mb-6 text-purple-400 flex items-center">
                                  <ClockIcon className="w-6 h-6 mr-2" />
                                  Your Personalized Learning Roadmap
                                </h3>
                                <div className="relative pl-8 border-l border-white/10 space-y-8">
                                  {masteryData.learning_path.map((step, idx) => (
                                    <div key={idx} className="relative">
                                      <div className="absolute -left-[45px] top-1 bg-blue-600 w-8 h-8 rounded-full border-4 border-[#16171d] flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                        {step.step}
                                      </div>
                                      <div>
                                        <h4 className="font-extrabold text-white text-lg flex items-center gap-2">
                                          {step.action}
                                        </h4>
                                        <p className="text-gray-400 mt-1 leading-relaxed">{step.description}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-center mt-4">
                                <button
                                  onClick={retakeQuiz}
                                  className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold text-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/40 hover:scale-105"
                                >
                                  Retake Quiz
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // State 3: Quiz Landing Card
                        if (!quizStarted) {
                          return (
                            <div className="flex flex-col items-center justify-center text-center p-12 max-w-2xl mx-auto my-auto h-full justify-center">
                              <AcademicCapIcon className="w-20 h-20 text-blue-400 mb-6 animate-bounce" />
                              <h2 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Ready to test your Knowledge?
                              </h2>
                              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                                This quiz contains exactly {studyMaterials.questions.length} questions. Our PyTorch Deep Knowledge Tracing engine will analyze your answers, response times, attempts, and hint requests in the background to build your personalized mastery roadmap!
                              </p>
                              <button
                                onClick={startQuiz}
                                className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full font-bold text-xl transition-all duration-300 shadow-lg shadow-blue-500/40 hover:scale-105"
                              >
                                Start Quiz
                              </button>
                            </div>
                          );
                        }

                        // State 4: Active Question Rendering
                        const currentQ = studyMaterials.questions[currentQuestionIndex];
                        return (
                          <div className="max-w-4xl mx-auto h-full flex flex-col">
                            <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10 shrink-0">
                              <h2 className="text-2xl font-bold text-white">
                                Practice Quiz
                              </h2>
                              <div className="flex items-center space-x-6">
                                <span className="text-lg text-blue-400 font-medium tracking-wide">
                                  Question {currentQuestionIndex + 1} of{" "}
                                  {studyMaterials.questions.length}
                                </span>
                                <div className="flex items-center px-5 py-2.5 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                                  <TrophyIcon className="w-5 h-5 text-yellow-500 mr-2" />
                                  <span className="text-yellow-400 font-bold text-lg">
                                    {score.correct} / {score.total}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                              <div className="flex items-start justify-between mb-8 gap-4">
                                <h3 className="text-3xl font-semibold text-white leading-tight flex-1">
                                  {currentQ.question}
                                </h3>
                                <button
                                  disabled={showAnswer}
                                  onClick={() => {
                                    setShowHint((prev) => !prev);
                                    setHintsCount((prev) => prev + 1);
                                  }}
                                  className="px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition flex items-center text-sm font-semibold shrink-0"
                                >
                                  <LightBulbIcon className="w-4 h-4 mr-1.5" />
                                  {showHint ? "Hide Hint" : "Get Hint"}
                                </button>
                              </div>

                              {showHint && currentQ.explanation && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl mb-8 text-purple-200 text-sm leading-relaxed"
                                >
                                  <strong>💡 Hint:</strong> {currentQ.explanation.split('.')[0]}. Think about the core definition.
                                </motion.div>
                              )}

                              <div className="space-y-4 mb-10">
                                {currentQ.options.map((option, index) => {
                                  const isSelected = selectedAnswer === index;
                                  const isCorrectAnswer =
                                    index === currentQ.correctAnswer;

                                  let btnStyles =
                                    "bg-white/5 hover:bg-white/10 border-white/10 text-gray-200 hover:border-blue-500/30";
                                  if (showAnswer) {
                                    if (isCorrectAnswer)
                                      btnStyles =
                                        "bg-green-500/20 border-green-500/50 text-green-300 ring-1 ring-green-500/50";
                                    else if (isSelected && !isCorrectAnswer)
                                      btnStyles =
                                        "bg-red-500/20 border-red-500/50 text-red-300";
                                  } else if (isSelected) {
                                    btnStyles =
                                      "bg-blue-500/20 border-blue-500/50 text-blue-300 ring-2 ring-blue-500/50";
                                  }

                                  return (
                                    <button
                                      key={index}
                                      disabled={showAnswer}
                                      onClick={() => {
                                        setSelectedAnswer(index);
                                        setAttemptsCount((prev) => prev + 1);
                                      }}
                                      className={`w-full p-6 text-left rounded-2xl border-2 transition-all duration-300 flex items-center ${btnStyles}`}
                                    >
                                      <div
                                        className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mr-5 font-bold ${isSelected || (showAnswer && isCorrectAnswer) ? "bg-current/20 text-current" : "bg-white/10 text-gray-400"}`}
                                      >
                                        {String.fromCharCode(65 + index)}
                                      </div>
                                      <span className="text-xl leading-snug">
                                        {option}
                                      </span>
                                      {showAnswer && isCorrectAnswer && (
                                        <CheckCircleIcon className="w-8 h-8 ml-auto text-green-400 flex-shrink-0" />
                                      )}
                                      {showAnswer &&
                                        isSelected &&
                                        !isCorrectAnswer && (
                                          <XCircleIcon className="w-8 h-8 ml-auto text-red-400 flex-shrink-0" />
                                        )}
                                    </button>
                                  );
                                })}
                              </div>

                              {showAnswer && currentQ.explanation && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl mb-8"
                                >
                                  <h4 className="font-bold text-blue-400 mb-2 flex items-center text-lg">
                                    <LightBulbIcon className="w-6 h-6 mr-2" />{" "}
                                    Explanation
                                  </h4>
                                  <p className="text-blue-100 text-lg leading-relaxed">
                                    {currentQ.explanation}
                                  </p>
                                </motion.div>
                              )}
                            </div>

                            <div className="flex justify-end shrink-0 pt-6 border-t border-white/5 mt-auto">
                              {!showAnswer ? (
                                <button
                                  onClick={handleAnswerSubmit}
                                  disabled={selectedAnswer === null}
                                  className={`px-10 py-4 rounded-full font-bold text-xl transition-all duration-300 ${selectedAnswer === null ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/40 hover:scale-105"}`}
                                >
                                  Submit Answer
                                </button>
                              ) : (
                                <button
                                  onClick={nextQuestion}
                                  className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-bold text-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-blue-500/40 hover:scale-105"
                                >
                                  {currentQuestionIndex < studyMaterials.questions.length - 1
                                    ? "Next Question"
                                    : "View Mastery Roadmap"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {activeTab === "qna" && (
                    <motion.div
                      key="qna"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="max-w-4xl mx-auto flex flex-col h-full w-full"
                    >
                      <div className="text-center mb-8 shrink-0">
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                          AI Tutor
                        </h2>
                        <p className="text-gray-400">
                          Ask any question about your document, and get instant,
                          context-aware answers.
                        </p>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-4 space-y-6 mb-6 custom-scrollbar">
                        {qnaHistory.length === 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            {getSmartQuestionSuggestions().map(
                              (suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentQuestion(suggestion)}
                                  className="text-left p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition group"
                                >
                                  <span className="text-blue-400 font-bold block mb-2 text-sm uppercase tracking-wider">
                                    Suggestion {index + 1}
                                  </span>
                                  <span className="text-gray-200 group-hover:text-white transition text-lg">
                                    {suggestion}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        ) : (
                          qnaHistory.map((qna) => (
                            <div key={qna.id} className="space-y-4">
                              <div className="flex justify-end">
                                <div className="bg-blue-600 text-white p-5 rounded-3xl rounded-tr-sm max-w-[80%] shadow-lg">
                                  <p className="text-lg">{qna.question}</p>
                                </div>
                              </div>
                              <div className="flex justify-start">
                                <div
                                  className={`p-6 rounded-3xl rounded-tl-sm max-w-[90%] shadow-lg ${qna.type === "error" ? "bg-red-500/10 border border-red-500/30" : "bg-white/5 backdrop-blur-md border border-white/10"}`}
                                >
                                  <div className="flex items-center space-x-2 mb-3">
                                    <SparklesIcon
                                      className={`w-5 h-5 ${qna.type === "error" ? "text-red-400" : "text-cyan-400"}`}
                                    />
                                    <span className="font-bold text-sm uppercase tracking-wider text-gray-400">
                                      AI Tutor
                                    </span>
                                  </div>
                                    <div
                                    className={`text-base leading-relaxed ${qna.type === "error" ? "text-red-200" : "text-gray-200"}`}
                                  >
                                    <ReactMarkdown
                                      components={{
                                        h1: ({ children }) => <h1 className="text-xl font-bold text-blue-200 mt-4 mb-2">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-lg font-bold text-blue-300 mt-4 mb-2">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-base font-bold text-blue-300 mt-3 mb-1">{children}</h3>,
                                        h4: ({ children }) => <h4 className="text-sm font-bold text-blue-400 mt-2 mb-1">{children}</h4>,
                                        p: ({ children }) => <p className="my-2">{children}</p>,
                                        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                                        em: ({ children }) => <em className="text-blue-200 italic">{children}</em>,
                                        ul: ({ children }) => <ul className="list-disc ml-5 my-2 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal ml-5 my-2 space-y-1">{children}</ol>,
                                        li: ({ children }) => <li className="text-gray-200">{children}</li>,
                                        code: ({ children, inline }) => inline
                                          ? <code className="bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded text-sm">{children}</code>
                                          : <pre className="bg-black/40 border border-white/10 rounded-xl p-4 my-3 overflow-x-auto"><code className="text-cyan-300 text-sm">{children}</code></pre>,
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500/50 pl-4 my-3 text-gray-300 italic">{children}</blockquote>,
                                      }}
                                    >
                                      {qna.answer || ""}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <form
                        onSubmit={handleQuestionSubmit}
                        className="shrink-0 relative mt-auto border-t border-white/5 pt-6"
                      >
                        <input
                          type="text"
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                          placeholder="Type your question here..."
                          className="w-full pl-8 pr-16 py-5 bg-black/40 border border-white/20 rounded-full text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all shadow-inner"
                          disabled={isLoadingAnswer}
                        />
                        <button
                          type="submit"
                          disabled={!currentQuestion.trim() || isLoadingAnswer}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-3 mt-3 rounded-full transition-all ${currentQuestion.trim() && !isLoadingAnswer ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/40" : "bg-white/5 text-gray-500 cursor-not-allowed"}`}
                        >
                          {isLoadingAnswer ? (
                            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <PaperAirplaneIcon className="w-6 h-6" />
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `,
        }}
      />
    </div>
  );
};

export default StudyGuide;
