export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const UNIT_STATUSES = ['available', 'reserved', 'used', 'expired'];

export const DONOR_STATUSES = ['eligible', 'deferred'];

export const REQUEST_URGENCIES = ['normal', 'urgent', 'critical'];

export const REQUEST_STATUSES = ['pending', 'fulfilled', 'cancelled'];
