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

import collectHtmlPageLinks from './collectHtmlPageLinks.js';

function collect(value) {
  return collectHtmlPageLinks({ json: JSON.stringify(value) });
}

test('collectHtmlPageLinks reads a single-quoted data-path-params JSON object', () => {
  expect(
    collect({
      html: `<a data-page-id="ticket" data-path-params='{"space":"s","ticket_id":"1"}'>t</a>`,
    })
  ).toEqual([
    { pageId: 'ticket', pathParams: { space: 's', ticket_id: '1' }, pathParamsDynamic: false },
  ]);
});

test('collectHtmlPageLinks reads a double-quoted data-path-params written with &quot;', () => {
  expect(
    collect({
      html: '<a data-path-params="{&quot;ticket_id&quot;:&quot;1&quot;}" data-page-id="ticket">t</a>',
    })
  ).toEqual([{ pageId: 'ticket', pathParams: { ticket_id: '1' }, pathParamsDynamic: false }]);
});

test('collectHtmlPageLinks gives a link without data-path-params no path params', () => {
  expect(collect({ html: '<a data-page-id="home">Home</a>' })).toEqual([
    { pageId: 'home', pathParams: undefined, pathParamsDynamic: false },
  ]);
});

test('collectHtmlPageLinks marks data-path-params built at runtime as dynamic', () => {
  expect(
    collect([
      'return `<a data-page-id="ticket" data-path-params=\'${JSON.stringify(params)}\'>t</a>`;',
    ])
  ).toEqual([{ pageId: 'ticket', pathParams: undefined, pathParamsDynamic: true }]);
});

test('collectHtmlPageLinks pairs each data-page-id with the data-path-params of its own element', () => {
  expect(
    collect({
      html: `<a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>1</a> <a data-page-id="home">home</a> <a data-page-id="ticket" data-path-params='{"ticket_id":"1"}'>again</a>`,
    })
  ).toEqual([
    { pageId: 'ticket', pathParams: { ticket_id: '1' }, pathParamsDynamic: false },
    { pageId: 'home', pathParams: undefined, pathParamsDynamic: false },
  ]);
});
