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
  type: ['boolean', 'object'],
  default: true,
  description:
    'Whether to show the mask. Set an object to configure the mask with `enabled`, `blur` and `closable`.',
  docs: {
    displayType: 'yaml',
  },
  additionalProperties: false,
  properties: {
    enabled: {
      type: 'boolean',
      default: true,
      description: 'Whether to show the mask.',
    },
    blur: {
      type: 'boolean',
      default: false,
      description: 'Blur the page behind the mask.',
    },
    closable: {
      type: 'boolean',
      description:
        'Whether clicking the mask closes the dialog. Takes precedence over `maskClosable`.',
    },
  },
};
