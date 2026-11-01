/**
 * @vitest-environment jsdom
 */
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

import { vi, afterEach, beforeEach, describe, expect, test } from 'vitest';

const STABLE_SRC = '/api/endpoints/files/inline/uploads/photo.png';

// The state hooks only use useRef, so they run outside a React render here.
vi.doMock('react', () => ({ useRef: (value) => ({ current: value }) }));
vi.doMock('./fileUpload.js', () => ({ default: vi.fn(async () => STABLE_SRC) }));

const { Editor } = await import('@tiptap/core');
const { default: buildExtensions } = await import('./buildExtensions.js');
const { default: useTiptapState } = await import('../TiptapInput/useTiptapState.js');
const { default: useTiptapMentionState } = await import(
  '../TiptapMentionInput/useTiptapMentionState.js'
);

let objectUrlCount = 0;
const editors = [];

beforeEach(() => {
  objectUrlCount = 0;
  // jsdom implements neither, so they stand in for the browser's.
  URL.createObjectURL = vi.fn(() => {
    objectUrlCount += 1;
    return `blob:http://localhost/preview-${objectUrlCount}`;
  });
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  editors.splice(0).forEach((editor) => {
    if (!editor.isDestroyed) editor.destroy();
  });
});

function createEditor(content = '', properties = {}) {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: buildExtensions({
      properties,
      getPlaceholder: () => '',
      insertImage: () => {},
      uploadEnabled: false,
    }),
    content,
  });
  editors.push(editor);
  return editor;
}

function createMethods() {
  return { setValue: vi.fn(), triggerEvent: vi.fn() };
}

const file = { name: 'photo.png', type: 'image/png', size: 4 };

describe.each([
  ['TiptapInput', useTiptapState],
  ['TiptapMentionInput', useTiptapMentionState],
])('%s insertImage', (name, useState) => {
  test('saves the stable src and shows the chosen file as a blob: preview', async () => {
    const editor = createEditor();
    const methods = createMethods();
    const { insertImage } = useState({ value: null, methods, hasDownloadRequest: false });

    await insertImage(editor, file, 0);

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    const html = editor.getHTML();
    expect(html).toContain(`src="${STABLE_SRC}"`);
    expect(html).not.toContain('blob:');

    const img = editor.view.dom.querySelector('img');
    expect(img.getAttribute('src')).toBe('blob:http://localhost/preview-1');
    expect(img.getAttribute('style')).toBe('max-width: 80%; display: block; zoom: 0.5;');

    const saved = methods.setValue.mock.calls.at(-1)[0];
    expect(saved.html).toContain(`src="${STABLE_SRC}"`);
    expect(saved.html).not.toContain('blob:');
    expect(saved.markdown).not.toContain('blob:');
    expect(saved.fileList).toEqual([expect.objectContaining({ url: STABLE_SRC })]);
    expect(editor.view.dom.querySelector('a').getAttribute('href')).toBe(STABLE_SRC);
  });

  test('with the Image extension disabled, an upload makes no preview and does not throw', async () => {
    const editor = createEditor('', { image: { disabled: true } });
    const { insertImage } = useState({
      value: null,
      methods: createMethods(),
      hasDownloadRequest: false,
    });

    await expect(insertImage(editor, file, 0)).resolves.not.toThrow();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

test('a deleted image shows its preview again after undo', async () => {
  const editor = createEditor();
  const { insertImage } = useTiptapState({
    value: null,
    methods: createMethods(),
    hasDownloadRequest: false,
  });
  await insertImage(editor, file, 0);

  editor.commands.setContent('', { emitUpdate: false });
  expect(editor.view.dom.querySelector('img')).toBe(null);
  editor.commands.setContent(`<img src="${STABLE_SRC}">`, { emitUpdate: false });

  expect(editor.view.dom.querySelector('img').getAttribute('src')).toBe(
    'blob:http://localhost/preview-1'
  );
});

test('a saved value loads its images from the stored src', () => {
  const editor = createEditor(`<img src="${STABLE_SRC}">`);
  expect(editor.view.dom.querySelector('img').getAttribute('src')).toBe(STABLE_SRC);
});

test('destroying the editor revokes its previews', async () => {
  const editor = createEditor();
  const { insertImage } = useTiptapState({
    value: null,
    methods: createMethods(),
    hasDownloadRequest: false,
  });
  await insertImage(editor, file, 0);
  const { previews } = editor.storage.image;

  editor.destroy();

  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/preview-1');
  expect(previews.size).toBe(0);
});
