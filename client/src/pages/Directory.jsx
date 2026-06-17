import { useEffect, useState } from 'react';
import api from '../api/client';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { LoadingSpinner, ErrorAlert } from '../components/LoadingSpinner';

export default function Directory() {
  const [hospitals, setHospitals] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [errorHospitals, setErrorHospitals] = useState(null);
  const [errorBanks, setErrorBanks] = useState(null);

  useEffect(() => {
    api
      .get('/hospitals')
      .then(({ data }) => setHospitals(data))
      .catch(() => setErrorHospitals('Could not load hospitals.'))
      .finally(() => setLoadingHospitals(false));

    api
      .get('/banks')
      .then(({ data }) => setBanks(data))
      .catch(() => setErrorBanks('Could not load blood banks.'))
      .finally(() => setLoadingBanks(false));
  }, []);

  const hospitalColumns = [
    { key: 'hospital_id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
  ];

  const bankColumns = [
    { key: 'bank_id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-primary">Hospitals & Banks</h2>
        <p className="mt-1 text-sm text-text-muted">Reference directory for hospitals and blood banks</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Hospitals">
          {loadingHospitals ? (
            <LoadingSpinner />
          ) : errorHospitals ? (
            <ErrorAlert message={errorHospitals} />
          ) : (
            <Table columns={hospitalColumns} data={hospitals} rowKey="hospital_id" />
          )}
        </Card>

        <Card title="Blood Banks">
          {loadingBanks ? (
            <LoadingSpinner />
          ) : errorBanks ? (
            <ErrorAlert message={errorBanks} />
          ) : (
            <Table columns={bankColumns} data={banks} rowKey="bank_id" />
          )}
        </Card>
      </div>
    </div>
  );
}
