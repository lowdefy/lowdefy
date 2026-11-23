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

import HeadlessStepError from '../HeadlessStepError.js';
import pollUntil from '../pollUntil.js';
import describeBlock from '../standIns/describeBlock.js';
import loadHtmlDom from '../standIns/loadHtmlDom.js';
import mayShowText from './mayShowText.js';
import readBlockText from './readBlockText.js';
import { runShows } from './readHtmlPieces.js';

const BROWSER = 'the step runs in a browser';

function listTypes(blocks) {
  const named = new Map();
  blocks.forEach((block) => {
    if (!named.has(block.type)) named.set(block.type, describeBlock(block));
  });
  return [...named.values()].join(', ');
}

// What a reading answers for a check that the block's text contains `contains`:
// - found: a run a browser surely reads it in (runShows);
// - open: it is not found, and the block holds text the run cannot read (a block with no text
//   model, or text its model leaves open), or may show it in a layout or order a headless page
//   does not know (mayShowText), so a browser may find it;
// - missing: it is not found, and no layout could show it.
function judge({ contains, reading }) {
  if (reading.runs.some((run) => runShows({ run, contains }))) {
    return 'found';
  }
  if (
    reading.unmodeled.length > 0 ||
    reading.open.length > 0 ||
    mayShowText({ contains, units: reading.units })
  ) {
    return 'open';
  }
  return 'missing';
}

// Why an open reading leaves the step to the browser.
function describeOpen({ blockId, contains, reading }) {
  if (reading.unmodeled.length > 0) {
    return `Block "${blockId}" holds blocks a headless run has no text model for (${listTypes(
      reading.unmodeled
    )}), which may show "${contains}": ${BROWSER}.`;
  }
  if (reading.open.length > 0) {
    return `Block "${blockId}" may show "${contains}" in text a headless run cannot read (${reading.open.join(
      '; '
    )}): ${BROWSER}.`;
  }
  if (reading.classHidden.some((run) => runShows({ run, contains }))) {
    return `Block "${blockId}" may show "${contains}" in an element a class (hidden, md:hidden) the page's CSS may hide: ${BROWSER}.`;
  }
  return `Block "${blockId}" may show "${contains}" across its text, as a layout a headless page does not know draws it: ${BROWSER}.`;
}

// expect.text (LDF-1147): waits, as the browser runner does, for the text a browser reads in the
// block (readBlockText) to contain `contains`. It passes once a run shows it. While it is not
// found it waits: at the timeout it fails as the browser step fails, when no layout could show
// it, and leaves the step to the browser (actor.browserOnly) when the block may show it in text
// the run cannot read, as soon as a reading says so. A headless run never fails a check a browser
// could pass.
async function expectBlockText({ actor, params, timeout }) {
  const { blockId, contains } = params;
  const parse = await loadHtmlDom();
  const cache = new Map();
  const read = () => {
    const reading = readBlockText({ actor, blockId, cache, parse });
    return { reading, answer: judge({ contains, reading }) };
  };
  const { value } = await pollUntil({
    check: ({ answer }) => answer !== 'missing',
    read,
    timeout,
  });
  const { answer, reading } = value;
  if (answer === 'found') {
    return;
  }
  if (answer === 'open') {
    actor.browserOnly.push(describeOpen({ blockId, contains, reading }));
    return;
  }
  const expected = `block "${blockId}" text to contain "${contains}"`;
  // The browser waits for the block's wrapper, which a block the page holds draws even while it
  // is hidden or a closed Modal: its text then reads "".
  if (!reading.onPage) {
    throw new HeadlessStepError(`Expected block "${blockId}" to contain text "${contains}".`, {
      actual: `no block "${blockId}" on the page`,
      expected,
    });
  }
  throw new HeadlessStepError(
    `Expected block "${blockId}" text to contain "${contains}" but found ${JSON.stringify(
      reading.text
    )}.`,
    { actual: reading.text, expected }
  );
}

export default expectBlockText;
