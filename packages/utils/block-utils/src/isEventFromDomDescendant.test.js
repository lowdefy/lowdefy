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

import { jest } from '@jest/globals';
import React from 'react';
import { createPortal } from 'react-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import isEventFromDomDescendant from './isEventFromDomDescendant.js';

function Clickable({ onClick, children }) {
  return (
    <div data-testid="clickable" onClick={(event) => onClick(isEventFromDomDescendant(event))}>
      {children}
    </div>
  );
}

test('isEventFromDomDescendant is true for a click on a DOM child', () => {
  const onClick = jest.fn();
  render(
    <Clickable onClick={onClick}>
      <span>child</span>
    </Clickable>
  );
  fireEvent.click(screen.getByText('child'));
  expect(onClick).toHaveBeenCalledWith(true);
});

test('isEventFromDomDescendant is false for a click inside a portal rendered by a child', () => {
  const onClick = jest.fn();
  render(
    <Clickable onClick={onClick}>{createPortal(<span>in portal</span>, document.body)}</Clickable>
  );
  fireEvent.click(screen.getByText('in portal'));
  expect(onClick).toHaveBeenCalledWith(false);
});
