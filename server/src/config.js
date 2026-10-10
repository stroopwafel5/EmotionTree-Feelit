/**
 * config.js
 * --------------------------------------------------------------------------
 * All server settings in one place. Each one can be changed with an
 * environment variable, e.g.  PORT=9000 npm start
 *
 *  PORT            Port to listen on.                     Default 8787
 *  PUBLIC_URL      Address used in email links.           Default http://localhost:8787
 *  DATA_DIR        Folder for the database + voice clips. Default server/data
 *  RESEND_API_KEY  If set, real emails are sent with Resend (https://resend.com).
 *                  If NOT set, the server is in TEST MODE: emails are not sent,
 *                  they appear in the test mailbox at  PUBLIC_URL/dev/mail
 *  MAIL_FROM       Sender address for real emails, e.g. "Emotion Tree <hello@yourdomain.com>"
 *  ADMIN_KEY       Secret for adding school accounts. In test mode it is
 *                  "dev-admin-key" unless you set your own.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Builds the settings (tests pass their own overrides). */
export function loadConfig(overrides = {}) {
  const env = process.env;
  const port = Number(overrides.port ?? env.PORT ?? 8787);
  const resendApiKey = overrides.resendApiKey ?? env.RESEND_API_KEY ?? '';
  const testMode = !resendApiKey;
  return {
    port,
    publicUrl: (overrides.publicUrl ?? env.PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/$/, ''),
    dataDir: overrides.dataDir ?? env.DATA_DIR ?? path.join(here, '..', 'data'),
    // Where the app's content files are (phrases, feelings, looks).
    contentDir: overrides.contentDir ?? path.join(here, '..', '..', 'src', 'data'),
    resendApiKey,
    mailFrom: overrides.mailFrom ?? env.MAIL_FROM ?? 'Emotion Tree <onboarding@resend.dev>',
    adminKey: overrides.adminKey ?? env.ADMIN_KEY ?? (testMode ? 'dev-admin-key' : ''),
    testMode,
    // Tests turn off the "📧 [test mailbox]" lines in the terminal.
    quiet: overrides.quiet ?? false,
    // Limits
    maxTextLength: 200,
    maxVoiceBytes: 1_500_000, // about 60 seconds of voice
    maxVoiceSeconds: 60,
    linkLifetimeMs: 7 * 24 * 60 * 60 * 1000, // email links work for 7 days
    parentSessionMs: 7 * 24 * 60 * 60 * 1000,
  };
}
