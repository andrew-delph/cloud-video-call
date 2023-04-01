import 'dart:html';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps/google_maps.dart';

import '../../utils.dart';
import 'map_widget.dart';

MapWidget getMapWidget(Pair<double, double> posPair) =>
    WebMap(posPair: posPair);

class WebMap extends StatefulWidget implements MapWidget {
  final Pair<double, double> posPair;

  WebMap({Key? key, required this.posPair}) : super(key: key);

  @override
  State<WebMap> createState() => WebMapState();
}

class WebMapState extends State<WebMap> {
  @override
  Widget build(BuildContext context) {
    const String htmlId = "map";

    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(htmlId, (int viewId) {
      final mapOptions = MapOptions()
        ..zoom = 15.0
        ..center = LatLng(widget.posPair.first, widget.posPair.second);

      final elem = DivElement()..id = htmlId;
      final map = GMap(elem, mapOptions);

      map.onCenterChanged.listen((event) {});
      map.onDragstart.listen((event) {});
      map.onDragend.listen((event) {});

      Marker(MarkerOptions()
        ..position = map.center
        ..map = map);

      return elem;
    });
    return HtmlElementView(viewType: htmlId);
  }
}
