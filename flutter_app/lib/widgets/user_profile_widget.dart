// Dart imports:
import 'dart:typed_data';

// Flutter imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

// Package imports:
import 'package:firebase_auth/firebase_auth.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/widgets/profile_picture.dart';
import 'package:flutter_app/widgets/webcam_photo_dialog.dart';
import '../controllers/options_controller.dart';
import '../services/auth_service.dart';

class UserProfileWidget extends GetView<PreferencesController> {
  const UserProfileWidget({super.key});

  @override
  Widget build(BuildContext context) {
    AuthService authService = Get.find();

    return Obx(() {
      User? user = authService.user();

      final TextEditingController displayNameController =
          TextEditingController(text: controller.userData().displayName);
      final TextEditingController descriptionController =
          TextEditingController(text: controller.userData().description);

      if (user == null) return const Text("Failed to load user.");

      return Column(
        children: [
          Column(children: [
            if (user.isAnonymous)
              const Row(
                children: [Text("This user is Anonymous.")],
              ),
            TextField(
              controller: displayNameController,
              onChanged: (value) => controller.displayName(value),
              readOnly: !controller.unsavedChanges(),
              decoration: const InputDecoration(
                labelText: 'Display Name',
                hintText: 'Enter name',
              ),
            ),
            TextField(
              controller: descriptionController,
              onChanged: (value) => controller.description(value),
              readOnly: !controller.unsavedChanges(),
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Enter description',
              ),
            ),
            IconButton(
                onPressed: () async {
                  if (controller.unsavedChanges()) {
                    controller.userData(await controller.updateMyUserData());
                  }
                  controller.unsavedChanges.toggle();
                },
                icon:
                    Icon(controller.unsavedChanges() ? Icons.save : Icons.edit))
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
