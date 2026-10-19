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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

function journeyNode({ document, journeyIndex }) {
  const { contents } = document;
  if (YAML.isSeq(contents)) return contents.items[journeyIndex];
  return journeyIndex === 0 ? contents : undefined;
}

function columnOf({ text, offset }) {
  return offset - (text.lastIndexOf('\n', offset - 1) + 1);
}

// `evidence:` and its map as block YAML, its first line unindented and the
// rest indented to the journey's key column, so it can be spliced in where a
// key starts. Each month of production evidence is one flow-style line, so a
// refresh adds one line per month per flow. Lines end the way the file's lines
// do.
function renderEvidence({ evidence, column, eol }) {
  const document = new YAML.Document({ evidence });
  YAML.visit(document, {
    Pair(_, pair) {
      if (pair.key?.value !== 'months' || !YAML.isSeq(pair.value)) return;
      pair.value.items.forEach((item) => {
        item.flow = true;
      });
    },
  });
  const lines = document.toString({ lineWidth: 0 }).trimEnd().split('\n');
  const indent = ' '.repeat(column);
  return lines.map((line, index) => (index === 0 ? line : `${indent}${line}`)).join(eol);
}

// Splicing block YAML assumes a block-style journey; a flow-style one
// (`{ name: …, steps: […] }`) would come out broken. So the result is read
// back, and anything but the intended evidence leaves the file alone.
function checkWritten({ text, journeyIndex, evidence }) {
  const document = YAML.parseDocument(text);
  const node = document.errors.length === 0 ? journeyNode({ document, journeyIndex }) : undefined;
  const written = YAML.isMap(node) ? node.get('evidence', true)?.toJSON() : undefined;
  if (JSON.stringify(written) !== JSON.stringify(evidence)) {
    throw new Error(
      'The evidence could not be written into this journey; write its evidence key in block style.'
    );
  }
  return text;
}

// Writes a journey's evidence node into the file's text and touches nothing
// else: the parse only locates the node, and the new text is spliced in by
// offset, so comments, key order, quoting and blank lines elsewhere stay byte
// for byte. An existing `evidence` is replaced in place; a new one goes just
// before `steps`. The file holds one journey or a sequence of them, as
// discoverJourneys reads it; `journeyIndex` picks one.
function writeEvidenceNode({ text, journeyIndex, evidence }) {
  const document = YAML.parseDocument(text);
  if (document.errors.length > 0) {
    throw new Error(`The journey file does not parse: ${document.errors[0].message}`);
  }
  const node = journeyNode({ document, journeyIndex });
  if (!YAML.isMap(node)) {
    throw new Error(`The journey file has no journey at index ${journeyIndex}.`);
  }
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const existing = node.items.find((pair) => pair.key?.value === 'evidence');
  if (!type.isUndefined(existing)) {
    const start = existing.key.range[0];
    const end = existing.value.range[1];
    const block = renderEvidence({ evidence, column: columnOf({ text, offset: start }), eol });
    const replaced = text.slice(start, end);
    let newline = '';
    if (replaced.endsWith('\n')) newline = replaced.endsWith('\r\n') ? '\r\n' : '\n';
    return checkWritten({
      text: `${text.slice(0, start)}${block}${newline}${text.slice(end)}`,
      journeyIndex,
      evidence,
    });
  }
  const steps = node.items.find((pair) => pair.key?.value === 'steps');
  if (type.isUndefined(steps)) {
    throw new Error('The journey has no "steps" to place its evidence before.');
  }
  const offset = steps.key.range[0];
  const column = columnOf({ text, offset });
  const block = renderEvidence({ evidence, column, eol });
  return checkWritten({
    text: `${text.slice(0, offset)}${block}${eol}${' '.repeat(column)}${text.slice(offset)}`,
    journeyIndex,
    evidence,
  });
}

export default writeEvidenceNode;
