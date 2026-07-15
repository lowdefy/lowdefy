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

import { jest } from '@jest/globals';
import createAuthMethods from './createAuthMethods.js';

function setup({ signInResult, signUpResult } = {}) {
  const assign = jest.fn();
  const lowdefy = {
    _internal: {
      globals: { window: { location: { assign, search: '' } } },
    },
  };
  const auth = {
    authConfig: { providers: [] },
    acceptInvitation: jest.fn(() => Promise.resolve({ data: { member: {} }, error: null })),
    addPasskey: jest.fn(() => Promise.resolve({ data: { id: 'passkey-1' }, error: null })),
    changePassword: jest.fn(() =>
      Promise.resolve({ data: { token: null, user: {} }, error: null })
    ),
    deletePasskey: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    impersonateUser: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
    phoneNumberRequestPasswordReset: jest.fn(() =>
      Promise.resolve({ data: { status: true }, error: null })
    ),
    phoneNumberResetPassword: jest.fn(() =>
      Promise.resolve({ data: { status: true }, error: null })
    ),
    phoneNumberSendOtp: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    phoneNumberVerify: jest.fn(() =>
      Promise.resolve({ data: { token: 't', user: {} }, error: null })
    ),
    requestPasswordReset: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    resetPassword: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    revokeOtherSessions: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    sendVerificationEmail: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    signInEmail: jest.fn(() =>
      Promise.resolve({ data: signInResult ?? { token: 't' }, error: null })
    ),
    signInPasskey: jest.fn(() =>
      Promise.resolve({ data: signInResult ?? { session: {}, user: {} }, error: null })
    ),
    signInPhoneNumber: jest.fn(() =>
      Promise.resolve({ data: signInResult ?? { token: 't' }, error: null })
    ),
    signUpEmail: jest.fn(() =>
      Promise.resolve({ data: signUpResult ?? { token: null, user: {} }, error: null })
    ),
    stopImpersonating: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
    twoFactorDisable: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    twoFactorEnable: jest.fn(() =>
      Promise.resolve({
        data: { totpURI: 'otpauth://totp/app', backupCodes: ['code-1'] },
        error: null,
      })
    ),
    twoFactorVerifyBackupCode: jest.fn(() =>
      Promise.resolve({ data: { token: 't', user: {} }, error: null })
    ),
    twoFactorVerifyTotp: jest.fn(() =>
      Promise.resolve({ data: { token: 't', user: {} }, error: null })
    ),
  };
  return { auth, lowdefy, assign };
}

test('signUp calls signUpEmail with email, password, name and callbackURL', async () => {
  const { auth, lowdefy } = setup();
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({
    email: 'user@example.com',
    password: 'password123',
    name: 'User',
    callbackUrl: { url: '/verified' },
  });
  expect(auth.signUpEmail.mock.calls).toEqual([
    [
      {
        email: 'user@example.com',
        password: 'password123',
        name: 'User',
        callbackURL: '/verified',
      },
    ],
  ]);
});

test('signUp does not navigate on a session-less response (verify-email state)', async () => {
  const { auth, lowdefy, assign } = setup({ signUpResult: { token: null, user: {} } });
  const { signUp } = createAuthMethods(lowdefy, auth);
  const data = await signUp({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/verified' },
  });
  expect(assign).not.toHaveBeenCalled();
  expect(data).toEqual({ token: null, user: {} });
});

test('signUp navigates to callbackURL when the response carries a session', async () => {
  const { auth, lowdefy, assign } = setup({ signUpResult: { token: 'session-token', user: {} } });
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/verified' },
  });
  expect(assign.mock.calls).toEqual([['/verified']]);
});

test('signUp passes through rest params to signUpEmail', async () => {
  const { auth, lowdefy } = setup();
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({ email: 'user@example.com', password: 'password123', rememberMe: true });
  expect(auth.signUpEmail.mock.calls[0][0]).toMatchObject({ rememberMe: true });
});

