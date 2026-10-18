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
  expect(screen.getByText('☐ Open task')).toBeTruthy();
  expect(screen.getByText('☑ Done task')).toBeTruthy();
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

test('a Markdown without onLinkPress opens a pressed link through the system', async () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  await renderPage({
    pageConfig: page([
      { id: 'body', type: 'Markdown', properties: { content: '[Docs](https://docs.test/a)' } },
    ]),
  });
  await press(await screen.findByText('Docs'));
  expect(openURL).toHaveBeenCalledWith('https://docs.test/a');
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
