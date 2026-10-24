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
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import SignInScreen from './SignInScreen.js';

const NEUTRAL = 'If this email can sign in, a code is on its way.';

function createAuth(overrides = {}) {
  return {
    sendCode: jest.fn(async () => ({ status: 'sent' })),
    signInWithCode: jest.fn(async () => ({ status: 'signedIn' })),
    signInWithSheet: jest.fn(async () => ({ status: 'cancelled' })),
    ...overrides,
  };
}

async function renderScreen({ auth = createAuth(), emailCode = true } = {}) {
  await render(
    <SignInScreen appName="Field" auth={auth} settings={{ emailCode, unlock: 'none' }} />
  );
  return auth;
}

async function enterEmail(email = ' ana@example.com ') {
  await fireEvent.changeText(screen.getByTestId('sign-in-email'), email);
  await fireEvent.press(screen.getByTestId('sign-in-continue'));
}

function isDisabled(testID) {
  return screen.getByTestId(testID).props.accessibilityState?.disabled === true;
}

afterEach(() => {
  jest.useRealTimers();
});

test('the screen shows the app name and an email field, with the sheet as the other way in', async () => {
  await renderScreen();
  expect(screen.getByText('Field')).toBeTruthy();
  const email = screen.getByTestId('sign-in-email');
  expect(email.props.textContentType).toBe('emailAddress');
  expect(email.props.autoComplete).toBe('email');
  expect(isDisabled('sign-in-continue')).toBe(true);
  expect(screen.getByText('Other ways to sign in')).toBeTruthy();
});

test('Continue sends a code to the email and asks for it, saying only that it may be on its way', async () => {
  const auth = await renderScreen();
  await enterEmail();
  expect(auth.sendCode).toHaveBeenCalledWith({ email: 'ana@example.com' });
  expect(screen.getByTestId('sign-in-message')).toHaveTextContent(NEUTRAL);
  const code = screen.getByTestId('sign-in-code');
  expect(code.props.textContentType).toBe('oneTimeCode');
  expect(code.props.autoComplete).toBe('one-time-code');
  expect(code.props.maxLength).toBe(6);
});

test('an address that can not sign in gets the same message, and no hint it is unknown', async () => {
  // The server answers every address alike; the screen has nothing else to say.
  const auth = await renderScreen();
  await enterEmail('stranger@example.com');
  expect(auth.sendCode).toHaveBeenCalledWith({ email: 'stranger@example.com' });
  expect(screen.getByTestId('sign-in-message')).toHaveTextContent(NEUTRAL);
  expect(screen.queryByTestId('sign-in-error')).toBeNull();
});

test('the sixth digit of the code signs in', async () => {
  const auth = await renderScreen();
  await enterEmail();
  await fireEvent.changeText(screen.getByTestId('sign-in-code'), '12345');
  expect(auth.signInWithCode).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByTestId('sign-in-code'), '123 456');
  expect(auth.signInWithCode).toHaveBeenCalledWith({ email: 'ana@example.com', otp: '123456' });
});

test('a wrong code says so and clears the field', async () => {
  const auth = await renderScreen({
    auth: createAuth({ signInWithCode: jest.fn(async () => ({ status: 'invalid' })) }),
  });
  await enterEmail();
  await fireEvent.changeText(screen.getByTestId('sign-in-code'), '000000');
  expect(auth.signInWithCode).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('sign-in-error')).toHaveTextContent(
    'That code is not right, or it has expired.'
  );
  expect(screen.getByTestId('sign-in-code').props.value).toBe('');
});

test('Resend waits 30 seconds, then sends another code', async () => {
  jest.useFakeTimers();
  const auth = await renderScreen();
  await enterEmail();
  expect(isDisabled('sign-in-resend')).toBe(true);
  expect(screen.getByText('Resend in 30s')).toBeTruthy();
  for (let second = 0; second < 29; second += 1) {
    await act(async () => jest.advanceTimersByTime(1000));
  }
  expect(isDisabled('sign-in-resend')).toBe(true);
  expect(screen.getByText('Resend in 1s')).toBeTruthy();
  await act(async () => jest.advanceTimersByTime(1000));
  expect(isDisabled('sign-in-resend')).toBe(false);
  await fireEvent.press(screen.getByTestId('sign-in-resend'));
  expect(auth.sendCode).toHaveBeenCalledTimes(2);
  expect(isDisabled('sign-in-resend')).toBe(true);
});

test('Change email goes back to the email field', async () => {
  await renderScreen();
  await enterEmail();
  await fireEvent.press(screen.getByTestId('sign-in-change-email'));
  expect(screen.getByTestId('sign-in-email').props.value).toBe(' ana@example.com ');
  expect(screen.queryByTestId('sign-in-code')).toBeNull();
});

test('a person with a second factor finishes in the sheet', async () => {
  const auth = await renderScreen({
    auth: createAuth({ signInWithCode: jest.fn(async () => ({ status: 'twoFactor' })) }),
  });
  await enterEmail();
  await fireEvent.changeText(screen.getByTestId('sign-in-code'), '123456');
  expect(auth.signInWithSheet).toHaveBeenCalledTimes(1);
});

test('Other ways to sign in opens the sheet, and says so when it did not finish', async () => {
  const auth = await renderScreen({
    auth: createAuth({ signInWithSheet: jest.fn(async () => ({ status: 'failed' })) }),
  });
  await fireEvent.press(screen.getByTestId('sign-in-other'));
  expect(auth.signInWithSheet).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('sign-in-error')).toHaveTextContent(
    'Sign-in did not finish. Try again.'
  );
});

test('an app without email codes opens the sheet at once, with a button to open it again', async () => {
  const auth = await renderScreen({ emailCode: false });
  expect(auth.signInWithSheet).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('sign-in-email')).toBeNull();
  await fireEvent.press(screen.getByTestId('sign-in-sheet'));
  expect(auth.signInWithSheet).toHaveBeenCalledTimes(2);
});

test('a server without the email code route sends the person to the sheet', async () => {
  const auth = await renderScreen({
    auth: createAuth({ sendCode: jest.fn(async () => ({ status: 'unavailable' })) }),
  });
  await enterEmail();
  expect(auth.signInWithSheet).toHaveBeenCalledTimes(1);
});

test('too many codes, or no connection, say so', async () => {
  const sendCode = jest
    .fn()
    .mockResolvedValueOnce({ status: 'rateLimited' })
    .mockRejectedValueOnce(new TypeError('Network request failed'));
  await renderScreen({ auth: createAuth({ sendCode }) });
  await enterEmail();
  expect(screen.getByTestId('sign-in-error')).toHaveTextContent(
    'Too many tries. Wait a minute, then try again.'
  );
  await fireEvent.press(screen.getByTestId('sign-in-continue'));
  expect(screen.getByTestId('sign-in-error')).toHaveTextContent(
    "Could not reach the app's server. Check your connection and try again."
  );
});
