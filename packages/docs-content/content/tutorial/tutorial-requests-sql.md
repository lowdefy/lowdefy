# 6. Saving data to SQL

If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/05-requests-api).

We will now add a `SQLite` [connection and request](/connections-and-requests) to our app to save user tickets to the SQLite database file.

## Configuring the SQLite Connection and Request

We will be saving the data from our form in a SQLite database, using the [`Knex`](/SQLite) connection. To do this, we will first need to set up an SQLite database as described in the following steps:

#### 6.1. Setting up the SQLite database

We will make use of an SQLite database with a table called `tickets`, that has the following columns:

- ticket_title
- ticket_type
- ticket_description
- product
- purchase_in_last_month
- created_date

The database used in this tutorial can be downloaded <a href="/tutorial/tutorial_db.sqlite" download>here</a>.
