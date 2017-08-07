define(['./WebWorldWind/src/WorldWind'], function () {
    "use strict";

    // Called if an error occurs during WMS Capabilities document retrieval
    var logError = function (jqXhr, text, exception) {
        console.log("There was a failure retrieving the capabilities document: " + text + " exception: " + exception);
    };

    var polygonsLayer = new WorldWind.RenderableLayer();
    polygonsLayer.displayName = "Unit plans";

    $.get("https://dev.hel.fi/paatokset/v1/issue/search/?category=419&limit=100&format=json").done(function(data) {

        let objects = data.objects.map(function(object) {
            object.geometries = object.geometries
                .filter(x => x.category === 'plan_unit')
                .map(geometry =>
                    geometry.coordinates[0].map(x =>
                        new WorldWind.Position(x[1], x[0], 100)))
            return object
        }).filter(x => x.geometries.length > 0)

        console.log(objects)

        objects.forEach(function(object) {
            var polygon = new WorldWind.Polygon([object.geometries[0]], null);
            polygon.altitudeMode = WorldWind.ABSOLUTE;
            polygon.extrude = true; // extrude the polygon edges to the ground

            var polygonAttributes = new WorldWind.ShapeAttributes(null);
            polygonAttributes.drawInterior = true;
            polygonAttributes.drawOutline = true;
            polygonAttributes.outlineColor = WorldWind.Color.BLUE;
            polygonAttributes.interiorColor = new WorldWind.Color(0, 1, 1, 0.5);
            polygonAttributes.drawVerticals = polygon.extrude;
            polygonAttributes.applyLighting = true;
            polygon.attributes = polygonAttributes;

            var highlightAttributes = new WorldWind.ShapeAttributes(polygonAttributes);
            highlightAttributes.outlineColor = WorldWind.Color.RED;
            highlightAttributes.interiorColor = new WorldWind.Color(1, 1, 1, 0.5);
            polygon.highlightAttributes = highlightAttributes;

            // Add the polygon to the layer and the layer to the World Window's layer list.
            polygonsLayer.addRenderable(polygon);
        })

        // Create a layer manager for controlling layer visibility.

    }).fail(logError);

    return polygonsLayer
})