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

const LINE = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s*$/;

// ps time is [[dd-]hh:]mm:ss, with hundredths on macOS ("1:23.45").
function parseCpuSeconds(text) {
  const [days, clock] = text.includes('-') ? text.split('-') : ['0', text];
  const seconds = clock.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  const total = Number(days) * 86400 + seconds;
  return Number.isFinite(total) ? total : null;
}

// Parses `ps -A -o pid=,ppid=,rss=,time=`: rss in KiB, time as CPU time used.
// A line that does not parse is left out.
function parseResourceTable(text) {
  const processes = [];
  text.split('\n').forEach((line) => {
    const match = LINE.exec(line);
    if (match === null) {
      return;
    }
    const cpuSeconds = parseCpuSeconds(match[4]);
    if (cpuSeconds === null) {
      return;
    }
    processes.push({
      pid: Number(match[1]),
      ppid: Number(match[2]),
      rssBytes: Number(match[3]) * 1024,
      cpuSeconds,
    });
  });
  return processes;
}

export default parseResourceTable;
