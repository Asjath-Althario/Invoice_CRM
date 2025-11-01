const express = require('express');
const router = express.Router();
const pettyCashController = require('../controllers/pettyCashController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', pettyCashController.getAllPettyCashTransactions);
router.get('/:id', pettyCashController.getPettyCashTransactionById);
router.post('/', pettyCashController.createPettyCashTransaction);
router.put('/:id', pettyCashController.updatePettyCashTransaction);
router.delete('/:id', pettyCashController.deletePettyCashTransaction);

module.exports = router;