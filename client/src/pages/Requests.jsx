import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { Badge, BloodTypeBadge } from '../components/Badge';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Modal, FormField, FormActions } from '../components/Modal';
import { LoadingSpinner, ErrorAlert } from '../components/LoadingSpinner';
import { BLOOD_TYPES, REQUEST_URGENCIES, formatDate } from '../utils/formatDate';

const EMPTY_REQUEST = {
  patient_id: '',
  hospital_id: '',
  handled_by: '',
  blood_type: 'O+',
  quantity_ml: '',
  urgency: 'normal',
  requested_on: new Date().toISOString().slice(0, 10),
};

const EMPTY_FULFILL = {
  unit_id: '',
  administered_by: '',
  transfusion_date: new Date().toISOString().slice(0, 10),
  quantity_ml: '',
  outcome_notes: '',
};

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [fulfillForm, setFulfillForm] = useState(EMPTY_FULFILL);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch {
      setError('Could not load requests — is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    api.get('/hospitals').then(({ data }) => setHospitals(data)).catch(() => {});
  }, [fetchRequests]);

  useEffect(() => {
    if (!requestForm.hospital_id) {
      setPatients([]);
      return;
    }
    api
      .get(`/hospitals/${requestForm.hospital_id}/patients`)
      .then(({ data }) => setPatients(data))
      .catch(() => setPatients([]));
  }, [requestForm.hospital_id]);

  function openFulfillModal(req) {
    setSelectedRequest(req);
    setFulfillForm({
      ...EMPTY_FULFILL,
      quantity_ml: String(req.quantity_ml),
    });
    setFulfillModalOpen(true);
    api
      .get('/units', { params: { status: 'available', blood_type: req.blood_type } })
      .then(({ data }) => setAvailableUnits(data))
      .catch(() => setAvailableUnits([]));
  }

  async function handleCreateRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        patient_id: Number(requestForm.patient_id),
        hospital_id: Number(requestForm.hospital_id),
        blood_type: requestForm.blood_type,
        quantity_ml: Number(requestForm.quantity_ml),
        urgency: requestForm.urgency,
        requested_on: requestForm.requested_on,
      };
      if (requestForm.handled_by) {
        payload.handled_by = Number(requestForm.handled_by);
      }
      await api.post('/requests', payload);
      toast.success('Blood request submitted');
      setNewModalOpen(false);
      setRequestForm(EMPTY_REQUEST);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFulfill(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/requests/${selectedRequest.request_id}/fulfill`, {
        unit_id: Number(fulfillForm.unit_id),
        administered_by: Number(fulfillForm.administered_by),
        transfusion_date: fulfillForm.transfusion_date,
        quantity_ml: Number(fulfillForm.quantity_ml),
        outcome_notes: fulfillForm.outcome_notes || undefined,
      });
      toast.success('Request fulfilled');
      setFulfillModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fulfill request');
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: 'request_id', label: 'ID' },
    { key: 'patient_name', label: 'Patient' },
    { key: 'hospital_name', label: 'Hospital' },
    {
      key: 'blood_type',
      label: 'Type',
      render: (row) => <BloodTypeBadge type={row.blood_type} />,
    },
    {
      key: 'quantity_ml',
      label: 'Qty',
      render: (row) => `${row.quantity_ml} ml`,
    },
    {
      key: 'urgency',
      label: 'Urgency',
      render: (row) => <Badge label={row.urgency} />,
    },
    {
      key: 'requested_on',
      label: 'Requested',
      render: (row) => formatDate(row.requested_on),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge label={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        row.status === 'pending' ? (
          <button
            type="button"
            className="btn-primary py-1 text-xs"
            onClick={() => openFulfillModal(row)}
          >
            Fulfill
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl text-primary">Blood Requests</h2>
          <p className="mt-1 text-sm text-text-muted">Submit and fulfill hospital blood requests</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setNewModalOpen(true)}>
          New Request
        </button>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <Table columns={columns} data={requests} rowKey="request_id" />
        )}
      </Card>

      <Modal isOpen={newModalOpen} onClose={() => setNewModalOpen(false)} title="New Blood Request" wide>
        <form onSubmit={handleCreateRequest}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Hospital" required>
              <select
                value={requestForm.hospital_id}
                onChange={(e) =>
                  setRequestForm((p) => ({ ...p, hospital_id: e.target.value, patient_id: '' }))
                }
                required
                className="select-field"
              >
                <option value="">Select hospital</option>
                {hospitals.map((h) => (
                  <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Patient" required>
              <select
                value={requestForm.patient_id}
                onChange={(e) => setRequestForm((p) => ({ ...p, patient_id: e.target.value }))}
                required
                disabled={!requestForm.hospital_id}
                className="select-field"
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.full_name} ({p.blood_type})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Blood Type" required>
              <select
                value={requestForm.blood_type}
                onChange={(e) => setRequestForm((p) => ({ ...p, blood_type: e.target.value }))}
                required
                className="select-field"
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Quantity (ml)" required>
              <input
                type="number"
                value={requestForm.quantity_ml}
                onChange={(e) => setRequestForm((p) => ({ ...p, quantity_ml: e.target.value }))}
                required
                min="1"
                className="input-field"
              />
            </FormField>
            <FormField label="Urgency" required>
              <select
                value={requestForm.urgency}
                onChange={(e) => setRequestForm((p) => ({ ...p, urgency: e.target.value }))}
                required
                className="select-field capitalize"
              >
                {REQUEST_URGENCIES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Requested On" required>
              <input
                type="date"
                value={requestForm.requested_on}
                onChange={(e) => setRequestForm((p) => ({ ...p, requested_on: e.target.value }))}
                required
                className="input-field"
              />
            </FormField>
            <FormField label="Handled By (bank staff ID)">
              <input
                type="number"
                value={requestForm.handled_by}
                onChange={(e) => setRequestForm((p) => ({ ...p, handled_by: e.target.value }))}
                className="input-field"
                placeholder="Optional"
              />
              <p className="mt-1 text-xs text-text-muted">
                No API endpoint lists bank staff — enter bank_staff_id manually if known.
              </p>
            </FormField>
          </div>
          <FormActions onCancel={() => setNewModalOpen(false)} submitLabel="Submit Request" loading={submitting} />
        </form>
      </Modal>

      <Modal
        isOpen={fulfillModalOpen}
        onClose={() => setFulfillModalOpen(false)}
        title={`Fulfill Request #${selectedRequest?.request_id ?? ''}`}
        wide
      >
        {selectedRequest && (
          <form onSubmit={handleFulfill}>
            <p className="mb-4 text-sm text-text-muted">
              {selectedRequest.patient_name} · {selectedRequest.blood_type} · {selectedRequest.quantity_ml} ml
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Blood Unit" required>
                <select
                  value={fulfillForm.unit_id}
                  onChange={(e) => setFulfillForm((p) => ({ ...p, unit_id: e.target.value }))}
                  required
                  className="select-field"
                >
                  <option value="">Select available unit</option>
                  {availableUnits.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>
                      Unit #{u.unit_id} — {u.quantity_ml} ml (expires {formatDate(u.expiry_date)})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Administered By (hospital staff ID)" required>
                <input
                  type="number"
                  value={fulfillForm.administered_by}
                  onChange={(e) => setFulfillForm((p) => ({ ...p, administered_by: e.target.value }))}
                  required
                  className="input-field"
                />
                <p className="mt-1 text-xs text-text-muted">
                  No API endpoint lists hospital staff — enter hospital_staff_id manually.
                </p>
              </FormField>
              <FormField label="Transfusion Date" required>
                <input
                  type="date"
                  value={fulfillForm.transfusion_date}
                  onChange={(e) => setFulfillForm((p) => ({ ...p, transfusion_date: e.target.value }))}
                  required
                  className="input-field"
                />
              </FormField>
              <FormField label="Quantity (ml)" required>
                <input
                  type="number"
                  value={fulfillForm.quantity_ml}
                  onChange={(e) => setFulfillForm((p) => ({ ...p, quantity_ml: e.target.value }))}
                  required
                  min="1"
                  className="input-field"
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Outcome Notes">
                  <textarea
                    value={fulfillForm.outcome_notes}
                    onChange={(e) => setFulfillForm((p) => ({ ...p, outcome_notes: e.target.value }))}
                    rows={3}
                    className="input-field resize-none"
                  />
                </FormField>
              </div>
            </div>
            <FormActions onCancel={() => setFulfillModalOpen(false)} submitLabel="Fulfill Request" loading={submitting} />
          </form>
        )}
      </Modal>
    </div>
  );
}
