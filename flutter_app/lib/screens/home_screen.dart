import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter_app/services/auth_service.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:get/get.dart';

import '../controllers/home_controller.dart';
import '../routes/app_pages.dart';
import '../widgets/SwipeDetector.dart';

class HomeScreen extends GetView<HomeController> {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    Widget chatButton = Obx(() => controller.isInChat()
        ? Container()
        : Container(
            width: 100,
            color: Colors.white,
            child: TextButton(
              style: ButtonStyle(
                backgroundColor: MaterialStateProperty.all<Color>(
                    Colors.yellow.shade100), // Change the color here
              ),
              onPressed: () async {
                if (controller.isInReadyQueue() == false) {
                  controller.queueReady();
                } else {
                  controller.unReady();
                }
              },
              child: Text((controller.isInReadyQueue() == false)
                  ? 'Ready'
                  : 'Cancel Ready'),
            )));

    Widget videoRenderLayout = SwipeDetector(
        isDragUpdate: () {
          return controller.isInChat();
        },
        onHorizontalDragEnd: (double score) {
          controller.sendChatScore(score).then((value) {}).catchError((error) {
            Get.snackbar(
              "Error",
              error.toString(),
              snackPosition: SnackPosition.TOP,
              backgroundColor: Colors.red.withOpacity(.75),
              colorText: Colors.white,
              icon: const Icon(Icons.error, color: Colors.white),
              shouldIconPulse: true,
              barBlur: 20,
            );
          }).whenComplete(() {});
        },
        child: VideoRenderLayout());

    return Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: const Text("Home"),
          actions: <Widget>[
            IconButton(
              icon: const Icon(Icons.settings),
              tooltip: 'Options',
              onPressed: () {
                Get.toNamed(Routes.OPTIONS);
              },
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: 'Logout',
              onPressed: () async {
                Get.find<AuthService>().signOut();
              },
            ),
          ],
        ),
        body: controller.obx(
          (state) => Flex(
            direction: Axis.horizontal,
            children: [
              chatButton,
              Expanded(
                child: Stack(
                  children: [videoRenderLayout, const ButtonsOverlay()],
                ),
              ),
            ],
          ),
          onLoading: const CircularProgressIndicator(),
          onError: (error) => Column(
            children: [
              const Text("Connection Error."),
              Text('$error'),
              ElevatedButton(
                  onPressed: () {
                    controller.initSocket();
                  },
                  child: const Text("Reconnect."))
            ],
          ),
        ));
  }
}

class SettingsButton extends GetResponsiveView<HomeController> {
  SettingsButton({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<MediaDeviceInfo>(
      color: Colors.white,
      // initialValue: 'selectedMenu',
      // Callback that sets the selected popup menu item.
      itemBuilder: (BuildContext context) {
        return controller.getDeviceEntries();
      },
    );
  }
}

class VideoRenderLayout extends GetResponsiveView<HomeController> {
  VideoRenderLayout({super.key});

  @override
  Widget tablet() {
    return Obx(() => Stack(
          children: [
            Container(
              color: Colors.black,
              child: RTCVideoView(
                controller.remoteVideoRenderer(),
                // objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
              ),
            ),
            Positioned(
              bottom: 20, // get the size of the row buttons..?
              right: 0,
              child: Container(
                alignment: Alignment.bottomRight,
                width: Get.width / 2,
                height:
                    (Get.width / 2) * controller.localVideoRendererRatioHw(),
                child: RTCVideoView(
                  controller.localVideoRenderer(),
                ),
              ),
            ),
          ],
        ));
  }

  @override
  Widget desktop() {
    return Obx(() => Row(
          children: [
            Expanded(
              child: Container(
                color: Colors.black,
                child: RTCVideoView(controller.remoteVideoRenderer()),
              ),
            ),
            Expanded(
              child: Container(
                color: Colors.black,
                child: RTCVideoView(controller.localVideoRenderer()),
              ),
            ),
          ],
        ));
  }
}

class ButtonsOverlay extends GetView<HomeController> {
  const ButtonsOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() => Positioned(
          left: 0,
          right: 0,
          bottom: 20,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (controller.isInChat())
                IconButton(
                  tooltip: "End call",
                  icon: const Icon(Icons.call_end),
                  color: Colors.red,
                  onPressed: () async {
                    await controller.endChat();
                  },
                ),
              if (controller.localMediaStream() != null)
                IconButton(
                  tooltip: "Mute mic",
                  color: controller.isMicMute() ? Colors.red : Colors.white,
                  icon: controller.isMicMute()
                      ? const Icon(Icons.mic_off)
                      : const Icon(Icons.mic),
                  onPressed: () {
                    controller.isMicMute.toggle();
                  },
                ),
              if (controller.localMediaStream() != null)
                IconButton(
                  tooltip: "Camera off",
                  color: controller.isCamHide() ? Colors.red : Colors.white,
                  icon: controller.isCamHide()
                      ? const Icon(Icons.videocam_off)
                      : const Icon(Icons.videocam),
                  onPressed: () {
                    controller.isCamHide.toggle();
                  },
                ),
              SettingsButton(),
            ],
          ),
        ));
  }
}
