import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

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

  updateCamera(CameraUpdate update) async {
    (await getController()).animateCamera(update);
  }

  double s = 500;
  LatLngBounds? bounds;

  double getZoomLevel(Circle circle) {
    double zoomLevel;
    double radius = circle.radius + circle.radius;
    double scale = radius / s / 0.5;
    zoomLevel = (16 - log(scale) / log(2));
    return zoomLevel;
  }

  @override
  Widget build(BuildContext context) {
    final center = LatLng(widget.posPair.first, widget.posPair.second);

    double radius;

    if (widget.dist < 0) {
      radius = 10 * s;
    } else {
      radius = widget.dist * s;
    }

    Marker marker = Marker(
      markerId: const MarkerId('center'),
      position: center,
    );

    final circle = Circle(
      circleId: const CircleId('dist'),
      center: center,
      radius: radius,
      fillColor: Colors.red.withOpacity(0.3),
      strokeWidth: 3,
      strokeColor: Colors.red,
    );

    bool firstRender = true;

    CameraTargetBounds cameraTargetBounds = CameraTargetBounds.unbounded;
    if (bounds != null) {
      cameraTargetBounds = CameraTargetBounds(bounds);
    }

    return GoogleMap(
      cameraTargetBounds: cameraTargetBounds,
      scrollGesturesEnabled: false,
      zoomControlsEnabled: true,
      padding: EdgeInsets.all(10),
      onCameraMove: (position) async {
        firstRender = false;
      },
      onCameraIdle: () async {
        if (firstRender) {
          firstRender = false;
          return;
        }
        final localBounds = await (await getController()).getVisibleRegion();
        bounds = localBounds;

        var newRadius = Geolocator.distanceBetween(
            localBounds.northeast.latitude,
            localBounds.northeast.longitude,
            center.latitude,
            center.longitude);

        newRadius = (newRadius * 0.6) / s;

        widget.changeDist(newRadius);
      },
      markers: {marker},
      circles: {circle},
      initialCameraPosition:
          CameraPosition(target: center, zoom: getZoomLevel(circle)),
      onMapCreated: (GoogleMapController controller) async {
        this.controller.complete(controller);
      },
    );
  }
}
