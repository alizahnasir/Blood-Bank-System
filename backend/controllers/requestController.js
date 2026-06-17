const { sql, poolPromise } = require('../config/db');

// GET all blood requests, with optional status filter
exports.getAllRequests = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { status, urgency } = req.query;

    let query = `
      SELECT br.request_id, p.full_name AS patient_name, h.name AS hospital_name,
             br.blood_type, br.quantity_ml, br.urgency, br.requested_on, br.status
      FROM blood_request br
      JOIN patient pt ON br.patient_id = pt.patient_id
      JOIN person p ON pt.person_id = p.person_id
      JOIN hospital h ON br.hospital_id = h.hospital_id
      WHERE 1=1
    `;
    const request = pool.request();

    if (status) {
      query += ' AND br.status = @status';
      request.input('status', sql.VarChar, status);
    }
    if (urgency) {
      query += ' AND br.urgency = @urgency';
      request.input('urgency', sql.VarChar, urgency);
    }

    query += ' ORDER BY br.requested_on DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single request with full detail
exports.getRequestById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT br.request_id, p.full_name AS patient_name, pt.diagnosis, pt.condition_severity,
               h.name AS hospital_name, br.blood_type, br.quantity_ml, br.urgency,
               br.requested_on, br.status, bs_p.full_name AS handled_by_name
        FROM blood_request br
        JOIN patient pt ON br.patient_id = pt.patient_id
        JOIN person p ON pt.person_id = p.person_id
        JOIN hospital h ON br.hospital_id = h.hospital_id
        LEFT JOIN bank_staff bs ON br.handled_by = bs.bank_staff_id
        LEFT JOIN person bs_p ON bs.person_id = bs_p.person_id
        WHERE br.request_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create a new blood request
exports.createRequest = async (req, res) => {
  const { patient_id, hospital_id, handled_by, blood_type, quantity_ml, urgency, requested_on } = req.body;

  if (!patient_id || !hospital_id || !blood_type || !quantity_ml || !urgency || !requested_on) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('patient_id', sql.Int, patient_id)
      .input('hospital_id', sql.Int, hospital_id)
      .input('handled_by', sql.Int, handled_by || null)
      .input('blood_type', sql.Char(3), blood_type)
      .input('quantity_ml', sql.Int, quantity_ml)
      .input('urgency', sql.VarChar, urgency)
      .input('requested_on', sql.Date, requested_on)
      .query(`
        INSERT INTO blood_request (patient_id, hospital_id, handled_by, blood_type, quantity_ml, urgency, requested_on, status)
        OUTPUT INSERTED.request_id
        VALUES (@patient_id, @hospital_id, @handled_by, @blood_type, @quantity_ml, @urgency, @requested_on, 'pending')
      `);

    res.status(201).json({ request_id: result.recordset[0].request_id, message: 'Blood request submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH fulfill a request — links a blood unit, creates transfusion record, updates statuses
exports.fulfillRequest = async (req, res) => {
  const { unit_id, administered_by, transfusion_date, quantity_ml, outcome_notes } = req.body;
  const requestId = req.params.id;

  if (!unit_id || !administered_by || !transfusion_date || !quantity_ml) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check unit is available
      const unitCheck = await new sql.Request(transaction)
        .input('unit_id', sql.Int, unit_id)
        .query("SELECT status FROM blood_unit WHERE unit_id = @unit_id");

      if (unitCheck.recordset.length === 0 || unitCheck.recordset[0].status !== 'available') {
        await transaction.rollback();
        return res.status(400).json({ error: 'Blood unit is not available' });
      }

      // Insert transfusion record
      await new sql.Request(transaction)
        .input('request_id', sql.Int, requestId)
        .input('unit_id', sql.Int, unit_id)
        .input('administered_by', sql.Int, administered_by)
        .input('transfusion_date', sql.Date, transfusion_date)
        .input('quantity_ml', sql.Int, quantity_ml)
        .input('outcome_notes', sql.VarChar, outcome_notes || null)
        .query(`
          INSERT INTO transfusion (request_id, unit_id, administered_by, transfusion_date, quantity_ml, outcome_notes)
          VALUES (@request_id, @unit_id, @administered_by, @transfusion_date, @quantity_ml, @outcome_notes)
        `);

      // Mark unit as used
      await new sql.Request(transaction)
        .input('unit_id', sql.Int, unit_id)
        .query("UPDATE blood_unit SET status = 'used' WHERE unit_id = @unit_id");

      // Mark request as fulfilled
      await new sql.Request(transaction)
        .input('request_id', sql.Int, requestId)
        .query("UPDATE blood_request SET status = 'fulfilled' WHERE request_id = @request_id");

      await transaction.commit();
      res.json({ message: 'Request fulfilled and transfusion recorded' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH cancel a request
exports.cancelRequest = async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query("UPDATE blood_request SET status = 'cancelled' WHERE request_id = @id");

    res.json({ message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
