/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import generateDataSetDocuments from './generateDataSetDocuments.js';
import validateDataSetGenerate from './validateDataSetGenerate.js';

function fail(message) {
  throw new Error(message);
}

function generate({ spec, fixtures = {} }) {
  const validated = validateDataSetGenerate({ generate: spec, fixtures, fail });
  return generateDataSetDocuments({ generate: validated, fixtures, fail });
}

const invoices = {
  seed: 7,
  customers_db: {
    count: 20,
    fields: { name: { company: true } },
  },
  invoices_db: {
    count: 50,
    fields: {
      _id: { sequence: { prefix: 'inv-', start: 1 } },
      status: { oneOf: ['draft', 'sent', 'paid'], weights: [1, 2, 5] },
      amount: { number: { min: 10, max: 5000, decimals: 2 } },
      issued: { date: { from: '2026-01-01', to: '2026-09-30' } },
      note: { text: { words: [3, 12] } },
      contact: { name: true },
      email: { email: true },
      customerId: { ref: 'customers_db' },
      currency: 'ZAR',
      lines: [1, 2],
      meta: { literal: { source: 'generated' } },
      due: { '~d': '2026-12-31T00:00:00.000Z' },
    },
  },
};

test('generateDataSetDocuments gives byte-identical documents for the same seed across runs', () => {
  expect(JSON.stringify(generate({ spec: invoices }))).toEqual(
    JSON.stringify(generate({ spec: structuredClone(invoices) }))
  );
});

test('generateDataSetDocuments gives different documents for a different seed', () => {
  const other = generate({ spec: { ...invoices, seed: 8 } });
  expect(JSON.stringify(other.invoices_db)).not.toEqual(
    JSON.stringify(generate({ spec: invoices }).invoices_db)
  );
});

test('generateDataSetDocuments keeps other fields unchanged when a field is added', () => {
  const before = generate({ spec: invoices }).invoices_db;
  const withExtra = structuredClone(invoices);
  withExtra.invoices_db.fields.extra = { number: { min: 1, max: 9 } };
  const after = generate({ spec: withExtra }).invoices_db;
  expect(after.map(({ extra, ...rest }) => rest)).toEqual(before);
});

test('generateDataSetDocuments makes each kind in its range and shape', () => {
  const { invoices_db: documents, customers_db: customers } = generate({ spec: invoices });
  expect(documents).toHaveLength(50);
  expect(documents[0]._id).toEqual('inv-1');
  expect(documents[49]._id).toEqual('inv-50');
  expect(Object.keys(documents[0])[0]).toEqual('_id');
  const from = Date.parse('2026-01-01');
  const to = Date.parse('2026-09-30');
  const customerIds = new Set(customers.map(({ _id }) => _id));
  documents.forEach((document) => {
    expect(['draft', 'sent', 'paid']).toContain(document.status);
    expect(document.amount).toBeGreaterThanOrEqual(10);
    expect(document.amount).toBeLessThanOrEqual(5000);
    expect(Math.round(document.amount * 100)).toBeCloseTo(document.amount * 100, 6);
    const issued = Date.parse(document.issued['~d']);
    expect(issued).toBeGreaterThanOrEqual(from);
    expect(issued).toBeLessThanOrEqual(to);
    const words = document.note.split(' ');
    expect(words.length).toBeGreaterThanOrEqual(3);
    expect(words.length).toBeLessThanOrEqual(12);
    expect(document.note[0]).toEqual(document.note[0].toUpperCase());
    expect(document.contact).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect(document.email).toMatch(/^[a-z]+\.[a-z]+@example\.(com|org|net)$/);
    expect(customerIds.has(document.customerId)).toBe(true);
    expect(document.currency).toEqual('ZAR');
    expect(document.lines).toEqual([1, 2]);
    expect(document.meta).toEqual({ source: 'generated' });
    expect(document.due).toEqual({ '~d': '2026-12-31T00:00:00.000Z' });
  });
  expect(customers[0]._id).toEqual('customers_db-1');
  customers.forEach((customer) => {
    expect(customer.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Za-z ]+$/);
  });
});

test('generateDataSetDocuments respects oneOf weights over many draws', () => {
  const { tickets: documents } = generate({
    spec: {
      seed: 1,
      tickets: {
        count: 8000,
        fields: { status: { oneOf: ['draft', 'sent', 'paid'], weights: [1, 2, 5] } },
      },
    },
  });
  const share = (status) =>
    documents.filter((document) => document.status === status).length / documents.length;
  expect(share('draft')).toBeCloseTo(1 / 8, 1);
  expect(share('sent')).toBeCloseTo(2 / 8, 1);
  expect(share('paid')).toBeCloseTo(5 / 8, 1);
  expect(Math.abs(share('paid') - 5 / 8)).toBeLessThan(0.03);
});

