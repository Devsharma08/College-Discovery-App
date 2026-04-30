import React, { Suspense, lazy, useMemo, useState,useEffect } from 'react';
import { BrowserRouter as Router, NavLink, Routes, Route, Link } from 'react-router-dom';
import { BrainCircuit, GraduationCap, Loader2, Scale, X, ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import type { College } from './types';
import { HomeContextProvider } from './context/collegeHome';
import { PredictorProvider } from './context/PredictorContext';

const CollegeList = lazy(() => import('./pages/CollegeList'));
const CollegeDetail = lazy(() => import('./pages/CollegeDetail'));
const Predictor = lazy(() => import('./pages/Predictor'));
const Compare = lazy(() => import('./pages/Compare'));
const Home = lazy(() => import('./pages/Home'));
const SavedList = lazy(() => import('./pages/SavedList'));

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-full px-4 py-2 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-[#203d1f] text-white shadow-lg shadow-emerald-950/10'
      : 'text-slate-600 hover:bg-white hover:text-[#203d1f]'
  }`;

const App: React.FC = () => {
  const [compareList, setCompareList] = useState<College[]>(() => {
    const saved = localStorage.getItem('compareList');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedColleges, setSavedColleges] = useState<College[]>(() => {
    const saved = localStorage.getItem('savedColleges');
    return saved ? JSON.parse(saved) : [];
  });
  const [isMinimized, setIsMinimized] = useState(false);

  const savedIds = useMemo(() => new Set(savedColleges.map((college) => college.id)), [savedColleges]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  useEffect(() => {
    localStorage.setItem('savedColleges', JSON.stringify(savedColleges));
  }, [savedColleges]);

  const addToCompare = (college: College) => {
    if (compareList.length >= 3) {
      toast.error('You can compare max 3 colleges', { id: 'compare-limit' });
      return;
    }
    if (compareList.find(c => c.id === college.id)) {
      toast.error('College already added', { id: `compare-exists-${college.id}` });
      return;
    }
    setCompareList([...compareList, college]);
    toast.success(`${college.name} added to comparison`, { id: `compare-add-${college.id}` });
  };

  const removeFromCompare = (id: string) => {
    setCompareList(prev => prev.filter(c => c.id !== id));
  };

  const toggleSave = (college: College) => {
    const isSaved = savedColleges.some(c => c.id === college.id);
    setSavedColleges(prev => (
      isSaved
        ? prev.filter(c => c.id !== college.id)
        : [...prev, college]
    ));
    toast.success(isSaved ? 'Removed from shortlist' : 'Added to shortlist', { id: `shortlist-${college.id}` });
  };

  return (
    <Router>
      <HomeContextProvider>
        <PredictorProvider>
          <div className="min-h-screen overflow-hidden text-slate-950 font-sans selection:bg-[#f4a261]/30">
            <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />
            <Toaster position="top-center" toastOptions={{ className: 'rounded-2xl border border-slate-200 shadow-xl' }} />
            
            <nav className="sticky top-0 z-50 border-b border-white/70 bg-[#fbfaf7]/78 backdrop-blur-2xl">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
                  <Link to="/" className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#203d1f] p-2.5 shadow-lg shadow-emerald-950/15">
                      <GraduationCap className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-black tracking-tight">
                      CampusFinder
                    </span>
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/80 bg-white/65 p-1 text-sm shadow-sm shadow-slate-200/60">
                <NavLink to="/" className={navClass}>Home</NavLink>
                <NavLink to="/discover" className={navClass}>Discover</NavLink>
                <NavLink to="/saved" className={navClass}>
                  <span className="inline-flex items-center gap-2">
                    Saved
                    {savedColleges.length > 0 && <span className="rounded-full bg-[#0e7490] px-1.5 py-0.5 text-[10px] leading-none text-white">{savedColleges.length}</span>}
                  </span>
                </NavLink>
                <NavLink to="/compare" className={navClass}>
                  <span className="inline-flex items-center gap-2">
                    Compare
                  {compareList.length > 0 && (
                      <span className="rounded-full bg-[#f4a261] px-1.5 py-0.5 text-[10px] leading-none text-white">{compareList.length}</span>
                  )}
                  </span>
                </NavLink>
                <NavLink to="/predictor" className={navClass}>
                  <span className="inline-flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Predictor</span>
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-slate-500" /></div>}>
            <Routes>
              <Route path="/" element={<Home savedCount={savedColleges.length} compareCount={compareList.length} />} />
              <Route path="/discover" element={<CollegeList addToCompare={addToCompare} toggleSave={toggleSave} savedIds={savedIds} />} />
              <Route path="/college/:id" element={<CollegeDetail addToCompare={addToCompare} toggleSave={toggleSave} savedIds={savedIds} />} />
              <Route path="/saved" element={<SavedList savedColleges={savedColleges} toggleSave={toggleSave} addToCompare={addToCompare} />} />
              <Route path="/predictor" element={<Predictor />} />
              <Route path="/compare" element={<Compare compareList={compareList} removeFromCompare={removeFromCompare} />} />
            </Routes>
          </Suspense>
        </main>

        {compareList.length > 0 && (
          <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 animate-float-in">
            <div className="surface overflow-hidden rounded-3xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#31572c]" /> Comparison Tray
                  <span className="ml-1 text-[10px] text-slate-400 uppercase tracking-wider">{compareList.length}/3</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                    title={isMinimized ? "Expand" : "Minimize"}
                  >
                    {isMinimized ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  </button>
                  {isMinimized && (
                    <Link to="/compare" className="text-[#31572c] hover:scale-110 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
              
              {!isMinimized && (
                <>
                  <div className="space-y-2 mb-4">
                    {compareList.map(c => (
                      <div key={c.id} className="flex items-center justify-between rounded-2xl bg-[#f6f4ee] p-2 group">
                        <span className="text-xs font-medium truncate pr-2">{c.name}</span>
                        <button onClick={() => removeFromCompare(c.id)} className="text-slate-400 hover:text-red-500 transition-colors" aria-label={`Remove ${c.name}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Link 
                    to="/compare"
                    className="btn-primary block w-full py-3 text-center text-sm"
                  >
                    Compare Now
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
          </div>
        </PredictorProvider>
      </HomeContextProvider>
    </Router>
  );
};

export default App;
