import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BrainCircuit,
  GraduationCap,
  HelpCircle,
  MapPin,
  MessageSquare,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCollegeHome } from '../context/collegeHome';
import { getCollegeImage, getHeroImage } from '../lib/collegeImages';

interface HomeProps {
  savedCount: number;
  compareCount: number;
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

const Home: React.FC<HomeProps> = ({ savedCount, compareCount }) => {
  const { colleges } = useCollegeHome();
  const [discussionQuestion, setDiscussionQuestion] = useState('');
  const [discussionItems, setDiscussionItems] = useState(discussionSeeds);
  
  const featuredColleges = useMemo(
    () => [...colleges].sort((a, b) => b.rating - a.rating).slice(0, 3),
    [colleges]
  );

  const heroImage = useMemo(() => {
    const topCollege = featuredColleges[0];
    return getHeroImage(topCollege);
  }, [featuredColleges]);

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
    <div className="space-y-14 pb-20 animate-page-in">
      <section className="relative min-h-[580px] overflow-hidden rounded-3xl bg-[#111827] px-6 py-16 text-white shadow-2xl shadow-slate-300 md:px-16 md:py-24">
        <img
          src={heroImage}
          alt="Active campus discovery"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/82 to-[#111827]/25" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#111827]/85 to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="relative z-10 max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#f4d35e] backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Dynamic college discovery
          </div>
          <h1 className="mb-8 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl text-balance">
            Choose a college with confidence, not chaos.
          </h1>
          <p className="mb-10 max-w-2xl text-xl leading-relaxed text-slate-300">
            Search, shortlist, compare, discuss, and predict admissions from one polished workspace built for real decisions.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/discover" className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-[#203d1f] shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#f7f1df] active:scale-95">
              Start Discovering <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/predictor" className="rounded-xl border border-white/15 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10">
              Predict Admission
            </Link>
          </div>
        </motion.div>

        <div className="absolute bottom-6 left-6 right-6 z-10 grid gap-3 rounded-2xl border border-white/15 bg-white/12 p-3 backdrop-blur-xl md:left-auto md:w-[430px] md:grid-cols-3">
          {[
            ['60+', 'profiles'],
            ['3-way', 'compare'],
            ['live', 'shortlist'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-white/12 p-4">
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Stats / Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/saved" className="surface lift-card group rounded-2xl p-7">
          <div className="w-14 h-14 rounded-xl bg-[#31572c]/10 text-[#31572c] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Shortlisted</h3>
          <p className="text-slate-500 mb-4">You have {savedCount} colleges saved for consideration.</p>
          <div className="text-[#31572c] font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
            View My List <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link to="/compare" className="surface lift-card group rounded-2xl p-7">
          <div className="w-14 h-14 rounded-xl bg-[#0e7490]/10 text-[#0e7490] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
            <Scale className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Comparison Tray</h3>
          <p className="text-slate-500 mb-4">{compareCount} colleges ready to be compared side-by-side.</p>
          <div className="text-[#0e7490] font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
            Open Comparison <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link to="/predictor" className="surface lift-card group rounded-2xl p-7">
          <div className="w-14 h-14 rounded-xl bg-[#f4a261]/15 text-[#b85c38] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">AI Predictor</h3>
          <p className="text-slate-500 mb-4">Check your admission chances based on your rank.</p>
          <div className="text-[#b85c38] font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
            Get Started <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </section>

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
          {featuredColleges.map((college, index) => (
            <Link key={college.id} to={`/college/${college.id}`} className="surface lift-card group overflow-hidden rounded-2xl">
              <div className="relative h-56">
                <img
                  src={getCollegeImage(college, index)}
                  alt={`${college.name} campus preview`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {college.rating}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-[#31572c] transition-colors leading-tight">{college.name}</h3>
                <div className="flex items-center text-slate-500 text-sm gap-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {college.location.split(',')[0]}</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {college.popularFor}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-2xl p-7 md:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow mb-3"><MessageSquare className="h-3.5 w-3.5" /> Discussion</p>
              <h2 className="text-3xl font-black text-slate-900">Ask decision-level questions</h2>
              <p className="mt-3 max-w-2xl text-slate-500">
                This space is for general college planning, so questions stay independent from college profiles and do not need a valid college ID.
              </p>
            </div>
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 p-3 text-[#31572c] md:block">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <form onSubmit={handleDiscussionSubmit} className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={discussionQuestion}
              onChange={(event) => setDiscussionQuestion(event.target.value)}
              placeholder="Ask about shortlisting, fees, branches, location, or counselling..."
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#31572c] focus:ring-4 focus:ring-[#31572c]/10"
            />
            <button type="submit" className="btn-primary min-h-12 px-5 text-sm disabled:opacity-50" disabled={!discussionQuestion.trim()}>
              Add Question
            </button>
          </form>

          <div className="space-y-4">
            {discussionItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-2 flex items-start gap-2 font-black text-slate-900">
                  <SearchCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0e7490]" />
                  {item.question}
                </h3>
                <p className="pl-7 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="surface rounded-2xl p-7 md:p-8">
          <p className="eyebrow mb-3"><HelpCircle className="h-3.5 w-3.5" /> Common Questions</p>
          <h2 className="mb-6 text-3xl font-black text-slate-900">Before you decide</h2>
          <div className="space-y-3">
            {commonQuestions.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white p-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-black text-slate-900">
                  <span>{item.question}</span>
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#31572c] transition-transform group-open:rotate-12" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
