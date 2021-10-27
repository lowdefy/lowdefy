import React from 'react';
import { render } from '@testing-library/react';

import BlockSchemaErrors from './BlockSchemaErrors';

test('default', () => {
  const { container } = render(<BlockSchemaErrors />);
  expect(container.firstChild).toMatchInlineSnapshot(``);
});

test('with schema errors', () => {
  const { container } = render(
    <BlockSchemaErrors
      schemaErrors={[
        {
          keyword: 'keyword-one',
          message: 'message-one',
          params: { params: 'one' },
          dataPath: 'dataPath-one',
          schemaPath: 'schemaPath-one',
        },
        {
          keyword: 'keyword-two',
          message: 'message-twp',
          params: { params: 'two' },
          dataPath: 'dataPath-twp',
          schemaPath: 'schemaPath-two',
        },
      ]}
    />
  );
  expect(container.firstChild).toMatchInlineSnapshot(`
    <div
      style="padding: 10px; font-size: 0.8rem; border: 1px solid red; background: rgb(255, 187, 187); width: 100%;"
    >
      <div>
        <b>
          Schema Errors
        </b>
      </div>
      <div>
        <br />
        <div>
          <b>
            keyword:
          </b>
           
          keyword-one
        </div>
        <div>
          <b>
            message:
          </b>
           
          message-one
        </div>
        <div>
          <b>
            params:
          </b>
           
          {"params":"one"}
        </div>
        <div>
          <b>
            dataPath:
          </b>
           
          dataPath-one
        </div>
        <div>
          <b>
            schemaPath:
          </b>
           
          schemaPath-one
        </div>
      </div>
      <div>
        <br />
        <div>
          <b>
            keyword:
          </b>
           
          keyword-two
        </div>
        <div>
          <b>
            message:
          </b>
           
          message-twp
        </div>
        <div>
          <b>
            params:
          </b>
           
          {"params":"two"}
        </div>
        <div>
          <b>
            dataPath:
          </b>
           
          dataPath-twp
        </div>
        <div>
          <b>
            schemaPath:
          </b>
           
          schemaPath-two
        </div>
      </div>
    </div>
  `);
});
