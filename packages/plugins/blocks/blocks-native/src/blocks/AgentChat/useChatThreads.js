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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type } from '@lowdefy/helpers';

import getChatSeed from './getChatSeed.js';
import getFirstExchange from './getFirstExchange.js';
import getMessageText from './getMessageText.js';
import getProvisionalTitle from './getProvisionalTitle.js';
import getThreadEndpoints from './getThreadEndpoints.js';
import mintConversationId from './mintConversationId.js';
import replayableMessages from './replayableMessages.js';

const THREADS_EVENT = '__agentThreads';

function newThreadState({ scope, seed = null }) {
  return {
    id: mintConversationId({ scope }),
    messages: [],
    provisionalTitle: null,
    seed,
    title: seed?.title ?? null,
  };
}

function userMessageIds(messages) {
  return new Set(messages.filter((message) => message.role === 'user').map(({ id }) => id));
}

/**
 * The chat's threads, kept through the app's thread endpoints (the ai-assistant module's, or the
 * app's own of the same shape) when the `threads` property is set, as the module's panel keeps
 * them on the web:
 *
 * - On mount, the thread last opened in the scope is resumed (getActiveThread), unless
 *   `threads.resume` is false. A chat the person starts (newChat) or opens while it loads cancels
 *   the resume, so the answer does not replace it.
 * - A thread is saved (saveThread) when the person sends in it, named by their first message, and
 *   again when each reply finishes; after the first reply it is named from the first exchange
 *   (titleThread).
 * - The list (listThreads) is read when the threads sheet opens; a thread opens with its stored
 *   messages (getThread) and is deleted with deleteThread. A new chat is minted on the phone and
 *   stored on its first message.
 * - A new chat can start from a seed (getChatSeed): the `seed` property when the chat mounts with
 *   no thread resumed, or the newChat method's args. The thread keeps it as `seed` for the block
 *   (its welcome, input and shared state), saves it with the seed's tag, and keeps the seed's
 *   title rather than naming itself.
 *
 * Without `threads`, the conversation is the `conversationId` property (or one minted for the
 * block) and nothing is kept, as the web block does.
 *
 * The endpoints are called through one internal event running CallAPI.
 *
 * @param {Object} params
 * @param {{ current: Object[] }} params.messagesRef The chat's messages as last rendered.
 * @param {Object} params.methods The block methods.
 * @param {(messages: Object[]) => void} params.onThreadLoaded Called with a thread's stored
 *   messages as it opens, before it shows.
 * @param {Object} params.properties The block properties.
 */
