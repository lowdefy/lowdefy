/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

import toPickedFile from '../basic/toPickedFile.js';

/**
 * The audio device feature (profile field): one voice note at a time (StartRecording,
 * StopRecording). Stop returns the recording as a file with its duration, or null when nothing was
 * recording.
 */
function createAudioFeature() {
  let recorder = null;
  let startedAt = null;
  return {
    async start({ quality = 'high' } = {}) {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission was denied.');
      }
      if (recorder !== null) {
        await recorder.stop();
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      recorder = new AudioModule.AudioRecorder(
        quality === 'low' ? RecordingPresets.LOW_QUALITY : RecordingPresets.HIGH_QUALITY
      );
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt = Date.now();
      return { recording: true };
    },
    async stop({ base64 = false } = {}) {
      if (recorder === null) {
        return null;
      }
      const current = recorder;
      recorder = null;
      await current.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const file = await toPickedFile({
        asset: { mimeType: 'audio/mp4', name: `voice-note-${startedAt}.m4a`, uri: current.uri },
        base64,
      });
      return { ...file, duration: (Date.now() - startedAt) / 1000 };
    },
  };
}

export default createAudioFeature;
