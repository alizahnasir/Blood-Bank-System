const { sql, poolPromise } = require('../config/db');

// GET all donors (with person details joined)
exports.getAllDonors = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { city, blood_type, status } = req.query;

    let query = `
      SELECT d.donor_id, p.full_name, p.blood_type, p.phone, p.email, p.city,
             d.registered_on, d.last_donation_date, d.total_donations, d.eligibility_status
      FROM donor d
      JOIN person p ON d.person_id = p.person_id
      WHERE 1=1
    `;

    const request = pool.request();

    if (city) {
      query += ' AND p.city = @city';
      request.input('city', sql.VarChar, city);
    }
    if (blood_type) {
      query += ' AND p.blood_type = @blood_type';
      request.input('blood_type', sql.Char(3), blood_type);
    }
    if (status) {
      query += ' AND d.eligibility_status = @status';
      request.input('status', sql.VarChar, status);
    }

    query += ' ORDER BY d.donor_id';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single donor by id
exports.getDonorById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT d.donor_id, p.full_name, p.dob, p.gender, p.cnic, p.phone, p.email,
               p.city, p.blood_type, d.registered_on, d.last_donation_date,
               d.total_donations, d.eligibility_status, d.medical_notes
        FROM donor d
        JOIN person p ON d.person_id = p.person_id
        WHERE d.donor_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create a new donor (creates person + donor record together)
exports.createDonor = async (req, res) => {
  const { full_name, dob, gender, cnic, phone, email, city, blood_type } = req.body;

  if (!full_name || !dob || !cnic || !phone || !blood_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const personResult = await new sql.Request(transaction)
        .input('full_name', sql.VarChar, full_name)
        .input('dob', sql.Date, dob)
        .input('gender', sql.Char(1), gender)
        .input('cnic', sql.VarChar, cnic)
        .input('phone', sql.VarChar, phone)
        .input('email', sql.VarChar, email)
        .input('city', sql.VarChar, city)
        .input('blood_type', sql.Char(3), blood_type)
        .query(`
          INSERT INTO person (full_name, dob, gender, cnic, phone, email, city, blood_type)
          OUTPUT INSERTED.person_id
          VALUES (@full_name, @dob, @gender, @cnic, @phone, @email, @city, @blood_type)
        `);

      const personId = personResult.recordset[0].person_id;

      const donorResult = await new sql.Request(transaction)
        .input('person_id', sql.Int, personId)
        .query(`
          INSERT INTO donor (person_id, registered_on, total_donations, eligibility_status)
          OUTPUT INSERTED.donor_id
          VALUES (@person_id, GETDATE(), 0, 'eligible')
        `);

      await transaction.commit();
      res.status(201).json({
        donor_id: donorResult.recordset[0].donor_id,
        person_id: personId,
        message: 'Donor registered successfully',
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH update donor eligibility / notes
exports.updateDonor = async (req, res) => {
  const { eligibility_status, medical_notes, last_donation_date, total_donations } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('eligibility_status', sql.VarChar, eligibility_status)
      .input('medical_notes', sql.VarChar, medical_notes)
      .input('last_donation_date', sql.Date, last_donation_date)
      .input('total_donations', sql.Int, total_donations)
      .query(`
        UPDATE donor
        SET eligibility_status = COALESCE(@eligibility_status, eligibility_status),
            medical_notes      = COALESCE(@medical_notes, medical_notes),
            last_donation_date = COALESCE(@last_donation_date, last_donation_date),
            total_donations    = COALESCE(@total_donations, total_donations)
        WHERE donor_id = @id
      `);

    res.json({ message: 'Donor updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE a donor
exports.deleteDonor = async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM donor WHERE donor_id = @id');
    res.json({ message: 'Donor deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
