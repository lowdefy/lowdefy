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
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import {
  ios,
  page,
  press,
  record,
  renderPage,
  screen,
  styleOf,
  theme,
} from '../../test/renderPage.js';

const content = [
  '# Heading one',
  '',
  'Some **bold**, *italic*, ~~struck~~ and `inline code` text.',
  '',
  '- First',
  '- [ ] Open task',
  '- [x] Done task',
  '',
  '1. Numbered',
  '',
  '> Quoted',
  '',
  '```',
  'const a = 1;',
  '```',
  '',
  '| Name | Value |',
  '| ---- | ----- |',
  '| Cell | 42 |',
].join('\n');

test('a Markdown draws GitHub-flavoured markdown in the iOS text styles', async () => {
  await renderPage({
    pageConfig: page([{ id: 'body', type: 'Markdown', properties: { content } }]),
  });
  expect(styleOf(await screen.findByText('Heading one'))).toMatchObject({
    color: ios.light.colorLabel,
    fontSize: 28,
  });
  expect(styleOf(screen.getByText('bold')).fontWeight).toBe('600');
  expect(styleOf(screen.getByText('italic')).fontStyle).toBe('italic');
  expect(styleOf(screen.getByText('struck')).textDecorationLine).toBe('line-through');
  expect(styleOf(screen.getByText('inline code')).backgroundColor).toBe(
    ios.light.colorTertiarySystemFill
  );
  expect(styleOf(screen.getByText('First'))).toMatchObject({
    color: ios.light.colorLabel,
    fontSize: 17,
  });
  expect(screen.getByText('Open task')).toBeTruthy();
  expect(screen.getByText('Done task')).toBeTruthy();
  expect(screen.getByTestId('markdown-task-open')).toBeTruthy();
  expect(screen.getByTestId('markdown-task-done')).toBeTruthy();
  expect(screen.getByText('Numbered')).toBeTruthy();
  expect(screen.getByText('Quoted')).toBeTruthy();
  expect(screen.getByText('const a = 1;')).toBeTruthy();
  expect(screen.getByText('Name')).toBeTruthy();
  expect(screen.getByText('42')).toBeTruthy();
  expect(screen.getByTestId('body')).toBeTruthy();
});

test('a Markdown with onLinkPress passes the href to the actions and opens nothing', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'body',
        type: 'Markdown',
        properties: { content: 'See [the design](https://example.com/design/1).' },
        events: { onLinkPress: record('link') },
      },
    ]),
  });
  const link = await screen.findByText('the design');
  expect(styleOf(link).color).toBe(theme.light.colorPrimary);
  await press(link);
  expect(calls).toEqual([{ name: 'link', event: { href: 'https://example.com/design/1' } }]);
  expect(openURL).not.toHaveBeenCalled();
});

test('a Markdown without onLinkPress opens a web link in the in-app browser', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await renderPage({
    pageConfig: page([
      { id: 'body', type: 'Markdown', properties: { content: '[Docs](https://docs.test/a)' } },
    ]),
  });
  await press(await screen.findByText('Docs'));
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://docs.test/a', {
    controlsColor: theme.light.colorPrimary,
  });
  expect(openURL).not.toHaveBeenCalled();
});

test('a Markdown without onLinkPress opens a mail link through the system', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await renderPage({
    pageConfig: page([
      { id: 'body', type: 'Markdown', properties: { content: '[Write](mailto:ada@test.dev)' } },
    ]),
  });
  await press(await screen.findByText('Write'));
  expect(openURL).toHaveBeenCalledWith('mailto:ada@test.dev');
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

test('a Markdown fires onLinkPress for every link, wherever it sits', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'body',
        type: 'Markdown',
        properties: {
          content: [
            '## See [the spec](https://a.test/spec)',
            '',
            'Bare https://a.test/bare and **[bold link](https://a.test/bold)**.',
            '',
            '- Item with [list link](https://a.test/list)',
            '  - Nested [deep link](https://a.test/deep)',
            '',
            '> Quote with [quote link](https://a.test/quote)',
            '',
            '| Link |',
            '| ---- |',
            '| [cell link](https://a.test/cell) |',
            '',
            'Ask [Ada](mailto:ada@test.dev).',
          ].join('\n'),
        },
        events: { onLinkPress: record('link') },
      },
    ]),
  });
  const texts = [
    'the spec',
    'https://a.test/bare',
    'bold link',
    'list link',
    'deep link',
    'quote link',
    'cell link',
    'Ada',
  ];
  for (const text of texts) {
    await press(await screen.findByText(text));
  }
  expect(calls.map((call) => call.event.href)).toEqual([
    'https://a.test/spec',
    'https://a.test/bare',
    'https://a.test/bold',
    'https://a.test/list',
    'https://a.test/deep',
    'https://a.test/quote',
    'https://a.test/cell',
    'mailto:ada@test.dev',
  ]);
  expect(openURL).not.toHaveBeenCalled();
  expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled();
});

const pelicanBody = [
  'Blocked on [PEL-12 Sign in with a passkey](pelican:PEL-12); [@Ada Lovelace](mention:u_ada) owns it.',
].join('\n');

const linkChips = [
  { scheme: 'pelican', icon: 'House', tone: 'primary' },
  { scheme: 'mention', tone: 'primary', prefix: '@' },
];

