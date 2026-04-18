import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date for display
export function formatReadingDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

// "2 hours ago" style
export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// Greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 19) return 'Good evening';
  return 'Good night';
}

// Estimated reading time from word count (avg 250 wpm)
export function estimateReadingTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 250);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

// Format seconds into readable duration
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Highlight color → Tailwind bg class
export function highlightColorClass(color: string): string {
  const map: Record<string, string> = {
    yellow: 'bg-highlight-yellow',
    blue: 'bg-highlight-blue',
    green: 'bg-highlight-green',
    pink: 'bg-highlight-pink',
  };
  return map[color] ?? 'bg-highlight-yellow';
}

// Highlight color → hex (for epub.js inline styles)
export function highlightColorHex(color: string): string {
  const map: Record<string, string> = {
    yellow: '#FFE066',
    blue: '#93C5FD',
    green: '#86EFAC',
    pink: '#F87171',
  };
  return map[color] ?? '#FFE066';
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

// Get first name from full name
export function firstName(fullName: string | null): string {
  if (!fullName) return 'Reader';
  return fullName.split(' ')[0];
}

// Download vocabulary list as PDF
export async function downloadPDF(data: any[], filename: string) {
  if (data.length === 0) return;

  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fill first page background
  doc.setFillColor(250, 248, 244); // #FAF8F4
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title
  doc.setTextColor(28, 28, 30); // #1C1C1E
  doc.setFontSize(18);
  doc.text('Vocabulary List', 14, 22);

  // Map data to table rows
  const tableData = data.map((w) => [
    w.word || '',
    w.pronunciation || '',
    w.part_of_speech || '',
    w.definition || '',
    (w.book as any)?.title || 'Unknown',
    formatReadingDate(w.created_at)
  ]);

  // Generate table
  autoTable(doc, {
    startY: 30,
    head: [['Word', 'Pronunciation', 'Part of Speech', 'Definition', 'Book', 'Saved On']],
    body: tableData,
    styles: { 
      fontSize: 10, 
      cellPadding: 3, 
      textColor: [28, 28, 30], // #1C1C1E
      fillColor: [250, 248, 244] // #FAF8F4
    },
    headStyles: { 
      fillColor: [139, 105, 20], // #8B6914
      textColor: [250, 248, 244], // #FAF8F4
    },
    alternateRowStyles: { 
      fillColor: [242, 239, 233], // #F2EFE9
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { cellWidth: 50 }, // Allow wrapping for longer definitions
    },
    didDrawPage: function () {
      // Draw watermark on every page
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({opacity: 0.1}));
      doc.setTextColor(139, 105, 20); // #8B6914
      doc.setFontSize(80);
      doc.text('Folio.', pageWidth / 2, pageHeight / 2 + 10, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  });

  doc.save(filename);
}
