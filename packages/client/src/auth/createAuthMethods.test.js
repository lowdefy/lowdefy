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
import { Actions } from '@lowdefy/engine';
import createAuthMethods from './createAuthMethods.js';

function setup({ signInResult, signUpResult } = {}) {
  const assign = jest.fn();
  const lowdefy = {
    _internal: {
      globals: {
        window: { location: { assign, origin: 'https://app.lowdefy.test', search: '' } },
      },
    },
    home: { configured: false, pageId: 'home-page' },
  };
  const auth = {
    authConfig: { providers: [] },
    acceptInvitation: jest.fn(() => Promise.resolve({ data: { member: {} }, error: null })),
    addPasskey: jest.fn(() => Promise.resolve({ data: { id: 'passkey-1' }, error: null })),
    cancelInvitation: jest.fn(() => Promise.resolve({ data: { status: 'canceled' }, error: null })),
    changePassword: jest.fn(() =>
      Promise.resolve({ data: { token: null, user: {} }, error: null })
    ),
    deletePasskey: jest.fn(() => Promise.resolve({ data: { status: true }, error: null })),
    getResolvedUser: jest.fn(() =>
      Promise.resolve({ user: { id: 'user-1', roles: ['admin'], attributes: {} } })
    ),
    getSession: jest.fn(() =>
      Promise.resolve({
        data: { session: { activeOrganizationId: 'org-1' }, user: {} },
        error: null,
      })
    ),
    impersonateUser: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
    inviteMember: jest.fn(() => Promise.resolve({ data: { id: 'invitation-1' }, error: null })),
    leaveOrganization: jest.fn(() => Promise.resolve({ data: { member: {} }, error: null })),
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
    refreshSession: jest.fn(() =>
      Promise.resolve({ data: { session: {}, user: { id: 'user-1' } }, error: null })
    ),
    removeMember: jest.fn(() => Promise.resolve({ data: { member: {} }, error: null })),
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
    updateMemberRole: jest.fn(() => Promise.resolve({ data: { member: {} }, error: null })),
    updateOrganization: jest.fn(() =>
      Promise.resolve({ data: { id: 'org-1', name: 'Acme Inc' }, error: null })
    ),
    updateResolvedUser: jest.fn(),
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

test('login returns the two-factor challenge without navigating when authPages.twoFactor is unset', async () => {
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

test('twoFactorVerify navigates to the resolved callbackUrl on the TOTP branch', async () => {
  const { auth, lowdefy, assign } = setup();
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ code: '012345', callbackUrl: { url: '/reports' } });
  expect(assign.mock.calls).toEqual([['/reports']]);
});

test('twoFactorVerify navigates to the resolved callbackUrl on the backup-code branch', async () => {
  const { auth, lowdefy, assign } = setup();
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ backupCode: 'backup-1', callbackUrl: { url: '/reports' } });
  expect(assign.mock.calls).toEqual([['/reports']]);
});

test('twoFactorVerify navigates to the ?callbackUrl= the sign-in method carried onto the page', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Freports';
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ code: '012345' });
  expect(assign.mock.calls).toEqual([['/reports']]);
});

test('twoFactorVerify navigates to the ?callbackUrl= query as carried, without re-applying basePath', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.basePath = '/base';
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Fbase%2Freports';
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ code: '012345' });
  expect(assign.mock.calls).toEqual([['/base/reports']]);
});

test('twoFactorVerify with callbackUrl false stays put and does not throw', async () => {
  const { auth, lowdefy, assign } = setup();
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  const data = await twoFactorVerify({ code: '012345', callbackUrl: false });
  expect(assign).not.toHaveBeenCalled();
  expect(data).toEqual({ token: 't', user: {} });
});

test('twoFactorVerify does not navigate on a response carrying no session', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.twoFactorVerifyTotp = jest.fn(() => Promise.resolve({ data: { token: null }, error: null }));
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ code: '012345', callbackUrl: { url: '/reports' } });
  expect(assign).not.toHaveBeenCalled();
});

