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
import { Platform } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import { captureRef } from 'react-native-view-shot';

import createDevTabClient from './createDevTabClient.js';
import createNativeRecorder from '../recorder/createNativeRecorder.js';
import createStepRunner from '../steps/createStepRunner.js';
import reloadApp from './reloadApp.js';
import withShellHeader from '../../host/withShellHeader.js';
import { useShell } from '../../ShellContext.js';

/**
 * Joins the dev server's tab channel for the app that is open (createDevTabClient), records what
 * the developer does in it (createNativeRecorder), and tells Lowdefy Dev which app that is through
 * onApp, so the shake menu can reload it or clear its data. Rendered inside the app's provider;
 * draws nothing.
 *
 * @param {Object} props
 * @param {Object} props.injections The device injections (createDeviceInjections).
 * @param {Object} props.kv The device store.
 * @param {Object} props.logs The log buffer (createLogBuffer).
 * @param {(app: Object|null) => void} props.onApp
 * @param {{ current: Object }} props.rootRef The view the whole app is drawn in, for screenshots.
 */
function DevTabClient({ injections, kv, logs, onApp, rootRef }) {
  const app = useShell();
  const { session, shell } = app;

  useEffect(() => {
    onApp(app);
    return () => onApp(null);
  }, [app, onApp]);

  useEffect(() => {
    const getLowdefy = () => session.getState().lowdefy;
    const withHeaders = (fetch) =>
      withShellHeader({ fetch: shell.transport.wrapFetch(fetch), shellVersion: shell.version });
    const runner = createStepRunner({
      capture: () => captureRef(rootRef, { format: 'png', result: 'base64' }),
      getLowdefy,
    });
    const fetch = withHeaders(globalThis.fetch);
    const recorder = createNativeRecorder({
      apiBase: session.apiBase,
      device: Platform.OS,
      fetch,
      getBuild: () => session.getState().buildId ?? null,
      getLowdefy,
      kv,
      shellVersion: shell.version,
    });
    const client = createDevTabClient({
      apiBase: session.apiBase,
      fetch,
      getLowdefy,
      log: (message) => logs.add('info', message),
      onInject: ({ injection }) => injections.inject(injection ?? {}),
      onReload: async () => {
        await recorder.flush();
        await reloadApp({ session });
      },
      onStep: ({ step }) => runner.run({ step }),
      streamFetch: withHeaders(expoFetch),
    });
    recorder.start();
    client.start();
    return () => {
      client.stop();
      recorder.stop();
    };
  }, [injections, kv, logs, rootRef, session, shell]);

  return null;
}

export default DevTabClient;