test('logout prefixes basePath onto a relative callbackUrl and suppresses the sign-out reload', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.basePath = '/base';
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  auth.suppressSignOutReload = jest.fn();
  const { logout } = createAuthMethods(lowdefy, auth);
  await logout({ callbackUrl: { pageId: 'goodbye' } });
  expect(auth.suppressSignOutReload).toHaveBeenCalledTimes(1);
  expect(assign.mock.calls).toEqual([['/base/goodbye']]);
});

test('logout navigates to an absolute callbackUrl without prefixing basePath', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.basePath = '/base';
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  const { logout } = createAuthMethods(lowdefy, auth);
  await logout({ callbackUrl: { url: 'https://example.com/logged-out' } });
  expect(assign.mock.calls).toEqual([['https://example.com/logged-out']]);
});

test('logout without a callbackUrl signs out without navigating or suppressing the reload', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  auth.suppressSignOutReload = jest.fn();
  const { logout } = createAuthMethods(lowdefy, auth);
  await logout();
  expect(auth.suppressSignOutReload).not.toHaveBeenCalled();
  expect(assign).not.toHaveBeenCalled();
});

test('login no longer handles signUp - a signUp-only call is rejected', async () => {
  const { auth, lowdefy } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(login({ signUp: true, name: 'User' })).rejects.toThrow(
    'Login requires a "providerId", "email" and "password", "phoneNumber" and "password", or "magicLink: true" param.'
  );
  expect(auth.signUpEmail).not.toHaveBeenCalled();
});

test('impersonateUser calls auth.impersonateUser with the userId param', async () => {
  const { auth, lowdefy } = setup();
  const { impersonateUser } = createAuthMethods(lowdefy, auth);
  await impersonateUser({ userId: 'user-1' });
  expect(auth.impersonateUser.mock.calls).toEqual([[{ userId: 'user-1' }]]);
});

test('impersonateUser throws when userId is missing', async () => {
  const { auth, lowdefy } = setup();
  const { impersonateUser } = createAuthMethods(lowdefy, auth);
  await expect(impersonateUser()).rejects.toThrow('ImpersonateUser requires a "userId" param.');
  expect(auth.impersonateUser).not.toHaveBeenCalled();
});

test('impersonateUser surfaces the error returned by the endpoint', async () => {
  const { auth, lowdefy } = setup();
  auth.impersonateUser = jest.fn(() =>
    Promise.resolve({
      data: null,
      error: { message: 'Forbidden.', code: 'FORBIDDEN', status: 403 },
    })
  );
  const { impersonateUser } = createAuthMethods(lowdefy, auth);
  await expect(impersonateUser({ userId: 'user-1' })).rejects.toThrow('Forbidden.');
});

test('stopImpersonating calls auth.stopImpersonating with no params', async () => {
  const { auth, lowdefy } = setup();
  const { stopImpersonating } = createAuthMethods(lowdefy, auth);
  await stopImpersonating();
  expect(auth.stopImpersonating.mock.calls).toEqual([[]]);
});

test('stopImpersonating surfaces the error returned by the endpoint', async () => {
  const { auth, lowdefy } = setup();
  auth.stopImpersonating = jest.fn(() =>
    Promise.resolve({ data: null, error: { message: 'No impersonation session.' } })
  );
  const { stopImpersonating } = createAuthMethods(lowdefy, auth);
  await expect(stopImpersonating()).rejects.toThrow('No impersonation session.');
});

test('login with email and password navigates to callbackURL on a session response', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  const { login } = createAuthMethods(lowdefy, auth);
  const data = await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/dashboard' },
  });
  expect(assign.mock.calls).toEqual([['/dashboard']]);
  expect(data).toEqual({ token: 't', user: {} });
});

test('login returns the two-factor challenge without navigating', async () => {
  const { auth, lowdefy, assign } = setup({
    signInResult: { twoFactorRedirect: true, twoFactorMethods: ['totp'] },
  });
  const { login } = createAuthMethods(lowdefy, auth);
  const data = await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/dashboard' },
  });
  expect(assign).not.toHaveBeenCalled();
  expect(data).toEqual({ twoFactorRedirect: true, twoFactorMethods: ['totp'] });
});

