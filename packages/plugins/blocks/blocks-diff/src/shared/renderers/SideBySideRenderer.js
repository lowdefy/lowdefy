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
import { Col, Descriptions, Row, Space, Typography } from 'antd';
import { type } from '@lowdefy/helpers';

import ValueCell from '../ValueCell.js';
import formatValue from '../formatValue.js';
import { CHANGE_TYPES } from '../constants.js';
import { humaniseSegment, isIndex, singularise } from '../pathUtils.js';

const { Text } = Typography;

const CHANGE_STRIP_STYLE = {
  background: 'var(--ant-color-warning-bg, rgba(250,173,20,0.1))',
  padding: '1px 6px',
  borderRadius: 'var(--ant-border-radius-sm, 4px)',
};

function partitionGroup(changes) {
  const byItem = new Map();
  const direct = [];
  changes.forEach((change) => {
    if (change.path.length >= 2 && isIndex(change.path[1])) {
      const key = String(change.path[1]);
      if (!byItem.has(key)) byItem.set(key, []);
      byItem.get(key).push(change);
      return;
    }
    direct.push(change);
  });
  return { byItem, direct };
}

function resolveItemLabelBase(group, labels) {
  if (type.isObject(labels) && type.isString(labels[group.key]) && labels[group.key].length > 0) {
    return singularise(labels[group.key]);
  }
  return singularise(humaniseSegment(String(group.key)));
}

function renderLeftCell(change, collapseNested) {
  if (change.type === CHANGE_TYPES.CHANGE) {
    return <span style={CHANGE_STRIP_STYLE}>{formatValue(change.oldValue, change.formatter)}</span>;
  }
  if (change.type === CHANGE_TYPES.CREATE) {
    return <Text type="secondary">—</Text>;
  }
  if (change.type === CHANGE_TYPES.REMOVE) {
    return <ValueCell change={change} collapseNested={collapseNested} />;
  }
  return <Text type="secondary">{formatValue(change.oldValue, change.formatter)}</Text>;
}

function renderRightCell(change, collapseNested) {
  if (change.type === CHANGE_TYPES.CHANGE) {
    return <span style={CHANGE_STRIP_STYLE}>{formatValue(change.newValue, change.formatter)}</span>;
  }
  if (change.type === CHANGE_TYPES.CREATE) {
    return <ValueCell change={change} collapseNested={collapseNested} />;
  }
  if (change.type === CHANGE_TYPES.REMOVE) {
    return <Text type="secondary">—</Text>;
  }
  return <Text type="secondary">{formatValue(change.newValue, change.formatter)}</Text>;
}

function buildSide(changes, side, collapseNested) {
  return changes.map((change, index) => ({
    key: `${side}-${change.pathStr || index}`,
    label: change.breadcrumb,
    children:
      side === 'left'
        ? renderLeftCell(change, collapseNested)
        : renderRightCell(change, collapseNested),
  }));
}

function PairedDescriptions({ changes, classNames, collapseNested }) {
  const leftItems = buildSide(changes, 'left', collapseNested);
  const rightItems = buildSide(changes, 'right', collapseNested);
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Descriptions
          size="small"
          column={1}
          colon={false}
          bordered
          items={leftItems}
          className={classNames?.group}
        />
      </Col>
      <Col xs={24} md={12}>
        <Descriptions
          size="small"
          column={1}
          colon={false}
          bordered
          items={rightItems}
          className={classNames?.group}
        />
      </Col>
    </Row>
  );
}

function GroupView({ group, labels, classNames, collapseNested }) {
  const { byItem, direct } = partitionGroup(group.changes);

  if (byItem.size === 0) {
    return (
      <PairedDescriptions
        changes={group.changes}
        classNames={classNames}
        collapseNested={collapseNested}
      />
    );
  }

  const itemLabelBase = resolveItemLabelBase(group, labels);
  const sortedItems = Array.from(byItem.entries()).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <Space direction="vertical" size={12} style={{ display: 'flex', width: '100%' }}>
      {direct.length > 0 && (
        <PairedDescriptions
          changes={direct}
          classNames={classNames}
          collapseNested={collapseNested}
        />
      )}
      {sortedItems.map(([itemKey, itemChanges]) => {
        const itemLabel = `${itemLabelBase} ${Number(itemKey) + 1}`;
        return (
          <div key={itemKey} style={{ paddingInlineStart: 12 }}>
            <Space size={8} align="center" style={{ marginBottom: 8 }}>
              <Text strong>{itemLabel}</Text>
            </Space>
            <PairedDescriptions
              changes={itemChanges}
              classNames={classNames}
              collapseNested={collapseNested}
            />
          </div>
        );
      })}
    </Space>
  );
}

function SideBySideRenderer({
  model,
  labels,
  classNames = {},
  styles = {},
  collapseNested = true,
}) {
  const meaningful = model.groups.filter((group) => group.changes.length > 0);
  if (meaningful.length === 0) return null;
  return (
    <Space
      direction="vertical"
      size="middle"
      style={{ display: 'flex', width: '100%', ...styles?.group }}
    >
      {meaningful.map((group) => (
        <GroupView
          key={group.key}
          group={group}
          labels={labels}
          classNames={classNames}
          collapseNested={collapseNested}
        />
      ))}
    </Space>
  );
}

export default SideBySideRenderer;
