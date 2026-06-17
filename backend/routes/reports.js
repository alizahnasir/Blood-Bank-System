const express = require('express');
const router = express.Router();
const reportCtrl = require('../controllers/reportController');

router.get('/audit', reportCtrl.getTransfusionAudit);
router.get('/top-donors', reportCtrl.getTopDonors);
router.get('/hospital-demand', reportCtrl.getHospitalDemand);
router.get('/camp-performance', reportCtrl.getCampPerformance);
router.get('/critical-pending', reportCtrl.getCriticalPending);

module.exports = router;
