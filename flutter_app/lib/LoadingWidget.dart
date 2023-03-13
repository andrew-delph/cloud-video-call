import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:loading_animation_widget/loading_animation_widget.dart';

Widget loadingWidget = Scaffold(
    body: Center(
  child: LoadingAnimationWidget.staggeredDotsWave(
    color: Colors.blue,
    size: 200,
  ),
));
