import { Sparkles } from "lucide-react";

/**
 * Inline AI badge — e.g. <AIBadge>AI Suggested</AIBadge>
 */
export function AIBadge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-brand-800/50 bg-brand-950/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-400 ${className}`}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {children}
    </span>
  );
}

/**
 * Section header with AI badge
 */
export function AISectionHeader({ title, subtitle, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          <AIBadge>AI Recommended</AIBadge>
        </div>
        {title && <h3 className="mt-1.5 text-sm font-semibold text-zinc-100">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
}

