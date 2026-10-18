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
function OtherPageScreen({ path }) {
  const { session } = useShell();
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    let active = true;
    session
      .fetchOtherPage(path)
      .then((result) => {
        if (!active) return;
        if (result.surface === 'web') {
          Linking.openURL(`${session.apiBase}/${path}`);
          if (router.canGoBack()) router.back();
          return;
        }
        setNotFound(true);
      })
      .catch(() => {
        if (active) setNotFound(true);
      });
    return () => {
      active = false;
    };
  }, [path, session]);
  if (!notFound) {
    return <LoadingScreen />;
  }
  return <MessageScreen testID="shell-not-found" title="Page not found" />;
}

export default OtherPageScreen;