test('changePassword calls auth.changePassword with the password params', async () => {
  const { auth, lowdefy } = setup();
  const { changePassword } = createAuthMethods(lowdefy, auth);
  await changePassword({
    currentPassword: 'old-pass',
    newPassword: 'new-pass',
    revokeOtherSessions: true,
  });
  expect(auth.changePassword.mock.calls).toEqual([
    [{ currentPassword: 'old-pass', newPassword: 'new-pass', revokeOtherSessions: true }],
  ]);
});

test('changePassword throws when currentPassword or newPassword is missing', async () => {
  const { auth, lowdefy } = setup();
  const { changePassword } = createAuthMethods(lowdefy, auth);
  await expect(changePassword({ newPassword: 'new-pass' })).rejects.toThrow(
    'ChangePassword requires "currentPassword" and "newPassword" params.'
  );
  await expect(changePassword({ currentPassword: 'old-pass' })).rejects.toThrow(
    'ChangePassword requires "currentPassword" and "newPassword" params.'
  );
  expect(auth.changePassword).not.toHaveBeenCalled();
});

test('requestPasswordReset calls auth.requestPasswordReset with email and redirectTo', async () => {
  const { auth, lowdefy } = setup();
  const { requestPasswordReset } = createAuthMethods(lowdefy, auth);
  await requestPasswordReset({ email: 'user@example.com', redirectTo: '/reset-password' });
  expect(auth.requestPasswordReset.mock.calls).toEqual([
    [{ email: 'user@example.com', redirectTo: '/reset-password' }],
  ]);
});

test('requestPasswordReset throws when email is missing', async () => {
  const { auth, lowdefy } = setup();
  const { requestPasswordReset } = createAuthMethods(lowdefy, auth);
  await expect(requestPasswordReset()).rejects.toThrow(
    'RequestPasswordReset requires an "email" or "phoneNumber" param.'
  );
  expect(auth.requestPasswordReset).not.toHaveBeenCalled();
});

test('resetPassword calls auth.resetPassword with newPassword and token', async () => {
  const { auth, lowdefy } = setup();
  const { resetPassword } = createAuthMethods(lowdefy, auth);
  await resetPassword({ newPassword: 'new-pass', token: 'reset-token' });
  expect(auth.resetPassword.mock.calls).toEqual([
    [{ newPassword: 'new-pass', token: 'reset-token' }],
  ]);
});

test('resetPassword throws when newPassword is missing', async () => {
  const { auth, lowdefy } = setup();
  const { resetPassword } = createAuthMethods(lowdefy, auth);
  await expect(resetPassword({ token: 'reset-token' })).rejects.toThrow(
    'ResetPassword requires a "newPassword" param.'
  );
  expect(auth.resetPassword).not.toHaveBeenCalled();
});

test('sendVerificationEmail resolves the callbackUrl and calls auth.sendVerificationEmail', async () => {
  const { auth, lowdefy } = setup();
  const { sendVerificationEmail } = createAuthMethods(lowdefy, auth);
  await sendVerificationEmail({ email: 'user@example.com', callbackUrl: { url: '/verified' } });
  expect(auth.sendVerificationEmail.mock.calls).toEqual([
    [{ email: 'user@example.com', callbackURL: '/verified' }],
  ]);
});

test('sendVerificationEmail throws when email is missing', async () => {
  const { auth, lowdefy } = setup();
  const { sendVerificationEmail } = createAuthMethods(lowdefy, auth);
  await expect(sendVerificationEmail()).rejects.toThrow(
    'SendVerificationEmail requires an "email" param.'
  );
  expect(auth.sendVerificationEmail).not.toHaveBeenCalled();
});

test('twoFactorEnable calls auth.twoFactorEnable and returns totpURI and backup codes', async () => {
  const { auth, lowdefy } = setup();
  const { twoFactorEnable } = createAuthMethods(lowdefy, auth);
  const data = await twoFactorEnable({ password: 'pass-123' });
  expect(auth.twoFactorEnable.mock.calls).toEqual([[{ password: 'pass-123' }]]);
  expect(data).toEqual({ totpURI: 'otpauth://totp/app', backupCodes: ['code-1'] });
});

test('twoFactorEnable throws when password is missing', async () => {
  const { auth, lowdefy } = setup();
  const { twoFactorEnable } = createAuthMethods(lowdefy, auth);
  await expect(twoFactorEnable()).rejects.toThrow('TwoFactorEnable requires a "password" param.');
  expect(auth.twoFactorEnable).not.toHaveBeenCalled();
});

