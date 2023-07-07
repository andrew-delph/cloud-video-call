// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart';

// Project imports:
import '../controllers/home_controller.dart';
import '../controllers/options_controller.dart';
import '../screens/home_screen.dart';

class MatchmakerProgress extends GetView<HomeController> {
  final min = -10.0;
  final max = 10.0;

  const MatchmakerProgress({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    PreferencesController preferencesController = Get.find();

    Widget child = Container(
      alignment: Alignment.topCenter,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text(
                  'Finding a match...',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Obx(() => Text(
                      "Progress: ${controller.matchmaker-eventProgess().toString()}",
                    )),
              ],
            ),
          ),
        ],
      ),
    );

    return SizedBox(
        width: 100,
        height: 100,
        child: Stack(
          children: [child, BottomButtonsOverlay()],
        ));

    // return child;

    // child = Column(
    //   children: [
    //     child,
    //     ElevatedButton(
    //         onPressed: () async {
    //           if (preferencesController.status.isLoading) {
    //             // This is not the best way to handle this case.
    //             infoSnackbar(
    //                 'Preferences Updating', 'Wait for preferences to update.');
    //           }

    //           if (preferencesController.unsavedChanges()) {
    //             await preferencesController.updateAttributes();
    //           }
    //           await controller.ready();
    //         },
    //         child: const Text("Start"))
    //   ],
    // );

    // double width = min;

    // child = Stack(
    //   clipBehavior: Clip.none,
    //   children: [
    //     child,
    //     Positioned(
    //       top: 20, // get the size of the row buttons..?
    //       right: 0,
    //       child: Container(
    //         alignment: Alignment.bottomRight,
    //         width: width,
    //         height: width * controller.localVideoRendererRatioHw(),
    //         child: localCamera(),
    //       ),
    //     )
    //   ],
    // );

    // return SizedBox(
    //     width: 100,
    //     height: 100,
    //     child: Stack(
    //       children: [child, BottomButtonsOverlay()],
    //     ));
  }

  Widget localCamera() {
    return Stack(children: [
      Container(
        color: Colors.black,
        child: RTCVideoView(controller.localVideoRenderer()),
      ),
    ]);
  }
}
