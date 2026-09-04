function StaticRowsFind({ connection, request }) {
  const rows = connection.rows ?? [];
  if (!request.where) {
    return rows;
  }
  return rows.filter((row) =>
    Object.entries(request.where).every(([field, value]) => row[field] === value)
  );
}

export default StaticRowsFind;
