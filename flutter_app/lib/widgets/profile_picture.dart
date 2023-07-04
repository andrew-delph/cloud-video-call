// Dart imports:
import 'dart:developer';
import 'dart:typed_data';

// Flutter imports:
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

// Package imports:
import 'package:firebase_storage/firebase_storage.dart';
import 'package:get/get.dart';

// Project imports:
import '../controllers/options_controller.dart';

class ProfilePicture extends GetView<PreferencesController> {
  ProfilePicture(this.userId, {super.key});

  final String userId;
  final RxString photoUrl = "".obs;

  final Rx<Uint8List?> bytes = Rx<Uint8List?>(null);

  @override
  Widget build(BuildContext context) {
    var imageRef =
        (FirebaseStorage.instance.ref('profile-picture/${userId}_100x100'));

    imageRef
        .getDownloadURL()
        .then((value) => photoUrl(value))
        .catchError((err) {
      print("no profile photo: $err");
    });

    return Obx(() {
      return Row(
        children: [
          SizedBox(
            height: 100,
            width: 100,
            child: photoUrl().isEmpty
                ? const Icon(Icons.no_photography_sharp)
                : CachedNetworkImage(
                    imageUrl: photoUrl(),
                    placeholder: (context, url) =>
                        const CircularProgressIndicator(),
                    errorWidget: (context, url, error) {
                      return const Icon(Icons.no_photography_sharp);
                    },
                  ),
          )
        ],
      );
    });
  }
}
