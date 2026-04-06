'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Megaphone, X } from 'lucide-react';
import type { SystemNotification } from '@/types';

export default function LiveNotification() {
  const [notification, setNotification] = useState<SystemNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch initially active notification
    fetchActiveNotification();

    // 2. Subscribe to realtime changes
    const channel = supabase
      .channel('system_notifications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_notifications' },
        (payload) => {
          // Whenever there's an insert or update, refetch to get the latest active
          fetchActiveNotification();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchActiveNotification() {
    const { data } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      handleNewNotification(data as SystemNotification);
    } else {
      setNotification(null);
      setVisible(false);
    }
  }

  function handleNewNotification(newNotif: SystemNotification) {
    const seenKey = `seen_notification_${newNotif.id}`;
    if (localStorage.getItem(seenKey)) {
      // Already seen this
      setNotification(null);
      setVisible(false);
      return;
    }

    setNotification(newNotif);
    setVisible(true);

    // Auto-dismiss after 30 seconds
    const timer = setTimeout(() => {
      dismissNotification(newNotif.id);
    }, 30000);

    return () => clearTimeout(timer);
  }

  function dismissNotification(id: string) {
    localStorage.setItem(`seen_notification_${id}`, 'true');
    setVisible(false);
    setTimeout(() => {
      // Clear from state after slide animation finishes
      setNotification(null);
    }, 500); 
  }

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
      }`}
      style={{ maxWidth: '380px' }}
    >
      <div 
        className="relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-md"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          borderColor: 'var(--border, #E5E0D8)',
        }}
      >
        {/* Progress Bar (30s) */}
        <div 
          className="absolute top-0 left-0 h-1 bg-[#8B6914] opacity-50"
          style={{
            animation: visible ? 'progress 30s linear forwards' : 'none'
          }}
        />
        
        <div className="p-5 flex items-start gap-4">
          <div 
            className="w-10 h-10 rounded-full flex-none flex items-center justify-center animate-pulse"
            style={{ backgroundColor: '#8B691415' }}
          >
            <Megaphone className="w-5 h-5" style={{ color: '#8B6914' }} />
          </div>
          
          <div className="flex-1 mt-0.5">
            <h4 className="text-sm font-semibold mb-1" style={{ color: '#1C1C1E', fontFamily: 'Lora, Georgia, serif' }}>
              System Announcement
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6B6860' }}>
              {notification.message}
            </p>
          </div>

          <button
            onClick={() => dismissNotification(notification.id)}
            className="flex-none p-1.5 rounded-full transition-colors hover:bg-black/5"
            style={{ color: '#9B9890' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
