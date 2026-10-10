/**
 * Stand-in for react-native-nitro-sound in the unit tests (the real one
 * records and plays sound on a phone).
 */
const Sound = {
  startRecorder: jest.fn(async () => 'file:///recording.mp4'),
  stopRecorder: jest.fn(async () => 'file:///recording.mp4'),
  startPlayer: jest.fn(async () => 'playing'),
  stopPlayer: jest.fn(async () => 'stopped'),
  addPlaybackEndListener: jest.fn(),
  removePlaybackEndListener: jest.fn(),
};

module.exports = { __esModule: true, default: Sound };
