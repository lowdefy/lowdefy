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

import React, { useEffect, useSyncExternalStore } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import getAuthSettings from './getAuthSettings.js';
import getAuthView from './getAuthView.js';
import LoadingScreen from '../components/LoadingScreen.js';
import LockScreen from './LockScreen.js';
import SignInScreen from './SignInScreen.js';
import { useSessionState, useShell } from '../ShellContext.js';

// The lock screen or sign-in screen in place of the app, until it is unlocked and someone is
// signed in (getAuthView).
function AuthGate({ children }) {
  const { auth } = useShell();
  const authState = useSyncExternalStore(auth.subscribe, auth.getState);
  const sessionState = useSessionState();
  const view = getAuthView({ auth: authState, session: sessionState });

  useEffect(() => {
    if (view === 'lock' || view === 'signIn') SplashScreen.hideAsync();
  }, [view]);

  if (view === 'lock') {
    return <LockScreen appName={auth.getAppName()} auth={auth} />;
  }
  if (view === 'loading') {
    return <LoadingScreen />;
  }
  if (view === 'signIn') {
    return (
      <SignInScreen
        appName={auth.getAppName()}
        auth={auth}
        settings={getAuthSettings(sessionState.root)}
      />
    );
  }
  return children;
}

export default AuthGate;