test('twoFactorVerify verifies a TOTP code with trustDevice', async () => {
  const { auth, lowdefy } = setup();
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ code: '012345', trustDevice: true });
  expect(auth.twoFactorVerifyTotp.mock.calls).toEqual([[{ code: '012345', trustDevice: true }]]);
  expect(auth.twoFactorVerifyBackupCode).not.toHaveBeenCalled();
});

test('twoFactorVerify verifies a backup code when backupCode is given', async () => {
  const { auth, lowdefy } = setup();
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ backupCode: 'backup-1', trustDevice: false });
  expect(auth.twoFactorVerifyBackupCode.mock.calls).toEqual([
    [{ code: 'backup-1', trustDevice: false }],
  ]);
  expect(auth.twoFactorVerifyTotp).not.toHaveBeenCalled();
});

test('twoFactorVerify throws when neither code nor backupCode is given', async () => {
  const { auth, lowdefy } = setup();
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await expect(twoFactorVerify({ trustDevice: true })).rejects.toThrow(
    'TwoFactorVerify requires a "code" or "backupCode" param.'
  );
  expect(auth.twoFactorVerifyTotp).not.toHaveBeenCalled();
  expect(auth.twoFactorVerifyBackupCode).not.toHaveBeenCalled();
});

test('twoFactorDisable calls auth.twoFactorDisable with the password', async () => {
  const { auth, lowdefy } = setup();
  const { twoFactorDisable } = createAuthMethods(lowdefy, auth);
  await twoFactorDisable({ password: 'pass-123' });
  expect(auth.twoFactorDisable.mock.calls).toEqual([[{ password: 'pass-123' }]]);
});

test('twoFactorDisable throws when password is missing', async () => {
  const { auth, lowdefy } = setup();
  const { twoFactorDisable } = createAuthMethods(lowdefy, auth);
  await expect(twoFactorDisable()).rejects.toThrow('TwoFactorDisable requires a "password" param.');
  expect(auth.twoFactorDisable).not.toHaveBeenCalled();
});

test('passkeyRegister calls auth.addPasskey and returns the registered passkey', async () => {
  const { auth, lowdefy } = setup();
  const { passkeyRegister } = createAuthMethods(lowdefy, auth);
  const data = await passkeyRegister({ name: 'Work laptop' });
  expect(auth.addPasskey.mock.calls).toEqual([[{ name: 'Work laptop' }]]);
  expect(data).toEqual({ id: 'passkey-1' });
});

test('passkeyRegister surfaces a cancelled WebAuthn ceremony as an error', async () => {
  const { auth, lowdefy } = setup();
  auth.addPasskey = jest.fn(() =>
    Promise.resolve({
      data: null,
      error: { message: 'Registration cancelled.', code: 'ERROR_CEREMONY_ABORTED', status: 400 },
    })
  );
  const { passkeyRegister } = createAuthMethods(lowdefy, auth);
  await expect(passkeyRegister()).rejects.toThrow('Registration cancelled.');
});

test('passkeySignIn navigates to callbackURL on a session-bearing success', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { session: {}, user: {} } });
  const { passkeySignIn } = createAuthMethods(lowdefy, auth);
  const data = await passkeySignIn({ callbackUrl: { url: '/dashboard' } });
  expect(assign.mock.calls).toEqual([['/dashboard']]);
  expect(data).toEqual({ session: {}, user: {} });
});

test('passkeySignIn calls auth.signInPasskey with no forwarded params', async () => {
  const { auth, lowdefy } = setup();
  const { passkeySignIn } = createAuthMethods(lowdefy, auth);
  await passkeySignIn({ callbackUrl: { url: '/dashboard' } });
  expect(auth.signInPasskey.mock.calls).toEqual([[]]);
});

