// pages/packing.js
import Head from 'next/head';
import { Package } from 'lucide-react';

export default function Packing() {
  return (
    <>
      <Head><title>Packing — MA Aashish</title></Head>
      <main className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#222] flex items-center justify-center mb-5">
          <Package size={26} className="text-[#3a3a3a]" />
        </div>
        <h1 className="font-display text-5xl text-[#2a2a2a] tracking-wide">PACKING</h1>
        <p className="text-xs font-mono text-[#3a3a3a] mt-3 uppercase tracking-widest">Module coming soon</p>
      </main>
    </>
  );
}
