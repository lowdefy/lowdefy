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
import { Linking } from 'react-native';
import { router } from 'expo-router';

import LoadingScreen from './LoadingScreen.js';
import MessageScreen from './MessageScreen.js';
import { useShell } from '../ShellContext.js';

// A path no mobile page has. When the server has a web page there (it answers the shell with
// { surface: 'web' }), the page opens in the system browser; otherwise it is not found.
function OtherPageScreen({ path, query = '' }) {
  const { session } = useShell();
  const [view, setView] = useState('loading');
  useEffect(() => {
    let active = true;
    session
      .fetchOtherPage(path)
      .then((result) => {
        if (!active) return;
        if (result.surface === 'web') {
          // The query rides along: the web page reads its own _url_query.
          const url = `${session.apiBase}/${path}${query ? `?${query}` : ''}`;
          Linking.openURL(url)
            .then(() => {
              if (!active) return;
              if (router.canGoBack()) {
                router.back();
                return;
              }
              // A cold start from a deep link has nothing to go back to. Going home on its own
              // would open the browser again when the home page is itself web-only.
              setView('opened');
            })
            .catch(() => {
              if (active) setView('notFound');
            });
          return;
        }
        setView('notFound');
      })
      .catch(() => {
        if (active) setView('notFound');
      });
    return () => {
      active = false;
    };
  }, [path, query, session]);
  if (view === 'opened') {
    return (
      <MessageScreen
        action={{ title: 'Go home', onPress: () => router.replace('/') }}
        body="This page is on the web, not in the app."
        testID="shell-opened-in-browser"
        title="Opened in your browser"
      />
    );
  }
  if (view === 'notFound') {
    return <MessageScreen testID="shell-not-found" title="Page not found" />;
  }
  return <LoadingScreen />;
}

export default OtherPageScreen;
