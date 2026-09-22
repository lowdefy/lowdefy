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

import { useEffect, useRef } from 'react';
import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

function validateInterval({ blockId, interval }) {
  if (!type.isInt(interval) || interval < 1) {
    throw new Error(
      `PollingTimer ${blockId} "interval" should be a positive integer of milliseconds. Received ${JSON.stringify(
        interval
      )}.`
    );
  }
  return interval;
}

// Headless timer: renders nothing and fires onTick every "interval" ms while running.
// Typically used to poll a request until a background job completes.
const PollingTimer = ({ blockId, methods, properties }) => {
  const timerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const runningRef = useRef(false);
  const tickRef = useRef(0);
  // Methods are registered once, so property changes are read through a ref.
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;

  function hiddenAndPaused() {
    if (propertiesRef.current.pauseWhenHidden === false) return false;
    return document.visibilityState === 'hidden';
  }

  function clearTimer() {
    if (timerRef.current === null) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function stop() {
    runningRef.current = false;
    clearTimer();
  }

  function onTick() {
    tickRef.current += 1;
    methods.triggerEvent({ name: 'onTick', event: { tick: tickRef.current } });
    const { maxTicks } = propertiesRef.current;
    if (type.isInt(maxTicks) && tickRef.current >= maxTicks) {
      stop();
    }
  }

  function startTimer() {
    const interval = validateInterval({ blockId, interval: propertiesRef.current.interval });
    if (timerRef.current !== null) return;
    if (hiddenAndPaused()) return;
    timerIntervalRef.current = interval;
    timerRef.current = setInterval(onTick, interval);
  }

  function start() {
    if (runningRef.current) return;
    tickRef.current = 0;
    // An invalid interval throws out of startTimer, leaving the timer stopped.
    startTimer();
    runningRef.current = true;
  }

  function toggle() {
    if (runningRef.current) {
      stop();
      return;
    }
    start();
  }

  function onVisibilityChange() {
    if (!runningRef.current) return;
    if (hiddenAndPaused()) {
      clearTimer();
      return;
    }
    startTimer();
  }

  useEffect(() => {
    methods.registerMethod('start', start);
    methods.registerMethod('stop', stop);
    methods.registerMethod('toggle', toggle);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (properties.autoStart === true) {
      start();
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stop();
    };
  }, []);

  useEffect(() => {
    if (!runningRef.current) return;
    if (timerIntervalRef.current === properties.interval) return;
    clearTimer();
    startTimer();
  }, [properties.interval]);

  return null;
};

export default withBlockDefaults(PollingTimer);
