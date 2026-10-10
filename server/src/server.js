/**
 * server.js
 * --------------------------------------------------------------------------
 * Starts the Emotion Tree Friends server:   npm start   (in the server folder)
 */
import { createApp } from './app.js';

const { server, config } = createApp();

server.listen(config.port, () => {
  console.log(`🚀 Emotion Tree server is running on ${config.publicUrl}`);
  console.log(`   Android emulators reach it at http://10.0.2.2:${config.port}`);
  if (config.testMode) {
    console.log('📧 TEST MODE: emails are not sent. Open the test mailbox:');
    console.log(`   ${config.publicUrl}/dev/mail`);
    console.log(`🏫 Add a test school here: ${config.publicUrl}/dev/admin`);
  } else {
    console.log('📧 Real emails are sent with Resend.');
  }
});