test('passkeySignIn surfaces a failed ceremony or walled-out response as an error', async () => {
  const { auth, lowdefy } = setup();
  auth.signInPasskey = jest.fn(() =>
    Promise.resolve({
      data: null,
      error: { message: 'Membership required.', code: 'MEMBERSHIP_REQUIRED', status: 403 },
    })
  );
  const { passkeySignIn } = createAuthMethods(lowdefy, auth);
  await expect(passkeySignIn()).rejects.toThrow('Membership required.');
});

test('passkeyDelete maps passkeyId onto the deletePasskey id param', async () => {
  const { auth, lowdefy } = setup();
  const { passkeyDelete } = createAuthMethods(lowdefy, auth);
  await passkeyDelete({ passkeyId: 'passkey-1' });
  expect(auth.deletePasskey.mock.calls).toEqual([[{ id: 'passkey-1' }]]);
});

test('passkeyDelete throws when passkeyId is missing', async () => {
  const { auth, lowdefy } = setup();
  const { passkeyDelete } = createAuthMethods(lowdefy, auth);
  await expect(passkeyDelete()).rejects.toThrow('PasskeyDelete requires a "passkeyId" param.');
  expect(auth.deletePasskey).not.toHaveBeenCalled();
});

test('revokeOtherSessions calls auth.revokeOtherSessions with no params', async () => {
  const { auth, lowdefy } = setup();
  const { revokeOtherSessions } = createAuthMethods(lowdefy, auth);
  await revokeOtherSessions();
  expect(auth.revokeOtherSessions.mock.calls).toEqual([[]]);
});

test('acceptInvitation calls auth.acceptInvitation with the invitationId param', async () => {
  const { auth, lowdefy } = setup();
  const { acceptInvitation } = createAuthMethods(lowdefy, auth);
  await acceptInvitation({ invitationId: 'invitation-1' });
  expect(auth.acceptInvitation.mock.calls).toEqual([[{ invitationId: 'invitation-1' }]]);
});

test('acceptInvitation throws when invitationId is missing', async () => {
  const { auth, lowdefy } = setup();
  const { acceptInvitation } = createAuthMethods(lowdefy, auth);
  await expect(acceptInvitation()).rejects.toThrow(
    'AcceptInvitation requires an "invitationId" param.'
  );
  expect(auth.acceptInvitation).not.toHaveBeenCalled();
});

test('acceptInvitation surfaces the error returned by the endpoint', async () => {
  const { auth, lowdefy } = setup();
  auth.acceptInvitation = jest.fn(() =>
    Promise.resolve({
      data: null,
      error: { message: 'Invitation not found.', code: 'INVITATION_NOT_FOUND', status: 400 },
    })
  );
  const { acceptInvitation } = createAuthMethods(lowdefy, auth);
  await expect(acceptInvitation({ invitationId: 'invitation-1' })).rejects.toThrow(
    'Invitation not found.'
  );
});

test('login with phoneNumber and password calls signInPhoneNumber and navigates on success', async () => {
  const { auth, lowdefy, assign } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    phoneNumber: '+27831234567',
    password: 'password123',
    callbackUrl: { url: '/home' },
  });
  expect(auth.signInPhoneNumber.mock.calls).toEqual([
    [{ phoneNumber: '+27831234567', password: 'password123' }],
  ]);
  expect(auth.signInEmail).not.toHaveBeenCalled();
  expect(assign.mock.calls).toEqual([['/home']]);
});

test('login with phoneNumber does not navigate on a twoFactorRedirect response', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { twoFactorRedirect: true } });
  const { login } = createAuthMethods(lowdefy, auth);
  const data = await login({
    phoneNumber: '+27831234567',
    password: 'password123',
    callbackUrl: { url: '/home' },
  });
  expect(data).toEqual({ twoFactorRedirect: true });
  expect(assign).not.toHaveBeenCalled();
});

test('login with phoneNumber throws when password is missing', async () => {
  const { auth, lowdefy } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(login({ phoneNumber: '+27831234567' })).rejects.toThrow(
    'Login with phoneNumber requires a "password" param.'
  );
});

test('login with phoneNumber does not auto-pick a sole configured provider', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.providers = [{ id: 'google', type: 'Google' }];
  auth.signInSocial = jest.fn(() => Promise.resolve({ data: { url: 'x' }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ phoneNumber: '+27831234567', password: 'password123' });
  expect(auth.signInSocial).not.toHaveBeenCalled();
  expect(auth.signInPhoneNumber).toHaveBeenCalledTimes(1);
});

