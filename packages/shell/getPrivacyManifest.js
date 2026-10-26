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

/**
 * The iOS privacy manifest (`ios.privacyManifests`) of a shell on a capability profile: the
 * required-reason APIs its modules use (profiles.js `privacyReasons`, where `basic` holds React
 * Native's and expo-sqlite's, so every profile carries them), each category listed once. App Store
 * Connect refuses an upload whose binary uses one of these APIs without a declared reason.
 *
 * @param {Object} params
 * @param {{ category: string, reasons: string[] }[]} params.privacyReasons The resolved profile's.
 */
function getPrivacyManifest({ privacyReasons }) {
  const byCategory = new Map();
  privacyReasons.forEach(({ category, reasons }) => {
    byCategory.set(category, [...new Set([...(byCategory.get(category) ?? []), ...reasons])]);
  });
  return {
    NSPrivacyAccessedAPITypes: [...byCategory.entries()].map(([category, reasons]) => ({
      NSPrivacyAccessedAPIType: category,
      NSPrivacyAccessedAPITypeReasons: reasons,
    })),
  };
}

module.exports = getPrivacyManifest;
