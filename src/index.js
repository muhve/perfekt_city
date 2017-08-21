/*
 * Copyright (C) 2017 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */

requirejs(['./WebWorldWind/src/WorldWind',
        './LayerManager',
        './unitPlanLayer',
        './hslLayer'
    ],
    function (ww,
        LayerManager) {
        "use strict";

        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        var wwd = new WorldWind.WorldWindow("canvasOne");

        wwd.navigator.lookAtLocation.latitude = 60.192059;
        wwd.navigator.lookAtLocation.longitude = 24.945831;
        wwd.navigator.range = 5000;
        wwd.deepPicking = true;

        // Standard World Wind layers
        var layers = [{
                layer: new WorldWind.CompassLayer(),
                enabled: true
            },
            {
                layer: new WorldWind.CoordinatesDisplayLayer(wwd),
                enabled: true
            },
            {
                layer: new WorldWind.ViewControlsLayer(wwd),
                enabled: true
            },
            {
                layer: new WorldWind.BingAerialWithLabelsLayer(),
                enabled: true
            }
        ];

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

        var layerManger = new LayerManager(wwd);
        var highlightController = new WorldWind.HighlightController(wwd);

        /*
        var serviceAddress2 = "http://geoserver.hel.fi/geoserver/hel/wms?service=WMS&version=1.1.0&request=GetCapabilities";
        $.get(serviceAddress2).done(function(data) {
            createLayer(data, "openahjo_agenda_items")
        }).fail(logError);
        */


        wwd.addLayer(require('./hslLayer'));
        wwd.addLayer(require('./unitPlanLayer'));
        layerManger.synchronizeLayerList()

        var serviceAddress = "https://kartta.hel.fi/ws/geoserver/avoindata/wms?SERVICE=WMS&REQUEST=GetCapabilities";

        $.get(serviceAddress).done(function (data) {
            var wms = new WorldWind.WmsCapabilities(data);
            var wmsLayerCapabilities = wms.getNamedLayer("Rakennukset_kartalla");
            var wmsConfig = WorldWind.WmsLayer.formLayerConfiguration(wmsLayerCapabilities);
            wmsConfig.title = "Buildings"
            wwd.addLayer(new WorldWind.WmsLayer(wmsConfig, "10"));
            layerManger.synchronizeLayerList()
        }).fail(function (jqXhr, text, exception) {
            console.log("There was a failure retrieving the capabilities document: " + text + " exception: " + exception);
        });

        var highlightedItems = [];
        var handlePick = function (o) {
            var x = o.clientX,
                y = o.clientY;

            //var rect = new WorldWind.Rectangle(x, y, 100, 100)

            var redrawRequired = highlightedItems.length > 0;

            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].highlighted = false;
            }
            highlightedItems = [];

            var pickList = wwd.pick(wwd.canvasCoordinates(x, y))

            if (pickList.hasNonTerrainObjects) {
                redrawRequired = true;

                for (var p = 1; p < pickList.objects.length; p++) {
                    pickList.objects[p].userObject.highlighted = true;
                    highlightedItems.push(pickList.objects[p].userObject);
                }

                if (highlightedItems.length > 0) {
                    console.log("asd")

                    var div = document.getElementById("hover");
                    
                    div.style.left = x;
                    div.style.top = y;
                
                    $("#divtoshow").toggle();

                    if (highlightedItems[0].layer.displayName === "Unit plans") {
                        renderPlans(highlightedItems[0])
                    } else if (highlightedItems[0].layer.displayName === "HSL bus stop traffic") {
                        renderHsl(highlightedItems[0])
                    } else {
                        $("#hover").html("");
                    }
                }
            }

            if (redrawRequired) wwd.redraw();
        };

        var renderHsl = function (item) {
            $("#hover").html(
                "Stop name: " + item.attributes.name +
                "<br>" +
                "Passenger count: " + item.attributes.amount
            );
        }

        var renderPlans = function (item) {
            $("#hover").html(
                item._attributes.summary
            );
        }

        // Listen for mouse moves and highlight the placemarks that the cursor rolls over.
        wwd.addEventListener("mousemove", handlePick);

        // Listen for taps on mobile devices and highlight the placemarks that the user taps.
        var tapRecognizer = new WorldWind.TapRecognizer(wwd, handlePick);

        $("#showLayers").click(function(e) {
            $("#showLayers").css("display", "none")
            $("#hideLayers").css("display", "inline")            
            $("#layerList").css("display", "inline")
        })

        $("#hideLayers").click(function(e) {
            $("#hideLayers").css("display", "none")
            $("#showLayers").css("display", "inline")            
            $("#layerList").css("display", "none")
        })

    });