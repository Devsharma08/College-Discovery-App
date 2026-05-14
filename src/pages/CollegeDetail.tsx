import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';
import { MapPin, Star, GraduationCap, BookOpen, Trophy, Info, Scale, MessageSquare, Bookmark, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getHeroImage } from '../lib/collegeImages';
import { Skeleton, TextSkeleton, DetailHeroSkeleton, QASkeleton, ReviewsSkeleton, EventsSkeleton } from '../components/Skeleton';
import { apiFetch, getErrorMessage, readNdjsonStream } from '../lib/api';

const AdmissionPredictor = lazy(() => import('../components/AdmissionPredictor'));

interface CollegeDetailProps {
  addToCompare: (college: any) => void;
  toggleSave: (college: any) => void;
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
  const [college, setCollege] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  // Review states
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isPostingReview, setIsPostingReview] = useState(false);

  // Sub-resources extracted from the single API response
  const [courses, setCourses] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadCollegeStream = async () => {
      setLoading(true);
      try {
        setCollege(null);
        setCourses([]);
        setPlacements([]);
        setFacilities([]);
        setReviews([]);
        setEvents([]);
        setQuestions([]);

        const response = await fetch(`${API_URL}/api/colleges/${id}/stream`, {
          signal: controller.signal,
        });

        await readNdjsonStream(response, (message) => {
          if (message.error?.message) {
            console.warn(`Failed to stream ${message.type}: ${message.error.message}`);
            return;
          }

          switch (message.type) {
            case 'college':
              setCollege(message.data);
              setLoading(false);
              break;
            case 'courses':
              setCourses(message.data as any[]);
              break;
            case 'placements':
              setPlacements(message.data as any[]);
              break;
            case 'facilities':
              setFacilities(message.data as any[]);
              break;
            case 'reviews':
              setReviews(message.data as any[]);
              break;
            case 'events':
              setEvents(message.data as any[]);
              break;
            case 'questions':
              setQuestions(message.data as any[]);
              break;
            case 'error':
              setCollege(null);
              break;
          }
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error(getErrorMessage(error, 'Failed to load college details'));
          setCollege(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCollegeStream();
    return () => controller.abort();
  }, [id]);


  useEffect(() => {
    let isActive = true;
    let cleanupRealtime: (() => void) | undefined;

    // 1. Polling Fallback (Every 30 seconds)
    const pollInterval = setInterval(() => {
        apiFetch<any[]>(`${API_URL}/api/colleges/${id}/questions`).then(setQuestions).catch(console.error);
    }, 30000);

    import('../lib/supabase').then(({ supabase }) => {
      if (!isActive) return;

      // 2. Subscribe to new questions (Realtime)
      const qChannel = supabase
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
      const aChannel = supabase
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

      cleanupRealtime = () => {
        supabase.removeChannel(qChannel);
        supabase.removeChannel(aChannel);
      };
    }).catch(console.error);

    return () => {
      isActive = false;
      clearInterval(pollInterval);
      cleanupRealtime?.();
    };
  }, [id]);

  const handleReplySubmit = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to reply');
      return;
    }

    setLoadingAnswer(true);
    try {
      const data = await apiFetch<any>(`${API_URL}/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: answerText })
      });
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, answers: [...(q.answers || []), data] } : q));
      setAnswerText('');
      setReplyingTo(null);
      toast.success('Response posted!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post reply'));
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to leave a review');
      return;
    }

    setIsPostingReview(true);
    try {
      const data = await apiFetch<any>(`${API_URL}/api/colleges/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newReviewRating, comment: newReviewComment })
      });

      setReviews(prev => [data, ...prev]);
      setNewReviewComment('');
      setNewReviewRating(5);
      toast.success('Review posted successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to post review'));
    } finally {
      setIsPostingReview(false);
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to ask a question');
      return;
    }

    if (!newQuestion.trim()) return;

    setLoadingQuestion(true);
    try {
      const data = await apiFetch<any>(`${API_URL}/api/colleges/${id}/questions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newQuestion })
      });
      setQuestions(prev => [data, ...prev]);
      setNewQuestion('');
      toast.success("Question posted!");
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to post question'));
    } finally {
      setLoadingQuestion(false);
    }
  };


  if (loading && !college) return <DetailHeroSkeleton />;

  return (
    <div className="animate-page-in space-y-10">
      <div className="relative h-[460px] overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-300">
        <img src={getHeroImage(college)} className="w-full h-full object-cover" alt={college?.name || 'College'} decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14213d] via-[#14213d]/48 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 z-10 mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-32 bg-white/20" />
              <Skeleton className="h-16 w-3/4 bg-white/20" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-40 bg-white/20" />
                <Skeleton className="h-12 w-40 bg-white/20" />
              </div>
            </div>
          ) : !college ? (
            <div className="text-center py-20">
               <h1 className="text-4xl font-bold">College Not Found</h1>
               <p className="mt-4 opacity-70">We couldn't find the institution you're looking for.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold">{college.rating} Rating</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-sm">{college.location}</span>
                </div>
                {college.popularFor && (
                  <div className="flex items-center gap-1.5 bg-[#f4a261] px-4 py-1.5 rounded-full text-[#14213d] font-black uppercase text-[10px] tracking-widest shadow-lg">
                    {college.popularFor}
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight max-w-4xl text-balance drop-shadow-lg">{college.name}</h1>
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
                      : 'bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 backdrop-blur-md'
                    }`}
                >
                  <Bookmark className={`w-5 h-5 ${savedIds.has(college.id) ? 'fill-current' : ''}`} />
                  {savedIds.has(college.id) ? 'Saved' : 'Shortlist'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {college && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-12">
          {/* Overview */}
          <section className="space-y-4">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Info className="text-[#31572c]" /> About the Institution
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {loading ? <TextSkeleton count={5} /> : (college?.details?.description || "No description available.")}
            </p>
          </section>

          {/* Courses & Programs */}
          <section className="surface p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <GraduationCap className="text-[#31572c]" /> Courses & Fees
              </h2>
              {courses.length > 0 && (
                <span className="text-sm font-bold text-slate-400">{courses.length} Programs Available</span>
              )}
            </div>

            {courses.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 skeleton-shimmer rounded-lg" />
                      <div className="space-y-2">
                        <div className="h-4 skeleton-shimmer rounded w-32" />
                        <div className="h-3 skeleton-shimmer rounded w-24" />
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-4 skeleton-shimmer rounded w-20 ml-auto" />
                      <div className="h-3 skeleton-shimmer rounded w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-[#f6f4ee] rounded-2xl border border-slate-100 hover:border-[#31572c]/30 transition-colors">
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
            )}
          </section>

          {/* Placements & Facilities */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!placements ? (
              <div className="surface p-8 rounded-3xl space-y-4">
                <div className="w-10 h-10 skeleton-shimmer rounded-lg" />
                <div className="h-6 skeleton-shimmer rounded w-48" />
                <div className="h-12 skeleton-shimmer rounded-xl w-24" />
                <div className="h-4 skeleton-shimmer rounded w-36" />
                <div className="h-4 skeleton-shimmer rounded w-40" />
              </div>
            ) : placements.length > 0 ? (
              <div className="surface p-8 rounded-3xl">
                <Trophy className="w-10 h-10 mb-4 text-[#0e7490] opacity-40" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Placements ({placements[0].year})</h3>
                <p className="text-4xl font-black text-[#0e7490]">{placements[0].placementPercentage}%</p>
                <p className="text-slate-500 mt-2 text-sm">Avg: Rs. {(placements[0].averagePackage / 100000).toFixed(1)} LPA</p>
                <p className="text-slate-500 text-sm">High: Rs. {(placements[0].highestPackage / 100000).toFixed(1)} LPA</p>
                <p className="text-slate-400 text-xs mt-3 line-clamp-2">Top Recruiters: {placements[0].topRecruiters?.join(', ')}</p>
              </div>
            ) : null}

            {facilities && facilities.length > 0 ? (
              <div className="bg-gradient-to-br from-[#203d1f] to-[#31572c] p-8 rounded-3xl text-white shadow-xl">
                <Trophy className="w-10 h-10 mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-4">Top Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {facilities.map((f, i) => (
                    <span key={i} className="bg-white/20 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                      {f.facility?.name || f.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* Right Column: Fees & Call to Action */}
        <div className="space-y-8">
          <div className="surface p-8 rounded-3xl space-y-6 sticky top-24">
            {loading && !college ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-48" />
                </div>
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-14 w-full rounded-2xl" />
                  <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
              </div>
            ) : college ? (
              <>
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

                <button className="btn-primary w-full py-4 shadow-lg shadow-emerald-900/10">
                  Download Brochure
                </button>
                <button className="btn-secondary w-full py-4">
                  Apply Now
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      )}
      {/* Smart Predictor Section - Centered Full Width */}
      <section className="mt-12 max-w-4xl mx-auto w-full px-4">
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-[2rem]" />}>
          <AdmissionPredictor collegeId={id} initialExam="Entrance" />
        </Suspense>
      </section>

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
          {loading && questions.length === 0 ? (
            <QASkeleton />
          ) : questions.length === 0 ? (
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
      <section className="surface p-8 rounded-3xl space-y-8 mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Star className="text-amber-500" /> Student Reviews
          </h2>
          <span className="text-sm font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
            {reviews?.length || 0} Reviews
          </span>
        </div>

        {/* Post Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Rate your experience</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReviewRating(star)}
                    className="transition-transform active:scale-125"
                  >
                    <Star 
                      className={`w-6 h-6 ${star <= newReviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-[200px]">Your review helps other students make informed decisions.</p>
          </div>

          <div className="relative">
            <textarea
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e.target.value)}
              placeholder="Share your thoughts about the campus, faculty, or placements..."
              className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#31572c] bg-white resize-none"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPostingReview || !newReviewComment.trim()}
              className="btn-primary px-8 py-3 disabled:opacity-50"
            >
              {isPostingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Post Review
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!reviews ? (
            <ReviewsSkeleton />
          ) : reviews.length > 0 ? (
            reviews.map((r: any) => (
              <div key={r.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3 hover:border-slate-200 transition-colors">
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
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="surface p-8 rounded-3xl space-y-6 mt-12">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen className="text-[#31572c]" /> Upcoming Events
        </h2>
        {!events ? (
          <EventsSkeleton />
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev: any) => (
              <div key={ev.id} className="p-5 rounded-2xl bg-[#f6f4ee] border border-slate-100 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#31572c] bg-[#31572c]/10 px-2 py-0.5 rounded-full">{ev.type}</span>
                <h4 className="font-bold text-slate-800">{ev.title}</h4>
                {ev.description && <p className="text-sm text-slate-500 line-clamp-2">{ev.description}</p>}
                <p className="text-xs font-bold text-slate-400">{new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-center py-8">No upcoming events scheduled.</p>
        )}
      </section>

    </div>

  );
};

export default CollegeDetail;