test('a protocol-relative ?callbackUrl= query never leaves the challenge page (open redirect)', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2F%2Fevil.com';
  const { twoFactorVerify } = createAuthMethods(lowdefy, auth);
  await twoFactorVerify({ code: '012345' });
  expect(assign.mock.calls).toEqual([['/home-page']]);
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

test('inviteMember calls auth.inviteMember with email and role', async () => {
  const { auth, lowdefy } = setup();
  const { inviteMember } = createAuthMethods(lowdefy, auth);
  await inviteMember({ email: 'invitee@example.com', role: 'admin' });
  expect(auth.inviteMember.mock.calls).toEqual([[{ email: 'invitee@example.com', role: 'admin' }]]);
});

test('inviteMember accepts a role array', async () => {
  const { auth, lowdefy } = setup();
  const { inviteMember } = createAuthMethods(lowdefy, auth);
  await inviteMember({ email: 'invitee@example.com', role: ['admin', 'user'] });
  expect(auth.inviteMember.mock.calls).toEqual([
    [{ email: 'invitee@example.com', role: ['admin', 'user'] }],
  ]);
});

test('inviteMember throws when email or role is missing', async () => {
  const { auth, lowdefy } = setup();
  const { inviteMember } = createAuthMethods(lowdefy, auth);
  await expect(inviteMember({ role: 'admin' })).rejects.toThrow(
    'InviteMember requires an "email" param.'
  );
  await expect(inviteMember({ email: 'invitee@example.com' })).rejects.toThrow(
    'InviteMember requires a "role" param.'
  );
  expect(auth.inviteMember).not.toHaveBeenCalled();
});

test('inviteMember surfaces the error returned by the endpoint', async () => {
  const { auth, lowdefy } = setup();
  auth.inviteMember = jest.fn(() =>
    Promise.resolve({
      data: null,
      error: {
        message: 'You are not allowed to invite users to this organization.',
        code: 'YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION',
        status: 403,
      },
    })
  );
  const { inviteMember } = createAuthMethods(lowdefy, auth);
  await expect(inviteMember({ email: 'invitee@example.com', role: 'admin' })).rejects.toThrow(
    'You are not allowed to invite users to this organization.'
  );
});

test('cancelInvitation calls auth.cancelInvitation with the invitationId param', async () => {
  const { auth, lowdefy } = setup();
  const { cancelInvitation } = createAuthMethods(lowdefy, auth);
  await cancelInvitation({ invitationId: 'invitation-1' });
  expect(auth.cancelInvitation.mock.calls).toEqual([[{ invitationId: 'invitation-1' }]]);
});

test('cancelInvitation throws when invitationId is missing', async () => {
  const { auth, lowdefy } = setup();
  const { cancelInvitation } = createAuthMethods(lowdefy, auth);
  await expect(cancelInvitation()).rejects.toThrow(
    'CancelInvitation requires an "invitationId" param.'
  );
  expect(auth.cancelInvitation).not.toHaveBeenCalled();
});

test('removeMember calls auth.removeMember with the memberIdOrEmail param', async () => {
  const { auth, lowdefy } = setup();
  const { removeMember } = createAuthMethods(lowdefy, auth);
  await removeMember({ memberIdOrEmail: 'member-1' });
  expect(auth.removeMember.mock.calls).toEqual([[{ memberIdOrEmail: 'member-1' }]]);
});

test('removeMember throws when memberIdOrEmail is missing', async () => {
  const { auth, lowdefy } = setup();
  const { removeMember } = createAuthMethods(lowdefy, auth);
  await expect(removeMember()).rejects.toThrow('RemoveMember requires a "memberIdOrEmail" param.');
  expect(auth.removeMember).not.toHaveBeenCalled();
});

test('updateMemberRole calls auth.updateMemberRole with memberId and role', async () => {
  const { auth, lowdefy } = setup();
  const { updateMemberRole } = createAuthMethods(lowdefy, auth);
  await updateMemberRole({ memberId: 'member-1', role: ['admin', 'user'] });
  expect(auth.updateMemberRole.mock.calls).toEqual([
    [{ memberId: 'member-1', role: ['admin', 'user'] }],
  ]);
});

test('updateMemberRole throws when memberId or role is missing', async () => {
  const { auth, lowdefy } = setup();
  const { updateMemberRole } = createAuthMethods(lowdefy, auth);
  await expect(updateMemberRole({ role: 'admin' })).rejects.toThrow(
    'UpdateMemberRole requires a "memberId" param.'
  );
  await expect(updateMemberRole({ memberId: 'member-1' })).rejects.toThrow(
    'UpdateMemberRole requires a "role" param.'
  );
  expect(auth.updateMemberRole).not.toHaveBeenCalled();
});

test('updateOrganization wraps the name param in the update data object', async () => {
  const { auth, lowdefy } = setup();
  const { updateOrganization } = createAuthMethods(lowdefy, auth);
  await updateOrganization({ name: 'Acme Inc' });
  expect(auth.updateOrganization.mock.calls).toEqual([[{ data: { name: 'Acme Inc' } }]]);
});

test('updateOrganization throws when name is missing', async () => {
  const { auth, lowdefy } = setup();
  const { updateOrganization } = createAuthMethods(lowdefy, auth);
  await expect(updateOrganization()).rejects.toThrow('UpdateOrganization requires a "name" param.');
  expect(auth.updateOrganization).not.toHaveBeenCalled();
});

test('leaveOrganization resolves the active organization from the session', async () => {
  const { auth, lowdefy } = setup();
  const { leaveOrganization } = createAuthMethods(lowdefy, auth);
  await leaveOrganization();
  expect(auth.leaveOrganization.mock.calls).toEqual([[{ organizationId: 'org-1' }]]);
});

test('leaveOrganization throws when the session has no active organization', async () => {
  const { auth, lowdefy } = setup();
  auth.getSession = jest.fn(() =>
    Promise.resolve({ data: { session: {}, user: {} }, error: null })
  );
  const { leaveOrganization } = createAuthMethods(lowdefy, auth);
  await expect(leaveOrganization()).rejects.toThrow(
    'LeaveOrganization requires an active organization on the session.'
  );
  expect(auth.leaveOrganization).not.toHaveBeenCalled();
});

test('leaveOrganization surfaces the error returned by the endpoint', async () => {
  const { auth, lowdefy } = setup();
  auth.leaveOrganization = jest.fn(() =>
    Promise.resolve({
      data: null,
      error: {
        message: 'You cannot leave the organization without an owner.',
        code: 'YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER',
        status: 400,
      },
    })
  );
  const { leaveOrganization } = createAuthMethods(lowdefy, auth);
  await expect(leaveOrganization()).rejects.toThrow(
    'You cannot leave the organization without an owner.'
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

test('login with phoneNumber does not navigate on a twoFactorRedirect response when authPages.twoFactor is unset', async () => {
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

test('phoneNumberVerify navigates to an explicit callbackUrl, basePath-prefixed', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.basePath = '/base';
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await phoneNumberVerify({
    phoneNumber: '+27831234567',
    code: '123456',
    callbackUrl: { url: '/reports' },
  });
  expect(assign.mock.calls).toEqual([['/base/reports']]);
});

test('phoneNumberVerify navigates to the ?callbackUrl= query when no param is given', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Freports';
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await phoneNumberVerify({ phoneNumber: '+27831234567', code: '123456' });
  expect(assign.mock.calls).toEqual([['/reports']]);
});

test('phoneNumberVerify with callbackUrl false stays put and does not throw', async () => {
  const { auth, lowdefy, assign } = setup();
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  const data = await phoneNumberVerify({
    phoneNumber: '+27831234567',
    code: '123456',
    callbackUrl: false,
  });
  expect(assign).not.toHaveBeenCalled();
  expect(data).toEqual({ token: 't', user: {} });
});

test('phoneNumberVerify does not navigate with disableSession, which mints no session', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.phoneNumberVerify = jest.fn(() =>
    Promise.resolve({ data: { token: null, user: {} }, error: null })
  );
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await phoneNumberVerify({
    phoneNumber: '+27831234567',
    code: '123456',
    disableSession: true,
    callbackUrl: { url: '/reports' },
  });
  expect(assign).not.toHaveBeenCalled();
});

test('phoneNumberVerify does not navigate when a signed-in user confirms a new phone number', async () => {
  // updatePhoneNumber returns the caller's existing session token, so a token
  // check alone would navigate away from the modal the confirmation runs in.
  const { auth, lowdefy, assign } = setup();
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await phoneNumberVerify({
    phoneNumber: '+27831234567',
    code: '123456',
    updatePhoneNumber: true,
    callbackUrl: { url: '/reports' },
  });
  expect(assign).not.toHaveBeenCalled();
});

test('phoneNumberVerify navigates to the challenge on a phone-number change that is challenged', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  auth.phoneNumberVerify = jest.fn(() => Promise.resolve({ data: challenge, error: null }));
  const { phoneNumberVerify } = createAuthMethods(lowdefy, auth);
  await phoneNumberVerify({
    phoneNumber: '+27831234567',
    code: '123456',
    updatePhoneNumber: true,
    callbackUrl: { url: '/reports' },
  });
  expect(assign.mock.calls).toEqual([['/two-factor-challenge?callbackUrl=%2Freports']]);
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

test('login with magicLink forwards newUserCallbackUrl and errorCallbackUrl as resolved targets', async () => {
  const { auth, lowdefy } = setup();
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    magicLink: true,
    callbackUrl: { pageId: 'dashboard' },
    newUserCallbackUrl: { pageId: 'welcome' },
    errorCallbackUrl: { pageId: 'link-expired' },
  });
  expect(auth.signInMagicLink.mock.calls).toEqual([
    [
      {
        email: 'user@example.com',
        callbackURL: '/dashboard',
        newUserCallbackURL: '/welcome',
        errorCallbackURL: '/link-expired',
      },
    ],
  ]);
});

test('login with magicLink basePath-prefixes newUserCallbackUrl and errorCallbackUrl like callbackUrl', async () => {
  const { auth, lowdefy } = setup();
  lowdefy.basePath = '/base';
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    magicLink: true,
    newUserCallbackUrl: { pageId: 'welcome' },
    errorCallbackUrl: { pageId: 'link-expired' },
  });
  const call = auth.signInMagicLink.mock.calls[0][0];
  expect(call.newUserCallbackURL).toEqual('/base/welcome');
  expect(call.errorCallbackURL).toEqual('/base/link-expired');
});

