import 'dart:html';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps/google_maps.dart';
import 'package:google_maps/google_maps_geometry.dart';

import '../../utils.dart';
import 'map_widget.dart';

MapWidget getMapWidget(Pair<double, double> posPair, double dist,
        bool enableDist, Function(double dist) changeDist) =>
    WebMap(
      posPair: posPair,
      dist: dist,
      enableDist: enableDist,
      changeDist: changeDist,
    );

class WebMap extends StatefulWidget implements MapWidget {
  final Pair<double, double> posPair;
  final double dist;
  final Function(double dist) changeDist;
  final bool enableDist;

  const WebMap(
      {super.key,
      required this.posPair,
      required this.dist,
      required this.enableDist,
      required this.changeDist});

  @override
  State<WebMap> createState() => WebMapState();
}

const String mapId = "map";

class WebMapState extends State<WebMap> {
  double dist = 10;

  WebMapState();

  @override
  void initState() {
    super.initState();
    setState(() {
      dist = widget.dist;
    });
  }

  void updateCircle(Circle circle, double dist) {
    final center = LatLng(widget.posPair.first, widget.posPair.second);
    circle.map!.center = center;
    circle.center = center;
    circle.radius = dist * 500;
    circle.visible = widget.enableDist;
  }

  @override
  Widget build(BuildContext context) {
    DivElement elem = DivElement();
    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(mapId, (int viewId) => elem);

    elem
      ..id = mapId
      ..style.width = '100%'
      ..style.height = '100%';

    final center = LatLng(widget.posPair.first, widget.posPair.second);

    final mapOptions = MapOptions()
      ..zoom = 7.0
      ..clickableIcons = false
      ..zoomControl = true
      ..disableDefaultUI = true
      ..draggable = false
      ..center = center;

    GMap map = GMap(elem, mapOptions);

    map.onCenterChanged.listen((event) {});
    map.onDragstart.listen((event) {});
    map.onDragend.listen((event) {});

    Circle circle = Circle(CircleLiteral()..map = map);

    if (dist > 0) {
      updateCircle(circle, dist);
    } else {
      updateCircle(circle, 10);
    }

    map.fitBounds(circle.bounds);
    bool firstZoom = true;

    map.onZoomChanged.listen((event) {
      if (firstZoom) {
        firstZoom = false;
        return;
      }
      var radius = (Spherical.computeDistanceBetween(
          map.bounds?.southWest, map.bounds?.center));
      radius = (radius! * 1) / 1000;
      widget.changeDist(radius.toDouble());
      updateCircle(circle, radius.toDouble());
    });

    Marker(MarkerOptions()
      ..position = map.center
      ..map = map);

    return const HtmlElementView(viewType: mapId);
  }
}
