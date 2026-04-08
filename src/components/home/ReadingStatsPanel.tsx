import { Clock, BookCheck, BarChart2 } from 'lucide-react';
import type { ReadingStats } from '@/types';

interface Props {
  stats: ReadingStats;
}

export default function ReadingStatsPanel({ stats }: Props) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
        Reading Stats
      </p>

      <div className="space-y-4">
        {/* Total Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: '#E07340' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Total reading time</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {stats.totalReadingTimeMinutes >= 60
              ? `${Math.floor(stats.totalReadingTimeMinutes / 60)}h ${stats.totalReadingTimeMinutes % 60}m`
              : `${stats.totalReadingTimeMinutes}m`}
          </span>
        </div>

        {/* Books this month */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookCheck className="w-4 h-4" style={{ color: '#8B6914' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>This month</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {stats.booksCompletedThisMonth} book{stats.booksCompletedThisMonth !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Books this year */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookCheck className="w-4 h-4 opacity-60" style={{ color: '#8B6914' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>This year</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {stats.booksCompletedThisYear} book{stats.booksCompletedThisYear !== 1 ? 's' : ''}
          </span>
        </div>

        {/* All time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>All time</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {stats.booksCompletedAllTime} book{stats.booksCompletedAllTime !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Avg session */}
        {stats.avgSessionMinutes > 0 && (
          <div
            className="pt-4 mt-2 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Avg. session length:{' '}
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {stats.avgSessionMinutes}m
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
