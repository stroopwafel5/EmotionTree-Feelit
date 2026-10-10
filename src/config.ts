/**
 * config.ts
 * --------------------------------------------------------------------------
 * Where the app finds the Friends server (see the server/ folder).
 *
 *  - Android EMULATOR: "10.0.2.2" means "the computer the emulator runs on",
 *    so the default below works when you run `npm start` in server/.
 *  - A REAL PHONE on the same Wi-Fi: change SERVER_URL to your computer's
 *    address, e.g. 'http://192.168.1.23:8787'
 *    (Windows: run `ipconfig`; Mac: System Settings → Wi-Fi → Details).
 *  - When the server is online for real: 'https://your-server.com'
 */
import { Platform } from 'react-native';

// (Only the browser test preview sets this; on phones it is undefined.)
const testServer = (globalThis as { EMOTION_TREE_SERVER_URL?: string })
  .EMOTION_TREE_SERVER_URL;

export const SERVER_URL =
  testServer ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787');

/** How often an open chat checks for new messages (milliseconds). */
export const CHAT_REFRESH_MS = 3000;

/** How often the friends list checks for news (milliseconds). */
export const FRIENDS_REFRESH_MS = 8000;

/** Longest voice message (seconds). The server allows 60 too. */
export const MAX_VOICE_SECONDS = 60;
