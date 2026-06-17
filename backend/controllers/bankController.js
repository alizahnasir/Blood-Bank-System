const { sql, poolPromise } = require('../config/db');

exports.getAllBanks = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM blood_bank ORDER BY name');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCamps = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT dc.camp_id, dc.location, dc.city, dc.start_date, dc.end_date,
             dc.target_units, dc.collected_units, bb.name AS bank_name
      FROM donation_camp dc
      JOIN blood_bank bb ON dc.bank_id = bb.bank_id
      ORDER BY dc.start_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCamp = async (req, res) => {
  const { bank_id, location, city, start_date, end_date, target_units } = req.body;

  if (!bank_id || !location || !city || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('bank_id', sql.Int, bank_id)
      .input('location', sql.VarChar, location)
      .input('city', sql.VarChar, city)
      .input('start_date', sql.Date, start_date)
      .input('end_date', sql.Date, end_date)
      .input('target_units', sql.Int, target_units || 0)
      .query(`
        INSERT INTO donation_camp (bank_id, location, city, start_date, end_date, target_units, collected_units)
        OUTPUT INSERTED.camp_id
        VALUES (@bank_id, @location, @city, @start_date, @end_date, @target_units, 0)
      `);

    res.status(201).json({ camp_id: result.recordset[0].camp_id, message: 'Camp created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
