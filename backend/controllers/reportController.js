const { sql, poolPromise } = require('../config/db');

// Full audit trail: donor -> unit -> transfusion -> patient
exports.getTransfusionAudit = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p_donor.full_name   AS donor_name,
             bu.blood_type,
             t.transfusion_date,
             p_patient.full_name AS patient_name,
             h.name              AS hospital_name,
             t.outcome_notes
      FROM transfusion t
      JOIN blood_unit bu     ON t.unit_id      = bu.unit_id
      JOIN donation d        ON bu.donation_id = d.donation_id
      JOIN donor dn          ON d.donor_id     = dn.donor_id
      JOIN person p_donor    ON dn.person_id   = p_donor.person_id
      JOIN blood_request br  ON t.request_id   = br.request_id
      JOIN patient pt        ON br.patient_id  = pt.patient_id
      JOIN person p_patient  ON pt.person_id   = p_patient.person_id
      JOIN hospital h        ON br.hospital_id = h.hospital_id
      ORDER BY t.transfusion_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Top donors by total donations
exports.getTopDonors = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 10 p.full_name, p.blood_type, p.city, d.total_donations
      FROM donor d
      JOIN person p ON d.person_id = p.person_id
      ORDER BY d.total_donations DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hospitals with the most blood requests
exports.getHospitalDemand = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT h.name AS hospital_name, h.city,
             COUNT(br.request_id) AS total_requests,
             SUM(CASE WHEN br.urgency = 'critical' THEN 1 ELSE 0 END) AS critical_requests
      FROM hospital h
      LEFT JOIN blood_request br ON h.hospital_id = br.hospital_id
      GROUP BY h.name, h.city
      ORDER BY total_requests DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Donation camp performance
exports.getCampPerformance = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT dc.location, dc.city, dc.start_date, dc.target_units, dc.collected_units,
             ROUND(CAST(dc.collected_units AS FLOAT) / dc.target_units * 100, 1) AS percent_achieved
      FROM donation_camp dc
      ORDER BY dc.start_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Pending critical requests (subquery example)
exports.getCriticalPending = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT br.request_id, p.full_name AS patient_name, h.name AS hospital_name,
             br.blood_type, br.quantity_ml, br.requested_on
      FROM blood_request br
      JOIN patient pt ON br.patient_id = pt.patient_id
      JOIN person p ON pt.person_id = p.person_id
      JOIN hospital h ON br.hospital_id = h.hospital_id
      WHERE br.status = 'pending'
        AND br.urgency = 'critical'
        AND br.blood_type IN (
          SELECT blood_type FROM blood_unit WHERE status = 'available'
        )
      ORDER BY br.requested_on ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
