var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1Lat, p1Lng, p2Lat, p2Lng) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2Lat - p1Lat);
  var dLong = rad(p2Lng - p1Lng);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1Lat)) * Math.cos(rad(p2Lat)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

exports.getDistance = getDistance;