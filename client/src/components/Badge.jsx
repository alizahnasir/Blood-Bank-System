const STATUS_VARIANTS = {
  eligible: 'success',
  available: 'success',
  fulfilled: 'success',
  deferred: 'warning',
  urgent: 'warning',
  pending: 'warning',
  reserved: 'accent',
  critical: 'danger',
  expired: 'danger',
  used: 'muted',
  cancelled: 'muted',
};

const VARIANT_CLASSES = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-soft text-primary',
  muted: 'bg-muted text-text-muted',
};

export function Badge({ label, variant }) {
  const resolved = variant || STATUS_VARIANTS[label?.toLowerCase()] || 'muted';
  const classes = VARIANT_CLASSES[resolved] || VARIANT_CLASSES.muted;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
      {label}
    </span>
  );
}

export function BloodTypeBadge({ type }) {
  return (
    <span className="inline-flex items-center rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
      {type}
    </span>
  );
}
