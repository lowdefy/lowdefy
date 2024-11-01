async function callEndpoint(context, { blockId, pageId, payload, endpointId }) {
  const { logger } = context;
  logger.debug({ event: 'debug_endpoint', blockId, pageId, payload, endpointId });
  return {
    response: { success: true },
  };
}

export default callEndpoint;
