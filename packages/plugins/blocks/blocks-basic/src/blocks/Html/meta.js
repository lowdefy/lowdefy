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
        'Content is sanitised with DOMPurify, so <style>, <script> and inline event handlers are removed before render. Use DangerousHtml for a trusted <style> block, or style the block through its style and class properties.',
      see: 'display-blocks/html',
    },
    {
      id: 'html-no-click-events',
      message:
        'Html fires no events from its markup: data-event attributes do nothing here. Use ClickableHtml for clickable elements, including icons.',
      see: 'display-blocks/clickablehtml',
    },
    {
      id: 'html-hardcoded-links',
      message:
        'Link to app pages with <a data-page-id="page-id" data-url-query="key=value">, not <a href="/page-id?key=value">. A hard-coded href reloads the whole app on click, ignores basePath and is not checked by the build. Use data-new-tab, not target="_blank", which sanitising removes.',
      see: 'concepts/html-attributes',
    },
    {
      id: 'html-inline-status-pills',
      message:
        'Show statuses with <span data-tag="success">Approved</span> or <span data-status="warning">Syncing</span>, not inline-styled pills or hex status colours. data-tag and data-status follow the theme and dark mode and match the ag-grid tag cells.',
      see: 'concepts/html-attributes',
    },
  ],
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
          'Content to be rendered as Html. It understands these attributes: data-icon="edit" renders an icon (a semantic name like edit, delete, warning, or a React Icons name); data-tooltip="Text" shows a tooltip on hover and focus; data-popover="id" toggles a popover showing the element with data-popover-content="id" (mark it hidden); <a data-page-id="page-id" data-url-query="key=value"> links to an app page without reloading (never hard-code href="/page"); data-link opts an existing app-relative <a href="/path"> into the same navigation; data-new-tab opens a link in a new tab (target is stripped by sanitising); data-tag="success" renders a tinted status tag and data-status="success" a status dot (tones success, processing, info, warning, error, default, an antd preset colour, a CSS colour, or any other value to seed a stable colour); <time datetime="ISO" data-time="relative"> renders a date as relative, date, datetime, time or a dayjs format; data-format="currency" data-currency="USD" formats the element\'s number as number, currency, percent, compact or bytes; data-avatar="Jane Doe" renders initials (on an <img>, a fallback for a broken image; never use an avatar image service); data-copy adds a copy button for the element\'s text or the attribute\'s value. See the HTML attributes docs page.',
        docs: {
          displayType: 'text-area',
        },
      },
    },
  },
};
