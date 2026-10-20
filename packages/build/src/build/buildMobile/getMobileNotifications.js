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

function getAction(action) {
  return {
    id: action.id,
    title: action.title,
    endpointId: action.endpointId ?? null,
    input: type.isObject(action.input)
      ? { placeholder: action.input.placeholder ?? null, buttonTitle: action.input.buttonTitle ?? null }
      : null,
    snooze: action.snooze ?? null,
    destructive: action.destructive ?? false,
    authenticationRequired: action.authenticationRequired ?? false,
  };
}

// mobile.notifications with every default written, so the shell reads each key without
// fallbacks: no endpoints, banners while the app is open, and no categories.
function getMobileNotifications({ mobile }) {
  const notifications = mobile.notifications ?? {};
  return {
    register: notifications.register ?? null,
    unregister: notifications.unregister ?? null,
    foreground: notifications.foreground ?? 'banner',
    categories: (notifications.categories ?? []).map((category) => ({
      id: category.id,
      actions: category.actions.map(getAction),
    })),
  };
}

export default getMobileNotifications;
