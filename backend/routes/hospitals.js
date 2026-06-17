const express = require('express');
const router = express.Router();
const hospitalCtrl = require('../controllers/hospitalController');

router.get('/', hospitalCtrl.getAllHospitals);
router.get('/:id/patients', hospitalCtrl.getHospitalPatients);

module.exports = router;