test('login with magicLink passes an absolute url target through unchanged, without basePath', async () => {
  const { auth, lowdefy } = setup();
  lowdefy.basePath = '/base';
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    magicLink: true,
    newUserCallbackUrl: { url: 'https://example.com/welcome' },
    errorCallbackUrl: { url: 'https://example.com/expired' },
  });
  const call = auth.signInMagicLink.mock.calls[0][0];
  expect(call.newUserCallbackURL).toEqual('https://example.com/welcome');
  expect(call.errorCallbackURL).toEqual('https://example.com/expired');
});

test('login names the offending param when an errorCallbackUrl target is ambiguous', async () => {
  const { auth, lowdefy } = setup();
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(
    login({
      email: 'user@example.com',
      magicLink: true,
      errorCallbackUrl: { pageId: 'expired', url: 'https://example.com/expired' },
    })
  ).rejects.toThrow(
    "Invalid errorCallbackUrl: To avoid ambiguity, only one of 'home', 'pageId' or 'url' can be defined."
  );
});

test('login with magicLink omits newUserCallbackURL and errorCallbackURL when the params are absent', async () => {
  const { auth, lowdefy } = setup();
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true, callbackUrl: { pageId: 'dashboard' } });
  const call = auth.signInMagicLink.mock.calls[0][0];
  expect('newUserCallbackURL' in call).toBe(false);
  expect('errorCallbackURL' in call).toBe(false);
});

test('login does not read the ?callbackUrl= query fallback for newUserCallbackUrl or errorCallbackUrl', async () => {
  const { auth, lowdefy } = setup();
  lowdefy._internal.globals.window.location.search = '?callbackUrl=/from-query';
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true });
  const call = auth.signInMagicLink.mock.calls[0][0];
  // The primary callbackUrl still honors the query fallback...
  expect(call.callbackURL).toEqual('/from-query');
  // ...but the two new params have no query source and are omitted.
  expect('newUserCallbackURL' in call).toBe(false);
  expect('errorCallbackURL' in call).toBe(false);
});

