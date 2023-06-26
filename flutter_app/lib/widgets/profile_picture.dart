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
    String profilePhoto = controller.authService.getUser().photoURL ??
        "https://www.pngarts.com/files/10/Default-Profile-Picture-PNG-Free-Download.png";

    print("photo: ${profilePhoto}");

    return Row(
      children: [
        TextButton(
          onPressed: () async {
            await controller.updateProfilePicture();
          },
          child: const Text('Upload profile'),
        ),
        Image.network(
          profilePhoto,
          width: 200,
          height: 200,
        ),
      ],
    );
  }
}
