import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Logo } from '../components/Logo';
import { Shield, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.token, res.user);

      if (res.user.role === 'complainant') {
        navigate('/dashboard');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Synora@2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background futuristic glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <Logo size="lg" withTagline={false} linkToHome={false} />
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          AICTE Grievance & Complaint Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Intelligent Oversight. Transparent Resolution.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-white/20 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                'Authenticating Session...'
              ) : (
                <>
                  Sign In to Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Instant Demo Access (Click to Fill)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => setDemoAccount('rahul.student@example.com')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50 text-xs transition-colors"
              >
                <div className="font-bold text-slate-800">Rahul (Student)</div>
                <div className="text-[10px] text-slate-500 truncate">Complainant Portal</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('officer.arc@synora.aicte.gov.in')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-xs transition-colors"
              >
                <div className="font-bold text-slate-800">Pooja (ARC Officer)</div>
                <div className="text-[10px] text-slate-500 truncate">Investigation Queue</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('bureau.admin@synora.aicte.gov.in')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-xs transition-colors"
              >
                <div className="font-bold text-slate-800">Bureau Director</div>
                <div className="text-[10px] text-slate-500 truncate">Approval Bureau</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('admin@synora.aicte.gov.in')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-xs transition-colors"
              >
                <div className="font-bold text-slate-800">System Admin</div>
                <div className="text-[10px] text-slate-500 truncate">All Bureaus & Audit</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
              Register as Complainant
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Secured with SHA-256 encrypted authentication & immutable audit logging
        </div>
      </div>
    </div>
  );
};
