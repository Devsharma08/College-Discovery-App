import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CollegeCard from '../components/CollegeCard';
import {
  ArrowRight,
  Bookmark,
  BrainCircuit,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
  Building2,
  Globe2,
  BookOpen,
  Filter
} from 'lucide-react';
import { useCollegeHome } from '../context/collegeHome';
import { API_URL } from '../config';
import { Skeleton } from '../components/Skeleton';
import { apiFetch, getErrorMessage } from '../lib/api';

interface HomeProps {
  savedCount: number;
  compareCount: number;
  savedIds: Set<string>;
  compareIds: Set<string>;
  toggleSave: (college: any) => void;
  addToCompare: (college: any) => void;
}

const discussionSeeds = [
  {
    question: 'How should I compare two colleges when their ratings are similar?',
    answer: 'Look at the program fit first, then compare fees, location, cutoff comfort, and placement consistency. A slightly lower rating can still be the better choice if the branch and budget fit you better.',
  },
  {
    question: 'Should I shortlist dream colleges or only realistic colleges?',
    answer: 'Keep a balanced shortlist: a few ambitious choices, several realistic options, and at least two safer choices. That mix keeps your options open without making the process noisy.',
  },
];

const commonQuestions = [
  {
    question: 'Is the predictor a final admission guarantee?',
    answer: 'No. It is a planning signal based on available cutoff-style data, useful for narrowing options before checking official counselling updates.',
  },
  {
    question: 'Why do fees and placements vary from official pages?',
    answer: 'College data changes often. Treat these values as discovery estimates and confirm final numbers on the institution or counselling portal.',
  },
  {
    question: 'Can I compare more than three colleges?',
    answer: 'The comparison tray is intentionally capped at three so the table stays readable and decisions remain focused.',
  },
  {
    question: 'Are homepage questions attached to a college?',
    answer: 'No. This discussion area is general guidance for students and is not connected to any college profile or college ID.',
  },
];

