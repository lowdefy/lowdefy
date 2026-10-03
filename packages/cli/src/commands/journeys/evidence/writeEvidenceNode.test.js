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

import validateJourney from '../../test/validateJourney.js';
import writeEvidenceNode from './writeEvidenceNode.js';

const evidence = {
  production: {
    sessions: 412,
    persons: 37,
    orgs: 9,
    share: 0.31,
    failures: 14,
    window: '2026-09-03/2026-10-02',
  },
  refreshed: '2026-10-03',
};

const single = `# Assigns a ticket.
name: member assigns an open ticket   # kept
pageId: "tickets"
user: { roles: [member] }

# The flow.
steps:
  - click: 'assign'
  - expect: { visible: done }
`;

test('writeEvidenceNode inserts a new evidence key just before steps and nothing else', () => {
  const text = writeEvidenceNode({ text: single, journeyIndex: 0, evidence });
  const offset = single.indexOf('steps:');
  expect(text.startsWith(single.slice(0, offset))).toBe(true);
  expect(text.endsWith(single.slice(offset))).toBe(true);
  expect(text.slice(offset, text.length - (single.length - offset))).toBe(
    [
      'evidence:',
      '  production:',
      '    sessions: 412',
      '    persons: 37',
      '    orgs: 9',
      '    share: 0.31',
      '    failures: 14',
      '    window: 2026-09-03/2026-10-02',
      '  refreshed: 2026-10-03',
      '',
    ].join('\n')
  );
  const journey = YAML.parse(text);
  expect(journey.evidence).toEqual(evidence);
  expect(Object.keys(journey)).toEqual(['name', 'pageId', 'user', 'evidence', 'steps']);
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

test('writeEvidenceNode replaces an existing evidence key in place', () => {
  const withEvidence = writeEvidenceNode({ text: single, journeyIndex: 0, evidence });
  const updated = {
    ...evidence,
    production: { ...evidence.production, sessions: 500 },
    refreshed: '2026-10-04',
  };
  const text = writeEvidenceNode({ text: withEvidence, journeyIndex: 0, evidence: updated });
  expect(text).toBe(
    withEvidence
      .replace('sessions: 412', 'sessions: 500')
      .replace('refreshed: 2026-10-03', 'refreshed: 2026-10-04')
  );
});

const sequence = `# Two journeys.
- name: first
  pageId: tickets
  evidence:
    production:
      sessions: 1
      persons: 1
      orgs: 0
      share: 0.5
      failures: 0
      window: 2026-09-01/2026-09-30
    dev: { recordings: 2 }
    refreshed: 2026-10-01

  # the steps
  steps:
    - click: save

- steps: [{ click: open }]
  name: 'second'
  pageId: home
`;

test('writeEvidenceNode writes the right journey of a sequence file and keeps the rest byte for byte', () => {
  const second = writeEvidenceNode({ text: sequence, journeyIndex: 1, evidence });
  const offset = sequence.indexOf('steps: [{ click: open }]');
  expect(second.slice(0, offset)).toBe(sequence.slice(0, offset));
  expect(second.endsWith(sequence.slice(offset))).toBe(true);
  const parsed = YAML.parse(second);
  expect(parsed[1].evidence).toEqual(evidence);
  expect(parsed[1].steps).toEqual([{ click: 'open' }]);
  expect(parsed[0]).toEqual(YAML.parse(sequence)[0]);

  const first = writeEvidenceNode({
    text: sequence,
    journeyIndex: 0,
    evidence: { ...YAML.parse(sequence)[0].evidence, production: evidence.production },
  });
  const start = sequence.indexOf('  evidence:');
  const end = sequence.indexOf('\n  # the steps');
  expect(first.slice(0, start)).toBe(sequence.slice(0, start));
  expect(first.endsWith(sequence.slice(end))).toBe(true);
  expect(YAML.parse(first)[0].evidence.dev).toEqual({ recordings: 2 });
});

test('writeEvidenceNode throws for a file that does not parse', () => {
  expect(() =>
    writeEvidenceNode({ text: 'name: [unclosed\nsteps:', journeyIndex: 0, evidence })
  ).toThrow('The journey file does not parse');
});
