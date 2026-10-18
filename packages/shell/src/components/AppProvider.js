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

import AuthGate from '../auth/AuthGate.js';
import createShellApp from '../createShellApp.js';
import LoadingScreen from './LoadingScreen.js';
import MessageScreen from './MessageScreen.js';
import NoConnectionBanner from './NoConnectionBanner.js';
import ShellContext, { useSessionState } from '../ShellContext.js';
import ShellThemeProvider from './ShellThemeProvider.js';

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
      <ShellThemeProvider>{children}</ShellThemeProvider>
    </View>
  );
}

// Opens one app: builds its auth, session and host, renders its last pages from the cache and
// syncs it with the app's server. A sign-out opens it afresh, with nothing of the person's kept.
function AppProvider({ app, children, shell }) {
  const [value, setValue] = useState(null);
  const [openings, setOpenings] = useState(0);
  useEffect(() => {
    let active = true;
    let opened = null;
    setValue(null);
    const onSignedOut = () => setOpenings((count) => count + 1);
    createShellApp({ app, onSignedOut, shell }).then(({ auth, host, locale, session }) => {
      if (!active) return;
      opened = auth;
      setValue({ auth, host, locale, session, shell });
      auth.start({ session });
    });
    return () => {
      active = false;
      opened?.dispose();
    };
  }, [app, openings, shell]);
  if (value === null) {
    return <LoadingScreen />;
  }
  return (
    <ShellContext.Provider value={value}>
      <AuthGate>
        <AppGate>{children}</AppGate>
      </AuthGate>
    </ShellContext.Provider>
  );
}

export default AppProvider;
