const csvMakeFn = async (context, filename, data, fields) => {
  if (!Array.isArray(data) || typeof data[0] !== 'object') {
    throw new Error('csvMake data takes an array of objects');
  }
  if (!fields) {
    fields = Object.keys(data[0]);
  }
  const arrays = [fields];
  data.forEach((obj) => arrays.push(fields.map((field) => obj[field])));
  const csv = arrays
    .map((row) =>
      row
        .map((cell) => (typeof cell === 'undefined' || cell === null ? '' : cell))
        .map(String)
        .map((v) => v.replaceAll('"', '""'))
        .map((v) => `"${v}"`)
        .join(',')
    )
    .join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.setAttribute('download', filename);
  el.click();
};
window.lowdefy.registerJsAction('csvMake', csvMakeFn);
