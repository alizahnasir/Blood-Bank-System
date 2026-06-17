const express = require('express');
const router = express.Router();
const requestCtrl = require('../controllers/requestController');

router.get('/', requestCtrl.getAllRequests);
router.get('/:id', requestCtrl.getRequestById);
router.post('/', requestCtrl.createRequest);
router.patch('/:id/fulfill', requestCtrl.fulfillRequest);
router.patch('/:id/cancel', requestCtrl.cancelRequest);

module.exports = router;
