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
  params: {
    type: 'string',
    enum: ['displayMode', 'embedded'],
    description:
      'The value to return about the MCP host the page is shown in as a view. "embedded" is true inside a host. "displayMode" is how the host shows the view: "inline", "fullscreen" or "pip". Every key returns null when the page is not inside a host.',
  },
};
