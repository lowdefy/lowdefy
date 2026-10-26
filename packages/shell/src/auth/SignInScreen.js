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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInput, View } from 'react-native';

import AuthButton from './AuthButton.js';
import AuthLink from './AuthLink.js';
import styles from './styles.js';
import useSurfaceTokens from '../components/useSurfaceTokens.js';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

const MESSAGES = {
  sent: 'If this email can sign in, a code is on its way.',
  invalid: 'That code is not right, or it has expired.',
  rateLimited: 'Too many tries. Wait a minute, then try again.',
  sheetFailed: 'Sign-in did not finish. Try again.',
  unreachable: "Could not reach the app's server. Check your connection and try again.",
};

/**
 * Sign-in for an app with auth, before any page config can be fetched. By default the person
 * types their email, then the 6-digit code from the email (the phone offers it from Mail or
 * Messages). "Other ways to sign in", an app without email codes (mobile.auth.emailCode: false)
 * and a person who must pass a second factor go to the app's own sign-in page in a system sheet.
 *
 * The screen never says whether an address can sign in: after Continue it always says a code is
 * on its way, if the address can sign in.
 *
 * @param {Object} props
 * @param {string} props.appName The app's name.
 * @param {Object} props.auth The app's auth (createAppAuth).
 * @param {{ emailCode: boolean }} props.settings The app's mobile.auth.
 */
function SignInScreen({ appName, auth, settings }) {
  const tokens = useSurfaceTokens();
  const labelStyle = [styles.label, { color: tokens.colorLabel }];
  const inputStyle = [
    styles.input,
    { backgroundColor: tokens.colorCell, color: tokens.colorLabel },
  ];
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [resendIn, setResendIn] = useState(0);
  const sheetOpened = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const run = useCallback(async (task) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (taskError) {
      setError(MESSAGES.unreachable);
    } finally {
      setBusy(false);
    }
  }, []);

  const openSheet = useCallback(async () => {
    const result = await auth.signInWithSheet();
    if (result.status === 'failed') {
      setError(MESSAGES.sheetFailed);
    }
  }, [auth]);

  useEffect(() => {
    if (settings.emailCode || sheetOpened.current) return;
    sheetOpened.current = true;
    run(openSheet);
  }, [openSheet, run, settings.emailCode]);

  function sendCode() {
    run(async () => {
      const result = await auth.sendCode({ email: email.trim() });
      if (result.status === 'unavailable') {
        await openSheet();
        return;
      }
      if (result.status === 'rateLimited') {
        setError(MESSAGES.rateLimited);
        return;
      }
      setStep('code');
      setCode('');
      setMessage(MESSAGES.sent);
      setResendIn(RESEND_SECONDS);
    });
  }

  function submitCode(otp) {
    run(async () => {
      const result = await auth.signInWithCode({ email: email.trim(), otp });
      if (result.status === 'twoFactor') {
        await openSheet();
        return;
      }
      if (result.status === 'invalid' || result.status === 'rateLimited') {
        setCode('');
        setError(MESSAGES[result.status]);
      }
    });
  }

  function changeCode(text) {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH && !busy) {
      submitCode(digits);
    }
  }

  function changeEmail() {
    setStep('email');
    setCode('');
    setMessage(null);
    setError(null);
  }

  let form;
  if (!settings.emailCode) {
    form = (
      <AuthButton
        disabled={busy}
        onPress={() => run(openSheet)}
        testID="sign-in-sheet"
        title="Sign in"
      />
    );
  } else if (step === 'email') {
    form = (
      <>
        <Text style={labelStyle}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!busy}
          inputMode="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          onSubmitEditing={sendCode}
          placeholderTextColor={tokens.colorTertiaryLabel}
          returnKeyType="next"
          style={inputStyle}
          testID="sign-in-email"
          textContentType="emailAddress"
          value={email}
        />
        <AuthButton
          disabled={busy || email.trim().length === 0}
          onPress={sendCode}
          testID="sign-in-continue"
          title="Continue"
        />
      </>
    );
  } else {
    form = (
      <>
        <Text
          style={[styles.message, { color: tokens.colorSecondaryLabel }]}
          testID="sign-in-message"
        >
          {message}
        </Text>
        <Text style={labelStyle}>Code sent to {email.trim()}</Text>
        <TextInput
          autoComplete="one-time-code"
          autoFocus
          editable={!busy}
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          onChangeText={changeCode}
          style={[inputStyle, styles.codeInput]}
          testID="sign-in-code"
          textContentType="oneTimeCode"
          value={code}
        />
        <View style={styles.links}>
          <AuthLink
            disabled={busy || resendIn > 0}
            onPress={sendCode}
            testID="sign-in-resend"
            title={resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
          />
          <AuthLink
            disabled={busy}
            onPress={changeEmail}
            testID="sign-in-change-email"
            title="Change email"
          />
        </View>
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      // Android apps are edge-to-edge, so the window no longer resizes for the keyboard; padding
      // by the keyboard's overlap keeps the form above it on both platforms.
      behavior="padding"
      style={{ backgroundColor: tokens.colorGroupedBackground, flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={[styles.appName, { color: tokens.colorLabel }]}>
          {appName}
        </Text>
        {form}
        {error ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: tokens.colorError }]}
            testID="sign-in-error"
          >
            {error}
          </Text>
        ) : null}
        {settings.emailCode ? (
          <AuthLink
            disabled={busy}
            onPress={() => run(openSheet)}
            style={styles.centered}
            testID="sign-in-other"
            title="Other ways to sign in"
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default SignInScreen;