test('login with a social provider forwards newUserCallbackUrl and errorCallbackUrl', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.providers = [{ id: 'google', type: 'Google' }];
  auth.signInSocial = jest.fn(() => Promise.resolve({ data: { url: 'x' }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    providerId: 'google',
    callbackUrl: { pageId: 'dashboard' },
    newUserCallbackUrl: { pageId: 'welcome' },
    errorCallbackUrl: { pageId: 'sign-in-failed' },
  });
  expect(auth.signInSocial.mock.calls).toEqual([
    [
      {
        provider: 'google',
        callbackURL: '/dashboard',
        newUserCallbackURL: '/welcome',
        errorCallbackURL: '/sign-in-failed',
      },
    ],
  ]);
});

test('login with a GenericOAuth provider forwards newUserCallbackUrl and errorCallbackUrl', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.providers = [{ id: 'keycloak', type: 'GenericOAuth' }];
  auth.signInOauth2 = jest.fn(() => Promise.resolve({ data: { url: 'x' }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    providerId: 'keycloak',
    newUserCallbackUrl: { pageId: 'welcome' },
    errorCallbackUrl: { pageId: 'sign-in-failed' },
  });
  expect(auth.signInOauth2.mock.calls).toEqual([
    [
      {
        providerId: 'keycloak',
        callbackURL: '/home-page',
        newUserCallbackURL: '/welcome',
        errorCallbackURL: '/sign-in-failed',
      },
    ],
  ]);
});

test('login with magicLink defaults errorCallbackURL to authPages.error when no errorCallbackUrl is given', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.authPages = { error: '/auth/error' };
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true });
  expect(auth.signInMagicLink.mock.calls[0][0].errorCallbackURL).toEqual('/auth/error');
});

test('login with magicLink basePath-prefixes the defaulted authPages.error', async () => {
  const { auth, lowdefy } = setup();
  lowdefy.basePath = '/base';
  auth.authConfig.authPages = { error: '/auth/error' };
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true });
  expect(auth.signInMagicLink.mock.calls[0][0].errorCallbackURL).toEqual('/base/auth/error');
});

test('login with magicLink honors a caller errorCallbackUrl over the authPages.error default', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.authPages = { error: '/auth/error' };
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    magicLink: true,
    errorCallbackUrl: { pageId: 'link-expired' },
  });
  expect(auth.signInMagicLink.mock.calls[0][0].errorCallbackURL).toEqual('/link-expired');
});

test('login with magicLink omits errorCallbackURL when authPages.error is unset and no param is given', async () => {
  const { auth, lowdefy } = setup();
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true });
  expect('errorCallbackURL' in auth.signInMagicLink.mock.calls[0][0]).toBe(false);
});

test('the authPages.error default does not leak into newUserCallbackURL', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.authPages = { error: '/auth/error' };
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true });
  expect('newUserCallbackURL' in auth.signInMagicLink.mock.calls[0][0]).toBe(false);
});

test('login with a social provider carries the same defaulted authPages.error errorCallbackURL', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.providers = [{ id: 'google', type: 'Google' }];
  auth.authConfig.authPages = { error: '/auth/error' };
  auth.signInSocial = jest.fn(() => Promise.resolve({ data: { url: 'x' }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ providerId: 'google' });
  expect(auth.signInSocial.mock.calls[0][0].errorCallbackURL).toEqual('/auth/error');
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

// The callbackUrl precedence ladder: callbackUrl: false, then the explicit
// param, then the ?callbackUrl= query, then the app's home page, then a throw.

test('login with email and password lands on the home page when no callbackUrl and no query are given', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('an explicit callbackUrl still wins over a present ?callbackUrl= query', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Ffrom-query';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { pageId: 'dashboard' },
  });
  expect(assign.mock.calls).toEqual([['/dashboard']]);
});

test('the ?callbackUrl= query wins over the home default', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Ffrom-query';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/from-query']]);
});

test('the ?callbackUrl= query rung is not re-prefixed with basePath', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy.basePath = '/app';
  // Both producers of this query param already bake basePath into the value.
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Fapp%2Freports';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/app/reports']]);
});

test('the home default is basePath-prefixed', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy.basePath = '/app';
  lowdefy.home = { configured: true, pageId: 'dashboard' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/app/']]);
});

