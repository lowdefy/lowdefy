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

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import AuthButton from './AuthButton.js';
import AuthLink from './AuthLink.js';
import styles from './styles.js';

/**
 * The lock screen of an app with biometric unlock: no page shows until Face ID or a fingerprint
 * unlocks it. It asks at once, and again on Unlock. "Sign in again" signs out, for a person whose
 * biometrics no longer open the app.
 */
function LockScreen({ appName, auth }) {
  const [busy, setBusy] = useState(false);

  const unlock = useCallback(async () => {
    setBusy(true);
    try {
      await auth.unlock();
    } finally {
      setBusy(false);
    }
  }, [auth]);

  useEffect(() => {
    unlock();
  }, [unlock]);

  return (
    <View style={styles.screen} testID="shell-lock">
      <Text accessibilityRole="header" style={styles.appName}>
        {appName}
      </Text>
      <AuthButton disabled={busy} onPress={unlock} testID="lock-unlock" title="Unlock" />
      <AuthLink
        disabled={busy}
        onPress={() => auth.signOut()}
        style={styles.centered}
        testID="lock-sign-in-again"
        title="Sign in again"
      />
    </View>
  );
}

export default LockScreen;