test('requestPasswordReset with phoneNumber dispatches to the phone reset request', async () => {
  const { auth, lowdefy } = setup();
  const { requestPasswordReset } = createAuthMethods(lowdefy, auth);
  await requestPasswordReset({ phoneNumber: '+27831234567' });
  expect(auth.phoneNumberRequestPasswordReset.mock.calls).toEqual([
    [{ phoneNumber: '+27831234567' }],
  ]);
  expect(auth.requestPasswordReset).not.toHaveBeenCalled();
});

test('requestPasswordReset throws when neither email nor phoneNumber is given', async () => {
  const { auth, lowdefy } = setup();
  const { requestPasswordReset } = createAuthMethods(lowdefy, auth);
  await expect(requestPasswordReset({})).rejects.toThrow(
    'RequestPasswordReset requires an "email" or "phoneNumber" param.'
  );
});

test('resetPassword with phoneNumber and otp dispatches to the phone reset', async () => {
  const { auth, lowdefy } = setup();
  const { resetPassword } = createAuthMethods(lowdefy, auth);
  await resetPassword({ phoneNumber: '+27831234567', otp: '123456', newPassword: 'newpass123' });
  expect(auth.phoneNumberResetPassword.mock.calls).toEqual([
    [{ phoneNumber: '+27831234567', otp: '123456', newPassword: 'newpass123' }],
  ]);
  expect(auth.resetPassword).not.toHaveBeenCalled();
});

test('resetPassword with phoneNumber throws when otp is missing', async () => {
  const { auth, lowdefy } = setup();
  const { resetPassword } = createAuthMethods(lowdefy, auth);
  await expect(
    resetPassword({ phoneNumber: '+27831234567', newPassword: 'newpass123' })
  ).rejects.toThrow('ResetPassword with phoneNumber requires an "otp" param.');
});

test('resetPassword without phoneNumber still resets with the emailed token', async () => {
  const { auth, lowdefy } = setup();
  const { resetPassword } = createAuthMethods(lowdefy, auth);
  await resetPassword({ token: 'reset-token', newPassword: 'newpass123' });
  expect(auth.resetPassword.mock.calls).toEqual([
    [{ newPassword: 'newpass123', token: 'reset-token' }],
  ]);
});

test('phoneNumberSendOtp calls the client sendOtp with the phone number', async () => {
  const { auth, lowdefy } = setup();
  const { phoneNumberSendOtp } = createAuthMethods(lowdefy, auth);
  await phoneNumberSendOtp({ phoneNumber: '+27831234567' });
  expect(auth.phoneNumberSendOtp.mock.calls).toEqual([[{ phoneNumber: '+27831234567' }]]);
});

test('phoneNumberSendOtp throws when phoneNumber is missing', async () => {
  const { auth, lowdefy } = setup();
  const { phoneNumberSendOtp } = createAuthMethods(lowdefy, auth);
  await expect(phoneNumberSendOtp({})).rejects.toThrow(
    'PhoneNumberSendOtp requires a "phoneNumber" param.'
  );
});

test('phoneNumberVerify calls the client verify and passes through flow params', async () => {
  const { auth, lowdefy } = setup();
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await phoneNumberVerify({
    phoneNumber: '+27831234567',
    code: '123456',
    disableSession: true,
    updatePhoneNumber: true,
  });
  expect(auth.phoneNumberVerify.mock.calls).toEqual([
    [
      {
        phoneNumber: '+27831234567',
        code: '123456',
        disableSession: true,
        updatePhoneNumber: true,
      },
    ],
  ]);
});

test('phoneNumberVerify throws when phoneNumber or code is missing', async () => {
  const { auth, lowdefy } = setup();
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await expect(phoneNumberVerify({ phoneNumber: '+27831234567' })).rejects.toThrow(
    'PhoneNumberVerify requires "phoneNumber" and "code" params.'
  );
  await expect(phoneNumberVerify({ code: '123456' })).rejects.toThrow(
    'PhoneNumberVerify requires "phoneNumber" and "code" params.'
  );
});

