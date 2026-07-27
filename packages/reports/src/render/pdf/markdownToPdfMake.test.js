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

import { jest } from '@jest/globals';

const resolveImage = jest.fn();
jest.unstable_mockModule('../resolveImage.js', () => ({ resolveImage, default: resolveImage }));

const { parseMarkdown, mdastToPdfMake, markdownToPdfMake, resolveMarkdownImages } = await import(
  './markdownToPdfMake.js'
);

const CONTENT_WIDTH = 515.28;

/** Map markdown source straight to pdfmake content (the pure path). */
function map(markdown, options = {}) {
  return mdastToPdfMake(parseMarkdown(markdown), { contentWidth: CONTENT_WIDTH, ...options });
}

// --- headings ----------------------------------------------------------------

test('headings map to the shared heading styles, clamping past level 4', () => {
  const { content } = map('# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five');
  expect(content).toEqual([
    { text: 'One', fontSize: 22, bold: true, margin: [0, 8, 0, 4] },
    { text: 'Two', fontSize: 17, bold: true, margin: [0, 8, 0, 4] },
    { text: 'Three', fontSize: 14, bold: true, margin: [0, 8, 0, 4] },
    { text: 'Four', fontSize: 12, bold: true, margin: [0, 8, 0, 4] },
    { text: 'Five', fontSize: 12, bold: true, margin: [0, 8, 0, 4] },
  ]);
});

test('a styled heading keeps its inline styling', () => {
  const { content } = map('## A **bold** word');
  expect(content[0].text).toEqual([
    { text: 'A ' },
    { text: 'bold', bold: true },
    { text: ' word' },
  ]);
  expect(content[0].fontSize).toBe(17);
});

// --- paragraphs and inline styling -------------------------------------------

test('a plain paragraph document produces a single text node', () => {
  const { content } = map('Just some prose.');
  expect(content).toEqual([{ text: 'Just some prose.', margin: [0, 0, 0, 6] }]);
});

test('a soft line break is whitespace; an explicit break is a newline', () => {
  expect(map('one\ntwo').content).toEqual([{ text: 'one two', margin: [0, 0, 0, 6] }]);
  expect(map('one  \ntwo').content[0].text).toEqual([
    { text: 'one' },
    { text: '\n' },
    { text: 'two' },
  ]);
});

test('emphasis, strong, delete, and inline code style the text array', () => {
  const { content } = map('a **b** _c_ ~~d~~ `e`');
  expect(content[0].text).toEqual([
    { text: 'a ' },
    { text: 'b', bold: true },
    { text: ' ' },
    { text: 'c', italics: true },
    { text: ' ' },
    { text: 'd', decoration: 'lineThrough' },
    { text: ' ' },
    { text: 'e', color: '#c41d7f', background: '#f5f5f5' },
  ]);
});

test('nested marks compose', () => {
  const { content } = map('**bold _and italic_**');
  expect(content[0].text).toEqual([
    { text: 'bold ', bold: true },
    { text: 'and italic', bold: true, italics: true },
  ]);
});

test('a link becomes underlined linked text', () => {
  const { content } = map('see [docs](https://lowdefy.com)');
  expect(content[0].text[1]).toEqual({
    text: 'docs',
    link: 'https://lowdefy.com',
    color: '#0958d9',
    decoration: 'underline',
  });
});

test('a struck-through link keeps both decorations', () => {
  const { content } = map('~~[gone](https://lowdefy.com)~~');
  expect(content[0].text).toEqual([
    {
      text: 'gone',
      link: 'https://lowdefy.com',
      color: '#0958d9',
      decoration: ['lineThrough', 'underline'],
    },
  ]);
});

// --- code --------------------------------------------------------------------

test('a fenced code block keeps its whitespace in the code style', () => {
  const { content } = map('```js\nconst a = 1;\n  const b = 2;\n```');
  expect(content).toEqual([
    {
      text: 'const a = 1;\n  const b = 2;',
      color: '#c41d7f',
      background: '#f5f5f5',
      preserveLeadingSpaces: true,
      margin: [0, 0, 0, 8],
    },
  ]);
});

// --- lists -------------------------------------------------------------------

test('a nested unordered list maps to nested uls', () => {
  const { content } = map('- one\n  - deep\n- two');
  expect(content).toEqual([
    {
      ul: [
        {
          stack: [{ text: 'one' }, { ul: [{ text: 'deep' }], margin: [0, 2, 0, 2] }],
        },
        { text: 'two' },
      ],
      margin: [0, 0, 0, 8],
    },
  ]);
});

