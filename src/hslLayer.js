define(['./WebWorldWind/src/WorldWind'], function () {
    "use strict";

    // Called if an error occurs during WMS Capabilities document retrieval
    var logError = function (jqXhr, text, exception) {
        console.log("There was a failure retrieving the capabilities document: " + text + " exception: " + exception);
    };

    //
    //  HSL traffic drawing
    //
    var shapeConfigurationCallback = function (geometry, properties) {
        // Set up the common placemark attributes.
        var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
        placemarkAttributes.imageScale = properties.nousijat/150000+0.2;

        if (properties.nousijat < 5000) placemarkAttributes.imageColor = WorldWind.Color.GREEN;
        else if (properties.nousijat < 25000) placemarkAttributes.imageColor = WorldWind.Color.YELLOW;
        else placemarkAttributes.imageColor = WorldWind.Color.RED

        placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.5,
            WorldWind.OFFSET_FRACTION, 1.5);
        placemarkAttributes.imageSource = WorldWind.configuration.baseUrl + "images/man.png";

        var configuration = {};

        if (geometry.isPointType() || geometry.isMultiPointType()) {
            configuration.attributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);

            configuration.attributes.name = properties.nimi_s
            configuration.attributes.amount = properties.nousijat

            if (properties && properties.POP_MAX) {
                var population = properties.POP_MAX;
                configuration.attributes.imageScale = 0.01 * Math.log(population);
            }
        }
        return configuration;
    };

    var parserCompletionCallback = function(layer) {
        wwd.addLayer(layer);
    };

    var pointLayer = new WorldWind.RenderableLayer("HSL bus stop traffic");
    //var pointGeoJSON = new WorldWind.GeoJSONParser("http://perfekt-city.s3-website.eu-central-1.amazonaws.com/hsl.geojson");
    var pointGeoJSON = new WorldWind.GeoJSONParser("http://localhost:8080/hsl.geojson");    
    pointGeoJSON.load(null, shapeConfigurationCallback, pointLayer);

    return pointLayer
})
