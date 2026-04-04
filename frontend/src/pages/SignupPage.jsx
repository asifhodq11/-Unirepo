import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Command, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { VanguardButton } from '../components/VanguardComponents';

export default function SignupPage() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = searchParams.get('email');
    if (e) setEmail(e);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !firstName) return;
    setLoading(true);
    const { error, data } = await signup(email, password, { first_name: firstName, last_name: lastName });
    setLoading(false);
    
    if (error) {
      showToast({ title: 'Access Denied', desc: error.message, type: 'error' });
    } else {
      showToast({ title: 'Profile Created', desc: 'Please verify your transmission endpoint (Email).', type: 'success' });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden text-center flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-900/10 blur-[150px] mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Command size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-light text-white tracking-tight">System Registry</h1>
        </div>

        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 border-none">
            
            <div className="flex gap-4">
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all font-body text-sm"
                  placeholder="John"
                />
              </div>
              <div className="space-y-1 w-full">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all font-body text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">Transmission Endpoint (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all font-body text-sm"
                placeholder="commander@network.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">Authentication Key (Password)</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-all font-body text-sm"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>

            <div className="mt-2 text-center text-xs text-white/30 font-body">
              By creating your profile, you accept our <Link to="/terms" className="text-white hover:text-purple-400 transition-colors">Protocols</Link>.
            </div>

            <div className="mt-2">
              <VanguardButton 
                type="submit" 
                variant="primary" 
                className="w-full !rounded-2xl !py-4"
                isLoading={loading}
                icon={UserPlus}
              >
                Construct Profile
              </VanguardButton>
            </div>

          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-body text-white/40">
            Already verified? <Link to="/login" className="text-white hover:text-purple-400 transition-colors ml-1 border-b border-white/20 hover:border-purple-400/50">Return to Node</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}