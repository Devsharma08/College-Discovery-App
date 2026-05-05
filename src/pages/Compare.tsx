import React, { useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config';
import { Scale, X, MapPin, Star, IndianRupee, GraduationCap, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import type { College } from '../types';
import { Link } from 'react-router-dom';
import { getCollegeImage } from '../lib/collegeImages';
import { getErrorMessage, postJson, readSseTextStream } from '../lib/api';

interface CompareProps {
  compareList: College[];
  removeFromCompare: (id: string) => void;
}

const Compare: React.FC<CompareProps> = ({ compareList, removeFromCompare }) => {
  const [detailedColleges, setDetailedColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRank, setUserRank] = useState<string>('');
  const [userExam, setUserExam] = useState<string>('Entrance');
  const [aiChances, setAiChances] = useState<Record<string, { percent: number, assessment: string }>>({});
  const [predicting, setPredicting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const compareIds = useMemo(() => compareList.map((college) => college.id), [compareList]);

  const handleAiSummary = async () => {
    if (detailedColleges.length === 0) return;
    setStreaming(true);
    setAiSummary('');

    try {
      const response = await fetch(`${API_URL}/api/ai/stream-comparison`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colleges: detailedColleges })
      });

      await readSseTextStream(response, (text) => {
        setAiSummary((prev) => prev + text);
      });
    } catch (err) {
      setAiSummary(getErrorMessage(err, 'Failed to fetch AI summary.'));
    } finally {
      setStreaming(false);
    }
  };

  const calculateChance = (rank: number, cutoffRank?: number) => {
    if (!cutoffRank) return { percent: 0, assessment: 'No cutoff data available' };
    const diff = cutoffRank - rank;
    const clamp = (value: number) => Math.max(5, Math.min(95, Math.round(value)));
    if (diff > 2000) return { percent: 95, assessment: 'Comfortably inside cutoff range' };
    if (diff > 0) return { percent: clamp(80 + (diff / 2000) * 15), assessment: 'Strong fit by rank' };
    if (diff > -500) return { percent: clamp(50 + (diff / 500) * 20), assessment: 'Close call, keep backups ready' };
    if (diff > -2000) return { percent: clamp(20 + (diff / 2000) * 30), assessment: 'Stretch option' };
    return { percent: 5, assessment: 'Unlikely by available cutoff' };
  };

  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        setLoading(true);
        const data = await postJson<College[]>(`${API_URL}/api/compare`, { collegeIds: compareIds });
        setDetailedColleges(data);
      } catch (error) {
        setDetailedColleges([]);
        console.error(getErrorMessage(error, 'Comparison failed'));
      } finally {
        setLoading(false);
      }
    };

    if (compareIds.length > 0) {
      fetchDetailedData();
    } else {
      setDetailedColleges([]);
    }
  }, [compareIds]);

  const handleAiPredict = async () => {
    if (!userRank) return;
    setPredicting(true);

    try {
      const rank = Number(userRank);
      const newChances = detailedColleges.reduce<Record<string, { percent: number, assessment: string }>>((result, college) => {
        const cutoff =
          college.cutoffs?.find((item) => item.examName.toLowerCase() === userExam.toLowerCase()) ||
          college.cutoffs?.find((item) => item.examName.toLowerCase().includes(userExam.toLowerCase()) || userExam.toLowerCase().includes(item.examName.toLowerCase())) ||
          college.cutoffs?.[0];
        result[college.id] = calculateChance(rank, cutoff?.maxRank);
        return result;
      }, {});
      setAiChances(newChances);
    } catch (err) {
      // Silent catch for production
    } finally {
      setPredicting(false);
    }
  };

  if (compareList.length === 0) {
    return (
      <div className="surface mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[2rem] px-8 py-24 text-center space-y-6">
        <div className="bg-[#31572c]/10 p-6 rounded-full">
          <Scale className="w-12 h-12 text-[#31572c]" />
        </div>
        <div className="text-center">
          <p className="eyebrow mx-auto mb-4">Compare</p>
          <h2 className="text-3xl font-black text-slate-800 text-balance">No colleges selected for comparison</h2>
          <p className="text-slate-500 mt-2">Go back to the discovery page and add at least 2 colleges to see a detailed side-by-side comparison.</p>
        </div>
        <Link to="/discover" className="btn-primary px-8 py-3">
          Explore Colleges
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-page-in">
      <div className="text-center">
        <p className="eyebrow mx-auto mb-4">Side by side</p>
        <h1 className="text-4xl font-black text-slate-900 mb-2">College <span className="text-[#31572c]">Comparison</span></h1>
        <p className="text-slate-500">Side-by-side breakdown of your selected choices</p>
      </div>

      <div className="surface p-8 rounded-[2rem] max-w-4xl mx-auto flex flex-wrap items-end gap-6 shadow-sm border border-slate-100">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">AI Admission Predictor</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              value={userExam}
              onChange={(e) => setUserExam(e.target.value)}
              className="w-full bg-[#f6f4ee] border-none rounded-2xl py-4 px-4 font-bold outline-none focus:ring-2 focus:ring-[#31572c] transition-all"
            >
              <option value="Entrance">General Entrance</option>
              <option value="JEE">JEE Mains</option>
              <option value="NEET">NEET</option>
            </select>
            <div className="brutalist-container">
              <input 
                type="number"
                placeholder="RANK..."
                value={userRank}
                onChange={(e) => setUserRank(e.target.value)}
                className="brutalist-input smooth-type !pl-4"
              />
              <label className="brutalist-label">Your Rank</label>
            </div>
          </div>
        </div>
        <button 
          onClick={handleAiPredict}
          disabled={!userRank || predicting}
          className="btn-primary px-8 py-4 flex items-center gap-2 disabled:opacity-50"
        >
          {predicting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Predict with AI
        </button>
      </div>

      {loading && (
        <div className="surface-subtle flex items-center justify-center gap-3 rounded-2xl p-4 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Refreshing comparison
        </div>
      )}

      <div className="overflow-x-auto pb-10">
        <div className="inline-block min-w-full align-middle">
          <div className="surface overflow-hidden rounded-[2rem]">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-[#f6f4ee]/70">
                  <th className="py-10 px-8 text-left w-1/4">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-[#31572c] uppercase tracking-widest">Comparison Criteria</p>
                      <p className="text-slate-400 text-xs font-medium">Selected: {compareList.length}/3</p>
                    </div>
                  </th>
                  {detailedColleges.map((college) => (
                    <th key={college.id} className="py-10 px-8 text-left relative min-w-[300px]">
                      <button 
                        onClick={() => removeFromCompare(college.id)}
                        className="absolute top-4 right-4 p-1.5 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="space-y-3">
                        <img src={getCollegeImage(college, 3)} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt="" />
                        <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">{college.name}</h3>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Location */}
                <tr>
                  <td className="py-8 px-8 align-top">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <MapPin className="w-4 h-4 text-[#31572c]" /> Location
                    </div>
                  </td>
                  {detailedColleges.map((college) => (
                    <td key={college.id} className="py-8 px-8 text-slate-600 font-medium">
                      {college.location}
                    </td>
                  ))}
                </tr>


                {/* Rating */}
                <tr>
                  <td className="py-8 px-8 align-top">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Star className="w-4 h-4 text-amber-500" /> Rating
                    </div>
                  </td>
                  {detailedColleges.map((college) => (
                    <td key={college.id} className="py-8 px-8">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-xl">{college.rating}</span>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(college.rating) ? 'fill-current' : 'opacity-20'}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Fees */}
                <tr>
                  <td className="py-8 px-8 align-top">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <IndianRupee className="w-4 h-4 text-emerald-600" /> Annual Fees
                    </div>
                  </td>
                  {detailedColleges.map((college) => (
                    <td key={college.id} className="py-8 px-8">
                      <span className="font-black text-slate-900 text-lg">Rs. {college.fees.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Academic Year</p>
                    </td>
                  ))}
                </tr>

                {/* Courses */}
                <tr>
                  <td className="py-8 px-8 align-top">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <GraduationCap className="w-4 h-4 text-[#31572c]" /> Programs
                    </div>
                  </td>
                  {detailedColleges.map((college) => (
                    <td key={college.id} className="py-8 px-8">
                      <div className="flex flex-wrap gap-2">
                        {college.details?.programs?.split(',').map((p, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">
                            {p.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Cutoffs */}
                <tr>
                  <td className="py-8 px-8 align-top">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#31572c]" /> Entrance Exams
                    </div>
                  </td>
                  {detailedColleges.map((college) => (
                    <td key={college.id} className="py-8 px-8">
                      <div className="space-y-2">
                        {college.cutoffs?.map((c, i) => (
                          <div key={i} className="flex justify-between items-center bg-[#31572c]/10 p-2 rounded-lg border border-[#31572c]/10">
                            <span className="text-[10px] font-black text-[#31572c]">{c.examName}</span>
                            <span className="text-[10px] font-bold text-slate-600">Rank {c.maxRank}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Admission Chances */}
                {Object.keys(aiChances).length > 0 && (
                  <tr className="bg-emerald-50/30">
                    <td className="py-8 px-8 align-top">
                      <div className="flex items-center gap-2 font-bold text-emerald-700">
                        <Sparkles className="w-4 h-4" /> AI Probability
                      </div>
                      <p className="text-[10px] text-emerald-600/70 mt-1">Based on Rank {userRank}</p>
                    </td>
                    {detailedColleges.map((college) => {
                      const chance = aiChances[college.id];
                      if (!chance) return <td key={college.id} className="py-8 px-8 text-slate-400">-</td>;
                      
                      const color = chance.percent >= 80 ? 'text-emerald-600' : chance.percent >= 40 ? 'text-amber-600' : 'text-orange-600';

                      return (
                        <td key={college.id} className="py-8 px-8">
                          <div className={`font-black text-xl ${color}`}>{chance.percent}%</div>
                          <p className="text-[10px] font-bold text-slate-500 leading-tight mt-1">{chance.assessment}</p>
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-8 pb-20">
        <div className="surface p-8 rounded-[2rem] shadow-sm border border-emerald-100 bg-emerald-50/10">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-black text-slate-900">AI Counselor <span className="text-emerald-600">Summary</span></h2>
          </div>
          
          <div className="prose prose-slate max-w-none text-slate-700">
            {aiSummary ? (
              <div className="whitespace-pre-wrap">{aiSummary}</div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-500 mb-6">Get a professional, AI-generated comparison of these colleges based on fees, academics, and placements.</p>
                <button 
                  onClick={handleAiSummary}
                  disabled={streaming}
                  className="btn-primary px-8 py-3 mx-auto flex items-center gap-2 disabled:opacity-50"
                >
                  {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate AI Summary'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
