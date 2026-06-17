import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { Badge, BloodTypeBadge } from '../components/Badge';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Modal, FormField, FormActions } from '../components/Modal';
import { LoadingSpinner, ErrorAlert, SuccessBanner } from '../components/LoadingSpinner';
import { BLOOD_TYPES, DONOR_STATUSES, formatDate } from '../utils/formatDate';

const EMPTY_FORM = {
  full_name: '',
  dob: '',
  gender: 'M',
  cnic: '',
  phone: '',
  email: '',
  city: '',
  blood_type: 'O+',
};

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ city: '', blood_type: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.blood_type) params.blood_type = filters.blood_type;
      if (filters.status) params.status = filters.status;
      const { data } = await api.get('/donors', { params });
      setDonors(data);
    } catch {
      setError('Could not load donors — is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  function handleFilterChange(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/donors', form);
      toast.success('Donor registered successfully');
      setSuccess('Donor registered successfully');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchDonors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register donor');
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: 'donor_id', label: 'ID' },
    { key: 'full_name', label: 'Name' },
    {
      key: 'blood_type',
      label: 'Blood Type',
      render: (row) => <BloodTypeBadge type={row.blood_type} />,
    },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    {
      key: 'registered_on',
      label: 'Registered',
      render: (row) => formatDate(row.registered_on),
    },
    {
      key: 'total_donations',
      label: 'Donations',
      render: (row) => row.total_donations ?? 0,
    },
    {
      key: 'eligibility_status',
      label: 'Status',
      render: (row) => <Badge label={row.eligibility_status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl text-primary">Donors</h2>
          <p className="mt-1 text-sm text-text-muted">Manage registered blood donors</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          Register Donor
        </button>
      </div>

      <SuccessBanner message={success} />

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            name="city"
            placeholder="Filter by city"
            value={filters.city}
            onChange={handleFilterChange}
            className="input-field max-w-xs"
          />
          <select
            name="blood_type"
            value={filters.blood_type}
            onChange={handleFilterChange}
            className="select-field max-w-xs"
          >
            <option value="">All blood types</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="select-field max-w-xs"
          >
            <option value="">All statuses</option>
            {DONOR_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <Table columns={columns} data={donors} rowKey="donor_id" />
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Donor" wide>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name" required>
              <input name="full_name" value={form.full_name} onChange={handleFormChange} required className="input-field" />
            </FormField>
            <FormField label="Date of Birth" required>
              <input type="date" name="dob" value={form.dob} onChange={handleFormChange} required className="input-field" />
            </FormField>
            <FormField label="Gender">
              <select name="gender" value={form.gender} onChange={handleFormChange} className="select-field">
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </FormField>
            <FormField label="CNIC" required>
              <input name="cnic" value={form.cnic} onChange={handleFormChange} required className="input-field" placeholder="42101-1234567-1" />
            </FormField>
            <FormField label="Phone" required>
              <input name="phone" value={form.phone} onChange={handleFormChange} required className="input-field" />
            </FormField>
            <FormField label="Email">
              <input type="email" name="email" value={form.email} onChange={handleFormChange} className="input-field" />
            </FormField>
            <FormField label="City">
              <input name="city" value={form.city} onChange={handleFormChange} className="input-field" />
            </FormField>
            <FormField label="Blood Type" required>
              <select name="blood_type" value={form.blood_type} onChange={handleFormChange} required className="select-field">
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormActions onCancel={() => setModalOpen(false)} submitLabel="Register" loading={submitting} />
        </form>
      </Modal>
    </div>
  );
}
