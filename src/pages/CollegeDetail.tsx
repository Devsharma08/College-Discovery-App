import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';
import { MapPin, Star, GraduationCap, BookOpen, Trophy, Info, Loader2, Scale, MessageSquare, Bookmark, Send } from 'lucide-react';
import type { College } from '../types';
import { useCollegeHome } from '../context/collegeHome';
import toast from 'react-hot-toast';
import { supabase, } from '../lib/supabase';
import AdmissionPredictor from '../components/AdmissionPredictor';
import { getCollegeImage } from '../lib/collegeImages';

interface CollegeDetailProps {
  addToCompare: (college: College) => void;
  toggleSave: (college: College) => void;
  savedIds: Set<string>;
}

interface Question {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  collegeId: string;
}

const CollegeDetail: React.FC<CollegeDetailProps> = ({ addToCompare, toggleSave, savedIds }) => {
  const { id } = useParams();
  const [college, setCollege] = useState<College | null>(null);
  const { loading, setLoading } = useCollegeHome();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  // Sub-resources states
  const [courses, setCourses] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);


  const supabaseClient = supabase;

  useEffect(() => {
    const fetchCollegeDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/colleges/${id}`);
        if (!response.ok) {
          setCollege(null);
          return;
        }
        const data = await response.json();
        setCollege(data);

        // Fetch sub-resources in parallel
        const [courseRes, placeRes, facRes, revRes] = await Promise.all([
          fetch(`${API_URL}/api/colleges/${id}/courses`).catch(() => null),
          fetch(`${API_URL}/api/colleges/${id}/placements`).catch(() => null),
          fetch(`${API_URL}/api/colleges/${id}/facilities`).catch(() => null),
          fetch(`${API_URL}/api/colleges/${id}/reviews`).catch(() => null),
        ]);

        if (courseRes?.ok) setCourses(await courseRes.json());
        if (placeRes?.ok) setPlacements(await placeRes.json());
        if (facRes?.ok) setFacilities(await facRes.json());
        if (revRes?.ok) setReviews(await revRes.json());
      } catch (error) {
        toast.error("Failed to fetch college details", { id: `college-detail-error-${id}` });
      } finally {
        setLoading(false)
      }
    }
    fetchCollegeDetails();
  }, [id]);


  useEffect(() => {
    // Fetch initial questions from our API
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/colleges/${id}/questions`);
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      }
    };
    
    fetchQuestions();

    // 1. Polling Fallback (Every 30 seconds)
    const pollInterval = setInterval(fetchQuestions, 30000);

    // 2. Subscribe to new questions (Realtime)
    const qChannel = supabaseClient
      .channel(`college-questions-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'Question', 
        filter: `collegeId=eq.${id}` 
      }, (payload) => {
        setQuestions(prev => [{ ...payload.new as Question, answers: [], author: { username: 'Guest' } }, ...prev]);
      })
      .subscribe();

    // 3. Subscribe to new answers (Realtime)
    const aChannel = supabaseClient
      .channel(`college-answers-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'Answer' 
      }, (payload) => {
        setQuestions(prev => prev.map(q => 
          q.id === payload.new.questionId 
            ? { ...q, answers: [...(q.answers || []), { ...payload.new, author: { username: 'Guest' } }] } 
            : q
        ));
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabaseClient.removeChannel(qChannel);
      supabaseClient.removeChannel(aChannel);
    };
  }, [id]);

  const handleReplySubmit = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!answerText.trim() || loadingAnswer) return;

    setLoadingAnswer(true);
    try {
      await fetch(`${API_URL}/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: answerText })
      });
      setAnswerText('');
      setReplyingTo(null);
      toast.success("Response posted!", { id: `answer-posted-${questionId}` });
    } catch (error) {
      toast.error("Failed to post response", { id: `answer-error-${questionId}` });
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setLoadingQuestion(true);
    try {
      await fetch(`${API_URL}/api/colleges/${id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newQuestion })
      });
      setNewQuestion('');
      toast.success("Question posted!", { id: `question-posted-${id}` });
    } catch (error) {
      toast.error("Failed to post question", { id: `question-error-${id}` });
    } finally {
      setLoadingQuestion(false);
    }
  };


  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="w-12 h-12 text-[#31572c] animate-spin" />
      <p className="text-slate-500 font-medium">Loading details...</p>
    </div>
  );

  if (!college) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <Info className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-800">College Not Found</h2>
      <p className="text-slate-500 text-center max-w-sm">The college you are looking for doesn't exist or has been removed from our database.</p>
    </div>
  );

  return (
    <div className="animate-page-in space-y-10">
      <div className="relative h-[460px] overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-300">
        <img src={getCollegeImage(college, 5)} className="w-full h-full object-cover" alt={college.name} decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14213d] via-[#14213d]/48 to-transparent" />

        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="bg-[#f4a261] text-[#14213d] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              {college.popularFor}
            </span>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold">{college.rating} Rating</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-sm">{college.location}</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight max-w-4xl text-balance">{college.name}</h1>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => addToCompare(college)}
              className="btn-primary flex-1 md:flex-none px-8 py-4"
            >
              <Scale className="w-5 h-5" /> Add to Compare
            </button>
            <button
              onClick={() => toggleSave(college)}
              className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${savedIds.has(college.id)
                  ? 'bg-[#f4a261]/95 text-[#14213d] border-2 border-[#f4a261]'
                  : 'bg-white text-slate-700 border-2 border-white hover:border-[#31572c] hover:text-[#31572c]'
                }`}
            >
                <Bookmark className={`w-5 h-5 ${savedIds.has(college.id) ? 'fill-[#14213d]' : ''}`} />
              {savedIds.has(college.id) ? 'Shortlisted' : 'Save for Later'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-12">
          {/* Overview */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Info className="text-[#31572c]" /> About the Institution
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {college.details?.description || "No description available."}
            </p>
          </section>

          {/* Courses & Programs */}
          <section className="surface p-8 rounded-3xl space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <BookOpen className="text-[#31572c]" /> Academic Programs
            </h2>
            {courses && courses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {courses.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-[#f6f4ee] rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <GraduationCap className="w-5 h-5 text-[#31572c]" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 block">{c.name}</span>
                        <span className="text-xs text-slate-500">{c.durationInYears} Years • {c.level}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#31572c] block">Rs. {c.tuitionFee?.toLocaleString() || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{c.seatsAvailable} Seats</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {college.details?.programs?.split(',').map((prog, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-[#f6f4ee] rounded-2xl border border-slate-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <GraduationCap className="w-5 h-5 text-[#31572c]" />
                    </div>
                    <span className="font-semibold text-slate-700">{prog.trim()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Placements & Facilities */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {placements && placements.length > 0 ? (
              <div className="surface p-8 rounded-3xl">
                <Scale className="w-10 h-10 mb-4 text-[#0e7490] opacity-40" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Placements ({placements[0].year})</h3>
                <p className="text-4xl font-black text-[#0e7490]">{placements[0].placementPercentage}%</p>
                <p className="text-slate-500 mt-2 text-sm">Avg: Rs. {(placements[0].averagePackage / 100000).toFixed(1)} LPA</p>
                <p className="text-slate-500 text-sm">High: Rs. {(placements[0].highestPackage / 100000).toFixed(1)} LPA</p>
                <p className="text-slate-400 text-xs mt-3 line-clamp-2">Top Recruiters: {placements[0].topRecruiters?.join(', ')}</p>
              </div>
            ) : (
              <div className="surface p-8 rounded-3xl">
                <Scale className="w-10 h-10 mb-4 text-[#0e7490] opacity-40" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Placements</h3>
                <p className="text-4xl font-black text-[#0e7490]">92%</p>
                <p className="text-slate-500 mt-2 text-sm">Average package of Rs. 12.5 LPA for the 2023 batch.</p>
              </div>
            )}

            {facilities && facilities.length > 0 ? (
              <div className="bg-gradient-to-br from-[#203d1f] to-[#31572c] p-8 rounded-3xl text-white shadow-xl">
                <Trophy className="w-10 h-10 mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-4">Top Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {facilities.slice(0, 5).map((f, i) => (
                    <span key={i} className="bg-white/20 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                      {f.facility?.name || f.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#203d1f] to-[#31572c] p-8 rounded-3xl text-white shadow-xl">
                <Trophy className="w-10 h-10 mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">NIRF Ranking</h3>
                <p className="text-4xl font-black">#12</p>
                <p className="text-emerald-50/75 mt-2 text-sm">Consistent performer in Top 20 institutes in India.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Fees & Call to Action */}
        <div className="space-y-8">
          <div className="surface p-8 rounded-3xl space-y-6 sticky top-24">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yearly Academic Fees</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">Rs. {college.fees.toLocaleString()}</span>
                <span className="text-slate-400 font-medium">/ year</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="font-bold text-slate-800">Entrance Cutoffs</h4>
              {college.cutoffs && college.cutoffs.length > 0 ? (
                <div className="space-y-3">
                  {college.cutoffs.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-[#f6f4ee] rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-[#31572c]">{c.examName}</p>
                        <p className="text-xs text-slate-400">{c.category || 'General'}</p>
                      </div>
                      <span className="font-bold text-slate-700">Rank {c.maxRank}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No cutoff data available yet.</p>
              )}
            </div>

            <button className="btn-primary w-full py-4">
              Download Brochure
            </button>
            <button className="btn-secondary w-full py-4">
              Apply Now
            </button>
          </div>

          <AdmissionPredictor collegeId={id} initialExam="Entrance" />
        </div>
      </div>
      {/* Community Q&A Section */}
      <section className="surface p-8 rounded-3xl space-y-8 mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <MessageSquare className="text-[#31572c]" /> Community Q&A
          </h2>
          <span className="text-sm font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
            Live Updates Enabled
          </span>
        </div>

        {/* Question Form */}
        <form onSubmit={handleQuestionSubmit} className="space-y-4 bg-[#f6f4ee] p-6 rounded-2xl border border-slate-100">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question about this college..."
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#31572c] focus:border-[#31572c] outline-none transition-all resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={loadingQuestion || !newQuestion.trim()}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post Question
          </button>
        </form>

        <div className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400">No questions yet. Be the first to ask!</p>
            </div>
          ) : (
            questions.map((q: any) => (
              <div key={q.id} className="p-6 bg-white/82 border border-slate-100 rounded-2xl shadow-sm space-y-4 animate-page-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#31572c]/10 flex items-center justify-center text-[#31572c] font-bold text-xs">
                      {q.author?.username?.[0] || 'G'}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{q.author?.username || 'Guest'}</span>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-slate-700 leading-relaxed">{q.text}</p>

                {/* Render Existing Answers */}
                {q.answers && q.answers.length > 0 && (
                  <div className="mt-4 pl-6 space-y-3 border-l-2 border-slate-100">
                    {q.answers.map((ans: any) => (
                      <div key={ans.id} className="p-3 bg-slate-50 rounded-xl text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-600">{ans.author?.username || 'Guest'}</span>
                          <span className="text-[10px] text-slate-400">{new Date(ans.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600">{ans.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Action */}
                <div className="pt-2">
                  {replyingTo === q.id ? (
                    <form onSubmit={(e) => handleReplySubmit(e, q.id)} className="space-y-3">
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your response..."
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#31572c]"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button 
                          type="submit" 
                          disabled={loadingAnswer || !answerText.trim()}
                          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                        >
                          {loadingAnswer && <Loader2 className="w-3 h-3 animate-spin" />}
                          Post Response
                        </button>
                        <button type="button" onClick={() => setReplyingTo(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(q.id)}
                      className="text-[#31572c] text-sm font-bold hover:underline flex items-center gap-1"
                    >
                      Reply to this question
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <section className="surface p-8 rounded-3xl space-y-8 mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Star className="text-amber-500" /> Student Reviews
            </h2>
            <span className="text-sm font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
              {reviews.length} Reviews
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r: any) => (
              <div key={r.id} className="p-6 bg-white/82 border border-slate-100 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs">
                      {r.user?.username?.[0] || 'U'}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{r.user?.username || 'Student'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-sm">{r.rating}/5</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm italic">"{r.comment}"</p>
                <span className="text-[10px] text-slate-400 block">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>

  );
};

export default CollegeDetail;
