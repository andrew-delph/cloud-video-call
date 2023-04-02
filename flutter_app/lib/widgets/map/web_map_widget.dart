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
      {Key? key,
      required this.posPair,
      required this.dist,
      required this.enableDist,
      required this.changeDist})
      : super(key: key);

  @override
  State<WebMap> createState() => WebMapState(dist);
}

class WebMapState extends State<WebMap> {
  double dist;
  Circle? circle;

  WebMapState(this.dist);

  @override
  void didUpdateWidget(WebMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (circle != null) {
      final center = LatLng(widget.posPair.first, widget.posPair.second);
      circle!.map!.center = center;
      circle!.center = center;
      circle!.radius = widget.dist * 500;
      circle!.visible = widget.enableDist;
      // circle!.map!.fitBounds(circle!.bounds);
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
      GMap map = GMap(elem, mapOptions);

      map.onCenterChanged.listen((event) {});
      map.onDragstart.listen((event) {});
      map.onDragend.listen((event) {});

      print(
          "rendered widget.dist * 1000 ${widget.dist * 1000} ${widget.dist * 500}");

      circle = Circle(CircleLiteral()
        ..center = map.center
        ..radius = widget.dist * 500
        ..visible = widget.enableDist
        ..map = map);

      map.onTilesloaded.listen((event) {
        if (widget.dist == 0) {
          print("dist was 0000000000000000000000000000000");
          var radius = (Spherical.computeDistanceBetween(
              map.bounds?.southWest, map.bounds?.center));
          radius = (radius! * 0.6) / 1000;
          radius = radius.toInt();
          circle!.radius = (radius * 500);
          widget.changeDist(radius.toDouble());
          map.center = center;
        }
      });

      map.fitBounds(circle!.bounds);

      map.onZoomChanged.listen((event) {
        var radius = (Spherical.computeDistanceBetween(
            map.bounds?.southWest, map.bounds?.center));
        radius = (radius! * 0.6) / 1000;
        radius = radius.toInt();
        circle!.radius = (radius * 500);
        widget.changeDist(radius.toDouble());
        map.center = center;
      });

      Marker(MarkerOptions()
        ..position = map.center
        ..map = map);

      return elem;
    });
    return const HtmlElementView(viewType: htmlId);
  }
}
