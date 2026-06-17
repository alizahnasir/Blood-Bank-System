const { sql, poolPromise } = require('../config/db');

exports.getAllHospitals = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM hospital ORDER BY name');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHospitalPatients = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT pt.patient_id, p.full_name, p.blood_type, pt.diagnosis,
               pt.condition_severity, pt.admission_date
        FROM patient pt
        JOIN person p ON pt.person_id = p.person_id
        WHERE pt.hospital_id = @id
        ORDER BY pt.admission_date DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
