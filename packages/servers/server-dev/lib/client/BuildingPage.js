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

const BuildingPage = () => {
  return (
    <div
      style={{
        height: '100vh',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <style>
        {`
          @keyframes building-progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          backgroundColor: '#f0f0f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '40%',
            height: '100%',
            backgroundColor: '#1890ff',
            animation: 'building-progress 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <div
        style={{
          verticalAlign: 'middle',
          display: 'inline-block',
        }}
      >
        <h3>Building page...</h3>
        <p>The page will appear when the build completes.</p>
      </div>
    </div>
  );
};

export default BuildingPage;
