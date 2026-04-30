import React, { useState,useEffect,useRef,useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bookmark, Filter, Loader2, MapPin, Scale, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { College } from '../types';
import { useCollegeHome } from '../context/collegeHome';
import { getCollegeImage } from '../lib/collegeImages';
import { API_URL } from '../config';

interface CollegeListProps {
  addToCompare: (college: College) => void;
  toggleSave: (college: College) => void;
  savedIds: Set<string>;
}

const CollegeList: React.FC<CollegeListProps> = ({ addToCompare, toggleSave, savedIds }) => {
  const [search, setSearch] = useState('');
  const { colleges, setColleges, loading } = useCollegeHome();

  const LIMIT = 12;

  // implementing infinite scrolling
  const [page,setPage] = useState(1);
  const [hasMore,setHasMore] = useState(true);
  const [loadingMore,setLoadingMore] = useState(false);

  const observer = useRef<IntersectionObserver|null>(null);

  // implementing Insersction Observer for infinite scrolling
  const lastElementRef = useCallback((node:HTMLDivElement)=>{
    // if loading more or has no more colleges to load, return
    if(loadingMore || !hasMore) return;

    // if there is an existing observer, disconnect it
    if(observer.current) observer.current.disconnect();

    // define observer 
    observer.current = new IntersectionObserver((entries)=>{
        if(entries[0].isIntersecting && hasMore && !loadingMore){
          setLoadingMore(true);
          setPage(prev=>prev + 1);
        }
  })
    
      if(node) observer.current.observe(node);
  },[loadingMore,hasMore])

useEffect(() => {
    const loadData = async () => {
      // If it's page 1 and we already have colleges but no filters, we can skip initial load
      // But for simplicity and to handle filters, let's just fetch if page is 1 and it's a "reset" or filter change
      
      setLoadingMore(true);
      try {
        const offset = (page - 1) * LIMIT;
        const url = new URL(`${API_URL}/api/colleges`);
        url.searchParams.append('limit', LIMIT.toString());
        url.searchParams.append('offset', offset.toString());
        if (search) url.searchParams.append('search', search);

        const res = await fetch(url.toString());
        const data = await res.json();
        
        if (data.length < LIMIT) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        
        setColleges(prev => {
          if (page === 1) return data;
          const existingIds = new Set(prev.map(c => c.id));
          const newColleges = data.filter((c: College) => !existingIds.has(c.id));
          return [...prev, ...newColleges];
        });
      } catch (err) {
        console.error("Failed to load colleges", err);
      } finally {
        setLoadingMore(false);
      }
    };
    
    loadData();
  }, [page, search]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [search]);


  return (
    <div className="space-y-8 animate-page-in">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#203d1f] px-6 py-14 text-white shadow-2xl shadow-emerald-950/15 sm:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(244,162,97,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.28),transparent_34%)]" />
        <div className="relative mx-auto max-w-2xl space-y-6 text-center">
          <p className="mx-auto rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#f4d35e] w-fit">
            Discovery Desk
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl text-balance">Find campuses that actually match you</h1>
          <p className="text-lg text-emerald-50/80">
            Filter by place, compare fees, and open detailed profiles without losing the thread.
          </p>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-white/10 p-2 text-left backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#f4d35e]" />
              <input
                type="text"
                placeholder="Search by college name..."
                className="w-full rounded-2xl border-none bg-transparent py-3 pl-12 pr-4 text-white placeholder-slate-300 outline-none transition focus:bg-white/10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <h2 className="flex items-center gap-3 text-2xl font-black text-slate-800">
          Colleges
          <span className="rounded-full border border-[#31572c]/10 bg-[#31572c]/10 px-3 py-1 text-sm font-semibold text-[#31572c]">
            {colleges.length} Found
          </span>
        </h2>
        <button onClick={() => setSearch('')} className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-[#31572c]">
          <Filter className="h-4 w-4" /> Reset
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#31572c]" />
          <p className="animate-pulse font-medium text-slate-400">Loading colleges...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {colleges.map((college, index) => (
            <motion.div
              key={college.id}
              ref={index === colleges.length - 1 ? lastElementRef : null}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
              className="surface lift-card group flex flex-col overflow-hidden rounded-3xl"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={getCollegeImage(college, index)}
                  alt={college.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-2 font-bold text-white">
                    View Profile <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="absolute left-4 top-4 z-20">
                  <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-bold shadow-sm backdrop-blur-md">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> {college.rating}
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleSave(college);
                  }}
                  className={`absolute right-4 top-4 z-20 rounded-full p-2.5 shadow-sm backdrop-blur-md transition-all ${
                    savedIds.has(college.id)
                      ? 'bg-[#203d1f] text-white'
                      : 'bg-white/90 text-slate-400 hover:text-[#203d1f]'
                  }`}
                  aria-label={savedIds.has(college.id) ? 'Remove from shortlist' : 'Save college'}
                >
                  <Bookmark className={`h-5 w-5 ${savedIds.has(college.id) ? 'fill-white' : ''}`} />
                </button>
              </div>

              <div className="flex flex-1 flex-col space-y-4 p-6">
                <h3 className="text-xl font-black leading-tight text-slate-900 group-hover:text-[#31572c] transition-colors">{college.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#f7f1df] px-3 py-1 text-xs font-bold text-[#6b4f2a]">{college.popularFor}</span>
                  {college.city && <span className="rounded-full bg-[#e8f3f5] px-3 py-1 text-xs font-bold text-[#0e7490]">{college.city}</span>}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4 text-[#31572c]" />
                  <span className="text-sm">{college.location}</span>
                </div>

                <div className="flex items-center justify-between border-y border-slate-100 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Average Fees</p>
                    <p className="font-bold text-[#31572c]">
                      Rs. {college.fees.toLocaleString()}
                      <span className="text-xs font-normal text-slate-400">/year</span>
                    </p>
                  </div>
                  <button
                    onClick={() => addToCompare(college)}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-600 transition-all hover:bg-[#31572c] hover:text-white"
                    title="Add to Comparison"
                  >
                    <Scale className="h-4 w-4" />
                  </button>
                </div>

                <Link
                  to={`/college/${college.id}`}
                  className="btn-primary block w-full py-3 text-center"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {loadingMore && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#31572c]" />
        </div>
      )}

      
    </div>
  );
};

export default CollegeList;
