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

import { handleNotificationLanding } from '@lowdefy/api';

import authJson from '../../lib/build/auth.js';

// Notification email links land here: session check, mark-as-read, redirect to
// the target resolved from the stored record data. Session enforcement is
// presence-only (engine-agnostic); the api layer owns the record lookup.
async function notificationLandingHandler(c) {
  const context = c.get('lowdefyContext');
  const basePath = context.config?.basePath ?? '';

  if (authJson.configured === true && !context.session) {
    const query = new URLSearchParams({ callbackUrl: c.req.url });
    return c.redirect(`${basePath}/api/auth/signin?${query}`, 302);
  }

  const { _id: recordId, option, n: notificationId } = c.req.query();
  if (!recordId || !notificationId) {
    return c.redirect(`${basePath}/`, 302);
  }

  const { redirect } = await handleNotificationLanding(context, {
    recordId,
    notificationId,
    option,
  });
  return c.redirect(redirect.startsWith('http') ? redirect : `${basePath}${redirect}`, 302);
}

export default notificationLandingHandler;
