import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Command, ChevronRight, Activity, Zap, Server } from 'lucide-react';
import { VanguardButton } from '../components/VanguardComponents';

const VanguardPulse = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
    <div className="w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[120px] mix-blend-screen animate-pulse duration-[8000ms]" />
    <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-900/10 blur-[100px] mix-blend-screen animate-pulse delay-1000 duration-[6000ms]" />
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-cyan-500/30">
      <VanguardPulse />
      
      {/* Immersive Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Command className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" size={28} />
          <span className="font-display font-light text-xl tracking-wide">ReplyIQ<span className="font-bold"> V2</span></span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-mono uppercase tracking-widest text-white/50 hover:text-white transition-colors">Access Node</Link>
          <Link to="/signup">
            <VanguardButton variant="ghost" size="sm" className="hidden md:inline-flex">Acquire License</VanguardButton>
          </Link>
        </div>
      </header>

      {/* Cinematic Hero */}
      <main className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 flex flex-col items-center justify-center text-center px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-4xl flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 mb-8 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">Vanguard Architecture Deployed</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-light tracking-tighter leading-[1.1] mb-8">
            The Syntax of <br />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-300 drop-shadow-[0_0_40px_rgba(34,211,238,0.3)]">
              Digital Domination.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/50 max-w-2xl font-body leading-relaxed mb-12">
            Eradicate rigid automation. ReplyIQ utilizes a multi-layered neural network to construct hyper-authentic, context-aware responses that obliterate standard AI thresholds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/signup">
              <VanguardButton size="lg" variant="neon" icon={ChevronRight}>Initiate Protocol</VanguardButton>
            </Link>
            <Link to="/login">
              <VanguardButton size="lg" variant="ghost">View Documentation</VanguardButton>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Feature Grid */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent to-black/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {[
            { tag: "01", title: "Autonomic Scaling", icon: Activity, desc: "Bypass standard API limits with elastic compute pooling." },
            { tag: "02", title: "Neural Synthesis", icon: Zap, desc: "Three-pass transformer pipelines for absolute linguistic fidelity." },
            { tag: "03", title: "State Resilience", icon: Server, desc: "Encrypted memory blocks ensure zero data fragmentation." }
          ].map((feat, i) => (
            <motion.div 
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex justify-between items-start mb-12">
                <feat.icon className="text-white/30 group-hover:text-cyan-400 transition-colors" size={24} />
                <span className="text-xs font-mono text-white/20 uppercase tracking-widest">{feat.tag}</span>
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{feat.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed font-body">{feat.desc}</p>
            </motion.div>
          ))}

        </div>
      </section>

    </div>
  );
}