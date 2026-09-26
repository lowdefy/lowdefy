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
import { render } from '@testing-library/react';
import { LucideProvider } from 'lucide-react/dist/esm/context.mjs';

// Mock @ant-design/icons to avoid ESM/CJS interop issues in Jest. Like the real
// Icon, it renders `component` inside <span role="img" class="anticon">.
jest.unstable_mockModule('@ant-design/icons', () => ({
  __esModule: true,
  default: React.forwardRef(({ className, component: Component, children }, ref) => (
    <span ref={ref} role="img" className={['anticon', className].filter(Boolean).join(' ')}>
      <Component>{children}</Component>
    </span>
  )),
}));

const { default: createIcon } = await import('./createIcon.js');

const methods = {
  triggerEvent: jest.fn(),
};

beforeAll(() => {
  console.error = () => null;
});

const Icons = {
  Pencil: {
    node: [
      ['path', { d: 'M21 6.8a1 1 0 0 0-3.9-3.9L3.8 16.2' }],
      ['path', { d: 'm15 5 4 4' }],
    ],
  },
  edit: {
    node: [
      ['path', { d: 'M21 6.8a1 1 0 0 0-3.9-3.9L3.8 16.2' }],
      ['path', { d: 'm15 5 4 4' }],
    ],
  },
  Nested: {
    node: [
      ['g', { transform: 'translate(2 2)' }, [['circle', { cx: 10, cy: 10, r: 8 }]]],
      ['path', { d: 'M2 2h4' }],
    ],
  },
  'react-icons:AiOutlineUser': {
    node: [['path', { d: 'M858.5 763.6' }]],
    size: 1024,
    attrs: { fill: 'currentColor', stroke: 'none' },
  },
  Tall: {
    node: [['rect', { x: 2, y: 2, width: 12, height: 16 }]],
    width: 16,
    height: 20,
  },
  Broken: { node: 'not-a-node-array' },
  loading: { node: [['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' }]] },
  'icon-missing': {
    node: [
      ['circle', { cx: 12, cy: 12, r: 10 }],
      ['line', { x1: 12, x2: 12, y1: 8, y2: 12 }],
    ],
  },
};

function getSvg(container) {
  return container.querySelector('svg');
}

test('Icon renders icon data as a lucide svg inside the antd anticon span', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="test-id" methods={methods} properties={{ name: 'Pencil' }} />
  );
  expect(container.firstChild).toMatchSnapshot();
  const span = container.firstChild;
  expect(span.getAttribute('class')).toBe('anticon');
  expect(span.firstChild.tagName).toBe('svg');
  expect(getSvg(container).getAttribute('class')).toBe('lucide');
  expect(getSvg(container).getAttribute('viewBox')).toBe('0 0 24 24');
});

test('Icon accepts a string as properties', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="test-id" methods={methods} properties="Pencil" />
  );
  expect(getSvg(container).querySelectorAll('path')).toHaveLength(2);
  expect(getSvg(container).querySelector('title').textContent).toBe('Pencil');
});

test('Icon renders nested icon nodes', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="nested" methods={methods} properties={{ name: 'Nested' }} />
  );
  const group = getSvg(container).querySelector('g');
  expect(group.getAttribute('transform')).toBe('translate(2 2)');
  expect(group.querySelector('circle').getAttribute('r')).toBe('8');
  expect(getSvg(container).querySelector(':scope > path').getAttribute('d')).toBe('M2 2h4');
});

test('Icon uses lucide defaults when there is no provider', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="defaults" methods={methods} properties={{ name: 'Pencil' }} />
  );
  const svg = getSvg(container);
  expect(svg.getAttribute('width')).toBe('24');
  expect(svg.getAttribute('stroke-width')).toBe('2');
  expect(svg.getAttribute('stroke')).toBe('currentColor');
  expect(svg.getAttribute('fill')).toBe('none');
});

test('Icon applies LucideProvider size and strokeWidth defaults', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <LucideProvider size="1em" strokeWidth={1.5}>
      <IconComponent blockId="provider" methods={methods} properties={{ name: 'Pencil' }} />
    </LucideProvider>
  );
  const svg = getSvg(container);
  expect(svg.getAttribute('width')).toBe('1em');
  expect(svg.getAttribute('height')).toBe('1em');
  expect(svg.getAttribute('stroke-width')).toBe('1.5');
});

test('Icon per-icon size and strokeWidth override the provider', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <LucideProvider size="1em" strokeWidth={1.5}>
      <IconComponent
        blockId="override"
        methods={methods}
        properties={{ name: 'Pencil', size: 32, strokeWidth: 1 }}
      />
    </LucideProvider>
  );
  const svg = getSvg(container);
  expect(svg.getAttribute('width')).toBe('32');
  expect(svg.getAttribute('height')).toBe('32');
  expect(svg.getAttribute('stroke-width')).toBe('1');
});

