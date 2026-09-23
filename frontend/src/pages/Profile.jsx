import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../config';
import { User, Activity, Clock, ShieldCheck, Mail, Phone, Award, Building, DollarSign, Camera, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithAuth('/profile/', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data && data.full_name) {
          setProfile(data);
          localStorage.setItem('name', data.full_name);
        } else {
          setProfile(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
        setIsLoading(false);
      });
      
    return () => controller.abort();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving profile changes...');
    try {
      const res = await fetchWithAuth('/profile/', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profile.full_name,
          password: password || undefined
        })
      });
      if (res.ok) {
        toast.success('Profile saved successfully!', { id: loadingToast });
        localStorage.setItem('name', profile.full_name);
        setPassword('');
      } else {
        toast.error('Failed to save profile.', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Error connecting to server.', { id: loadingToast });
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="h-full w-full flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const isDoctor = profile?.role === 'Doctor' && profile?.doctor_profile;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500 text-slate-900">
      {/* Profile Header */}
      <div className="bg-blue-600 text-white rounded-3xl border border-blue-700 p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-32 h-32 bg-white text-blue-600 rounded-full flex items-center justify-center border-4 border-blue-200 shadow-lg overflow-hidden relative">
              <User size={64} className="group-hover:opacity-0 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                <Camera size={32} className="text-white" />
              </div>
            </div>
            {isDoctor && (
              <div className="absolute bottom-0 right-0 bg-emerald-500 w-8 h-8 rounded-full border-4 border-blue-600 flex items-center justify-center shadow-lg" title="Verified Consultant">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            )}
          </div>

          {/* Title Section */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-blue-500">
              <ShieldCheck size={14} />
              {profile?.role ? profile.role.replace('_', ' ') : 'User'}
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">{profile?.full_name || 'Hospital User'}</h1>
            <p className="text-blue-100 flex items-center justify-center md:justify-start gap-2 text-sm font-semibold">
              <Mail size={16} /> {profile?.email || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Details */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-8 shadow-md">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <User className="text-blue-600" /> Account Settings
          </h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
              <input 
                type="text" 
                value={profile.full_name} 
                onChange={e => setProfile({...profile, full_name: e.target.value})}
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-blue-600 transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">Email Address</label>
              <input 
                type="text" 
                value={profile.email} 
                disabled 
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-slate-500 cursor-not-allowed shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-600 mb-1.5 uppercase tracking-wide">Change Password</label>
              <input 
                type="password" 
                placeholder="Leave blank to keep current"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all shadow-xs"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-4"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Right Column: Professional Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Specific Info */}
          {isDoctor ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="text-emerald-600" /> Professional Credentials
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Building size={14} /> Department
                  </div>
                  <div className="text-slate-900 font-bold text-lg">{profile.doctor_profile.department_name}</div>
                  <div className="text-blue-600 text-sm font-semibold mt-0.5">{profile.doctor_profile.specialization}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Award size={14} /> Qualification
                  </div>
                  <div className="text-slate-900 font-bold text-lg">{profile.doctor_profile.qualification}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <ShieldCheck size={14} /> PMC Registration
                  </div>
                  <div className="text-slate-900 font-bold text-lg font-mono">{profile.doctor_profile.pmc_number || 'PMC-XXXXX'}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Clock size={14} /> Experience
                  </div>
                  <div className="text-slate-900 font-bold text-lg">{profile.doctor_profile.experience_years} Years Active</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <DollarSign size={14} /> Consultation Fee
                  </div>
                  <div className="text-emerald-600 font-extrabold text-lg">Rs. {profile.doctor_profile.consultation_fee}</div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="text-slate-500 text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Activity size={14} /> Primary Room
                  </div>
                  <div className="text-slate-900 font-bold text-lg">{profile.doctor_profile.room_number || 'OPD Desk'}</div>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="text-blue-700 font-bold mb-2">Biography</h3>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                  {profile.full_name} is a senior consultant in the {profile.doctor_profile.department_name} department with over {profile.doctor_profile.experience_years} years of clinical experience. Dedicated to providing compassionate care and utilizing evidence-based medical practices to improve patient outcomes. Actively involved in teaching and mentoring House Officers.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md flex flex-col items-center justify-center h-full min-h-[300px]">
              <ShieldCheck size={48} className="text-blue-600 mb-3" />
              <h3 className="text-lg font-extrabold text-slate-900">Hospital Staff Account</h3>
              <p className="text-slate-500 text-xs mt-1 text-center max-w-sm">Authorized hospital personnel profile with role-based portal access permissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
