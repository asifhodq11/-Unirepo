import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronLeft, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VanguardCard, VanguardButton } from '../components/VanguardComponents';

export default function TermsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 selection:bg-cyan-500/30">
      
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-purple-900/5 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-900/5 blur-[100px] mix-blend-screen" />
      </div>

      <Link to="/landing">
        <VanguardButton variant="ghost" size="sm" icon={ChevronLeft} className="mb-12">Return to Node</VanguardButton>
      </Link>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto relative z-10"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
            <Terminal size={32} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-light tracking-tight">Terms of Protocol</h1>
            <p className="text-xs text-white/30 font-mono uppercase tracking-[0.3em] mt-2">Operational Guidelines V4.2</p>
          </div>
        </div>

        <motion.div variants={itemVariants}>
          <VanguardCard className="p-10 leading-relaxed font-body text-white/70 space-y-8 border-purple-500/10">
            
            <section>
              <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> 
                Licensing & Access
              </h2>
              <p>
                By establishing a link with the Vanguard Network, you agree to utilize the synthesis engine for lawful, ethical communication. Any attempt to reverse-engineer the neural pipelines or saturate the gateway with malicious stimulus will result in immediate session termination.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-display text-white mb-3">01. Service Reliability</h3>
              <p>
                We aim for 99.99% system uptime across our global clusters. However, neural synthesis may experience momentary latency spikes during high-load planetary events or scheduled core maintenance.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-display text-white mb-3">02. Subscription Termination</h3>
              <p>
                You may revoke your license at any time via the System Settings dashboard. Upon termination, all active neural blocks will be purged from the registry within 30 solar days.
              </p>
            </section>

            <div className="pt-8 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-white/20" />
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Last Review: April 2026</span>
              </div>
              <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Verified Baseline</div>
            </div>

          </VanguardCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
