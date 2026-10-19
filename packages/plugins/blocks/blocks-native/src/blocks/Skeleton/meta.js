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

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element:
      'The Skeleton element: the shape, or the box around a variant (set margins and a horizontal inset here; hero and timeline default to paddingHorizontal: 16).',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      variant: {
        type: 'string',
        enum: ['listRow', 'insetGroup', 'hero', 'paragraph', 'card', 'timeline'],
        description:
          "Mobile only. The shape of what loads in the skeleton's place, so the content lands where the skeleton was: 'listRow' (list rows: a leading circle, a title bar and shorter subtitle bars, an optional trailing circle), 'insetGroup' (rows in inset grouped sections, a header bar above each, as an insetGrouped List draws them), 'hero' (a record's hero: a chip and key, two Title 1 lines, an avatar and meta), 'paragraph' (lines of body text ending ragged), 'card' (paragraph lines in a cell-coloured rounded card) or 'timeline' (activity entries on a rail, one or two lines each). insetGroup, card, hero and timeline are inset 16pt from the screen edges as grouped cells are: hero and timeline by the element's horizontal padding, which the element style's `paddingHorizontal` replaces (0 draws them edge to edge). Give listRow and paragraph an inset with the element style. Without a variant, `count`, `rows` or `avatar` draw list rows, and otherwise the Skeleton is one shape of its width and height.",
      },
      avatar: {
        type: 'boolean',
        description:
          'Mobile only. Draw a leading 22pt circle (a status glyph or avatar) in each list row (true, the default) or not (false).',
      },
      count: {
        type: ['integer', 'array'],
        minimum: 1,
        items: { type: 'integer', minimum: 1 },
        description:
          "Mobile only. List rows to draw (3 by default; for 'insetGroup', the rows of its one section, 4 by default, or a list of each section's rows, such as [2, 4, 3]), or a timeline's entries (3 by default). Without a variant, count draws list rows in place of one shape.",
        docs: {
          displayType: 'number',
        },
      },
      header: {
        type: 'boolean',
        description:
          "Mobile only. For 'insetGroup', draw a header bar above each section (true, the default) or leave the space of an untitled section (false).",
      },
      lines: {
        type: 'integer',
        minimum: 1,
        description:
          "Mobile only. The lines of text of a 'paragraph' (3 by default) or a 'card' (4 by default).",
      },
      rows: {
        type: 'integer',
        minimum: 1,
        description:
          'Mobile only. The lines of text in each list row: a title line, then shorter subtitle lines. Defaults to 2; 1 draws single-line cells.',
      },
      trailing: {
        type: 'boolean',
        default: false,
        description:
          'Mobile only. Draw a trailing 20pt circle (an avatar or priority glyph) in each list row.',
      },
      height: {
        type: ['number', 'string'],
        description: 'Height of the skeleton shape.',
        docs: {
          displayType: 'string',
        },
      },
      width: {
        type: ['number', 'string'],
        description: 'Width of the skeleton shape.',
        docs: {
          displayType: 'string',
        },
      },
    },
  },
};
