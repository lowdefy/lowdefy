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

import { buildPagePath, serializer, type, urlQuery } from '@lowdefy/helpers';

function pagePathFor({ pageId, pathParams, routes }) {
  const route = routes.find((candidate) => candidate.pageId === pageId);
  return buildPagePath({ pageId, path: route?.path, pathParams });
}

function resolveLinkValue({ link, option, serverUrl, basePath, landingPath, recordId, routes }) {
  // Absolute URLs pass through — links into other apps or external destinations.
  // They skip any landing page, so they carry no mark-as-read.
  if (type.isString(link)) {
    return link;
  }
  if (type.isObject(link) && !type.isNone(link.pageId)) {
    if (type.isNone(landingPath)) {
      // No landing page configured — link straight to the target page.
      const pagePath = pagePathFor({
        pageId: link.pageId,
        pathParams: link.pathParams,
        routes,
      });
      const query = urlQuery.stringify(link.urlQuery ?? {});
      return `${serverUrl}${basePath}/${pagePath}${query ? `?${query}` : ''}`;
    }
    // The option query param is the dot-path of the link inside the record's
    // data — the landing page reads the original target back with
    // get(record.data, option) after marking the record read.
    const query = urlQuery.stringify({ _id: recordId, option });
    return `${serverUrl}${basePath}/${landingPath}?${query}`;
  }
  return link;
}

// Resolves link values in a copy of the data item to URLs; the stored record
// keeps the original { pageId, urlQuery, pathParams } objects for in-app navigation.
// data.links is the framework convention; link fields inside arrays are
// resolved for the data keys the template declares (Template.dataKeys), so
// custom templates get the same treatment as the built-in ones.
// routes is the build's routes.json; a link's page path is its pattern there.
// landingPage is a page id, or { pageId, pathParams }; its path is built from the same table.
function resolveNotificationLinks({
  item,
  dataKeys,
  serverUrl,
  basePath,
  landingPage,
  recordId,
  routes,
}) {
  const resolved = serializer.copy(item);
  let landingPath;
  if (!type.isNone(landingPage)) {
    const landing = type.isString(landingPage) ? { pageId: landingPage } : landingPage;
    landingPath = pagePathFor({ pageId: landing.pageId, pathParams: landing.pathParams, routes });
  }

  Object.keys(resolved.links ?? {}).forEach((key) => {
    resolved.links[key] = resolveLinkValue({
      link: resolved.links[key],
      option: `links.${key}`,
      serverUrl,
      basePath,
      landingPath,
      recordId,
      routes,
    });
  });

  (dataKeys ?? []).forEach((arrayKey) => {
    if (!type.isArray(resolved[arrayKey])) return;
    resolved[arrayKey].forEach((entry, index) => {
      if (!type.isObject(entry) || type.isNone(entry.link)) return;
      entry.link = resolveLinkValue({
        link: entry.link,
        option: `${arrayKey}.${index}.link`,
        serverUrl,
        basePath,
        landingPath,
        recordId,
        routes,
      });
    });
  });

  return resolved;
}

export default resolveNotificationLinks;
