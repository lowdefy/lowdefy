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

// A theme logo written as an app-relative path ("/logo.png", a public/ asset)
// resolves against the deployment's serverUrl + basePath, so one config works
// across environments. Absolute ("https://...") and protocol-relative ("//...")
// URLs pass through. Without a serverUrl an email client can never fetch a
// relative path, so the logo is dropped — EmailLayout falls back to the
// companyName text header, which beats a broken image.
function resolveThemeLogo({ theme, serverUrl, basePath }) {
  const { logo, ...rest } = theme;
  if (!type.isString(logo) || !logo.startsWith('/') || logo.startsWith('//')) {
    return theme;
  }
  if (type.isNone(serverUrl)) {
    return rest;
  }
  return { ...rest, logo: `${serverUrl}${basePath}${logo}` };
}

export default resolveThemeLogo;
