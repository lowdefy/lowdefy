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

import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';

import buildDayRecords from './buildDayRecords.js';
import checkPropertyName from './checkPropertyName.js';
import createPostHogQueryClient from './createPostHogQueryClient.js';
import listWindowDays from '../listWindowDays.js';
import parseTraceWindow from '../parseTraceWindow.js';
import pruneDayFiles from './pruneDayFiles.js';
import pullDay from './pullDay.js';
import PullStoppedError from './PullStoppedError.js';
import readPostHogCredentials from './readPostHogCredentials.js';
import readTraceSalt from './readTraceSalt.js';
import writeDayFile from './writeDayFile.js';

const ADAPTERS = ['posthog'];
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 10000;
const DEFAULT_MAX_ROWS = 500000;

function readCount({ flag, value, fallback }) {
  if (type.isNone(value)) return fallback;
  const count = Number(value);
  if (!type.isInt(count) || count < 1) {
    throw new Error(`${flag} should be a whole number above 0. Received ${JSON.stringify(value)}.`);
  }
  return count;
}

function readManifest({ directories, day }) {
  const manifestPath = path.join(directories.traces, 'production', `${day}.manifest.json`);
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// Today and yesterday are always pulled again, because PostHog accepts late
// events. An older day is final: pulled once, unless --refetch, or its file
// was hashed under another salt, or it was last pulled before it was final.
function planDay({ day, today, manifest, saltId, refetch }) {
  const final =
    day <= new Date(Date.parse(`${today}T00:00:00Z`) - 2 * DAY_MS).toISOString().slice(0, 10);
  if (type.isNone(manifest)) return { final, action: 'pulled' };
  if (manifest.salt_id !== saltId) return { final, action: 're-pulled (salt changed)' };
  if (final && manifest.final === true && !refetch) return { final, action: 'skip' };
  return { final, action: refetch && final ? 're-pulled (--refetch)' : 'pulled' };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function buildManifest({ day, final, credentials, options, pulled, built, saltId }) {
  const environments = [
    ...new Set(pulled.rows.map((row) => row.environment).filter((value) => type.isString(value))),
  ].sort();
  return {
    day,
    final,
    pulled_at: new Date().toISOString(),
    project_id: credentials.projectId,
    api_host: credentials.apiHost,
    environment: options.environment ?? null,
    environments_seen: environments,
    filter_test_accounts: options.includeTestAccounts !== true,
    rows_by_event: built.rowsByEvent,
    records_written: built.records.length,
    dropped: built.dropped,
    enriched_share: built.interactions === 0 ? null : round2(built.enriched / built.interactions),
    chain_fallbacks: built.chainFallbacks,
    queries: pulled.queries,
    bytes_read: pulled.bytesRead,
    salt_id: saltId,
  };
}

function sumDropped(dropped) {
  return Object.values(dropped).reduce((total, count) => total + count, 0);
}

// `lowdefy journeys pull posthog`: brings the app's production analytics to
// this machine as interaction trace records, one UTC day at a time, into
// .lowdefy/traces/production/<day>.jsonl beside a manifest. Final days are
// fetched once; a long rate-limit wait or --max-rows stops the pull cleanly
// with the days already written kept, and the next run resumes from them.
async function journeysPullPosthog({ context, params }) {
  const [adapter] = params;
  if (!ADAPTERS.includes(adapter)) {
    throw new Error(
      `lowdefy journeys pull reads from ${ADAPTERS.join(', ')}. Received ${JSON.stringify(
        adapter
      )}.`
    );
  }
  const { options, directories, logger } = context;
  const now = Date.now();
  const window = parseTraceWindow({
    since: options.since,
    from: options.from,
    to: options.to,
    now,
  });
  const orgProperty = options.orgProperty ?? 'org_id';
  const rolesProperty = options.rolesProperty ?? 'roles';
  checkPropertyName({ flag: '--org-property', name: orgProperty });
  checkPropertyName({ flag: '--roles-property', name: rolesProperty });
  const pageSize = readCount({
    flag: '--page-size',
    value: options.pageSize,
    fallback: DEFAULT_PAGE_SIZE,
  });
  const maxRows = readCount({
    flag: '--max-rows',
    value: options.maxRows,
    fallback: DEFAULT_MAX_ROWS,
  });
  const credentials = readPostHogCredentials({ env: process.env });

  const pruned = pruneDayFiles({ directories, now });
  if (pruned.length > 0) {
    logger.info(`Pruned ${pruned.length} production trace files older than 400 days.`);
  }
  const { salt, saltId } = readTraceSalt({ directories });
  const client = createPostHogQueryClient({ ...credentials, logger });
  const today = new Date(now).toISOString().slice(0, 10);
  const totals = { rows: 0, records: 0, dropped: 0, bytesRead: 0, days: 0 };

  try {
    for (const day of listWindowDays(window)) {
      const manifest = readManifest({ directories, day });
      const plan = planDay({ day, today, manifest, saltId, refetch: options.refetch === true });
      if (plan.action === 'skip') {
        logger.info(`${day}  skipped (final)`);
        continue;
      }
      const pulled = await pullDay({
        client,
        day,
        pageSize,
        maxRows: maxRows - totals.rows,
        environment: options.environment,
        orgProperty,
        rolesProperty,
        filterTestAccounts: options.includeTestAccounts !== true,
      });
      const built = buildDayRecords({ rows: pulled.rows, salt });
      writeDayFile({
        directories,
        day,
        records: built.records,
        manifest: buildManifest({
          day,
          final: plan.final,
          credentials,
          options,
          pulled,
          built,
          saltId,
        }),
      });
      const dropped = sumDropped(built.dropped);
      totals.rows += pulled.rows.length;
      totals.records += built.records.length;
      totals.dropped += dropped;
      totals.bytesRead += pulled.bytesRead;
      totals.days += 1;
      logger.info(
        `${day}  ${plan.action}: ${pulled.rows.length} rows, ${built.records.length} records, ${dropped} dropped`
      );
    }
  } catch (error) {
    if (!(error instanceof PullStoppedError)) throw error;
    logger.warn(error.message);
    logger.info(
      `Pulled ${totals.days} days before stopping: ${totals.rows} rows, ${totals.records} records, ${totals.dropped} dropped, ${totals.bytesRead} bytes read.`
    );
    await context.sendTelemetry();
    return { ...totals, stopped: error.reason, window };
  }

  logger.info(
    `Pulled ${totals.days} days of ${window.from}/${window.to}: ${totals.rows} rows, ${totals.records} records, ${totals.dropped} dropped, ${totals.bytesRead} bytes read.`
  );
  await context.sendTelemetry();
  return { ...totals, window };
}

export default journeysPullPosthog;
