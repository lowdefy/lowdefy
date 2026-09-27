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

// SignUp and SendVerificationEmail land the emailed verification link on
// authPages.verifyEmail unless the action sets a callbackUrl, and the path
// defaults to /verify-email. An app that sends verification email without that
// page would show a person who has just verified their address a 404.
function validateVerifyEmailPage({ components, context }) {
  const { auth } = components;
  if (type.isNone(auth.email) || auth.emailAndPassword?.enabled !== true) {
    return;
  }
  const path = auth.authPages.verifyEmail;
  // An absolute URL points outside the app, so there is no page to look for.
  if (!type.isString(path) || !/^\/[^/]/.test(path)) {
    return;
  }
  const pageId = path.slice(1).split(/[?#]/)[0];
  if ((components.pages ?? []).some((page) => page?.id === pageId)) {
    return;
  }
  context.handleWarning(
    new ConfigWarning(
      `Auth "authPages.verifyEmail" is "${path}", but the app has no page "${pageId}". Email verification links land there unless the SignUp or SendVerificationEmail action sets a callbackUrl. Add the page, or set authPages.verifyEmail to an existing one.`,
      { configKey: auth.authPages['~k'] ?? auth['~k'] }
    )
  );
}

export default validateVerifyEmailPage;
