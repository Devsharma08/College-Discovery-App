import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, Loader2, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { College } from '../types';
import { API_URL } from '../config';
import CollegeCard from '../components/CollegeCard';
import { apiFetch, getErrorMessage } from '../lib/api';
import { getCollegeFilterMeta } from '../lib/collegeFilters';

interface CollegeListProps {
  addToCompare: (college: College) => void;
  toggleSave: (college: College) => void;
  savedIds: Set<string>;
  compareIds: Set<string>;
}

const LIMIT = 20;

const CollegeList: React.FC<CollegeListProps> = ({ addToCompare, toggleSave, savedIds, compareIds }) => {
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Own local state — independent from context so filters don't race
  const [colleges, setColleges] = useState<College[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for infinite scrolling
  const lastElementRef = useCallback(
    (node?: Element | null) => {
      if (loadingMore || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore]
  );

  // Filter state — initialize from URL query params so Home page links work
  const [maxFees, setMaxFees] = useState<number | ''>('');
  const [course, setCourse] = useState(searchParams.get('course') || '');
  const [state, setStateLoc] = useState(searchParams.get('state') || '');
  const [city, setCity] = useState('');
  const [facility, setFacility] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('');
  // Dynamic filter options from backend
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch filter meta once
  useEffect(() => {
    getCollegeFilterMeta()
      .then((data) => {
        if (data.states) setAvailableStates(data.states);
        if (data.cities) setAvailableCities(data.cities);
        if (data.courses) setAvailableCourses(data.courses);
        if (data.types) setAvailableTypes(data.types);
      })
      .catch((err) => console.error(getErrorMessage(err, 'Failed to load filters')));
  }, []);

  // Debounce search input (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Main data fetcher — fires whenever page or any filter changes
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      if (page === 1) setInitialLoading(true);
      setLoadingMore(true);
      setError(null);

      try {
        const offset = (page - 1) * LIMIT;
        const url = new URL(`${API_URL}/api/colleges`);
        url.searchParams.append('limit', LIMIT.toString());
        url.searchParams.append('offset', offset.toString());
        if (debouncedSearch) url.searchParams.append('search', debouncedSearch);
        if (maxFees) url.searchParams.append('maxFees', maxFees.toString());
        if (course) url.searchParams.append('course', course);
        if (state) url.searchParams.append('state', state);
        if (city) url.searchParams.append('city', city);
        if (facility) url.searchParams.append('facility', facility);
        if (type) url.searchParams.append('type', type);
        if (sort) url.searchParams.append('sort', sort);

        const data = await apiFetch<College[]>(url.toString(), { signal: controller.signal });

        setHasMore(data.length >= LIMIT);

        setColleges((prev) => {
          if (page === 1) return data;
          const existingIds = new Set(prev.map((c) => c.id));
          const newColleges = data.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newColleges];
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const message = getErrorMessage(err, 'Failed to load colleges');
          setError(message);
          console.error(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMore(false);
          setInitialLoading(false);
        }
      }
    };

    loadData();
    return () => controller.abort();
  }, [page, debouncedSearch, maxFees, course, state, city, facility, type, sort]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setColleges([]); // clear stale data immediately so the user sees a fresh load
  }, [debouncedSearch, maxFees, course, state, city, facility, type, sort]);

  const activeFilterCount = [debouncedSearch, maxFees, course, state, city, facility, type, sort].filter(Boolean).length;

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="space-y-8 animate-page-in">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#203d1f] px-6 py-12 text-white shadow-2xl shadow-emerald-950/15 sm:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(244,162,97,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.28),transparent_34%)]" />
        <div className="relative mx-auto max-w-2xl space-y-5 text-left">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl text-balance">Discovery engine</h1>
          <div className="brutalist-container pt-2">
            <Search className="absolute left-4 top-[1.75rem] h-5 w-5 text-[#1a1a1a] z-20" />
            <input
              type="text"
              placeholder="SEARCH INSTITUTIONS..."
              className="brutalist-input smooth-type"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <label className="brutalist-label">Active Search</label>
          </div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#31572c] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10"
        >
          <Filter className="w-4 h-4" /> {isMobileFiltersOpen ? 'Close Console' : 'Discovery Console'}
          {activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px]">{activeFilterCount}</span>}
        </button>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-slate-400">Viewing</p>
          <p className="text-sm font-black text-slate-900">{colleges.length} Institutions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start relative">
        {/* Left Sidebar Filters - Premium Discovery Console (Desktop) & Mobile Drawer */}
        <aside className={`${isMobileFiltersOpen ? 'flex fixed inset-0 z-[100] bg-white p-6' : 'hidden'} lg:flex flex-col lg:sticky lg:top-32 lg:max-h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all`}>
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#31572c]" /> Discovery Console
            </h2>
            <div className="flex items-center gap-4">
              {activeFilterCount > 0 && (
                <button 
                  onClick={() => { setSearch(''); setMaxFees(''); setCourse(''); setStateLoc(''); setCity(''); setFacility(''); setType(''); setSort(''); }}
                  className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                >
                  Clear
                </button>
              )}
              <button onClick={() => setIsMobileFiltersOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-900">
                <Search className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto no-scrollbar space-y-8 pb-10">
            {/* Fees Section */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Investment (Annual)</label>
              <div className="grid grid-cols-2 gap-2">
                {[100000, 200000, 500000, 1000000].map(fee => (
                  <button
                    key={fee}
                    onClick={() => setMaxFees(maxFees === fee ? '' : fee)}
                    className={`px-2 py-2 rounded-xl text-[10px] font-bold transition-all border ${maxFees === fee ? 'bg-[#31572c] text-white border-[#31572c]' : 'bg-white text-slate-600 border-slate-100 hover:border-[#31572c]'}`}
                  >
                    &lt; {fee/100000}L
                  </button>
                ))}
              </div>
            </div>

            {/* Programs Section */}
            <div>
              <div className="flex items-center justify-between mb-4 ml-1">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Specialization</label>
                <span className="text-[9px] font-bold text-slate-300">{availableCourses.length || 11} Courses</span>
              </div>
              <div className="space-y-1">
                {(availableCourses.length > 0 ? availableCourses.slice(0, 11) : [
                  'Architecture', 'Business Administration', 'Civil Engineering', 
                  'Commerce', 'Computer Science and Engineering', 'Dental Surgery', 
                  'Electrical Engineering', 'Finance', 'Information Technology', 
                  'Law', 'Marketing Management'
                ]).map(c => (
                  <button
                    key={c}
                    onClick={() => setCourse(course === c ? '' : c)}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold transition-all border text-left ${course === c ? 'bg-[#31572c] text-white border-[#31572c]' : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'}`}
                  >
                    <span className="truncate max-w-[180px]">{c}</span>
                    {course === c && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Institution Type Section */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Institution Type</label>
              <div className="space-y-2">
                {(availableTypes.length > 0 ? availableTypes : ['Government', 'Private', 'Deemed', 'Autonomous']).map(t => (
                  <label key={t} className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all ${type === t ? 'bg-[#31572c] border-[#31572c] text-white' : 'border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-200'}`}>
                    <input 
                      type="checkbox" 
                      checked={type === t}
                      onChange={() => setType(type === t ? '' : t)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#31572c] focus:ring-[#31572c]" 
                    />
                    <span className={`text-[11px] font-bold ${type === t ? 'text-white' : 'text-slate-600'}`}>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Section */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Geographic Filter</label>
              <div className="space-y-3">
                <select 
                  value={state} 
                  onChange={(e) => { setStateLoc(e.target.value); setCity(''); }}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-[#31572c] transition-all"
                >
                  <option value="">All States</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-[#31572c] transition-all"
                >
                  <option value="">All Cities</option>
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Sorting Section */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Sort results by</label>
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-[11px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-[#31572c] shadow-sm"
              >
                <option value="">Rating (High to Low)</option>
                <option value="rating_asc">Rating (Low to High)</option>
                <option value="fees_asc">Fees (Low to High)</option>
                <option value="fees_desc">Fees (High to Low)</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              Matched Institutions
              <span className="rounded-full bg-[#31572c]/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#31572c] border border-[#31572c]/10">
                {colleges.length} Found
              </span>
            </h2>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {initialLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="surface flex flex-col overflow-hidden rounded-3xl animate-pulse">
                  <div className="h-64 bg-slate-200" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-slate-200 rounded w-16" />
                      <div className="h-5 bg-slate-200 rounded w-16" />
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="pt-4 border-t border-slate-100 flex justify-between">
                      <div className="h-8 bg-slate-200 rounded w-24" />
                      <div className="h-8 bg-slate-200 rounded w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : colleges.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="bg-slate-100 p-5 rounded-full">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No colleges found</h3>
              <p className="text-slate-500 max-w-sm">Try adjusting your filters or search query to discover more colleges.</p>
              <button
                onClick={() => { setSearch(''); setMaxFees(''); setCourse(''); setStateLoc(''); setCity(''); setFacility(''); setType(''); setSort(''); }}
                className="btn-primary px-6 py-3 mt-2"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {colleges.map((college, index) => (
                <CollegeCard
                  key={college.id}
                  college={college}
                  isSaved={savedIds.has(college.id)}
                  isInCompare={compareIds.has(college.id)}
                  toggleSave={toggleSave}
                  addToCompare={addToCompare}
                  innerRef={index === colleges.length - 1 ? lastElementRef : undefined}
                />
              ))}
            </div>
          )}

      {loadingMore && !initialLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#31572c]" />
        </div>
      )}

      {!hasMore && colleges.length > 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm font-medium">All {colleges.length} colleges loaded ✓</p>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export default CollegeList;