test('an ordered list maps to ol and keeps a non-default start', () => {
  expect(map('1. a\n2. b').content[0]).toEqual({
    ol: [{ text: 'a' }, { text: 'b' }],
    margin: [0, 0, 0, 8],
  });
  expect(map('3. a\n4. b').content[0].start).toBe(3);
});

test('GFM task items carry an ascii checkbox', () => {
  expect(map('- [ ] todo\n- [x] done').content[0].ul).toEqual([
    { text: '[ ] todo' },
    { text: '[x] done' },
  ]);
});

test('the task checkbox leads a styled item too', () => {
  expect(map('- [x] **done** early').content[0].ul[0].text).toEqual([
    { text: '[x] ' },
    { text: 'done', bold: true },
    { text: ' early' },
  ]);
});

// GFM requires content after a checkbox, so a checked item always starts with a
// paragraph. These map hand-built trees to pin the fallbacks anyway.
test('the task checkbox stands alone when the item has no leading text', () => {
  const item = (children) => ({
    type: 'root',
    children: [{ type: 'list', children: [{ type: 'listItem', checked: true, children }] }],
  });
  expect(mdastToPdfMake(item([]), {}).content[0].ul).toEqual([{ text: '[x] ' }]);
  expect(mdastToPdfMake(item([{ type: 'thematicBreak' }]), {}).content[0].ul[0].stack[0]).toEqual({
    text: '[x] ',
  });
});

// --- blockquote, rule --------------------------------------------------------

test('a blockquote is an indented, tinted stack', () => {
  const { content } = map('> quoted **words**');
  expect(content).toEqual([
    {
      stack: [{ text: [{ text: 'quoted ' }, { text: 'words', bold: true }], margin: [0, 0, 0, 6] }],
      margin: [12, 0, 0, 8],
      color: '#595959',
      italics: true,
    },
  ]);
});

test('a thematic break draws the divider rule at the content width', () => {
  const { content } = map('---');
  expect(content[0].canvas[0]).toMatchObject({ type: 'line', x2: CONTENT_WIDTH, lineWidth: 0.5 });
});

// --- tables ------------------------------------------------------------------

test('a GFM table maps to a pdfmake table with a header row and alignment', () => {
  const { content } = map('| Region | Total |\n| --- | ---: |\n| North | 100 |');
  expect(content).toEqual([
    {
      margin: [0, 0, 0, 8],
      table: {
        headerRows: 1,
        widths: ['*', '*'],
        body: [
          [
            { text: 'Region', bold: true, fillColor: '#f5f5f5' },
            { text: 'Total', bold: true, fillColor: '#f5f5f5', alignment: 'right' },
          ],
          [{ text: 'North' }, { text: '100', alignment: 'right' }],
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ]);
});

test('a short row is padded so every row has the same cell count', () => {
  const { content } = map('| a | b |\n| --- | --- |\n| only |');
  expect(content[0].table.body[1]).toEqual([{ text: 'only' }, { text: '' }]);
});

// --- nodes with no special styling -------------------------------------------

test('a reference-style link resolves through its definition', () => {
  const { content } = map('see [the docs][d]\n\n[d]: https://lowdefy.com');
  expect(content).toEqual([
    {
      text: [
        { text: 'see ' },
        {
          text: 'the docs',
          link: 'https://lowdefy.com',
          color: '#0958d9',
          decoration: 'underline',
        },
      ],
      margin: [0, 0, 0, 6],
    },
  ]);
});

// A parser only emits a reference when its definition exists, so this maps a
// hand-built tree: an undefined reference is text, never a dead link.
test('a link reference with no definition still shows its text', () => {
  const tree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'linkReference',
            identifier: 'gone',
            children: [{ type: 'text', value: 'text' }],
          },
        ],
      },
    ],
  };
  expect(mdastToPdfMake(tree, {}).content).toEqual([{ text: 'text', margin: [0, 0, 0, 6] }]);
});

test('a footnote definition contributes its blocks', () => {
  const { content } = map('Body[^1]\n\n[^1]: The note.');
  expect(content).toEqual([
    { text: 'Body', margin: [0, 0, 0, 6] },
    { text: 'The note.', margin: [0, 0, 0, 6] },
  ]);
});

// --- raw html ----------------------------------------------------------------

