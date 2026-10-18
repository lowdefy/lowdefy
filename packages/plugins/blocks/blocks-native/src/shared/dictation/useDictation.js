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

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import checkDictationAvailable from './checkDictationAvailable.js';
import claimMic from './claimMic.js';
import getDictationLevel from './getDictationLevel.js';
import getDictationWarning from './getDictationWarning.js';
import getRecognizer from './getRecognizer.js';
import getStartOptions from './getStartOptions.js';

const FINISH_MS = 1500;
const SILENCE_MS = 20000;

function settle(session) {
  const waiters = session.waiters;
  session.waiters = [];
  waiters.forEach((resolve) => resolve());
}

/**
 * Dictation into a native input, on the phone only. The hook owns the recogniser (getRecognizer:
 * the phone's, or the one playing Lowdefy Dev's injected transcripts): whether it can run, the
 * permission prompts, the start options, the input level, the silence timer, ending on
 * background and unmount, the error warning and the one session the app can run at a time. It
 * holds none of the host's text: it reports words still being heard as `partial` and hands each
 * final result to `onFinal`, and the host puts both where they belong.
 *
 * A session ends on its own after 20 s without words, when the app goes to the background and when
 * another input starts the mic. Those keep the words heard so far, as `stop()` does. `cancel()`
 * drops them, and so does unmounting the host, since nothing is left to take them.
 *
 * @param {Object} params
 * @param {boolean} [params.disabled] While true, `available` is false and `start` does nothing.
 * @param {string[]} [params.hints] Words to expect, such as the names that can be mentioned.
 * @param {(text: string) => void} params.onFinal Called once for each final result: once at stop
 *   on iOS, and for each segment as it is heard on Android.
 * @returns {{
 *   available: boolean,
 *   status: 'idle'|'listening'|'stopping',
 *   level: number,
 *   partial: string,
 *   warning: 'denied'|'failed'|null,
 *   start: () => Promise<void>,
 *   stop: () => void,
 *   cancel: () => void,
 *   finish: () => Promise<void>,
 *   clearWarning: () => void,
 * }} `level` runs from 0 to 1. `finish` stops and resolves once the final result is committed, or
 *   after 1.5 s.
 */
function useDictation({ disabled = false, hints, onFinal }) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState('idle');
  const [level, setLevel] = useState(0);
  const [partial, setPartial] = useState('');
  const [warning, setWarning] = useState(null);

  const sessionRef = useRef(null);
  const langRef = useRef(null);
  const latest = useRef({ hints, onFinal });
  latest.current = { hints, onFinal };
  const available = supported && !disabled;

  useEffect(() => {
    let mounted = true;
    checkDictationAvailable().then((result) => {
      if (!mounted) return;
      langRef.current = result.lang;
      setSupported(result.available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const endSession = useCallback((session) => {
    clearTimeout(session.silence);
    if (!session.cancelled && session.partial !== '') {
      latest.current.onFinal(session.partial);
    }
    sessionRef.current = null;
    session.mic?.release();
    settle(session);
    setStatus('idle');
    setLevel(0);
    setPartial('');
  }, []);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (session === null || session.stopping) return;
    if (session.mic === null) {
      // Still waiting on the permission prompt or the mic: nothing has been heard yet.
      session.cancelled = true;
      endSession(session);
      return;
    }
    session.stopping = true;
    clearTimeout(session.silence);
    setStatus('stopping');
    getRecognizer().stop();
  }, [endSession]);

  const stopRef = useRef(stop);
  stopRef.current = stop;

  const resetSilence = useCallback((session) => {
    clearTimeout(session.silence);
    if (session.stopping) return;
    session.silence = setTimeout(() => stopRef.current(), SILENCE_MS);
  }, []);

  const cancel = useCallback(() => {
    const session = sessionRef.current;
    if (session === null) return;
    session.cancelled = true;
    session.partial = '';
    setPartial('');
    if (session.mic === null) {
      endSession(session);
      return;
    }
    getRecognizer().abort();
  }, [endSession]);

  const finish = useCallback(() => {
    const session = sessionRef.current;
    if (session === null) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const timer = setTimeout(done, FINISH_MS);
      function done() {
        clearTimeout(timer);
        resolve();
      }
      session.waiters.push(done);
      stop();
    });
  }, [stop]);

  const start = useCallback(async () => {
    if (!available || sessionRef.current !== null) return;
    const session = {
      cancelled: false,
      mic: null,
      partial: '',
      silence: null,
      stopping: false,
      waiters: [],
    };
    sessionRef.current = session;
    setWarning(null);
    const permission = await getRecognizer().requestPermissionsAsync();
    if (sessionRef.current !== session) return;
    if (permission.granted !== true) {
      session.cancelled = true;
      endSession(session);
      setWarning('denied');
      return;
    }
    const mic = await claimMic({ end: () => stopRef.current() });
    if (mic === null) {
      if (sessionRef.current === session) endSession(session);
      return;
    }
    if (sessionRef.current !== session) {
      mic.release();
      return;
    }
    session.mic = mic;
    setPartial('');
    setLevel(0);
    setStatus('listening');
    resetSilence(session);
    getRecognizer().start(getStartOptions({ hints: latest.current.hints, lang: langRef.current }));
  }, [available, endSession, resetSilence]);

  const clearWarning = useCallback(() => setWarning(null), []);

  useEffect(() => {
    function ownSession() {
      const session = sessionRef.current;
      if (session === null || session.mic === null || !session.mic.owns()) return null;
      return session;
    }
    const recognizer = getRecognizer();
    const subscriptions = [
      recognizer.addListener('result', (event) => {
        const session = ownSession();
        if (session === null) return;
        resetSilence(session);
        const text = event.results[0]?.transcript ?? '';
        if (!event.isFinal) {
          if (session.cancelled) return;
          session.partial = text;
          setPartial(text);
          return;
        }
        session.partial = '';
        setPartial('');
        if (!session.cancelled && text !== '') {
          latest.current.onFinal(text);
        }
        if (session.stopping) {
          settle(session);
        }
      }),
      recognizer.addListener('speechstart', () => {
        const session = ownSession();
        if (session !== null) resetSilence(session);
      }),
      recognizer.addListener('volumechange', (event) => {
        if (ownSession() !== null) setLevel(getDictationLevel({ value: event.value }));
      }),
      recognizer.addListener('error', (event) => {
        if (ownSession() === null) return;
        const next = getDictationWarning({ error: event.error });
        if (next !== null) setWarning(next);
      }),
      recognizer.addListener('end', () => {
        const session = ownSession();
        if (session !== null) endSession(session);
      }),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [endSession, resetSilence]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') stopRef.current();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session === null) return;
      sessionRef.current = null;
      clearTimeout(session.silence);
      settle(session);
      if (session.mic === null) return;
      // The host is gone, so nothing can take the words: drop them. The mic is free once the
      // aborted session's own end event arrives, so its late events reach no other input.
      const mic = session.mic;
      const recognizer = getRecognizer();
      const ended = recognizer.addListener('end', () => {
        ended.remove();
        mic.release();
      });
      recognizer.abort();
    };
  }, []);

  return { available, status, level, partial, warning, start, stop, cancel, finish, clearWarning };
}

export default useDictation;
