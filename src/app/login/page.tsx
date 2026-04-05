'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

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
  }



  async function handleDiscordSignIn() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/home'); // Adjust to your default authenticated route
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: {
          full_name: signUpName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      // With email confirmations turned off in Supabase, 
      // the user is instantaneously logged in upon signup!
      router.push('/home');
    }
    setIsLoading(false);
  }

  const togglePanel = () => {
    setIsRightPanelActive(!isRightPanelActive);
    setError(null);
    setSuccess(null);
  };

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
        className="absolute w-[800px] h-[800px] rounded-full opacity-15 pointer-events-none blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #8B6914 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[850px] min-h-[600px] mx-4 my-10 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/50 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-both flex flex-col md:block">
        
        {/* --- MOBILE VIEW (Stacks vertically or fully toggles, visible only on small screens) --- */}
        <div className="md:hidden flex flex-col h-full inset-0">
           {/* Header Area for Mobile */}
           <div className="flex-none p-8 pb-4 text-center bg-[#8B6914] text-white rounded-b-[2rem] shadow-md z-20">
              <div className="flex justify-center mb-4">
                 <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-white" />
                 </div>
              </div>
              <h2 className="text-2xl font-serif mb-2">{isRightPanelActive ? 'Create Account' : 'Welcome Back'}</h2>
              <p className="text-white/80 text-sm">
                 {isRightPanelActive ? 'Begin your journey with Folio today.' : 'Sign in to continue reading where you left off.'}
              </p>
           </div>

           <div className="flex-1 px-6 py-8 relative">
              {/* Alert Messages */}
              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-green-50 text-sm text-green-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {isRightPanelActive ? (
                 <form onSubmit={handleSignUp} className="flex flex-col gap-4 animate-in slide-in-from-right fade-in">
                    <input type="text" placeholder="Full Name" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
                    <input type="email" placeholder="Email Address" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
                    <input type="password" placeholder="Password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
                    <button disabled={isLoading} type="submit" className="w-full mt-2 bg-[#8B6914] text-white py-4 rounded-xl font-medium shadow-lg shadow-[#8B6914]/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                       {isLoading ? <Spinner /> : 'SIGN UP'}
                    </button>
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-[#E5E0D8]"></div>
                      <span className="flex-shrink-0 mx-4 text-sm text-[#9B9890]">or use</span>
                      <div className="flex-grow border-t border-[#E5E0D8]"></div>
                    </div>
                    <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl border border-[#E5E0D8] bg-white text-[15px] font-medium text-[#1C1C1E] shadow-sm transition-all hover:bg-gray-50">
                      <GoogleIcon /> Continue with Google
                    </button>
                    <p className="text-center mt-6 text-sm text-[#6B6860]">
                       Already have an account? <button type="button" onClick={togglePanel} className="text-[#8B6914] font-semibold">Sign In</button>
                    </p>
                 </form>
              ) : (
                 <form onSubmit={handleSignIn} className="flex flex-col gap-4 animate-in slide-in-from-left fade-in">
                    <input type="email" placeholder="Email Address" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
                    <input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
                    <div className="flex justify-end mt-1">
                      <Link href="/forgot-password" className="text-sm font-medium text-[#8B6914] hover:underline">Forgot your password?</Link>
                    </div>
                    <button disabled={isLoading} type="submit" className="w-full mt-2 bg-[#8B6914] text-white py-4 rounded-xl font-medium shadow-lg shadow-[#8B6914]/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                       {isLoading ? <Spinner className="text-white" /> : 'SIGN IN'}
                    </button>
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-[#E5E0D8]"></div>
                      <span className="flex-shrink-0 mx-4 text-sm text-[#9B9890]">or use</span>
                      <div className="flex-grow border-t border-[#E5E0D8]"></div>
                    </div>
                    <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl border border-[#E5E0D8] bg-white text-[15px] font-medium text-[#1C1C1E] shadow-sm transition-all hover:bg-gray-50">
                      <GoogleIcon /> Continue with Google
                    </button>
                    <p className="text-center mt-6 text-sm text-[#6B6860]">
                       Don't have an account? <button type="button" onClick={togglePanel} className="text-[#8B6914] font-semibold">Sign Up</button>
                    </p>
                 </form>
              )}
           </div>
        </div>


        {/* --- DESKTOP VIEW (Sliding Overlay Pattern) --- */}
        <div className="hidden md:block h-full relative w-full inset-0 pb-[600px] min-h-[600px]">
          
          {/* Sign Up Container - Left Side Initially */}
          <div className={`absolute top-0 left-0 w-1/2 h-full px-12 py-16 flex flex-col justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] z-10 ${
            isRightPanelActive ? 'translate-x-[100%] opacity-100 z-50' : 'opacity-0 z-10 pointer-events-none'
          }`}>
            <h2 className="text-[32px] font-serif text-[#1C1C1E] mb-2 text-center">Create Account</h2>
            <div className="flex justify-center gap-4 mb-6 mt-4">

              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-12 h-12 rounded-full border border-[#E5E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
                <GoogleIcon />
              </button>
              <button type="button" onClick={handleDiscordSignIn} disabled={isLoading} className="w-12 h-12 rounded-full border border-[#E5E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
                <DiscordIcon />
              </button>
            </div>
            <p className="text-center text-[13px] text-[#9B9890] mb-6">or use your email for registration</p>

            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <input type="text" placeholder="Full Name" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
              <input type="email" placeholder="Email Address" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
              <input type="password" placeholder="Password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
              
              <button disabled={isLoading} type="submit" className="mt-4 mx-auto w-[60%] bg-[#8B6914] text-white py-3.5 rounded-full font-semibold shadow-lg shadow-[#8B6914]/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 transform hover:scale-105 duration-300">
                {isLoading ? <Spinner className="text-white mx-auto" /> : 'SIGN UP'}
              </button>
            </form>
          </div>

          {/* Sign In Container - Right Side Initially (Wait, usually Sign In is on Left. If Sign up is on the right, the slider starts on the right) */}
          <div className={`absolute top-0 left-0 w-1/2 h-full px-12 py-16 flex flex-col justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] z-20 ${
            isRightPanelActive ? 'translate-x-[100%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'
          }`}>
            <h2 className="text-[32px] font-serif text-[#1C1C1E] mb-2 text-center">Sign In</h2>
            <div className="flex justify-center gap-4 mb-6 mt-4">

              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-12 h-12 rounded-full border border-[#E5E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
                <GoogleIcon />
              </button>
              <button type="button" onClick={handleDiscordSignIn} disabled={isLoading} className="w-12 h-12 rounded-full border border-[#E5E0D8] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
                <DiscordIcon />
              </button>
            </div>
            <p className="text-center text-[13px] text-[#9B9890] mb-6">or use your account</p>

            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <input type="email" placeholder="Email Address" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
              <input type="password" placeholder="Password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required className="w-full px-5 py-3.5 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" />
              
              <div className="text-center mt-2 mb-2">
                <Link href="/forgot-password" className="text-[13px] font-medium text-[#8B6914] hover:underline underline-offset-4">Forgot your password?</Link>
              </div>

              <button disabled={isLoading} type="submit" className="mx-auto w-[60%] bg-[#8B6914] text-white py-3.5 rounded-full font-semibold shadow-lg shadow-[#8B6914]/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 transform hover:scale-105 duration-300">
                {isLoading ? <Spinner className="text-white mx-auto" /> : 'SIGN IN'}
              </button>
            </form>
          </div>

          {/* Absolute Alerts over Desktop view so they are visible over the forms */}
          <div className="absolute top-8 left-0 w-1/2 px-12 z-50 pointer-events-none">
            {error && !isRightPanelActive && (
              <div className="px-4 py-3 rounded-xl bg-red-50 text-sm text-red-700 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
              </div>
            )}
            {success && !isRightPanelActive && (
                 <div className="px-4 py-3 rounded-xl bg-green-50 text-sm text-green-700 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><span>{success}</span>
                 </div>
              )}
          </div>
          <div className={`absolute top-8 left-0 w-1/2 px-12 z-50 pointer-events-none transition-transform duration-[800ms] ${isRightPanelActive ? 'translate-x-[100%]' : 'opacity-0'}`}>
            {error && isRightPanelActive && (
              <div className="px-4 py-3 rounded-xl bg-red-50 text-sm text-red-700 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
              </div>
            )}
             {success && isRightPanelActive && (
                 <div className="px-4 py-3 rounded-xl bg-green-50 text-sm text-green-700 flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /><span>{success}</span>
                 </div>
              )}
          </div>

          {/* Overlay Container */}
          <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] z-[100] ${
            isRightPanelActive ? '-translate-x-[100%]' : 'translate-x-0'
          }`}>
            <div className={`bg-[#8B6914] relative left-[-100%] h-full w-[200%] transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] text-white ${
              isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'
            }`}>
              
              {/* Overlay Left (When Sign Up is active, overlay is on the left, showing this content) */}
              <div className={`absolute top-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
                isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'
              }`}>
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mb-6 flex items-center justify-center shadow-inner">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-[36px] font-serif font-medium mb-4">Welcome Back!</h2>
                <p className="text-[15px] leading-relaxed text-white/90 mb-8 max-w-[280px]">
                  To keep connected with us please login with your personal info
                </p>
                <button onClick={togglePanel} className="bg-transparent border-2 border-white text-white px-12 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors tracking-wide">
                  SIGN IN
                </button>
              </div>

              {/* Overlay Right (When Sign In is active, overlay is on the right, showing this content) */}
              <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
                isRightPanelActive ? 'translate-x-[20%]' : 'translate-x-0'
              }`}>
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mb-6 flex items-center justify-center shadow-inner">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-[36px] font-serif font-medium mb-4">Hello, Friend!</h2>
                <p className="text-[15px] leading-relaxed text-white/90 mb-8 max-w-[280px]">
                  Enter your personal details and start journey with us
                </p>
                <button onClick={togglePanel} className="bg-transparent border-2 border-white text-white px-12 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors tracking-wide">
                  SIGN UP
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Spinner({ className = "text-[#8B6914]" }: { className?: string }) {
  return (
    <svg className={`animate-spin w-5 h-5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}



function DiscordIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.73,67.73,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z" fill="#5865F2"/>
    </svg>
  );
}
