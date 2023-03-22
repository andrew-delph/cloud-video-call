import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';

Widget connectingWidget = Scaffold(
    body: Center(
  child: LoadingAnimationWidget.staggeredDotsWave(
    color: Colors.blue,
    size: 200,
  ),
));

Widget loadingWidget = Scaffold(
    body: Center(
  child: LoadingAnimationWidget.staggeredDotsWave(
    color: Colors.green,
    size: 400,
  ),
));