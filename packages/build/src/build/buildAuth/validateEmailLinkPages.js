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
import { ConfigWarning } from '@lowdefy/errors';

import findAuthPageRoute from '../buildRoutes/findAuthPageRoute.js';

// The auth pages an emailed link lands on when the action that sends it names
// no destination. Both paths have defaults (/verify-email, /reset-password), so
// an app that sends these emails without the page would land a person who
// followed the link on a 404.
const EMAIL_LINK_PAGES = [
  {
    role: 'verifyEmail',
    flow: 'Email verification',
    override: 'the SignUp or SendVerificationEmail action sets a callbackUrl',
  },
  {
    role: 'resetPassword',
    flow: 'Password reset',
    override: 'the RequestPasswordReset action sets redirectTo',
  },
];

// Both emails are sent when auth.email is configured and email and password
// sign-in is enabled.
function validateEmailLinkPages({ components, context }) {
  const { auth } = components;
  if (type.isNone(auth.email) || auth.emailAndPassword?.enabled !== true) {
    return;
  }
  EMAIL_LINK_PAGES.forEach(({ role, flow, override }) => {
    const path = auth.authPages[role];
    // An absolute URL points outside the app, so there is no page to look for.
    if (!type.isString(path) || !/^\/[^/]/.test(path)) {
      return;
    }
    if (!type.isNone(findAuthPageRoute({ routes: context.routes, url: path }))) {
      return;
    }
    const urlPath = path.slice(1).split(/[?#]/)[0];
    context.handleWarning(
      new ConfigWarning(
        `Auth "authPages.${role}" is "${path}", but the app has no page with path or id "${urlPath}". ${flow} links land there unless ${override}. Add the page, or set authPages.${role} to an existing one.`,
        { configKey: auth.authPages['~k'] ?? auth['~k'] }
      )
    );
  });
}

export default validateEmailLinkPages;