test('a Markdown draws linkChips links as tinted chips with an icon, key and title', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'body',
        type: 'Markdown',
        properties: { content: pelicanBody, linkChips },
        events: { onLinkPress: record('link') },
      },
    ]),
  });
  const key = await screen.findByText('PEL-12');
  expect(styleOf(key)).toMatchObject({ color: theme.light.colorPrimary, fontWeight: '500' });
  expect(styleOf(screen.getByText(' Sign in with a passkey')).color).toBe(ios.light.colorLabel);
  expect(screen.getByTestId('markdown-chip-icon-PEL-12')).toBeTruthy();
  expect(styleOf(screen.getByText('@Ada Lovelace')).color).toBe(theme.light.colorPrimary);
  expect(screen.queryByTestId('markdown-chip-icon-@Ada Lovelace')).toBeNull();
  expect(screen.getByLabelText('PEL-12 Sign in with a passkey')).toBeTruthy();
});

test('a Markdown chip fires onLinkPress with its href', async () => {
  const { calls } = await renderPage({
    pageConfig: page([
      {
        id: 'body',
        type: 'Markdown',
        properties: { content: pelicanBody, linkChips },
        events: { onLinkPress: record('link') },
      },
    ]),
  });
  await press(await screen.findByLabelText('PEL-12 Sign in with a passkey'));
  await press(screen.getByLabelText('@Ada Lovelace'));
  expect(calls).toEqual([
    { name: 'link', event: { href: 'pelican:PEL-12' } },
    { name: 'link', event: { href: 'mention:u_ada' } },
  ]);
});

test('a Markdown chip takes the dark tone in dark mode', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([
      { id: 'body', type: 'Markdown', properties: { content: pelicanBody, linkChips } },
    ]),
  });
  expect(styleOf(await screen.findByText('PEL-12')).color).toBe(theme.dark.colorPrimary);
  expect(styleOf(screen.getByText(' Sign in with a passkey')).color).toBe(ios.dark.colorLabel);
});

test('a Markdown without linkChips draws a pelican link as a plain link', async () => {
  await renderPage({
    pageConfig: page([{ id: 'body', type: 'Markdown', properties: { content: pelicanBody } }]),
  });
  expect(styleOf(await screen.findByText('PEL-12 Sign in with a passkey')).color).toBe(
    theme.light.colorPrimary
  );
  expect(screen.queryByTestId('markdown-chip')).toBeNull();
});

test('a Markdown marks nested lists with their own bullets and numbers', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'body',
        type: 'Markdown',
        properties: {
          content: [
            '- Top',
            '  - Middle',
            '    - Bottom',
            '',
            '3. Third',
            '4. Fourth',
            '   1. Sub one',
            '   2. Sub two',
          ].join('\n'),
        },
      },
    ]),
  });
  expect(await screen.findByText('•')).toBeTruthy();
  expect(screen.getByText('◦')).toBeTruthy();
  expect(screen.getByText('▪')).toBeTruthy();
  expect(screen.getByText('3.')).toBeTruthy();
  expect(screen.getByText('4.')).toBeTruthy();
  expect(screen.getByText('a.')).toBeTruthy();
  expect(screen.getByText('b.')).toBeTruthy();
});

test('a Markdown draws a fenced block as a code card with its language', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'body',
        type: 'Markdown',
        properties: { content: '```yaml\nid: m_body\ntype: Markdown\n```' },
      },
    ]),
  });
  const card = await screen.findByTestId('markdown-code');
  expect(styleOf(card)).toMatchObject({
    backgroundColor: ios.light.colorTertiarySystemFill,
    borderRadius: 12,
  });
  expect(screen.getByText('yaml')).toBeTruthy();
  expect(styleOf(screen.getByText('id: m_body\ntype: Markdown')).fontFamily).toBe('Menlo');
});

test('a Markdown draws a table with a semibold header row', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'body',
        type: 'Markdown',
        properties: { content: '| Stage | Count |\n| --- | --: |\n| Drafting | 4 |' },
      },
    ]),
  });
  expect(await screen.findByTestId('markdown-table')).toBeTruthy();
  expect(styleOf(screen.getByText('Stage')).fontWeight).toBe('600');
  expect(styleOf(screen.getByText('Drafting')).fontWeight).toBe('400');
  expect(styleOf(screen.getByText('Drafting')).fontSize).toBe(15);
});

test('a Markdown draws a quote with a tint bar', async () => {
  await renderPage({
    pageConfig: page([{ id: 'body', type: 'Markdown', properties: { content: '> Quoted' } }]),
  });
  const quote = await screen.findByTestId('markdown-quote');
  expect(styleOf(quote.children[0]).backgroundColor).toBe(theme.light.colorPrimary);
});

test('a Markdown shows raw html as text, and leaves it out with skipHtml', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'shown', type: 'Markdown', properties: { content: '<div>Raw block</div>' } },
      {
        id: 'skipped',
        type: 'Markdown',
        properties: { content: 'Kept\n\n<div>Gone block</div>', skipHtml: true },
      },
    ]),
  });
  expect(await screen.findByText('<div>Raw block</div>')).toBeTruthy();
  expect(screen.getByText('Kept')).toBeTruthy();
  expect(screen.queryByText(/Gone block/)).toBeNull();
});

test('a Markdown with no content draws nothing and does not throw', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'empty', type: 'Markdown', properties: {} },
      { id: 'after', type: 'Paragraph', properties: { content: 'After' } },
    ]),
  });
  expect(await screen.findByText('After')).toBeTruthy();
  expect(screen.getByTestId('empty')).toBeTruthy();
});

test('a Markdown takes the dark text colour in dark mode', async () => {
  await renderPage({
    darkMode: 'dark',
    pageConfig: page([{ id: 'body', type: 'Markdown', properties: { content: 'Night' } }]),
  });
  expect(styleOf(await screen.findByText('Night')).color).toBe(ios.dark.colorLabel);
});
