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
import { Button, ErrorBlock } from 'antd-mobile';

// The mobile 404 view — shown when a page fetch 404s or the fetched page's
// target is not mobile (cross-target Link resolved at runtime, decision 5).
function NotFound({ onHome }) {
  return (
    <div style={{ padding: '48px 24px' }}>
      <ErrorBlock
        status="empty"
        title="Page not found"
        description="This page does not exist in this app."
      >
        {onHome && (
          <Button color="primary" onClick={onHome}>
            Back to home
          </Button>
        )}
      </ErrorBlock>
    </div>
  );
}

export default NotFound;
