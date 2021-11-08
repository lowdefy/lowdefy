/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Icon from './Icon.js';
import makeCssClass from './makeCssClass.js';

const methods = {
  makeCssClass,
  triggerEvent: jest.fn(),
};

beforeAll(() => {
  console.error = () => null;
});

const Icons = {
  AiIcon: (props) => <svg {...props} data-testid="AiIcon"></svg>,
  AiOutlineExclamationCircle: (props) => (
    <svg {...props} data-testid="AiOutlineExclamationCircle"></svg>
  ),
  AiOutlineLoading3Quarters: (props) => (
    <svg {...props} data-testid="AiOutlineLoading3Quarters"></svg>
  ),
  ErrorIcon: () => {
    throw new Error('ErrorIcon');
  },
};

test('Icon default', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(<IconComponent methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      class="emotion-0"
      data-testid="AiOutlineExclamationCircle"
      id="undefined_id"
    />
  `);
});

test('Icon default and id', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(<IconComponent id="test-id" methods={methods} />);
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      class="emotion-0"
      data-testid="AiOutlineExclamationCircle"
      id="test-id"
    />
  `);
});

test('Icon properties.name', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties={{ name: 'AiIcon' }} />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      class="emotion-0"
      data-testid="AiIcon"
      id="test-id"
    />
  `);
});

test('Icon properties string', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties="AiIcon" />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      class="emotion-0"
      data-testid="AiIcon"
      id="test-id"
    />
  `);
});

test('Icon properties.spin', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties={{ name: 'AiIcon', spin: true }} />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    @keyframes animation-0 {
      {
        -webkit-transform: rotate(0deg);
        -moz-transform: rotate(0deg);
        -ms-transform: rotate(0deg);
        transform: rotate(0deg);
      }

       {
        -webkit-transform: rotate(359deg);
        -moz-transform: rotate(359deg);
        -ms-transform: rotate(359deg);
        transform: rotate(359deg);
      }
    }

    .emotion-1 {
      -webkit-animation: animation-0 2s infinite linear;
      animation: animation-0 2s infinite linear;
    }

    <svg
      class="emotion-0 emotion-1"
      data-testid="AiIcon"
      id="test-id"
    />
  `);
});

test('Icon properties.style', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(
    <IconComponent
      id="test-id"
      methods={methods}
      properties={{ name: 'AiIcon', style: { background: 'yellow' } }}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    .emotion-0 {
      background: yellow;
    }

    <svg
      class="emotion-0"
      data-testid="AiIcon"
      id="test-id"
    />
  `);
});

test('Icon properties.name error', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties={{ name: 'ErrorIcon' }} />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      class="emotion-0"
      color="#F00"
      data-testid="AiOutlineExclamationCircle"
      id="test-id"
    />
  `);
});

test('Icon onClick.loading false', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(
    <IconComponent
      id="test-id"
      methods={methods}
      properties={{ name: 'AiIcon' }}
      events={{ onClick: { loading: false } }}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      class="emotion-0"
      data-testid="AiIcon"
      id="test-id"
    />
  `);
  userEvent.click(screen.getByTestId('AiIcon'));
  expect(methods.triggerEvent).toHaveBeenCalledWith({ name: 'onClick' });
});

test('Icon onClick.loading true', () => {
  const IconComponent = Icon(Icons);
  const { container } = render(
    <IconComponent
      id="test-id"
      methods={methods}
      properties={{ name: 'AiIcon' }}
      events={{ onClick: { loading: true } }}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <svg
      class="emotion-0"
      data-testid="AiOutlineLoading3Quarters"
      id="test-id"
    />
  `);
});
