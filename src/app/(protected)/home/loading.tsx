export default function HomeLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 animate-pulse">
      {/* Greeting Skeleton */}
      <div className="mb-6 md:mb-8">
        <div className="h-8 w-64 bg-black/10 rounded-md mb-2"></div>
        <div className="h-4 w-48 bg-black/5 rounded-md"></div>
      </div>

      {/* Quote/Banner Placeholder */}
      <div className="w-full h-24 bg-black/5 rounded-2xl mb-6 border border-black/10"></div>

      {/* Main grid — stacks on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Left column */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          {/* Currently Reading Card Skeleton */}
          <div className="w-full h-64 bg-white rounded-2xl border shadow-sm p-6 flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-6">
              <div className="w-32 h-48 bg-black/5 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-4 mt-2">
                <div className="h-6 w-3/4 bg-black/10 rounded"></div>
                <div className="h-4 w-1/2 bg-black/5 rounded"></div>
                <div className="h-2 w-full bg-black/5 rounded-full mt-8"></div>
              </div>
            </div>
          </div>
          
          {/* Recent Highlights Skeleton */}
          <div className="w-full h-48 bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: 'var(--border)' }}>
             <div className="h-5 w-40 bg-black/10 rounded mb-4"></div>
             <div className="space-y-3">
               <div className="h-4 w-full bg-black/5 rounded"></div>
               <div className="h-4 w-5/6 bg-black/5 rounded"></div>
             </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 md:space-y-6">
          {/* Stats Panel Skeleton */}
          <div className="w-full h-40 bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: 'var(--border)' }}>
             <div className="h-5 w-32 bg-black/10 rounded mb-4"></div>
             <div className="grid grid-cols-2 gap-4 mt-6">
               <div className="h-8 w-16 bg-black/5 rounded"></div>
               <div className="h-8 w-16 bg-black/5 rounded"></div>
             </div>
          </div>

          {/* Vocab Skeleton */}
          <div className="w-full h-64 bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: 'var(--border)' }}>
             <div className="h-5 w-32 bg-black/10 rounded mb-4"></div>
             <div className="space-y-4">
               <div className="h-10 w-full bg-black/5 rounded"></div>
               <div className="h-10 w-full bg-black/5 rounded"></div>
               <div className="h-10 w-full bg-black/5 rounded"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
