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

const STEP_MS = 150;
// A level for each step, so the meter moves while a transcript plays.
const VOLUMES = [2, 6, 9, 4, 7, 3];

function result({ transcript, isFinal }) {
  return { isFinal, results: [{ transcript, confidence: isFinal ? 1 : 0, segments: [] }] };
}

/**
 * A stand-in for expo-speech-recognition's module that plays what Lowdefy Dev was told the next
 * dictation session hears, so agents and journeys can dictate without a microphone. It has the
 * module's surface useDictation and checkDictationAvailable use.
 *
 * `read('transcript')` gives the next session: `{ partials?: string[], final: string }` plays each
 * partial, then the final, a step apart, then ends; `{ error }` ends with that error (`not-allowed`
 * shows as refused). With nothing queued the session ends as `no-speech`, as a silent one does.
 * `stop()` delivers the final at once and ends; `abort()` ends as `aborted`.
 * `read('permission:microphone')` answers the permission prompt: only "denied" refuses it.
 *
 * @param {Object} params
 * @param {(name: string) => any} params.read Reads an injection, as the shell's `injected` does.
 * @returns {Object} The recogniser.
 */
function createQueuedRecognizer({ read }) {
  const listeners = new Map();
  let session = null;

  function emit(name, event = null) {
    [...(listeners.get(name) ?? [])].forEach((listener) => listener(event));
  }

  function end(current) {
    current.timers.forEach(clearTimeout);
    if (session === current) {
      session = null;
    }
    emit('end');
  }

  function finishWith(current, steps) {
    let at = 0;
    steps.forEach((step) => {
      at += STEP_MS;
      current.timers.push(setTimeout(step, at));
    });
  }

  function start() {
    const transcript = read('transcript');
    const current = { final: null, timers: [] };
    session = current;
    if (transcript === undefined) {
      finishWith(current, [
        () => emit('error', { error: 'no-speech', message: 'No speech was injected.' }),
        () => end(current),
      ]);
      return;
    }
    if (transcript.error !== undefined) {
      finishWith(current, [
        () => emit('error', { error: transcript.error, message: 'Injected error.' }),
        () => end(current),
      ]);
      return;
    }
    current.final = transcript.final;
    const steps = [() => emit('start'), () => emit('speechstart')];
    (transcript.partials ?? []).forEach((partial, index) => {
      steps.push(() => {
        emit('volumechange', { value: VOLUMES[index % VOLUMES.length] });
        emit('result', result({ transcript: partial, isFinal: false }));
      });
    });
    steps.push(() => {
      current.final = null;
      emit('result', result({ transcript: transcript.final, isFinal: true }));
    });
    steps.push(() => end(current));
    finishWith(current, steps);
  }

  function stop() {
    const current = session;
    if (current === null) return;
    current.timers.forEach(clearTimeout);
    if (current.final !== null) {
      emit('result', result({ transcript: current.final, isFinal: true }));
    }
    end(current);
  }

  function abort() {
    const current = session;
    if (current === null) return;
    current.timers.forEach(clearTimeout);
    emit('error', { error: 'aborted', message: 'Speech recognition aborted.' });
    end(current);
  }

  return {
    abort,
    addListener(name, listener) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(listener);
      return { remove: () => listeners.get(name).delete(listener) };
    },
    getSupportedLocales: async () => {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      return { locales: [locale], installedLocales: [locale] };
    },
    isRecognitionAvailable: () => true,
    requestPermissionsAsync: async () => {
      const granted = read('permission:microphone') !== 'denied';
      return { granted, status: granted ? 'granted' : 'denied' };
    },
    start,
    stop,
    supportsOnDeviceRecognition: () => true,
  };
}

export default createQueuedRecognizer;
