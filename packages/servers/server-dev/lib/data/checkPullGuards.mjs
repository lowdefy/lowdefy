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

import { type } from '@lowdefy/helpers';

// A pull proves which database it reads through the environment's own guards.secrets pins: the
// secret's value must match the `from` environment's pin and no other environment's distinct pin.
// So production cannot be pulled by mistake, and no idea of which environment is production is
// needed. Messages name the secret and the environment, never the value.
function checkPullGuards({ connections, dataSetName, from, environmentGuards, env }) {
  const declared = Object.keys(environmentGuards);
  if (!declared.includes(from)) {
    throw new Error(
      `Data set "${dataSetName}" pulls from environment "${from}", which config.environments does not declare.${
        declared.length === 0 ? '' : ` Declared: ${declared.join(', ')}.`
      }`
    );
  }
  const secretNames = [...new Set(connections.map((connection) => connection.secretName))];
  secretNames.forEach((secretName) => {
    const pattern = environmentGuards[from].secrets[secretName];
    if (type.isUndefined(pattern)) {
      throw new Error(
        `Environment ${from} pins no guard for secret ${secretName}; add one so a pull can prove which database it reads.`
      );
    }
    const variable = `LOWDEFY_SECRET_${secretName}`;
    const value = env[variable];
    if (!type.isString(value) || value === '') {
      throw new Error(`Secret "${secretName}" is not set (${variable}).`);
    }
    if (!new RegExp(pattern).test(value)) {
      throw new Error(
        `Secret "${secretName}" does not match environment "${from}"'s guard, so it is not that environment's database.`
      );
    }
    declared
      .filter((name) => name !== from)
      .forEach((name) => {
        const otherPattern = environmentGuards[name].secrets[secretName];
        // An identical pattern is the same database under another name.
        if (type.isUndefined(otherPattern) || otherPattern === pattern) return;
        if (new RegExp(otherPattern).test(value)) {
          throw new Error(
            `Secret "${secretName}" also matches environment "${name}"'s guard, so it may be that environment's database. A pull reads only from "${from}".`
          );
        }
      });
  });
}

export default checkPullGuards;
