import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#8B6914' }} />
      <p className="mt-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        Loading Folio...
      </p>
    </div>
  );
}
