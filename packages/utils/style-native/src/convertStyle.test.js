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

import convertStyle from './convertStyle.js';

test('convertStyle turns px and rem lengths into numbers', () => {
  expect(
    convertStyle({ width: '120px', fontSize: '1.5rem', height: '50%', opacity: '0.5' })
  ).toEqual({
    style: { width: 120, fontSize: 24, height: '50%', opacity: 0.5 },
    errors: [],
  });
});

test('convertStyle keeps numbers, colours and keywords', () => {
  expect(
    convertStyle({
      padding: 8,
      color: '#1677ff',
      backgroundColor: 'rgb(0, 0, 0)',
      alignItems: 'center',
    })
  ).toEqual({
    style: { padding: 8, color: '#1677ff', backgroundColor: 'rgb(0, 0, 0)', alignItems: 'center' },
    errors: [],
  });
});

test('convertStyle expands padding and margin shorthands in CSS order', () => {
  expect(convertStyle({ padding: '8px 24px', margin: '1rem 2px 3px' }).style).toEqual({
    paddingTop: 8,
    paddingRight: 24,
    paddingBottom: 8,
    paddingLeft: 24,
    marginTop: 16,
    marginRight: 2,
    marginBottom: 3,
    marginLeft: 2,
  });
  expect(convertStyle({ padding: '1px 2px 3px 4px' }).style).toEqual({
    paddingTop: 1,
    paddingRight: 2,
    paddingBottom: 3,
    paddingLeft: 4,
  });
  expect(convertStyle({ margin: '12px' }).style).toEqual({ margin: 12 });
});

test('convertStyle expands border shorthands', () => {
  expect(convertStyle({ border: '1px solid rgb(0, 0, 0)' }).style).toEqual({
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(0, 0, 0)',
  });
  expect(convertStyle({ borderBottom: '2px solid #eee' }).style).toEqual({
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  });
  expect(convertStyle({ border: 'none' }).style).toEqual({ borderWidth: 0 });
  expect(convertStyle({ borderTop: '1px dashed red' }).errors).toEqual([
    {
      key: 'borderTop',
      message:
        '"borderTop: 1px dashed red" sets a style for one side, but React Native has one border style for all sides. Use "border" or "borderStyle".',
    },
  ]);
});

test('convertStyle expands borderRadius, gap and flex shorthands', () => {
  expect(convertStyle({ borderRadius: '4px 8px' }).style).toEqual({
    borderTopLeftRadius: 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 8,
  });
  expect(convertStyle({ borderRadius: '0.5rem' }).style).toEqual({ borderRadius: 8 });
  expect(convertStyle({ gap: '8px 16px' }).style).toEqual({ rowGap: 8, columnGap: 16 });
  expect(convertStyle({ gap: 12 }).style).toEqual({ gap: 12 });
  expect(convertStyle({ flex: 1 }).style).toEqual({ flex: 1 });
  expect(convertStyle({ flex: '2' }).style).toEqual({ flex: 2 });
  expect(convertStyle({ flex: '1 0 120px' }).style).toEqual({
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 120,
  });
  expect(convertStyle({ flex: 'none' }).style).toEqual({
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  });
  expect(convertStyle({ flex: '1 200px' }).style).toEqual({ flexGrow: 1, flexBasis: 200 });
});

test('convertStyle refuses web-only keys and values', () => {
  const { style, errors } = convertStyle({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ':hover': { color: 'red' },
    position: 'fixed',
    transitionDuration: '200ms',
    cursor: 'pointer',
    width: 'calc(100% - 8px)',
    height: '10vh',
    color: 'red',
  });
  expect(style).toEqual({ color: 'red' });
  expect(errors.map((error) => error.key)).toEqual([
    'display',
    'gridTemplateColumns',
    ':hover',
    'position',
    'transitionDuration',
    'cursor',
    'width',
    'height',
  ]);
  expect(errors[0].message).toBe(
    '"display: grid" is web-only: React Native views lay out with flex. Use "flex" or "none".'
  );
  expect(errors[6].message).toBe(
    '"width: calc(100% - 8px)" uses a CSS function (calc, var, min, max, clamp or env) that React Native cannot evaluate.'
  );
  expect(errors[7].message).toBe(
    '"height: 10vh" uses the unit "vh", which React Native does not support. Use px, rem or %.'
  );
});

test('convertStyle allows flex and none displays and relative and absolute positions', () => {
  expect(convertStyle({ display: 'none', position: 'absolute' })).toEqual({
    style: { display: 'none', position: 'absolute' },
    errors: [],
  });
});

test('convertStyle refuses unitless line heights and turns font weights into strings', () => {
  const { style, errors } = convertStyle({ lineHeight: 1.5, fontWeight: 600 });
  expect(style).toEqual({ fontWeight: '600' });
  expect(errors).toEqual([
    {
      key: 'lineHeight',
      message:
        'Unitless "lineHeight: 1.5" is relative to the font size on the web, but React Native line heights are pixels. Use px or rem.',
    },
  ]);
  expect(convertStyle({ lineHeight: '24px', fontWeight: 'bold' }).style).toEqual({
    lineHeight: 24,
    fontWeight: 'bold',
  });
});

test('convertStyle keeps build markers and React Native object values', () => {
  expect(
    convertStyle({
      '~k': 'a1',
      shadowOffset: { width: 0, height: 2 },
      transform: [{ rotate: '45deg' }],
    })
  ).toEqual({
    style: { '~k': 'a1', shadowOffset: { width: 0, height: 2 }, transform: [{ rotate: '45deg' }] },
    errors: [],
  });
});

test('convertStyle treats a missing style as empty', () => {
  expect(convertStyle(undefined)).toEqual({ style: {}, errors: [] });
});
