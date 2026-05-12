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
import { Button, Space } from 'antd';

function ToolApproval({ toolName, input, approvalId, onApprove, onReject, translate }) {
  const t = translate ?? ((_, fallback) => fallback);
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ fontWeight: 500 }}>{toolName}</div>
      {input && (
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {JSON.stringify(input, null, 2)}
        </div>
      )}
      <Space style={{ marginTop: 8 }}>
        <Button type="primary" size="small" onClick={() => onApprove(approvalId)}>
          {t('agent.toolApproval.approve')}
        </Button>
        <Button size="small" onClick={() => onReject(approvalId)}>
          {t('agent.toolApproval.reject')}
        </Button>
      </Space>
    </div>
  );
}

export default ToolApproval;
