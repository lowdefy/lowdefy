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

// The exhaustive launch set of bindable auth hook points. BetterAuth can hook
// every model write, but unlisted points are deliberately not bindable -
// adding a point later is an additive, non-breaking change.
// Twin catalog: packages/api/src/routes/auth/hooks/authHookPoints.js maps the
// same point names to their runtime definitions - a point added here without
// a runtime definition crashes buildHooks at startup; keep the two in sync.
const authHookPoints = [
  'user.create.before',
  'user.create.after',
  'user.update.before',
  'user.update.after',
  'session.create.before',
  'session.create.after',
  'session.update.before',
  'session.delete.after',
  'account.create.before',
  'account.create.after',
  'verification.create.before',
  'verification.create.after',
  'email.verified',
  'phone.otp.send',
  'phone.passwordReset.send',
  'phone.verified',
];

export default authHookPoints;
