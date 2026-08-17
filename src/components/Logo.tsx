export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="bg-black text-white text-xs font-bold tracking-wide px-1.5 py-0.5 border border-white/20">
        BEST
      </span>
      <span className="font-semibold tracking-tight">Property Services</span>
    </span>
  );
}
