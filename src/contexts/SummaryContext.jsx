import React, { createContext, useContext, useState } from "react";
import studyMaterialGenerator from "../services/studyMaterialGenerator";

const SummaryContext = createContext();

export const useSummary = () => useContext(SummaryContext);

export const SummaryProvider = ({ children }) => {
  const [summary, setSummary] = useState("");
  const [studyMaterials, setStudyMaterials] = useState({
    questions: [],
    flashcards: [],
    isGenerated: false,
  });
  const [qnaHistory, setQnaHistory] = useState([]);

  const generateStudyMaterials = async (documentText) => {
    if (!documentText) return;

    try {
      const materials =
        await studyMaterialGenerator.generateStudyMaterials(documentText);
      setStudyMaterials(materials);
    } catch (err) {
      console.error("Failed to generate materials in context:", err);
    }
  };

  const clearStudyMaterials = () => {
    setStudyMaterials({
      questions: [],
      flashcards: [],
      isGenerated: false,
    });
    setQnaHistory([]);
  };

  return (
    <SummaryContext.Provider
      value={{
        summary,
        setSummary,
        studyMaterials,
        generateStudyMaterials,
        clearStudyMaterials,
        qnaHistory,
        setQnaHistory,
      }}
    >
      {children}
    </SummaryContext.Provider>
  );
};
