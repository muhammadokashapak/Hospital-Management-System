import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hospital, User, KeyRound, Loader2, Key, Settings, Wifi } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getApiUrl, setCustomApiUrl } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Server Settings Modal State
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getApiUrl());

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const activeApiUrl = getApiUrl();
    try {
      const details = {
        'username': email.toLowerCase(),
        'password': password
      };

      const formBody = Object.keys(details)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key]))
        .join('&');

      const authRes = await fetch(`${activeApiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody
      });

      if (!authRes.ok) {
        throw new Error('Incorrect email or password');
      }

      const { access_token } = await authRes.json();

      // Fetch User Profile to get Name & Role for dashboard routing
      const profileRes = await fetch(`${activeApiUrl}/profile/`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (!profileRes.ok) {
        throw new Error('Failed to load user profile');
      }

      const profile = await profileRes.json();
      
      // Save all at once after successful profile fetch
      const role = (profile.role || '').replace('RoleEnum.', '');
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', profile.full_name || '');

      toast.success(`Welcome back, ${profile.full_name || 'User'}!`);

      // Route to dedicated dashboard
      if (role === 'SuperAdmin' || role === 'PlatformSuperAdmin') navigate('/super-admin');
      else if (role === 'HospitalOwner' || role === 'Owner') navigate('/hospital-owner');
      else if (role === 'Admin') navigate('/admin');
      else if (role === 'Receptionist') navigate('/reception');
      else if (role === 'Doctor') navigate('/doctor');
      else if (role === 'TMO') navigate('/tmo');
      else if (role === 'House_Officer' || role === 'House Officer') navigate('/ho');
      else if (role === 'Pharmacist') navigate('/pharmacist');
      else if (role === 'Lab_Tech' || role === 'LabTech') navigate('/lab');
      else if (role === 'Nurse') navigate('/nurse');
      else if (role === 'Emergency_Staff') navigate('/emergency');
      else if (role === 'ICU_Staff') navigate('/icu');
      else if (role === 'Radiology_Tech') navigate('/radiology');
      else if (role === 'Billing') navigate('/billing');
      else if (role === 'Blood_Bank_Staff') navigate('/blood-bank');
      else if (role === 'OT_Staff') navigate('/ot');
      else if (role === 'Inventory') navigate('/inventory');
      else if (role === 'HR') navigate('/hr');
      else if (role === 'Ambulance_Driver') navigate('/ambulance');
      else if (role === 'Dietitian') navigate('/dietetics');
      else if (role === 'Security') navigate('/security');
      else if (role === 'Housekeeping') navigate('/housekeeping');
      else if (role === 'Maintenance') navigate('/maintenance');
      else navigate('/queue');

    } catch (err) {
      const errorMsg = err.name === 'TypeError' ? 'Network error: Cannot reach the server.' : (err.message || 'Invalid credentials');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setIsResetting(true);
    const activeApiUrl = getApiUrl();
    try {
      const res = await fetch(`${activeApiUrl}/auth/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: resetEmail.toLowerCase(),
          new_password: resetPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed');
      
      setResetMsg('Success! You can now log in with the new password.');
      setResetPassword('');
    } catch (err) {
      setResetMsg(`Error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveServerUrl = (e) => {
    e.preventDefault();
    setCustomApiUrl(serverUrlInput);
    setShowServerModal(false);
    toast.success('Server connection URL updated!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 relative">
        
        {/* Top Right Server Settings Config Button */}
        <button 
          onClick={() => setShowServerModal(true)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Configure Hospital Server IP"
        >
          <Wifi size={14} className="text-emerald-400" />
          <span>Server IP</span>
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3.5 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <Hospital size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DHLMS</h1>
          <p className="text-slate-400 text-sm mt-1">Digital Hospital Local Management System</p>
          <div className="mt-2 text-xs px-3 py-1 bg-slate-700/60 rounded-full text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected to: <span className="font-mono text-emerald-400">{getApiUrl()}</span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl mb-6 text-center text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                id="email"
                type="email" 
                autoFocus
                className="block w-full pl-10 pr-3 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" 
                placeholder="staff@hospital.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                id="password"
                type="password" 
                className="block w-full pl-10 pr-3 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 className="animate-spin" size={20} />}
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 font-bold hover:underline">
              Create one
            </Link>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-700 flex items-center gap-3">
              <div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-400">
                <Key size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${resetMsg.includes('Success') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'}`}>
                  {resetMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 text-base"
                  required
                  minLength={8}
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={isResetting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  {isResetting ? <Loader2 className="animate-spin" size={18} /> : null}
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Server IP Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-700 flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
                <Settings size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Server Connection Settings</h2>
                <p className="text-xs text-slate-400">Configure Hospital Local Server IP Address</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveServerUrl} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Backend Server Address</label>
                <input 
                  type="text" 
                  value={serverUrlInput}
                  onChange={e => setServerUrlInput(e.target.value)}
                  placeholder="http://192.168.1.100:8000"
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-mono focus:ring-2 focus:ring-emerald-500 text-base"
                  required
                />
                <p className="text-xs text-slate-400 mt-2">
                  Example: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400">http://192.168.1.10:8000</code> or <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400">http://localhost:8000</code>
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button 
                  type="button"
                  onClick={() => {
                    setCustomApiUrl('');
                  }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Reset to Default
                </button>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowServerModal(false)}
                    className="px-4 py-2 text-slate-400 font-semibold hover:bg-slate-700 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    Save & Reload
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

