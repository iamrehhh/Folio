'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  required?: boolean;
}

export function DatePicker({ value: controlledValue, onChange, placeholder = "Select a date...", className, name, required }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<Date | undefined>(controlledValue);
  const value = onChange ? controlledValue : internalValue;

  const handleChange = (date: Date | undefined) => {
    setInternalValue(date);
    onChange?.(date);
    setOpen(false);
  };

  const [currentMonth, setCurrentMonth] = React.useState(value || new Date());

  React.useEffect(() => {
    if (value && !isSameMonth(value, currentMonth)) {
      setCurrentMonth(value);
    }
  }, [value]);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "flex items-center w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none",
            value ? 'font-medium' : '',
            className
          )}
          style={{ 
            backgroundColor: 'transparent', 
            borderColor: 'var(--border)',
            color: value ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
        >
          {value ? format(value, 'PPP') : placeholder}
          <CalendarIcon className="w-4 h-4 ml-auto opacity-70" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="z-[60] w-[280px] p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
          style={{ backgroundColor: 'var(--bg-card, #fff)', borderColor: 'var(--border)' }}
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, i) => {
              const isSelected = value && isSameDay(date, value);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isTodayDate = isToday(date);
              
              return (
                <button
                  key={i}
                  onMouseDown={(e) => {
                    // Prevent input blur if used inside forms
                    e.preventDefault();
                  }}
                  onClick={() => handleChange(date)}
                  className={cn(
                    "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors mx-auto",
                    !isCurrentMonth ? "opacity-30" : "hover:bg-[var(--border)]",
                    isSelected && "font-bold shadow-sm",
                    isTodayDate && !isSelected && "font-bold"
                  )}
                  style={
                    isSelected ? { backgroundColor: '#8B6914', color: '#fff' } : 
                    isTodayDate && !isSelected ? { color: '#8B6914' } : 
                    { color: 'var(--text-primary)' }
                  }
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>
          
          <div className="mt-4 pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={() => handleChange(undefined)} className="text-xs font-medium px-2 py-1.5 rounded hover:bg-[var(--border)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
              Clear
            </button>
            <button type="button" onClick={() => handleChange(new Date())} className="text-xs font-medium px-2 py-1.5 rounded transition-colors" style={{ color: '#8B6914' }}>
              Today
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
      {name && (
        <input 
          type="hidden" 
          name={name} 
          required={required}
          value={value ? format(value, 'yyyy-MM-dd') : ''} 
        />
      )}
    </Popover.Root>
  );
}
