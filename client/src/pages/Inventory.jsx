import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { Badge, BloodTypeBadge } from '../components/Badge';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { LoadingSpinner, ErrorAlert } from '../components/LoadingSpinner';
import { BLOOD_TYPES, UNIT_STATUSES, formatDate } from '../utils/formatDate';

export default function Inventory() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', blood_type: '' });
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.blood_type) params.blood_type = filters.blood_type;
      const { data } = await api.get('/units', { params });
      setUnits(data);
    } catch {
      setError('Could not load inventory — is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  async function handleStatusChange(unitId, status) {
    setUpdatingId(unitId);
    try {
      await api.patch(`/units/${unitId}/status`, { status });
      toast.success('Unit status updated');
      setUnits((prev) =>
        prev.map((u) => (u.unit_id === unitId ? { ...u, status } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  const columns = [
    { key: 'unit_id', label: 'Unit ID' },
    {
      key: 'blood_type',
      label: 'Blood Type',
      render: (row) => <BloodTypeBadge type={row.blood_type} />,
    },
    {
      key: 'quantity_ml',
      label: 'Quantity',
      render: (row) => `${row.quantity_ml} ml`,
    },
    {
      key: 'collection_date',
      label: 'Collected',
      render: (row) => formatDate(row.collection_date),
    },
    {
      key: 'expiry_date',
      label: 'Expires',
      render: (row) => formatDate(row.expiry_date),
    },
    { key: 'bank_name', label: 'Bank' },
    { key: 'bank_city', label: 'City' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <select
          value={row.status}
          disabled={updatingId === row.unit_id}
          onChange={(e) => handleStatusChange(row.unit_id, e.target.value)}
          className="select-field max-w-[130px] py-1 text-xs capitalize"
        >
          {UNIT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-primary">Inventory</h2>
        <p className="mt-1 text-sm text-text-muted">Blood unit stock and status management</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            name="status"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            className="select-field max-w-xs capitalize"
          >
            <option value="">All statuses</option>
            {UNIT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            name="blood_type"
            value={filters.blood_type}
            onChange={(e) => setFilters((p) => ({ ...p, blood_type: e.target.value }))}
            className="select-field max-w-xs"
          >
            <option value="">All blood types</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <Table columns={columns} data={units} rowKey="unit_id" emptyMessage="No blood units found." />
        )}
      </Card>
    </div>
  );
}