test('login with phoneNumber lands on the home page when no callbackUrl is given', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ phoneNumber: '+27831234567', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('passkeySignIn lands on the home page when no callbackUrl is given', async () => {
  const { auth, lowdefy, assign } = setup();
  const { passkeySignIn } = createAuthMethods(lowdefy, auth);
  await passkeySignIn();
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('signUp navigates to the home page when a token is present and no callbackUrl is given', async () => {
  const { auth, lowdefy, assign } = setup({ signUpResult: { token: 'session-token', user: {} } });
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({ email: 'user@example.com', password: 'password123' });
  expect(auth.signUpEmail.mock.calls[0][0].callbackURL).toEqual('/home-page');
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('signUp with requireEmailVerification still does not navigate, though a destination now resolves', async () => {
  const { auth, lowdefy, assign } = setup({ signUpResult: { token: null, user: {} } });
  const { signUp } = createAuthMethods(lowdefy, auth);
  await signUp({ email: 'user@example.com', password: 'password123' });
  // The emailed verification link still carries the resolved destination.
  expect(auth.signUpEmail.mock.calls[0][0].callbackURL).toEqual('/home-page');
  expect(assign).not.toHaveBeenCalled();
});

test('sendVerificationEmail defaults the emailed link to the home page', async () => {
  const { auth, lowdefy } = setup();
  const { sendVerificationEmail } = createAuthMethods(lowdefy, auth);
  await sendVerificationEmail({ email: 'user@example.com' });
  expect(auth.sendVerificationEmail.mock.calls[0][0].callbackURL).toEqual('/home-page');
});

test('sendVerificationEmail lands the emailed link inside the app under a basePath', async () => {
  const { auth, lowdefy } = setup();
  lowdefy.basePath = '/app';
  lowdefy.home = { configured: true, pageId: 'dashboard' };
  const { sendVerificationEmail } = createAuthMethods(lowdefy, auth);
  await sendVerificationEmail({ email: 'user@example.com' });
  // Not "/", which BetterAuth would resolve against its baseURL to the origin
  // root - outside the app.
  expect(auth.sendVerificationEmail.mock.calls[0][0].callbackURL).toEqual('/app/');
});

test('login with magicLink defaults callbackURL to the home page inside the app', async () => {
  const { auth, lowdefy } = setup();
  lowdefy.basePath = '/app';
  lowdefy.home = { configured: true, pageId: 'dashboard' };
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', magicLink: true });
  expect(auth.signInMagicLink.mock.calls[0][0].callbackURL).toEqual('/app/');
});

test('login with a social provider defaults callbackURL to the home page inside the app', async () => {
  const { auth, lowdefy } = setup();
  lowdefy.basePath = '/app';
  lowdefy.home = { configured: true, pageId: 'dashboard' };
  auth.authConfig.providers = [{ id: 'google', type: 'Google' }];
  auth.signInSocial = jest.fn(() => Promise.resolve({ data: { url: 'x' }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ providerId: 'google' });
  expect(auth.signInSocial.mock.calls[0][0].callbackURL).toEqual('/app/');
});

test('login throws when no destination resolves and the home config names no page', async () => {
  const { auth, lowdefy, assign } = setup();
  // What getHomeAndMenus returns for an app with no homePageId and no menu link.
  lowdefy.home = { configured: false, pageId: null };
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(login({ email: 'user@example.com', password: 'password123' })).rejects.toThrow(
    'Invalid callbackUrl: no destination resolved. The app has no resolvable home page - set homePageId, give an explicit callbackUrl, or use "callbackUrl: false" to stay on the page.'
  );
  expect(assign).not.toHaveBeenCalled();
  // The destination resolves before the sign-in call, so the throw mints no
  // session - a login page mapping the failure to "sign-in failed" is telling
  // the truth. Reordering the resolve below the call would make it a lie.
  expect(auth.signInEmail).not.toHaveBeenCalled();
});

test('login throws the callbackUrl error, not a TypeError, when lowdefy.home is absent', async () => {
  const { auth, lowdefy } = setup();
  delete lowdefy.home;
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(login({ email: 'user@example.com', password: 'password123' })).rejects.toThrow(
    'Invalid callbackUrl: no destination resolved. The app has no resolvable home page - set homePageId, give an explicit callbackUrl, or use "callbackUrl: false" to stay on the page.'
  );
});

test('an explicit callbackUrl home target throws instead of resolving to /undefined', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.home = { configured: false, pageId: null };
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(
    login({ email: 'user@example.com', password: 'password123', callbackUrl: { home: true } })
  ).rejects.toThrow('Invalid callbackUrl: no destination resolved.');
  expect(assign).not.toHaveBeenCalled();
});

test('logout with a home callbackUrl does not navigate when the home config names no page', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.home = { configured: false, pageId: null };
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  auth.suppressSignOutReload = jest.fn();
  const { logout } = createAuthMethods(lowdefy, auth);
  // logout gains no default and no throw, but inherits the correctness fix -
  // the post-sign-out reload takes over instead of navigating to /undefined.
  await logout({ callbackUrl: { home: true } });
  expect(assign).not.toHaveBeenCalled();
  expect(auth.suppressSignOutReload).not.toHaveBeenCalled();
});

test('login with email and callbackUrl false mints the session without navigating', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  const { login } = createAuthMethods(lowdefy, auth);
  const data = await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: false,
  });
  expect(assign).not.toHaveBeenCalled();
  expect(data).toEqual({ token: 't', user: {} });
});

test('login with phoneNumber and callbackUrl false does not navigate', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ phoneNumber: '+27831234567', password: 'password123', callbackUrl: false });
  expect(assign).not.toHaveBeenCalled();
});

test('passkeySignIn with callbackUrl false does not navigate', async () => {
  const { auth, lowdefy, assign } = setup();
  const { passkeySignIn } = createAuthMethods(lowdefy, auth);
  const data = await passkeySignIn({ callbackUrl: false });
  expect(assign).not.toHaveBeenCalled();
  expect(data).toEqual({ session: {}, user: {} });
});

test('callbackUrl false wins over a present ?callbackUrl= query', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Ffrom-query';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123', callbackUrl: false });
  expect(assign).not.toHaveBeenCalled();
});

