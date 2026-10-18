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

// A mobile-only block: an animated vector drawing.
export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The box the drawing is drawn in.',
  },
  events: {},
  properties: {
    type: 'object',
    additionalProperties: false,
    required: ['svg'],
    properties: {
      svg: {
        type: 'string',
        description:
          'The drawing as SVG markup: one `<svg>` element with a `viewBox`. Give an element an `id` to animate it. Colours may be `var(--name)` references to `colors` (or a theme token such as `var(--colorPrimary)`), with an optional fallback, `var(--name, #000)`. Presentation attributes are drawn; `<style>` sheets and CSS classes are not.',
      },
      width: {
        type: 'number',
        minimum: 0,
        description:
          'The box width in points. Defaults to the height times the viewBox aspect ratio, or the viewBox width when neither is set. The drawing is scaled to fit the box whole and centred in it.',
      },
      height: {
        type: 'number',
        minimum: 0,
        description:
          'The box height in points. Defaults to the width divided by the viewBox aspect ratio, or the viewBox height when neither is set.',
      },
      position: {
        type: 'object',
        additionalProperties: false,
        description:
          "Draw the box at these offsets from where the block is placed, in points, taking no room in the layout. For art behind other blocks: as a Screen's first block with `{ right: 0, bottom: -24 }` it sits in the space beside the large title and scrolls away with it. A negative offset reaches outside the block's place.",
        properties: {
          top: { type: 'number', description: 'Offset of the top edge.' },
          right: { type: 'number', description: 'Offset of the right edge.' },
          bottom: { type: 'number', description: 'Offset of the bottom edge.' },
          left: { type: 'number', description: 'Offset of the left edge.' },
        },
      },
      colors: {
        type: 'object',
        description:
          'Colours the drawing names with `var(--name)`, by name: a hex or CSS colour, a theme token such as `colorPrimary`, or a palette hue such as `blue`. `none` draws nothing.',
        additionalProperties: { type: 'string' },
      },
      colorsDark: {
        type: 'object',
        description:
          'Colours by name in dark mode, over `colors`. A name not set here keeps its `colors` colour.',
        additionalProperties: { type: 'string' },
      },
      title: {
        type: 'string',
        description:
          'What the drawing shows, which screen readers read. Without a title the drawing is decoration, hidden from screen readers.',
      },
      animations: {
        type: 'array',
        description:
          "Keyframe animations of the drawing's elements, run on the native driver. Each element an animation targets is drawn in a view of its own. Animations of one element and property combine: translations and rotations add, scales and opacities multiply. With Reduce Motion on, each animation holds its value at the start of its cycle.",
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['target', 'property', 'keyframes', 'duration'],
          properties: {
            target: {
              type: 'string',
              description:
                'The `id` of the element to animate: an element at the top of the drawing, or inside groups (`g`). An element inside an animated group moves with the group.',
            },
            property: {
              type: 'string',
              enum: ['translateX', 'translateY', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity'],
              description:
                "What the keyframes set: a translation in the drawing's units, a rotation in degrees, a scale factor, or an opacity from 0 to 1.",
            },
            keyframes: {
              type: 'array',
              minItems: 1,
              description:
                'The values through one cycle. The first value holds from the start of the cycle to its keyframe, and the last to the end.',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['at', 'value'],
                properties: {
                  at: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    description: 'Where in the cycle, from 0 (its start) to 1 (its end).',
                  },
                  value: {
                    type: 'number',
                    description: 'The value at this point.',
                  },
                  easing: {
                    type: 'string',
                    enum: ['linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'step'],
                    description:
                      "The easing from this keyframe to the next. Defaults to the animation's easing.",
                  },
                },
              },
            },
            duration: {
              type: 'number',
              minimum: 1,
              description:
                'The length of one cycle in milliseconds. Animations with the same duration, delay and loop share one clock, so their keyframes stay in step.',
            },
            delay: {
              type: 'number',
              minimum: 0,
              default: 0,
              description: 'Milliseconds to wait before the first cycle.',
            },
            loop: {
              type: 'boolean',
              default: true,
              description: 'Repeat the cycle while the drawing is shown. False runs it once.',
            },
            easing: {
              type: 'string',
              enum: ['linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'step'],
              default: 'easeInOut',
              description:
                'How values move between keyframes. `step` holds each value until the next keyframe and jumps there, for frames that swap, as pixel art does.',
            },
            origin: {
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: { type: 'number' },
              description:
                "The point `[x, y]` a rotation or scale turns about, in the drawing's units. Defaults to the centre of the viewBox. The animations of one element share the first origin set among them.",
            },
          },
        },
      },
    },
  },
};
