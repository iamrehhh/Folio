'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // On success, Supabase redirects — component stays loading
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#FAF8F4' }}
    >
      {/* Subtle dotted texture */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#8B6914 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Atmospheric glowing background flare */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none blur-[120px]"
        style={{ 
          background: 'radial-gradient(circle, #8B6914 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main Content Wrapper (Animated entrance) */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-both">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent mb-5 shadow-lg shadow-accent/20"
            style={{ backgroundColor: '#8B6914' }}
          >
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 
            className="text-4xl font-semibold tracking-tight text-[#1C1C1E] mb-2"
            style={{ fontFamily: 'Lora, Georgia, serif' }}
          >
            Folio
          </h1>
          <p className="text-[#6B6860] font-medium tracking-wide text-sm uppercase">
            Your personal reading sanctuary
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-10 shadow-2xl ring-1 ring-white"
          style={{ 
            boxShadow: '0 20px 40px -15px rgba(139, 105, 20, 0.1), 0 0 0 1px rgba(255,255,255,0.5) inset' 
          }}
        >
          <div className="mb-8">
            <h2 
              className="text-2xl font-medium text-[#1C1C1E] mb-1.5"
              style={{ fontFamily: 'Lora, Georgia, serif' }}
            >
              Welcome back
            </h2>
            <p className="text-[15px] text-[#6B6860] leading-relaxed">
              Sign in to continue reading where you left off.
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50/80 border border-red-100 text-sm text-red-700 animate-in fade-in">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-[#E5E0D8] bg-white text-[15px] font-medium text-[#1C1C1E] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#D5D0C8] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-sm"
          >
            {isLoading ? <Spinner /> : <GoogleIcon />}
            {isLoading ? 'Signing in securely…' : 'Continue with Google'}
          </button>
        </div>

        {/* Footer Links */}
        <p className="text-center text-[13px] text-[#9B9890] mt-8 tracking-wide">
          By continuing, you agree to our{' '}
          <span className="text-[#6B6860] underline decoration-[#E5E0D8] underline-offset-4 cursor-pointer hover:text-[#1C1C1E] hover:decoration-[#8B6914] transition-colors">Terms</span>
          {' '}and{' '}
          <span className="text-[#6B6860] underline decoration-[#E5E0D8] underline-offset-4 cursor-pointer hover:text-[#1C1C1E] hover:decoration-[#8B6914] transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-[#8B6914]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}
