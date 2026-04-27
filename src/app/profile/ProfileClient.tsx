'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Camera, Save, X, BookOpen, CheckCircle, Highlighter, Calendar, Edit2, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Cropper from 'react-easy-crop';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface ProfileClientProps {
  profile: Profile;
  stats: {
    booksUploaded: number;
    booksFinished: number;
    totalHighlights: number;
  };
  userEmail: string;
  authProvider: string;
}

export default function ProfileClient({ profile, stats, userEmail, authProvider }: ProfileClientProps) {
  const router = useRouter();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.full_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const formattedJoinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const handleNameSave = async () => {
    if (!nameInput.trim() || nameInput.trim() === profile.full_name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: nameInput.trim() }),
      });

      if (!res.ok) throw new Error('Failed to update name');
      
      toast.success('Profile name updated!');
      setIsEditingName(false);
      router.refresh(); // Refresh the page to update the header layout
    } catch (error) {
      toast.error('Failed to update name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setIsUploadingAvatar(true);
    try {
      const croppedFile = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append('file', croppedFile);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload avatar');
      
      toast.success('Profile picture updated!');
      setCropImageSrc(null);
      router.refresh();
    } catch (error) {
      toast.error('Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    const supabase = createClient();
    try {
      // Step 1: Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });

      if (signInError) {
        throw new Error('Incorrect current password');
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast.success('Password changed! A confirmation email has been sent.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Top Card: Identity ── */}
      <div 
        className="p-8 rounded-2xl border flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-sidebar, #F2EFE9)', 
          borderColor: 'var(--border, #E5E0D8)',
        }}
      >
        {/* Avatar Upload */}
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-sm bg-[#E5E0D8] flex items-center justify-center">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'User'} 
                className={cn("w-full h-full object-cover transition-opacity", isUploadingAvatar ? "opacity-50" : "opacity-100")} 
              />
            ) : (
              <User className="w-16 h-16 text-[var(--text-secondary)]" />
            )}
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            <Camera className="w-8 h-8 text-white" />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Name Edit */}
        <div className="flex-1 text-center md:text-left w-full">
          {isEditingName ? (
            <div className="flex flex-col md:flex-row items-center gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setNameInput(profile.full_name || '');
                  }
                }}
                className="w-full md:w-80 px-4 py-2 text-xl font-medium rounded-lg border focus:outline-none focus:ring-2 bg-white"
                style={{ 
                  borderColor: 'var(--border)', 
                  color: 'var(--text-primary)',
                  '--tw-ring-color': '#8B6914' 
                } as any}
                autoFocus
                placeholder="Enter your name"
                disabled={isSavingName}
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleNameSave}
                  disabled={isSavingName}
                  className="p-2.5 rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                  style={{ backgroundColor: '#8B6914' }}
                >
                  <Save className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setIsEditingName(false);
                    setNameInput(profile.full_name || '');
                  }}
                  disabled={isSavingName}
                  className="p-2.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="group inline-flex items-center gap-3 cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                {profile.full_name || 'Reader'}
              </h2>
              <button className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-[var(--border)] transition-all">
                <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
          )}
          <p className="text-[var(--text-secondary)] mt-2 flex items-center justify-center md:justify-start gap-1.5">
            <Calendar className="w-4 h-4" /> Member since {formattedJoinDate}
          </p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          icon={<BookOpen className="w-6 h-6" style={{ color: '#8B6914' }} />}
          value={stats.booksUploaded.toString()}
          label="Books Uploaded"
        />
        <StatCard 
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          value={stats.booksFinished.toString()}
          label="Books Finished"
        />
        <StatCard 
          icon={<Highlighter className="w-6 h-6 text-amber-500" />}
          value={stats.totalHighlights.toString()}
          label="Total Highlights"
        />
      </div>

      {/* ── Security / Password ── */}
      <div className="p-8 rounded-2xl border bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Security</h2>
        </div>

        {authProvider === 'email' ? (
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-white pr-10"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', '--tw-ring-color': '#8B6914' } as any}
                  required
                />
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-white"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', '--tw-ring-color': '#8B6914' } as any}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Confirm New Password</label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 bg-white"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', '--tw-ring-color': '#8B6914' } as any}
                required
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#8B6914' }}
              >
                <Lock className="w-4 h-4" />
                {isChangingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
              {authProvider === 'google' ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              ) : (
                <svg className="w-6 h-6 text-[#5865F2]" fill="currentColor" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.68,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.36,46,96.25,53,91.2,65.69,84.69,65.69Z"/></svg>
              )}
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-medium">Signed in with {authProvider.charAt(0).toUpperCase() + authProvider.slice(1)}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Password management is securely handled directly by your provider. You don't need a password for Folio!</p>
            </div>
          </div>
        )}
      </div>
      {/* ── Image Crop Modal ── */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col gap-6">
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">Crop Profile Picture</h3>
            
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#8B6914]"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setCropImageSrc(null)}
                disabled={isUploadingAvatar}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadCrop}
                disabled={isUploadingAvatar}
                className="px-4 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#8B6914' }}
              >
                {isUploadingAvatar ? 'Saving...' : 'Save Picture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div 
      className="p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center transition-transform hover:-translate-y-1 hover:shadow-sm"
      style={{ 
        backgroundColor: 'var(--bg, #FAF8F4)', 
        borderColor: 'var(--border, #E5E0D8)',
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
      >
        {icon}
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
        {value}
      </div>
      <div className="text-sm font-medium text-[var(--text-secondary)]">
        {label}
      </div>
    </div>
  );
}

// Helper to extract the cropped area as a File
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<File> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg');
  });
};
