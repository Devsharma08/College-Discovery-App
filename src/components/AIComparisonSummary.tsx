import React, { useState } from 'react';
/* axios removed */
import { API_URL } from '../config';
import { Sparkles, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import type { College } from '../types';

interface AIComparisonSummaryProps {
  colleges: College[];
}

const AIComparisonSummary: React.FC<AIComparisonSummaryProps> = ({ colleges }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (colleges.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/ai/analyze-comparison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colleges })
      });
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError('Failed to generate AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (colleges.length < 2) return null;

  return (
    <div className="surface overflow-hidden rounded-[2.5rem] border border-[#31572c]/10 shadow-xl shadow-[#31572c]/5">
      <div className="bg-gradient-to-r from-[#203d1f] via-[#31572c] to-[#203d1f] p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                <Sparkles className="w-6 h-6 text-[#f4d35e]" />
              </div>
              <h2 className="text-2xl font-black">AI Counselor Analysis</h2>
            </div>
            <p className="text-white/70 text-sm font-medium">Get a personalized breakdown of your selected colleges powered by Gemini AI</p>
          </div>
          
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-[#f4a261] hover:bg-[#e76f51] text-[#14213d] px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/20 disabled:opacity-50 active:scale-95 shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
            {analysis ? 'Re-Analyze choices' : 'Generate Analysis'}
          </button>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#31572c]/10 border-t-[#31572c] rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[#31572c] animate-pulse" />
            </div>
            <p className="text-slate-500 font-bold animate-pulse">Consulting the AI Counselor...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6 animate-page-in">
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium bg-[#f6f4ee]/50 p-6 rounded-3xl border border-slate-100">
                {analysis}
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-xs text-amber-800 font-medium">AI analysis is generated based on provided data and may not capture all real-world nuances. Please use as a reference tool.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 font-medium">Click the button above to get a detailed AI-powered comparison of your selected institutions.</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 mt-4">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIComparisonSummary;
