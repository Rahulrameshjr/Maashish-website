// pages/account.js
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSession, clearSession } from '../lib/auth';
import { User, Mail, Shield, Clock, LogOut } from 'lucide-react';

export default function Account() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
  }, [router]);

  if (!session) return null;

  const expiresIn = Math.max(0, Math.round((session.expiresAt - Date.now()) / (1000 * 60)));
  const expiresHrs = Math.floor(expiresIn / 60);
  const expiresMins = expiresIn % 60;

  const roleColors = {
    owner: 'text-[#c9a84c] bg-[#2e1a00] border-[#5a3a00]',
    manager: 'text-[#3ecf6e] bg-[#0a2e1a] border-[#1a5a2a]',
    staff: 'text-[#60a5fa] bg-[#0a1a3a] border-[#1a3a6a]',
  };
  const roleStyle = roleColors[session.role] || roleColors.staff;

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <>
      <Head><title>Account — MA Aashish</title></Head>
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 space-y-4">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-[#c9a84c] mb-1">My Account</p>
          <h1 className="font-display text-4xl text-[#f0ede8]">Profile</h1>
        </div>

        {/* Avatar + name card */}
        <div className="stat-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
            <span className="font-display text-2xl text-[#c9a84c]">
              {session.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-body font-semibold text-[#f0ede8] text-lg">{session.name}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize mt-1 ${roleStyle}`}>
              <Shield size={9} />
              {session.role}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="stat-card space-y-0 p-0 overflow-hidden">
          {[
            { icon: User, label: 'Full Name', value: session.name },
            { icon: Mail, label: 'Email Address', value: session.email },
            { icon: Shield, label: 'Role', value: session.role, capitalize: true },
            { icon: Clock, label: 'Session Expires In', value: `${expiresHrs}h ${expiresMins}m` },
          ].map((item, i) => (
            <div key={item.label} className={`flex items-center gap-4 px-5 py-4 ${i !== 3 ? 'border-b border-[#1a1a1a]' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                <item.icon size={14} className="text-[#5a5a5a]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#5a5a5a]">{item.label}</p>
                <p className={`text-sm font-body mt-0.5 text-[#f0ede8] ${item.capitalize ? 'capitalize' : ''}`}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-[#3a1010] bg-[#1a0808] text-[#ef4444] text-sm font-body font-medium hover:bg-[#3a1010] transition-all"
        >
          <LogOut size={15} />
          Sign Out
        </button>

        <p className="text-center text-[10px] font-mono text-[#2a2a2a] pt-2">
          MA Aashish · Textile Knitting Operations
        </p>
      </main>
    </>
  );
}