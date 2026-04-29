// components/Navbar.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, Menu, X, LogOut } from 'lucide-react';
import { getSession, clearSession } from '../lib/auth';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Machines', href: '/machines' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tools', href: '/tools' },
  { label: 'Features', href: '/Features' },
];

{/* User + Logout */}
{(() => {
  const session = typeof window !== 'undefined' ? getSession() : null;
  return session ? (
    <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-[#1e1e1e]">
      <div className="text-right">
        <p className="text-xs text-[#f0ede8] font-body">{session.name}</p>
        <p className="text-[10px] text-[#3a3a3a] font-mono capitalize">{session.role}</p>
      </div>
      <button
        onClick={() => { clearSession(); router.push('/login'); }}
        className="p-1.5 rounded text-[#5a5a5a] hover:text-[#ef4444] hover:bg-[#3a1010] transition-all"
        title="Sign out"
      >
        <LogOut size={14} />
      </button>
    </div>
  ) : null;
})()}

export default function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  useEffect(() => { setSession(getSession()); }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-all">
            <Activity size={14} className="text-[#c9a84c]" />
          </div>
          <span className="font-display text-[22px] tracking-widest text-[#f0ede8] leading-none">
            MAA <span className="text-[#c9a84c]">ASHISH</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const active = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded text-sm font-body transition-all ${
                  active
                    ? 'text-[#c9a84c] bg-[#c9a84c]/8'
                    : 'text-[#888888] hover:text-[#f0ede8]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        {/* Account button — desktop */}
        {session && (
          <Link
            href="/account"
            className={`hidden md:flex items-center gap-2 ml-3 pl-3 border-l border-[#1e1e1e] group`}
          >
            <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-all">
              <span className="font-display text-sm text-[#c9a84c] leading-none">
                {session.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs text-[#f0ede8] font-body leading-tight">{session.name}</p>
              <p className="text-[10px] text-[#3a3a3a] font-mono capitalize">{session.role}</p>
            </div>
          </Link>
        )}

        {/* Mobile menu button */}
        <button
          className="md:hidden text-[#888888] hover:text-[#f0ede8]"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[#1a1a1a] bg-[#0a0a0a]">
          {navLinks.map(link => {
            const active = router.pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-6 py-3 text-sm border-b border-[#141414] ${
                  active ? 'text-[#c9a84c]' : 'text-[#888888]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
