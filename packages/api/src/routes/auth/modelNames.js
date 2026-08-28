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

// Fixed mapping from BetterAuth models to physical collection names - the
// user-* convention. Not configurable: modules that read auth collections
// natively are portable across apps only if these names are stable.
const modelNames = {
  user: 'users',
  session: 'user-sessions',
  account: 'user-accounts',
  verification: 'user-verifications',
  organization: 'user-organizations',
  member: 'user-members',
  invitation: 'user-invitations',
  twoFactor: 'user-two-factors',
  passkey: 'user-passkeys',
};

export default modelNames;
