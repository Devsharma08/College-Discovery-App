import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Search, 
  MapPin, 
  TrendingUp, 
  ChevronRight,
  Plus,
  Heart,
  Building2,
  BookOpen,
  Briefcase,
  Wallet,
  Scale,
  ShieldCheck,
  Users,
  Info,
  ArrowRight,
  Star,
  Award,
  Zap,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { API_URL } from '../config';
import type { College } from '../types';
import { CourseRankingSkeleton } from '../components/Skeleton';

interface Specialization {
  name: string;
  isBest: boolean;
  reason: string;
  avgPackage: string;
  demand: 'High' | 'Medium' | 'Trending';
}

interface GeneralCourse {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  regulatoryRules: string;
  opportunities: string;
  bestBranchNote: string;
  specializations: Specialization[];
  topColleges: College[];
}

const COURSE_HUB: GeneralCourse[] = [
  {
    id: 'engineering',
    name: 'Engineering & Technology',
    icon: <Zap className="w-5 h-5" />,
    description: 'Engineering is the application of scientific principles to design and build machines, structures, and other items, including bridges, tunnels, roads, vehicles, and buildings. In the modern era, it extends to software, electronics, and biotechnology.',
    regulatoryRules: 'Admissions are strictly via entrance exams like JEE Main, JEE Advanced, BITSAT, or State CETs. All colleges must be AICTE approved. 4-year degree (B.Tech/B.E) with mandatory project work.',
    opportunities: 'Global demand for technical problem solvers. Opportunities range from Silicon Valley tech giants to indigenous manufacturing and research labs.',
    bestBranchNote: 'Computer Science (AI & ML) is currently the best branch due to the global digital transformation and massive salary increments in specialized technical roles.',
    specializations: [
      { name: 'Computer Science (AI & ML)', isBest: true, reason: 'High demand in tech sector', avgPackage: '12-45 LPA', demand: 'High' },
      { name: 'Data Science', isBest: false, reason: 'Growing analytics market', avgPackage: '10-30 LPA', demand: 'Trending' },
      { name: 'Electronics & Communication', isBest: false, reason: 'Semiconductor industry boom', avgPackage: '8-20 LPA', demand: 'High' },
      { name: 'Mechanical Engineering', isBest: false, reason: 'EV and Automation focus', avgPackage: '6-15 LPA', demand: 'Medium' }
    ],
    topColleges: [
      { id: 'iitm', name: 'IIT Madras', city: 'Chennai', state: 'Tamil Nadu', location: 'Chennai, Tamil Nadu', rating: 4.9, fees: 220000, imgUrl: '', popularFor: 'Engineering' },
      { id: 'iitd', name: 'IIT Delhi', city: 'New Delhi', state: 'Delhi', location: 'New Delhi, Delhi', rating: 4.8, fees: 215000, imgUrl: '', popularFor: 'Engineering' },
      { id: 'iitb', name: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra', location: 'Mumbai, Maharashtra', rating: 4.8, fees: 230000, imgUrl: '', popularFor: 'Engineering' },
      { id: 'bits', name: 'BITS Pilani', city: 'Pilani', state: 'Rajasthan', location: 'Pilani, Rajasthan', rating: 4.7, fees: 550000, imgUrl: '', popularFor: 'Engineering' },
      { id: 'nitt', name: 'NIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu', location: 'Tiruchirappalli, Tamil Nadu', rating: 4.6, fees: 180000, imgUrl: '', popularFor: 'Engineering' }
    ]
  },
  {
    id: 'management',
    name: 'Management & Business',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Management education focuses on the leadership and organizational skills required to run businesses and non-profits. It combines strategy, finance, marketing, and human resource management.',
    regulatoryRules: 'PG programs (MBA/PGDM) require CAT/GMAT/XAT scores. UG programs (BBA/BMS) often use IPMAT or CUET. Accreditation by AMBA or EQUIS is a sign of high quality.',
    opportunities: 'Leadership roles, entrepreneurial ventures, management consulting, and investment banking.',
    bestBranchNote: 'Marketing & Digital Strategy is the best branch for creative leaders, while Finance remains the best for high-compensation roles in banking and fintech.',
    specializations: [
      { name: 'Finance', isBest: true, reason: 'Core business function', avgPackage: '15-50 LPA', demand: 'High' },
      { name: 'Marketing Management', isBest: false, reason: 'Digital growth focus', avgPackage: '10-30 LPA', demand: 'High' },
      { name: 'Business Analytics', isBest: false, reason: 'Data-driven decision making', avgPackage: '12-35 LPA', demand: 'Trending' },
      { name: 'Human Resources', isBest: false, reason: 'People & Culture focus', avgPackage: '8-18 LPA', demand: 'Medium' }
    ],
    topColleges: [
      { id: 'iima', name: 'IIM Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', location: 'Ahmedabad, Gujarat', rating: 4.9, fees: 2500000, imgUrl: '', popularFor: 'Management' },
      { id: 'iimb', name: 'IIM Bangalore', city: 'Bengaluru', state: 'Karnataka', location: 'Bengaluru, Karnataka', rating: 4.9, fees: 2450000, imgUrl: '', popularFor: 'Management' },
      { id: 'iimc', name: 'IIM Calcutta', city: 'Kolkata', state: 'West Bengal', location: 'Kolkata, West Bengal', rating: 4.8, fees: 2400000, imgUrl: '', popularFor: 'Management' },
      { id: 'xlri', name: 'XLRI Jamshedpur', city: 'Jamshedpur', state: 'Jharkhand', location: 'Jamshedpur, Jharkhand', rating: 4.7, fees: 2300000, imgUrl: '', popularFor: 'Management' },
      { id: 'fms', name: 'FMS Delhi', city: 'New Delhi', state: 'Delhi', location: 'New Delhi, Delhi', rating: 4.7, fees: 200000, imgUrl: '', popularFor: 'Management' }
    ]
  },
  {
    id: 'medical',
    name: 'Medical & Healthcare',
    icon: <Heart className="w-5 h-5" />,
    description: 'Medical science focuses on the diagnosis, treatment, and prevention of disease. It is a highly specialized field requiring rigorous training and ethical commitment.',
    regulatoryRules: 'Admission strictly through NEET-UG. Courses are regulated by the National Medical Commission (NMC). 5.5 years duration including 1 year internship.',
    opportunities: 'Clinical practice, specialized surgery, public health policy, and global healthcare administration.',
    bestBranchNote: 'MBBS (General Medicine) is the foundational best branch, followed by specialized PG branches like Cardiology or Radio-diagnosis for high-impact careers.',
    specializations: [
      { name: 'General Medicine (MBBS)', isBest: true, reason: 'Primary practitioner role', avgPackage: '8-20 LPA', demand: 'High' },
      { name: 'Dental Surgery (BDS)', isBest: false, reason: 'Private practice potential', avgPackage: '4-12 LPA', demand: 'Medium' },
      { name: 'Nursing Science', isBest: false, reason: 'Global healthcare demand', avgPackage: '3-8 LPA', demand: 'High' },
      { name: 'Pharmacy (B.Pharm)', isBest: false, reason: 'Drug research & pharma', avgPackage: '4-10 LPA', demand: 'Trending' }
    ],
    topColleges: [
      { id: 'aiims', name: 'AIIMS Delhi', city: 'New Delhi', state: 'Delhi', location: 'New Delhi, Delhi', rating: 4.9, fees: 1628, imgUrl: '', popularFor: 'Medicine' },
      { id: 'cmc', name: 'CMC Vellore', city: 'Vellore', state: 'Tamil Nadu', location: 'Vellore, Tamil Nadu', rating: 4.8, fees: 52000, imgUrl: '', popularFor: 'Medicine' },
      { id: 'jipmer', name: 'JIPMER Puducherry', city: 'Puducherry', state: 'Puducherry', location: 'Puducherry, Puducherry', rating: 4.7, fees: 12000, imgUrl: '', popularFor: 'Medicine' },
      { id: 'kgmu', name: 'KGMU Lucknow', city: 'Lucknow', state: 'Uttar Pradesh', location: 'Lucknow, Uttar Pradesh', rating: 4.6, fees: 54000, imgUrl: '', popularFor: 'Medicine' },
      { id: 'bmc', name: 'BMC Bangalore', city: 'Bengaluru', state: 'Karnataka', location: 'Bengaluru, Karnataka', rating: 4.5, fees: 70000, imgUrl: '', popularFor: 'Medicine' }
    ]
  }
];

interface CoursesProps {
  addToCompare: (college: College) => void;
  toggleSave: (college: College) => void;
  savedIds: Set<string>;
  compareIds: Set<string>;
}

const Courses: React.FC<CoursesProps> = ({ addToCompare, toggleSave, savedIds, compareIds }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<GeneralCourse>(COURSE_HUB[0]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCollegesForField = async () => {
      setLoading(true);
      try {
        const url = new URL(`${API_URL}/api/colleges`);
        // We fetch colleges related to the general field name or first specialization
        url.searchParams.append('search', selectedCourse.name.split(' ')[0]);
        url.searchParams.append('sort', 'rating');
        url.searchParams.append('limit', '10');

        const data = await apiFetch<College[]>(url.toString());
        // Merge mock data with real data to ensure top 5 are always present
        const merged = [...selectedCourse.topColleges];
        data.forEach(c => {
          if (!merged.find(m => m.id === c.id)) merged.push(c);
        });
        setColleges(merged.slice(0, 10));
      } catch (err) {
        console.error('Failed to fetch course rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegesForField();
  }, [selectedCourse]);

  const filteredHub = useMemo(() => {
    if (!searchQuery) return COURSE_HUB;
    return COURSE_HUB.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specializations.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  return (
    <div className="space-y-12 animate-page-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-[#203d1f] px-6 py-20 text-white shadow-2xl shadow-emerald-950/20 sm:px-16">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="relative z-10 max-w-4xl">
          <div className="eyebrow mb-8">
            <GraduationCap className="w-3.5 text-white h-3.5" /> 
            <span className="text-white/80 pl-1.5">Program Intelligence 2026</span>
          </div>
          <h1 className="text-4xl font-black sm:text-7xl tracking-tighter leading-[0.95] mb-8">
            Academic <span className="text-emerald-400">Pathways</span> & Specializations
          </h1>
          <p className="text-xl text-emerald-50/80 font-medium leading-relaxed max-w-2xl">
            Choose your field and discover the most promising branches, regulatory standards, 
            and top-tier institutions for your career.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="surface p-2 rounded-3xl space-y-1 sticky top-24">
            <div className="p-4 mb-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#31572c] outline-none"
                />
              </div>
            </div>
            
            {filteredHub.map((field) => (
              <button
                key={field.id}
                onClick={() => setSelectedCourse(field)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${
                  selectedCourse.id === field.id
                    ? 'bg-[#203d1f] text-white shadow-lg'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedCourse.id === field.id ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  {field.icon}
                </div>
                {field.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
          {/* Field Overview */}
          <div className="surface p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCourse.name}</h2>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-widest">General Course</span>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed italic">
                  {selectedCourse.description}
                </p>
              </div>
              <div className="bg-[#f6f4ee] p-6 rounded-3xl w-full sm:w-64 shrink-0">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#203d1f] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Regulation Check
                </h4>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                  {selectedCourse.regulatoryRules}
                </p>
              </div>
            </div>

            {/* Top Branches Analysis */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Branch Recommendations</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Market Intelligence 2026</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-6 border border-dashed border-slate-200">
                <p className="text-sm font-bold text-[#31572c] leading-relaxed flex gap-3">
                  <Zap className="w-5 h-5 shrink-0" />
                  {selectedCourse.bestBranchNote}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCourse.specializations.map((spec) => (
                  <div key={spec.name} className={`relative p-6 rounded-3xl border transition-all ${
                    spec.isBest ? 'bg-[#203d1f] text-white border-transparent' : 'bg-white border-slate-100'
                  }`}>
                    {spec.isBest && (
                      <div className="absolute top-4 right-4 bg-emerald-400 text-white p-1 rounded-lg">
                        <Award className="w-4 h-4" />
                      </div>
                    )}
                    <h4 className="text-lg font-black tracking-tight mb-2">{spec.name}</h4>
                    <p className={`text-xs font-medium mb-4 ${spec.isBest ? 'text-emerald-100/70' : 'text-slate-400'}`}>
                      {spec.reason}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className={`text-[8px] font-black uppercase tracking-widest ${spec.isBest ? 'text-emerald-300' : 'text-slate-400'}`}>Avg. Salary</p>
                        <p className="text-sm font-black">{spec.avgPackage}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        spec.demand === 'High' ? 'bg-red-500/10 text-red-500' :
                        spec.demand === 'Trending' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {spec.demand} Demand
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Institutional Ranking for this Field */}
          <div className="surface p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Institutional Rankings</h3>
                <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-tight">Top colleges offering {selectedCourse.name}</p>
              </div>
              <Link to="/discover" className="text-[10px] font-black text-[#31572c] uppercase hover:underline flex items-center gap-1">
                Full Discovery Hub <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <CourseRankingSkeleton />
              ) : colleges.map((college, index) => (
                <div key={college.id} className="group relative p-6 rounded-3xl bg-white border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="flex items-center gap-5 mb-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-700' : 
                      index === 1 ? 'bg-slate-200 text-slate-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={`/college/${college.id}`} className="block font-black text-slate-800 hover:text-[#31572c] truncate">
                        {college.name}
                      </Link>
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {college.city}
                      </span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-black">
                      {college.rating.toFixed(1)} ★
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Est. Fees</p>
                      <p className="text-xs font-black text-slate-700">₹{(college.fees / 100000).toFixed(1)}L / Year</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleSave(college)} className={`p-2 rounded-xl transition-all ${
                        savedIds.has(college.id) ? 'bg-pink-50 text-pink-500' : 'bg-slate-50 text-slate-300 hover:text-pink-500'
                      }`}>
                        <Heart className={`w-3.5 h-3.5 ${savedIds.has(college.id) ? 'fill-current' : ''}`} />
                      </button>
                      <Link to={`/college/${college.id}`} className="p-2 bg-[#31572c] text-white rounded-xl shadow-lg shadow-emerald-950/10">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
