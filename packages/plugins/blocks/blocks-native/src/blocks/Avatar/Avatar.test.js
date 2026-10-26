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

import { act, fireEvent } from '@testing-library/react-native';

import { findAllOfType, page, press, renderPage, screen, styleOf } from '../../test/renderPage.js';

const generated = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='#6366f1'/><text x='64' y='64' dominant-baseline='central' text-anchor='middle' fill='white' font-size='48'>GW</text></svg>`;
const svgPicture = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generated)}`;

test('an Avatar shows initials on the colour its name picks', async () => {
  await renderPage({
    pageConfig: page([{ id: 'ada', type: 'Avatar', properties: { name: 'Ada Lovelace' } }]),
  });
  const avatar = await screen.findByLabelText('Ada Lovelace');
  expect(styleOf(avatar)).toMatchObject({ height: 28, width: 28 });
  expect(screen.getByText('AL', { includeHiddenElements: true })).toBeTruthy();
});

test('an Avatar stacks several people and counts the rest past max', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'team',
        type: 'Avatar',
        properties: {
          size: 20,
          max: 2,
          avatars: [{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }, { name: 'Alan Turing' }],
        },
      },
    ]),
  });
  expect(await screen.findByLabelText('Ada Lovelace, Grace Hopper, Alan Turing')).toBeTruthy();
  expect(screen.getByText('+1', { includeHiddenElements: true })).toBeTruthy();
  const second = screen.getByTestId('team_avatar_1', { includeHiddenElements: true });
  expect(styleOf(second)).toMatchObject({
    // The ring matches the cell it sits on: secondarySystemGroupedBackground in light mode.
    borderColor: '#FFFFFF',
    marginLeft: -6,
  });
});

test('an Avatar draws an SVG data URI picture with react-native-svg, over its initials', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'pieter', type: 'Avatar', properties: { name: 'Pieter van Dam', src: svgPicture } },
    ]),
  });
  const avatar = await screen.findByLabelText('Pieter van Dam');
  const svg = findAllOfType(avatar, 'RNSVGSvgView');
  expect(svg).toHaveLength(1);
  expect(styleOf(svg[0])).toMatchObject({ height: 28, width: 28 });
  expect(findAllOfType(avatar, 'Text')).toHaveLength(0);
});

test('an Avatar loads a photo path from the app server', async () => {
  await renderPage({
    pageConfig: page([
      { id: 'ada', type: 'Avatar', properties: { name: 'Ada Lovelace', src: '/avatars/ada.png' } },
    ]),
  });
  const image = await screen.findByTestId('expo-image', { includeHiddenElements: true });
  expect(image.props.source).toEqual({ uri: 'https://app.lowdefy.test/avatars/ada.png' });
});

test('stacked avatars load photo paths from the app server', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'team',
        type: 'Avatar',
        properties: { avatars: [{ name: 'Ada Lovelace', src: '/avatars/ada.png' }] },
      },
    ]),
  });
  const image = await screen.findByTestId('expo-image', { includeHiddenElements: true });
  expect(image.props.source).toEqual({ uri: 'https://app.lowdefy.test/avatars/ada.png' });
});

test('an Avatar fades a photo in over its initials, which it drops once the photo shows', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'ada',
        type: 'Avatar',
        properties: { name: 'Ada Lovelace', src: 'https://img.example/ada.png' },
      },
    ]),
  });
  const image = await screen.findByTestId('expo-image', { includeHiddenElements: true });
  expect(image.props.source).toEqual({ uri: 'https://img.example/ada.png' });
  expect(image.props.cachePolicy).toBe('memory-disk');
  expect(screen.getByText('AL', { includeHiddenElements: true })).toBeTruthy();
  await act(async () => {
    fireEvent(image, 'load', { cacheType: 'memory' });
  });
  expect(screen.queryByText('AL', { includeHiddenElements: true })).toBeNull();
});

test('an Avatar falls back to initials when its photo fails, until its src changes', async () => {
  await renderPage({
    pageConfig: page(
      [
        { id: 'ada', type: 'Avatar', properties: { name: 'Ada Lovelace', src: { _state: 'pic' } } },
        {
          id: 'change',
          type: 'Button',
          properties: { title: 'Change' },
          events: {
            onClick: [
              { id: 'set', type: 'SetState', params: { pic: 'https://img.example/ada-2.png' } },
            ],
          },
        },
      ],
      {
        events: {
          onInit: [
            { id: 'pic', type: 'SetState', params: { pic: 'https://img.example/gone.png' } },
          ],
        },
      }
    ),
  });
  const image = await screen.findByTestId('expo-image', { includeHiddenElements: true });
  await act(async () => {
    fireEvent(image, 'error', { error: 'Not found' });
  });
  expect(screen.queryByTestId('expo-image', { includeHiddenElements: true })).toBeNull();
  expect(screen.getByText('AL', { includeHiddenElements: true })).toBeTruthy();
  await press(screen.getByText('Change'));
  expect(screen.getByTestId('expo-image', { includeHiddenElements: true }).props.source).toEqual({
    uri: 'https://img.example/ada-2.png',
  });
});

test('an Avatar shows initials for an SVG data URI that does not parse', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'ada',
        type: 'Avatar',
        properties: { name: 'Ada Lovelace', src: 'data:image/svg+xml,%3Csvg%3E%3Crect' },
      },
    ]),
  });
  const avatar = await screen.findByLabelText('Ada Lovelace');
  expect(findAllOfType(avatar, 'RNSVGSvgView')).toHaveLength(0);
  expect(screen.getByText('AL', { includeHiddenElements: true })).toBeTruthy();
});
