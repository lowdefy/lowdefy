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

import React from 'react';
import * as SplashScreen from 'expo-splash-screen';

import installGetRandomValues from '../src/polyfills/installGetRandomValues.js';
import ShellRoot from '../src/components/ShellRoot.js';
// Lowdefy Dev's developer features; undefined in a release shell, whose bundle leaves them out.
import { DevShell } from '../src/dev/index.js';

installGetRandomValues();

// The launch screen stays until the first screen is ready: the app picker, or the app's home page
// from the cache (or from the server on a first launch).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return DevShell ? <DevShell /> : <ShellRoot />;
}
