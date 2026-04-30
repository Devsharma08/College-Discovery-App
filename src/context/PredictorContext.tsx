import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { College } from '../types';

interface PredictorContextType {
  rank: string;
  setRank: (rank: string) => void;
  exam: string;
  setExam: (exam: string) => void;
  category: string;
  setCategory: (category: string) => void;
  results: College[];
  setResults: (results: College[]) => void;
  hasSearched: boolean;
  setHasSearched: (val: boolean) => void;
}

const PredictorContext = createContext<PredictorContextType | undefined>(undefined);

export const PredictorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rank, setRank] = useState('');
  const [exam, setExam] = useState('Entrance');
  const [category, setCategory] = useState('General');
  const [results, setResults] = useState<College[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  return (
    <PredictorContext.Provider value={{
      rank, setRank,
      exam, setExam,
      category, setCategory,
      results, setResults,
      hasSearched, setHasSearched
    }}>
      {children}
    </PredictorContext.Provider>
  );
};

export const usePredictor = () => {
  const context = useContext(PredictorContext);
  if (context === undefined) {
    throw new Error('usePredictor must be used within a PredictorProvider');
  }
  return context;
};
