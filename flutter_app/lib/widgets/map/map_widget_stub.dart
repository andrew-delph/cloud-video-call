import '../../utils.dart';
import 'map_widget.dart';

//the error is shown in case of wrong version loaded on wrong platform
MapWidget getMapWidget(Pair<double, double> posPair, double dist,
        bool enableDist, Function(double dist) changeDist) =>
    throw UnsupportedError(
        'Cannot create a map without dart:html or google_maps_flutter');