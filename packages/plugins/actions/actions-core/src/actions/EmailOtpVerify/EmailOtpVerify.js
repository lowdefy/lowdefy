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

// Signs the user in with the emailed one-time code. On success the session
// cookie is set (creating the user on first sign-in unless disableSignUp) and
// the browser lands on the resolved callbackUrl - or on the two-factor
// challenge page when the user is enrolled.
function EmailOtpVerify({ methods: { emailOtpVerify }, params }) {
  return emailOtpVerify(params);
}

export default EmailOtpVerify;
