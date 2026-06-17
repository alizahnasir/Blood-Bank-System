const express = require('express');
const router = express.Router();
const donorCtrl = require('../controllers/donorController');

router.get('/', donorCtrl.getAllDonors);
router.get('/:id', donorCtrl.getDonorById);
router.post('/', donorCtrl.createDonor);
router.patch('/:id', donorCtrl.updateDonor);
router.delete('/:id', donorCtrl.deleteDonor);

module.exports = router;
