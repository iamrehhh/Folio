import { Search } from 'lucide-react';

export default function LibraryLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] animate-pulse">
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
        
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          <div>
            <div className="h-8 w-48 bg-black/10 rounded-md mb-2"></div>
            <div className="h-4 w-64 bg-black/5 rounded-md"></div>
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <div className="h-10 w-full md:w-64 bg-black/5 rounded-lg border border-black/10 flex items-center px-3">
              <Search className="w-4 h-4 text-black/20 mr-2" />
              <div className="h-4 w-24 bg-black/5 rounded"></div>
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[2/3] w-full bg-black/5 rounded-lg border border-black/10 shadow-sm relative overflow-hidden">
                {/* Simulated shimmer effect inside the cover */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-black/10 rounded"></div>
                <div className="h-3 w-1/2 bg-black/5 rounded"></div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