test('login with magicLink and callbackUrl false throws - the redirect hop is not ours to suppress', async () => {
  const { auth, lowdefy } = setup();
  auth.signInMagicLink = jest.fn(() => Promise.resolve({ data: { status: true }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(
    login({ email: 'user@example.com', magicLink: true, callbackUrl: false })
  ).rejects.toThrow(
    'Invalid callbackUrl: "false" is not valid for Login with magicLink, which redirects through an external hop. Give a destination.'
  );
  expect(auth.signInMagicLink).not.toHaveBeenCalled();
});

test('login with a provider and callbackUrl false throws', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.providers = [{ id: 'google', type: 'Google' }];
  auth.signInSocial = jest.fn(() => Promise.resolve({ data: { url: 'x' }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await expect(login({ providerId: 'google', callbackUrl: false })).rejects.toThrow(
    'Invalid callbackUrl: "false" is not valid for Login with a provider, which redirects through an external hop. Give a destination.'
  );
  expect(auth.signInSocial).not.toHaveBeenCalled();
});

test('signUp with callbackUrl false throws - the same value is the emailed link', async () => {
  const { auth, lowdefy } = setup();
  const { signUp } = createAuthMethods(lowdefy, auth);
  await expect(
    signUp({ email: 'user@example.com', password: 'password123', callbackUrl: false })
  ).rejects.toThrow(
    'Invalid callbackUrl: "false" is not valid for SignUp, which redirects through an external hop. Give a destination.'
  );
  expect(auth.signUpEmail).not.toHaveBeenCalled();
});

test('sendVerificationEmail with callbackUrl false throws', async () => {
  const { auth, lowdefy } = setup();
  const { sendVerificationEmail } = createAuthMethods(lowdefy, auth);
  await expect(
    sendVerificationEmail({ email: 'user@example.com', callbackUrl: false })
  ).rejects.toThrow(
    'Invalid callbackUrl: "false" is not valid for SendVerificationEmail, which redirects through an external hop. Give a destination.'
  );
  expect(auth.sendVerificationEmail).not.toHaveBeenCalled();
});

test('logout with an empty url callbackUrl neither navigates nor suppresses the reload', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy.basePath = '/base';
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  auth.suppressSignOutReload = jest.fn();
  const { logout } = createAuthMethods(lowdefy, auth);
  // The one input where resolving through resolveTargetURL changes when the
  // basePath prefix is applied - willNavigate must stay false either way.
  await logout({ callbackUrl: { url: '' } });
  expect(assign).not.toHaveBeenCalled();
  expect(auth.suppressSignOutReload).not.toHaveBeenCalled();
});

// The ?callbackUrl= query is attacker-supplied - a crafted sign-in link is the
// whole point of an open redirect - and on the email, phone and passkey paths it
// reaches window.location.assign without BetterAuth ever seeing it.

test('a protocol-relative ?callbackUrl= query is rejected and falls through to the home default', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2F%2Fevil.com';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('a backslash-obfuscated protocol-relative ?callbackUrl= query is rejected', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  // Browsers normalize the backslash to a slash, making this off-site too.
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2F%5Cevil.com';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('an absolute ?callbackUrl= query is rejected and falls through to the home default', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy._internal.globals.window.location.search = '?callbackUrl=https%3A%2F%2Fevil.com';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('a bare "/" ?callbackUrl= query is still accepted', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2F';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  expect(assign.mock.calls).toEqual([['/']]);
});

// A callbackUrl that resolves to something other than an object is absence, not
// an error - an operator with no matching branch resolves to null, and the bare
// string the schemas wrongly declared before this change is still common in apps.

test('a null callbackUrl falls through to the home default instead of throwing a TypeError', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123', callbackUrl: null });
  expect(assign.mock.calls).toEqual([['/home-page']]);
});

test('a null callbackUrl on logout neither navigates nor throws', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.signOut = jest.fn(() => Promise.resolve({ data: { success: true }, error: null }));
  const { logout } = createAuthMethods(lowdefy, auth);
  await logout({ callbackUrl: null });
  expect(assign).not.toHaveBeenCalled();
});

test('a string callbackUrl falls through the ladder rather than failing the sign-in', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy.basePath = '/app';
  lowdefy.home = { configured: true, pageId: 'router' };
  const { login } = createAuthMethods(lowdefy, auth);
  // The spelling the schemas wrongly declared before this change, still written
  // by apps in the wild: it expresses none of the four target keys, so the home
  // rung answers. Reading it as { url } instead would basePath-prefix a value
  // that is usually the already-prefixed query, yielding /app/app/reports.
  await login({ email: 'user@example.com', password: 'password123', callbackUrl: '/' });
  expect(assign.mock.calls).toEqual([['/app/']]);
});

test('a string callbackUrl leaves a present ?callbackUrl= query to answer, un-prefixed', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  lowdefy.basePath = '/app';
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Fapp%2Freports';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: '/app/reports',
  });
  expect(assign.mock.calls).toEqual([['/app/reports']]);
});

test('a non-object newUserCallbackUrl is omitted so BetterAuth defaults it to callbackUrl', async () => {
  const { auth, lowdefy } = setup();
  auth.authConfig.providers = [{ id: 'google', type: 'Google' }];
  auth.signInSocial = jest.fn(() => Promise.resolve({ data: { url: 'x' }, error: null }));
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ providerId: 'google', newUserCallbackUrl: '/welcome' });
  expect(auth.signInSocial.mock.calls[0][0].newUserCallbackURL).toBeUndefined();
});

test('sendVerificationEmail reports a missing email before judging the callbackUrl', async () => {
  const { auth, lowdefy } = setup();
  const { sendVerificationEmail } = createAuthMethods(lowdefy, auth);
  await expect(sendVerificationEmail({ callbackUrl: false })).rejects.toThrow(
    'SendVerificationEmail requires an "email" param.'
  );
});

