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

import { type } from '@lowdefy/helpers';

// The apple-app-site-association document that lets the app's iOS shells open
// its links (universal links), built from mobile.shells in mobile/config.json.
// A shell needs both a team id and a bundle id to be named here.
//
// Every page path under basePath opens in the shell, not only the mobile
// pages: listing those paths in a public file would tell a signed-out visitor
// which pages exist. A shell asked for a web page gets the surface gate's
// 404 { surface: 'web' } and opens it in the browser. API routes, auth
// callbacks among them, always reach the server.
//
// Returns null when no shell takes iOS links.
function createAppleAppSiteAssociation({ mobileConfig, basePath }) {
  const appIDs = (mobileConfig.shells ?? [])
    .filter((shell) => type.isString(shell.ios?.teamId) && type.isString(shell.ios?.bundleId))
    .map((shell) => `${shell.ios.teamId}.${shell.ios.bundleId}`);
  if (appIDs.length === 0) {
    return null;
  }
  return {
    applinks: {
      details: [
        {
          appIDs,
          components: [{ '/': `${basePath}/api/*`, exclude: true }, { '/': `${basePath}/*` }],
        },
      ],
    },
  };
}

export default createAppleAppSiteAssociation;
