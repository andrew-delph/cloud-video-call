import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';

Widget connectingWidget = Center(
  child: LoadingAnimationWidget.staggeredDotsWave(
    color: Colors.blue,
    size: 400,
  ),
);

Widget loadingWidget = Center(
  child: LoadingAnimationWidget.staggeredDotsWave(
    color: Colors.green,
    size: 400,
  ),
);

Widget errorWidget = Center(
  child: LoadingAnimationWidget.staggeredDotsWave(
    color: Colors.red,
    size: 400,
  ),
);
