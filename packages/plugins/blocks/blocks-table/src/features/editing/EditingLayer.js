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

import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import computeEditTargets from './computeEditTargets.js';
import EditMarker from './EditMarker.js';
import isSameTargets from './isSameTargets.js';
import scrollToCell from '../virtualization/scrollToCell.js';

import './editing.css';

const CellEditor = lazy(() => import('./CellEditor.js'));

const EMPTY = [];
const NO_DRAFT = { has: false };
const NOTICE_MS = 6000;

function startPending(api) {
  const pending = api.editing.pendingStart;
  if (!pending) return;
  const index = api.rows.findIndex((row) => row.id === pending.rowId);
  if (index === -1) return;
  api.editing.pendingStart = null;
  const col = api.layout.byKey.get(pending.colKey);
  if (!col) return;
  scrollToCell({ api, row: index, col: col.index });
  api.keyboard?.setActive({ row: index, col: col.index });
  api.actions.startEdit({ rowId: pending.rowId, colKey: pending.colKey });
}

// The one component that draws editing into the grid. Cells stay tier-0 and never know about
// editing: the open editor (at most one, D10 tier 1) and the status markers are portalled into the
// rendered cell elements, found by row key and column key. `sync` runs after every grid render
// (scroll included) and after the layer's own, so a cell that remounts gets its editor or
// marker back. The editor session and its draft live here and are reached through
// `api.editing.layer` by the handlers and actions.
function EditingLayer({ api }) {
  const [session, setSessionState] = useState(null);
  const [targets, setTargets] = useState(EMPTY);
  const [notice, setNotice] = useState(null);
  const sessionRef = useRef(null);
  const draftRef = useRef({ id: null, has: false, value: undefined });
  const targetsRef = useRef(EMPTY);

  const layer = useMemo(
    () => ({
      getSession: () => sessionRef.current,
      setSession(next) {
        sessionRef.current = next;
        draftRef.current = { id: next?.id ?? null, has: false, value: undefined };
        setSessionState(next);
      },
      updateSession(patch) {
        if (!sessionRef.current) return;
        sessionRef.current = { ...sessionRef.current, ...patch };
        setSessionState(sessionRef.current);
      },
      getDraft(id) {
        return draftRef.current.id === id ? draftRef.current : NO_DRAFT;
      },
      setDraft(id, value) {
        if (draftRef.current.id !== id) return;
        draftRef.current = { id, has: true, value };
      },
      notify: setNotice,
      sync() {
        startPending(api);
        const next = computeEditTargets({ api, session: sessionRef.current });
        if (isSameTargets(targetsRef.current, next)) return;
        targetsRef.current = next;
        setTargets(next);
      },
    }),
    [api]
  );
  api.editing.layer = layer;

  useLayoutEffect(() => {
    layer.sync();
  });

  useLayoutEffect(
    () => () => {
      if (api.editing.layer === layer) api.editing.layer = null;
    },
    [layer]
  );

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timeout);
  }, [notice]);

  return (
    <>
      {targets.map((target) => {
        if (target.kind === 'editor') {
          if (!session || target.id !== `editor:${session.id}`) return null;
          return createPortal(
            <Suspense fallback={null}>
              <CellEditor api={api} session={session} />
            </Suspense>,
            target.element,
            target.id
          );
        }
        return createPortal(
          <EditMarker message={target.message} status={target.status} />,
          target.element,
          target.id
        );
      })}
      {notice ? (
        <div className="lf-table-edit-notice" role="status" title={notice.details}>
          {notice.text}
        </div>
      ) : null}
    </>
  );
}

export default EditingLayer;
