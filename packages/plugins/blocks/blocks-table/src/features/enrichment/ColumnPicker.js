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

import React, { useMemo, useState } from 'react';
import { Alert, Button, Drawer, Input, Select, Switch } from 'antd';
import AI_OUTPUT_TYPES from '@lowdefy/blocks-antd/table/aiOutputTypes.js';
import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';
import USER_COLUMN_TYPES from '@lowdefy/blocks-antd/table/userColumnTypes.js';

import buildColumnConfig from './buildColumnConfig.js';
import generateColumnKey from './generateColumnKey.js';
import getPickerKinds from './getPickerKinds.js';
import InputMapping from './InputMapping.js';
import syncPromptInputs from './syncPromptInputs.js';
import TemplateEditor from './TemplateEditor.js';
import validateDraft from './validateDraft.js';

// The column core only accepts these types on a user-defined column (userColumnTypes.js).
const TYPE_OPTIONS = USER_COLUMN_TYPES.map((cellType) => ({ value: cellType, label: cellType }));
// An ai column answers one of the AI output types; tag and tags take the answers allowed.
const AI_TYPE_OPTIONS = AI_OUTPUT_TYPES.map((cellType) => ({ value: cellType, label: cellType }));
const OPTION_TYPES = new Set(['tag', 'tags']);

function Field({ children, label, name }) {
  return (
    <div className="lf-enrich-field" data-lf-picker-field={name}>
      <span className="lf-enrich-field-label">{label}</span>
      {children}
    </div>
  );
}

function KindList({ entries, draft, onPick }) {
  const selected = draft.kind === 'enrichment' ? `provider:${draft.provider}` : draft.kind;
  return (
    <div aria-label="Column kind" className="lf-enrich-kinds" role="radiogroup">
      {entries.map((entry) => (
        <button
          aria-checked={entry.id === selected}
          className="lf-enrich-kind"
          data-lf-picker-kind={entry.id}
          key={entry.id}
          onClick={() => onPick(entry)}
          role="radio"
          type="button"
        >
          <span className="lf-enrich-kind-label">{entry.label}</span>
          <span className="lf-enrich-kind-description">{entry.description}</span>
        </button>
      ))}
    </div>
  );
}

function ProviderFields({ columns, draft, provider, update }) {
  const outputs = provider.outputs.map((output) => ({
    value: output.path,
    label: output.title ?? output.path,
  }));
  return (
    <>
      {provider.inputs.map((input) => (
        <InputMapping
          columns={columns}
          input={input}
          key={input.key}
          mapping={draft.inputs[input.key]}
          onChange={(mapping) => update({ inputs: { ...draft.inputs, [input.key]: mapping } })}
        />
      ))}
      <Field label="Output" name="output">
        {outputs.length > 0 ? (
          <Select
            allowClear
            aria-label="Output"
            onChange={(path) => {
              const output = provider.outputs.find((entry) => entry.path === path);
              update({ output: path ?? '', type: output?.type ?? draft.type });
            }}
            options={outputs}
            placeholder="The whole result"
            value={draft.output || undefined}
          />
        ) : (
          <Input
            aria-label="Output path"
            onChange={(event) => update({ output: event.target.value })}
            placeholder="Path in the result, for example email"
            value={draft.output}
          />
        )}
      </Field>
    </>
  );
}

function KindFields({ columns, draft, provider, sources, update }) {
  switch (draft.kind) {
    case 'formula':
      return (
        <Field label="Template" name="template">
          <TemplateEditor
            columns={columns}
            name="template"
            onChange={(template) => update({ template })}
            placeholder="{{ first_name }} {{ last_name }}"
            value={draft.template}
          />
        </Field>
      );
    case 'enrichment':
      return provider ? (
        <ProviderFields columns={columns} draft={draft} provider={provider} update={update} />
      ) : null;
    case 'ai':
      return (
        <>
          <Field label="Prompt" name="prompt">
            <TemplateEditor
              columns={columns}
              name="prompt"
              onChange={(prompt) =>
                update({
                  prompt,
                  inputs: syncPromptInputs({
                    prompt,
                    columnKeys: columns.map((column) => column.key),
                  }),
                })
              }
              placeholder="Summarise what {{ company }} sells in one sentence."
              value={draft.prompt}
            />
            <span className="lf-enrich-muted" data-lf-picker-prompt-note="">
              The columns you insert are the column&apos;s inputs: a cell is stale when one of them
              changes. Changing the prompt does not make cells stale; rerun the column to use it.
            </span>
          </Field>
          {OPTION_TYPES.has(draft.type) ? (
            <Field label="Answer options" name="outputOptions">
              <Select
                aria-label="Answer options"
                mode="tags"
                onChange={(outputOptions) => update({ outputOptions })}
                open={false}
                placeholder="Type an option and press Enter"
                value={draft.outputOptions}
              />
            </Field>
          ) : null}
        </>
      );
    case 'extract':
      return (
        <>
          <Field label="From column" name="source">
            <Select
              aria-label="From column"
              onChange={(source) => update({ source })}
              options={sources.map((column) => ({ value: column.key, label: column.title }))}
              placeholder="Choose a column"
              value={draft.source ?? undefined}
            />
          </Field>
          <Field label="Path" name="path">
            <Input
              aria-label="Path"
              onChange={(event) => update({ path: event.target.value })}
              placeholder="company.name (empty for the whole result)"
              value={draft.path}
            />
          </Field>
        </>
      );
    default:
      return null;
  }
}

