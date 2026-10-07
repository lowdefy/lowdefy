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

import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react';

import LoadingContainer from './LoadingContainer.js';

// Stands in for @lowdefy/blocks-antd Card, which triggers onClick on every click.
function Card({ blockId, content, methods }) {
  return (
    <div id={blockId} onClick={() => methods.triggerEvent({ name: 'onClick' })}>
      {content.content && content.content()}
    </div>
  );
}

test('LoadingContainer renders a Card skeleton that can be clicked without an error', () => {
  const lowdefy = { _internal: { components: {} }, basePath: '', menus: [], pageId: 'page' };
  const skeleton = { id: 'skeleton', type: 'Card', slots: { content: { blocks: [] } } };
  const onError = jest.fn();
  window.addEventListener('error', onError);
  const { container } = render(
    <LoadingContainer
      blockId="card"
      Component={Card}
      context={{}}
      lowdefy={lowdefy}
      skeleton={skeleton}
    />
  );
  fireEvent.click(container.querySelector('#card'));
  window.removeEventListener('error', onError);
  expect(onError).not.toHaveBeenCalled();
});
