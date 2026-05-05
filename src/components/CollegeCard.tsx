import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, MapPin, Scale } from 'lucide-react';
import type { College } from '../types';

interface CollegeCardProps {
  college: College;
  isSaved: boolean;
  isInCompare: boolean;
  toggleSave: (college: College) => void;
  addToCompare: (college: College) => void;
  innerRef?: (node?: Element | null) => void;
}

const CollegeCard: React.FC<CollegeCardProps> = ({ college, isSaved, isInCompare, toggleSave, addToCompare, innerRef }) => {
  return (
    <article
      ref={innerRef}
      className="surface lift-card flex flex-col h-[520px] rounded-[2.5rem] overflow-hidden group shadow-sm border border-slate-100"
    >
      {/* Image Header Section */}
      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={college.imgUrl} 
          alt={college.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top Actions */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black shadow-lg backdrop-blur-md">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {college.rating}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(college);
            }}
            className={`rounded-full p-2.5 shadow-lg backdrop-blur-md transition-all ${
              isSaved ? 'bg-[#203d1f] text-white' : 'bg-white/95 text-slate-400 hover:text-[#203d1f]'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Badges Overlay */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 z-10">
          <span className="rounded-lg bg-white/20 backdrop-blur-md px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white border border-white/20">
            {college.popularFor}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-7 space-y-4">
        <div className="space-y-3">
          <h3 className="text-xl font-black leading-[1.2] text-slate-900 group-hover:text-[#31572c] transition-colors line-clamp-3 min-h-[4.5rem]">
            {college.name}
          </h3>
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-[#31572c] shrink-0" />
            <span className="text-xs font-bold leading-tight">{college.location}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-5">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Annual Fees</p>
            <p className="font-black text-slate-900 text-sm">
              ₹{college.fees.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Region</p>
            <p className="font-black text-slate-900 text-sm truncate">
              {college.city || 'India'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-auto pt-2">
          <Link
            to={`/college/${college.id}`}
            className="btn-val group/btn flex-1"
          >
            <span className="btn-val_lg py-2.5 text-[10px]">
              <span className="btn-val_sl bg-[#31572c]"></span>
              <span className="btn-val_text">Explore Profile</span>
            </span>
          </Link>
          <button
            onClick={() => addToCompare(college)}
            className={`w-11 h-11 flex items-center justify-center rounded-2xl border-2 transition-all ${
              isInCompare 
                ? 'bg-[#31572c] border-[#31572c] text-white shadow-lg' 
                : 'border-slate-100 text-slate-400 hover:border-[#31572c] hover:bg-[#31572c] hover:text-white'
            }`}
            title={isInCompare ? "Remove from Comparison" : "Add to Comparison"}
          >
            <Scale className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default CollegeCard;
