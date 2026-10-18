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
import { Linking, Platform } from 'react-native';

import MessageScreen from './MessageScreen.js';

// Shown for a page this shell cannot render (it lacks a type the page needs), and for every page
// when the app requires a newer shell (minShellVersion). The store link comes from shell.json.
function UpdateScreen({ shell }) {
  const storeUrl = shell.store?.[Platform.OS];
  return (
    <MessageScreen
      action={storeUrl ? { title: 'Update', onPress: () => Linking.openURL(storeUrl) } : null}
      body="This page needs a newer version of the app."
      testID="shell-update"
      title="Update the app to open this page"
    />
  );
}

export default UpdateScreen;
