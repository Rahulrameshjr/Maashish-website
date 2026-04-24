// components/Navbar.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Machines', href: '/machines' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tools', href: '/tools' },
  { label: 'Packing', href: '/packing' },
];

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-all">
            <Activity size={14} className="text-[#c9a84c]" />
          </div>
          <span className="font-display text-[22px] tracking-widest text-[#f0ede8] leading-none">
            MA <span className="text-[#c9a84c]">AASHISH</span>
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
