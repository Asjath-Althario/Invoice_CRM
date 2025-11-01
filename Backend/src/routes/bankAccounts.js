const express = require('express');
const router = express.Router();
const bankAccountController = require('../controllers/bankAccountController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', bankAccountController.getAllBankAccounts);
router.get('/:id', bankAccountController.getBankAccountById);
router.post('/', bankAccountController.createBankAccount);
router.put('/:id', bankAccountController.updateBankAccount);
router.delete('/:id', bankAccountController.deleteBankAccount);

// Transaction routes
router.get('/:accountId/transactions', bankAccountController.getAccountTransactions);
router.post('/:accountId/transactions', bankAccountController.addTransaction);

module.exports = router;