function pickKind({ draft, entry, providersById }) {
  const provider = entry.provider ? providersById.get(entry.provider) : null;
  const next = { ...draft, kind: entry.kind, provider: entry.provider ?? null };
  if (entry.kind === 'ai' && !AI_OUTPUT_TYPES.includes(draft.type)) next.type = 'text';
  // A provider fills an untouched title, and the type of its first output.
  if (provider && (draft.title === '' || draft.autoTitle === draft.title)) {
    next.title = provider.title;
    next.autoTitle = provider.title;
  }
  if (provider && provider.outputs[0]?.type && draft.output === '') {
    next.output = provider.outputs[0].path;
    next.type = provider.outputs[0].type;
  }
  return next;
}

// The add / edit column picker (design E3, E6): an antd Drawer, loaded and mounted only while
// open. Pick a kind (input, formula, a provider, AI, extract), then the title, type and the
// kind's settings: provider inputs mapped to columns or literals, the output path, auto-run;
// the AI prompt with column chips; the extract source and path. The generated column config is
// previewed, and submitting fires onColumnAdd (or onColumnUpdate) with it (submitColumn: pending
// while the event runs, its error shown here on failure).
function ColumnPicker({ api, picker }) {
  const settings = api.config.enrichment;
  const [draft, setDraft] = useState(picker.draft);
  const update = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const allColumns = api.config.columns;
  const columns = useMemo(
    () =>
      allColumns
        .filter(
          (column) => column.key !== picker.key && CELL_TYPE_FAMILIES[column.type] !== 'action'
        )
        .map((column) => ({ key: column.key, title: htmlToText(column.title) })),
    [allColumns, picker.key]
  );
  const sources = settings.runColumns
    .filter((column) => column.key !== picker.key)
    .map((column) => ({ key: column.key, title: htmlToText(column.title) }));
  const entries = getPickerKinds({
    kinds: picker.kinds,
    providers: settings.providers,
    hasSources: sources.length > 0,
  });
  const provider = draft.kind === 'enrichment' ? settings.providersById.get(draft.provider) : null;
  const key =
    picker.mode === 'edit'
      ? picker.key
      : generateColumnKey({
          title: draft.title,
          existingKeys: [...api.config.columnsByKey.keys()],
        });
  const column = buildColumnConfig({
    draft,
    key,
    inputFieldPrefix: picker.mode === 'edit' ? null : settings.inputFieldPrefix,
  });
  const problem = validateDraft({ draft, provider });
  const saving = picker.status === 'saving';
  const runs = draft.kind === 'enrichment' || draft.kind === 'ai';
  const close = () => api.actions.closeOverlay({ name: 'picker' });

  return (
    <Drawer
      footer={
        <div className="lf-enrich-picker-footer">
          <span className="lf-enrich-picker-hint" data-lf-picker-problem={problem ? '' : undefined}>
            {problem}
          </span>
          <Button data-lf-picker-cancel="" disabled={saving} onClick={close}>
            Cancel
          </Button>
          <Button
            data-lf-picker-submit=""
            disabled={problem !== null}
            loading={saving}
            onClick={() => api.actions.submitColumn({ column })}
            type="primary"
          >
            {picker.mode === 'edit' ? 'Save column' : 'Add column'}
          </Button>
        </div>
      }
      onClose={saving ? undefined : close}
      open
      rootClassName="lf-enrich-drawer"
      size={520}
      title={picker.mode === 'edit' ? 'Edit column' : 'Add column'}
    >
      <div className="lf-enrich-picker" data-lf-column-picker={picker.mode}>
        {entries.length > 1 || picker.mode === 'add' ? (
          <KindList
            draft={draft}
            entries={entries}
            onPick={(entry) =>
              setDraft((current) =>
                pickKind({ draft: current, entry, providersById: settings.providersById })
              )
            }
          />
        ) : null}
        <Field label="Title" name="title">
          <Input
            aria-label="Title"
            autoFocus
            onChange={(event) => update({ title: event.target.value })}
            placeholder="Column title"
            value={draft.title}
          />
        </Field>
        <Field label={draft.kind === 'ai' ? 'Answer type' : 'Type'} name="type">
          <Select
            aria-label="Type"
            onChange={(cellType) => update({ type: cellType })}
            options={draft.kind === 'ai' ? AI_TYPE_OPTIONS : TYPE_OPTIONS}
            showSearch
            value={draft.type}
          />
        </Field>
        <KindFields
          columns={columns}
          draft={draft}
          provider={provider}
          sources={sources}
          update={update}
        />
        {runs ? (
          <Field label="Run automatically" name="autoRun">
            <Switch
              aria-label="Run automatically"
              checked={draft.autoRun}
              onChange={(autoRun) => update({ autoRun })}
            />
          </Field>
        ) : null}
        <details className="lf-enrich-preview" open>
          <summary>Column config</summary>
          <pre data-lf-picker-preview="">{JSON.stringify(column, null, 2)}</pre>
        </details>
        {picker.error ? (
          <Alert data-lf-picker-error="" showIcon title={picker.error} type="error" />
        ) : null}
      </div>
    </Drawer>
  );
}

export default ColumnPicker;
