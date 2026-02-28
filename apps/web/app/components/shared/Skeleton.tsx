'use client';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export default function Skeleton({ className = '', lines = 3 }: SkeletonProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer rounded-lg h-4"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
          }}
        />
      ))}
    </div>
  );
}
