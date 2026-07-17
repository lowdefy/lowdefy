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

// The auth page roles an app (auth.authPages) or a module manifest
// (auth.pages) may fill. Mirrors the authPages keys in lowdefySchema.js - a
// role added there is added here too. Most also get a path default in
// setAuthDefaults.js; acceptInvitation is the exception (intentionally unset).
const authPageRoles = [
  'signIn',
  'signUp',
  'error',
  'forgotPassword',
  'resetPassword',
  'verifyEmail',
  'acceptInvitation',
];

export default authPageRoles;
