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
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      ariaLabel: {
        type: 'string',
        description: 'Arial-label to apply to link tag.',
      },
      back: {
        type: 'boolean',
        description: 'When the link is clicked, trigger the browser back.',
      },
      home: {
        type: 'boolean',
        description: 'When the link is clicked, route to the home page.',
      },
      input: {
        type: 'object',
        description:
          'When the link is clicked, pass data as the input object to the next Lowdefy page.  Can only be used with pageId link and newTab false.',
        docs: {
          displayType: 'yaml',
        },
      },
      urlQuery: {
        type: 'object',
        description: 'When the link is clicked, pass data as a url query to the next page.',
        docs: {
          displayType: 'yaml',
        },
      },
      disabled: {
        type: 'boolean',
        default: false,
        description: 'Disable the anchor if true.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block for anchor icon.",
        docs: {
          displayType: 'icon',
        },
      },
      pageId: {
        type: 'string',
        description: 'When the link is clicked, route to the provided Lowdefy page.',
      },
      href: {
        type: 'string',
        description: 'The href to link to when the anchor link is clicked.',
      },
      url: {
        type: 'string',
        description: 'External url to link to when the anchor link is clicked.',
      },
      rel: {
        type: 'string',
        default: 'noopener noreferrer',
        description: 'The relationship of the linked URL as space-separated link types.',
      },
      newTab: {
        type: 'boolean',
        default: false,
        description: 'Open link in a new tab when the anchor link is clicked.',
      },
      replace: {
        type: 'boolean',
        default: false,
        description:
          'Prevent adding a new entry into browser history by replacing the url instead of pushing into history. Can only be used with pageId link and newTab false.',
      },
      scroll: {
        type: 'boolean',
        default: false,
        description:
          'Disable scrolling to the top of the page after page transition. Can only be used with pageId link and newTab false.',
      },
      title: {
        type: 'string',
        description: 'Text to display in the anchor.',
      },
    },
  },
  cssKeys: ['element'],
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description: 'Called when Anchor is clicked.',
      },
    },
  },
};
