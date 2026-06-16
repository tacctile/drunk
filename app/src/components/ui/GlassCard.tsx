interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-card border bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </div>
  );
}
