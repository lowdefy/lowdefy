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

// A page with the given blocks under a Box, a Paragraph showing `_state: mirrorKey`, and a
// Submit button that runs Validate.
function formPage({ blocks, mirrorKey }) {
  return {
    id: 'form',
    type: 'Box',
    blocks: [
      ...blocks,
      { id: 'mirror', type: 'Paragraph', properties: { content: { _state: mirrorKey } } },
      {
        id: 'submit',
        type: 'Button',
        properties: { title: 'Submit' },
        events: { onClick: [{ id: 'validate', type: 'Validate' }] },
      },
    ],
  };
}

export default formPage;
