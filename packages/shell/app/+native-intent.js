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

// Links that are not page paths:
// - The sign-in sheet's Android app link (/auth/mobile/callback) carries a one-time token that
//   signInWithSheet reads from the sheet's result; the router leaves it alone.
// - A Lowdefy Dev link (lowdefy-dev://connect, lowdefy-dev://menu): Lowdefy Dev handles it
//   (src/dev). A release shell has no developer features and routes every other link.
// - A shortcut link (<scheme>://shortcut/<id>, from Siri and Spotlight) and the share extension's
//   link (<scheme>://expo-sharing): the shell's shortcut and share-in services handle them
//   (src/native).
// - A link to the app's own site (a universal link or Android app link): opened as its page path.
import { redirectDevLink } from '../src/dev/index.js';
import getShellConfig from '../src/config/getShellConfig.js';
import isSheetReturnLink from '../src/auth/isSheetReturnLink.js';
import parseShellLink from '../src/native/parseShellLink.js';
import toAppLinkPath from '../src/navigation/toAppLinkPath.js';

export function redirectSystemPath({ initial, path }) {
  if (isSheetReturnLink(path) || parseShellLink(path) !== null) {
    return initial ? '/' : null;
  }
  const { app, environment } = getShellConfig();
  const pagePath = toAppLinkPath({ appUrl: app.urls[environment], path });
  return redirectDevLink ? redirectDevLink({ initial, path: pagePath }) : pagePath;
}
