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
import { createPortal } from 'react-dom';
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HtmlComponent from '../HtmlComponent.js';
import registerHtmlEnhancements from '../registerHtmlEnhancements.js';

// Stands in for the client's overlay: a confirm renders its message with OK and
// Cancel into the body, and Escape reports its reason like the real one.
function HtmlOverlay({ content, kind, onClose, onConfirm }) {
  React.useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose('escape');
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return createPortal(
    <div data-testid={`overlay-${kind}`}>
      {content}
      {kind === 'confirm' && (
        <>
          <button onClick={onConfirm}>OK</button>
          <button onClick={() => onClose('cancel')}>Cancel</button>
          <button onClick={() => onClose('outside')}>Outside</button>
        </>
      )}
    </div>,
    document.body
  );
}

const translate = (key) => ({ 'client.confirm': 'Are you sure?' })[key];

beforeEach(() => {
  registerHtmlEnhancements({ HtmlOverlay, Icon: () => null, icons: {}, translate });
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  registerHtmlEnhancements(null);
  console.warn.mockRestore();
});

function renderConfirm(html) {
  const onDataEvent = jest.fn();
  const utils = render(<HtmlComponent html={html} onDataEvent={onDataEvent} />);
  return { ...utils, onDataEvent };
}

test('data-confirm asks before the event fires, and Cancel does not fire', () => {
  const { container, onDataEvent } = renderConfirm(
    '<i data-event="onDelete" data-id="7" data-confirm="Delete this row?">x</i>'
  );
  const target = container.querySelector('[data-event]');
  fireEvent.click(target);
  expect(onDataEvent).not.toHaveBeenCalled();
  expect(screen.getByTestId('overlay-confirm').textContent).toContain('Delete this row?');
  fireEvent.click(screen.getByText('Cancel'));
  expect(screen.queryByTestId('overlay-confirm')).toBeNull();
  expect(onDataEvent).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(target);
});

test('OK fires the event exactly once and returns focus to the target', () => {
  const { container, onDataEvent } = renderConfirm(
    '<i data-event="onDelete" data-id="7" data-confirm="Delete?">x</i>'
  );
  fireEvent.click(container.querySelector('[data-event]'));
  const ok = screen.getByText('OK');
  fireEvent.click(ok);
  fireEvent.click(ok);
  expect(onDataEvent).toHaveBeenCalledTimes(1);
  expect(onDataEvent).toHaveBeenCalledWith({
    name: 'onDelete',
    event: { id: '7', confirm: 'Delete?' },
  });
  expect(document.activeElement).toBe(container.querySelector('[data-event]'));
});

test('Escape cancels, and an outside click cancels without moving focus', () => {
  const { container, onDataEvent } = renderConfirm(
    '<i data-event="onDelete" data-confirm>x</i><input id="other">'
  );
  const target = container.querySelector('[data-event]');
  fireEvent.click(target);
  expect(screen.getByTestId('overlay-confirm').textContent).toContain('Are you sure?');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByTestId('overlay-confirm')).toBeNull();
  expect(document.activeElement).toBe(target);

  fireEvent.click(target);
  container.querySelector('#other').focus();
  fireEvent.click(screen.getByText('Outside'));
  expect(screen.queryByTestId('overlay-confirm')).toBeNull();
  expect(document.activeElement).toBe(container.querySelector('#other'));
  expect(onDataEvent).not.toHaveBeenCalled();
});

test('Enter opens the confirm, and Space opens it on key up', async () => {
  const { container } = renderConfirm('<span data-event="onArchive" data-confirm>Archive</span>');
  const user = userEvent.setup();
  container.querySelector('[data-event]').focus();
  await user.keyboard('{Enter}');
  expect(screen.getByTestId('overlay-confirm')).toBeDefined();
  fireEvent.click(screen.getByText('Cancel'));

  const target = container.querySelector('[data-event]');
  fireEvent.keyDown(target, { key: ' ' });
  expect(screen.queryByTestId('overlay-confirm')).toBeNull();
  fireEvent.keyUp(target, { key: ' ' });
  expect(screen.getByTestId('overlay-confirm')).toBeDefined();
});

