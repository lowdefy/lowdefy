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

// Parses `ps -A -o pid=,ppid=,lstart=,command=` read with LC_ALL=C and TZ=UTC. lstart is
// five fields ("Fri Oct  2 20:55:31 2026"), kept exactly as ps prints it so it compares
// equal to what getProcessStartTime (and every registry record) holds.
const LINE = /^\s*(\d+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d+\s+\d+:\d+:\d+\s+\d{4})\s+(.*)$/;

function parseProcessTable(text) {
  const processes = [];
  text.split('\n').forEach((line) => {
    const match = LINE.exec(line);
    if (match === null) {
      return;
    }
    processes.push({
      pid: Number(match[1]),
      ppid: Number(match[2]),
      processStartTime: match[3],
      command: match[4].trim(),
    });
  });
  return processes;
}

export default parseProcessTable;
