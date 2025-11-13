const cron = require('node-cron');
const subscriptionService = require('./subscriptionService');

class CronJobService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all cron jobs
   */
  start() {
    console.log('[CronJobService] Starting cron jobs...');

    // Daily at 8:00 AM - Process subscriptions and generate invoices
    const dailySubscriptionJob = cron.schedule('0 8 * * *', async () => {
      console.log('[CronJob] Running daily subscription processing...');
      try {
        await subscriptionService.processSubscriptions(3); // 3 days before due date
        console.log('[CronJob] Daily subscription processing completed');
      } catch (error) {
        console.error('[CronJob] Error in daily subscription processing:', error);
      }
    });

    this.jobs.push({ name: 'Daily Subscription Processing', job: dailySubscriptionJob });

    // Daily at 9:00 AM - Send reminders for invoices due in 7 days
    const weeklyReminderJob = cron.schedule('0 9 * * *', async () => {
      console.log('[CronJob] Running weekly invoice reminders...');
      try {
        await subscriptionService.sendUpcomingInvoiceReminders(7);
        console.log('[CronJob] Weekly reminders sent');
      } catch (error) {
        console.error('[CronJob] Error sending weekly reminders:', error);
      }
    });

    this.jobs.push({ name: 'Weekly Invoice Reminders', job: weeklyReminderJob });

    // Daily at 10:00 AM - Send reminders for invoices due in 3 days
    const finalReminderJob = cron.schedule('0 10 * * *', async () => {
      console.log('[CronJob] Running final invoice reminders...');
      try {
        await subscriptionService.sendUpcomingInvoiceReminders(3);
        console.log('[CronJob] Final reminders sent');
      } catch (error) {
        console.error('[CronJob] Error sending final reminders:', error);
      }
    });

    this.jobs.push({ name: 'Final Invoice Reminders', job: finalReminderJob });

    // Daily at 11:00 AM - Send reminders for invoices due tomorrow
    const tomorrowReminderJob = cron.schedule('0 11 * * *', async () => {
      console.log('[CronJob] Running tomorrow invoice reminders...');
      try {
        await subscriptionService.sendUpcomingInvoiceReminders(1);
        console.log('[CronJob] Tomorrow reminders sent');
      } catch (error) {
        console.error('[CronJob] Error sending tomorrow reminders:', error);
      }
    });

    this.jobs.push({ name: 'Tomorrow Invoice Reminders', job: tomorrowReminderJob });

    console.log(`[CronJobService] ${this.jobs.length} cron jobs started successfully`);
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    console.log('[CronJobService] Stopping all cron jobs...');
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`[CronJobService] Stopped: ${name}`);
    });
    this.jobs = [];
  }

  /**
   * Get status of all cron jobs
   */
  getStatus() {
    return this.jobs.map(({ name, job }) => ({
      name,
      running: job.running || false
    }));
  }
}

module.exports = new CronJobService();
