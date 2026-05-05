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
          className={`animate-pulse bg-slate-200 rounded-lg ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  );
};

export const CardSkeleton = () => (
  <div className="surface flex flex-col overflow-hidden rounded-3xl animate-pulse">
    <div className="h-64 bg-slate-200" />
    <div className="p-6 space-y-4">
      <div className="h-6 bg-slate-200 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-slate-200 rounded w-16" />
        <div className="h-5 bg-slate-200 rounded w-16" />
      </div>
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="pt-4 border-t border-slate-100 flex justify-between">
        <div className="h-8 bg-slate-200 rounded w-24" />
        <div className="h-8 bg-slate-200 rounded w-8" />
      </div>
    </div>
  </div>
);

export const TextSkeleton = ({ className, count = 1 }: { className?: string; count?: number }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <div key={i} className={`h-4 bg-slate-200 rounded animate-pulse ${className}`} />
    ))}
  </>
);
