/**
 * mail.js
 * --------------------------------------------------------------------------
 * Sends emails.
 *
 *  TEST MODE (no RESEND_API_KEY): emails are NOT sent. They are kept in the
 *  database and shown in the test mailbox at  /dev/mail  so you can click
 *  the links yourself (playing the parents and the school). The link is
 *  also printed in the terminal.
 *
 *  REAL MODE (RESEND_API_KEY set): emails are sent through Resend
 *  (https://resend.com - free plan available). Any other email service with
 *  an HTTP API works too: change sendReal() below.
 */
export class Mailer {
  constructor(config, store) {
    this.config = config;
    this.store = store;
  }

  /**
   * Sends one email.
   * @param {{to: string, subject: string, html: string, text: string}} mail
   */
  async send(mail) {
    if (this.config.testMode) {
      const id = this.store.nextId('mail');
      this.store.db.outbox = this.store.db.outbox ?? [];
      this.store.db.outbox.push({ id, ...mail, sentAt: new Date().toISOString() });
      this.store.save();
      if (!this.config.quiet) {
        console.log(`📧 [test mailbox] to ${mail.to}: "${mail.subject}"  →  ${this.config.publicUrl}/dev/mail`);
      }
      return;
    }
    // Sent in the background: the app never waits for the email service,
    // and a problem with it can't break the request.
    this.sendReal(mail).catch(error => console.error('Email failed:', error.message));
  }

  /** Sends through the Resend HTTP API. */
  async sendReal(mail) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.config.mailFrom,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    if (!response.ok) {
      console.error('Email failed:', response.status, await response.text());
    }
  }
}
