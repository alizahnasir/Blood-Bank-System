import { useEffect, useState } from 'react';
import api from '../api/client';
import { BloodTypeBadge } from '../components/Badge';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { LoadingSpinner, ErrorAlert } from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatDate';

function SectionLoader({ loading, error, children }) {
  if (loading) return <LoadingSpinner message="Loading report…" />;
  if (error) return <ErrorAlert message={error} />;
  return children;
}

export default function Reports() {
  const [topDonors, setTopDonors] = useState([]);
  const [hospitalDemand, setHospitalDemand] = useState([]);
  const [campPerformance, setCampPerformance] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState({
    topDonors: true,
    hospitalDemand: true,
    campPerformance: true,
    audit: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadTopDonors() {
      try {
        const { data } = await api.get('/reports/top-donors');
        setTopDonors(data);
      } catch {
        setErrors((e) => ({ ...e, topDonors: 'Failed to load top donors report.' }));
      } finally {
        setLoading((l) => ({ ...l, topDonors: false }));
      }
    }

    async function loadHospitalDemand() {
      try {
        const { data } = await api.get('/reports/hospital-demand');
        setHospitalDemand(data);
      } catch {
        setErrors((e) => ({ ...e, hospitalDemand: 'Failed to load hospital demand report.' }));
      } finally {
        setLoading((l) => ({ ...l, hospitalDemand: false }));
      }
    }

    async function loadCampPerformance() {
      try {
        const { data } = await api.get('/reports/camp-performance');
        setCampPerformance(data);
      } catch {
        setErrors((e) => ({ ...e, campPerformance: 'Failed to load camp performance report.' }));
      } finally {
        setLoading((l) => ({ ...l, campPerformance: false }));
      }
    }

    async function loadAudit() {
      try {
        const { data } = await api.get('/reports/audit');
        setAudit(data);
      } catch {
        setErrors((e) => ({ ...e, audit: 'Failed to load transfusion audit trail.' }));
      } finally {
        setLoading((l) => ({ ...l, audit: false }));
      }
    }

    loadTopDonors();
    loadHospitalDemand();
    loadCampPerformance();
    loadAudit();
  }, []);

  const topDonorColumns = [
    { key: 'full_name', label: 'Donor' },
    {
      key: 'blood_type',
      label: 'Blood Type',
      render: (row) => <BloodTypeBadge type={row.blood_type} />,
    },
    { key: 'city', label: 'City' },
    { key: 'total_donations', label: 'Total Donations' },
  ];

  const hospitalColumns = [
    { key: 'hospital_name', label: 'Hospital' },
    { key: 'city', label: 'City' },
    { key: 'total_requests', label: 'Total Requests' },
    { key: 'critical_requests', label: 'Critical Requests' },
  ];

  const campColumns = [
    { key: 'location', label: 'Location' },
    { key: 'city', label: 'City' },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (row) => formatDate(row.start_date),
    },
    { key: 'target_units', label: 'Target' },
    { key: 'collected_units', label: 'Collected' },
    {
      key: 'percent_achieved',
      label: 'Achievement',
      render: (row) => `${row.percent_achieved ?? 0}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-primary">Reports</h2>
        <p className="mt-1 text-sm text-text-muted">Analytics and transfusion audit trail</p>
      </div>

      <Card title="Top Donors">
        <SectionLoader loading={loading.topDonors} error={errors.topDonors}>
          <Table columns={topDonorColumns} data={topDonors} rowKey="full_name" />
        </SectionLoader>
      </Card>

      <Card title="Hospital Demand">
        <SectionLoader loading={loading.hospitalDemand} error={errors.hospitalDemand}>
          <Table columns={hospitalColumns} data={hospitalDemand} rowKey="hospital_name" />
        </SectionLoader>
      </Card>

      <Card title="Donation Camp Performance">
        <SectionLoader loading={loading.campPerformance} error={errors.campPerformance}>
          <Table columns={campColumns} data={campPerformance} rowKey="location" />
        </SectionLoader>
      </Card>

      <Card title="Transfusion Audit Trail">
        <SectionLoader loading={loading.audit} error={errors.audit}>
          {audit.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">No transfusion records yet.</p>
          ) : (
            <ol className="relative space-y-0 border-l-2 border-accent pl-6">
              {audit.map((entry, idx) => (
                <li key={idx} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-soft" />
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      {formatDate(entry.transfusion_date)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-primary">{entry.donor_name}</span>
                      <span className="text-text-muted">donated</span>
                      <BloodTypeBadge type={entry.blood_type} />
                      <span className="text-text-muted">→ transfused to</span>
                      <span className="font-semibold">{entry.patient_name}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">{entry.hospital_name}</p>
                    {entry.outcome_notes && (
                      <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm italic text-text-muted">
                        {entry.outcome_notes}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionLoader>
      </Card>
    </div>
  );
}
