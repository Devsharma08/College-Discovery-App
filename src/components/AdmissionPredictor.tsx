import React, { useState, useMemo } from 'react';
import { BrainCircuit, Loader2, Sparkles, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { API_URL } from '../config';
import { usePredictor, type PredictedCollege } from '../context/PredictorContext';
import type { College } from '../types';
import { apiFetch, getErrorMessage } from '../lib/api';

interface AdmissionPredictorProps {
  collegeId?: string;
  initialExam?: string;
  className?: string;
  onResultsFound?: (colleges: PredictedCollege[]) => void;
}

const AdmissionPredictor: React.FC<AdmissionPredictorProps> = ({ 
  collegeId, 
  className = '',
  onResultsFound
}) => {
  const { rank, setRank, exam, setExam, category, setCategory } = usePredictor();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    chance: 'High' | 'Medium' | 'Low' | 'None';
    percent: number;
    cutoffRank?: number;
    assessment: string;
    advice: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateChance = (userRank: number, cutoffRank: number) => {
    const diff = cutoffRank - userRank;
    const clamp = (value: number) => Math.max(5, Math.min(95, Math.round(value)));
    if (diff > 2000) return { chance: 'High' as const, percent: 95 };
    if (diff > 0) return { chance: 'High' as const, percent: clamp(80 + (diff / 2000) * 15) };
    if (diff > -500) return { chance: 'Medium' as const, percent: clamp(50 + (diff / 500) * 20) };
    if (diff > -2000) return { chance: 'Low' as const, percent: clamp(20 + (diff / 2000) * 30) };
    return { chance: 'None' as const, percent: 5 };
  };

  const buildAdvice = (chance: 'High' | 'Medium' | 'Low' | 'None', examName: string) => {
    switch (chance) {
      case 'High':
        return `Your rank is comfortably inside the available ${examName} cutoff range. Keep this college high on your shortlist.`;
      case 'Medium':
        return `This is close to the available ${examName} cutoff. Keep it as a realistic option and add a few safer colleges too.`;
      case 'Low':
        return `This is a stretch based on the available ${examName} cutoff. Try nearby branches or colleges with wider cutoff ranges.`;
      case 'None':
        return `Your rank is far outside the available ${examName} cutoff range. Use this as an ambitious option only.`;
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rank) return;
    setError(null);
    setLoading(true);

    try {
      if (collegeId) {
        const college = await apiFetch<College>(`${API_URL}/api/colleges/${collegeId}`);
        const cutoff =
          college.cutoffs?.find((item) => item.examName.toLowerCase() === exam.toLowerCase()) ||
          college.cutoffs?.find((item) => item.examName.toLowerCase().includes(exam.toLowerCase()) || exam.toLowerCase().includes(item.examName.toLowerCase())) ||
          college.cutoffs?.[0];

        if (!cutoff) {
          setResult(null);
          setError('No cutoff data is available for this college yet.');
          return;
        }

        const chanceData = calculateChance(Number(rank), cutoff.maxRank);
        setResult({
          ...chanceData,
          cutoffRank: cutoff.maxRank,
          assessment: `${chanceData.percent}% estimated fit`,
          advice: buildAdvice(chanceData.chance, cutoff.examName),
        });
      } else {
        const url = new URL(`${API_URL}/api/predictor`);
        url.searchParams.append('rank', rank);
        url.searchParams.append('exam', exam);
        url.searchParams.append('category', category);
        const data = await apiFetch<PredictedCollege[]>(url.toString());
        if (onResultsFound) onResultsFound(data);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch prediction data. Please make sure the backend server is running.'));
    } finally {
      setLoading(false);
    }
  };

  const chanceColor = useMemo(() => {
    if (!result) return 'text-slate-400';
    switch (result.chance) {
      case 'High': return 'text-emerald-600';
      case 'Medium': return 'text-amber-600';
      case 'Low': return 'text-orange-600';
      case 'None': return 'text-red-600';
    }
  }, [result]);

  const chanceBg = useMemo(() => {
    if (!result) return 'bg-slate-50';
    switch (result.chance) {
      case 'High': return 'bg-emerald-50 border-emerald-100';
      case 'Medium': return 'bg-amber-50 border-amber-100';
      case 'Low': return 'bg-orange-50 border-orange-100';
      case 'None': return 'bg-red-50 border-red-100';
    }
  }, [result]);

  return (
    <div className={`surface overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm ${className}`}>
      <div className="bg-gradient-to-r from-[#203d1f] to-[#31572c] p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Smart Admission Predictor</h3>
            <p className="text-white/70 text-xs font-medium">Data-driven probability engine</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <form onSubmit={handlePredict} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider pl-1">Entrance Exam</label>
              <select 
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full bg-[#f6f4ee] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#31572c] transition-all outline-none"
              >
                <option value="Entrance">General Entrance</option>
                <option value="JEE">JEE Mains</option>
                <option value="NEET">NEET</option>
                <option value="MET">MET</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider pl-1">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#f6f4ee] border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#31572c] transition-all outline-none"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
          </div>

          <div className="brutalist-container pt-6">
            <input 
              type="number" 
              placeholder="E.G. 15000"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              required
              className="brutalist-input smooth-type !pl-4"
            />
            <label className="brutalist-label">All India Rank</label>
          </div>

          <button 
            type="submit"
            disabled={loading || !rank}
            className="btn-val w-full group"
          >
            <span className="btn-val_lg bg-[#1a1a1a]">
              <span className="btn-val_sl bg-[#31572c]"></span>
              <span className="btn-val_text flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Calculate Probability
              </span>
            </span>
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className={`p-6 rounded-2xl border-2 animate-float-in ${chanceBg}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Your Chances</p>
                <h4 className={`text-2xl font-black ${chanceColor}`}>{result.chance} Probability</h4>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white">
                {result.percent >= 70 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : result.percent >= 30 ? (
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative h-2 w-full bg-white/50 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${
                    result.chance === 'High' ? 'bg-emerald-500' : 
                    result.chance === 'Medium' ? 'bg-amber-500' : 
                    result.chance === 'Low' ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.percent}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-slate-500">Assessment:</span>
                <span className="text-slate-900">{result.assessment}</span>
              </div>

              <div className="bg-white/40 p-3 rounded-xl border border-white/40">
                <p className="text-[10px] text-slate-600 font-medium">
                  <span className="font-bold text-[#31572c]">Counselor Advice:</span> {result.advice}
                </p>
              </div>

              {result.cutoffRank && (
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Available cutoff rank</span>
                  <span className="text-slate-700">{result.cutoffRank.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/50">
                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  *This prediction is based on previous year's data and varies with current year trends.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdmissionPredictor;
