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

import React, { useEffect, useMemo, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import AppPicker from './AppPicker.js';
import AppProvider from './AppProvider.js';
import createDeviceStore from '../host/createDeviceStore.js';
import Frame from './Frame.js';
import getShellConfig from '../config/getShellConfig.js';

const LAST_APP_KEY = 'lowdefy-shell:last-app';

// The shell: one app opens at once; with several, the person picks one each launch, the one opened
// last listed first.
function ShellRoot() {
  const shell = useMemo(() => getShellConfig(), []);
  const deviceStore = useMemo(() => createDeviceStore(), []);
  const [appId, setAppId] = useState(shell.apps.length === 1 ? shell.apps[0].id : null);
  const app = shell.apps.find((item) => item.id === appId) ?? null;
  useEffect(() => {
    if (app === null) SplashScreen.hideAsync();
  }, [app]);
  if (app === null) {
    return (
      <AppPicker
        apps={shell.apps}
        lastAppId={deviceStore.get(LAST_APP_KEY)}
        onPick={(id) => {
          deviceStore.set(LAST_APP_KEY, id);
          setAppId(id);
        }}
        shellName={shell.name}
      />
    );
  }
  return (
    <AppProvider app={app} shell={shell}>
      <Frame />
    </AppProvider>
  );
}

export default ShellRoot;
