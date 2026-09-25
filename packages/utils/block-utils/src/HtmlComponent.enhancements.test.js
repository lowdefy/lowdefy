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

import HtmlComponent from './HtmlComponent.js';
import registerHtmlEnhancements from './registerHtmlEnhancements.js';

function Icon({ properties }) {
  return <svg data-testid={`icon-${properties.name}`} />;
}

// Stands in for the client's antd overlay: renders its content into the body,
// nothing in place.
function HtmlOverlay({ content, kind, onClose }) {
  return createPortal(
    <div data-testid={`overlay-${kind}`}>
      {content}
      <button onClick={onClose}>close overlay</button>
    </div>,
    document.body
  );
}

const icons = { edit: () => null, delete: () => null, LuTrash2: () => null };

beforeEach(() => {
  registerHtmlEnhancements({ HtmlOverlay, Icon, icons });
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  registerHtmlEnhancements(null);
  console.warn.mockRestore();
});

test('HtmlComponent renders data-icon placeholders as icons', () => {
  const { container } = render(
    <HtmlComponent div={true} html='<i data-icon="edit"></i> Edit <i data-icon="LuTrash2"></i>' />
  );
  expect(screen.getByTestId('icon-edit')).toBeDefined();
  expect(screen.getByTestId('icon-LuTrash2')).toBeDefined();
  const placeholder = container.querySelector('[data-icon="edit"]');
  expect(placeholder.contains(screen.getByTestId('icon-edit'))).toBe(true);
  expect(placeholder.getAttribute('aria-hidden')).toBe('true');
});

test('HtmlComponent renders nothing for an unknown data-icon name and warns', () => {
  const { container } = render(<HtmlComponent html='<i data-icon="rocket">x</i>' />);
  expect(container.querySelector('svg')).toBeNull();
  expect(container.querySelector('[data-icon]').textContent).toBe('x');
  expect(console.warn).toHaveBeenCalledWith(
    'data-icon="rocket" is not a known icon, so nothing was rendered.'
  );
});

test('HtmlComponent re-renders icons when the HTML changes', () => {
  const { rerender } = render(<HtmlComponent html='<i data-icon="edit"></i>' />);
  expect(screen.getByTestId('icon-edit')).toBeDefined();
  rerender(<HtmlComponent html='<i data-icon="delete"></i>' />);
  expect(screen.queryByTestId('icon-edit')).toBeNull();
  expect(screen.getByTestId('icon-delete')).toBeDefined();
});

test('HtmlComponent keeps its icons across parent re-renders with the same HTML', () => {
  const { rerender } = render(<HtmlComponent html='<i data-icon="edit"></i>' />);
  const svg = screen.getByTestId('icon-edit');
  rerender(<HtmlComponent html='<i data-icon="edit"></i>' style={{ color: 'red' }} />);
  expect(screen.getByTestId('icon-edit')).toBe(svg);
});

test('HtmlComponent labels an icon-only element from its tooltip', () => {
  const { container } = render(
    <HtmlComponent html='<i data-icon="delete" data-tooltip="Delete row"></i>' />
  );
  const placeholder = container.querySelector('[data-icon]');
  expect(placeholder.getAttribute('aria-label')).toBe('Delete row');
  expect(placeholder.getAttribute('role')).toBe('img');
  expect(placeholder.hasAttribute('aria-hidden')).toBe(false);
});

test('HtmlComponent shows a tooltip on hover and hides it on mouse out', () => {
  const { container } = render(
    <HtmlComponent div={true} html='<span data-tooltip="More detail">Hover me</span><b>Other</b>' />
  );
  const target = container.querySelector('[data-tooltip]');
  fireEvent.mouseOver(target);
  expect(screen.getByTestId('overlay-tooltip').textContent).toContain('More detail');
  fireEvent.mouseOut(target, { relatedTarget: container.querySelector('b') });
  expect(screen.queryByTestId('overlay-tooltip')).toBeNull();
});

test('HtmlComponent shows a tooltip on keyboard focus', () => {
  const { container } = render(<HtmlComponent html='<a href="#x" data-tooltip="Go to x">x</a>' />);
  fireEvent.focus(container.querySelector('a'));
  expect(screen.getByTestId('overlay-tooltip').textContent).toContain('Go to x');
});

test('HtmlComponent toggles a popover with its content element and renders its icons once', () => {
  const { container } = render(
    <HtmlComponent
      div={true}
      html='<span data-popover="more">More</span><div data-popover-content="more" hidden><i data-icon="edit"></i> Details</div>'
    />
  );
  const trigger = container.querySelector('[data-popover]');
  expect(trigger.getAttribute('role')).toBe('button');
  expect(trigger.getAttribute('tabindex')).toBe('0');
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  // The hidden source content is left alone: its icon renders only in the popover.
  expect(screen.queryAllByTestId('icon-edit')).toHaveLength(0);

  fireEvent.click(trigger);
  const popover = screen.getByTestId('overlay-popover');
  expect(popover.textContent).toContain('Details');
  expect(screen.queryAllByTestId('icon-edit')).toHaveLength(1);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');

  fireEvent.click(trigger);
  expect(screen.queryByTestId('overlay-popover')).toBeNull();
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
});

