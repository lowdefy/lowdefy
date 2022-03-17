/*
  Copyright 2020-2022 Lowdefy, Inc

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

import createIcon from './createIcon.js';
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
  const IconComponent = createIcon(Icons);
  const { container } = render(<IconComponent methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon default and id', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(<IconComponent id="test-id" methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon properties.name', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties={{ name: 'AiIcon' }} />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon properties string', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties="AiIcon" />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon properties.spin', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties={{ name: 'AiIcon', spin: true }} />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon properties.style', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      id="test-id"
      methods={methods}
      properties={{ name: 'AiIcon', style: { background: 'yellow' } }}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon properties.name error', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent id="test-id" methods={methods} properties={{ name: 'ErrorIcon' }} />
  );
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon onClick.loading false', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      id="test-id"
      methods={methods}
      properties={{ name: 'AiIcon' }}
      events={{ onClick: { loading: false } }}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
  userEvent.click(screen.getByTestId('AiIcon'));
  expect(methods.triggerEvent).toHaveBeenCalledWith({ name: 'onClick' });
});

test('Icon onClick.loading true', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      id="test-id"
      methods={methods}
      properties={{ name: 'AiIcon' }}
      events={{ onClick: { loading: true } }}
    />
  );
  expect(container.firstChild).toMatchSnapshot();
});
