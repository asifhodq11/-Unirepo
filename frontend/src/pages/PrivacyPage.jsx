import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VanguardCard, VanguardButton } from '../components/VanguardComponents';

export default function PrivacyPage() {
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-cyan-900/5 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-900/5 blur-[100px] mix-blend-screen" />
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
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Shield size={32} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-light tracking-tight">Privacy Protocol</h1>
            <p className="text-xs text-white/30 font-mono uppercase tracking-[0.3em] mt-2">Data Integrity Declaration V2.0</p>
          </div>
        </div>

        <motion.div variants={itemVariants}>
          <VanguardCard className="p-10 leading-relaxed font-body text-white/70 space-y-8">
            
            <section>
              <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> 
                Synthesis Policy
              </h2>
              <p>
                ReplyIQ Vanguard treats your customer data as absolute sovereign territory. We employ multi-modal encryption during the neural synthesis phase, ensuring that the original review stimulus and the generated response never leave our secure cluster in an unmasked state.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-display text-white mb-3">01. Collective Intelligence</h3>
              <p>
                We do not train global models on your private repository. Your specific response patterns are siloed within your account node, ensuring your brand &quot;voice&quot; remains exclusive and secure.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-display text-white mb-3">02. Encryption Layers</h3>
              <p>
                All transmissions are handled via TLS 1.3. Stored data is obfuscated using AES-256 at-rest protocols within the Supabase/PostgreSQL infrastructure.
              </p>
            </section>

            <div className="pt-8 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-white/20" />
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Last Review: April 2026</span>
              </div>
              <VanguardBadge variant="cyan">Secure</VanguardBadge>
            </div>

          </VanguardCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
