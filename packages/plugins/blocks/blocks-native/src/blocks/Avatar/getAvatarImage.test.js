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

import getAvatarImage from './getAvatarImage.js';

const imageSource = (url) => ({ uri: url.startsWith('/') ? `https://app.example${url}` : url });

// The picture a profile is given when it has no photo: a gradient with the initials, as the
// users module writes it.
const generated = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#6366f1'/><stop offset='100%' stop-color='#06b6d4'/></linearGradient></defs><rect width='128' height='128' fill='url(#g)'/><text x='64' y='64' dominant-baseline='central' text-anchor='middle' fill='white' font-family='sans-serif' font-size='48' font-weight='bold'>GW</text></svg>`;

test('getAvatarImage draws nothing for no src, so the avatar shows initials', () => {
  expect(getAvatarImage({ imageSource })).toBeNull();
  expect(getAvatarImage({ imageSource, src: null })).toBeNull();
  expect(getAvatarImage({ imageSource, src: '  ' })).toBeNull();
});

test('getAvatarImage loads a photo url with expo-image', () => {
  expect(getAvatarImage({ imageSource, src: 'https://img.example/ada.png' })).toEqual({
    kind: 'uri',
    source: { uri: 'https://img.example/ada.png' },
  });
  expect(getAvatarImage({ imageSource, src: 'data:image/png;base64,iVBORw0KGgo=' })).toEqual({
    kind: 'uri',
    source: { uri: 'data:image/png;base64,iVBORw0KGgo=' },
  });
});

test('getAvatarImage takes a path against the app server', () => {
  expect(getAvatarImage({ imageSource, src: '/avatars/ada.png' })).toEqual({
    kind: 'uri',
    source: { uri: 'https://app.example/avatars/ada.png' },
  });
});

test('getAvatarImage parses a percent-encoded SVG data URI', () => {
  const image = getAvatarImage({
    imageSource,
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generated)}`,
  });
  expect(image.kind).toBe('svg');
  expect(image.ast.tag).toBe('svg');
});

test('getAvatarImage gives a pixel-sized SVG a viewBox, so it scales to the avatar', () => {
  const image = getAvatarImage({
    imageSource,
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generated)}`,
  });
  expect(image.ast.props.viewBox).toBe('0 0 128 128');
});

test('getAvatarImage keeps a viewBox the SVG has', () => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' width='128' height='128'><rect width='10' height='10'/></svg>`;
  const image = getAvatarImage({
    imageSource,
    src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
  });
  expect(image.ast.props.viewBox).toBe('0 0 10 10');
});

test('getAvatarImage centres SVG initials set with dominant-baseline', () => {
  const image = getAvatarImage({
    imageSource,
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generated)}`,
  });
  const text = image.ast.children.find((child) => child.props?.dominantBaseline === 'central');
  expect(text.props.alignmentBaseline).toBe('central');
});

test('getAvatarImage reads a base64 SVG data URI as UTF-8', () => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><text>Émile</text></svg>`;
  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  const image = getAvatarImage({ imageSource, src: `data:image/svg+xml;base64,${base64}` });
  expect(image.kind).toBe('svg');
  expect(image.ast.children[0].props.children).toEqual(['Émile']);
});

test('getAvatarImage draws nothing for an SVG data URI that does not parse', () => {
  expect(getAvatarImage({ imageSource, src: 'data:image/svg+xml,%3Csvg%3E%3Crect' })).toBeNull();
  expect(getAvatarImage({ imageSource, src: 'data:image/svg+xml,%E0%A4%A' })).toBeNull();
  expect(getAvatarImage({ imageSource, src: 'data:image/svg+xml;utf8' })).toBeNull();
});
