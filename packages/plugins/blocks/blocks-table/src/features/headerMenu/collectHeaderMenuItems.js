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

import sectionOrder from './sectionOrder.js';

// An item and its submenu (`children`, the same item shape), keys namespaced by feature. Items
// with children open their submenu; only leaves get a click handler.
function toMenuItem({ item, prefix, handlers }) {
  const key = `${prefix}:${item.key}`;
  const menuItem = {
    key,
    label: item.label,
    icon: item.icon,
    danger: item.danger,
    disabled: item.disabled,
  };
  if (Array.isArray(item.children)) {
    menuItem.children = item.children.map((child) =>
      toMenuItem({ item: child, prefix: key, handlers })
    );
    return menuItem;
  }
  handlers.set(key, item.onClick);
  return menuItem;
}

// The header menu extension point. Every feature module may declare
// `headerMenuItems({ column, api }) => [{ key, label, icon?, danger?, disabled?, section?, onClick(), children? }]`;
// the items are collected in feature order, grouped by `section` (default: the feature's name)
// in `sectionOrder`, and separated by dividers. Returns antd menu items plus the click handler
// for each item key (keys are namespaced by feature, so two features may use the same key).
function collectHeaderMenuItems({ column, api, features }) {
  const sections = new Map();
  const handlers = new Map();
  features.forEach((feature) => {
    if (!feature.headerMenuItems) return;
    feature.headerMenuItems({ column, api }).forEach((item) => {
      const section = item.section ?? feature.name;
      if (!sections.has(section)) sections.set(section, []);
      sections.get(section).push(toMenuItem({ item, prefix: feature.name, handlers }));
    });
  });
  const known = sectionOrder.filter((section) => sections.has(section));
  const extra = [...sections.keys()].filter((section) => !sectionOrder.includes(section));
  const manageIndex = known.indexOf('manage');
  const ordered =
    manageIndex === -1
      ? [...known, ...extra]
      : [...known.slice(0, manageIndex), ...extra, ...known.slice(manageIndex)];
  const items = [];
  ordered.forEach((section, index) => {
    if (index > 0) items.push({ type: 'divider', key: `divider:${section}` });
    items.push(...sections.get(section));
  });
  return { items, handlers };
}

export default collectHeaderMenuItems;
