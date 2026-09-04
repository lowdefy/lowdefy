async function MemoryGet({ connection, request }) {
  if (!request.key) {
    throw new Error('MemoryGet requires a "key" property.');
  }
  const row = (connection.rows ?? []).find((entry) => entry.key === request.key);
  return row?.value ?? null;
}

export default MemoryGet;