function useChatThreads({ messagesRef, methods, onThreadLoaded, properties }) {
  const threadsConfig = properties.threads;
  const threadsKey = JSON.stringify(threadsConfig ?? null);
  const endpoints = useMemo(() => getThreadEndpoints(threadsConfig), [threadsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const managed = endpoints !== null;
  const scope = type.isString(threadsConfig?.scope) ? threadsConfig.scope : null;
  const canResume = managed && threadsConfig.resume !== false && endpoints.getActiveThread !== null;

  const [thread, setThread] = useState(() =>
    newThreadState({ scope, seed: getChatSeed(properties.seed) })
  );
  const [resuming, setResuming] = useState(canResume);
  // A resume still waiting on getActiveThread. A chat the person starts or opens meanwhile wins.
  const resumePendingRef = useRef(canResume);
  const [list, setList] = useState({ status: 'idle', items: [] });
  const [openingId, setOpeningId] = useState(null);
  const threadRef = useRef(thread);
  threadRef.current = thread;
  // User messages already saved, or loaded with a stored thread, so each is saved once.
  const savedUserIdsRef = useRef(new Set());
  // The thread a reply streams into, with its seed's tag, so a reply that finishes after a switch
  // is saved to its own.
  const streamThreadRef = useRef(null);

  const conversationId = managed ? thread.id : properties.conversationId ?? thread.id;

  useEffect(() => {
    methods.registerEvent({
      name: THREADS_EVENT,
      actions: [
        {
          id: 'call',
          type: 'CallAPI',
          params: { endpointId: { _event: 'endpointId' }, payload: { _event: 'payload' } },
        },
      ],
    });
  }, [methods]);

  const callEndpoint = useCallback(
    async (key, payload) => {
      const result = await methods.triggerEvent({
        name: THREADS_EVENT,
        event: { endpointId: endpoints[key], payload },
      });
      if (result.success !== true) {
        throw result.error ?? new Error(`Thread endpoint "${endpoints[key]}" failed.`);
      }
      return result.responses.call.response.response;
    },
    [endpoints, methods]
  );

  const cancelResume = useCallback(() => {
    if (!resumePendingRef.current) return;
    resumePendingRef.current = false;
    setResuming(false);
  }, []);

  const showThread = useCallback(
    (next) => {
      cancelResume();
      savedUserIdsRef.current = userMessageIds(next.messages);
      onThreadLoaded(next.messages);
      setThread(next);
      methods.triggerEvent({
        name: 'onThreadChange',
        event: { conversationId: next.id, title: next.title },
      });
    },
    [cancelResume, methods, onThreadLoaded]
  );

  useEffect(() => {
    if (!canResume) return undefined;
    let current = true;
    callEndpoint('getActiveThread', { scope })
      .then((active) => {
        if (!current || !resumePendingRef.current || type.isNone(active?.conversationId)) return;
        const messages = replayableMessages({ messages: active.messages ?? [] });
        savedUserIdsRef.current = userMessageIds(messages);
        onThreadLoaded(messages);
        setThread({
          id: active.conversationId,
          messages,
          provisionalTitle: null,
          seed: null,
          title: active.title ?? null,
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!current) return;
        resumePendingRef.current = false;
        setResuming(false);
      });
    return () => {
      current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveThread = useCallback(
    async ({ id, messages, tag, title }) => {
      if (!managed || endpoints.saveThread === null) return;
      let savedTag = null;
      if (type.isString(tag)) {
        savedTag = tag;
      } else if (type.isString(threadsConfig.tag)) {
        savedTag = threadsConfig.tag;
      }
      await callEndpoint('saveThread', {
        conversationId: id,
        messages: replayableMessages({ messages }),
        ...(type.isString(title) ? { title } : {}),
        ...(scope === null ? {} : { scope }),
        tag: savedTag,
      });
    },
    [callEndpoint, endpoints, managed, scope, threadsConfig]
  );

  const renameInList = useCallback((id, title) => {
    setList((prev) => {
      if (prev.items.some((item) => item.key === id)) {
        return {
          ...prev,
          items: prev.items.map((item) => (item.key === id ? { ...item, label: title } : item)),
        };
      }
      return { ...prev, items: [{ key: id, label: title, tags: [] }, ...prev.items] };
    });
  }, []);

  // A request to the agent, as it is made, from the conversation whose transport made it. Its
  // reply is saved to that thread when it finishes. A message the person just sent names a new
  // thread and is kept now, before the reply can finish.
  const onRequest = useCallback(
    ({ conversationId: requestId, messages, trigger }) => {
      if (!managed) return;
      const current = threadRef.current;
      const tag = current.id === requestId ? current.seed?.tag ?? null : null;
      streamThreadRef.current = { id: requestId, tag };
      const last = messages[messages.length - 1];
      if (trigger !== 'submit-message' || last?.role !== 'user') return;
      if (savedUserIdsRef.current.has(last.id)) return;
      savedUserIdsRef.current.add(last.id);
      if (current.id !== requestId) return;
      let { title } = current;
      if (title === null) {
        title = getProvisionalTitle(getMessageText(last));
        if (title !== null) {
          // Read by a reply that finishes before the next render.
          threadRef.current = { ...current, provisionalTitle: title, title };
          setThread((prev) =>
            prev.id === current.id ? { ...prev, provisionalTitle: title, title } : prev
          );
          renameInList(current.id, title);
        }
      }
      saveThread({ id: current.id, messages, tag, title }).catch(() => undefined);
    },
    [managed, renameInList, saveThread]
  );

  // A reply finished (or was stopped): keep it, and name the thread from its first exchange.
  const onReplyFinished = useCallback(
    async (messages) => {
      if (!managed) return;
      const current = threadRef.current;
      const stream = streamThreadRef.current ?? { id: current.id, tag: current.seed?.tag ?? null };
      const { id } = stream;
      const sameThread = id === current.id;
      try {
        await saveThread({
          id,
          messages,
          tag: stream.tag,
          title: sameThread ? current.title : null,
        });
      } catch (error) {
        return;
      }
      if (!sameThread || endpoints.titleThread === null) return;
      const exchange = getFirstExchange({
        messages,
        provisionalTitle: current.provisionalTitle,
        title: current.title,
      });
      if (exchange === null) return;
      try {
        const result = await callEndpoint('titleThread', {
          conversationId: id,
          ...exchange,
          context: type.isString(threadsConfig.titleContext) ? threadsConfig.titleContext : null,
        });
        if (!type.isString(result?.title)) return;
        setThread((prev) =>
          prev.id === id && prev.title === exchange.replaces
            ? { ...prev, title: result.title }
            : prev
        );
        renameInList(id, result.title);
      } catch (error) {
        // A title is cosmetic: the thread keeps the name it has.
      }
    },
    [callEndpoint, endpoints, managed, renameInList, saveThread, threadsConfig]
  );

  const loadList = useCallback(async () => {
    if (!managed || endpoints.listThreads === null) return;
    setList((prev) => ({ ...prev, status: 'loading' }));
    try {
      const items = await callEndpoint('listThreads', { scope });
      setList({ status: 'ready', items: type.isArray(items) ? items : [] });
    } catch (error) {
      setList((prev) => ({ ...prev, status: 'error' }));
    }
  }, [callEndpoint, endpoints, managed, scope]);

  // A new chat, from a seed (the newChat method's args) or none. A chat that is still empty and
  // unseeded is kept rather than replaced.
  const newThread = useCallback(
    (seedArgs) => {
      cancelResume();
      const seed = getChatSeed(seedArgs);
      const current = threadRef.current;
      const isBlank =
        messagesRef.current.length === 0 && current.title === null && current.seed === null;
      if (seed === null && isBlank) return;
      showThread(newThreadState({ scope, seed }));
    },
    [cancelResume, messagesRef, scope, showThread]
  );

  const openThread = useCallback(
    async ({ key, label }) => {
      if (key === threadRef.current.id) return true;
      cancelResume();
      setOpeningId(key);
      try {
        const stored = await callEndpoint('getThread', { conversationId: key });
        showThread({
          id: key,
          messages: replayableMessages({ messages: stored?.messages ?? [] }),
          provisionalTitle: null,
          seed: null,
          title: type.isString(label) ? label : null,
        });
        return true;
      } catch (error) {
        return false;
      } finally {
        setOpeningId(null);
      }
    },
    [callEndpoint, cancelResume, showThread]
  );

  const deleteThread = useCallback(
    async (key) => {
      const before = list.items;
      setList((prev) => ({ ...prev, items: prev.items.filter((item) => item.key !== key) }));
      if (key === threadRef.current.id) {
        showThread(newThreadState({ scope }));
      }
      try {
        await callEndpoint('deleteThread', { conversationId: key });
      } catch (error) {
        setList((prev) => ({ ...prev, items: before }));
      }
    },
    [callEndpoint, list.items, scope, showThread]
  );

  return {
    canDelete: managed && endpoints.deleteThread !== null,
    canList: managed && endpoints.listThreads !== null,
    conversationId,
    deleteThread,
    initialMessages: thread.messages,
    list,
    loadList,
    managed,
    newThread,
    onReplyFinished,
    onRequest,
    openingId,
    openThread,
    resuming,
    seed: thread.seed,
    title: thread.title,
  };
}

export default useChatThreads;
