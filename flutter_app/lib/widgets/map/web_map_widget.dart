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
  State<WebMap> createState() => WebMapState(dist);
}

class WebMapState extends State<WebMap> {
  double dist;
  Circle? circle;
  GMap? map;

  WebMapState(this.dist);

  @override
  void didUpdateWidget(WebMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    updateDist();
  }

  void updateDist() {
    if (map == null) {
      return;
    }
    if (widget.dist > 0) {
      if (circle == null) {
        circle = Circle(CircleLiteral()
          ..center = map!.center
          ..radius = widget.dist * 1000
          ..map = map);
      } else {
        circle?.radius = widget.dist * 1000;
      }
      circle!.visible = true;

      circle?.map?.fitBounds(circle?.bounds);
    } else {
      if (circle != null) {
        circle!.visible = false;
      }
    }
  }

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
      map = GMap(elem, mapOptions);

      map?.onCenterChanged.listen((event) {});
      map?.onDragstart.listen((event) {});
      map?.onDragend.listen((event) {});

      Marker(MarkerOptions()
        ..position = map?.center
        ..map = map);

      updateDist();

      return elem;
    });
    return const HtmlElementView(viewType: htmlId);
  }
}
