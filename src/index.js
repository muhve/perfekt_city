/*
 * Copyright (C) 2017 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */

requirejs(['./WebWorldWind/src/WorldWind',
        './LayerManager'],
    function (ww,
              LayerManager) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        var wwd = new WorldWind.WorldWindow("canvasOne");

        wwd.navigator.lookAtLocation.latitude = 60.192059;
        wwd.navigator.lookAtLocation.longitude = 24.945831;
        wwd.navigator.range = 5000;

        // Standard World Wind layers
        var layers = [
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true},
            {layer: new WorldWind.BingAerialWithLabelsLayer(), enabled: true}
        ];

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

        // Create a layer manager for controlling layer visibility.
        var layerManger = new LayerManager(wwd);

        // Web Map Service information from NASA's Near Earth Observations WMS
        var serviceAddress = "https://kartta.hel.fi/ws/geoserver/avoindata/wms?SERVICE=WMS&REQUEST=GetCapabilities";
        var serviceAddress2 = "http://geoserver.hel.fi/geoserver/hel/wms?service=WMS&version=1.1.0&request=GetCapabilities";

        // Called asynchronously to parse and create the WMS layer
        var createLayer = function (xmlDom, layerName, displayName) {
            // Create a WmsCapabilities object from the XML DOM
            var wms = new WorldWind.WmsCapabilities(xmlDom);
            // Retrieve a WmsLayerCapabilities object by the desired layer name
            var wmsLayerCapabilities = wms.getNamedLayer(layerName);
            // Form a configuration object from the WmsLayerCapability object
            var wmsConfig = WorldWind.WmsLayer.formLayerConfiguration(wmsLayerCapabilities);
            // Modify the configuration objects title property to a more user friendly title
            wmsConfig.title = displayName || layerName;

            // Create the WMS Layer from the configuration object
            var wmsLayer = new WorldWind.WmsLayer(wmsConfig, "10");

            wmsLayer.pickEnabled = true;

            // Add the layers to World Wind and update the layer manager
            wwd.addLayer(wmsLayer);
            layerManger.synchronizeLayerList();
        };

        // Called if an error occurs during WMS Capabilities document retrieval
        var logError = function (jqXhr, text, exception) {
            console.log("There was a failure retrieving the capabilities document: " + text + " exception: " + exception);
        };

        $.get(serviceAddress).done(function(data) {
            createLayer(data, "Rakennukset_kartalla", "Buildings")
        }).fail(logError);

        /*$.get(serviceAddress).done(function(data) {
            createLayer(data, "Ortoilmakuva_2016")
        }).fail(logError);*/

        /*$.get(serviceAddress2).done(function(data) {
            createLayer(data, "openahjo_agenda_items")
        }).fail(logError);*/



        //
        //  HSL traffic drawing
        //
        var shapeConfigurationCallback = function (geometry, properties) {
            // Set up the common placemark attributes.
            var placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
            placemarkAttributes.imageScale = properties.nousijat/150000+0.05;

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

                if (properties && (properties.name || properties.Name || properties.NAME)) {
                    configuration.name = properties.name || properties.Name || properties.NAME;
                }
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
        var pointGeoJSON = new WorldWind.GeoJSONParser("http://localhost:8080/hsl.geojson");
        pointGeoJSON.load(null, shapeConfigurationCallback, pointLayer);
        wwd.addLayer(pointLayer);

        //
        //  OpenAhjo asemakaavoitukset
        //
        // Create a layer to hold the polygons.
        var polygonsLayer = new WorldWind.RenderableLayer();
        polygonsLayer.displayName = "Asemakaavat";
        wwd.addLayer(polygonsLayer);

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
            var layerManger = new LayerManager(wwd);
            var highlightController = new WorldWind.HighlightController(wwd);
        }).fail(logError);

    });
