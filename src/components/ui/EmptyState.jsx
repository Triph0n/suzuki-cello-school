/** Unified empty-state card: icon + message + optional hint. */
export default function EmptyState({ icon: Icon, title, hint, className = "" }) {
  return (
    <div className={`text-center p-10 bg-surface-container-low rounded-3xl border border-outline-variant/30 text-on-surface-variant shadow-sm ${className}`}>
      {Icon && <Icon size={48} className="mx-auto mb-4 opacity-40" aria-hidden="true" />}
      <p className="text-lg font-medium mb-1">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}
