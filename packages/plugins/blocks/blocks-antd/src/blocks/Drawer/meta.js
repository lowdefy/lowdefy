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

import focusable from '../../schemas/focusable.js';
import mask from '../../schemas/mask.js';

export default {
  category: 'container',
  icons: ['close'],
  valueType: null,
  slots: {
    content: 'Main Drawer body.',
    extra: 'Extra content in the header.',
    footer: 'The Drawer footer.',
  },
  cssKeys: {
    element: 'The Drawer element.',
    header: 'The Drawer header.',
    title: 'The Drawer title.',
    body: 'The Drawer body.',
    footer: 'The Drawer footer.',
    mask: 'The Drawer mask.',
    wrapper: 'The Drawer wrapper.',
    content: 'The Drawer content.',
  },
  events: {
    onToggle: 'Trigger actions when drawer is toggled.',
    onClose: 'Trigger actions when drawer is closed.',
    onOpen: 'Trigger actions when drawer is opened.',
    afterClose: 'Trigger actions after drawer is closed.',
    afterOpenChange: {
      description: 'Trigger actions after the open or close animation of the drawer has finished.',
      event: {
        open: 'True when the drawer opened, false when it closed.',
        drawerOpen: 'Same as open, kept for existing apps.',
      },
    },
    onResizeEnd: {
      description:
        'Trigger actions when the user finishes resizing a resizable drawer. Not triggered when the resize handle is clicked without dragging.',
      event: { size: 'The new size of the drawer in pixels.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      closable: {
        type: ['boolean', 'object'],
        default: true,
        description:
          'Whether a close (x) button is visible in the Drawer header or not. Set an object to disable the button or to move it to the end of the header.',
        docs: {
          displayType: 'yaml',
        },
        additionalProperties: false,
        properties: {
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Show the close button, but disabled.',
          },
          placement: {
            type: 'string',
            enum: ['start', 'end'],
            default: 'start',
            description: 'Place the close button at the start or the end of the header.',
          },
        },
      },
      destroyOnHidden: {
        type: 'boolean',
        default: false,
        description:
          'Unmount the blocks inside the Drawer when it closes, so they mount again (and their onMount events run) each time it opens. Their state is kept.',
      },
      focusable,
      forceRender: {
        type: 'boolean',
        default: false,
        description:
          'Render the blocks inside the Drawer before it is first opened, so their methods can be called and their onMount events run while it is still closed.',
      },
      getContainer: {
        type: ['string', 'boolean'],
        description:
          'Where the Drawer is mounted. By default it is mounted on the page body. Set to `false` to render it in place, inside the nearest positioned parent (give that parent `position: relative`), or to a CSS selector to mount it in the first matching element.',
      },
      loading: {
        type: 'boolean',
        default: false,
        description: 'Show a loading skeleton in place of the Drawer body.',
      },
      mask,
      maskClosable: {
        type: 'boolean',
        default: true,
        description:
          'Clicking on the mask (area outside the Drawer) to close the Drawer or not. `mask.closable` takes precedence.',
      },
      maxSize: {
        type: 'number',
        description: 'Maximum size in pixels a resizable Drawer can be dragged to.',
      },
      resizable: {
        type: 'boolean',
        default: false,
        description:
          'Let the user resize the Drawer by dragging its edge. The configured size is the starting size.',
      },
      size: {
        type: ['string', 'number'],
        description:
          'Size of the Drawer: width for left and right placements, height for top and bottom. `default` (378px), `large` (736px), a number of pixels or a CSS length. Takes precedence over width and height.',
        docs: {
          displayType: 'string',
        },
      },
      title: {
        type: 'string',
        description: 'The title of the Drawer - supports html.',
      },
      width: {
        type: ['string', 'number'],
        default: 378,
        description: 'Width of the Drawer dialog.',
        docs: {
          displayType: 'string',
        },
      },
      height: {
        type: ['string', 'number'],
        default: 378,
        description: 'When placement is top or bottom, height of the Drawer dialog.',
        docs: {
          displayType: 'string',
        },
      },
      zIndex: {
        type: 'integer',
        default: 1000,
        description: 'The z-index of the Drawer.',
      },
      placement: {
        type: 'string',
        enum: ['top', 'right', 'bottom', 'left'],
        default: 'right',
        description: 'The placement of the Drawer.',
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'Whether pressing Esc closes the Drawer.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/drawer#design-token',
        },
        properties: {
          footerPaddingBlock: {
            type: 'number',
            default: 8,
            description: 'Vertical padding of the footer.',
          },
          footerPaddingInline: {
            type: 'number',
            default: 16,
            description: 'Horizontal padding of the footer.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1000,
            description: 'Z-index of the drawer.',
          },
          draggerSize: {
            type: 'number',
            default: 4,
            description: 'Size of the resize handle.',
          },
          colorBgElevated: {
            type: 'string',
            description: 'Background color of the drawer.',
          },
          colorBgMask: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Background color of the drawer mask.',
          },
        },
      },
    },
  },
};
