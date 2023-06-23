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

const double minDist = 10;
const double maxDist = 5000;

class LocationOptionsWidget extends GetView<PreferencesController> {
  final RxMap<String, String> customAttributes;
  final Map<String, String> customFilters;

  final RxDouble dist = RxDouble(0);
  final mapController = MapController();

  final valueController =
      TextEditingController(); // Controller for the value text field
  bool isEnabled() {
    return customAttributes["long"] != null && customAttributes["lat"] != null;
  }

  bool canReset() {
    return customAttributes["long"] != null ||
        customAttributes["lat"] != null ||
        customFilters["dist"] != null;
  }

  void reset() {
    customAttributes.remove('long');
    customAttributes.remove('lat');
    customFilters.remove('dist');
  }

  void updateLocation(context) async {
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

  double getDistance() {
    return customFilters["dist"] != null
        ? double.parse(customFilters["dist"] ?? '$maxDist')
        : maxDist;
  }

  LocationOptionsWidget(
      {super.key, required this.customAttributes, required this.customFilters});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      String? lat = customAttributes["lat"];
      String? long = customAttributes["long"];

      Widget enableSwitch = Row(children: <Widget>[
        const Expanded(child: Text("Enabled")),
        Switch(
          value: isEnabled(),
          onChanged: (bool newValue) {
            newValue ? updateLocation(context) : reset();
          },
        )
      ]);

      if (long == null || lat == null) {
        return enableSwitch;
      }

      LatLng center = LatLng(double.parse(long), double.parse(lat));

      double getZoomLevel(double dist) {
        double zoomLevel;
        double radius = dist * 1000 * 2;
        double s = 100;
        double scale = radius / s / 3;
        zoomLevel = (16 - math.log(scale) / math.log(2));
        log("zoomLevel: $zoomLevel");
        return zoomLevel;
      }

      updateDistance(double newDist, {bool end = false}) {
        dist(newDist);
        if (end) {
          if (dist >= minDist && dist <= maxDist) {
            customFilters["dist"] = newDist.toString();
          } else {
            customFilters.remove('dist');
          }
        }
      }

      if (dist() < minDist) {
        updateDistance(getDistance());
      }

      debounce(dist, (value) {
        try {
          mapController.move(center, getZoomLevel(value));
        } catch (err) {
          log.printError(info: err.toString());
        }
      }, time: 1.seconds);

      return Column(children: [
        enableSwitch,
        Wrap(
          alignment: WrapAlignment.center,
          runAlignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Obx(() => Slider(
                  value: dist(),
                  min: minDist,
                  max: maxDist,
                  divisions: 20,
                  onChanged: (newValue) {
                    updateDistance(newValue);
                  },
                  onChangeEnd: (newValue) {
                    updateDistance(newValue, end: true);
                  },
                ))
          ],
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
                zoom: getZoomLevel(dist() ?? 100),
              ),
              nonRotatedChildren: const [],
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                ),
                Obx(() => CircleLayer(
                    circles: dist() < maxDist
                        ? [
                            CircleMarker(
                                point: center,
                                color: Colors.blue.withOpacity(0.7),
                                borderStrokeWidth: 2,
                                useRadiusInMeter: true,
                                radius: dist * 1000)
                          ]
                        : [])),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: center,
                      width: 80,
                      height: 80,
                      builder: (context) => const Icon(Icons.home_filled),
                    ),
                  ],
                )
              ],
            ),
          ),
        ]),
      ]);
    });
  }
}
