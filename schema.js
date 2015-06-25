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
query = client.query("INSERT INTO users (username, password) VALUES ('user', 'pw')");
query.on('end', function(result){
  console.log('Created users');
});
//error checking
query.on('error', function(error){
  throw new Error('Table not created -> ' + error);
});

query = client.query('CREATE TABLE position(userID INTEGER REFERENCES users(userID), latx NUMERIC, lony NUMERIC, timestamp VARCHAR(216));');
query.on('end', function(result){
  console.log('Created position');
});
//error checking
query.on('error', function(error){
  throw new Error('Table not created -> ' + error);
});

query = client.query('CREATE TABLE keys(userID INTEGER REFERENCES users(userID), key VARCHAR(10));');
query.on('end', function(result){
  console.log('Created keys');
  client.end();
});
//error checking
query.on('error', function(error){
  throw new Error('Table not created -> ' + error);
});

/*var setToken = function (){
  	var token = window.localStorage.getItem('token');
 
	if(token){
	    $.ajaxSetup({
	      headers: {
	        'x-access-token': token
	      }
	    });
	}
}
setToken();
  
  $( "#logoutButton" ).bind( "click", function(event, ui) {
    var jsonUrl = "/logout/";
    alert('waiting for result from '+ jsonUrl);
    var logoutInfo = { "token" : window.localStorage.getItem('token') };
    alert(JSON.stringify(logoutInfo));
    $.post(jsonUrl,logoutInfo, function(data) {
      alert(data);
    }, 'json');
  });
  $( "#loginButton" ).bind( "click", function(event, ui) {
  	var jsonUrl = "/login/";
    // var jsonUrl = "https://murmuring-cliffs-3537.herokuapp.com/login/";
    alert('waiting for result from '+ jsonUrl);
    var loginInfo = { "user" : "sam", "password" : "password1" };
    $.post(jsonUrl,loginInfo, function(data) {
      alert('login sucessfull');
      alert(data.token);
      window.localStorage.setItem('token', data.token);
      setToken();
    }, 'json');
  });*/