import { test, expect } from './fixtures.js';

test('database seeding example', async ({ ldf, mdb }) => {
  // Seed test data
  await mdb.seed('users', [
    { _id: 'user-1', name: 'Test User', email: 'test@example.com' },
  ]);

  await ldf.goto('/users');

  // Assert data is displayed
  await ldf.block('user_name').expect.text('Test User');
});

// Example: Testing with database assertions
//
// test('creates new record in database', async ({ ldf, mdb }) => {
//   await ldf.goto('/users/new');
//
//   await ldf.block('name_input').do.fill('Jane Doe');
//   await ldf.block('email_input').do.fill('jane@example.com');
//   await ldf.block('save_btn').do.click();
//
//   // Assert record was created using native MongoDB driver
//   const user = await mdb.collection('users').findOne({ email: 'jane@example.com' });
//   expect(user).toBeDefined();
//   expect(user.name).toBe('Jane Doe');
// });
//
// Example: Using native driver for complex queries
//
// test('user list shows correct data', async ({ ldf, mdb }) => {
//   await mdb.seed('users', [
//     { _id: 'user-1', name: 'Alice', role: 'admin' },
//     { _id: 'user-2', name: 'Bob', role: 'user' },
//   ]);
//
//   await ldf.goto('/users');
//
//   // Use native driver to count documents
//   const count = await mdb.collection('users').countDocuments({ role: 'admin' });
//   expect(count).toBe(1);
//
//   // Use aggregation if needed
//   const result = await mdb.collection('users').aggregate([
//     { $group: { _id: '$role', count: { $sum: 1 } } }
//   ]).toArray();
//   expect(result).toHaveLength(2);
// });
