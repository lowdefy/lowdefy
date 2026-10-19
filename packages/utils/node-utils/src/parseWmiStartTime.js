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

// WMI's CIM_DATETIME, as Win32_Process.CreationDate holds it: local wall-clock time and that
// time's offset from UTC in minutes, "20261002225531.123456+120". The offset travels with
// the time, so it converts to one instant whatever the reader's time zone or daylight saving,
// the repeated hour of a fall-back included. PowerShell's DateTime conversion would go
// through the local zone instead.
const CIM_DATETIME = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d{6})([+-])(\d{3})$/;

// The creation time as epoch milliseconds, or null when the text is not a CIM_DATETIME.
function parseWmiStartTime(text) {
  const match = CIM_DATETIME.exec(text.trim());
  if (match === null) {
    return null;
  }
  const wallClock = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
    Math.floor(Number(match[7]) / 1000)
  );
  const offsetMinutes = Number(match[9]) * (match[8] === '-' ? -1 : 1);
  return wallClock - offsetMinutes * 60 * 1000;
}

export default parseWmiStartTime;
