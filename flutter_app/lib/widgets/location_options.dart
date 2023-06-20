// Dart imports:
import 'dart:developer';
import 'dart:math' as math;

// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:latlong2/latlong.dart';

// Project imports:
import '../controllers/options_controller.dart';
import '../utils/location.dart';

const distanceStep = 2;

class LocationOptionsWidget extends GetView<PreferencesController> {
  final Map<String, String> customAttributes;
  final Map<String, String> customFilters;

  final valueController =
      TextEditingController(); // Controller for the value text field

  isValid() {
    return customAttributes["long"] != null && customAttributes["lat"] != null;
  }

  canReset() {
    return customAttributes["long"] != null ||
        customAttributes["lat"] != null ||
        customFilters["dist"] != null;
  }

  reset() {
    customAttributes.remove('long');
    customAttributes.remove('lat');
    customFilters.remove('dist');
  }

  updateLocation(context) async {
    Position pos = await getLocation().catchError((error) {
      Get.snackbar(
        "Error",
        error.toString(),
        snackPosition: SnackPosition.TOP,
        backgroundColor: Colors.red.withOpacity(.75),
        colorText: Colors.white,
        icon: const Icon(Icons.error, color: Colors.white),
        shouldIconPulse: true,
        barBlur: 20,
      );
    });
    customAttributes["long"] = pos.latitude.toString();
    customAttributes["lat"] = pos.longitude.toString();
    log("pos $pos ${pos.latitude} ${pos.longitude}");

    String msg = "Latitude: ${pos.latitude} Longitude: ${pos.longitude}";

    Get.snackbar('Updated Location', msg, snackPosition: SnackPosition.BOTTOM);
  }

  double? getDistance() {
    return customFilters["dist"] != null
        ? double.parse(customFilters["dist"] ?? '0')
        : null;
  }

  LocationOptionsWidget(
      {super.key, required this.customAttributes, required this.customFilters});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      String? lat = customAttributes["lat"];
      String? long = customAttributes["long"];

      Widget updateLocationWidget = ElevatedButton(
        onPressed: () {
          updateLocation(context);
        },
        child: const Text('Update Location'),
      );

      if (long == null || lat == null) {
        return updateLocationWidget;
      }

      LatLng center = LatLng(double.parse(long), double.parse(lat));

      final mapController = MapController();

      double? dist = getDistance();

      double s = 100;

      double getZoomLevel(double dist) {
        double zoomLevel;
        double radius = dist * 1000 * 2;
        double scale = radius / s / 3;
        zoomLevel = (16 - math.log(scale) / math.log(2));

        log("zoomLevel: $zoomLevel");
        return zoomLevel;
      }

      updateDistance(double dist) {
        if (dist < 5) {
          customFilters.remove('dist');
        } else {
          double zoom = getZoomLevel(dist);
          if (zoom > 0) {
            customFilters["dist"] = dist.toString();
            mapController.move(center, getZoomLevel(dist));
          }
        }
      }

      final circleMarkers = <CircleMarker>[];
      if (dist != null) {
        final distCircle = CircleMarker(
            point: center,
            color: Colors.blue.withOpacity(0.7),
            borderStrokeWidth: 2,
            useRadiusInMeter: true,
            radius: dist * 1000);
        circleMarkers.add(distCircle);
      }

      return Column(children: [
        Wrap(
          children: [
            ElevatedButton(
              onPressed: () {
                updateLocation(context);
              },
              child: const Text('Update Location'),
            ),
            ElevatedButton(
              onPressed: canReset() ? reset : null,
              child: const Text('Remove Location'),
            ),
          ],
        ),
        if (dist != null)
          Wrap(
            alignment: WrapAlignment.center,
            runAlignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton(
                  icon: const Icon(Icons.remove),
                  onPressed: () {
                    updateDistance(dist / distanceStep);
                  },
                ),
                Text("Max distance: ${getDistance()}km"),
                IconButton(
                  icon: const Icon(Icons.add),
                  onPressed: () {
                    updateDistance(dist * distanceStep);
                  },
                )
              ]),
              ElevatedButton(
                child: const Text("Disable Distance filter"),
                onPressed: () {
                  updateDistance(-1);
                },
              )
            ],
          )
        else
          ElevatedButton(
            child: const Text("Enable Distance Filter"),
            onPressed: () {
              updateDistance(100);
            },
          ),
        Column(children: [
          SizedBox(
            width: 300,
            height: 300,
            child: FlutterMap(
              mapController: mapController,
              options: MapOptions(
                enableScrollWheel: false,
                interactiveFlags: InteractiveFlag.none,
                center: center,
                zoom: getZoomLevel(dist ?? 100),
              ),
              nonRotatedChildren: const [],
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                ),
                CircleLayer(circles: circleMarkers),
              ],
            ),
          ),
        ]),
      ]);
    });
  }
}