test('generateDataSetDocuments makes whole numbers inclusive of both bounds without decimals', () => {
  const { counts } = generate({
    spec: { seed: 3, counts: { count: 500, fields: { n: { number: { min: 1, max: 3 } } } } },
  });
  expect([...new Set(counts.map(({ n }) => n))].sort()).toEqual([1, 2, 3]);
});

test('generateDataSetDocuments picks ref values only from the target fixtures with an _id', () => {
  const fixtures = { customers_db: [{ _id: 'c-1' }, { _id: 'c-2' }, { name: 'no id' }] };
  const { orders } = generate({
    fixtures,
    spec: { seed: 5, orders: { count: 100, fields: { customerId: { ref: 'customers_db' } } } },
  });
  orders.forEach((order) => expect(['c-1', 'c-2']).toContain(order.customerId));
});

test('generateDataSetDocuments generates refs in dependency order whatever the file order', () => {
  const { orders, customers } = generate({
    spec: {
      seed: 5,
      orders: { count: 10, fields: { customerId: { ref: 'customers' } } },
      customers: { count: 3 },
    },
  });
  orders.forEach((order) => expect(customers.map(({ _id }) => _id)).toContain(order.customerId));
});

test('generateDataSetDocuments refuses refs that form a cycle', () => {
  expect(() =>
    generate({
      spec: {
        seed: 1,
        a: { count: 1, fields: { b: { ref: 'b' } } },
        b: { count: 1, fields: { a: { ref: 'a' } } },
      },
    })
  ).toThrow('generate refs form a cycle: a -> b -> a.');
});

test('generateDataSetDocuments refuses a ref to a connection with no documents', () => {
  expect(() =>
    generate({
      fixtures: { customers: [{ name: 'no id' }] },
      spec: { seed: 1, orders: { count: 1, fields: { customerId: { ref: 'customers' } } } },
    })
  ).toThrow(
    'generate.orders.fields.customerId refs "customers", which has no documents with an _id.'
  );
});

test('generateDataSetDocuments refuses a generated _id that is also a fixture _id', () => {
  expect(() =>
    generate({
      fixtures: { tickets: [{ _id: 'tickets-2' }] },
      spec: { seed: 1, tickets: { count: 3 } },
    })
  ).toThrow('generate.tickets[1] _id "tickets-2" is also a fixture\'s _id.');
});

test('generateDataSetDocuments refuses an _id generated twice', () => {
  expect(() =>
    generate({ spec: { seed: 1, tickets: { count: 30, fields: { _id: { oneOf: ['a', 'b'] } } } } })
  ).toThrow('is generated twice.');
});

test('validateDataSetGenerate refuses an unknown kind, naming it', () => {
  expect(() =>
    generate({ spec: { seed: 1, tickets: { count: 1, fields: { ref: { uuid: true } } } } })
  ).toThrow(
    'generate.tickets.fields.ref has unknown kind "uuid". Kinds: literal, oneOf, number, date, text, name, email, company, sequence, ref. Write an object value as { literal: <value> }.'
  );
});

test('validateDataSetGenerate refuses a missing seed, a bad count and bad kind options', () => {
  expect(() => generate({ spec: { tickets: { count: 1 } } })).toThrow(
    'generate.seed should be a whole number'
  );
  expect(() => generate({ spec: { seed: 1, tickets: { count: 0 } } })).toThrow(
    'generate.tickets.count should be a whole number above 0. Received 0.'
  );
  expect(() =>
    generate({
      spec: { seed: 1, tickets: { count: 1, fields: { n: { number: { min: 5, max: 1 } } } } },
    })
  ).toThrow('generate.tickets.fields.n.number min 5 is above max 1.');
  expect(() =>
    generate({
      spec: {
        seed: 1,
        tickets: { count: 1, fields: { d: { date: { from: 'soon', to: 'later' } } } },
      },
    })
  ).toThrow('generate.tickets.fields.d.date.from should be a date such as 2026-01-31.');
  expect(() =>
    generate({
      spec: {
        seed: 1,
        tickets: { count: 1, fields: { s: { oneOf: ['a', 'b'], weights: [1] } } },
      },
    })
  ).toThrow('generate.tickets.fields.s.weights should be one number of 0 or more per oneOf value');
  expect(() =>
    generate({ spec: { seed: 1, tickets: { count: 1, fields: { c: { name: 'yes' } } } } })
  ).toThrow('generate.tickets.fields.c.name should be true.');
  expect(() =>
    generate({ spec: { seed: 1, tickets: { count: 1, fields: { c: { ref: 'nowhere' } } } } })
  ).toThrow('generate.tickets.fields.c refs "nowhere", which is in neither fixtures nor generate.');
  expect(() => generate({ spec: { seed: 1, tickets: { count: 1, rows: 3 } } })).toThrow(
    'generate.tickets has unknown key "rows". Allowed: count, fields.'
  );
});
