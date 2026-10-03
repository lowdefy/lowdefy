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

import { useContext, useEffect, useRef } from 'react';
import { getTrace } from '@lowdefy/engine';

import createRecorder from './recorder/createRecorder.js';
import DevStreamContext from './DevStreamContext.js';

// Dev-only journey recorder: records how the developer uses the app, locally,
// so an agent can turn what they tried into journeys (see recorder/). It
// renders null, like Inspector, and never lets an error reach the app.
//
// It opens no connection of its own: a second long-lived stream per tab once
// exhausted the browser's HTTP/1.1 connection pool (see DevStreamContext.js).
// It listens for `reload` on the tab's one shared stream and flushes there,
// only to send promptly: each record carries the build of the page config it
// was made on (lowdefy._devBuildId, set by Page.jsx).
function Recorder({ basePath, lowdefy, pageId, recording }) {
  const { source } = useContext(DevStreamContext);
  const recorderRef = useRef(null);

  useEffect(() => {
    let recorder = null;
    try {
      recorder = createRecorder({ basePath, lowdefy, recording, window, getTrace });
    } catch {
      return undefined;
    }
    if (recorder === null) return undefined;
    recorderRef.current = recorder;
    return () => {
      recorderRef.current = null;
      try {
        recorder.stop();
      } catch {
        // Best effort.
      }
    };
  }, [recording?.enabled]);

  useEffect(() => {
    recorderRef.current?.pageview(pageId);
  }, [pageId, recording?.enabled]);

  useEffect(() => {
    return recorderRef.current?.attachStream(source);
  }, [source, recording?.enabled]);

  return null;
}

export default Recorder;
