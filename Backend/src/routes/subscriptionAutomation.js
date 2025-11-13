const express = require('express');
const subscriptionService = require('../services/subscriptionService');
const cronJobService = require('../services/cronJobService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Manually trigger subscription processing
router.post('/process-subscriptions', authMiddleware, async (req, res) => {
  try {
    const { daysBeforeDue } = req.body;
    await subscriptionService.processSubscriptions(daysBeforeDue || 3);
    res.json({ 
      message: 'Subscription processing completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual subscription processing error:', error);
    res.status(500).json({ message: 'Error processing subscriptions', error: error.message });
  }
});

// Send reminders manually
router.post('/send-reminders', authMiddleware, async (req, res) => {
  try {
    const { daysAhead } = req.body;
    await subscriptionService.sendUpcomingInvoiceReminders(daysAhead || 7);
    res.json({ 
      message: 'Reminders sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual reminder sending error:', error);
    res.status(500).json({ message: 'Error sending reminders', error: error.message });
  }
});

// Get cron job status
router.get('/cron-status', authMiddleware, (req, res) => {
  try {
    const status = cronJobService.getStatus();
    res.json({ 
      jobs: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get cron status error:', error);
    res.status(500).json({ message: 'Error getting cron status', error: error.message });
  }
});

module.exports = router;
