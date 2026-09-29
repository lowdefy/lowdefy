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

import { useEffect, useRef, useState } from 'react';

import getSkeletonPhase from './getSkeletonPhase.js';

// Loading start times by block id. The lazy block's fallback and the table that replaces it are
// different components; the table picks up the fallback's start time, so a skeleton that is
// already showing stays, and its minimum time counts from when it first appeared.
const startTimes = new Map();

// getSkeletonPhase across renders for a table that is `active` (loading with no rows). One timer
// re-renders the table when the phase ends by itself. `handoff` (the fallback) keeps the start
// time on unmount for the component that follows.
function useSkeletonTiming({ active, id, handoff = false }) {
  const [, setTick] = useState(0);
  const startRef = useRef(undefined);
  if (startRef.current === undefined) startRef.current = startTimes.get(id) ?? null;
  if (active && startRef.current === null) startRef.current = performance.now();
  const { phase, until } = getSkeletonPhase({
    active,
    startedAt: startRef.current,
    now: performance.now(),
  });
  if (phase === 'idle') startRef.current = null;

  useEffect(() => {
    if (startRef.current === null) {
      startTimes.delete(id);
    } else {
      startTimes.set(id, startRef.current);
    }
  });
  useEffect(() => {
    if (until === null) return undefined;
    const timer = setTimeout(() => setTick((tick) => tick + 1), until - performance.now());
    return () => clearTimeout(timer);
  }, [phase, until]);
  useEffect(
    () => () => {
      if (!handoff) startTimes.delete(id);
    },
    [id]
  );
  return phase;
}

export default useSkeletonTiming;
