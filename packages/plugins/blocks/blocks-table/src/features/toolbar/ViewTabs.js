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
import { Tabs } from 'antd';

import ViewActions from './ViewActions.js';
import ViewTabLabel from './ViewTabLabel.js';

// Saved views as tabs (D7): selecting one loads its view; the dirty strip sits at the end of the
// tab bar.
function ViewTabs({ api }) {
  const { active, dirty, items } = api.views;
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
