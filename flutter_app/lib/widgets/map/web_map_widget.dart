import 'dart:html';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps/google_maps.dart';
import 'package:google_maps/google_maps_geometry.dart';
import 'package:uuid/uuid.dart';

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
  String uuid = const Uuid().v4();

  // Circle? circle;

  WebMapState();

  @override
  void didUpdateWidget(WebMap oldWidget) {
    super.didUpdateWidget(oldWidget);

    print("!11111111111111111111111111111111111111 ${widget.dist}  ${uuid}");
    setState(() {
      dist = widget.dist;
    });
  }

  @override
  void initState() {
    super.initState();
    setState(() {
      uuid = const Uuid().v4();
      dist = widget.dist;
    });
    print("init state $dist $uuid");
  }

  void updateCircle(Circle circle, double dist) {
    print("updateCircle $dist");
    final center = LatLng(widget.posPair.first, widget.posPair.second);
    circle!.map!.center = center;
    circle!.center = center;
    circle!.radius = dist * 500;
    circle!.visible = widget.enableDist;
  }

  @override
  Widget build(BuildContext context) {
    print('');
    print('');
    print("11111rendered widget.dist ${this.dist} ${widget.dist} $uuid");

    final WebMapState current = this;

    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(mapId, (int viewId) {
      final elem = DivElement()
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

      print("2222rendered widget.dist ${this.dist} ${current.dist} $uuid");

      Circle circle = Circle(CircleLiteral()..map = map);

      if (dist > 0) {
        updateCircle(circle, dist);
      } else {
        updateCircle(circle, 10);
      }

      map.fitBounds(circle!.bounds);
      bool first_zoom = true;

      map.onZoomChanged.listen((event) {
        if (first_zoom) {
          print("first_zoom...");
          first_zoom = false;
          return;
        }
        print("onZoomChanged... 2");
        var radius = (Spherical.computeDistanceBetween(
            map.bounds?.southWest, map.bounds?.center));

        print("print $radius calc ${radius! * 0.6}");
        radius = (radius! * 1) / 1000;
        radius = radius.toInt();
        widget.changeDist(radius.toDouble());
        updateCircle(circle, radius.toDouble());
      });

      // map.onTilesloaded.listen((event) {
      //   if (widget.dist < 0) {
      //     print("dist was 0000000000000000000000000000000");
      //     var radius = (Spherical.computeDistanceBetween(
      //         map.bounds?.southWest, map.bounds?.center));
      //     radius = (radius! * 0.6) / 1000;
      //     radius = radius.toInt();
      //     circle!.radius = (radius * 500);
      //     map.center = center;
      //   }
      // });

      Marker(MarkerOptions()
        ..position = map.center
        ..map = map);

      return elem;
    });

    return const HtmlElementView(viewType: mapId);
  }
}
