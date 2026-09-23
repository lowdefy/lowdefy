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
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Html element.',
  },
  // Each clickable element names its event in a data-event attribute, so the
  // event names this block fires are authored in its html.
  events: {
    onTextSelection:
      'Trigger action when text is selected and pass selected text to the event object.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      html: {
        type: 'string',
        description:
          'Content to be rendered as Html. An element with a data-event attribute fires the event it names when clicked (data-event="onEditClick" fires events.onEditClick), and its default browser action is prevented. The event object holds the element\'s other data-* attributes with snake_case keys, so data-event="onEditClick" data-record-id="42" gives { record_id: "42" }.',
        docs: {
          displayType: 'text-area',
        },
      },
    },
  },
};
