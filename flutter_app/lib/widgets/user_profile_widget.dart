import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_app/widgets/profile_picture.dart';
import 'package:flutter_app/widgets/webcam_photo_dialog.dart';
import 'package:get/get.dart';

import '../controllers/options_controller.dart';
import '../services/auth_service.dart';

class UserProfileWidget extends GetView<PreferencesController> {
  const UserProfileWidget({super.key});

  @override
  Widget build(BuildContext context) {
    AuthService authService = Get.find();

    return Obx(() {
      User? user = authService.user();

      if (user == null) return const Text("Failed to load user.");

      String? displayName = user.displayName;
      String? email = user.email;

      return Column(
        children: [
          user.isAnonymous
              ? const Row(
                  children: [Text("This user is Anonymous.")],
                )
              : Column(children: [
                  Row(
                    children: [
                      const Text("Display Name: "),
                      Text(displayName ?? "No display name")
                    ],
                  ),
                  Row(
                    children: [
                      const Text("Email: "),
                      Text(email ?? "No email")
                    ],
                  ),
                ]),
          Row(
            children: [
              const Text("Priority: "),
              Text("${controller.priority()}")
            ],
          ),
          TextButton(
            onPressed: () async {
              await controller.updateProfilePicture(null);
            },
            child: const Text('Upload profile'),
          ),
          TextButton(
            onPressed: () async {
              Uint8List? bytes = await Get.dialog(const WebcamPhotoDialog());

              if (bytes == null) {
                Get.snackbar(
                  "Profile Picture",
                  "Failed to take photo.",
                  snackPosition: SnackPosition.TOP,
                  backgroundColor: Colors.red.withOpacity(.75),
                  colorText: Colors.white,
                  icon: const Icon(Icons.error, color: Colors.white),
                  shouldIconPulse: true,
                  barBlur: 20,
                );
                return;
              }
              Get.snackbar("Profile Picture", "Uploading Photo");
              await controller.updateProfilePicture(bytes);
            },
            child: const Text('Take picture'),
          ),
          ProfilePicture(user.uid)
        ],
      );
    });
  }
}
