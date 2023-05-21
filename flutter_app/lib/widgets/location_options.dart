// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:geolocator/geolocator.dart';

// Project imports:
import 'package:flutter_app/utils/utils.dart';
import '../utils/location.dart';
import '../widgets/map/map_widget.dart';

class LocationOptionsWidget extends StatelessWidget {
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
    Position pos = await getLocation().catchError((onError) {
      String errorMsg = onError.toString();
      SnackBar snackBar = SnackBar(
        content: Text(errorMsg),
      );

      ScaffoldMessenger.of(context).showSnackBar(snackBar);
      throw onError;
    });
    customAttributes["long"] = pos.latitude.toString();
    customAttributes["lat"] = pos.longitude.toString();
    print("pos $pos ${pos.latitude} ${pos.longitude}");

    String msg = "Latitude: ${pos.latitude} Longitude: ${pos.longitude}";
    SnackBar snackBar = SnackBar(
      content: Text(msg),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  LocationOptionsWidget(
      {super.key, required this.customAttributes, required this.customFilters});

  @override
  Widget build(BuildContext context) {
    Pair<double, double>? posPair;

    String? lat = customAttributes["lat"];
    String? long = customAttributes["long"];

    if (long != null && lat != null) {
      try {
        posPair = Pair(double.parse(long), double.parse(lat));
      } catch (e) {
        print('Error: Invalid format for conversion');
        posPair = null;
      }
    }

    double dist = -1;

    valueController.text = customFilters["dist"] ?? 'None';

    if (customFilters["dist"] != null) {
      print("customFilters.get('dist') is ${customFilters["dist"]}");
      try {
        dist = double.parse(customFilters["dist"]!);
      } catch (e) {
        print('Error: Invalid format for conversion');
        posPair = null;
      }
    } else {
      print("customFilters.get('dist') == null");
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
            child: const Text('Clear'),
          ),
          isValid()
              ? Text('Max Distance Km: ${dist < 0 ? 'None' : dist.toInt()}')
              : Container()
        ],
      ),
      posPair != null
          ? SizedBox(
              width: 300,
              height: 300,
              child: MapWidget(posPair, dist, true, (double eventDist) {
                print("updating dist value $eventDist");
                customFilters["dist"] = eventDist.toString();
              }),
            )
          : Container(),
    ]);
  }
}
