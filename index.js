var express = require('express');
var app = express();
var pg = require('pg');
var cors = require('cors');
var search = require('./search');
var _ = require('underscore');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(cors());

app.get('/', function(req, res) {
  res.sendfile('index.html', {root: __dirname })
});

// Output geolocation route path
app.get('/path/:id', function (request, response) {
    console.log('Call on shapes (route path) for id ', request.params.id);
    var sql = "SELECT trips.trip_id, routes.route_short_name FROM trips INNER JOIN routes ON trips.route_id = routes.route_id WHERE routes.route_short_name = '"+request.params.id+"' LIMIT 1;";
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(sql,function(err, result) {
            done();
            if (err)
            { console.error(err); response.send("Error " + err); }
            else
            { 
                var tripID = result.rows[0].trip_id;

                client.query("SELECT trips.trip_id, shapes.shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence FROM trips INNER JOIN shapes ON shapes.shape_id = trips.shape_id WHERE trips.trip_id = "+tripID+";", function(err, finalresult) {
                    console.log("executed second query");
                    response.send(finalresult.rows);
                });
            }
        });
    });
});


// Alternative method for geolocation route path
// parameters routeNumber userStopID destStopID
app.get('/pathto/:route/:user/:dest', function (request, response) {
  console.log('Calling pathto ',request.params.route, request.params.user, request.params.dest);
  //response.send(request.params.route +  request.params.user + request.params.dest);
  // find the route ID from the route short name
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query("SELECT route_id FROM routes WHERE route_short_name = ($1)",[request.params.route],function(err, result) {
      done();
        if (err)
        { console.error(err);
          return response.send("Error " + err); }
        var routeid = result.rows[0].route_id;
        client.query("SELECT trips.trip_id, stoptimes.arrival_time FROM trips INNER JOIN stoptimes ON  (trips.trip_id = stoptimes.trip_id) WHERE trips.route_id = ($1) AND stoptimes.stop_id = ($2) AND stoptimes.arrival_time > '12:10:00'::time LIMIT 1",[routeid,request.params.user],function(err, result) {
          console.log("executed second query");
          response.send(result.rows);
        });
        
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

// Returns two stop ids, one closest to the users position, the other closest to their destination from the same route

// Get all stops, find closest x to start location for each route?
//      check for each of x best routes which stop is closest to the destination

// OR
// For each route check each stop compare to start and finish

app.get('/search/:id', function (request, response) {
    console.log('Search for: ', request.params.id);
    console.log(request.params.id);
    var sql = "SELECT DISTINCT stops.stop_lat, stops.stop_lon, routes.route_short_name, stops.stop_id FROM stoptimes INNER JOIN stops ON stoptimes.stop_id = stops.stop_id INNER JOIN trips ON stoptimes.trip_id = trips.trip_id INNER JOIN routes ON trips.route_id = routes.route_id where route_short_name ~ '^([0-9])+$';"
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(sql,function(err, result) {
            done();
            if (err) {
                console.error(err); response.send("Error " + err); 
            } else { 
                var input = JSON.parse(request.params.id);
//                console.log(input);

                var bestRoutes = [];
                
                _.each(result.rows, function(stop) {
                    // Check distance from each stop to the user and their destination
                    var rowUserDist = search.getDistance(stop.stop_lat, stop.stop_lon, input.userLat, input.userLng);
                    var rowDestDist = search.getDistance(stop.stop_lat, stop.stop_lon, input.destLat, input.destLng);
                    
                    // Find current best for the route of this stop
                    var rowRoute = _.find(bestRoutes, function(route){
                        return route.routeNumber == stop.route_short_name;
                    });              
                    
                    // Update if this stop is closer
                    if(typeof rowRoute == 'undefined'){
                        bestRoutes.push({routeNumber: stop.route_short_name, 
                                   userDist: rowUserDist,
                                   userStop: stop.stop_id,
                                   userStopLat: stop.stop_lat,
                                   userStopLng: stop.stop_lon,
                                   destDist: rowDestDist,
                                   destStop: stop.stop_id,
                                   destStopLat: stop.stop_lat,
                                   destStopLng: stop.stop_lon});
                    } else {
//                        console.log('rowRoute.userDist = '+rowRoute.userDist+' vs rowUserDist = '+rowUserDist);
                        if(rowRoute.userDist > rowUserDist){
                            rowRoute.userDist = rowUserDist;
                            rowRoute.userStop = stop.stop_id;
                            rowRoute.userStopLat = stop.stop_lat;
                            rowRoute.userStopLng = stop.stop_lon;
                        }
                        
//                        console.log('rowRoute.destDist = '+rowRoute.destDist+' vs rowDestDist = '+rowDestDist);
                        if(rowRoute.destDist > rowDestDist){
                            rowRoute.destDist = rowDestDist;   
                            rowRoute.destStop = stop.stop_id;
                            rowRoute.destStopLat = stop.stop_lat;
                            rowRoute.destStopLng = stop.stop_lon;
                        }
                    }
                });
                
                // The best route to use
                var best = {
                    routeNumber: 0, 
                    dist: Infinity,
                    userStop: 0,
                    userStopLat: 0,
                    userStopLng: 0,
                    destStop: 0,
                    destStopLat: 0,
                    destStopLng: 0                    
                };
                
                // Find route with the lowest total distance between the stops and user and destination
                _.each(bestRoutes, function(route){
                    var totalDist = route.userDist + route.destDist;
//                    console.log('totalDist = '+totalDist + 'vs best.dist = '+best.dist);
                    if(totalDist < best.dist){
                        best.routeNumber = route.routeNumber;
                        best.dist = totalDist;
                        best.userStop = route.userStop;
                        best.userStopLat = route.userStopLat;
                        best.userStopLng = route.userStopLng;
                        best.destStop = route.destStop;
                        best.destStopLat = route.destStopLat;
                        best.destStopLng = route.destStopLng;
//                        console.log('New best: '+JSON.stringify(best));
                    }
                });

                response.send(JSON.stringify(best)); 
            }
        });
    });
});


app.get('/numberofstops/:id', function (request, response) {
    var input = JSON.parse(request.params.id);
    console.log('Call number of stops');
    var sql = "SELECT DISTINCT ON (stops.stop_id) stoptimes.stop_sequence, stops.stop_lat, stops.stop_lon, routes.route_short_name, stops.stop_id FROM stoptimes INNER JOIN stops ON stoptimes.stop_id = stops.stop_id INNER JOIN trips ON stoptimes.trip_id = trips.trip_id INNER JOIN routes ON trips.route_id = routes.route_id where route_short_name LIKE '" + input.routeNumber + "';"
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query(sql,function(err, result) {
            done();
            if (err) {
                console.error(err); response.send("Error " + err); 
            } else { 
                var closestStops = [];
                var destSequenceNum;
                
                closestStops[0] = {
                    dist: Infinity,
                    stopSequence: 0,                    
                }
                
                closestStops[1] = {
                    dist: Infinity,
                    stopSequence: 0,                    
                }
                
                
                _.each(result.rows, function(stop) {
                    var dist = search.getDistance(stop.stop_lat, stop.stop_lon, input.userLat, input.userLng);
                    
                    //if dist < current best dist save
                    if (dist < closestStops[0].dist){
                        var temp = closestStops[0];
                        closestStops[1] = temp;
                        
                        closestStops[0].dist = dist;
                        closestStops[0].stopSequence = stop.stop_sequence;
                    } else {
                        //else is dist < second best dist save
                        if(dist < closestStops[1].dist){
                            closestStops[1].dist = dist;
                            closestStops[1].stopSequence = stop.stop_sequence;                            
                        }
                    }
                    
                    if(input.destStopID == stop.stop_id){
                        destSequenceNum = stop.stop_sequence;                        
                    }
                });
                
                //count difference between stop_sequence numbers
                var minDiff = Math.abs(closestStops[0].stopSequence - destSequenceNum);
                if(minDiff > Math.abs(closestStops[1].stopSequence - destSequenceNum)){
                    minDiff = Math.abs(closestStops[1].stopSequence - destSequenceNum);
                }
                
                minDiff = Math.floor(minDiff/1.5);
                
                // return # of stops left
                var numberRemaining = {
                    numberOfStopsRemaining: minDiff
                };

                response.send(JSON.stringify(numberRemaining)); 
            }
        });
    });
});



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
 
