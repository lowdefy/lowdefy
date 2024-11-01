async function callEndpoint(context, { blockId, pageId, payload, requestId }) {
  const { logger } = context;
  logger.debug({ event: 'debug_endpoint', blockId, pageId, payload, requestId });
  return {
    response: { success: true },
  };
}

export default callEndpoint;
