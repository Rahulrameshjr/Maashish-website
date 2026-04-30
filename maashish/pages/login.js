// pages/login.js
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Activity, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { findUser, createSession } from '../lib/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay for UX
    await new Promise(r => setTimeout(r, 400));

    const user = findUser(email, password);
    if (!user) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    createSession(user);
    router.replace('/');
  };

  return (
    <>
      <Head><title>Login — MAA Ashish</title></Head>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#c9a84c06,_transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-sm space-y-8 relative">

          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 mx-auto">
              <Activity size={22} className="text-[#c9a84c]" />
            </div>
            <div>
              <h1 className="font-display text-4xl text-[#f0ede8] tracking-wide">
                MA <span className="text-[#c9a84c]">AASHISH</span>
              </h1>
              <p className="text-xs font-mono text-[#5a5a5a] mt-1 uppercase tracking-widest">
                Operations Dashboard
              </p>
            </div>
          </div>

          {/* Login card */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 space-y-5">
            <div>
              <h2 className="text-sm font-body font-semibold text-[#f0ede8]">Sign in to continue</h2>
              <p className="text-xs text-[#5a5a5a] mt-0.5 font-mono">Authorized personnel only</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#5a5a5a] uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a3a3a]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-[#f0ede8] font-mono placeholder:text-[#2a2a2a] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#5a5a5a] uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a3a3a]" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-sm text-[#f0ede8] font-mono placeholder:text-[#2a2a2a] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a3a3a] hover:text-[#888888] transition-colors"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3a1010] border border-[#5a2020]">
                  <span className="text-[#ef4444] text-xs font-mono">{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#c9a84c] hover:bg-[#e8c97e] text-[#0a0a0a] text-sm font-body font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-[10px] font-mono text-[#2a2a2a]">
            MAA Ashish · Textile Knitting Operations
          </p>
        </div>
      </div>
    </>
  );
}