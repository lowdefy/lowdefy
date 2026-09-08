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

// Spends the magic-link token from the landing page the sign-in email points
// at (auth.authPages.magicLink). The browser navigates to BetterAuth's verify
// endpoint, which sets the session cookie and redirects on, so the event chain
// ends here. Bind it to a real click: the landing page exists precisely because
// mail-security link scanners fetch the page, and a token spent on mount would
// be consumed by the scanner all the same.
function MagicLinkVerify({ methods: { magicLinkVerify }, params }) {
  return magicLinkVerify(params);
}

export default MagicLinkVerify;
