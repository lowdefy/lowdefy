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

function listOrNone(values) {
  return values.length === 0 ? 'none' : values.join(', ');
}

function describeAccess(entries) {
  return entries.map((entry) => {
    const by = entry.by
      .map((edge) => `${edge.requestId ?? edge.stepId ?? edge.websocketId} (${edge.type})`)
      .join(', ');
    return `- \`${entry.collection}\` — ${by}`;
  });
}

function accessSection({ title, entries }) {
  if (entries.length === 0) {
    return [`## ${title}`, '', 'none', ''];
  }
  return [`## ${title}`, '', ...describeAccess(entries), ''];
}

function formatPageBrief({ brief }) {
  const lines = [`# Page \`${brief.pageId}\` — ${brief.file ?? 'unknown file'}`, ''];
  if (!brief.built) {
    lines.push(brief.note, '');
    return lines.join('\n');
  }
  lines.push(...accessSection({ title: 'Reads', entries: brief.reads }));
  lines.push(...accessSection({ title: 'Writes', entries: brief.writes }));

  lines.push('## Endpoints called', '');
  if (brief.endpoints.length === 0) {
    lines.push('none', '');
  } else {
    brief.endpoints.forEach((endpoint) => {
      const from = endpoint.calledFrom
        .map((call) => `${call.blockId ?? 'page'}.${call.event}`)
        .join(', ');
      const reads = listOrNone(endpoint.reads.map((entry) => entry.collection));
      const writes = listOrNone(endpoint.writes.map((entry) => entry.collection));
      lines.push(`- \`${endpoint.endpointId}\` (from ${from}) — reads ${reads}; writes ${writes}`);
    });
    lines.push('');
  }

  lines.push('## Tests', '');
  lines.push(`- journeys: ${listOrNone(brief.tests.journeys)}`);
  lines.push(`- request tests: ${listOrNone(brief.tests.requestTests.map((test) => test.file))}`);
  lines.push(`- events covered: ${brief.tests.events.covered}/${brief.tests.events.declared}`);
  if (brief.tests.events.uncovered.length > 0) {
    lines.push(
      `- uncovered: ${brief.tests.events.uncovered
        .map((triple) => `${triple.blockId}.${triple.event}`)
        .join(', ')}`
    );
  }
  lines.push('');

  if (!type.isUndefined(brief.changed)) {
    lines.push(`## Changed since ${brief.since}`, '');
    if (!brief.changed.changed) {
      lines.push('nothing this page is made of changed', '');
    } else {
      lines.push(`- files: ${listOrNone(brief.changed.files)}`);
      lines.push(`- blocks: ${listOrNone(brief.changed.blocks)}`);
      lines.push(`- requests: ${listOrNone(brief.changed.requests)}`);
      lines.push(`- endpoints: ${listOrNone(brief.changed.endpoints)}`);
      lines.push('');
    }
  }

  if (!type.isUndefined(brief.unresolved)) {
    lines.push('## Unresolved', '');
    brief.unresolved.forEach((entry) => lines.push(`- ${entry.reason}`));
    lines.push('');
  }

  return lines.join('\n');
}

function formatWholeAppBrief({ brief }) {
  const lines = [
    '# App brief',
    '',
    `${brief.app.pages} pages, ${brief.app.collections} collections, ${brief.app.endpoints} endpoints with data steps, ${brief.app.journeys} journeys, ${brief.app.requestTests} request tests.`,
    '',
    '| page | reads | writes | endpoints | journeys | events |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  brief.pages.forEach((page) => {
    const id = page.changed === true ? `**${page.pageId}**` : page.pageId;
    lines.push(
      `| ${id} | ${listOrNone(page.reads)} | ${listOrNone(page.writes)} | ${listOrNone(
        page.endpoints
      )} | ${page.journeys} | ${page.events} |`
    );
  });
  lines.push('');

  if (!type.isUndefined(brief.changed)) {
    lines.push(`## Changed since ${brief.changed.since}`, '');
    lines.push(`- files: ${listOrNone(brief.changed.files)}`);
    lines.push(`- pages: ${listOrNone(brief.changed.pages)}`);
    lines.push('');
  }
  if (!type.isUndefined(brief.truncated)) {
    lines.push(brief.truncated.note, '');
  }
  if (!type.isUndefined(brief.unbuiltPages)) {
    lines.push(`Not built yet: ${brief.unbuiltPages.join(', ')}.`, '');
  }
  return lines.join('\n');
}

// The same brief as markdown, for reading rather than parsing. Bold marks a
// page a `since` diff touched; every list is rendered in the order the JSON
// carries it, so the two never disagree.
function formatAppBrief({ brief }) {
  if (type.isString(brief.pageId)) {
    return formatPageBrief({ brief });
  }
  return formatWholeAppBrief({ brief });
}

export default formatAppBrief;
