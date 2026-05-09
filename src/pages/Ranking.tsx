import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  Filter, 
  MapPin, 
  IndianRupee, 
  TrendingUp, 
  ArrowUpDown,
  ChevronRight,
  Plus,
  Heart,
  Info,
  ShieldCheck,
  Building2,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { API_URL } from '../config';
import type { College } from '../types';
import { getCollegeFilterMeta, type FilterMeta } from '../lib/collegeFilters';

interface RankingProps {
  addToCompare: (college: College) => void;
  toggleSave: (college: College) => void;
  savedIds: Set<string>;
  compareIds: Set<string>;
}

const Ranking: React.FC<RankingProps> = ({ addToCompare, toggleSave, savedIds, compareIds }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<FilterMeta | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [course, setCourse] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // rating, fees_asc, placements

  useEffect(() => {
    getCollegeFilterMeta().then(setMeta);
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(true);
      try {
        const url = new URL(`${API_URL}/api/colleges`);
        if (search) url.searchParams.append('search', search);
        if (state) url.searchParams.append('state', state);
        if (city) url.searchParams.append('city', city);
        if (type) url.searchParams.append('type', type);
        if (course) url.searchParams.append('course', course);
        url.searchParams.append('sort', sortBy === 'fees_asc' ? 'fees_asc' : 'rating');
        url.searchParams.append('limit', '50');

        const data = await apiFetch<College[]>(url.toString());
        setColleges(data);
      } catch (err) {
        console.error('Failed to fetch rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [search, state, city, type, course, sortBy]);

  return (
    <div className="space-y-10 animate-page-in">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#203d1f] px-6 py-16 text-white shadow-2xl shadow-emerald-950/20 sm:px-12">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="eyebrow mb-6 bg-white/10 text-white border-white/20">
            <Trophy className="w-3.5 h-3.5" /> 2026 League Tables
          </div>
          <h1 className="text-4xl font-black sm:text-6xl tracking-tight leading-[1.1] mb-6">
            Institutional <span className="text-emerald-400">Rankings</span> & Analysis
          </h1>
          <p className="text-lg text-emerald-50/80 font-medium leading-relaxed">
            Compare top-rated universities based on academic excellence, placement statistics, 
            and student ROI. Data-driven insights to help you choose your dream campus.
          </p>
        </div>
      </div>

      {/* Discovery & Filters Section */}
      <section className="surface p-8 rounded-[2rem] space-y-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Search Institution</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#31572c] transition-colors" />
              <input 
                type="text" 
                placeholder="Search by name, city or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#f6f4ee] border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#31572c] transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">State</label>
              <select 
                value={state}
                onChange={(e) => { setState(e.target.value); setCity(''); }}
                className="w-full bg-[#f6f4ee] border-none rounded-xl py-3.5 px-4 text-xs font-bold focus:ring-2 focus:ring-[#31572c] outline-none"
              >
                <option value="">All States</option>
                {meta?.states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#f6f4ee] border-none rounded-xl py-3.5 px-4 text-xs font-bold focus:ring-2 focus:ring-[#31572c] outline-none"
              >
                <option value="">All Types</option>
                {meta?.types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Course</label>
              <select 
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-[#f6f4ee] border-none rounded-xl py-3.5 px-4 text-xs font-bold focus:ring-2 focus:ring-[#31572c] outline-none"
              >
                <option value="">All Streams</option>
                {meta?.courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-[#f6f4ee] border-none rounded-xl py-3.5 px-4 text-xs font-black text-[#31572c] focus:ring-2 focus:ring-[#31572c] outline-none"
              >
                <option value="rating">Top Rated</option>
                <option value="fees_asc">Lowest Fees</option>
                <option value="placements">Best Placements</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Institution</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Fees (Yearly)</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Placements</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-6"><div className="h-6 w-8 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-6"><div className="h-6 w-48 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-6"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-6"><div className="h-6 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-6"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-6 py-6"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                  </tr>
                ))
              ) : colleges.length > 0 ? (
                colleges.map((college, index) => (
                  <tr key={college.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                        index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'
                      }`}>
                        #{index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#f6f4ee] flex items-center justify-center border border-slate-100 shrink-0">
                          <Building2 className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <Link to={`/college/${college.id}`} className="block font-black text-slate-800 hover:text-[#31572c] transition-colors truncate">
                            {college.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {college.city}, {college.state}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {college.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm font-bold text-slate-700">
                      <div className="flex flex-col">
                        <span>₹{(college.fees / 100000).toFixed(2)} Lakhs</span>
                        <span className="text-[10px] font-medium text-slate-400 tracking-tight">Average Course Fee</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-[#31572c] text-white px-2 py-1 rounded-lg text-xs font-black">
                          {college.rating.toFixed(1)} ★
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-700">
                          {college.placementStats?.[0] ? `${college.placementStats[0].placementPercentage}%` : 'N/A'} Placed
                        </span>
                      </div>
                      {college.placementStats?.[0] && (
                        <div className="text-[10px] font-medium text-slate-400 mt-1">
                          Avg: ₹{(college.placementStats[0].averagePackage / 100000).toFixed(1)} LPA
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleSave(college)}
                          className={`p-2.5 rounded-xl transition-all ${
                            savedIds.has(college.id) ? 'bg-pink-50 text-pink-500' : 'bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-pink-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${savedIds.has(college.id) ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => addToCompare(college)}
                          className={`p-2.5 rounded-xl transition-all ${
                            compareIds.has(college.id) ? 'bg-[#31572c] text-white' : 'bg-slate-50 text-slate-400 hover:bg-[#31572c] hover:text-white'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <Link to={`/college/${college.id}`} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-200 rounded-xl transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-bold">No institutions found matching your ranking criteria.</p>
                      <button onClick={() => { setSearch(''); setState(''); setType(''); setCourse(''); }} className="text-[#31572c] text-sm font-black uppercase hover:underline">Clear all filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust Badge Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Verified Data</h4>
            <p className="text-xs text-slate-400 font-medium">Sourced directly from NIRF & official reports.</p>
          </div>
        </div>
        <div className="surface p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">ROI Analysis</h4>
            <p className="text-xs text-slate-400 font-medium">Compare fees against average salary packages.</p>
          </div>
        </div>
        <div className="surface p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-slate-800 text-sm">Real-time Updates</h4>
            <p className="text-xs text-slate-400 font-medium">Rankings updated for the 2026 academic year.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
