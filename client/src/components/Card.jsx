export function Card({ title, children, className = '', headerAction }) {
  return (
    <div className={`card shadow-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg text-primary">{title}</h2>
          {headerAction}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function AlertCard({ title, children, variant = 'danger' }) {
  const borderColors = {
    danger: 'border-danger',
    warning: 'border-warning',
    success: 'border-success',
  };
  const bgColors = {
    danger: 'bg-danger/5',
    warning: 'bg-warning/5',
    success: 'bg-success/5',
  };

  return (
    <div className={`card border-l-4 shadow-card ${borderColors[variant]} ${bgColors[variant]}`}>
      {title && (
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-primary">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
