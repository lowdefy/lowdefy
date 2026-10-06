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

const MANIFEST = /^(\d{4}-\d{2}-\d{2})\.manifest\.json$/;

// The days of the production cache that will not change again, oldest first:
// those whose manifest says `final: true`. The pull re-pulls today and
// yesterday for late events, so their manifests say `final: false` until a
// later pull. Gaps are expected: a month this machine never pulled, a pruned
// day. A day hashed under another salt resolves none of its clicked-text
// tokens, so it is left out, as a day not held, until a pull hashes it again
// under this machine's salt (`saltId`, from readTraceSalt, or null when the
// machine has none, which leaves every day out).
//
// Returns { days, otherSalt }: the final days to read, and the final days
// left out for another salt, oldest first, so the caller can name the pull
// that fetches them again.
function listFinalDays({ directories, saltId }) {
  const directory = path.join(directories.traces, 'production');
  if (!fs.existsSync(directory)) return { days: [], otherSalt: [] };
  const finals = fs
    .readdirSync(directory)
    .map((name) => MANIFEST.exec(name))
    .filter((match) => match !== null)
    .map((match) => ({
      day: match[1],
      manifest: JSON.parse(fs.readFileSync(path.join(directory, match[0]), 'utf8')),
    }))
    .filter(({ manifest }) => manifest.final === true)
    .sort((a, b) => a.day.localeCompare(b.day));
  return {
    days: finals.filter(({ manifest }) => manifest.salt_id === saltId).map(({ day }) => day),
    otherSalt: finals.filter(({ manifest }) => manifest.salt_id !== saltId).map(({ day }) => day),
  };
}

export default listFinalDays;
