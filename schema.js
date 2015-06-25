//var password = require('password-hash-and-salt');
var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

//Remove this when the table starts to work
query = client.query('DROP TABLE IF EXISTS users cascade; DROP TABLE IF EXISTS position cascade; DROP TABLE IF EXISTS keys cascade');
query = client.query('CREATE TABLE users(userID SERIAL PRIMARY KEY, username VARCHAR(32) NOT NULL UNIQUE, password VARCHAR(16) NOT NULL);');
query.on('end', function(result){
  console.log('Created users');
});
//error checking
query.on('error', function(error){
  throw new Error('Table not created -> ' + error);
});
query = client.query("INSERT INTO users (username, password) VALUES ('user', 'pw')");
query = client.query("INSERT INTO users (username, password) VALUES ('winnie', 'pw')");
query = client.query("INSERT INTO users (username, password) VALUES ('piglet', 'pw')");
query = client.query("INSERT INTO users (username, password) VALUES ('tigger', 'pw')");

query = client.query('CREATE TABLE position(userID INTEGER REFERENCES users(userID), latx NUMERIC, lony NUMERIC);');
query.on('end', function(result){
  console.log('Created position');
});

//error checking
query.on('error', function(error){
  throw new Error('Table not created -> ' + error);
});

query = client.query("INSERT INTO position VALUES (2, -41.3004636, 174.7811026)"); //Basin reserve
query = client.query("INSERT INTO position VALUES (3, -41.2899053, 174.769469)"); // Cotton building kelburn campus
query = client.query("INSERT INTO position VALUES (4, -41.2903729, 174.782762)"); // Te papa
query.on('error', function(error){
  console.log('position table not inserting values correctly');
});

query = client.query('CREATE TABLE keys(userID INTEGER REFERENCES users(userID), watched INTEGER);');
query.on('end', function(result){
  console.log('Created keys');
});
//error checking
query.on('error', function(error){
  throw new Error('Table not created -> ' + error);
});

query = client.query("INSERT INTO keys VALUES(1, 2);");
query = client.query("INSERT INTO keys VALUES(1, 3);");
query = client.query("INSERT INTO keys VALUES(1, 4);");
query = client.query("INSERT INTO keys VALUES(2, 3);");
query = client.query("INSERT INTO keys VALUES(2, 4);");
query = client.query("INSERT INTO keys VALUES(3, 4);");

query.on('end', function(result){
  console.log('Inserted keys');
  client.end();
});