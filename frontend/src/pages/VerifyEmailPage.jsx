import React, { useState } from 'react';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
          
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
            One last step
          </h1>
          
          <p className="text-white/60 text-center mb-8 leading-relaxed">
            We've sent a verification link to your email. Click it to activate your ReplyIQ account and unlock your dashboard.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleResend}
              disabled={loading || sent}
              className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                sent 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)]'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : sent ? (
                'Email Sent!'
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend Verification Email
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl font-semibold bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white/70 flex items-center justify-center gap-2 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              Log Out and Try Again
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/[0.08] text-center">
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-white/40 hover:text-white/80 transition-colors"
            >
              Already verified? Click here to refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
