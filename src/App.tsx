import React, { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import EarthLoader from './components/EarthLoader';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Scale, 
  BrainCircuit, 
  GraduationCap, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  BookOpen, 
  X, 
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import type { College } from './types';
import { HomeContextProvider } from './context/collegeHome';
import { PredictorProvider } from './context/PredictorContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch, getErrorMessage } from './lib/api';

const CollegeList = lazy(() => import('./pages/CollegeList'));
const CollegeDetail = lazy(() => import('./pages/CollegeDetail'));
const Predictor = lazy(() => import('./pages/Predictor'));
const Compare = lazy(() => import('./pages/Compare'));
const Home = lazy(() => import('./pages/Home'));
const SavedList = lazy(() => import('./pages/SavedList'));
const Profile = lazy(() => import('./pages/Profile'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Courses = lazy(() => import('./pages/Courses'));

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-full px-4 py-2 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-[#203d1f] text-white shadow-lg shadow-emerald-950/10'
      : 'text-slate-600 hover:bg-white hover:text-[#203d1f]'
  }`;

const AppContent: React.FC = () => {
  const [compareList, setCompareList] = useState<College[]>(() => {
    try {
      const saved = localStorage.getItem('compareList');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [savedColleges, setSavedColleges] = useState<College[]>(() => {
    try {
      const saved = localStorage.getItem('savedColleges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { user, token, logout, isLoading } = useAuth();
  const savedIds = useMemo(() => new Set(savedColleges.map((college) => college.id)), [savedColleges]);
  const compareIds = useMemo(() => new Set(compareList.map((college) => college.id)), [compareList]);

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  // Sync favorites with backend when user logs in
  useEffect(() => {
    if (user && token) {
      apiFetch<College[]>(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSavedColleges(data);
          localStorage.setItem('savedColleges', JSON.stringify(data));
        }
      })
      .catch(() => {});
    }
  }, [user, token]);

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

  const toggleSave = async (college: College) => {
    if (!user) {
      toast.error('Please sign in to save colleges');
      return;
    }

    const isSaved = savedColleges.some(c => c.id === college.id);
    setSavedColleges(prev => (
      isSaved
        ? prev.filter(c => c.id !== college.id)
        : [...prev, college]
    ));
    toast.success(isSaved ? 'Removed from shortlist' : 'Added to shortlist', { id: `shortlist-${college.id}` });

    try {
      await apiFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/favorites`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ collegeId: college.id })
      });
    } catch (err) {
      setSavedColleges(prev => (
        isSaved
          ? [...prev, college]
          : prev.filter(c => c.id !== college.id)
      ));
      toast.error(getErrorMessage(err, 'Could not update shortlist. Please try again.'), { id: `shortlist-error-${college.id}` });
    }
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    if (isLoading) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#31572c] animate-spin" />
        </div>
      );
    }
    if (!user) {
      return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen overflow-x-hidden text-slate-950 font-sans selection:bg-[#f4a261]/30">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />
      <Toaster position="top-center" toastOptions={{ className: 'rounded-2xl border border-slate-200 shadow-xl' }} />
      
      <nav className="sticky top-0 z-50 border-b border-white/70 bg-[#fbfaf7]/80 backdrop-blur-3xl shadow-sm transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link to="/" className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#203d1f] p-2.5 shadow-lg shadow-emerald-950/15">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-black tracking-tight">
                  CampusFinder
                </span>
              </Link>

              {/* Mobile Toggle */}
              <div className="md:hidden">
                <input 
                  type="checkbox" 
                  id="nav-checkbox" 
                  checked={isMenuOpen} 
                  onChange={() => setIsMenuOpen(!isMenuOpen)} 
                />
                <label htmlFor="nav-checkbox" className="nav-toggle">
                  <div className="nav-bars" id="nav-bar1"></div>
                  <div className="nav-bars" id="nav-bar2"></div>
                  <div className="nav-bars" id="nav-bar3"></div>
                </label>
              </div>
            </div>

            <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row flex-wrap items-center gap-2 rounded-2xl md:rounded-full border border-white/80 bg-white/65 p-4 md:p-1 text-sm shadow-sm shadow-slate-200/60 mt-4 md:mt-0 w-full md:w-auto animate-in fade-in slide-in-from-top-2`}>
              <NavLink to="/" className={navClass} onClick={() => setIsMenuOpen(false)}>Home</NavLink>
              
              {/* Programs Dropdown */}
              <div className="relative group px-1">
                <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-white hover:text-[#203d1f]">
                  Programs <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute left-0 lg:left-auto lg:right-0 top-full mt-1 hidden w-64 origin-top-left lg:origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 group-hover:block z-[60]">
                  <div className="mb-2 px-3 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Popular Courses</div>
                  {[
                    'Architecture', 'Business Administration', 'Civil Engineering', 
                    'Commerce', 'Computer Science and Engineering', 'Dental Surgery', 
                    'Electrical Engineering', 'Finance', 'Information Technology', 
                    'Law', 'Marketing Management', 'Mathematics'
                  ].map(course => (
                    <Link 
                      key={course}
                      to={`/discover?course=${encodeURIComponent(course)}`} 
                      className="block rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-[#31572c]/10 hover:text-[#31572c] transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {course}
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-slate-50 pt-2 px-3">
                    <Link to="/discover" className="text-[10px] font-black text-[#31572c] uppercase hover:underline">View All →</Link>
                  </div>
                </div>
              </div>

              <NavLink to="/discover" className={navClass} onClick={() => setIsMenuOpen(false)}>Discover</NavLink>
              <NavLink to="/courses" className={navClass} onClick={() => setIsMenuOpen(false)}>Courses</NavLink>
              <NavLink to="/saved" className={navClass} onClick={() => setIsMenuOpen(false)}>
                <span className="inline-flex items-center gap-2">
                  Saved
                  {savedColleges.length > 0 && <span className="rounded-full bg-[#0e7490] px-1.5 py-0.5 text-[10px] leading-none text-white">{savedColleges.length}</span>}
                </span>
              </NavLink>
              <NavLink to="/compare" className={navClass} onClick={() => setIsMenuOpen(false)}>
                <span className="inline-flex items-center gap-2">
                  Compare
                {compareList.length > 0 && (
                    <span className="rounded-full bg-[#f4a261] px-1.5 py-0.5 text-[10px] leading-none text-white">{compareList.length}</span>
                )}
                </span>
              </NavLink>
              <NavLink to="/predictor" className={navClass} onClick={() => setIsMenuOpen(false)}>
                <span className="inline-flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Predictor</span>
              </NavLink>

              <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>
              
              {user ? (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* Desktop Dropdown */}
                  <div className="hidden md:block relative group px-1">
                    <button className={`${navClass({ isActive: false })} flex items-center gap-2 pr-2`}>
                      <div className="w-6 h-6 rounded-full bg-[#203d1f] flex items-center justify-center text-white text-[10px] font-black uppercase">
                        {user.username?.[0] || 'U'}
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-wider">{user.username || 'Profile'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform" />
                    </button>
                    
                    <div className="absolute right-0 top-full mt-1 hidden w-48 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 group-hover:block z-[60]">
                      <Link to="/profile" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                        <UserIcon className="w-4 h-4" /> Profile
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsMenuOpen(false); toast.success('Signed out'); }} 
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>

                  {/* Mobile Direct Links */}
                  <div className="md:hidden flex flex-col gap-2 w-full border-t border-slate-100 pt-4 mt-2">
                    <Link to="/profile" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                      <UserIcon className="w-4 h-4" /> My Profile
                    </Link>
                    <button 
                      onClick={() => { logout(); setIsMenuOpen(false); toast.success('Signed out'); }} 
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <NavLink to="/auth" className={navClass} onClick={() => setIsMenuOpen(false)}>Sign In</NavLink>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links / Program Bar - Sticky */}
        <div className="sticky top-20 z-40 border-t border-white/40 bg-white/40 backdrop-blur-md hidden md:block">
          <div className="mx-auto max-w-7xl px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#203d1f] flex items-center gap-1.5 whitespace-nowrap">
                <BookOpen className="w-3 h-3" /> Quick Navigation
              </span>
              <div className="w-px h-3 bg-slate-300"></div>
              {[
                'Architecture', 'Business', 'Civil Engineering', 'Commerce', 
                'CSE', 'Dental', 'Electrical', 'Finance', 'IT', 'Law', 'Marketing', 'Mathematics'
              ].map(course => (
                <Link 
                  key={course}
                  to={`/discover?course=${encodeURIComponent(course)}`} 
                  className="text-[11px] font-bold text-slate-500 hover:text-[#203d1f] transition-colors whitespace-nowrap"
                >
                  {course}
                </Link>
              ))}
            </div>
            <Link to="/discover" className="text-[10px] font-black text-[#203d1f] uppercase hover:underline ml-4 whitespace-nowrap">View All →</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><EarthLoader message="Exploring the globe..." /></div>}>
          <Routes>
            <Route
              path="/"
              element={
                <HomeContextProvider>
                  <Home 
                    savedCount={savedColleges.length} 
                    compareCount={compareList.length} 
                    savedIds={savedIds} 
                    compareIds={compareIds}
                    toggleSave={toggleSave} 
                    addToCompare={addToCompare} 
                  />
                </HomeContextProvider>
              }
            />
            <Route path="/discover" element={<CollegeList addToCompare={addToCompare} toggleSave={toggleSave} savedIds={savedIds} compareIds={compareIds} />} />
            <Route path="/college/:id" element={<CollegeDetail addToCompare={addToCompare} toggleSave={toggleSave} savedIds={savedIds} />} />
            <Route path="/saved" element={<SavedList savedColleges={savedColleges} toggleSave={toggleSave} addToCompare={addToCompare} compareIds={compareIds} />} />
            <Route 
              path="/predictor" 
              element={
                <ProtectedRoute>
                  <Predictor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/compare" 
              element={
                <ProtectedRoute>
                  <Compare compareList={compareList} removeFromCompare={removeFromCompare} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="/courses" element={<Courses addToCompare={addToCompare} toggleSave={toggleSave} savedIds={savedIds} compareIds={compareIds} />} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </Suspense>
      </main>

      {compareList.length > 0 && (
        <div
          className={`fixed inset-x-0 z-50 mx-auto w-[min(94vw,320px)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isMinimized ? 'bottom-2 translate-y-0' : 'bottom-6'
          } animate-float-in`}
        >
          <div className={`surface overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-200/60 transition-all duration-500 ${isMinimized ? 'p-2' : 'p-5'}`}>
            {/* Mini Handle/Indicator */}
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="flex flex-col items-center w-full mb-2 cursor-pointer group/handle"
            >
              <div className={`h-1.5 rounded-full bg-slate-200 group-hover/handle:bg-[#31572c]/40 transition-all ${isMinimized ? 'w-12' : 'w-8'}`} />
            </button>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                <Scale className={`w-3.5 h-3.5 ${isMinimized ? 'text-slate-300' : 'text-[#31572c]'}`} /> {isMinimized ? 'Compare' : 'Comparison Tray'}
                {!isMinimized && <span className="ml-1 text-[#31572c]">{compareList.length}/3</span>}
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
                <div className="space-y-1.5 mb-5 max-h-[160px] overflow-y-auto no-scrollbar">
                  {compareList.map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 group">
                      <span className="text-[11px] font-black text-slate-800 truncate pr-4 leading-none">{c.name}</span>
                      <button onClick={() => removeFromCompare(c.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0" aria-label={`Remove ${c.name}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <Link 
                  to="/compare"
                  className="btn-val group/btn w-full"
                >
                  <span className="btn-val_lg bg-[#203d1f] !py-3 !text-white">
                    <span className="btn-val_sl bg-[#31572c]"></span>
                    <span className="btn-val_text text-[10px]">Compare Analytics</span>
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <PredictorProvider>
          <AppContent />
        </PredictorProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
