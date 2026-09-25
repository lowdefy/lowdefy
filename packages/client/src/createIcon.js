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
import { omit, type } from '@lowdefy/helpers';
import Icon from '@ant-design/icons';
import LucideIcon from 'lucide-react/dist/esm/Icon.mjs';
import { useLucideContext } from 'lucide-react/dist/esm/context.mjs';
import { cn, withBlockDefaults, ErrorBoundary } from '@lowdefy/block-utils';

import formatIconTitle from './formatIconTitle.js';
import renderIconNodes from './renderIconNodes.js';
import iconStyles from './style.module.css';

const lowdefyProps = [
  'actionLog',
  'basePath',
  'components',
  'content',
  'eventLog',
  'list',
  'loading',
  'menus',
  'pageId',
  'registerEvent',
  'registerMethod',
  'schemaErrors',
  'styles',
  'validation',
];

function createIcon(Icons) {
  // Icons is the live icon map: page loads and dev JIT add names to it, so
  // every lookup happens at render.
  function getIconData(name) {
    if (type.isString(name) && Object.hasOwn(Icons, name)) {
      return Icons[name];
    }
    return null;
  }

  function IconSvg({ data, nonScalingStroke, svgProps, title }) {
    return (
      <LucideIcon
        icon={{ node: [], size: data.size, width: data.width, height: data.height }}
        {...data.attrs}
        {...svgProps}
      >
        {[
          title ? <title key="title">{title}</title> : null,
          ...renderIconNodes({ node: data.node, nonScalingStroke }),
        ]}
      </LucideIcon>
    );
  }

  function IconBlock({
    blockId,
    classNames = {},
    events,
    methods,
    onClick,
    properties,
    styles = {},
    ...props
  }) {
    const lucideContext = useLucideContext();
    const propertiesObj = type.isString(properties) ? { name: properties } : properties;
    const spin =
      (propertiesObj.spin || events.onClick?.loading) && !propertiesObj.disableLoadingIcon;
    const title = propertiesObj.title ?? formatIconTitle(propertiesObj.name);
    const labelled = Boolean(title) || !type.isNone(props['aria-label']);
    const nonScalingStroke = propertiesObj.nonScalingStroke ?? lucideContext.nonScalingStroke;
    const triggerClick = events.onClick && (() => methods.triggerEvent({ name: 'onClick' }));
    const svgProps = {
      id: blockId,
      className: cn(classNames.element, { [iconStyles['icon-spin']]: spin }),
      style: {
        cursor: onClick || events.onClick ? 'pointer' : undefined,
        // CSS colour and transform, not SVG attributes: every set draws with
        // currentColor, so one colour reaches stroke- and fill-based icons.
        color: propertiesObj.color,
        transform: propertiesObj.rotate ? `rotate(${propertiesObj.rotate}deg)` : undefined,
        ...styles.element,
      },
      size: propertiesObj.size,
      strokeWidth: propertiesObj.strokeWidth,
      'aria-hidden': labelled ? undefined : 'true',
      onClick: onClick ?? triggerClick,
      ...omit(props, lowdefyProps),
    };
    const missingSvgProps = { ...svgProps, style: { ...svgProps.style, color: '#F00' } };
    const missingIcon = (
      <IconSvg
        data={getIconData('icon-missing')}
        nonScalingStroke={nonScalingStroke}
        svgProps={missingSvgProps}
        title={title}
      />
    );
    if (spin) {
      return (
        <IconSvg
          data={getIconData('loading')}
          nonScalingStroke={nonScalingStroke}
          svgProps={svgProps}
          title={title}
        />
      );
    }
    const data = getIconData(propertiesObj.name);
    if (!data) {
      return missingIcon;
    }
    return (
      // Keyed so an icon that failed recovers when its name changes.
      <ErrorBoundary key={propertiesObj.name} fallback={() => missingIcon}>
        <IconSvg
          data={data}
          nonScalingStroke={nonScalingStroke}
          svgProps={svgProps}
          title={title}
        />
      </ErrorBoundary>
    );
  }

  // antd's Icon renders `component` with React.createElement, so the component
  // must keep its identity across renders or React remounts the <svg> every
  // time. The per-render props travel through a render-function child instead.
  const IconHost = ({ children }) => children();
  // antd components add their classes (collapse arrow, tree switcher, menu
  // expand icon) to the icon element they are given; their CSS expects them on
  // the .anticon span, as on antd's own icons.
  const AntIcon = ({ className, ...all }) => (
    <Icon className={className} component={IconHost}>
      {() => <IconBlock {...all} />}
    </Icon>
  );
  return withBlockDefaults(AntIcon);
}

export default createIcon;
