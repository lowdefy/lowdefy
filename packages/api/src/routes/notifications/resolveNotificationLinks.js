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

import { serializer, type, urlQuery } from '@lowdefy/helpers';

function resolveLinkValue({ link, option, baseUrl, recordId, notificationId }) {
  // Absolute URLs pass through — links into other apps or external destinations.
  // They skip the landing page, so they carry no mark-as-read.
  if (type.isString(link)) {
    return link;
  }
  if (type.isObject(link) && !type.isNone(link.pageId)) {
    const query = urlQuery.stringify({ _id: recordId, option, n: notificationId });
    return `${baseUrl}?${query}`;
  }
  return link;
}

// Resolves link values in a copy of the data item to landing-page URLs; the
// stored record keeps the original { pageId, urlQuery } objects for in-app
// navigation. The option query param is the dot-path of the link inside data —
// the landing route reads the original link back with get(record.data, option).
function resolveNotificationLinks({ item, baseUrl, recordId, notificationId }) {
  const resolved = serializer.copy(item);

  Object.keys(resolved.links ?? {}).forEach((key) => {
    resolved.links[key] = resolveLinkValue({
      link: resolved.links[key],
      option: `links.${key}`,
      baseUrl,
      recordId,
      notificationId,
    });
  });

  ['actions', 'items'].forEach((arrayKey) => {
    if (!type.isArray(resolved[arrayKey])) return;
    resolved[arrayKey].forEach((entry, index) => {
      if (!type.isObject(entry) || type.isNone(entry.link)) return;
      entry.link = resolveLinkValue({
        link: entry.link,
        option: `${arrayKey}.${index}.link`,
        baseUrl,
        recordId,
        notificationId,
      });
    });
  });

  return resolved;
}

export default resolveNotificationLinks;
