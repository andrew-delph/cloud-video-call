// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../controllers/options_controller.dart';

class ProfilePicture extends GetView<PreferencesController> {
  const ProfilePicture({super.key});

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      String? profilePhoto = controller.authService.user()?.photoURL;

      return Row(
        children: [
          TextButton(
            onPressed: () async {
              await controller.updateProfilePicture();
            },
            child: const Text('Upload profile'),
          ),
          SizedBox(
            height: 100,
            width: 100,
            child: profilePhoto != null
                ? Image(
                    image: NetworkImage(
                    profilePhoto,
                  ))
                : const Text("No profile Picture"),
          ),
        ],
      );
    });
  }
}
