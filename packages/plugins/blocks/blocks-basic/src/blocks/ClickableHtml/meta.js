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
  hazards: [
    {
      id: 'html-style-stripped',
      message:
        'Content is sanitised with DOMPurify, so <style>, <script> and inline event handlers are removed before render. Clicks are wired through data-action attributes instead of inline handlers.',
      see: 'display-blocks/clickablehtml',
    },
  ],
  events: {
    onClick:
      'Trigger action when an element carrying a data-action attribute inside the html is clicked. The event object holds that element\'s data-* attributes with snake_case keys, so data-action="open" data-event-id="42" gives { action: "open", event_id: "42" }. The default browser action of the clicked element is prevented.',
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
          'Content to be rendered as Html. Elements with a data-action attribute become clickable and fire the onClick event.',
        docs: {
          displayType: 'text-area',
        },
      },
    },
  },
};
