import 'dart:html' as html;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
// import 'package:google_maps_flutter/google_maps_flutter.dart' as mobile;
import 'package:google_maps/google_maps.dart' as maps;

class MapWidget extends StatelessWidget {
  final maps.LatLng center;
  final double radius;

  const MapWidget({Key? key, required this.center, required this.radius})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return _buildWebMap();
    // return kIsWeb ? _buildWebMap() : _buildMobileMap();
  }

  // Widget _buildMobileMap() {
  //   return mobile.GoogleMap(
  //     initialCameraPosition: mobile.CameraPosition(
  //       target: mobile.LatLng(center.latitude, center.longitude),
  //       zoom: 12,
  //     ),
  //     circles: {
  //       mobile.Circle(
  //         circleId: mobile.CircleId('radius_circle'),
  //         center: mobile.LatLng(center.latitude, center.longitude),
  //         radius: radius,
  //         fillColor: Colors.blue.withOpacity(0.2),
  //         strokeWidth: 2,
  //         strokeColor: Colors.blue,
  //       ),
  //     },
  //   );
  // }

  Widget _buildWebMap() {
    String htmlId = "7";

    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(htmlId, (int viewId) {
      final myLatlng = maps.LatLng(1.3521, 103.8198);

      final mapOptions = maps.MapOptions()
        ..zoom = 10
        ..center = center;

      final elem = html.DivElement()
        ..id = htmlId
        ..style.width = "100%"
        ..style.height = "100%"
        ..style.border = 'none';

      final map = maps.GMap(elem, mapOptions);

      maps.Marker(maps.MarkerOptions()
        ..position = myLatlng
        ..map = map
        ..title = 'Hello World!');

      return elem;
    });

    return HtmlElementView(viewType: htmlId);
  }
}
