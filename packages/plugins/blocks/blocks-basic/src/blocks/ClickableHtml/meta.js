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
        'Content is sanitised with DOMPurify, so <style>, <script> and inline event handlers are removed before render. Clicks are wired through data-event attributes instead of inline handlers.',
      see: 'display-blocks/clickablehtml',
    },
  ],
  // Each clickable element names its event in a data-event attribute, so the
  // event names this block fires are authored in its html.
  dynamicEvents: true,
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
          'Content to be rendered as Html. An element with a data-event attribute fires the event it names when clicked (data-event="onEditClick" fires events.onEditClick), and its default browser action is prevented. The event object holds the element\'s other data-* attributes with snake_case keys, so data-event="onEditClick" data-record-id="42" gives { record_id: "42" }. Targets that are not links or buttons become keyboard focusable, and Enter or Space clicks them. A data-event inside popover content fires too, then closes the popover. A link with data-event fires the event and does not navigate. All Html block attributes work too: data-icon, data-tooltip, data-popover, data-page-id links, data-new-tab, data-tag, data-status, data-time, data-format, data-avatar and data-copy. See the HTML attributes docs page.',
        docs: {
          displayType: 'text-area',
        },
      },
    },
  },
};
