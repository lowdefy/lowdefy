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

import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import MessageScreen from './MessageScreen.js';
import reportShellError from '../host/reportShellError.js';

/**
 * The root layout's Expo Router ErrorBoundary: a render fault outside a block (a page's `_js`, the
 * root config, the frame) would otherwise close the app unreported. It reports the fault and offers
 * to render the screen again. A block's own fault never reaches it: the block's boundary shows it.
 *
 * @param {Object} props
 * @param {Error} props.error
 * @param {() => Promise<void>} props.retry Renders the route again.
 */
function RouteErrorScreen({ error, retry }) {
  useEffect(() => {
    reportShellError({ error });
    SplashScreen.hideAsync();
  }, [error]);
  return (
    <MessageScreen
      action={{ title: 'Try again', onPress: () => retry() }}
      body={error?.message}
      testID="shell-route-error"
      title="Something went wrong"
    />
  );
}

export default RouteErrorScreen;
