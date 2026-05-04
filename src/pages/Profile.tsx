import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';
import { User as UserIcon, BookOpen, GraduationCap, MapPin, Briefcase } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, token, updateUser } = useAuth();
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
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedProfile = await res.json();
      
      updateUser({ ...user!, profile: updatedProfile });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-slate-500">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="surface p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.username}</h1>
            <p className="text-slate-500">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Details */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
              <UserIcon className="w-5 h-5 text-blue-500" /> Your Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name*</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="unknown user" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number*</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 border border-r-0 border-slate-300 bg-slate-50 text-slate-500 rounded-l-xl">+91</span>
                  <input required type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-r-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="9599532240" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender*</label>
                <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City You Live In*</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="New Delhi" />
              </div>
            </div>
          </section>

          {/* Academic & Intent */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
              <GraduationCap className="w-5 h-5 text-emerald-500" /> Academic Journey
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Study Destination</label>
                <select name="studyDestination" value={formData.studyDestination} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Preference</option>
                  <option value="Interested in Indian Colleges">Interested in Indian Colleges</option>
                  <option value="Study Abroad">Study Abroad</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What Currently Describes You Best?*</label>
                <select required name="currentStatus" value={formData.currentStatus} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Status</option>
                  <option value="Looking for Admission (Aspirant)">Looking for Admission (Aspirant)</option>
                  <option value="School Student">School Student</option>
                  <option value="College Student">College Student</option>
                  <option value="Working Professional">Working Professional</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Interested*</label>
                <input required type="text" name="courseInterested" value={formData.courseInterested} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="MBBS - Bachelors (Medicine and Surgery)" />
              </div>
            </div>
          </section>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="btn-primary px-8 py-3 rounded-xl shadow-lg disabled:opacity-70 flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
