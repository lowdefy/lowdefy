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

import validateInterval from './validateInterval.js';

// Headless timer: renders nothing and fires onTick while running. Typically used to poll a
// request until a background job completes. Each tick is scheduled "interval" ms after the
// previous onTick actions finish, so a slow chain never overlaps the next tick.
function PollingTimer({ methods, properties }) {
  // Validated while rendering so an invalid interval reaches the block error boundary, instead
  // of throwing from a timeout or visibility listener where nothing surfaces it.
  validateInterval({ interval: properties.interval });

  const timeoutRef = useRef(null);
  const scheduledIntervalRef = useRef(null);
  const inFlightRef = useRef(false);
  const runningRef = useRef(false);
  const tickRef = useRef(0);
  // Methods are registered once, so property changes are read through a ref.
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;

  function hiddenAndPaused() {
    if (propertiesRef.current.pauseWhenHidden === false) return false;
    return document.visibilityState === 'hidden';
  }

  function clearScheduledTick() {
    if (timeoutRef.current === null) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }

  function scheduleTick() {
    if (!runningRef.current) return;
    if (timeoutRef.current !== null) return;
    // A tick in flight schedules the next one when its onTick actions finish.
    if (inFlightRef.current) return;
    if (hiddenAndPaused()) return;
    const { interval } = propertiesRef.current;
    scheduledIntervalRef.current = interval;
    timeoutRef.current = setTimeout(tick, interval);
  }

  async function tick() {
    timeoutRef.current = null;
    tickRef.current += 1;
    const { maxTicks } = propertiesRef.current;
    if (type.isInt(maxTicks) && tickRef.current >= maxTicks) {
      runningRef.current = false;
    }
    inFlightRef.current = true;
    // The engine resolves triggerEvent once the chain finishes, including when an action fails.
    await methods.triggerEvent({ name: 'onTick', event: { tick: tickRef.current } });
    inFlightRef.current = false;
    scheduleTick();
  }

  function start() {
    if (runningRef.current) return;
    tickRef.current = 0;
    runningRef.current = true;
    scheduleTick();
  }

  function stop() {
    runningRef.current = false;
    clearScheduledTick();
  }

  function toggle() {
    if (runningRef.current) {
      stop();
      return;
    }
    start();
  }

  function onVisibilityChange() {
    if (hiddenAndPaused()) {
      clearScheduledTick();
      return;
    }
    scheduleTick();
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
    if (timeoutRef.current === null) return;
    if (scheduledIntervalRef.current === properties.interval) return;
    clearScheduledTick();
    scheduleTick();
  }, [properties.interval]);

  return null;
}

export default withBlockDefaults(PollingTimer);
