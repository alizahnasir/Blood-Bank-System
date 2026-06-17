import { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertCard, Card } from '../components/Card';
import { Badge, BloodTypeBadge } from '../components/Badge';
import { LoadingSpinner, ErrorAlert } from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatDate';

export default function Dashboard() {
  const [summary, setSummary] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [critical, setCritical] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, expiringRes, criticalRes] = await Promise.all([
          api.get('/units/summary'),
          api.get('/units/expiring'),
          api.get('/reports/critical-pending'),
        ]);
        setSummary(summaryRes.data);
        setExpiring(expiringRes.data);
        setCritical(criticalRes.data);
      } catch {
        setError('Could not load dashboard data — is the backend running on port 5000?');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-primary">Dashboard</h2>
        <p className="mt-1 text-sm text-text-muted">Inventory overview and urgent alerts</p>
      </div>

      {critical.length > 0 && (
        <AlertCard title="Critical Pending Requests" variant="danger">
          <ul className="space-y-3">
            {critical.map((req) => (
              <li
                key={req.request_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div>
                  <span className="font-semibold">{req.patient_name}</span>
                  <span className="mx-2 text-text-muted">·</span>
                  <span className="text-sm text-text-muted">{req.hospital_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BloodTypeBadge type={req.blood_type} />
                  <span className="text-sm">{req.quantity_ml} ml</span>
                  <Badge label="critical" />
                  <span className="text-xs text-text-muted">{formatDate(req.requested_on)}</span>
                </div>
              </li>
            ))}
          </ul>
        </AlertCard>
      )}

      <div>
        <h3 className="mb-3 text-lg text-primary">Inventory by Blood Type</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((item) => (
            <Card key={item.blood_type}>
              <div className="flex items-start justify-between">
                <BloodTypeBadge type={item.blood_type} />
                <Badge label="available" />
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-2xl font-semibold text-primary">{item.available_units}</p>
                <p className="text-xs text-text-muted">
                  of {item.total_units} units available
                </p>
                <p className="text-sm text-text-muted">{item.total_ml?.toLocaleString()} ml total</p>
              </div>
            </Card>
          ))}
          {summary.length === 0 && (
            <p className="col-span-full text-sm text-text-muted">No inventory data available.</p>
          )}
        </div>
      </div>

      <Card title="Units Expiring Within 14 Days">
        {expiring.length === 0 ? (
          <p className="text-sm text-text-muted">No units expiring soon.</p>
        ) : (
          <ul className="divide-y divide-border">
            {expiring.map((unit) => (
              <li key={unit.unit_id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Unit #{unit.unit_id}</span>
                  <BloodTypeBadge type={unit.blood_type} />
                  <span className="text-sm text-text-muted">{unit.quantity_ml} ml</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label="urgent" />
                  <span className="text-sm font-semibold text-warning">
                    Expires {formatDate(unit.expiry_date)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
