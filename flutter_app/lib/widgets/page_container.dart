import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';

class PageContainer extends StatelessWidget {
  final Widget child;

  const PageContainer({super.key, required this.child});
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
          // color: Colors.amber,
          height: double.infinity,
          child: SingleChildScrollView(child: child)),
    );
  }
}