test('HtmlComponent opens no popover and warns when its content element is missing', () => {
  const { container } = render(<HtmlComponent html='<span data-popover="nope">More</span>' />);
  fireEvent.click(container.querySelector('[data-popover]'));
  expect(screen.queryByTestId('overlay-popover')).toBeNull();
  expect(console.warn).toHaveBeenCalledWith(
    'data-popover="nope" has no element with data-popover-content="nope".'
  );
});

test('HtmlComponent opens a popover with Enter on its trigger', async () => {
  const { container } = render(
    <HtmlComponent html='<span data-popover="p">More</span><span data-popover-content="p" hidden>Body</span>' />
  );
  const user = userEvent.setup();
  container.querySelector('[data-popover]').focus();
  await user.keyboard('{Enter}');
  expect(screen.getByTestId('overlay-popover').textContent).toContain('Body');
});

test('HtmlComponent fires onDataEvent with the other data attributes as snake_case keys', () => {
  const onDataEvent = jest.fn();
  const { container } = render(
    <HtmlComponent
      html='<a href="/x" data-event="onEditClick" data-record-id="42">Edit</a>'
      onDataEvent={onDataEvent}
    />
  );
  const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
  act(() => {
    container.querySelector('a').dispatchEvent(clickEvent);
  });
  expect(onDataEvent).toHaveBeenCalledWith({ name: 'onEditClick', event: { record_id: '42' } });
  expect(clickEvent.defaultPrevented).toBe(true);
});

test('HtmlComponent makes data-event targets focusable without changing their role', async () => {
  const onDataEvent = jest.fn();
  const { container } = render(
    <HtmlComponent html='<span data-event="onSave">Save</span>' onDataEvent={onDataEvent} />
  );
  const target = container.querySelector('[data-event]');
  expect(target.getAttribute('tabindex')).toBe('0');
  expect(target.hasAttribute('role')).toBe(false);
  const user = userEvent.setup();
  target.focus();
  await user.keyboard(' ');
  expect(onDataEvent).toHaveBeenCalledWith({ name: 'onSave', event: {} });
});

test('HtmlComponent fires a data-event inside a popover and closes the popover', () => {
  const onDataEvent = jest.fn();
  const { container } = render(
    <HtmlComponent
      html='<span data-popover="menu">Actions</span><div data-popover-content="menu" hidden><p data-event="onArchive" data-id="7">Archive</p></div>'
      onDataEvent={onDataEvent}
    />
  );
  fireEvent.click(container.querySelector('[data-popover]'));
  const popover = screen.getByTestId('overlay-popover');
  fireEvent.click(popover.querySelector('[data-event]'));
  expect(onDataEvent).toHaveBeenCalledTimes(1);
  expect(onDataEvent).toHaveBeenCalledWith({ name: 'onArchive', event: { id: '7' } });
  expect(screen.queryByTestId('overlay-popover')).toBeNull();
});

test('HtmlComponent does not open a tooltip for targets inside popover content from the parent', () => {
  const { container } = render(
    <HtmlComponent html='<span data-popover="p">More</span><div data-popover-content="p" hidden><span data-tooltip="inner">Inner</span></div>' />
  );
  fireEvent.click(container.querySelector('[data-popover]'));
  const inner = screen.getByTestId('overlay-popover').querySelector('[data-tooltip]');
  fireEvent.mouseOver(inner);
  // The nested HtmlComponent in the popover opens its own tooltip; the parent's popover stays.
  expect(screen.getByTestId('overlay-popover')).toBeDefined();
  expect(screen.getByTestId('overlay-tooltip').textContent).toContain('inner');
});

test('HtmlComponent leaves data attributes alone when no enhancements are registered', () => {
  registerHtmlEnhancements(null);
  const { container } = render(
    <HtmlComponent html='<i data-icon="edit"></i><span data-popover="p">x</span>' />
  );
  expect(container.querySelector('svg')).toBeNull();
  expect(container.querySelector('[data-popover]').hasAttribute('role')).toBe(false);
});

test('HtmlComponent applies sanitizeOptions', () => {
  const { container } = render(
    <HtmlComponent html="<b>bold</b><i>italic</i>" sanitizeOptions={{ FORBID_TAGS: ['b'] }} />
  );
  expect(container.querySelector('b')).toBeNull();
  expect(container.querySelector('i')).not.toBeNull();
});

test('HtmlComponent removes the native title from a data-tooltip element', () => {
  const { container } = render(
    <HtmlComponent html='<span data-tooltip="Themed" title="Native">x</span>' />
  );
  expect(container.querySelector('[data-tooltip]').hasAttribute('title')).toBe(false);
});

test('HtmlComponent leaves HTML with only other data attributes on the plain path', () => {
  const { container } = render(
    <HtmlComponent html='<span data-testid="cell" title="Native">x</span>' />
  );
  expect(container.querySelector('[data-testid="cell"]').getAttribute('title')).toBe('Native');
});
