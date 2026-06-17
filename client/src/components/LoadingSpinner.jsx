export function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-soft border-t-primary" />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

export function ErrorAlert({ message }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 px-5 py-4 text-sm text-danger">
      {message || 'Could not load data — is the backend running on port 5000?'}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
      {message}
    </div>
  );
}
