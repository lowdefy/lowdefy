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
 * Whether a Screen page scrolls under its navigation bar, as the native stack lays it out: on iOS
 * 26 and later the bar is clear Liquid Glass over the page; before that, iOS makes the bar
 * translucent over the page for a large title or a search bar, and a Screen with a backgroundTint
 * has a clear bar over the page (getStackOptions). Otherwise (and on Android) the page
 * sits below the bar. A page under the bar starts its content at the bar's bottom edge with
 * automatic content insets, so a headerBottom pins under the bar at the header height; a page
 * below the bar pins it at the top of its scroll view.
 *
 * @param {Object} params
 * @param {Object} params.options The Screen's header options (client-native screen/Screen.js).
 * @param {string} params.platform Platform.OS.
 * @param {string|number} params.platformVersion Platform.Version: iOS gives a string, "26.0".
 * @returns {boolean}
 */
function isPageUnderHeader({ options, platform, platformVersion }) {
  if (platform !== 'ios') {
    return false;
  }
  if (Number.parseInt(`${platformVersion}`, 10) >= 26) {
    return true;
  }
  return (
    options.backgroundTint === true ||
    options.largeTitle === true ||
    options.headerSearch !== undefined
  );
}

export default isPageUnderHeader;
