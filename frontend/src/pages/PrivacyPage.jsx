import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExecutiveCard, ExecutiveButton, ExecutiveBadge } from '../components/ExecutiveComponents';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 font-body overflow-x-hidden">
      
      {/* Executive Depth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-slate-900/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Link to="/">
        <ExecutiveButton variant="ghost" size="sm" icon={ChevronLeft} className="mb-12 text-slate-500 hover:text-white group">
          <span className="group-hover:-translate-x-1 transition-transform">Back to Landing</span>
        </ExecutiveButton>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-3xl mx-auto relative z-10"
      >
        <div className="flex items-center gap-5 mb-10">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Shield size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Data Integrity Declaration V2.1</p>
          </div>
        </div>

        <ExecutiveCard className="p-10 leading-relaxed text-slate-400 space-y-10 border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
          
          <section>
            <h2 className="text-xl font-display font-bold text-white mb-5 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500" /> 
              Data Handling Policy
            </h2>
            <p className="text-base">
              ReplyIQ treats your customer data as strictly confidential. We employ industry-standard encryption during the AI processing phase, ensuring that customer sentiment data and generated responses never leave our secure environment in an unencrypted state.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-display font-bold text-slate-200 mb-4">01. Model Isolation</h3>
            <p className="text-base text-slate-400">
              We do not train global models on your private data. Your specific response patterns are siloed within your tenant workspace, ensuring your brand representation remains exclusive and secure.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-display font-bold text-slate-200 mb-4">02. Encryption & Storage</h3>
            <p className="text-base text-slate-400">
              All data transfers are handled via TLS 1.3. Stored data is protected using AES-256 encryption at-rest within our enterprise infrastructure.
            </p>
          </section>

          <div className="pt-10 border-t border-slate-800/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-slate-600" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Last Updated: April 2026</span>
            </div>
            <ExecutiveBadge variant="indigo" className="px-3 py-1 font-bold">Secure</ExecutiveBadge>
          </div>

        </ExecutiveCard>
      </motion.div>
    </div>
  );
}