test('Icon nonScalingStroke from the provider reaches every shape, including nested ones', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <LucideProvider nonScalingStroke={true}>
      <IconComponent blockId="nss" methods={methods} properties={{ name: 'Nested' }} />
    </LucideProvider>
  );
  const svg = getSvg(container);
  expect(svg.querySelector('circle').getAttribute('vector-effect')).toBe('non-scaling-stroke');
  expect(svg.querySelector(':scope > path').getAttribute('vector-effect')).toBe(
    'non-scaling-stroke'
  );
  expect(svg.querySelector('g').hasAttribute('vector-effect')).toBe(false);
});

test('Icon per-icon nonScalingStroke overrides the provider', () => {
  const IconComponent = createIcon(Icons);
  const { container: offContainer } = render(
    <LucideProvider nonScalingStroke={true}>
      <IconComponent
        blockId="nss-off"
        methods={methods}
        properties={{ name: 'Pencil', nonScalingStroke: false }}
      />
    </LucideProvider>
  );
  getSvg(offContainer)
    .querySelectorAll('path')
    .forEach((path) => expect(path.hasAttribute('vector-effect')).toBe(false));
  const { container: onContainer } = render(
    <IconComponent
      blockId="nss-on"
      methods={methods}
      properties={{ name: 'Pencil', nonScalingStroke: true }}
    />
  );
  getSvg(onContainer)
    .querySelectorAll('path')
    .forEach((path) => expect(path.getAttribute('vector-effect')).toBe('non-scaling-stroke'));
});

test('Icon color and rotate go through CSS, not SVG attributes', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="css"
      methods={methods}
      properties={{ name: 'Pencil', color: 'red', rotate: 90 }}
    />
  );
  const svg = getSvg(container);
  expect(svg.style.color).toBe('red');
  expect(svg.style.transform).toBe('rotate(90deg)');
  expect(svg.getAttribute('stroke')).toBe('currentColor');
  expect(svg.hasAttribute('color')).toBe(false);
  expect(svg.hasAttribute('rotate')).toBe(false);
});

test('Icon styles.element and classNames.element reach the svg', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="styled"
      classNames={{ element: 'my-icon' }}
      methods={methods}
      properties={{ name: 'Pencil', color: 'red' }}
      styles={{ element: { background: 'yellow', color: 'blue' } }}
    />
  );
  const svg = getSvg(container);
  expect(svg.style.background).toBe('yellow');
  expect(svg.style.color).toBe('blue');
  expect(svg.getAttribute('class')).toBe('lucide my-icon');
});

test('Icon className from antd goes on the anticon span', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="classed"
      className="ant-collapse-arrow"
      methods={methods}
      properties={{ name: 'Pencil' }}
    />
  );
  expect(container.firstChild.getAttribute('class')).toBe('anticon ant-collapse-arrow');
  expect(getSvg(container).getAttribute('class')).toBe('lucide');
});

test('Icon renders a title child and no aria-hidden when it has a title', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="titled"
      methods={methods}
      properties={{ name: 'Pencil', title: 'Edit' }}
    />
  );
  const svg = getSvg(container);
  expect(svg.firstChild.tagName).toBe('title');
  expect(svg.firstChild.textContent).toBe('Edit');
  expect(svg.hasAttribute('aria-hidden')).toBe(false);
  expect(svg.hasAttribute('title')).toBe(false);
});

test('Icon sets aria-hidden and renders no title when the title is empty', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="decorative"
      methods={methods}
      properties={{ name: 'Pencil', title: '' }}
    />
  );
  const svg = getSvg(container);
  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.querySelector('title')).toBe(null);
});

test('Icon with an empty title but an aria-label is not hidden', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      aria-label="Close"
      blockId="labelled"
      methods={methods}
      properties={{ name: 'Pencil', title: '' }}
    />
  );
  const svg = getSvg(container);
  expect(svg.hasAttribute('aria-hidden')).toBe(false);
  expect(svg.getAttribute('aria-label')).toBe('Close');
});

test('Icon generates titles from semantic, set and qualified names', () => {
  const IconComponent = createIcon({ ...Icons, 'more-vertical': Icons.Pencil });
  render(
    <>
      <IconComponent blockId="a" methods={methods} properties={{ name: 'more-vertical' }} />
      <IconComponent blockId="b" methods={methods} properties={{ name: 'Pencil' }} />
      <IconComponent
        blockId="c"
        methods={methods}
        properties={{ name: 'react-icons:AiOutlineUser' }}
      />
    </>
  );
  expect(document.querySelector('#a title').textContent).toBe('More vertical');
  expect(document.querySelector('#b title').textContent).toBe('Pencil');
  expect(document.querySelector('#c title').textContent).toBe('Ai outline user');
});

test('Icon spin renders the spinning loading icon', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="spin" methods={methods} properties={{ name: 'Pencil', spin: true }} />
  );
  const svg = getSvg(container);
  expect(svg.getAttribute('class')).toBe('lucide undefined');
  expect(svg.querySelector('path').getAttribute('d')).toBe(Icons.loading.node[0][1].d);
});

