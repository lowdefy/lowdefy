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

import net from 'net';

function checkPortAvailable({ port }) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(
          new Error(`[Server Error] Port ${port} is already in use.

To use a different port, either:
  - Run with the --port flag: pnpx lowdefy dev --port 3001
  - Set the port in your lowdefy.yaml:
    cli:
      port: 3001`)
        );
      } else {
        reject(error);
      }
    });
    server.listen(port, () => {
      server.close(() => resolve());
    });
  });
}

export default checkPortAvailable;