test('phoneNumberVerify rethrows the BetterAuth error so onError chains fire', async () => {
  const { auth, lowdefy } = setup();
  auth.phoneNumberVerify = jest.fn(() =>
    Promise.resolve({ data: null, error: { message: 'Invalid OTP', code: 'INVALID_OTP' } })
  );
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await expect(phoneNumberVerify({ phoneNumber: '+27831234567', code: '000000' })).rejects.toThrow(
    'Invalid OTP'
  );
});

test('login threads captchaToken as the x-captcha-response header, never the body', async () => {
  const { auth, lowdefy } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123', captchaToken: 'tok-1' });
  expect(auth.signInEmail.mock.calls).toEqual([
    [
      {
        email: 'user@example.com',
        password: 'password123',
        fetchOptions: { headers: { 'x-captcha-response': 'tok-1' } },
      },
    ],
  ]);
});

test('login with magicLink threads captchaToken into the magic-link call', async () => {
  const { auth, lowdefy } = setup();
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true, captchaToken: 'tok-2' });
  expect(auth.signInMagicLink.mock.calls[0][0].fetchOptions).toEqual({
    headers: { 'x-captcha-response': 'tok-2' },
  });
  expect(auth.signInMagicLink.mock.calls[0][0].captchaToken).toBeUndefined();
});

test('login with phoneNumber threads captchaToken into the phone sign-in call', async () => {
  const { auth, lowdefy } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ phoneNumber: '+27831234567', password: 'password123', captchaToken: 'tok-3' });
  expect(auth.signInPhoneNumber.mock.calls[0][0].fetchOptions).toEqual({
    headers: { 'x-captcha-response': 'tok-3' },
  });
});

test('login without captchaToken sends no fetchOptions', async () => {
  const { auth, lowdefy } = setup();
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(auth.signInEmail.mock.calls[0][0].fetchOptions).toBeUndefined();
});

test('signUp threads captchaToken as the x-captcha-response header', async () => {
  const { auth, lowdefy } = setup();
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({ email: 'user@example.com', password: 'password123', captchaToken: 'tok-4' });
  expect(auth.signUpEmail.mock.calls[0][0].fetchOptions).toEqual({
    headers: { 'x-captcha-response': 'tok-4' },
  });
  expect(auth.signUpEmail.mock.calls[0][0].captchaToken).toBeUndefined();
});

test('requestPasswordReset threads captchaToken on both the email and phone paths', async () => {
  const { auth, lowdefy } = setup();
  const { requestPasswordReset } = createAuthMethods(lowdefy, auth);
  await requestPasswordReset({ email: 'user@example.com', captchaToken: 'tok-5' });
  expect(auth.requestPasswordReset.mock.calls[0][0].fetchOptions).toEqual({
    headers: { 'x-captcha-response': 'tok-5' },
  });
  await requestPasswordReset({ phoneNumber: '+27831234567', captchaToken: 'tok-6' });
  expect(auth.phoneNumberRequestPasswordReset.mock.calls[0][0].fetchOptions).toEqual({
    headers: { 'x-captcha-response': 'tok-6' },
  });
});

test('sendVerificationEmail threads captchaToken as the x-captcha-response header', async () => {
  const { auth, lowdefy } = setup();
  const { sendVerificationEmail } = createAuthMethods(lowdefy, auth);
  await sendVerificationEmail({ email: 'user@example.com', captchaToken: 'tok-7' });
  expect(auth.sendVerificationEmail.mock.calls[0][0].fetchOptions).toEqual({
    headers: { 'x-captcha-response': 'tok-7' },
  });
});

test('phoneNumberSendOtp threads captchaToken as the x-captcha-response header', async () => {
  const { auth, lowdefy } = setup();
  const { phoneNumberSendOtp } = createAuthMethods(lowdefy, auth);
  await phoneNumberSendOtp({ phoneNumber: '+27831234567', captchaToken: 'tok-8' });
  expect(auth.phoneNumberSendOtp.mock.calls).toEqual([
    [
      {
        phoneNumber: '+27831234567',
        fetchOptions: { headers: { 'x-captcha-response': 'tok-8' } },
      },
    ],
  ]);
});