test('updateSession awaits the store refetch, with disableCookieCache, before resolving the user', async () => {
  const { auth, lowdefy } = setup();
  const order = [];
  auth.refreshSession = jest.fn(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          order.push('refreshSession resolved');
          resolve({ data: { session: {}, user: { id: 'user-1' } }, error: null });
        }, 0);
      })
  );
  auth.getResolvedUser = jest.fn(() => {
    order.push('getResolvedUser called');
    return Promise.resolve({ user: { id: 'user-1', roles: ['admin'], attributes: {} } });
  });
  const { updateSession } = createAuthMethods(lowdefy, auth);
  await updateSession();
  expect(auth.refreshSession.mock.calls).toEqual([[{ disableCookieCache: true }]]);
  expect(order).toEqual(['refreshSession resolved', 'getResolvedUser called']);
});

test('updateSession updates the resolved user ref and lowdefy.user from /api/user', async () => {
  const { auth, lowdefy } = setup();
  const resolved = { id: 'user-1', roles: ['admin'], attributes: { plan: 'pro' } };
  auth.getResolvedUser = jest.fn(() => Promise.resolve({ user: resolved }));
  const { updateSession } = createAuthMethods(lowdefy, auth);
  await updateSession();
  expect(auth.updateResolvedUser.mock.calls).toEqual([[resolved]]);
  expect(lowdefy.user).toEqual(resolved);
});

test('updateSession throws when the session refresh fails and never reaches /api/user', async () => {
  const { auth, lowdefy } = setup();
  auth.refreshSession = jest.fn(() =>
    Promise.resolve({ data: null, error: { message: 'Failed to fetch the session.', status: 500 } })
  );
  lowdefy.user = { id: 'user-1' };
  const { updateSession } = createAuthMethods(lowdefy, auth);
  await expect(updateSession()).rejects.toThrow('Failed to fetch the session.');
  expect(auth.getResolvedUser).not.toHaveBeenCalled();
  expect(lowdefy.user).toEqual({ id: 'user-1' });
});

test('updateSession throws when a session is present but no user resolves, instead of nulling', async () => {
  const { auth, lowdefy } = setup();
  auth.getResolvedUser = jest.fn(() => Promise.resolve({ user: null }));
  lowdefy.user = { id: 'user-1' };
  const { updateSession } = createAuthMethods(lowdefy, auth);
  await expect(updateSession()).rejects.toThrow(
    'UpdateSession failed: a session is active but the server resolved no user.'
  );
  expect(auth.updateResolvedUser).not.toHaveBeenCalled();
  expect(lowdefy.user).toEqual({ id: 'user-1' });
});

test('updateSession nulls the user when the session is genuinely absent', async () => {
  const { auth, lowdefy } = setup();
  auth.refreshSession = jest.fn(() => Promise.resolve({ data: null, error: null }));
  auth.getResolvedUser = jest.fn(() => Promise.resolve({ user: null }));
  lowdefy.user = { id: 'user-1' };
  const { updateSession } = createAuthMethods(lowdefy, auth);
  await updateSession();
  expect(auth.updateResolvedUser.mock.calls).toEqual([[null]]);
  expect(lowdefy.user).toBe(null);
});

// The two-factor challenge destination belongs to the engine, not the login page:
// a page that omits the routing leaves an enrolled user unable to sign in with
// nothing to show for the click.

const challenge = { twoFactorRedirect: true, twoFactorMethods: ['totp'] };

// Ending the event chain is only observable through the chain itself, so these
// run the engine's Actions over the auth methods exactly as the Login and
// PhoneNumberVerify action plugins do, with a following step whose recorded
// response says whether it ran.
function callActionChain({ actions, auth, lowdefy }) {
  const next = jest.fn(() => 'next');
  const context = {
    _internal: {
      lowdefy: {
        _internal: {
          actions: {
            Login: ({ methods, params }) => methods.login(params),
            Next: next,
            PhoneNumberVerify: ({ methods, params }) => methods.phoneNumberVerify(params),
            TwoFactorVerify: ({ methods, params }) => methods.twoFactorVerify(params),
          },
          auth: createAuthMethods(lowdefy, auth),
          displayMessage: () => () => undefined,
          globals: lowdefy._internal.globals,
          translate: (key) => key,
        },
      },
      parser: { parse: ({ input }) => ({ output: input, errors: [] }) },
    },
  };
  return new Actions(context).callActions({
    actions,
    arrayIndices: [],
    block: { blockId: 'login-button' },
    catchActions: [],
    event: {},
    eventName: 'onClick',
  });
}

function loginChain({ auth, lowdefy, params }) {
  return callActionChain({
    actions: [
      { id: 'login', type: 'Login', params },
      { id: 'after', type: 'Next' },
    ],
    auth,
    lowdefy,
  });
}

test('login navigates to authPages.twoFactor on a two-factor challenge, carrying the callbackUrl', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/dashboard' },
  });
  expect(assign.mock.calls).toEqual([['/two-factor-challenge?callbackUrl=%2Fdashboard']]);
});

test('login basePath-prefixes the authPages.twoFactor challenge destination', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  lowdefy.basePath = '/base';
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/dashboard' },
  });
  expect(assign.mock.calls).toEqual([
    ['/base/two-factor-challenge?callbackUrl=%2Fbase%2Fdashboard'],
  ]);
});

test('login keeps the origin of an absolute authPages.twoFactor', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: 'https://id.example.com/2fa' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/dashboard' },
  });
  expect(assign.mock.calls).toEqual([['https://id.example.com/2fa?callbackUrl=%2Fdashboard']]);
});

