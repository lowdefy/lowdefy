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

// The link without its query or fragment. React Native's URL has no working pathname, so the
// link is cut by hand, as parseQuery reads its query.
function stripQuery(link) {
  const end = link.search(/[?#]/);
  return end === -1 ? link : link.slice(0, end);
}

/**
 * Whether a link the router is opening is the sign-in sheet's return: the Android app link
 * <app url>/auth/mobile/callback (getSheetReturnUrl). signInWithSheet reads it from the sheet's
 * result, so the router must not open it as a page: its query holds the one-time token.
 *
 * @param {string} link The URL, or the path, Expo Router received.
 */
function isSheetReturnLink(link) {
  return /^(https:\/\/[^/]+)?(\/.*)?\/auth\/mobile\/callback\/?$/.test(stripQuery(link));
}

export default isSheetReturnLink;
