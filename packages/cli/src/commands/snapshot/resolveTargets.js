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

import readJourneySteps from './readJourneySteps.js';

// The directory name for a snapshot taken as the default headless user, when
// the app declares no auth.dev.users.
const DEFAULT_USER = 'headless';

function parseList(value) {
  if (type.isNone(value)) {
    return undefined;
  }
  const list = type.isArray(value) ? value : String(value).split(',');
  return list.map((item) => item.trim()).filter((item) => item !== '');
}

function usersFor({ entry, devUsers }) {
  if (type.isArray(entry.users) && entry.users.length > 0) {
    return entry.users;
  }
  if (devUsers.length > 0) {
    return devUsers;
  }
  return [DEFAULT_USER];
}

// resolveTargets turns the manifest (or, without one, every routed page for
// every dev user) into the flat list of page × user snapshots to take, then
// applies --pages and --users. Each target carries everything the snapshot
// route needs; the journey file is read here, once per entry.
function resolveTargets({
  manifest,
  appPageIds,
  devUsers,
  pagesFilter,
  usersFilter,
  configDirectory,
}) {
  const entries = type.isNone(manifest) ? appPageIds.map((pageId) => ({ pageId })) : manifest.pages;
  const pages = parseList(pagesFilter);
  const users = parseList(usersFilter);

  const targets = [];
  entries.forEach((entry) => {
    if (!type.isNone(pages) && !pages.includes(entry.pageId)) {
      return;
    }
    const journey = type.isNone(entry.journey)
      ? undefined
      : readJourneySteps({ configDirectory, journeyPath: entry.journey });
    usersFor({ entry, devUsers }).forEach((user) => {
      if (!type.isNone(users) && !users.includes(user)) {
        return;
      }
      targets.push({
        pageId: entry.pageId,
        user,
        // The default user is a directory name only; the route gets no user
        // and renders as the roleless headless caller.
        requestUser: user === DEFAULT_USER ? undefined : user,
        urlQuery: entry.urlQuery,
        ignore: entry.ignore,
        journey,
      });
    });
  });
  return targets;
}

export { DEFAULT_USER };
export default resolveTargets;
