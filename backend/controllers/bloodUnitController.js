const { sql, poolPromise } = require('../config/db');

// GET all blood units (inventory), with optional filters
exports.getAllUnits = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { status, blood_type, bank_id } = req.query;

    let query = `
      SELECT bu.unit_id, bu.blood_type, bu.quantity_ml, bu.collection_date,
             bu.expiry_date, bu.status, bb.name AS bank_name, bb.city AS bank_city
      FROM blood_unit bu
      JOIN blood_bank bb ON bu.bank_id = bb.bank_id
      WHERE 1=1
    `;
    const request = pool.request();

    if (status) {
      query += ' AND bu.status = @status';
      request.input('status', sql.VarChar, status);
    }
    if (blood_type) {
      query += ' AND bu.blood_type = @blood_type';
      request.input('blood_type', sql.Char(3), blood_type);
    }
    if (bank_id) {
      query += ' AND bu.bank_id = @bank_id';
      request.input('bank_id', sql.Int, bank_id);
    }

    query += ' ORDER BY bu.expiry_date ASC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET inventory summary grouped by blood type (for dashboard)
exports.getInventorySummary = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT blood_type,
             COUNT(*) AS total_units,
             SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_units,
             SUM(quantity_ml) AS total_ml
      FROM blood_unit
      GROUP BY blood_type
      ORDER BY blood_type
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET units expiring soon (within 14 days)
exports.getExpiringUnits = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT unit_id, blood_type, quantity_ml, expiry_date, status
      FROM blood_unit
      WHERE status = 'available'
        AND expiry_date BETWEEN GETDATE() AND DATEADD(DAY, 14, GETDATE())
      ORDER BY expiry_date ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST create a new blood unit (after a donation passes screening)
exports.createUnit = async (req, res) => {
  const { donation_id, bank_id, blood_type, quantity_ml, collection_date, expiry_date } = req.body;

  if (!donation_id || !bank_id || !blood_type || !quantity_ml || !collection_date || !expiry_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('donation_id', sql.Int, donation_id)
      .input('bank_id', sql.Int, bank_id)
      .input('blood_type', sql.Char(3), blood_type)
      .input('quantity_ml', sql.Int, quantity_ml)
      .input('collection_date', sql.Date, collection_date)
      .input('expiry_date', sql.Date, expiry_date)
      .query(`
        INSERT INTO blood_unit (donation_id, bank_id, blood_type, quantity_ml, collection_date, expiry_date, status)
        OUTPUT INSERTED.unit_id
        VALUES (@donation_id, @bank_id, @blood_type, @quantity_ml, @collection_date, @expiry_date, 'available')
      `);

    res.status(201).json({ unit_id: result.recordset[0].unit_id, message: 'Blood unit created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH update unit status (e.g. mark expired, reserved, used)
exports.updateUnitStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['available', 'reserved', 'used', 'expired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.VarChar, status)
      .query('UPDATE blood_unit SET status = @status WHERE unit_id = @id');

    res.json({ message: 'Unit status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
