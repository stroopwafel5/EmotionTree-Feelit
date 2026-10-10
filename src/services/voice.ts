/**
 * voice.ts
 * --------------------------------------------------------------------------
 * Records and plays voice messages, using react-native-nitro-sound.
 * On Android the recording is an .mp4 (AAC) sound file.
 *
 * Voice messages only appear in a chat when the parents turned them on.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import Sound from 'react-native-nitro-sound';

let startedAt = 0;

/** Asks for the microphone (Android shows its own "Allow?" question). */
export async function askForMicrophone(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone',
      message: 'Emotion Tree needs the microphone to record voice messages.',
      buttonPositive: 'OK',
      buttonNegative: 'Not now',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** Starts recording. */
export async function startRecording(): Promise<void> {
  startedAt = Date.now();
  await Sound.startRecorder();
}

/** Stops recording. Returns the sound file and how long it is. */
export async function stopRecording(): Promise<{ uri: string; seconds: number }> {
  const uri = await Sound.stopRecorder();
  const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  return { uri, seconds };
}

/** Plays a voice message from the server. `onEnd` runs when it finishes. */
export async function playVoice(
  url: string,
  headers: Record<string, string>,
  onEnd: () => void,
): Promise<void> {
  Sound.removePlaybackEndListener();
  Sound.addPlaybackEndListener(() => onEnd());
  await Sound.startPlayer(url, headers);
}

export async function stopVoice(): Promise<void> {
  await Sound.stopPlayer();
}
