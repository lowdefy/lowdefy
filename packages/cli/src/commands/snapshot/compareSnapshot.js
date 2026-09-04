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
import normalizeState from './normalizeState.js';
import snapshotPaths from './snapshotPaths.js';

// State diffs are capped the same way diffDom caps its lines, so a page whose
// loaded table drifted wholesale does not flood the terminal per page x user.
const MAX_STATE_DIFF_LINES = 20;
const MAX_STATE_VALUE_CHARS = 200;

function truncate(text) {
  if (text === undefined || text.length <= MAX_STATE_VALUE_CHARS) {
    return text;
  }
  return `${text.slice(0, MAX_STATE_VALUE_CHARS)}…`;
}

function missing({ artefact, advisory }) {
  return {
    artefact,
    changed: true,
    advisory,
    lines: [`no committed ${artefact} — run lowdefy snapshot --update`],
  };
}

// compareSnapshot checks one fresh snapshot against its committed golden and
// returns one entry per artefact: { artefact, changed, advisory, lines }. A
// missing golden is drift — a page that was never captured is exactly what a
// check should refuse to pass. A screenshot that drifted also writes diff.png.
// Pixel results are advisory unless the caller asks for them to fail the run:
// a font or GPU difference between two machines is not a config change, and a
// check that cries wolf on it stops being read. DOM and state drift are never
// advisory.
function compareSnapshot({
  configDirectory,
  target,
  snapshot,
  pixelTolerance,
  ignore = [],
  failOnPixel = false,
}) {
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
    results.push({
      artefact: 'screenshot.png',
      changed: result.changed,
      advisory: !failOnPixel,
      lines,
    });
  } else {
    results.push(missing({ artefact: 'screenshot.png', advisory: !failOnPixel }));
  }

  if (fs.existsSync(paths.dom)) {
    const result = diffDom({
      // A golden checked out with CRLF line endings (git core.autocrlf on
      // Windows) must compare equal to the LF text writeSnapshot produced.
      expected: fs.readFileSync(paths.dom, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, ''),
      actual: snapshot.dom,
    });
    results.push({
      artefact: 'dom.html',
      changed: result.changed,
      advisory: false,
      lines: result.lines,
    });
  } else {
    results.push(missing({ artefact: 'dom.html', advisory: false }));
  }

  if (fs.existsSync(paths.state)) {
    const result = diffState({
      expected: JSON.parse(fs.readFileSync(paths.state, 'utf8')),
      actual: normalizeState({ state: snapshot.state }),
      snapshotIgnore: ignore,
    });
    const lines = result.differences
      .slice(0, MAX_STATE_DIFF_LINES)
      .map(
        ({ path, expected, actual }) =>
          `${path}: ${truncate(JSON.stringify(expected))} -> ${truncate(JSON.stringify(actual))}`
      );
    if (result.differences.length > MAX_STATE_DIFF_LINES) {
      lines.push(`... ${result.differences.length - MAX_STATE_DIFF_LINES} more differing paths`);
    }
    results.push({
      artefact: 'state.json',
      changed: result.changed,
      advisory: false,
      lines,
    });
  } else {
    results.push(missing({ artefact: 'state.json', advisory: false }));
  }

  return { label: paths.label, results };
}

export default compareSnapshot;
