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

import buildChainCountQuery from './buildChainCountQuery.js';
import buildDayQuery from './buildDayQuery.js';
import PullStoppedError from './PullStoppedError.js';

// PostHog's cap on rows for a HogQL query with an explicit LIMIT.
const MAX_PAGE_SIZE = 50000;

function toRows({ results, columns }) {
  return results.map((values) => {
    const row = {};
    columns.forEach((column, index) => {
      row[column] = values[index];
    });
    return row;
  });
}

// All of one UTC day's rows, as objects keyed by column, in (timestamp, uuid)
// order. A count first decides whether the day needs elements_chain and stops
// a day that would take the pull past `maxRows` (the rows the window has left)
// before any page is read. A page shorter than pageSize ends the day.
async function pullDay({
  client,
  day,
  pageSize = 10000,
  maxRows,
  environment,
  orgProperty,
  rolesProperty,
  filterTestAccounts = true,
}) {
  if (!type.isInt(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new Error(
      `--page-size should be a whole number from 1 to ${MAX_PAGE_SIZE}, PostHog's cap on rows per query. Received ${JSON.stringify(
        pageSize
      )}.`
    );
  }
  let queries = 0;
  let bytesRead = 0;

  const count = await client.query({
    ...buildChainCountQuery({ day, environment }),
    filterTestAccounts,
  });
  queries += 1;
  bytesRead += count.bytesRead;
  const [{ total = 0, unenriched = 0 } = {}] = toRows(count);
  if (!type.isUndefined(maxRows) && Number(total) > maxRows) {
    throw new PullStoppedError(
      `${day} holds ${total} rows, which would take the pull past --max-rows. Days already pulled are kept; shorten --since (or raise --max-rows) and run the pull again.`,
      { reason: 'max_rows' }
    );
  }
  const includeChain = Number(unenriched) > 0;

  const rows = [];
  let after;
  for (;;) {
    const page = await client.query({
      ...buildDayQuery({
        day,
        after,
        pageSize,
        includeChain,
        environment,
        orgProperty,
        rolesProperty,
      }),
      filterTestAccounts,
    });
    queries += 1;
    bytesRead += page.bytesRead;
    const pageRows = toRows(page);
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;
    const last = pageRows[pageRows.length - 1];
    after = { timestamp: last.timestamp, uuid: last.uuid };
  }
  return { rows, queries, bytesRead, includeChain };
}

export default pullDay;
