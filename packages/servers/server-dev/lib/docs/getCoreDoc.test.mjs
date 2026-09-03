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
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jest } from '@jest/globals';

const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-core-doc-test-'));
const writeDoc = (relativePath, markdown) => {
  const filePath = path.join(contentDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, markdown);
};

writeDoc('content/operators/_ref.md', '# _ref\n\nReferences another file.\n');
writeDoc('content/controls/reject.md', '# :reject\n\nReplies to the caller.\n');
writeDoc('content/connections/mongodb.md', '# MongoDB\n\nMongoDB connections.\n');
writeDoc('content/concepts/blocks.md', '# Blocks\n\nBlocks build a page.\n');

const manifest = {
  contentDir,
  docs: [
    {
      slug: 'operators/_ref',
      title: '_ref',
      section: 'Operators',
      path: 'content/operators/_ref.md',
      kind: 'operator',
      typeName: '_ref',
    },
    {
      slug: 'controls/reject',
      title: ':reject',
      section: 'Controls',
      path: 'content/controls/reject.md',
      kind: 'control',
      typeName: ':reject',
    },
    {
      slug: 'connections/mongodb',
      title: 'MongoDB',
      section: 'Connections',
      path: 'content/connections/mongodb.md',
      kind: 'connection',
      typeName: 'MongoDB',
    },
    {
      slug: 'concepts/blocks',
      title: 'Blocks',
      section: 'Concepts',
      path: 'content/concepts/blocks.md',
    },
  ],
};

const mockGetHazards = jest.fn();
jest.unstable_mockModule('./getDocsManifest.js', () => ({ default: () => manifest }));
jest.unstable_mockModule('./getHazards.js', () => ({ default: mockGetHazards }));

const { default: getCoreDoc } = await import('./getCoreDoc.js');

beforeEach(() => {
  mockGetHazards.mockReset();
  mockGetHazards.mockReturnValue([{ id: 'fixture-hazard', message: 'Fixture.', see: null }]);
});

test('getCoreDoc by slug returns the hazards of the type the page documents', () => {
  const doc = getCoreDoc({ slug: 'operators/_ref' });
  expect(mockGetHazards).toHaveBeenCalledWith({ kind: 'operator', type: '_ref' });
  expect(doc.hazards).toEqual([{ id: 'fixture-hazard', message: 'Fixture.', see: null }]);
});

test('getCoreDoc by slug resolves a control under the control kind, not the block kind', () => {
  getCoreDoc({ slug: 'controls/reject' });
  expect(mockGetHazards).toHaveBeenCalledWith({ kind: 'control', type: ':reject' });
});

test('getCoreDoc by slug returns no hazards for a page that documents no type', () => {
  const doc = getCoreDoc({ slug: 'concepts/blocks' });
  expect(mockGetHazards).not.toHaveBeenCalled();
  expect(doc.hazards).toBeUndefined();
});

test('getCoreDoc by type keeps a request on its own hazards, not the connection page it reads', () => {
  const doc = getCoreDoc({ kind: 'requests', type: 'MongoDBFind' });
  expect(doc.slug).toEqual('connections/mongodb');
  expect(mockGetHazards).toHaveBeenCalledWith({ kind: 'requests', type: 'MongoDBFind' });
});

test('getCoreDoc returns null for a slug the manifest does not know', () => {
  expect(getCoreDoc({ slug: 'concepts/does-not-exist' })).toEqual(null);
});
