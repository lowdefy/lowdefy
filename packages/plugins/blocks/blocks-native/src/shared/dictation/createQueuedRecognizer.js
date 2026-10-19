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

import pickRecognitionLocale from './pickRecognitionLocale.js';

const STEP_MS = 150;
// A level for each step, so the meter moves while a transcript plays.
const VOLUMES = [2, 6, 9, 4, 7, 3];

function result({ transcript, isFinal }) {
  return { isFinal, results: [{ transcript, confidence: isFinal ? 1 : 0, segments: [] }] };
}

/**
 * The recogniser Lowdefy Dev gives dictation: it plays what Lowdefy Dev was told the next
 * dictation session hears, so agents and journeys can dictate without a microphone, and uses the
 * phone's recogniser when nothing was injected, as every device action does. It has the module's
 * surface useDictation and checkDictationAvailable use.
 *
 * The permission prompt takes the next injected session, since useDictation asks before each
 * start. `read('transcript')` gives it: `{ partials?: string[], final: string }` plays each
 * partial, then the final, a step apart, then ends; `{ error }` ends with that error
 * (`not-allowed` shows as refused). `stop()` delivers the final at once and ends; `abort()` ends
 * as `aborted`. `read('permission:microphone')` answers the prompt when injected. Otherwise a
 * played session is granted, since it records nothing, and a session with nothing injected asks
 * the phone and listens on its microphone.
 *
 * Dictation shows wherever Lowdefy Dev runs, a simulator without on-device recognition included,
 * so a transcript can always be injected.
 *
 * @param {Object} params
 * @param {Object} params.device expo-speech-recognition's module.
 * @param {(name: string) => any} params.read Reads an injection, as the shell's `injected` does.
 * @returns {Object} The recogniser.
 */
function createQueuedRecognizer({ device, read }) {
  const listeners = new Map();
  let next;
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

  function play(transcript) {
    const current = { final: null, timers: [] };
    session = current;
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

  function start(options) {
    const transcript = next ?? read('transcript');
    next = undefined;
    if (transcript === undefined) {
      device.start(options);
      return;
    }
    play(transcript);
  }

  function stop() {
    const current = session;
    if (current === null) {
      device.stop();
      return;
    }
    current.timers.forEach(clearTimeout);
    if (current.final !== null) {
      emit('result', result({ transcript: current.final, isFinal: true }));
    }
    end(current);
  }

  function abort() {
    const current = session;
    if (current === null) {
      device.abort();
      return;
    }
    current.timers.forEach(clearTimeout);
    emit('error', { error: 'aborted', message: 'Speech recognition aborted.' });
    end(current);
  }

  async function getSupportedLocales(options) {
    // Android throws when its on-device service is missing, as on many emulators; a transcript can
    // still be injected there.
    const { installedLocales } = await device
      .getSupportedLocales(options)
      .catch(() => ({ installedLocales: [] }));
    const phone = Intl.DateTimeFormat().resolvedOptions().locale;
    const installed =
      pickRecognitionLocale({ lang: phone, locales: installedLocales }) === null
        ? [...installedLocales, phone]
        : installedLocales;
    return { locales: installed, installedLocales: installed };
  }

  async function requestPermissionsAsync() {
    next = read('transcript');
    const answer = read('permission:microphone');
    if (answer === undefined && next === undefined) {
      return device.requestPermissionsAsync();
    }
    const granted = answer !== 'denied';
    return { granted, status: granted ? 'granted' : 'denied' };
  }

  return {
    abort,
    addListener(name, listener) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(listener);
      const fromDevice = device.addListener(name, listener);
      return {
        remove: () => {
          listeners.get(name).delete(listener);
          fromDevice.remove();
        },
      };
    },
    getSupportedLocales,
    isRecognitionAvailable: () => true,
    requestPermissionsAsync,
    start,
    stop,
    supportsOnDeviceRecognition: () => true,
  };
}

export default createQueuedRecognizer;
