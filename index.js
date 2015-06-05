var express = require('express');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendfile('index.html', {root: __dirname })
});

// output stops
app.get('/stops/:id', function (request, response) {
  console.log('Call on stops for id ', request.params.id);
  var sql = "SELECT stoptimes.trip_id, stop_sequence, arrival_time,stoptimes.stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon FROM stoptimes INNER JOIN stops ON stops.stop_id = stoptimes.stop_id WHERE stoptimes.trip_id ="+request.params.id+";"
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(sql,function(err, result) {
        done();
        if (err)
          { console.error(err); response.send("Error " + err); }
        else
          { response.send(result.rows); }
    });
  });
});

// Output geolocation route path
app.get('/path/:id', function (request, response) {
  console.log('Call on shapes (route path) for id ', request.params.id);
  var sql = "SELECT trips.trip_id, shapes.shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence FROM trips INNER JOIN shapes ON shapes.shape_id = trips.shape_id WHERE trips.trip_id = "+request.params.id+";"
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(sql,function(err, result) {
        done();
        if (err)
          { console.error(err); response.send("Error " + err); }
        else
          { response.send(result.rows); }
    });
  });
});

// All stops (geolocation only) of all routes
app.get('/allstops', function (request, response) {
  console.log('Call on stoptimes, stops, trips, routes for route_id 1-100', request.params.id);
  var sql = "SELECT DISTINCT stops.stop_lat, stops.stop_lon FROM stoptimes INNER JOIN stops ON stoptimes.stop_id = stops.stop_id INNER JOIN trips ON stoptimes.trip_id = trips.trip_id INNER JOIN routes ON trips.route_id = routes.route_id;"
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(sql,function(err, result) {
        done();
        if (err)
          { console.error(err); response.send("Error " + err); }
        else
          { response.send(result.rows); }
    });
  });
});


// All stops geolocations for a given route (id)
app.get('/stopgeo/:id', function (request, response) {
  console.log('Call on stoptimes, stops, trips, routes for route_id=id', request.params.id);
  var sql = "SELECT DISTINCT stops.stop_lat, stops.stop_lon FROM stoptimes INNER JOIN stops ON stoptimes.stop_id = stops.stop_id INNER JOIN trips ON stoptimes.trip_id = trips.trip_id INNER JOIN routes ON trips.route_id = routes.route_id WHERE routes.route_short_name LIKE " +request.params.id.toString()+ ";"
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(sql,function(err, result) {
        done();
        if (err)
          { console.error(err); response.send("Error " + err); }
        else
          { response.send(result.rows); }
    });
  });
});

// All information for a given stop
app.get('/stopallinfo/:id', function (request, response) {
  console.log('Call on stops for route_id=id', request.params.id);
  var sql = "SELECT * FROM stops WHERE stop_id = " +request.params.id+";"
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query(sql,function(err, result) {
        done();
        if (err)
          { console.error(err); response.send("Error " + err); }
        else
          { response.send(result.rows); }
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
