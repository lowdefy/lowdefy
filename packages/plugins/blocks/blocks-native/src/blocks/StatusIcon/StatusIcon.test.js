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

import { processColor } from 'react-native';

import { findAllOfType, page, renderPage, screen, styleOf, theme } from '../../test/renderPage.js';
import status from '../../schemas/status.js';

const names = status.oneOf[0].enum;

test('every StatusIcon glyph draws, with its name for screen readers', async () => {
  await renderPage({
    pageConfig: page(
      names.map((name) => ({ id: `glyph_${name}`, type: 'StatusIcon', properties: { name } }))
    ),
  });
  await screen.findByLabelText('In progress');
  names.forEach((name) => {
    const svg = screen.getByTestId(`glyph_${name}_glyph`, { includeHiddenElements: true });
    expect(svg.props.width).toEqual(16);
  });
  expect(screen.getByLabelText('Urgent priority')).toBeTruthy();
});

test('a StatusIcon takes a colour, size and label', async () => {
  await renderPage({
    pageConfig: page([
      {
        id: 'stage',
        type: 'StatusIcon',
        properties: { name: 'dot', color: 'teal', size: 10, label: 'Settled' },
      },
    ]),
  });
  expect(await screen.findByLabelText('Settled')).toBeTruthy();
  const svg = screen.getByTestId('stage_glyph', { includeHiddenElements: true });
  expect(svg.props.width).toEqual(10);
  const [dot] = findAllOfType(svg, 'RNSVGCircle');
  expect(dot.props.fill.payload).toEqual(processColor(theme.light['cyan-6']));
  expect(styleOf(screen.getByText('Settled', { includeHiddenElements: true })).fontSize).toEqual(
    13
  );
});
