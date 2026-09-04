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

/*
  The sink delivers the alert, not Lowdefy: a monitor fires and Axiom sends it
  to the notifiers attached to it. A monitor with no notifier, or one pointing
  at a notifier that has since been deleted, is indistinguishable from a healthy
  monitor - it simply never tells anyone. So the push resolves the routing
  before it writes anything, and fails with the monitor name in the message.
*/
function describeAvailable(available) {
  if (available.length === 0) {
    return 'This Axiom org has no notifiers - create one in Axiom first.';
  }
  return `Available notifiers: ${available.map((notifier) => notifier.name).join(', ')}.`;
}

function resolveNotifierIds({
  monitorName,
  requested = [],
  existingNotifierIds = [],
  available = [],
  allowSilent = false,
}) {
  const byName = new Map(available.map((notifier) => [notifier.name, notifier.id]));
  const ids = new Set(available.map((notifier) => notifier.id));

  if (requested.length > 0) {
    return requested.map((notifier) => {
      if (byName.has(notifier)) return byName.get(notifier);
      if (ids.has(notifier)) return notifier;
      throw new Error(
        `Axiom has no notifier "${notifier}", requested for monitor "${monitorName}". ${describeAvailable(
          available
        )}`
      );
    });
  }

  existingNotifierIds.forEach((notifierId) => {
    if (ids.has(notifierId)) return;
    throw new Error(
      `Monitor "${monitorName}" is attached to notifier "${notifierId}", which no longer exists in Axiom, so the monitor alerts nobody. Re-attach a notifier in Axiom, or pass --notifier <name>. ${describeAvailable(
        available
      )}`
    );
  });

  if (existingNotifierIds.length === 0 && !allowSilent) {
    throw new Error(
      `Monitor "${monitorName}" has no notifier attached: it would fire and tell nobody. Pass --notifier <name> (repeatable, or AXIOM_NOTIFIERS), attach a notifier to it in Axiom, or pass --allow-silent to push it unrouted. ${describeAvailable(
        available
      )}`
    );
  }

  return [...existingNotifierIds];
}

export default resolveNotifierIds;
