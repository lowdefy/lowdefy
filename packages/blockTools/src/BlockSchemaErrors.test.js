import React from 'react';
import BlockSchemaErrors from './BlockSchemaErrors';
import { create, act } from 'react-test-renderer';

test('default', () => {
  let comp;
  act(() => {
    comp = create(<BlockSchemaErrors />);
  });
  expect(comp.toJSON()).toMatchInlineSnapshot(`""`);
  act(() => {
    comp = create(<BlockSchemaErrors schemaErrors={[]} />);
  });
  expect(comp.toJSON()).toMatchInlineSnapshot(`""`);
});

test('with schema errors', () => {
  let comp;
  act(() => {
    comp = create(
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
  });
  expect(comp.toJSON()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "background": "#fBB",
          "border": "1px solid red",
          "fontSize": "0.8rem",
          "margin": 20,
          "padding": 10,
          "width": "100%",
        }
      }
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
