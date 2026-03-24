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

import LabelMeta from '../Label/meta.js';
import label from '../../schemas/label.js';
import icon from '../../schemas/icon.js';
import { disabled, inputTitle, autoFocus } from '../../schemas/inputProperties.js';

export default {
  category: 'input',
  icons: [...LabelMeta.icons, 'AiOutlineFrown', 'AiOutlineSmile'],
  valueType: 'any',
  cssKeys: {
    element: 'The RatingSlider element.',
    label: 'The RatingSlider label.',
    extra: 'The RatingSlider extra content.',
    feedback: 'The RatingSlider validation feedback.',
    minIcon: 'The min icon in the RatingSlider.',
    maxIcon: 'The max icon in the RatingSlider.',
  },
  events: {
    onChange: {
      description: 'Trigger action when rating is changed.',
      event: { value: 'The selected rating value.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      autoFocus,
      color: {
        type: 'string',
        description: 'Rating slider color.',
        docs: {
          displayType: 'color',
        },
      },
      disabled,
      disableIcons: {
        type: 'boolean',
        default: false,
        description: 'Hides minimum and maximum icons.',
      },
      disableNotApplicable: {
        type: 'boolean',
        default: false,
        description: 'Disables the N/A option left of slider.',
      },
      minIcon: {
        ...icon,
        default: 'AiOutlineFrown',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize the icon to the left of the minimum side of the slider.",
      },
      maxIcon: {
        ...icon,
        default: 'AiOutlineSmile',
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize the icon to the right of the maximum side of the slider.",
      },
      label,
      min: {
        type: 'number',
        default: 0,
        description: 'The minimum value of the slider.',
      },
      max: {
        type: 'number',
        default: 10,
        description: 'The maximum value of the slider.',
      },
      notApplicableLabel: {
        type: 'string',
        default: 'N/A',
        description: 'Label shown at the null value of the slider.',
      },
      showDots: {
        type: 'boolean',
        default: true,
        description: 'Shows dots at values between step values when true.',
      },
      showMarks: {
        type: 'boolean',
        default: true,
        description: 'Shows values at specified min, max and step values.',
      },
      step: {
        type: 'number',
        default: 1,
        exclusiveMinimum: 0,
        description: ' The size of the step between values, has to be values greater than 0.',
      },
      tooltipVisible: {
        type: 'string',
        enum: ['never', 'onClick', 'always'],
        default: 'onClick',
        description: 'When tooltip should be visible.',
      },
      title: inputTitle,
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/slider#design-token',
        },
        properties: {
          controlSize: {
            type: 'number',
            default: 10,
            description: 'Size of the slider control element.',
          },
          railSize: {
            type: 'number',
            default: 4,
            description: 'Height (horizontal) or width (vertical) of the slider rail track.',
          },
          handleSize: {
            type: 'number',
            default: 10,
            description: 'Size of the slider handle.',
          },
          handleSizeHover: {
            type: 'number',
            default: 12,
            description: 'Size of the slider handle on hover.',
          },
          dotSize: {
            type: 'number',
            default: 8,
            description: 'Size of the slider step dots.',
          },
          handleLineWidth: {
            type: 'number',
            default: 2,
            description: 'Border line width of the handle.',
          },
          handleLineWidthHover: {
            type: 'number',
            default: 2.5,
            description: 'Border line width of the handle on hover.',
          },
          railBg: {
            type: 'string',
            default: 'rgba(0,0,0,0.04)',
            description: 'Background color of the slider rail.',
          },
          railHoverBg: {
            type: 'string',
            default: 'rgba(0,0,0,0.06)',
            description: 'Background color of the slider rail on hover.',
          },
          trackBg: {
            type: 'string',
            default: '#91caff',
            description: 'Background color of the active track.',
          },
          trackHoverBg: {
            type: 'string',
            default: '#69b1ff',
            description: 'Background color of the active track on hover.',
          },
          handleColor: {
            type: 'string',
            default: '#91caff',
            description: 'Color of the slider handle.',
          },
          handleActiveColor: {
            type: 'string',
            default: '#1677ff',
            description: 'Color of the slider handle when active.',
          },
          handleActiveOutlineColor: {
            type: 'string',
            default: 'rgba(22,119,255,0.2)',
            description: 'Color of the handle focus outline ring.',
          },
          handleColorDisabled: {
            type: 'string',
            default: '#bfbfbf',
            description: 'Color of the slider handle when disabled.',
          },
          dotBorderColor: {
            type: 'string',
            default: '#f0f0f0',
            description: 'Border color of the step dots.',
          },
          dotActiveBorderColor: {
            type: 'string',
            default: '#91caff',
            description: 'Border color of the active step dots.',
          },
          trackBgDisabled: {
            type: 'string',
            default: 'rgba(0,0,0,0.04)',
            description: 'Background color of the track when disabled.',
          },
        },
      },
    },
  },
};
