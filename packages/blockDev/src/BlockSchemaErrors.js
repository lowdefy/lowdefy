import React from 'react';

const BlockSchemaErrors = ({ schemaErrors }) => {
  if (!schemaErrors || schemaErrors.length === 0) return '';
  return (
    <div
      style={{
        padding: 10,
        fontSize: '0.8rem',
        border: '1px solid red',
        background: '#fBB',
        width: '100%',
      }}
    >
      <div>
        <b>Schema Errors</b>
      </div>
      {schemaErrors.map((error, i) => (
        <div key={i}>
          <br />
          <div>
            <b>keyword:</b> {error.keyword}
          </div>
          <div>
            <b>message:</b> {error.message}
          </div>
          <div>
            <b>params:</b> {JSON.stringify(error.params)}
          </div>
          <div>
            <b>dataPath:</b> {error.dataPath}
          </div>
          <div>
            <b>schemaPath:</b> {error.schemaPath}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlockSchemaErrors;
