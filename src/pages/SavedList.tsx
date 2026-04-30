import React from 'react';
import { Bookmark, MapPin, Star, ArrowRight, Trash2, GraduationCap, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { College } from '../types';

interface SavedListProps {
  savedColleges: College[];
  toggleSave: (college: College) => void;
  addToCompare: (college: College) => void;
}

const SavedList: React.FC<SavedListProps> = ({ savedColleges, toggleSave, addToCompare }) => {
  if (savedColleges.length === 0) {
    return (
      <div className="surface mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[2rem] px-8 py-24 text-center animate-page-in">
        <div className="bg-[#31572c]/10 p-8 rounded-full mb-8">
          <Bookmark className="w-16 h-16 text-[#31572c]" />
        </div>
        <p className="eyebrow mb-4">Shortlist</p>
        <h2 className="text-4xl font-black text-slate-900 mb-4 text-balance">Start building your college bench</h2>
        <p className="text-slate-500 max-w-sm mx-auto mb-10 text-lg leading-relaxed">
          Save colleges while browsing to compare them later and keep track of your favorites.
        </p>
        <Link to="/discover" className="btn-primary px-10 py-4">
          Start Browsing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-page-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Decision shelf</p>
          <h1 className="text-4xl font-black text-slate-900 mb-2">My Shortlist</h1>
          <p className="text-slate-500 text-lg">You have saved {savedColleges.length} colleges for consideration.</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold bg-[#31572c]/10 text-[#31572c] px-6 py-3 rounded-2xl">
          <Bookmark className="w-5 h-5 fill-[#31572c]" />
          Ready to Compare
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {savedColleges.map((college) => (
          <div key={college.id} className="surface lift-card group rounded-3xl overflow-hidden flex flex-col">
            <div className="relative h-64">
              <img src={college.imgUrl} alt={college.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-6 left-6 flex gap-2">
                 <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {college.rating}
                 </div>
              </div>
              <button 
                onClick={() => toggleSave(college)}
                className="absolute top-6 right-6 p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
                title="Remove from shortlist"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="mb-auto">
                <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-[#31572c] transition-colors">
                  {college.name}
                </h3>
                <div className="flex flex-wrap gap-4 text-slate-500 text-sm mb-6">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-4 h-4 text-[#31572c]" /> {college.location.split(',')[0]}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-[#0e7490]" /> {college.popularFor}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-50">
                <Link 
                  to={`/college/${college.id}`}
                  className="btn-primary flex-1 py-3 px-4 text-center"
                >
                  Details <ArrowRight className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => addToCompare(college)}
                  className="p-3 bg-[#31572c]/10 text-[#31572c] rounded-xl hover:bg-[#31572c] hover:text-white transition-all"
                  title="Add to Compare"
                >
                  <Scale className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedList;
