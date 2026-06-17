const express = require('express');
const router = express.Router();
const unitCtrl = require('../controllers/bloodUnitController');

router.get('/', unitCtrl.getAllUnits);
router.get('/summary', unitCtrl.getInventorySummary);
router.get('/expiring', unitCtrl.getExpiringUnits);
router.post('/', unitCtrl.createUnit);
router.patch('/:id/status', unitCtrl.updateUnitStatus);

module.exports = router;
