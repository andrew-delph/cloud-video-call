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

const distanceStep = 10.0;

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
    print("pos $pos ${pos.latitude} ${pos.longitude}");

    String msg = "Latitude: ${pos.latitude} Longitude: ${pos.longitude}";

    Get.snackbar('Updated Location', msg, snackPosition: SnackPosition.BOTTOM);
  }

  getDistance() {
    return customFilters["dist"] != null
        ? double.parse(customFilters["dist"] ?? '0')
        : null;
  }

  updateDistance(double dist) {
    if (dist < 1) {
      customFilters.remove('dist');
    } else {
      customFilters["dist"] = dist.toString();
    }
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

      double dist = -1;

      valueController.text = customFilters["dist"] ?? 'None';

      if (customFilters["dist"] != null) {
        print("customFilters.get('dist') is ${customFilters["dist"]}");
        try {
          dist = double.parse(customFilters["dist"]!);
        } catch (e) {
          print('Error: Invalid format for conversion');
          dist = 10000;
        }
      } else {
        print("customFilters.get('dist') == null");
      }

      final mapController = MapController();

      final distCircle = CircleMarker(
          point: center,
          color: Colors.blue.withOpacity(0.7),
          borderStrokeWidth: 2,
          useRadiusInMeter: true,
          radius: 2000);

      final circleMarkers = <CircleMarker>[distCircle];

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
              child: const Text('Clear'),
            ),
          ],
        ),
        if (getDistance() != null)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.remove),
                onPressed: () {
                  updateDistance(getDistance() - distanceStep);
                },
              ),
              Text("Max distance: ${getDistance()}km"),
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () {
                  updateDistance(getDistance() + distanceStep);
                },
              ),
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
                zoom: 11,
                onMapReady: () {
                  mapController.mapEventStream.listen((evt) {
                    print("evt: ${evt.toString()}");
                  });
                  // And any other `MapController` dependent non-movement methods
                },
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
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.zoom_in),
                onPressed: () {
                  mapController.move(center, mapController.zoom + 1);
                },
              ),
              IconButton(
                icon: const Icon(Icons.zoom_out),
                onPressed: () {
                  mapController.move(center, mapController.zoom - 1);
                },
              ),
            ],
          )
        ]),
      ]);
    });
  }
}
