const assignRowId = (params) => {
  if (params.data.id !== undefined) return params.data.id;
  if (params.data._id !== undefined) return params.data._id;
  if (!params.data.__id) {
    const rowDataCopy = { ...params.data };
    delete rowDataCopy.__id;
    const str = JSON.stringify(rowDataCopy);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    Object.defineProperty(params.data, '__id', {
      value: `row_${Math.abs(hash).toString(16)}`,
      enumerable: false,
    });
  }
  return params.data.__id;
};

export default assignRowId;
