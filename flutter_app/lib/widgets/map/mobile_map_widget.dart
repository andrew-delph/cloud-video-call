import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' ;

import '../../utils.dart';
import 'map_widget.dart';

MapWidget getMapWidget(Pair<double, double> posPair, double dist,
        bool enableDist, Function(double dist) changeDist) =>
    MobileMap(
      posPair: posPair,
      dist: dist,
      enableDist: enableDist,
      changeDist: changeDist,
    );

class MobileMap extends StatefulWidget implements MapWidget {
  final Pair<double, double> posPair;
  final double dist;
  final Function(double dist) changeDist;
  final bool enableDist;

  const MobileMap(
      {Key? key,
      required this.posPair,
      required this.dist,
      required this.changeDist,
      required this.enableDist})
      : super(key: key);

  @override
  State<MobileMap> createState() => MobileMapState();
}
class MobileMapState extends State<MobileMap> {
  final Completer<GoogleMapController> controller = Completer();

  Future<GoogleMapController> getController() async {
    return await controller.future;
  }

  // moveCenter() async {
  //   final center = LatLng(widget.posPair.first, widget.posPair.second);
  //   await updateCamera(CameraUpdate.newCameraPosition(CameraPosition(target: center)));
  // }

  updateCamera(CameraUpdate update) async {
    (await getController()).animateCamera(update);
  }

  LatLngBounds getBounds(LatLng center, double radius) {
    final double latRadian = radius / 111000; // Approximate conversion of meters to degrees
    final double lngRadian = radius / (111000 * cos(pi * center.latitude / 180)); // Approximate conversion of meters to degrees

    final double minLat = center.latitude - latRadian;
    final double maxLat = center.latitude + latRadian;
    final double minLng = center.longitude - lngRadian;
    final double maxLng = center.longitude + lngRadian;

    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  double getZoomLevel(Circle circle) {
    double zoomLevel;
    double radius = circle.radius + circle.radius / 2;
    double scale = radius / 500;
    zoomLevel = (16 - log(scale) / log(2));
    return zoomLevel;
  }


  @override
  Widget build(BuildContext context) {
    final center = LatLng(widget.posPair.first, widget.posPair.second);

    double radius;

    if (widget.dist < 0) {
      radius = 10 * 500;
    } else {
      radius = widget.dist * 500;
    }

    Marker marker = Marker(
      markerId: const MarkerId('center'),
      position: center,
    );

    final circle = Circle(
      circleId: const CircleId('dist'),
      center: center,
      radius: radius,
      // Radius in meters
      fillColor: Colors.red.withOpacity(0.3),
      strokeWidth: 3,
      strokeColor: Colors.red,
    );

    return GoogleMap(
      scrollGesturesEnabled: false,
      // cameraTargetBounds: CameraTargetBounds(getBounds(center, radius)),

      mapType: MapType.hybrid,
      onCameraMove: (position) async {
        print("onCameraMove $position");
      },
      onCameraIdle: () async {
        print("onCameraIdle...");

        final bounds = await (await getController()).getVisibleRegion();

        var radius = Geolocator.distanceBetween(bounds.northeast.latitude, bounds.northeast.longitude, center.latitude, center.longitude);

        radius = (radius * 1) / 1000;

        widget.changeDist(radius);
      },
      markers: {marker},
      circles: {
        circle
      },
      initialCameraPosition: CameraPosition(target: center, zoom: getZoomLevel(circle)),
      onMapCreated: (GoogleMapController controller) {
        this.controller.complete(controller);
      },
    );
  }
}
