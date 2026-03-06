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

import * as Sentry from '@sentry/nextjs';

function setSentryUser({ user, sentryConfig }) {
  // No-op if no user
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  const userFields = sentryConfig?.userFields || ['id', '_id'];
  const sentryUser = {};

  userFields.forEach((field) => {
    if (user[field] !== undefined) {
      sentryUser[field] = user[field];
    }
  });

  // Only set user if we have at least one field
  if (Object.keys(sentryUser).length > 0) {
    Sentry.setUser(sentryUser);
  }
}

export default setSentryUser;