test('raw html is dropped and counted, block and inline', () => {
  const { content, htmlNodes } = map('<div>ignored</div>\n\ntext <span>x</span> more');
  expect(htmlNodes).toBe(3); // the block div, and the inline open/close spans
  expect(content).toEqual([
    { text: [{ text: 'text ' }, { text: 'x' }, { text: ' more' }], margin: [0, 0, 0, 6] },
  ]);
});

test('one warning is logged per markdown node, not per html node', () => {
  const logger = { warn: jest.fn() };
  const node = { kind: 'markdown', markdown: '<div>a</div>\n\n<div>b</div>\n\nkept' };
  const result = markdownToPdfMake(node, { contentWidth: CONTENT_WIDTH, logger });

  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toEqual({ htmlNodes: 2 });
  expect(logger.warn.mock.calls[0][1]).toMatch(/raw HTML .* ignored/);
  expect(logger.warn.mock.calls[0][1]).toMatch(/Html block/);
  expect(result.stack).toEqual([{ text: 'kept', margin: [0, 0, 0, 6] }]);
});

test('markdown with no visible content translates to null', () => {
  const logger = { warn: jest.fn() };
  expect(markdownToPdfMake({ kind: 'markdown', markdown: '' }, {})).toBeNull();
  expect(
    markdownToPdfMake({ kind: 'markdown', markdown: '<div>only html</div>' }, { logger })
  ).toBeNull();
  expect(logger.warn).toHaveBeenCalledTimes(1);
});

// --- images ------------------------------------------------------------------

test('a resolved markdown image embeds as a data URL capped to the content width', async () => {
  resolveImage.mockResolvedValue({ buffer: Buffer.from([1, 2, 3]), mime: 'image/png' });

  const node = await resolveMarkdownImages(
    { kind: 'markdown', markdown: 'before\n\n![logo](/logo.png)' },
    { publicDir: '/app/public', logger: undefined }
  );

  expect(resolveImage).toHaveBeenCalledWith({
    src: '/logo.png',
    publicDir: '/app/public',
    logger: undefined,
  });
  expect(node.images).toEqual({ '/logo.png': 'data:image/png;base64,AQID' });

  // The attached tree is reused, so translation does not parse twice.
  expect(node.tree.type).toBe('root');
  const translated = markdownToPdfMake(node, { contentWidth: CONTENT_WIDTH });
  expect(translated.stack[1]).toEqual({
    image: 'data:image/png;base64,AQID',
    unbreakable: true,
    margin: [0, 0, 0, 8],
    maxWidth: CONTENT_WIDTH,
  });
});

test('an image the resolver refuses is skipped, keeping the surrounding prose', async () => {
  resolveImage.mockResolvedValue(null); // the resolver logged the reason

  const node = await resolveMarkdownImages({
    kind: 'markdown',
    markdown: 'text ![nope](http://10.0.0.1/x.png) after',
  });

  expect(node.images).toEqual({});
  const translated = markdownToPdfMake(node, { contentWidth: CONTENT_WIDTH });
  expect(translated.stack).toEqual([
    { text: 'text ', margin: [0, 0, 0, 6] },
    { text: ' after', margin: [0, 0, 0, 6] },
  ]);
});

test('an image nested in a link falls back to its alt text', () => {
  const { content } = map('[![Build badge](/badge.svg)](https://ci.example.com)', {
    images: { '/badge.svg': 'data:image/svg+xml;base64,AAA' },
  });
  expect(content[0].text).toEqual([
    {
      text: 'Build badge',
      link: 'https://ci.example.com',
      color: '#0958d9',
      decoration: 'underline',
    },
  ]);
});

test('an image with no alt text nested in a link contributes nothing', () => {
  const { content } = map('[![](/badge.svg)](https://ci.example.com)');
  expect(content).toEqual([]);
});

test('markdown without images resolves nothing and attaches only the tree', async () => {
  const node = await resolveMarkdownImages({ kind: 'markdown', markdown: '# no images' });
  expect(resolveImage).not.toHaveBeenCalled();
  expect(node.images).toBeUndefined();
  expect(node.tree.type).toBe('root');
});

test('the same image source is resolved once', async () => {
  resolveImage.mockResolvedValue({ buffer: Buffer.from([9]), mime: 'image/png' });
  await resolveMarkdownImages({ kind: 'markdown', markdown: '![a](/x.png)\n\n![b](/x.png)' });
  expect(resolveImage).toHaveBeenCalledTimes(1);
});