test('login carries a deep-link callbackUrl onto the two-factor challenge', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/invoices/123' },
  });
  expect(assign.mock.calls).toEqual([['/two-factor-challenge?callbackUrl=%2Finvoices%2F123']]);
});

test('login merges the callbackUrl into an authPages.twoFactor that already carries a query', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: '/2fa?x=1' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: '/dashboard' },
  });
  expect(assign.mock.calls).toEqual([['/2fa?x=1&callbackUrl=%2Fdashboard']]);
});

test('a protocol-relative ?callbackUrl= query never reaches the two-factor challenge (open redirect)', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2F%2Fevil.com';
  const { login } = createAuthMethods(lowdefy, auth);
  await login({ email: 'user@example.com', password: 'password123' });
  // The crafted value is rejected before it becomes the callbackURL, so the home
  // default is what rides along - the challenge page can never be talked into
  // sending a completed challenge off-site.
  expect(assign.mock.calls).toEqual([['/two-factor-challenge?callbackUrl=%2Fhome-page']]);
});

test('login omits the callbackUrl parameter from the challenge when the destination is off-origin', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    email: 'user@example.com',
    password: 'password123',
    callbackUrl: { url: 'https://elsewhere.example.com/landing' },
  });
  expect(assign.mock.calls).toEqual([['/two-factor-challenge']]);
});

test('login with phoneNumber and password navigates to the two-factor challenge on the flag', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const { login } = createAuthMethods(lowdefy, auth);
  await login({
    phoneNumber: '+27831234567',
    password: 'password123',
    callbackUrl: { url: '/dashboard' },
  });
  expect(assign.mock.calls).toEqual([['/two-factor-challenge?callbackUrl=%2Fdashboard']]);
});

test('the two-factor challenge navigation ends the event chain, leaving the response unchanged', async () => {
  const { auth, lowdefy } = setup({ signInResult: challenge });
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const res = await loginChain({
    auth,
    lowdefy,
    params: { email: 'user@example.com', password: 'password123' },
  });
  expect(res.success).toBe(true);
  expect(res.responses.login).toEqual({
    type: 'Login',
    index: 0,
    response: challenge,
    stoppedChain: true,
  });
  expect(res.responses.after).toEqual({ type: 'Next', skipped: true, index: 1 });
});

test('a two-factor challenge with no configured page does not end the event chain', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: challenge });
  const res = await loginChain({
    auth,
    lowdefy,
    params: { email: 'user@example.com', password: 'password123' },
  });
  expect(assign).not.toHaveBeenCalled();
  expect(res.responses.login).toEqual({ type: 'Login', index: 0, response: challenge });
  expect(res.responses.after).toEqual({ type: 'Next', response: 'next', index: 1 });
});

test('a login that returns a session navigates to the callbackUrl and does not end the event chain', async () => {
  const { auth, lowdefy, assign } = setup({ signInResult: { token: 't', user: {} } });
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const res = await loginChain({
    auth,
    lowdefy,
    params: { email: 'user@example.com', password: 'password123', callbackUrl: { url: '/dash' } },
  });
  expect(assign.mock.calls).toEqual([['/dash']]);
  expect(res.responses.after).toEqual({ type: 'Next', response: 'next', index: 1 });
});

test('phoneNumberVerify carries the resolved callbackUrl onto the two-factor challenge and ends the chain', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  auth.phoneNumberVerify = jest.fn(() => Promise.resolve({ data: challenge, error: null }));
  const res = await callActionChain({
    actions: [
      {
        id: 'verify',
        type: 'PhoneNumberVerify',
        params: { phoneNumber: '+27831234567', code: '123456' },
      },
      { id: 'after', type: 'Next' },
    ],
    auth,
    lowdefy,
  });
  expect(assign.mock.calls).toEqual([['/two-factor-challenge?callbackUrl=%2Fhome-page']]);
  expect(res.responses.verify).toEqual({
    type: 'PhoneNumberVerify',
    index: 0,
    response: challenge,
    stoppedChain: true,
  });
  expect(res.responses.after).toEqual({ type: 'Next', skipped: true, index: 1 });
});

test('phoneNumberVerify navigates on a successful verification without ending the chain', async () => {
  const { auth, lowdefy, assign } = setup();
  auth.authConfig.authPages = { twoFactor: '/two-factor-challenge' };
  const res = await callActionChain({
    actions: [
      {
        id: 'verify',
        type: 'PhoneNumberVerify',
        params: { phoneNumber: '+27831234567', code: '123456' },
      },
      { id: 'after', type: 'Next' },
    ],
    auth,
    lowdefy,
  });
  expect(assign.mock.calls).toEqual([['/home-page']]);
  expect(res.responses.verify).toEqual({
    type: 'PhoneNumberVerify',
    index: 0,
    response: { token: 't', user: {} },
  });
  expect(res.responses.after).toEqual({ type: 'Next', response: 'next', index: 1 });
});

test('twoFactorVerify navigates on a successful challenge without ending the chain', async () => {
  const { auth, lowdefy, assign } = setup();
  lowdefy._internal.globals.window.location.search = '?callbackUrl=%2Freports';
  const res = await callActionChain({
    actions: [
      { id: 'verify', type: 'TwoFactorVerify', params: { code: '012345' } },
      { id: 'after', type: 'Next' },
    ],
    auth,
    lowdefy,
  });
  expect(assign.mock.calls).toEqual([['/reports']]);
  expect(res.responses.after).toEqual({ type: 'Next', response: 'next', index: 1 });
});
