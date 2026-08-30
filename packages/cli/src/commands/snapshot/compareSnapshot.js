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

import diffDom from './diffDom.js';
import diffScreenshot from './diffScreenshot.js';
import diffState from './diffState.js';
import snapshotPaths from './snapshotPaths.js';

function missing(artefact) {
  return {
    artefact,
    changed: true,
    lines: [`no committed ${artefact} — run lowdefy snapshot --update`],
  };
}

// compareSnapshot checks one fresh snapshot against its committed golden and
// returns one entry per artefact: { artefact, changed, lines }. A missing
// golden is drift — a page that was never captured is exactly what a check
// should refuse to pass. A screenshot that drifted also writes diff.png.
function compareSnapshot({ configDirectory, target, snapshot, pixelTolerance }) {
  const paths = snapshotPaths({ configDirectory, target });
  const results = [];

  if (fs.existsSync(paths.screenshot)) {
    const result = diffScreenshot({
      expected: fs.readFileSync(paths.screenshot),
      actual: Buffer.from(snapshot.screenshot, 'base64'),
      tolerance: pixelTolerance,
    });
    const lines = [result.message];
    if (result.changed && result.diff) {
      fs.mkdirSync(paths.diffDirectory, { recursive: true });
      fs.writeFileSync(paths.diff, result.diff);
      lines.push(`pixel diff written to ${paths.diff}`);
    }
    results.push({ artefact: 'screenshot.png', changed: result.changed, lines });
  } else {
    results.push(missing('screenshot.png'));
  }

  if (fs.existsSync(paths.dom)) {
    const result = diffDom({
      expected: fs.readFileSync(paths.dom, 'utf8').replace(/\n$/, ''),
      actual: snapshot.dom,
    });
    results.push({ artefact: 'dom.html', changed: result.changed, lines: result.lines });
  } else {
    results.push(missing('dom.html'));
  }

  if (fs.existsSync(paths.state)) {
    const result = diffState({
      expected: JSON.parse(fs.readFileSync(paths.state, 'utf8')),
      actual: snapshot.state ?? {},
      snapshotIgnore: snapshot.snapshotIgnore ?? [],
    });
    results.push({
      artefact: 'state.json',
      changed: result.changed,
      lines: result.differences.map(
        ({ path, expected, actual }) =>
          `${path}: ${JSON.stringify(expected)} -> ${JSON.stringify(actual)}`
      ),
    });
  } else {
    results.push(missing('state.json'));
  }

  return { label: paths.label, results };
}

export default compareSnapshot;
