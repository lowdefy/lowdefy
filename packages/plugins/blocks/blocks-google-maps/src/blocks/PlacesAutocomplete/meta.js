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

import AutoCompleteMeta from '@lowdefy/blocks-antd/blocks/AutoComplete/meta.js';

export default {
  category: 'input',
  icons: ['error', 'success', 'loading', 'warning', 'help', 'location', 'clear'],
  valueType: 'object',
  cssKeys: {
    element: 'The PlacesAutocomplete input element.',
    selector: 'The inner value container of the input (antd `content` semantic slot).',
    label: 'The PlacesAutocomplete label.',
    extra: 'The PlacesAutocomplete extra content.',
    feedback: 'The PlacesAutocomplete validation feedback.',
    options: 'Each suggestion in the dropdown.',
    popup: 'The suggestions dropdown.',
  },
  events: {
    onBlur: 'Trigger actions when the input loses focus.',
    onChange: {
      description:
        'Trigger actions after the block value changes, by typing, by selecting a suggestion or by clearing the input.',
      event: { value: 'The new block value.' },
    },
    onClear: 'Trigger actions when the input is cleared.',
    onError: {
      description:
        'Trigger actions when fetching suggestions or place fields fails, for example when the Places API is not enabled on the API key. When fetching place fields fails, the typed text stays in the block value and onPlaceChanged is not triggered.',
      event: { message: 'The error message.' },
    },
    onFocus: 'Trigger actions when the input gains focus.',
    onPlaceChanged: {
      description:
        'Trigger actions after a suggestion is selected and its place fields have been fetched and written to the block value.',
      event: {
        place: 'The fetched place fields, after `resultMapping` is applied.',
        value: 'The new block value.',
      },
    },
    onSearch: {
      description: 'Trigger actions when the search text changes.',
      event: { value: 'The search input text.' },
    },
    onTooltipClick: 'Trigger actions when the tooltip icon is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      allowClear: {
        type: 'boolean',
        default: true,
        description:
          'Allow the user to clear the input. Clearing removes the place keys from the block value, and sets the value to null when no sibling keys remain.',
      },
      autoFocus: {
        type: 'boolean',
        default: false,
        description: 'Autofocus to the block on page load.',
      },
      backfill: {
        type: 'boolean',
        default: false,
        description: 'Backfill the highlighted suggestion into the input when using the keyboard.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description:
          'Whether or not the input has a border style. Deprecated, use variant instead.',
      },
      debounce: {
        type: 'number',
        default: 250,
        description:
          'Milliseconds to wait after the last keystroke before requesting suggestions from the Places API.',
      },
      defaultOpen: {
        type: 'boolean',
        default: false,
        description: 'Initial open state of the suggestions dropdown.',
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the block if true.',
      },
      fetchFields: {
        type: 'array',
        description:
          'Place fields to fetch when a suggestion is selected, in camelCase, for example `addressComponents`, `location` or `viewport`. `formattedAddress` is always fetched. See <a href="https://developers.google.com/maps/documentation/javascript/reference/place#Place">Place fields</a>.',
        items: {
          type: 'string',
        },
      },
      label: {
        type: 'object',
        description: 'Label properties.',
        additionalProperties: false,
        properties: {
          align: {
            type: 'string',
            enum: ['left', 'right'],
            default: 'left',
            description: 'Align label left or right when inline.',
          },
          colon: {
            type: 'boolean',
            default: true,
            description: 'Append label with colon.',
          },
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Hide input label.',
          },
          extra: {
            type: 'string',
            description: 'Extra text to display beneath the content - supports html.',
          },
          hasFeedback: {
            type: 'boolean',
            default: true,
            description:
              'Display feedback extra from validation, this does not disable validation.',
          },
          inline: {
            type: 'boolean',
            default: false,
            description: 'Render input and label inline.',
          },
          span: {
            type: 'number',
            description: 'Label inline span.',
          },
          title: {
            type: 'string',
            description: 'Label title - supports html.',
          },
          tooltip: {
            description:
              "Help tooltip shown via an icon beside the label. A string sets the tooltip text (supports html), or an object to also customize the icon and color. Use the block's onTooltipClick event to respond to clicks on the icon.",
            oneOf: [
              {
                type: 'string',
              },
              {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: {
                    type: 'string',
                    description: 'Tooltip text shown on hover - supports html.',
                  },
                  icon: {
                    type: 'string',
                    default: 'help',
                    description:
                      'Icon name to show beside the label: a semantic name like `help`, a Lucide icon name like `CircleQuestionMark`, or a set-qualified name like `tabler:HelpCircle`.',
                  },
                  color: {
                    type: 'string',
                    description: 'Color of the tooltip icon.',
                    docs: {
                      displayType: 'color',
                    },
                  },
                },
              },
            ],
          },
        },
      },
      labelField: {
        type: 'string',
        default: 'formattedAddress',
        description:
          "The key in the block value, after `resultMapping` is applied, that is displayed in the input and written when the user types free text. Typing removes the keys the previous place wrote (the mapped `input`, `id`, `formattedAddress` and `fetchFields` keys), so typed text never carries another place's fields.",
      },
      loadingPlaceholder: {
        type: 'string',
        default: 'Loading...',
        description: 'Text displayed in the dropdown while suggestions are being fetched.',
      },
      notFoundContent: {
        type: 'string',
        default: 'No results found',
        description: 'Text displayed in the dropdown when the search returns no suggestions.',
      },
      optionsIcon: {
        type: ['string', 'object'],
        default: 'location',
        description:
          'Icon displayed before each suggestion in the dropdown: a semantic name like `location`, a Lucide icon name like `MapPin`, or a set-qualified name like `tabler:MapPin`, or properties of an Icon block.',
        docs: {
          displayType: 'icon',
        },
      },
      placeholder: {
        type: 'string',
        default: 'Start typing to search',
        description: 'Placeholder text inside the block before the user types input.',
      },
      requestOptions: {
        type: 'object',
        description:
          'Additional options passed to the autocomplete request. See <a href="https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#AutocompleteRequest">AutocompleteRequest</a>.',
        properties: {
          includedPrimaryTypes: {
            type: 'array',
            description:
              'Restrict suggestions to these place types, for example `street_address` or `locality`.',
            items: {
              type: 'string',
            },
          },
          includedRegionCodes: {
            type: 'array',
            description:
              'Restrict suggestions to these regions, as up to 15 CLDR two character region codes, for example `["us", "gb"]`.',
            items: {
              type: 'string',
            },
          },
          language: {
            type: 'string',
            description: 'The language in which to return the suggestions.',
          },
          locationBias: {
            type: 'object',
            description:
              'Bias suggestions towards an area, as a circle or a rectangle. Cannot be used with locationRestriction.',
          },
          locationRestriction: {
            type: 'object',
            description:
              'Restrict suggestions to an area, as a circle or a rectangle. Cannot be used with locationBias.',
          },
          origin: {
            type: 'object',
            description:
              'The origin from which the distance to a suggestion is calculated, as a lat and lng object.',
            properties: {
              lat: {
                type: 'number',
                description: 'Lateral coordinate.',
              },
              lng: {
                type: 'number',
                description: 'Longitudinal coordinate.',
              },
            },
          },
          region: {
            type: 'string',
            description: 'The region code used to format the suggestions.',
          },
        },
      },
      resultMapping: {
        type: 'object',
        description:
          'Rename the fetched place fields before they are written to the block value. Dotted target paths are nested, for example `{ formattedAddress: address.line1, location: geometry.location }`.',
      },
      size: {
        type: 'string',
        enum: ['small', 'middle', 'large'],
        default: 'middle',
        description: 'Size of the block.',
      },
      theme: AutoCompleteMeta.properties.properties.theme,
      title: {
        type: 'string',
        description:
          'Title to describe the input component, if no title is specified the block id is displayed - supports html.',
      },
      variant: {
        type: 'string',
        enum: ['outlined', 'filled', 'borderless', 'underlined'],
        default: 'outlined',
        description: 'Input visual variant. When set, takes precedence over bordered.',
      },
    },
  },
};
