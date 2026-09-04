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

import collectPageCallApiEndpoints from './collectPageCallApiEndpoints.js';
import createResolveConfigFile from './createResolveConfigFile.js';
import formatAppBrief from './formatAppBrief.js';
import getChangedConfigFiles from './getChangedConfigFiles.js';
import getDataModel from './getDataModel.js';
import getPageChanges from './getPageChanges.js';
import indexDataAccess from './indexDataAccess.js';
import readAppTests from './readAppTests.js';
import readBuildArtifact from './readBuildArtifact.js';
import summarizePageTests from './summarizePageTests.js';

// A 50-page app renders in roughly 1,500 tokens at one line per page. Past this
// the app brief is truncated rather than silently expensive, and the omitted
// pages are named by count so the caller knows to ask per page.
const MAX_PAGES = 50;

function buildPageBrief({
  pageId,
  registryEntry,
  model,
  access,
  coverage,
  tests,
  changedFiles,
  resolveConfigFile,
}) {
  const page = readBuildArtifact({ name: `pages/${pageId}.json`, deserialize: true });
  const built = !type.isNone(page);
  const { calls, dynamic } = built
    ? collectPageCallApiEndpoints({ page })
    : { calls: [], dynamic: [] };
  const endpointIds = [...new Set(calls.map((call) => call.endpointId))].sort();
  const pageAccess = access.pages[pageId] ?? { reads: [], writes: [] };

  const brief = {
    pageId,
    file: registryEntry?.refPath ?? null,
    auth: registryEntry?.auth ?? null,
    built,
    reads: pageAccess.reads,
    writes: pageAccess.writes,
    endpoints: endpointIds.map((endpointId) => ({
      endpointId,
      calledFrom: calls
        .filter((call) => call.endpointId === endpointId)
        .map(({ blockId, event }) => ({ blockId, event })),
      reads: access.endpoints[endpointId]?.reads ?? [],
      writes: access.endpoints[endpointId]?.writes ?? [],
    })),
    tests: summarizePageTests({
      pageId,
      coveragePage: coverage.pages?.[pageId],
      journeys: tests.journeys,
      requestTests: tests.requestTests,
      journeyIndex: tests.journeyIndex,
      endpointIds,
    }),
  };

  if (dynamic.length > 0) {
    brief.dynamicEndpointCalls = dynamic;
  }

  if (tests.unreadable.length > 0) {
    brief.unreadableTests = tests.unreadable;
  }

  // Requests and steps getDataModel could not join to a collection are carried
  // through: a missing edge otherwise reads as "this page touches no data".
  const unresolved = (model.unresolved ?? []).filter(
    (entry) => entry.pageId === pageId || endpointIds.includes(entry.endpointId)
  );
  if (unresolved.length > 0) {
    brief.unresolved = unresolved;
  }

  if (!type.isNone(changedFiles)) {
    brief.changed = getPageChanges({
      pageId,
      page,
      registryEntry,
      endpointIds,
      changedFiles,
      resolveConfigFile,
    });
  }

  if (!built) {
    brief.note =
      `Page "${pageId}" has not been built yet, so its blocks, requests and endpoint calls are ` +
      'not readable. Visit the page, or call lowdefy_get_page_config, to build it.';
  }

  return brief;
}

function summarizePageBrief(brief) {
  const summary = {
    pageId: brief.pageId,
    file: brief.file,
    reads: brief.reads.map((entry) => entry.collection),
    writes: brief.writes.map((entry) => entry.collection),
    endpoints: brief.endpoints.map((endpoint) => endpoint.endpointId),
    journeys: brief.tests.journeys.length,
    events: `${brief.tests.events.covered}/${brief.tests.events.declared}`,
  };
  brief.endpoints.forEach((endpoint) => {
    endpoint.reads.forEach((entry) => {
      if (!summary.reads.includes(entry.collection)) summary.reads.push(entry.collection);
    });
    endpoint.writes.forEach((entry) => {
      if (!summary.writes.includes(entry.collection)) summary.writes.push(entry.collection);
    });
  });
  if (!type.isUndefined(brief.changed)) {
    summary.changed = brief.changed.changed;
  }
  if (!brief.built) {
    summary.built = false;
  }
  return summary;
}

