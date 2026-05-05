import React from 'react';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import CollegeCard from '../components/CollegeCard';
import type { College } from '../types';

interface SavedListProps {
  savedColleges: College[];
  toggleSave: (college: College) => void;
  addToCompare: (college: College) => void;
  compareIds: Set<string>;
}

const SavedList: React.FC<SavedListProps> = ({ savedColleges, toggleSave, addToCompare, compareIds }) => {
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
          <CollegeCard
            key={college.id}
            college={college}
            isSaved={true}
            isInCompare={compareIds.has(college.id)}
            toggleSave={toggleSave}
            addToCompare={addToCompare}
          />
        ))}
      </div>
    </div>
  );
};

export default SavedList;
