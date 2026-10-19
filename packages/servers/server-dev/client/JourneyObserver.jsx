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

import { useEffect } from 'react';
import { getTrace } from '@lowdefy/engine';

import collectVisibleBlockIds from '../lib/client/collectVisibleBlockIds.js';
import startJourneyObserver from './journeyObserver/startJourneyObserver.js';

// Dev-only: tells the journey runner which events completed and which blocks
// were visible in a journey's own pages (see journeyObserver/). It renders
// null, like Inspector, does nothing in a developer's tab, and never lets an
// error reach the app.
function JourneyObserver({ lowdefy }) {
  useEffect(() => {
    let stop = null;
    try {
      stop = startJourneyObserver({ window, lowdefy, getTrace, collectVisibleBlockIds });
    } catch {
      return undefined;
    }
    return () => {
      try {
        stop?.();
      } catch {
        // Best effort.
      }
    };
  }, [lowdefy]);

  return null;
}

export default JourneyObserver;