// Changed pages first (they are why `since` was passed), then the pages that
// write, then by id — every tie broken deterministically so the same app always
// renders the same brief.
function comparePageSummaries(a, b) {
  if ((a.changed === true) !== (b.changed === true)) {
    return a.changed === true ? -1 : 1;
  }
  if (a.writes.length !== b.writes.length) {
    return b.writes.length - a.writes.length;
  }
  return a.pageId.localeCompare(b.pageId);
}

// What an agent needs before editing, joined from artefacts that already exist:
// what a page reads and writes (its requests and the endpoints it calls, through
// getDataModel), how it is tested (journeys, request tests, uncovered events),
// and what changed since a git ref (a diff mapped onto config keys through
// keyMap). Deterministic — no prose, no model, no database.
function getAppBrief({ pageId, since } = {}) {
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const registry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};

  if (!type.isNone(pageId) && type.isUndefined(registry[pageId])) {
    return {
      error: `Page "${pageId}" was not found. Known pages: ${
        Object.keys(registry).sort().join(', ') || 'none'
      }.`,
    };
  }

  let changed = null;
  if (!type.isNone(since)) {
    changed = getChangedConfigFiles({ since, configDirectory });
    if (!type.isUndefined(changed.error)) {
      return { error: changed.error };
    }
  }
  const changedFiles = type.isNone(changed) ? null : new Set(changed.files);

  const model = getDataModel();
  const access = indexDataAccess({ model });
  const coverage = readBuildArtifact({ name: 'journeyCoverage.json' }) ?? { pages: {} };
  const tests = readAppTests({ configDirectory });
  const resolveConfigFile = createResolveConfigFile();

  const buildBrief = (id) =>
    buildPageBrief({
      pageId: id,
      registryEntry: registry[id],
      model,
      access,
      coverage,
      tests,
      changedFiles,
      resolveConfigFile,
    });

  if (!type.isNone(pageId)) {
    const brief = buildBrief(pageId);
    if (!type.isNone(changed)) {
      brief.since = since;
    }
    return { ...brief, markdown: formatAppBrief({ brief }) };
  }

  const summaries = Object.keys(registry)
    .sort()
    .map((id) => summarizePageBrief(buildBrief(id)))
    .sort(comparePageSummaries);

  const brief = {
    app: {
      pages: summaries.length,
      collections: Object.keys(model.collections ?? {}).length,
      endpoints: Object.keys(access.endpoints).length,
      journeys: tests.journeys.length,
      requestTests: tests.requestTests.length,
    },
    collections: Object.keys(model.collections ?? {}).sort(),
    pages: summaries.slice(0, MAX_PAGES),
  };

  if (summaries.length > MAX_PAGES) {
    brief.truncated = {
      pages: summaries.length - MAX_PAGES,
      note:
        `${summaries.length - MAX_PAGES} of ${summaries.length} pages are not listed. ` +
        'Pages are ordered changed-first, then by number of collections written, then by id. ' +
        'Call this tool with a pageId for any page not listed.',
    };
  }

  if (!type.isNone(changed)) {
    brief.changed = {
      since,
      files: changed.files,
      pages: summaries.filter((summary) => summary.changed === true).map((s) => s.pageId),
    };
  }

  if (type.isArray(model.unbuiltPages) && model.unbuiltPages.length > 0) {
    brief.unbuiltPages = model.unbuiltPages;
  }

  if (tests.unreadable.length > 0) {
    brief.unreadableTests = tests.unreadable;
  }

  return { ...brief, markdown: formatAppBrief({ brief }) };
}

export { MAX_PAGES };
export default getAppBrief;
