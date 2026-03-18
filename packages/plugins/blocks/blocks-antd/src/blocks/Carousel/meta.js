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
  category: 'container',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Carousel element.',
  },
  events: {
    afterChange: 'Trigger actions after the slide is changed.',
    beforeChange: 'Trigger actions before the slide is changed.',
    onInit: 'Trigger actions when the carousel is initialized.',
    onSwipe: 'Trigger actions when the carousel is swiped.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      accessibility: {
        type: 'boolean',
        default: true,
        description: 'Enable tabbing and arrow key navigation.',
      },
      adaptiveHeight: {
        type: 'boolean',
        default: false,
        description: "Adjust the slide's height automatically.",
      },
      arrows: {
        type: 'boolean',
        default: false,
        description: 'Whether or not to show arrows.',
      },
      autoplaySpeed: {
        type: 'integer',
        default: 3000,
        description: 'Delay between each auto scroll (in milliseconds).',
      },
      autoplay: {
        type: 'boolean',
        default: false,
        description: 'Toggles whether or not to scroll automatically.',
      },
      centerMode: {
        type: 'boolean',
        default: false,
        description: 'Center current slide.',
      },
      centerPadding: {
        type: 'string',
        default: '50px',
        description: 'Padding applied to center slide.',
      },
      dotPosition: {
        type: 'string',
        enum: ['left', 'right', 'top', 'bottom'],
        default: 'bottom',
        description: 'The position of the dots, which can be one of top, bottom, left or right.',
      },
      dots: {
        type: 'boolean',
        default: true,
        description: 'Whether or not to show the dots.',
      },
      draggable: {
        type: 'boolean',
        default: false,
        description: 'Enable scrollable via dragging on desktop',
      },
      easing: {
        type: 'string',
        default: 'linear',
        description: 'Transition interpolation function name.',
      },
      effect: {
        type: 'string',
        default: 'scrollx',
        description: 'Transition effect, either scrollx or fade.',
      },
      focusOnSelect: {
        type: 'boolean',
        default: false,
        description: 'Go to slide on click.',
      },
      infinite: {
        type: 'boolean',
        default: true,
        description: 'Infinitely wrap around contents.',
      },
      pauseOnDotsHover: {
        type: 'boolean',
        default: false,
        description: 'Prevents autoplay while hovering on dot.',
      },
      pauseOnFocus: {
        type: 'boolean',
        default: false,
        description: 'Prevents autoplay while focused on slides.',
      },
      pauseOnHover: {
        type: 'boolean',
        default: true,
        description: 'Prevents autoplay while hovering on track.',
      },
      responsive: {
        type: 'array',
        default: [],
        description: 'Customize based on breakpoints.',
        items: {
          type: 'object',
          properties: {
            breakpoint: {
              type: 'integer',
              description: 'Maximum screen size.',
            },
            settings: {
              type: 'object',
              description: 'Carousel properties.',
              docs: {
                displayType: 'yaml',
              },
            },
          },
        },
      },
      rows: {
        type: 'integer',
        default: 1,
        description: 'Number of rows per slide in the slider, (enables grid mode).',
      },
      rtl: {
        type: 'boolean',
        default: false,
        description: 'Reverses the slide order.',
      },
      slidesPerRow: {
        type: 'integer',
        default: 1,
        description: 'Number of slides to display in grid mode, this is useful with rows option.',
      },
      slidesToScroll: {
        type: 'integer',
        default: 1,
        description: 'How many slides to scroll at once.',
      },
      slidesToShow: {
        type: 'integer',
        default: 1,
        description: 'How many slides to show in one frame.',
      },
      speed: {
        type: 'integer',
        default: 500,
        description: 'Number of slides to display in grid mode, this is useful with rows option.',
      },
      swipeToSlide: {
        type: 'boolean',
        default: false,
        description: 'Enable drag/swipe irrespective of `slidesToScroll`.',
      },
      swipe: {
        type: 'boolean',
        default: true,
        description: 'Enable/disable swiping to change slides.',
      },
      vertical: {
        type: 'boolean',
        default: false,
        description: 'Whether or not the slides are shown in a column.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/carousel#design-token',
        },
        properties: {
          dotWidth: {
            type: 'number',
            default: 16,
            description: 'Width of the indicator dot.',
          },
          dotHeight: {
            type: 'number',
            default: 3,
            description: 'Height of the indicator dot.',
          },
          dotGap: {
            type: 'number',
            default: 4,
            description: 'Gap between indicator dots.',
          },
          dotOffset: {
            type: 'number',
            default: 12,
            description: 'Offset distance of dots from the carousel edge.',
          },
          dotActiveWidth: {
            type: 'number',
            default: 24,
            description: 'Width of the active indicator dot.',
          },
          arrowSize: {
            type: 'number',
            default: 16,
            description: 'Size of the navigation arrows.',
          },
          arrowOffset: {
            type: 'number',
            default: 8,
            description: 'Offset distance of arrows from the carousel edge.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color used for indicator dots.',
          },
        },
      },
    },
  },
};
