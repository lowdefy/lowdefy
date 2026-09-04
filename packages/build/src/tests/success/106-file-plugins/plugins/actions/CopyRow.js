function CopyRow({ methods: { setState }, params }) {
  if (!params.rowId) {
    throw new Error('CopyRow requires a "rowId" parameter.');
  }
  setState({ copiedRowId: params.rowId });
}

export default CopyRow;
