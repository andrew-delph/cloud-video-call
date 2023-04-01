import 'dart:html';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps/google_maps.dart';

import '../../utils.dart';
import 'map_widget.dart';

MapWidget getMapWidget(Pair<double, double> posPair, double dist) =>
    WebMap(posPair: posPair, dist: dist);

class WebMap extends StatefulWidget implements MapWidget {
  final Pair<double, double> posPair;
  final double dist;

  const WebMap({Key? key, required this.posPair, required this.dist})
      : super(key: key);

  @override
  State<WebMap> createState() => WebMapState();
}

class WebMapState extends State<WebMap> {
  @override
  Widget build(BuildContext context) {
    const String htmlId = "map";

    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(htmlId, (int viewId) {
      final center = LatLng(widget.posPair.first, widget.posPair.second);

      final mapOptions = MapOptions()
        ..zoom = 7.0
        ..clickableIcons = false
        ..zoomControl = true
        ..disableDefaultUI = true
        ..draggable = false
        ..center = center;

      final elem = DivElement()..id = htmlId;
      final map = GMap(elem, mapOptions);

      map.onCenterChanged.listen((event) {});
      map.onDragstart.listen((event) {});
      map.onDragend.listen((event) {});

      Marker(MarkerOptions()
        ..position = map.center
        ..map = map);

      if (widget.dist > 0) {
        print("render dist!!!!!!!!");
        Circle circle = Circle(CircleLiteral()
          ..center = map.center
          ..radius = widget.dist * 1000
          ..map = map);

        map.fitBounds(circle.bounds);
      } else {
        print("no render dist");
      }
      return elem;
    });
    return const HtmlElementView(viewType: htmlId);
  }
}
