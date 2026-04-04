'use client';

import { useState, FormEvent, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const supabase = createClient();
  const router = useRouter();

  // Optionally verify that we have a session before letting them reset
  // The callback route should have already logged them in using the token
  
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/home');
      }, 3000);
    }
    setIsLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#FAF8F4' }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#8B6914 0.5px, transparent 0.5px)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #8B6914 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] px-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-10 ring-1 ring-white/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#8B6914] mb-5 shadow-lg shadow-[#8B6914]/20">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-[28px] font-serif font-medium text-[#1C1C1E] mb-2 tracking-tight">
              Set new password
            </h1>
            <p className="text-[15px] text-[#6B6860] leading-relaxed">
              Please enter your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="mb-2 px-6 py-5 rounded-2xl bg-[#F8FDF9] border border-green-100/50 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-500">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800 mb-1">Password updated!</h3>
              <p className="text-sm text-green-700/80">
                You will be redirected shortly...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input 
                type="password" 
                placeholder="New password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full px-5 py-3.5 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" 
              />
              <input 
                type="password" 
                placeholder="Confirm new password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="w-full px-5 py-3.5 rounded-xl bg-[#F5F3ED] border-none text-[#1C1C1E] focus:ring-2 focus:ring-[#8B6914] focus:outline-none transition-all placeholder:text-[#9B9890]" 
              />
              <button 
                disabled={isLoading} 
                type="submit" 
                className="mt-2 w-full bg-[#8B6914] text-white py-3.5 rounded-xl font-medium shadow-lg shadow-[#8B6914]/20 hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <svg className="animate-spin w-5 h-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
