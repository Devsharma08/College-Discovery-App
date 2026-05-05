import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';
import { Filter, Search } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import CollegeCard from '../components/CollegeCard';
import { Link } from 'react-router-dom';
import type { College } from '../types';
import { apiFetch, getErrorMessage } from '../lib/api';

const Profile: React.FC = () => {
  const { user, token, updateUser, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    gender: '',
    city: '',
    studyDestination: '',
    currentStatus: '',
    courseInterested: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Discovery state for profile
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterFees, setFilterFees] = useState<number | ''>('');

  // Fetch colleges for discovery section
  useEffect(() => {
    const fetchColleges = async () => {
      setLoadingColleges(true);
      try {
        const url = new URL(`${API_URL}/api/colleges`);
        url.searchParams.append('limit', '6');
        if (filterCourse) url.searchParams.append('course', filterCourse);
        if (filterState) url.searchParams.append('state', filterState);
        if (filterFees) url.searchParams.append('maxFees', filterFees.toString());
        
        const data = await apiFetch<College[]>(url.toString());
        setColleges(data);
      } catch (err) {
        console.error(getErrorMessage(err, 'Failed to load discovery colleges'));
      } finally {
        setLoadingColleges(false);
      }
    };

    fetchColleges();
  }, [filterCourse, filterState, filterFees]);

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        fullName: user.profile.fullName || '',
        mobileNumber: user.profile.mobileNumber || '',
        gender: user.profile.gender || '',
        city: user.profile.city || '',
        studyDestination: user.profile.studyDestination || '',
        currentStatus: user.profile.currentStatus || '',
        courseInterested: user.profile.courseInterested || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    
    try {
      const updatedProfile = await apiFetch<any>(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      updateUser({ ...user!, profile: updatedProfile });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <div className="surface p-8 rounded-3xl space-y-6">
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2 py-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-6">
            <Skeleton className="h-20 w-full rounded-xl" count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-slate-500">Please log in to view your profile.</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-0">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 items-start">
        
        {/* Left Sidebar: Profile & Filters - Responsive Layout */}
        <aside className="flex flex-col lg:sticky lg:top-32 lg:min-h-screen bg-white lg:border-r border-slate-100 p-0 lg:p-8 lg:pt-2 overflow-y-visible lg:overflow-y-auto no-scrollbar">
          {/* Profile Section */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-[#31572c]/10 rounded-full flex items-center justify-center text-[#31572c] font-black text-lg">
                {user.username?.[0] || 'U'}
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-none mb-1">{user.username}</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Full Name</label>
                  <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:ring-2 focus:ring-[#31572c] outline-none text-[11px] font-bold" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Account Status</label>
                  <select required name="currentStatus" value={formData.currentStatus} onChange={handleChange} className="w-full px-4 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:ring-2 focus:ring-[#31572c] outline-none text-[11px] font-bold uppercase">
                    <option value="">Select Status</option>
                    <option value="Aspirant">Aspirant</option>
                    <option value="Student">Student</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-val group/btn w-full scale-90"
              >
                <span className="btn-val_lg bg-[#1a1a1a] !py-2">
                  <span className="btn-val_sl bg-[#31572c]"></span>
                  <span className="btn-val_text text-[10px]">{isSaving ? 'Saving...' : 'Update Profile'}</span>
                </span>
              </button>
            </form>
          </div>

          {/* Discovery Section */}
          <div className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[#31572c] flex items-center gap-2 mb-4">
              <Filter className="w-3.5 h-3.5" /> Discovery Filters
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Annual Fees</label>
                <div className="flex flex-wrap gap-1.5">
                  {[200000, 500000, 1000000].map(fee => (
                    <button
                      key={fee}
                      onClick={() => setFilterFees(filterFees === fee ? '' : fee)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterFees === fee ? 'bg-[#31572c] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      &lt; {fee/100000}L
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Target State</label>
                <select 
                  value={filterState} 
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 p-2 text-[10px] font-black uppercase text-slate-700 outline-none focus:ring-2 focus:ring-[#31572c]"
                >
                  <option value="">All Regions</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Preferred Program</label>
                <div className="flex flex-col gap-1">
                  {[
                    'Architecture', 'Business Administration', 'Civil Engineering', 
                    'Commerce', 'Computer Science and Engineering', 'Dental Surgery', 
                    'Electrical Engineering', 'Finance', 'Information Technology', 
                    'Law', 'Marketing Management'
                  ].slice(0, 8).map(c => (
                    <button
                      key={c}
                      onClick={() => setFilterCourse(filterCourse === c ? '' : c)}
                      className={`text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${filterCourse === c ? 'bg-[#31572c] text-white border-[#31572c]' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="space-y-10 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personalized discovery</h2>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">Matches for {user.username}</p>
            </div>
            <Link to="/discover" className="text-[10px] font-black uppercase tracking-widest text-[#31572c] hover:underline">Full Explore →</Link>
          </div>

          {loadingColleges ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="surface h-[400px] rounded-3xl animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : colleges.length === 0 ? (
            <div className="surface p-20 rounded-[3rem] text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No matches found</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Try broadening your filters to see more institutions.</p>
              <button onClick={() => { setFilterCourse(''); setFilterState(''); setFilterFees(''); }} className="text-[#31572c] font-bold underline">Reset Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {colleges.map(college => (
                <CollegeCard
                  key={college.id}
                  college={college}
                  isSaved={false} // Would need savedIds prop for full sync
                  isInCompare={false}
                  toggleSave={() => {}} 
                  addToCompare={() => {}}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
