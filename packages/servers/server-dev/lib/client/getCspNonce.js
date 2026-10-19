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

// The page's Content-Security-Policy nonce, from the csp-nonce meta tag the server
// writes when config.security.contentSecurityPolicy is on (Vite reads the same tag).
// Browsers hide nonce attributes from getAttribute, so it is read from the property.
// An empty string when the policy is off.
function getCspNonce() {
  return document.querySelector('meta[property="csp-nonce"]')?.nonce ?? '';
}

export default getCspNonce;
