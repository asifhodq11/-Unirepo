import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Command, ChevronRight, Activity, Zap, Server, BarChart3, ShieldCheck, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { ExecutiveButton } from '../components/ExecutiveComponents';

const ExecutiveDepth = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-900/20 blur-[120px]" />
    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-overlay" />
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden selection:bg-indigo-500/30 font-body">
      <ExecutiveDepth />
      
      {/* Professional Navigation */}
      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50 max-w-7xl mx-auto left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <Command className="text-white" size={24} />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-white">ReplyIQ</span>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-all">Sign In</Link>
          <Link to="/signup">
            <ExecutiveButton variant="primary" size="sm" className="hidden md:inline-flex px-6 shadow-lg shadow-indigo-500/20">Get Started</ExecutiveButton>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-48 pb-32 flex flex-col items-center justify-center text-center px-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Enterprise-Grade AI Management</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight text-white leading-[1] mb-8">
            Professional Reputation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-slate-400">
              at Executive Scale.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-medium leading-relaxed mb-12">
            Automate high-quality customer engagement. ReplyIQ delivers context-aware, brand-aligned responses that maintain excellence across every review platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <Link to="/signup">
              <ExecutiveButton size="lg" variant="primary" className="px-10 h-14 text-base shadow-xl shadow-indigo-500/20" icon={ArrowRight}>
                Start Free Trial
              </ExecutiveButton>
            </Link>
            <Link to="/login">
              <ExecutiveButton size="lg" variant="outline" className="px-10 h-14 text-base border-slate-800 hover:bg-slate-900">
                View Pricing
              </ExecutiveButton>
            </Link>
          </div>

          <div className="mt-20 flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="text-sm font-bold tracking-widest text-slate-500 uppercase">Trusted by industry leaders</div>
            <div className="h-px w-12 bg-slate-800" />
            {/* Mock brand logos placeholder */}
            <div className="flex gap-8 items-center text-white/60 font-display font-bold">
              <span>FORBES</span>
              <span>VERCEL</span>
              <span>STRIPE</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Feature Value Map */}
      <section className="relative z-10 py-32 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {[
            { title: "Automated Quality", icon: BarChart3, desc: "High-density AI generation that maintains your brand's unique professional voice 24/7." },
            { title: "Review Integration", icon: Globe, desc: "Seamlessly connect with Google Business Profile and industry-standard platforms." },
            { title: "Executive Analytics", icon: ShieldCheck, desc: "Track reputation growth and response efficiency with board-ready data visualizations." }
          ].map((feat, i) => (
            <motion.div 
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800/60 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-8 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                <feat.icon className="text-indigo-400" size={24} />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-4">{feat.title}</h3>
              <p className="text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* Conversion Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-slate-900 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div>
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <Command className="text-indigo-500" size={24} />
              <span className="font-display font-bold text-xl text-white">ReplyIQ</span>
            </div>
            <p className="text-slate-500 text-sm">© 2026 ReplyIQ. Enterprise Response Automation.</p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Product</span>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Integrations</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Company</span>
              <Link to="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}


