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

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import createShellApp from '../createShellApp.js';
import LoadingScreen from './LoadingScreen.js';
import MessageScreen from './MessageScreen.js';
import NoConnectionBanner from './NoConnectionBanner.js';
import ShellContext, { useSessionState } from '../ShellContext.js';

function AppGate({ children }) {
  const { status, error } = useSessionState();
  const value = React.useContext(ShellContext);
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);
  if (status === 'loading') {
    return <LoadingScreen />;
  }
  if (status === 'error') {
    return (
      <MessageScreen
        action={{ title: 'Try again', onPress: () => value.session.start() }}
        body={error?.message}
        testID="shell-app-error"
        title="This app could not be opened"
      />
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <NoConnectionBanner />
      {children}
    </View>
  );
}

// Opens one app: builds its session and host, renders its last pages from the cache and syncs it
// with the app's server.
function AppProvider({ app, children, shell }) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    let active = true;
    createShellApp({ app, shell }).then(({ host, session }) => {
      if (!active) return;
      setValue({ host, session, shell });
      session.start();
    });
    return () => {
      active = false;
    };
  }, [app, shell]);
  if (value === null) {
    return <LoadingScreen />;
  }
  return (
    <ShellContext.Provider value={value}>
      <AppGate>{children}</AppGate>
    </ShellContext.Provider>
  );
}

export default AppProvider;
