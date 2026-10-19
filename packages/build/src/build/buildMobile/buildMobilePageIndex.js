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

import crypto from 'crypto';
import semver from 'semver';
import { serializer } from '@lowdefy/helpers';
import { ConfigWarning } from '@lowdefy/errors';

import mandatoryClientTypesMobile from '../mandatoryClientTypesMobile.js';

const CATEGORIES = ['actions', 'blocks', 'operators'];
const MAX_PAGES_BYTES = 1024 * 1024;

function getDefinitions({ typesMobile, category }) {
  if (category === 'operators') {
    return typesMobile.operators.client;
  }
  return typesMobile[category];
}

function getMajorVersion(version) {
  return semver.coerce(version)?.major ?? null;
}

// The native types one page needs, each with the plugin package that provides
// it and that package's major version: a shell renders the page only when it
// carries every type at the same major version. The types of mobile.events
// join every page's set, since any page can be the first to load.
function getMobileTypeSet({ page, context }) {
  const pageCounters = context.pageTypeCounters.get(page.pageId);
  const typeSet = {};
  CATEGORIES.forEach((category) => {
    const definitions = getDefinitions({ typesMobile: context.typesMobile, category });
    const names = new Set([
      ...mandatoryClientTypesMobile[category],
      ...Object.keys(pageCounters[category].getCounts()),
      ...Object.keys(context.mobileAppTypeCounters[category].getCounts()),
    ]);
    // Operators counted but not in the native map stay data at runtime, as on
    // the web (buildTypesMobile warns about them).
    typeSet[category] = [...names]
      .filter((name) => definitions[name])
      .sort()
      .map((name) => ({
        type: name,
        package: definitions[name].package,
        version: getMajorVersion(definitions[name].version),
      }));
  });
  return typeSet;
}

// The index a shell syncs its page cache against: every page it may open, with
// the path it opens at, a hash of the page's built JSON and the key of its
// type set. Runs on the final page config (after buildPageTypes and
// buildMobilePageIcons), so the hash matches the file writePages writes.
function buildMobilePageIndex({ components, context }) {
  context.mobilePageIndex = [];
  context.mobileTypeSets = {};
  const paths = new Map(context.routes.map((route) => [route.pageId, route.path]));
  let pagesBytes = 0;
  components.pages.forEach((page) => {
    if (page.target !== 'mobile' && page.target !== 'both') {
      return;
    }
    const typeSet = getMobileTypeSet({ page, context });
    const typesKey = crypto
      .createHash('sha256')
      .update(JSON.stringify(typeSet))
      .digest('hex')
      .slice(0, 12);
    context.mobileTypeSets[typesKey] = typeSet;
    const pageJson = serializer.serializeToString(page);
    pagesBytes += Buffer.byteLength(pageJson);
    context.mobilePageIndex.push({
      path: paths.get(page.pageId),
      pageId: page.pageId,
      hash: crypto.createHash('sha256').update(pageJson).digest('hex'),
      typesKey,
    });
  });
  if (pagesBytes > MAX_PAGES_BYTES) {
    context.handleWarning(
      new ConfigWarning(
        `Mobile pages total ${(pagesBytes / MAX_PAGES_BYTES).toFixed(
          1
        )} MB of JSON. A shell fetches every mobile page a user may open, so keep a mobile app's pages under 500 KB.`,
        { configKey: components.mobile?.['~k'] }
      )
    );
  }
  return components;
}

export default buildMobilePageIndex;
