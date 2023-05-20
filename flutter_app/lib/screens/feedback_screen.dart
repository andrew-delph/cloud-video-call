import 'package:flutter/material.dart';

import '../services/app_service.dart';
import '../widgets/feedback_swipe_detector.dart';

class FeedbackScreen extends StatelessWidget {
  final String label;
  final int min = 0;
  final int max = 10;
  final int initialValue = 5;

  const FeedbackScreen({
    super.key,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Text("FeedbackScreen");
  }
}

// class FeedbackScreenState extends State<FeedbackScreen> {
//   late int _value;

//   @override
//   void initState() {
//     super.initState();
//     _value = widget.initialValue;
//   }

//   Future<void> sendScore(score) {
//     // return widget.appProvider
//     //     .sendChatScore(score)
//     //     .then((value) {})
//     //     .catchError((error) {
//     //   SnackBar snackBar = SnackBar(
//     //     content: Text(error.toString()),
//     //   );

//       ScaffoldMessenger.of(context).showSnackBar(snackBar);
//     }).whenComplete(() {});
//   }

//   @override
//   Widget build(BuildContext context) {
//     Widget page = Container(
//         width: double.infinity,
//         height: double.infinity,
//         color: Colors.blue,
//         child: Column(
//           children: [
//             Text(widget.label),
//             Slider(
//               value: _value.toDouble(),
//               min: widget.min.toDouble(),
//               max: widget.max.toDouble(),
//               onChanged: (newValue) {
//                 setState(() {
//                   _value = newValue.round();
//                 });
//               },
//             ),
//             ElevatedButton(
//               onPressed: () {
//                 sendScore(_value.toDouble());
//               },
//               child: const Text('Submit'),
//             ),
//           ],
//         ));

//     page = SwipeDetector(
//         onHorizontalDragEnd: (double score) {
//           sendScore(score);
//         },
//         child: page);

//     return page;
//   }
// }
