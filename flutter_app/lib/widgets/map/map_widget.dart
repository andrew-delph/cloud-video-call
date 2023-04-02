import 'package:flutter/material.dart';

import '../../utils.dart';
import 'map_widget_stub.dart'
    if (dart.library.html) 'web_map_widget.dart'
    if (dart.library.io) 'mobile_map_widget.dart';

abstract class MapWidget extends StatefulWidget {
  factory MapWidget(Pair<double, double> posPair, double dist, bool enableDist,
          Function(double dist) changeDist) =>
      getMapWidget(posPair, dist, enableDist, changeDist);
}