const Home: React.FC<HomeProps> = ({ savedCount, compareCount, savedIds, compareIds, toggleSave, addToCompare }) => {
  const { colleges } = useCollegeHome();
  const [discussionQuestion, setDiscussionQuestion] = useState('');
  const [discussionItems, setDiscussionItems] = useState(discussionSeeds);
  
  // Dynamic filter data from backend
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  useEffect(() => {
    setIsLoadingMeta(true);
    apiFetch<{ states?: string[]; courses?: string[] }>(`${API_URL}/api/colleges/meta/filters`)
      .then(data => {
        if (data.states) setAvailableStates(data.states.slice(0, 8));
        if (data.courses) setAvailableCourses(data.courses.slice(0, 12));
      })
      .catch((err) => console.error(getErrorMessage(err, 'Failed to load filters')))
      .finally(() => setIsLoadingMeta(false));
  }, []);

  const featuredColleges = useMemo(
    () => [...colleges].sort((a, b) => b.rating - a.rating).slice(0, 3),
    [colleges]
  );

  const handleDiscussionSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = discussionQuestion.trim();
    if (!trimmedQuestion) return;

    setDiscussionItems((currentItems) => [
      {
        question: trimmedQuestion,
        answer: 'This is saved only in the homepage discussion for now, so it stays separate from college-specific Q&A and does not require a college ID.',
      },
      ...currentItems,
    ]);
    setDiscussionQuestion('');
  };

  return (
    <div className="space-y-12 pb-6 animate-page-in">
      {/* Hero Section */}
      {/* Hero Section - Light & Luminous */}
      <section className="relative min-h-[380px] md:min-h-[440px] overflow-hidden rounded-[2.5rem] bg-[#fbfaf7] px-6 py-12 md:px-16 md:py-16 text-slate-900 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(49,87,44,0.08),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(14,116,144,0.06),transparent_40%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        
        <div className="relative z-10 max-w-3xl animate-page-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#31572c]/10 bg-[#31572c]/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#31572c] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            Dynamic discovery engine
          </div>
          <h1 className="mb-6 text-4xl md:text-6xl font-black leading-[1.1] tracking-tight text-balance text-slate-900">
            Choose a college with <span className="text-[#31572c]">confidence</span>, not chaos.
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600 font-medium">
            Search, shortlist, compare, and predict admissions from one polished workspace built for real academic decisions.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/discover" className="btn-val group">
              <span className="btn-val_lg bg-[#1a1a1a] !text-white !py-3">
                <span className="btn-val_sl bg-[#31572c]"></span>
                <span className="btn-val_text flex items-center gap-2 transition-colors duration-300 font-black text-[11px] uppercase tracking-widest">
                  Start Discovering <ArrowRight className="w-4 h-4" />
                </span>
              </span>
            </Link>
            <Link to="/predictor" className="btn-val group">
              <span className="btn-val_lg border border-slate-200 bg-white !py-3">
                <span className="btn-val_sl bg-slate-50"></span>
                <span className="btn-val_text flex items-center gap-2 text-white  transition-colors duration-300 font-black text-[11px] uppercase tracking-widest text-slate-600">
                  Smart Predictor
                </span>
              </span>
            </Link>
          </div>
        </div>


        <div className="absolute bottom-6 left-6 right-6 z-10 hidden md:grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-white/50 p-2 backdrop-blur-xl md:left-auto md:w-[380px]">
          {[
            ['500+', 'profiles'],
            ['3-way', 'compare'],
            ['live', 'shortlist'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-white/80 p-3 text-center border border-slate-100/50 shadow-sm">
              <p className="text-xl font-black text-slate-900">{value}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Stats / Dashboard */}
      {/* Quick Dashboard - High Density & Responsive */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Shortlisted */}
        <Link to="/saved" className="surface flex flex-col rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#31572c]/10 flex items-center justify-center text-[#31572c]">
                <Bookmark className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shortlist</span>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Saved Hub</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 group-hover:text-[#31572c] transition-colors">{savedCount}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">Institutions</span>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="w-full py-2.5 rounded-xl bg-slate-50 text-[9px] font-black uppercase tracking-widest text-center text-slate-600 group-hover:bg-[#31572c] group-hover:text-white transition-all">View My List</div>
          </div>
        </Link>

        {/* Comparison */}
        <Link to="/compare" className="surface flex flex-col rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#0e7490]/10 flex items-center justify-center text-[#0e7490]">
                <Scale className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compare</span>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Side-by-side</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 group-hover:text-[#0e7490] transition-colors">{compareCount}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">Selected</span>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="w-full py-2.5 rounded-xl bg-slate-50 text-[9px] font-black uppercase tracking-widest text-center text-slate-600 group-hover:bg-[#0e7490] group-hover:text-white transition-all">Open Tray</div>
          </div>
        </Link>

        {/* Predictor */}
        <Link to="/predictor" className="surface flex flex-col rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#f4a261]/10 flex items-center justify-center text-[#f4a261]">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Predict</span>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">AI Logic</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 group-hover:text-[#f4a261] transition-colors">Smart</span>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="w-full py-2.5 rounded-xl bg-slate-50 text-[9px] font-black uppercase tracking-widest text-center text-slate-600 group-hover:bg-[#f4a261] group-hover:text-white transition-all">Get Started</div>
          </div>
        </Link>

        {/* Discovery */}
        <Link to="/discover" className="surface flex flex-col rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/10 flex items-center justify-center text-purple-600">
                <Filter className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Explore</span>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Deep Search</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 group-hover:text-purple-600 transition-colors">500+</span>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="w-full py-2.5 rounded-xl bg-slate-50 text-[9px] font-black uppercase tracking-widest text-center text-slate-600 group-hover:bg-purple-600 group-hover:text-white transition-all">Discover Now</div>
          </div>
        </Link>
      </section>




      {/* Browse by Course */}
      {availableCourses.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="eyebrow mb-3"><BookOpen className="h-3.5 w-3.5" /> Browse by Program</p>
              <h2 className="text-3xl font-black text-slate-900">Popular Courses</h2>
              <p className="text-slate-500 mt-1">Jump straight into institutions that match your preferred program.</p>
            </div>
            <Link to="/discover" className="text-[#31572c] font-bold hover:underline hidden md:block">View All</Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {isLoadingMeta ? (
              <Skeleton className="h-28 w-full rounded-2xl" count={6} />
            ) : (
              availableCourses.map((course) => (
                <Link
                  key={course}
                  to={`/discover?course=${encodeURIComponent(course)}`}
                  className="state-simple-card !h-32 group"
                >
                  <div className="card-details !justify-between !gap-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#31572c]">Program</p>
                    <p className="text-sm font-black text-slate-800 leading-tight group-hover:text-[#31572c] transition-colors">{course}</p>
                  </div>
                  <div className="card-button !text-[10px] !py-2">Explore</div>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {/* Browse by Region */}
      {availableStates.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="eyebrow mb-3"><Globe2 className="h-3.5 w-3.5" /> Browse by Region</p>
              <h2 className="text-3xl font-black text-slate-900">Explore by State</h2>
              <p className="text-slate-500 mt-1">Discover top institutions across India's leading education hubs.</p>
            </div>
            <Link to="/discover" className="text-[#31572c] font-bold hover:underline hidden md:block">View All →</Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {isLoadingMeta ? (
                <Skeleton className="h-24 w-full rounded-2xl" count={4} />
              ) : (
                availableStates.map(state => (
                  <Link
                    key={state}
                    to={`/discover?state=${encodeURIComponent(state)}`}
                    className="state-simple-card group"
                  >
                    <div className="card-details">
                      <p className="text-title">{state}</p>
                      <p className="text-body">Education Hub • 100+</p>
                    </div>
                    <button className="card-button">Explore</button>
                  </Link>
                ))
              )}
            </div>
        </section>
      )}

      {/* Featured Section */}
      <section className="rounded-3xl border border-slate-200/70 bg-white/55 p-6 shadow-sm shadow-slate-200/50 md:p-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="eyebrow mb-3">Curated picks</p>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Featured Institutions</h2>
            <p className="text-slate-500">Top rated colleges picked by our discovery engine.</p>
          </div>
          <Link to="/discover" className="text-[#31572c] font-bold hover:underline">View All Colleges</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredColleges.map((college) => (
            <CollegeCard
              key={college.id}
              college={college}
              isSaved={savedIds.has(college.id)}
              isInCompare={compareIds.has(college.id)}
              toggleSave={toggleSave}
              addToCompare={addToCompare}
            />
          ))}
        </div>
      </section>

      {/* Platform features */}
      <section className="space-y-6">
        <div className="text-left">
          <p className="eyebrow mb-3"><Building2 className="h-3.5 w-3.5" /> Platform Features</p>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Everything You Need in One Place</h2>
          <p className="text-slate-500 max-w-lg">From discovery to decision — every tool a student needs, thoughtfully designed.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: SearchCheck, title: 'Smart Search', desc: 'Search 500+ colleges by name with instant results and debounced input.', category: 'Tool', color: 'hsl(195, 74%, 62%)' },
            { icon: Filter, title: 'Advanced Filters', desc: 'Filter by state, course, fees, facilities, and sort by rating or fees.', category: 'Discovery', color: 'hsl(263, 70%, 50%)' },
            { icon: Scale, title: '3-Way Compare', desc: 'Compare up to 3 colleges side-by-side on fees, cutoffs, and programs.', category: 'Decision', color: 'hsl(187, 67%, 44%)' },
            { icon: BrainCircuit, title: 'AI Predictor', desc: 'Get AI-powered admission probability based on your rank and exam.', category: 'Analytics', color: 'hsl(24, 83%, 63%)' },
            { icon: MessageSquare, title: 'Community Q&A', desc: 'Ask and answer questions on college pages with live real-time updates.', category: 'Social', color: 'hsl(226, 70%, 55%)' },
            { icon: Bookmark, title: 'Smart Shortlist', desc: 'Save colleges across sessions and manage your personalized list.', category: 'Utility', color: 'hsl(340, 82%, 52%)' },
          ].map((feat) => (
            <div key={feat.title} className="feature-activity-card">
              <div className="img-section" style={{ background: feat.color }}>
                <feat.icon className="text-white" />
              </div>
              <div className="card-desc">
                <div className="card-header">
                  <div className="card-title">{feat.category}</div>
                  <div className="card-menu">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
                <div className="card-time">{feat.title}</div>
                <p className="recent">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] pt-6">
        {/* Discussion Portal */}
        <div className="surface rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
          <div className="mb-10 flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow mb-3"><MessageSquare className="h-3.5 w-3.5" /> Community Discussion</p>
              <h2 className="text-3xl font-black text-slate-900">Ask decision-level questions</h2>
              <p className="mt-4 max-w-2xl text-slate-500 leading-relaxed">
                This space is for general college planning, so questions stay independent from college profiles and do not need a valid college ID.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[#31572c] md:block">
              <Users className="h-7 w-7" />
            </div>
          </div>

          <form onSubmit={handleDiscussionSubmit} className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] items-end">
            <div className="brutalist-container">
              <input
                value={discussionQuestion}
                onChange={(event) => setDiscussionQuestion(event.target.value)}
                placeholder="ASK ABOUT ADMISSIONS, FEES..."
                className="brutalist-input smooth-type !py-4"
                type="text"
              />
              <label className="brutalist-label">Discussion Portal</label>
            </div>
            <button type="submit" className="btn-primary min-h-[56px] px-10 text-[11px] font-black uppercase tracking-widest disabled:opacity-50" disabled={!discussionQuestion.trim()}>
              Add Question
            </button>
          </form>

          <div className="space-y-6">
            {discussionItems.map((item) => (
              <article key={item.question} className="rounded-3xl border border-slate-100 bg-white p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="mb-3 flex items-start gap-3 font-black text-slate-900 text-lg leading-tight">
                  <SearchCheck className="mt-1 h-5 w-5 shrink-0 text-[#0e7490]" />
                  {item.question}
                </h3>
                <p className="pl-8 text-sm leading-relaxed text-slate-600 font-medium">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="surface rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm bg-slate-50/30">
          <p className="eyebrow mb-3"><HelpCircle className="h-3.5 w-3.5" /> Decision Logic</p>
          <h2 className="mb-8 text-3xl font-black text-slate-900">Before you decide</h2>
          <div className="space-y-4">
            {commonQuestions.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-white bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-black text-slate-900 transition-colors group-hover:text-[#31572c]">
                  <span className="leading-tight">{item.question}</span>
                  <div className="mt-0.5 rounded-full bg-slate-50 p-1 group-hover:bg-[#31572c]/10 transition-colors">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#31572c] transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="mt-4 border-t border-slate-50 pt-4">
                  <p className="text-sm leading-relaxed text-slate-600 font-medium">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
          
          <div className="mt-10 rounded-2xl bg-[#203d1f] p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#f4d35e] mb-2">Need more help?</p>
            <h4 className="text-lg font-black mb-4">Try our Admission Predictor</h4>
            <Link to="/predictor" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-colors">
              Analyze Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Footer Text */}
      <footer className="pt-16 pb-2 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-[#203d1f] p-2">
                <GraduationCap className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">CampusFinder</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Making higher education discovery transparent, data-driven, and accessible for every student in India.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-4">
            <div className="flex gap-6">
              {['Discover', 'Compare', 'Predictor', 'About'].map(link => (
                <Link key={link} to={`/${link.toLowerCase()}`} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#31572c] transition-colors">{link}</Link>
              ))}
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
              © 2026 CampusFinder • Built for real decisions
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
