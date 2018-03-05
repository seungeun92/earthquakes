var geojson = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
var platesjson = "PB2002_plates.json"

d3.json(geojson, function(data) {
  d3.json(platesjson,function(data_p){
    createFeatures(data.features, data_p.features);
  });


function getColor(m) {
    return m > 5 ? '#ff2a00':
           m > 4 ? '#ff5500':
           m > 3 ? '#ff8000':
           m > 2 ? '#ffaa00':
           m > 1 ? '#ffd400':
           m > 0 ? '#ffff00':
           '#d4ff00' ;
}

function createFeatures(earthquakeData, tectonicData) {

  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    "onEachFeature": onEachFeature,
    pointToLayer: function(feature, latlng) {

      var geojsonMarkerOptions = {
        color:'black',
        fillColor: getColor(feature.properties.mag),
        fillOpacity: 0.8, 
        opacity:1,
        weight:1,
        radius: (feature.properties.mag*4.7)
      };
      return L.circleMarker(latlng, geojsonMarkerOptions);
    },
  });

  console.log(earthquakes)

  var plates = L.geoJSON(tectonicData)

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes, plates);
};





function createMap(earthquakes,plates) {

  var mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2V1bmdldW45MiIsImEiOiJjamNzYXR1ZTIwYjhoMndxcXYwbjN3bnAwIn0.C2TZeBKTcofKXWRJnoG53Q');
  var darkmap = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2V1bmdldW45MiIsImEiOiJjamNzYXR1ZTIwYjhoMndxcXYwbjN3bnAwIn0.C2TZeBKTcofKXWRJnoG53Q');

  var baseLayers = {
      "Street Map": mapbox,
      "Dark Map": darkmap
  };
  console.log(baseLayers)

  var overlays = {
      "Earthquakes": earthquakes,
      "Tectonic Plates": plates
  };
  console.log(overlays)

  var myMap = L.map('map', {
    center: [39.8283, -98.5795],
    zoom: 4,
    layers: [mapbox, earthquakes],
    timeDimension: true,
    timeDimensionOptions: {
      timeInterval : "P1W/today",
      period: "P2D",
      autoPlay: true
    },
    timeDimensionControl: true,
    timeDimensionControlOptions: {
      loopButton: true,
      autoPlay: true
    }
  });
  console.log(myMap)

  var legend = L.control({position: 'bottomright'});
  
  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0,1,2,3,4,5],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
  };
  console.log(legend)

legend.addTo(myMap);


  L.TimeDimension.Layer.GeoJson.GeometryCollection = L.TimeDimension.Layer.GeoJson.extend({

    _getFeatureBetweenDates: function(feature, minTime, maxTime) {
      var time = new Date(feature.properties.time);
        if (time > maxTime || time < minTime) {
          return null;
        }
      return feature;
    }

  });

  var timeLayer = L.timeDimension.layer.geoJson.geometryCollection = function(layer, options) {
    return new L.TimeDimension.Layer.GeoJson.GeometryCollection(layer, options);
  };

  console.log(timeLayer)

  geoJsonTimeLayer = L.timeDimension.layer.geoJson.geometryCollection(earthquakes, {
    updateTimeDimension: true,
    updateTimeDimensionMode: 'replace',
    duration: 'PT1H',
  }).addTo(myMap);



  L.control.layers(baseLayers, overlays, {
    collapsed: false
  }).addTo(myMap);
}})
