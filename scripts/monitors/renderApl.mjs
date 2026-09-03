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
  The rule → APL half of the Axiom renderer. A Grafana or Datadog renderer is a
  sibling of this file: it reads the same rule shape from build/monitors.json
  and emits its own query language. Nothing vendor-specific reaches the build.
*/

function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function field(name) {
  // Wide events carry dotted paths (error.name); APL reads them as nested
  // field access, which is what the pino line actually holds.
  return name;
}

function predicate(filter) {
  return Object.entries(filter ?? {})
    .map(([key, value]) => `${field(key)} == ${quote(value)}`)
    .join(' and ');
}

function eventPredicate({ event, events }) {
  if (events) {
    return `event in (${events.map(quote).join(', ')})`;
  }
  return `event == ${quote(event)}`;
}

function where(parts) {
  const conditions = parts.filter((part) => part && part.length > 0);
  return `| where ${conditions.join(' and ')}`;
}

function renderApl({ rule, dataset }) {
  const source = `[${quote(dataset)}]`;
  if (rule.type === 'error_rate') {
    const scope = where([eventPredicate(rule.total), predicate(rule.total.filter)]);
    const failure = [eventPredicate(rule.failure), predicate(rule.failure.filter)]
      .filter((part) => part.length > 0)
      .join(' and ');
    return [
      source,
      scope,
      `| summarize failures = countif(${failure}), total = count()`,
      '| project error_rate = todouble(failures) / todouble(total)',
    ].join('\n');
  }
  if (rule.type === 'latency_p95') {
    return [
      source,
      where([eventPredicate(rule.target), predicate(rule.target.filter)]),
      `| summarize p95_${rule.field} = percentile(${rule.field}, 95)`,
    ].join('\n');
  }
  if (rule.type === 'freshness') {
    return [
      source,
      where([eventPredicate(rule.expect), predicate(rule.expect.filter)]),
      '| summarize completions = count()',
    ].join('\n');
  }
  throw new Error(`Unknown monitor rule type "${rule.type}".`);
}

export default renderApl;
