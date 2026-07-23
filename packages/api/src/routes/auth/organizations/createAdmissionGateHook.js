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
// MEMBERSHIP_REQUIRED code and matches the wall. The message is set to the same
// machine token deliberately: the OAuth path surfaces the throw's message (not
// its code) on the error-callback redirect, so equal message and code land a
// consistent ?error=MEMBERSHIP_REQUIRED across every provider.
//
// A no-op under open and tenant (isEmailAdmitted returns admitted), so it never
// blocks a legitimate open signup or self-serve tenant creation.
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
        message: 'MEMBERSHIP_REQUIRED',
        code: 'MEMBERSHIP_REQUIRED',
      });
    }
  };
}

export default createAdmissionGateHook;
