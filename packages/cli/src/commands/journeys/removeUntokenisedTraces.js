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

const MANIFEST_SUFFIX = '.manifest.json';

function listOldRuleDays({ directory }) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(MANIFEST_SUFFIX))
    .filter((name) => {
      const manifest = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
      return manifest.text_rule !== 'token';
    })
    .map((name) => name.slice(0, -MANIFEST_SUFFIX.length))
    .sort();
}

// A pull stopped mid-write leaves `.tmp` files, or a day's records renamed
// without its manifest; neither is in the cache, and one written by a pull
// before clicked text was stored as tokens can hold production text. A file
// this young may be a pull writing now, which renames it within moments.
const LEFTOVER_MIN_AGE_MS = 10 * 60 * 1000;
const RECORDS_FILE = /^\d{4}-\d{2}-\d{2}\.jsonl$/;

function isLeftover({ name, names }) {
  if (name.endsWith('.tmp')) return true;
  if (!RECORDS_FILE.test(name)) return false;
  return !names.has(`${name.slice(0, -'.jsonl'.length)}${MANIFEST_SUFFIX}`);
}

function removeLeftovers({ directory, now }) {
  if (!fs.existsSync(directory)) return [];
  const names = new Set(fs.readdirSync(directory));
  const leftovers = [...names]
    .filter((name) => isLeftover({ name, names }))
    .filter((name) => {
      const stats = fs.statSync(path.join(directory, name), { throwIfNoEntry: false });
      return stats !== undefined && now - stats.mtimeMs >= LEFTOVER_MIN_AGE_MS;
    })
    .sort();
  leftovers.forEach((name) => fs.rmSync(path.join(directory, name), { force: true }));
  return leftovers;
}

// Day files pulled before clicked text was stored as tokens can hold
// production text, and so can the production candidates and coverage.json
// compiled from them. When any day manifest lacks `text_rule: 'token'`, those
// days, tests/journeys/_candidates/production/ and .lowdefy/test/coverage.json
// are deleted; the next pull, compile and coverage write them again. Files a
// stopped pull left outside the cache (`.tmp` files, records without a
// manifest) are deleted too, on their own. The salt, committed journeys and
// dev and explorer recordings are left alone. Runs at the start of every pull
// and before every production read.
function removeUntokenisedTraces({ directories, logger, now = Date.now() }) {
  const directory = path.join(directories.traces, 'production');
  const leftovers = removeLeftovers({ directory, now });
  if (leftovers.length > 0) {
    logger.warn(
      `Removed ${leftovers.length} production trace files a stopped pull left unfinished.`
    );
  }
  const days = listOldRuleDays({ directory });
  if (days.length === 0) return { days: [], leftovers };
  days.forEach((day) => {
    fs.rmSync(path.join(directory, `${day}.jsonl`), { force: true });
    fs.rmSync(path.join(directory, `${day}${MANIFEST_SUFFIX}`), { force: true });
  });
  const candidatesDirectory = path.join(
    directories.config,
    'tests',
    'journeys',
    '_candidates',
    'production'
  );
  const candidates = fs.existsSync(candidatesDirectory);
  fs.rmSync(candidatesDirectory, { recursive: true, force: true });
  const coveragePath = path.join(directories.test, 'coverage.json');
  const coverage = fs.existsSync(coveragePath);
  fs.rmSync(coveragePath, { force: true });
  const removed = [`${days.length} production trace days`];
  if (candidates) removed.push('the production candidates');
  if (coverage) removed.push('coverage.json');
  logger.warn(
    `Removed ${removed.join(
      ', '
    )}, written before clicked text was stored as tokens. Pull the days again with lowdefy journeys pull posthog.`
  );
  return { days, leftovers };
}

export default removeUntokenisedTraces;
