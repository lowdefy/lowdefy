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

import React, { useState } from 'react';

import { Alert, Button } from 'antd';

// Shown when the app runs another build than this view. The view keeps running
// until the person chooses to load the new one, since that drops the page's state.
function ViewNewBuild({ onLoad }) {
  const [loading, setLoading] = useState(false);
  return (
    <Alert
      banner
      id="lowdefy-view-new-build"
      type="info"
      message="This app has been updated."
      action={
        <Button
          loading={loading}
          size="small"
          type="primary"
          onClick={() => {
            setLoading(true);
            onLoad();
          }}
        >
          Load the new version
        </Button>
      }
    />
  );
}

export default ViewNewBuild;