test('Icon onClick loading renders the loading icon unless disableLoadingIcon is set', () => {
  const IconComponent = createIcon(Icons);
  const { container: loadingContainer } = render(
    <IconComponent
      blockId="click-loading"
      events={{ onClick: { loading: true } }}
      methods={methods}
      properties={{ name: 'Pencil' }}
    />
  );
  expect(getSvg(loadingContainer).querySelector('path').getAttribute('d')).toBe(
    Icons.loading.node[0][1].d
  );
  const { container: disabledContainer } = render(
    <IconComponent
      blockId="click-disabled"
      events={{ onClick: { loading: true } }}
      methods={methods}
      properties={{ name: 'Pencil', disableLoadingIcon: true }}
    />
  );
  expect(getSvg(disabledContainer).querySelectorAll('path')).toHaveLength(2);
});

test('Icon onClick event triggers onClick and shows a pointer cursor', () => {
  const triggerEvent = jest.fn();
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="click"
      events={{ onClick: { loading: false } }}
      methods={{ triggerEvent }}
      properties={{ name: 'Pencil' }}
    />
  );
  const svg = getSvg(container);
  expect(svg.style.cursor).toBe('pointer');
  svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(triggerEvent).toHaveBeenCalledWith({ name: 'onClick' });
});

test('Icon with an unknown name renders icon-missing in red', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="unknown" methods={methods} properties={{ name: 'NotAnIcon' }} />
  );
  const svg = getSvg(container);
  expect(svg.style.color).toBe('rgb(255, 0, 0)');
  expect(svg.querySelector('circle')).not.toBe(null);
  expect(svg.querySelector('title').textContent).toBe('Not an icon');
});

test('Icon without a name renders icon-missing in red', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(<IconComponent methods={methods} />);
  expect(container.firstChild).toMatchSnapshot();
});

test('Icon does not resolve object prototype keys as icon names', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="proto" methods={methods} properties={{ name: 'constructor' }} />
  );
  expect(getSvg(container).querySelector('circle')).not.toBe(null);
});

test('Icon with icon data that fails to render falls back to icon-missing in red', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="broken" methods={methods} properties={{ name: 'Broken' }} />
  );
  const svg = getSvg(container);
  expect(svg.style.color).toBe('rgb(255, 0, 0)');
  expect(svg.querySelector('circle')).not.toBe(null);
});

test('Icon recovers from a failed icon when its name changes', () => {
  const IconComponent = createIcon(Icons);
  const { container, rerender } = render(
    <IconComponent blockId="recover" methods={methods} properties={{ name: 'Broken' }} />
  );
  rerender(<IconComponent blockId="recover" methods={methods} properties={{ name: 'Pencil' }} />);
  expect(getSvg(container).querySelectorAll('path')).toHaveLength(2);
  expect(getSvg(container).style.color).toBe('');
});

test('Icon keeps the same svg element across re-renders', () => {
  const IconComponent = createIcon(Icons);
  const { container, rerender } = render(
    <IconComponent blockId="keep" methods={methods} properties={{ name: 'Pencil', color: 'red' }} />
  );
  const svg = getSvg(container);
  rerender(
    <IconComponent
      blockId="keep"
      methods={methods}
      properties={{ name: 'Pencil', color: 'blue' }}
    />
  );
  expect(getSvg(container)).toBe(svg);
  expect(svg.style.color).toBe('blue');
});

test('Icon looks names up at render, so names added to the map later render', () => {
  const liveIcons = { ...Icons };
  const IconComponent = createIcon(liveIcons);
  const { container, rerender } = render(
    <IconComponent blockId="late" methods={methods} properties={{ name: 'Late' }} />
  );
  expect(getSvg(container).style.color).toBe('rgb(255, 0, 0)');
  liveIcons.Late = { node: [['path', { d: 'M1 1h2' }]] };
  rerender(<IconComponent blockId="late" methods={methods} properties={{ name: 'Late' }} />);
  expect(getSvg(container).querySelector('path').getAttribute('d')).toBe('M1 1h2');
  expect(getSvg(container).style.color).toBe('');
});

test('Icon uses the data size as a square viewBox', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="square"
      methods={methods}
      properties={{ name: 'react-icons:AiOutlineUser' }}
    />
  );
  expect(getSvg(container).getAttribute('viewBox')).toBe('0 0 1024 1024');
});

test('Icon uses the data width and height as a non-square viewBox', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent blockId="tall" methods={methods} properties={{ name: 'Tall' }} />
  );
  expect(getSvg(container).getAttribute('viewBox')).toBe('0 0 16 20');
});

test('Icon applies the data root attrs for fill-based icons', () => {
  const IconComponent = createIcon(Icons);
  const { container } = render(
    <IconComponent
      blockId="filled"
      methods={methods}
      properties={{ name: 'react-icons:AiOutlineUser', color: 'green' }}
    />
  );
  const svg = getSvg(container);
  expect(svg.getAttribute('fill')).toBe('currentColor');
  expect(svg.getAttribute('stroke')).toBe('none');
  expect(svg.style.color).toBe('green');
});
