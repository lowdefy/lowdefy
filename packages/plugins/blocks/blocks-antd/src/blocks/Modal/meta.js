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
  icons: ['close', 'loading'],
  valueType: null,
  slots: {
    content: 'Main Modal body.',
    footer: 'Custom footer. Overrides default Ok/Cancel buttons.',
  },
  cssKeys: {
    element: 'The Modal element.',
    header: 'The Modal header.',
    title: 'The Modal title.',
    body: 'The Modal body.',
    footer: 'The Modal footer.',
    mask: 'The Modal mask.',
    wrapper: 'The Modal wrapper.',
    content: 'The Modal content.',
  },
  hazards: [
    {
      id: 'modal-keeps-state',
      message:
        'Closing a Modal does not clear the state of the blocks inside it, while visible: false on the Modal does prune that state. Reset the values in onClose if a reopened Modal should start empty.',
      see: 'container-blocks/modal',
    },
  ],
  events: {
    onOk: 'Trigger actions when Ok button is clicked.',
    onOpen: 'Trigger actions when modal is opened.',
    onCancel: 'Trigger actions when Cancel button is clicked.',
    onClose: 'Trigger actions after onOk or onCancel is completed.',
    afterClose: 'Trigger actions after the modal has closed and its close animation has finished.',
    afterOpenChange: {
      description: 'Trigger actions after the open or close animation of the modal has finished.',
      event: { open: 'True when the modal opened, false when it closed.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      centered: {
        type: 'boolean',
        default: false,
        description: 'Center the modal vertically.',
      },
      closable: {
        type: ['boolean', 'object'],
        default: true,
        description:
          'Whether a close (x) button is visible on top right of the modal dialog or not. Set `{ disabled: true }` to show the button disabled.',
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
        },
      },
      destroyOnHidden: {
        type: 'boolean',
        default: false,
        description:
          'Unmount the blocks inside the modal when it closes, so they mount again (and their onMount events run) each time it opens. Their state is kept.',
      },
      focusable,
      forceRender: {
        type: 'boolean',
        default: false,
        description:
          'Render the blocks inside the modal before it is first opened, so their methods can be called and their onMount events run while it is still closed.',
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'Whether pressing Esc closes the modal.',
      },
      loading: {
        type: 'boolean',
        default: false,
        description: 'Show a loading skeleton in place of the modal body.',
      },
      scrollLock: {
        type: 'boolean',
        default: true,
        description: 'Whether to lock page scrolling while the modal is open.',
      },
      title: {
        type: 'string',
        description: "The modal dialog's title - supports html.",
      },
      footer: {
        type: 'boolean',
        default: true,
        description: 'Show footer area.',
      },
      mask,
      maskClosable: {
        type: 'boolean',
        default: true,
        description:
          'Whether to close the modal dialog when the mask (area outside the modal) is clicked. `mask.closable` takes precedence.',
      },
      okText: {
        type: 'string',
        description:
          'Text of the Ok button. When unset, antd uses the localized default from ConfigProvider locale.',
      },
      okButtonProps: {
        type: 'object',
        description: 'Set additional properties for the ok button.',
        docs: {
          displayType: 'yaml',
        },
      },
      cancelText: {
        type: 'string',
        description:
          'Text of the Cancel button. When unset, antd uses the localized default from ConfigProvider locale.',
      },
      cancelButtonProps: {
        type: 'object',
        description: 'Set additional properties for the cancel button.',
        docs: {
          displayType: 'yaml',
        },
      },
      width: {
        type: ['string', 'number', 'object'],
        default: 520,
        description:
          'Width of the modal dialog. Set an object of breakpoints (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`) for a responsive width.',
        docs: {
          displayType: 'yaml',
        },
        additionalProperties: false,
        properties: {
          xs: { type: ['string', 'number'], description: 'Width on extra small screens.' },
          sm: { type: ['string', 'number'], description: 'Width on small screens.' },
          md: { type: ['string', 'number'], description: 'Width on medium screens.' },
          lg: { type: ['string', 'number'], description: 'Width on large screens.' },
          xl: { type: ['string', 'number'], description: 'Width on extra large screens.' },
          xxl: { type: ['string', 'number'], description: 'Width on extra extra large screens.' },
        },
      },
      zIndex: {
        type: 'integer',
        default: 1000,
        description: 'The z-index of the modal. Useful when displaying two modals simultaneously.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/modal#design-token',
        },
        properties: {
          headerBg: {
            type: 'string',
            description: 'Background color of the modal header.',
          },
          titleLineHeight: {
            type: 'number',
            default: 1.5,
            description: 'Line height of the modal title.',
          },
          titleFontSize: {
            type: 'number',
            default: 16,
            description: 'Font size of the modal title.',
          },
          titleColor: {
            type: 'string',
            description: 'Color of the modal title text.',
          },
          contentBg: {
            type: 'string',
            description: 'Background color of the modal content.',
          },
          footerBg: {
            type: 'string',
            default: 'transparent',
            description: 'Background color of the modal footer.',
          },
          contentPadding: {
            type: ['number', 'string'],
            description: 'Padding of the content area.',
          },
          headerPadding: {
            type: ['number', 'string'],
            description: 'Padding of the header area.',
          },
          headerBorderBottom: {
            type: 'string',
            description: 'Border bottom of the header.',
          },
          headerMarginBottom: {
            type: 'number',
            default: 8,
            description: 'Margin bottom of the header.',
          },
          bodyPadding: {
            type: 'number',
            description: 'Padding of the body area.',
          },
          footerPadding: {
            type: ['number', 'string'],
            description: 'Padding of the footer area.',
          },
          footerBorderTop: {
            type: 'string',
            description: 'Border top of the footer.',
          },
          footerBorderRadius: {
            type: ['number', 'string'],
            description: 'Border radius of the footer.',
          },
          footerMarginTop: {
            type: ['number', 'string'],
            default: 8,
            description: 'Margin top of the footer.',
          },
          confirmBodyPadding: {
            type: ['number', 'string'],
            description: 'Padding of the confirm modal body.',
          },
          confirmIconMarginInlineEnd: {
            type: ['number', 'string'],
            description: 'Inline end margin of the confirm modal icon.',
          },
          confirmBtnsMarginTop: {
            type: ['number', 'string'],
            description: 'Margin top of the confirm modal buttons.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius of the modal.',
          },
          colorBgMask: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Background color of the modal mask.',
          },
        },
      },
    },
  },
};