test('a confirm inside a popover fires through the popover, which then closes', () => {
  const { container, onDataEvent } = renderConfirm(
    '<span data-popover="menu">Actions</span><div data-popover-content="menu" hidden><p data-event="onDelete" data-id="3" data-confirm="Delete?">Delete</p></div>'
  );
  fireEvent.click(container.querySelector('[data-popover]'));
  const popover = screen.getByTestId('overlay-popover');
  fireEvent.click(popover.querySelector('[data-event]'));
  expect(screen.getByTestId('overlay-popover')).toBeDefined();
  expect(onDataEvent).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('OK'));
  expect(onDataEvent).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('overlay-popover')).toBeNull();
});

test('a confirm on a popover trigger shows the confirm, not the popover', () => {
  const { container, onDataEvent } = renderConfirm(
    '<span data-popover="m" data-event="onDelete" data-confirm="Delete?">More</span><div data-popover-content="m" hidden>Menu</div>'
  );
  fireEvent.click(container.querySelector('[data-popover]'));
  expect(screen.getByTestId('overlay-confirm')).toBeDefined();
  expect(screen.queryByTestId('overlay-popover')).toBeNull();
  fireEvent.click(screen.getByText('OK'));
  expect(onDataEvent).toHaveBeenCalledTimes(1);
});

test('a second click on the target keeps its open confirm', () => {
  const { container, onDataEvent } = renderConfirm(
    '<i data-event="onDelete" data-confirm="Delete?">x</i>'
  );
  const target = container.querySelector('[data-event]');
  fireEvent.click(target);
  const overlay = screen.getByTestId('overlay-confirm');
  fireEvent.click(target);
  expect(screen.getByTestId('overlay-confirm')).toBe(overlay);
  expect(onDataEvent).not.toHaveBeenCalled();
});

test('after OK inside a popover, focus returns to the popover trigger', () => {
  const { container } = renderConfirm(
    '<span data-popover="menu">Actions</span><div data-popover-content="menu" hidden><p data-event="onDelete" data-confirm="Delete?">Delete</p></div>'
  );
  const trigger = container.querySelector('[data-popover]');
  fireEvent.click(trigger);
  fireEvent.click(screen.getByTestId('overlay-popover').querySelector('[data-event]'));
  fireEvent.click(screen.getByText('OK'));
  expect(document.activeElement).toBe(trigger);
});

test('Space released without a Space press on the target does not activate it', () => {
  const { container } = renderConfirm('<span data-event="onArchive" data-confirm>Archive</span>');
  const target = container.querySelector('[data-event]');
  fireEvent.keyUp(target, { key: ' ' });
  expect(screen.queryByTestId('overlay-confirm')).toBeNull();
});

test('a hover tooltip does not replace an open confirm', () => {
  const { container } = renderConfirm(
    '<i data-event="onDelete" data-tooltip="Delete" data-confirm="Delete?">x</i>'
  );
  const target = container.querySelector('[data-event]');
  fireEvent.mouseOver(target);
  expect(screen.getByTestId('overlay-tooltip')).toBeDefined();
  fireEvent.click(target);
  expect(screen.getByTestId('overlay-confirm')).toBeDefined();
  fireEvent.mouseOut(target, { relatedTarget: document.body });
  fireEvent.mouseOver(target);
  expect(screen.getByTestId('overlay-confirm')).toBeDefined();
  expect(screen.queryByTestId('overlay-tooltip')).toBeNull();
});

test('data-confirm without data-event, or in HTML without events, is reported', () => {
  render(<HtmlComponent html='<span data-confirm="Sure?">x</span>' />);
  expect(console.warn).toHaveBeenCalledWith(
    'data-confirm only works in ClickableHtml, on an element with data-event.'
  );
  renderConfirm('<span data-confirm="Sure?">x</span>');
  expect(console.warn).toHaveBeenCalledWith(
    'data-confirm needs data-event on the same element, so it was ignored.'
  );
});

test('a copy button inside a confirm-gated element only copies', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  registerHtmlEnhancements({
    HtmlOverlay,
    Icon: () => null,
    icons: {},
    translate: (key) => key,
  });
  const { container, onDataEvent } = renderConfirm(
    '<span data-event="onOpen" data-confirm="Open?"><code data-copy>abc</code></span>'
  );
  await act(async () => {
    container
      .querySelector('[data-lf-copy] button')
      .dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  expect(writeText).toHaveBeenCalledWith('abc');
  expect(screen.queryByTestId('overlay-confirm')).toBeNull();
  expect(onDataEvent).not.toHaveBeenCalled();
});
