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
import { Select, Tabs } from 'antd';

import ViewActions from './ViewActions.js';
import ViewTabLabel from './ViewTabLabel.js';
import ViewTabMenu from './ViewTabMenu.js';

// Saved views as tabs (D7): selecting one loads its view; the dirty strip sits at the end of the
// tab bar. On a phone (`phone`) the tabs are one select, with the active view's menu and the
// dirty strip beside it.
function ViewTabs({ api, phone = false }) {
  const { active, dirty, items } = api.views;
  if (phone) {
    return (
      <div className="lf-table-views lf-table-views-phone" data-lf-view-select="">
        <Select
          aria-label="View"
          className="lf-table-view-select"
          onChange={(key) => api.views.select(key)}
          options={items.map((view) => ({
            value: view.key,
            label: (
              <ViewTabLabel
                api={api}
                dirty={dirty && view === active}
                isActive={false}
                view={view}
              />
            ),
          }))}
          popupMatchSelectWidth={false}
          size="small"
          value={active?.key}
          variant="borderless"
        />
        {active ? <ViewTabMenu api={api} view={active} /> : null}
        {dirty ? <ViewActions api={api} /> : null}
      </div>
    );
  }
  return (
    <Tabs
      activeKey={active?.key}
      className="lf-table-views"
      items={items.map((view) => ({
        key: view.key,
        label: (
          <ViewTabLabel
            api={api}
            dirty={dirty && view === active}
            isActive={view === active}
            view={view}
          />
        ),
      }))}
      onChange={(id) => api.views.select(id)}
      size="small"
      tabBarExtraContent={dirty ? { right: <ViewActions api={api} /> } : null}
    />
  );
}

export default ViewTabs;
