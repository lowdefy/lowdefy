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

import { APIError } from 'better-auth/api';

import isEmailAdmitted from './isEmailAdmitted.js';

// The engine-tier user.create.before admission gate. Every provider mints its
// user row here at first sign-in, before any session exists - the seam this
// gate uses to refuse an unadmitted email one step ahead of the session.create
// wall, so no orphan user (and, since this runs before the merge-on-signup
// hook, no orphan contact) is ever written.
//
// It throws instead of returning false so the rejection carries the
// MEMBERSHIP_REQUIRED code and matches the wall, message included: the magic
// link and OAuth callbacks redirect a refusal with the code in ?error= and the
// message in error_description, so a new user refused here and an existing one
// refused at the wall land on the error page with the same text.
//
// A no-op under open (isEmailAdmitted returns admitted), so it never blocks a
// legitimate open signup.
function createAdmissionGateHook({ getAuth, organizations }) {
  return async function admissionGateHook(user) {
    const auth = getAuth();
    const { adapter, internalAdapter } = await auth.$context;
    const admitted = await isEmailAdmitted({
      email: user.email,
      organizations,
      auth,
      adapter,
      internalAdapter,
    });
    if (!admitted) {
      throw new APIError('FORBIDDEN', {
        message: 'You have not been granted access to this application.',
        code: 'MEMBERSHIP_REQUIRED',
      });
    }
  };
}

export default createAdmissionGateHook;
