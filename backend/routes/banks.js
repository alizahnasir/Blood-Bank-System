const express = require('express');
const router = express.Router();
const bankCtrl = require('../controllers/bankController');

router.get('/', bankCtrl.getAllBanks);
router.get('/camps', bankCtrl.getCamps);
router.post('/camps', bankCtrl.createCamp);

module.exports = router;
