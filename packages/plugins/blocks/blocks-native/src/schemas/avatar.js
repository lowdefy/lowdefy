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

// One avatar: a person's name (for initials and colour), image and colour.
export default {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      description:
        "The person's name or email address. The avatar shows its initials, on a colour picked from the name so the person has the same colour everywhere.",
    },
    src: {
      type: 'string',
      description:
        'A picture: an image url, cached on the device, or an SVG data URI. The initials show while it loads, and when it is missing or fails to load.',
    },
    content: {
      type: 'string',
      description: 'Initials to show in place of the ones taken from the name.',
    },
    color: {
      type: 'string',
      description:
        'The avatar colour in place of the one picked from the name: a palette hue (blue, purple, teal, amber, ...), a theme token name or a colour.',
      docs: { displayType: 'color' },
    },
  },
};
