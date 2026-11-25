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

import { relativePosixPath } from '@lowdefy/node-utils';

import { describeBrowserOnly } from './formatBrowserOnly.js';

// A path as a shell reads it: quoted when it holds anything but letters, digits and . _ / -.
function shellPath(filePath) {
  return /^[A-Za-z0-9._/-]+$/.test(filePath) ? filePath : `'${filePath.replace(/'/g, "'\\''")}'`;
}

// The lines after a run's summary when it left journeys browser-only (`browserOnly`, their
// results), so a journey no run took is never missed: each by name, file and the step that needs
// a browser, then the exact command that runs them there, `lowdefy test --thorough <files>`, its
// files relative to `base` (the working directory the command resolves paths from). `inProcess`
// (runDevJourneys) are those with a step only the headless runner takes, which no run takes to
// the browser: the command leaves their files out and a line says why. `tool` names the
// lowdefy_run_tests tool and its arguments instead, `base` then being the app directory its paths
// are read from. Undefined when the run left none.
function formatBrowserOnlyNote({ browserOnly, inProcess = [], base, tool = false }) {
  if (browserOnly.length === 0) {
    return undefined;
  }
  const lines = ['Not run, needs a browser:'];
  browserOnly.forEach((result) => {
    const file = relativePosixPath({ from: base, to: result.filePath });
    const remembered = result.remembered === true ? '  (found by an earlier run)' : '';
    lines.push(`  ${result.name} (${file})  ${describeBrowserOnly({ result })}${remembered}`);
  });
  const files = [];
  browserOnly
    .filter((result) => !inProcess.includes(result))
    .forEach((result) => {
      const file = relativePosixPath({ from: base, to: result.filePath });
      if (!files.includes(file)) {
        files.push(file);
      }
    });
  if (files.length > 0) {
    lines.push(
      tool
        ? `Run them in the browser: lowdefy_run_tests with thorough: true and paths: ${JSON.stringify(
            files
          )}`
        : `Run them in the browser: lowdefy test --thorough ${files.map(shellPath).join(' ')}`
    );
  }
  if (inProcess.length === 1) {
    lines.push(
      `${
        files.length > 0 ? '1 of them' : 'It'
      } has a hold, release or call as system step, which only the headless runner takes, so no run takes it to the browser.`
    );
  }
  if (inProcess.length > 1) {
    lines.push(
      `${
        inProcess.length === browserOnly.length ? 'They' : `${inProcess.length} of them`
      } have a hold, release or call as system step, which only the headless runner takes, so no run takes them to the browser.`
    );
  }
  return lines.join('\n');
}

export default formatBrowserOnlyNote;
