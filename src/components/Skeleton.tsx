import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1, width, height }) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer rounded-lg ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
};

export const CardSkeleton = () => (
  <div className="surface flex flex-col overflow-hidden rounded-3xl">
    <div className="h-64 skeleton-shimmer" />
    <div className="p-6 space-y-4">
      <div className="h-6 skeleton-shimmer rounded-xl w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 skeleton-shimmer rounded-full w-20" />
        <div className="h-5 skeleton-shimmer rounded-full w-16" />
      </div>
      <div className="h-4 skeleton-shimmer rounded w-1/2" />
      <div className="pt-4 border-t border-slate-100 flex justify-between">
        <div className="h-8 skeleton-shimmer rounded-xl w-24" />
        <div className="flex gap-2">
          <div className="h-8 w-8 skeleton-shimmer rounded-xl" />
          <div className="h-8 w-8 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

export const TextSkeleton = ({ className, count = 1 }: { className?: string; count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className={`h-4 skeleton-shimmer rounded ${className}`} style={{ width: `${85 - i * 10}%` }} />
    ))}
  </>
);

/* ─── College Detail Page Skeletons ─── */

export const DetailHeroSkeleton = () => (
  <div className="animate-page-in space-y-10">
    <div className="relative h-[460px] overflow-hidden rounded-[2rem] skeleton-shimmer">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-300/40 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="h-8 w-28 skeleton-shimmer rounded-full" />
            <div className="h-8 w-36 skeleton-shimmer rounded-full" />
          </div>
          <div className="h-14 skeleton-shimmer rounded-2xl w-3/4" />
          <div className="h-10 skeleton-shimmer rounded-2xl w-1/2" />
          <div className="flex gap-4 pt-2">
            <div className="h-14 w-48 skeleton-shimmer rounded-2xl" />
            <div className="h-14 w-36 skeleton-shimmer rounded-2xl" />
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-12">
        {/* About Section */}
        <div className="space-y-4">
          <div className="h-8 skeleton-shimmer rounded-xl w-64" />
          <div className="space-y-3">
            <div className="h-4 skeleton-shimmer rounded w-full" />
            <div className="h-4 skeleton-shimmer rounded w-[95%]" />
            <div className="h-4 skeleton-shimmer rounded w-[88%]" />
            <div className="h-4 skeleton-shimmer rounded w-[72%]" />
          </div>
        </div>

        {/* Courses Section */}
        <div className="surface p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 skeleton-shimmer rounded-xl w-48" />
            <div className="h-5 skeleton-shimmer rounded w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 skeleton-shimmer rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 skeleton-shimmer rounded w-32" />
                    <div className="h-3 skeleton-shimmer rounded w-24" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-4 skeleton-shimmer rounded w-20 ml-auto" />
                  <div className="h-3 skeleton-shimmer rounded w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placements + Facilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="surface p-8 rounded-3xl space-y-4">
            <div className="w-10 h-10 skeleton-shimmer rounded-lg" />
            <div className="h-6 skeleton-shimmer rounded w-48" />
            <div className="h-12 skeleton-shimmer rounded-xl w-24" />
            <div className="h-4 skeleton-shimmer rounded w-36" />
            <div className="h-4 skeleton-shimmer rounded w-40" />
          </div>
          <div className="rounded-3xl skeleton-shimmer h-[260px]" />
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-8">
        <div className="surface p-8 rounded-3xl space-y-6">
          <div className="space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-32" />
            <div className="h-10 skeleton-shimmer rounded-xl w-48" />
          </div>
          <div className="space-y-4 pt-4">
            <div className="h-6 skeleton-shimmer rounded w-36" />
            <div className="h-16 skeleton-shimmer rounded-xl w-full" />
            <div className="h-16 skeleton-shimmer rounded-xl w-full" />
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-14 skeleton-shimmer rounded-2xl w-full" />
            <div className="h-14 skeleton-shimmer rounded-2xl w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Compare Page Skeletons ─── */

export const CompareTableSkeleton = ({ count = 2 }: { count?: number }) => (
  <div className="space-y-12 animate-page-in">
    <div className="text-center space-y-3">
      <div className="h-5 skeleton-shimmer rounded-full w-24 mx-auto" />
      <div className="h-10 skeleton-shimmer rounded-xl w-72 mx-auto" />
      <div className="h-4 skeleton-shimmer rounded w-56 mx-auto" />
    </div>

    <div className="surface overflow-hidden rounded-[2rem]">
      <table className="min-w-full divide-y divide-slate-100">
        <thead>
          <tr className="bg-[#f6f4ee]/70">
            <th className="py-10 px-8 w-1/4">
              <div className="h-4 skeleton-shimmer rounded w-32" />
            </th>
            {[...Array(count)].map((_, i) => (
              <th key={i} className="py-10 px-8 min-w-[300px]">
                <div className="space-y-3">
                  <div className="w-16 h-16 skeleton-shimmer rounded-2xl" />
                  <div className="h-5 skeleton-shimmer rounded w-40" />
                  <div className="h-3 skeleton-shimmer rounded w-28" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[...Array(5)].map((_, row) => (
            <tr key={row}>
              <td className="py-8 px-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 skeleton-shimmer rounded" />
                  <div className="h-4 skeleton-shimmer rounded w-24" />
                </div>
              </td>
              {[...Array(count)].map((_, col) => (
                <td key={col} className="py-8 px-8">
                  <div className="h-5 skeleton-shimmer rounded w-32" />
                  <div className="h-3 skeleton-shimmer rounded w-20 mt-2" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ─── Courses / Ranking Page Skeletons ─── */

export const CourseRankingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="group relative p-6 rounded-3xl bg-white border border-slate-100">
        <div className="flex items-center gap-5 mb-4">
          <div className="w-10 h-10 skeleton-shimmer rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-5 skeleton-shimmer rounded w-48" />
            <div className="h-3 skeleton-shimmer rounded w-28" />
          </div>
          <div className="h-6 w-16 skeleton-shimmer rounded" />
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
          <div className="space-y-2">
            <div className="h-2.5 skeleton-shimmer rounded w-16" />
            <div className="h-4 skeleton-shimmer rounded w-24" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 skeleton-shimmer rounded-xl" />
            <div className="w-8 h-8 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Home Page Featured Colleges Skeleton ─── */

export const FeaturedCollegesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/* ─── Profile Page Skeleton ─── */

export const ProfileSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 items-start">
      {/* Sidebar */}
      <aside className="flex flex-col space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 skeleton-shimmer rounded-full" />
            <div className="space-y-2">
              <div className="h-5 skeleton-shimmer rounded w-28" />
              <div className="h-3 skeleton-shimmer rounded w-40" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-3 skeleton-shimmer rounded w-20 mb-2" />
                <div className="h-10 skeleton-shimmer rounded-xl w-full" />
              </div>
            ))}
            <div className="h-10 skeleton-shimmer rounded-xl w-full mt-4" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 skeleton-shimmer rounded w-32" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 skeleton-shimmer rounded-lg w-full" />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="space-y-10 py-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 skeleton-shimmer rounded-xl w-64" />
            <div className="h-4 skeleton-shimmer rounded w-40" />
          </div>
          <div className="h-4 skeleton-shimmer rounded w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  </div>
);

/* ─── College List Page Skeleton ─── */

export const CollegeGridSkeleton = ({ count = 6, cols = 'md:grid-cols-2' }: { count?: number; cols?: string }) => (
  <div className={`grid grid-cols-1 gap-8 ${cols}`}>
    {[...Array(count)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/* ─── Q&A / Reviews Section Skeleton ─── */

export const QASkeleton = () => (
  <div className="space-y-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-6 bg-white/82 border border-slate-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 skeleton-shimmer rounded-full" />
          <div className="h-4 skeleton-shimmer rounded w-24" />
        </div>
        <div className="space-y-2">
          <div className="h-4 skeleton-shimmer rounded w-full" />
          <div className="h-4 skeleton-shimmer rounded w-3/4" />
        </div>
        <div className="h-4 skeleton-shimmer rounded w-32" />
      </div>
    ))}
  </div>
);

export const ReviewsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 skeleton-shimmer rounded-full" />
            <div className="h-4 skeleton-shimmer rounded w-20" />
          </div>
          <div className="h-4 skeleton-shimmer rounded w-12" />
        </div>
        <div className="space-y-2">
          <div className="h-4 skeleton-shimmer rounded w-full" />
          <div className="h-4 skeleton-shimmer rounded w-2/3" />
        </div>
        <div className="h-3 skeleton-shimmer rounded w-24" />
      </div>
    ))}
  </div>
);

/* ─── Events Section Skeleton ─── */

export const EventsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-5 rounded-2xl border border-slate-100 space-y-3">
        <div className="h-5 skeleton-shimmer rounded-full w-20" />
        <div className="h-5 skeleton-shimmer rounded w-40" />
        <div className="h-4 skeleton-shimmer rounded w-full" />
        <div className="h-3 skeleton-shimmer rounded w-28" />
      </div>
    ))}
  </div>
);
