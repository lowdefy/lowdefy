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

// Thrown when an authorized caller has not enrolled a second factor and the
// deployment sets auth.twoFactor.required. Distinct from AuthenticationError on
// purpose: a 401 reads to the client as a dead session and bounces the user to
// sign-in, which is the redirect loop the enrolment gate exists to avoid, so this
// maps to 403. The server error handlers branch on the name before the
// structured-log and Sentry pipeline - under required: true this is expected
// traffic from every unenrolled caller, not a fault.
class TwoFactorEnrolmentRequiredError extends Error {
  constructor(message = 'Two-factor enrolment required.', { cause } = {}) {
    super(message, { cause });
    this.name = 'TwoFactorEnrolmentRequiredError';
    this.isLowdefyError = true;
  }
}

export default TwoFactorEnrolmentRequiredError;
