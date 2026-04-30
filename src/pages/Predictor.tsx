import React from 'react';
import { MapPin, Star, GraduationCap, Sparkles, Filter, ArrowRight, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePredictor, type PredictedCollege } from '../context/PredictorContext';
import type { College } from '../types';
import AdmissionPredictor from '../components/AdmissionPredictor';


const Predictor: React.FC = () => {
  const { results, setResults, hasSearched, setHasSearched } = usePredictor();

  const handleResults = (results: PredictedCollege[]) => {
    setResults(results);
    setHasSearched(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-page-in pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="eyebrow mx-auto mb-2">
          <Sparkles className="w-4 h-4" /> Smart Discovery
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
          Find your <span className="text-[#31572c]">ideal match</span> based on your rank
        </h1>
        <p className="text-slate-500 text-lg">
          Our intelligent engine analyzes thousands of historical data points to predict your admission chances with high precision.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Input Form */}
        <div className="lg:col-span-4 sticky top-24">
          <AdmissionPredictor 
            onResultsFound={handleResults} 
            className="shadow-2xl shadow-slate-200"
          />
          
          <div className="mt-8 p-6 bg-[#f6f4ee] rounded-3xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Pro Tip
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cutoffs vary significantly by category and home-state status. Always check the official website for the most accurate current year data.
            </p>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          {!hasSearched ? (
            <div className="surface-subtle h-[500px] flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center px-8">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <BrainCircuit className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-400 mb-2">Ready to Predict?</h3>
              <p className="text-slate-400 max-w-sm">Enter your rank and exam details in the form to see which institutions are within your reach.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800">Matching Institutions</h2>
                <span className="bg-white px-4 py-1.5 rounded-full border border-slate-100 text-xs font-bold text-slate-500 shadow-sm">
                  {results.length} matches found
                </span>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((college) => (
                    <Link 
                      to={`/college/${college.id}`}
                      key={college.id} 
                      className="surface lift-card group p-6 rounded-[2rem] border border-slate-50"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="bg-[#31572c]/10 p-3 rounded-2xl group-hover:bg-[#31572c] group-hover:text-white transition-colors duration-500">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-amber-700">{college.rating}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-5">
                        <div>
                          <h3 className="font-black text-slate-800 text-lg line-clamp-1 group-hover:text-[#31572c] transition-colors">{college.name}</h3>
                          <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-sm font-medium">{college.location}</span>
                          </div>
                        </div>

                        <div className="bg-[#fbfaf7] p-4 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Rank Match</p>
                            <span className="text-sm font-black text-[#31572c]">
                              {college.matchPercent ? `${college.matchPercent}% fit` : 'Matched by cutoff'}
                            </span>
                          </div>
                            <div className="bg-[#31572c]/10 p-2 rounded-xl">
                              <ArrowRight className="w-4 h-4 text-[#31572c] group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          {college.aiMatchReason && (
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-2 italic">
                              "{college.aiMatchReason}"
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="surface-subtle text-center py-24 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <Filter className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-slate-400 mb-2">No institutions found</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Try a different exam or adjust your rank to see more results.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Predictor;
