const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');

class SubscriptionService {
  /**
   * Calculate the next invoice date based on frequency
   */
  calculateNextInvoiceDate(startDate, frequency, occurrenceCount = 1) {
    const date = new Date(startDate);
    
    switch (frequency) {
      case 'Daily':
        date.setDate(date.getDate() + occurrenceCount);
        break;
      case 'Weekly':
        date.setDate(date.getDate() + (7 * occurrenceCount));
        break;
      case 'Monthly':
        date.setMonth(date.getMonth() + occurrenceCount);
        break;
      case 'Yearly':
        date.setFullYear(date.getFullYear() + occurrenceCount);
        break;
    }
    
    return date;
  }

  /**
   * Get days until next invoice
   */
  getDaysUntilInvoice(nextInvoiceDate) {
    const today = new Date();
    const next = new Date(nextInvoiceDate);
    const diffTime = next - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check and generate invoices for active subscriptions
   * This should be run daily via cron job
   */
  async processSubscriptions(daysBeforeDue = 3) {
    console.log(`[SubscriptionService] Processing subscriptions - checking ${daysBeforeDue} days before due...`);
    
    try {
      // Get all active recurring invoices
      const [subscriptions] = await db.query(`
        SELECT r.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
        FROM recurring_invoices r
        LEFT JOIN contacts c ON r.contact_id = c.id
        WHERE r.status = 'Active'
      `);

      console.log(`[SubscriptionService] Found ${subscriptions.length} active subscriptions`);

      for (const subscription of subscriptions) {
        try {
          await this.processSubscription(subscription, daysBeforeDue);
        } catch (error) {
          console.error(`[SubscriptionService] Error processing subscription ${subscription.id}:`, error);
        }
      }

      console.log('[SubscriptionService] Subscription processing completed');
    } catch (error) {
      console.error('[SubscriptionService] Error in processSubscriptions:', error);
      throw error;
    }
  }

  /**
   * Process a single subscription
   */
  async processSubscription(subscription, daysBeforeDue) {
    console.log(`[SubscriptionService] Processing subscription ${subscription.id} for ${subscription.contact_name}`);

    // Check if subscription has ended
    if (subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const today = new Date();
      if (today > endDate) {
        console.log(`[SubscriptionService] Subscription ${subscription.id} has ended. Marking as Finished.`);
        await db.query(
          'UPDATE recurring_invoices SET status = ? WHERE id = ?',
          ['Finished', subscription.id]
        );
        return;
      }
    }

    // Get the last generated invoice for this subscription
    const [lastInvoices] = await db.query(`
      SELECT * FROM invoices 
      WHERE comments LIKE ? 
      ORDER BY issue_date DESC 
      LIMIT 1
    `, [`%Subscription #${subscription.id}%`]);

    // Calculate next invoice date
    let nextInvoiceDate;
    if (lastInvoices.length > 0) {
      // Calculate based on last invoice
      nextInvoiceDate = this.calculateNextInvoiceDate(
        lastInvoices[0].issue_date,
        subscription.frequency,
        1
      );
    } else {
      // First invoice - use start date
      nextInvoiceDate = new Date(subscription.start_date);
    }

    const daysUntil = this.getDaysUntilInvoice(nextInvoiceDate);
    console.log(`[SubscriptionService] Next invoice date: ${nextInvoiceDate.toISOString().split('T')[0]}, Days until: ${daysUntil}`);

    // Generate invoice if within the threshold
    if (daysUntil <= daysBeforeDue && daysUntil >= 0) {
      console.log(`[SubscriptionService] Generating invoice for subscription ${subscription.id}`);
      const invoice = await this.generateInvoiceFromSubscription(subscription, nextInvoiceDate);
      
      // Send notifications
      await this.sendInvoiceNotifications(subscription, invoice);
    } else if (daysUntil < 0) {
      console.log(`[SubscriptionService] WARNING: Subscription ${subscription.id} has a past due invoice!`);
    }
  }

  /**
   * Generate an invoice from a subscription
   */
  async generateInvoiceFromSubscription(subscription, issueDate) {
    console.log(`[SubscriptionService] Creating invoice for subscription ${subscription.id}`);

    const invoiceId = uuidv4();
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Format dates
    const formattedIssueDate = issueDate.toISOString().split('T')[0];
    const dueDate = this.calculateNextInvoiceDate(issueDate, subscription.frequency, 0);
    dueDate.setDate(dueDate.getDate() + 7); // 7 days payment term
    const formattedDueDate = dueDate.toISOString().split('T')[0];

    // Get subscription items
    const [items] = await db.query(`
      SELECT * FROM recurring_invoice_items WHERE recurring_invoice_id = ?
    `, [subscription.id]);

    // Create invoice
    await db.query(
      'INSERT INTO invoices (id, invoice_number, contact_id, issue_date, due_date, subtotal, tax_amount, total_amount, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        invoiceId,
        invoiceNumber,
        subscription.contact_id,
        formattedIssueDate,
        formattedDueDate,
        subscription.subtotal,
        subscription.tax_amount,
        subscription.total_amount,
        `Auto-generated from Subscription #${subscription.id}. ${subscription.notes || ''}`,
        'Draft'
      ]
    );

    // Create invoice items
    for (const item of items) {
      await db.query(
        'INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), invoiceId, item.product_id, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    console.log(`[SubscriptionService] Invoice ${invoiceNumber} created successfully`);

    return {
      id: invoiceId,
      invoice_number: invoiceNumber,
      issue_date: formattedIssueDate,
      due_date: formattedDueDate,
      total: subscription.total_amount
    };
  }

  /**
   * Send email and WhatsApp notifications for new invoice
   */
  async sendInvoiceNotifications(subscription, invoice) {
    console.log(`[SubscriptionService] Sending notifications for invoice ${invoice.invoice_number}`);

    try {
      // Send email notification
      if (subscription.contact_email) {
        await emailService.sendInvoiceEmail(
          subscription.contact_email,
          subscription.contact_name,
          invoice
        );
        console.log(`[SubscriptionService] Email sent to ${subscription.contact_email}`);
      }

      // Send WhatsApp notification
      if (subscription.contact_phone) {
        await whatsappService.sendInvoiceAlert(
          subscription.contact_phone,
          subscription.contact_name,
          invoice
        );
        console.log(`[SubscriptionService] WhatsApp alert sent to ${subscription.contact_phone}`);
      }
    } catch (error) {
      console.error(`[SubscriptionService] Error sending notifications:`, error);
      // Don't throw - we still want to continue processing other subscriptions
    }
  }

  /**
   * Send reminder for upcoming invoices
   */
  async sendUpcomingInvoiceReminders(daysAhead = 7) {
    console.log(`[SubscriptionService] Sending reminders for invoices due in ${daysAhead} days`);

    const [invoices] = await db.query(`
      SELECT i.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.status IN ('Draft', 'Sent')
      AND DATEDIFF(i.due_date, CURDATE()) = ?
    `, [daysAhead]);

    for (const invoice of invoices) {
      try {
        if (invoice.contact_email) {
          await emailService.sendInvoiceReminder(
            invoice.contact_email,
            invoice.contact_name,
            invoice
          );
        }

        if (invoice.contact_phone) {
          await whatsappService.sendPaymentReminder(
            invoice.contact_phone,
            invoice.contact_name,
            invoice
          );
        }
      } catch (error) {
        console.error(`[SubscriptionService] Error sending reminder for invoice ${invoice.id}:`, error);
      }
    }
  }
}

module.exports = new SubscriptionService();
