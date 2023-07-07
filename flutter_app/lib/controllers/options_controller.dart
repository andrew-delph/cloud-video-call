// Package imports:

// Dart imports:
import 'dart:typed_data';

// Package imports:
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:get/get.dart';

// Project imports:
import 'package:flutter_app/utils/utils.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/cache_service.dart';
import '../services/options_service.dart';

class PreferencesController extends GetxController with StateMixin {
  final OptionsService optionsService;
  final AuthService authService = Get.find();
  final CacheService cacheService = Get.find();

  final RxMap<String, String> constantAttributes = <String, String>{}.obs;
  final RxMap<String, String> constantFilters = <String, String>{}.obs;
  final RxMap<String, String> customAttributes = <String, String>{}.obs;
  final RxMap<String, String> customFilters = <String, String>{}.obs;
  final RxDouble priority = (0.0).obs;
  final RxBool unsavedChanges = false.obs;

  Rx<String?> displayName = Rx(null);
  Rx<String?> description = Rx(null);

  Rx<UserDataModel> userData = UserDataModel().obs;

  PreferencesController(this.optionsService) {
    constantAttributes.listen((p0) {
      unsavedChanges(true);
    });
    constantFilters.listen((p0) {
      unsavedChanges(true);
    });
    customAttributes.listen((p0) {
      unsavedChanges(true);
    });
    customFilters.listen((p0) {
      unsavedChanges(true);
    });

    // var updateDebouncer = Debouncer(delay: 1.seconds);
    // unsavedChanges.listen((p0) {
    //   if (!status.isLoading) {
    //     updateDebouncer.call(() => updateAttributes());
    //   }
    // });
  }

  @override
  onInit() async {
    super.onInit();
    if (!authService.isAuthenticated()) {
      change(null, status: RxStatus.success());
      return;
    }

    getMyUserProfileDoc().get().then((get) {
      if (get.exists) {
        userData(get.data()!);
        description(get.data()!.description);
        displayName(get.data()!.displayName);
      }
      print("user data exists: ${get.exists}");
    });
    loadAttributes();
  }

  Future<void> loadAttributes() async {
    change(null, status: RxStatus.loading());
    return optionsService
        .getPreferences()
        .then((preferences) {
          constantAttributes.addAll(preferences.constantAttributes);
          constantFilters.addAll(preferences.constantFilters);
          customAttributes.addAll(preferences.customAttributes);
          customFilters.addAll(preferences.customFilters);
          priority(preferences.priority);
          unsavedChanges(false);
        })
        .then((value) => change(null, status: RxStatus.success()))
        .catchError((error) {
          change(null, status: RxStatus.error(error.toString()));
        });
  }

  Future<void> updateAttributes() {
    change(null, status: RxStatus.loading());
    final body = {
      'attributes': {
        'constant': constantAttributes,
        'custom': customAttributes
      },
      'filters': {
        'constant': constantFilters,
        'custom': customFilters,
      }
    };
    return optionsService
        .updatePreferences(body)
        .then((value) => loadAttributes())
        .catchError((error) {
      change(null, status: RxStatus.error(error.toString()));
      throw error;
    });
  }

  Future<void> updateProfilePicture(Uint8List? bytes) async {
    if (bytes == null) {
      FilePickerResult? result = await FilePicker.platform.pickFiles();
      bytes = result?.files.first.bytes;
    }

    if (bytes == null) {
      throw "bytes is null";
    }

    await deleteProfilePicture();

    // uncomment pica.min.js for index.html
    // print("before compression: ${bytes.length}");
    // bytes = await FlutterImageCompress.compressWithList(
    //   bytes,
    //   minWidth: 400,
    //   minHeight: 400,
    // );
    // print("after compression: ${bytes.length}");

    User currentUser = authService.getUser();

    var userId = currentUser.uid;

    var imageRef = (FirebaseStorage.instance.ref('profile-picture/$userId'));
    await imageRef.putData(bytes, SettableMetadata(contentType: "image/png"));

    int maxWaitCount = 20;
    for (int i = 0; i <= maxWaitCount; i++) {
      var imageRef =
          (FirebaseStorage.instance.ref('profile-picture/${userId}_100x100'));

      try {
        await imageRef.getMetadata();
        break;
      } catch (_) {}

      if (i == maxWaitCount) {
        errorSnackbar("Upload Failed.", "Failed to upload profile picutre.");
        return;
      } else {
        await Future.delayed(const Duration(milliseconds: 500));
      }
    }

    infoSnackbar("Profile Picture", "Updated.");
    unsavedChanges.refresh();
  }

  Future<void> deleteProfilePicture() async {
    User currentUser = authService.getUser();

    var userId = currentUser.uid;

    try {
      var imageRef =
          (FirebaseStorage.instance.ref('profile-picture/${userId}_100x100'));

      await imageRef.delete();
    } catch (_) {
      print("no profile picture to delete.");
    }
  }

  Future<UserDataModel> updateMyUserData() async {
    UserDataModel userData =
        UserDataModel(displayName: displayName(), description: description());
    await getMyUserProfileDoc().set(userData);
    return userData;
  }

  DocumentReference<UserDataModel> getMyUserProfileDoc() {
    String userId = authService.getUser().uid;

    CollectionReference<UserDataModel> myUserCollection = FirebaseFirestore
        .instance
        .collection('users')
        .withConverter<UserDataModel>(
          fromFirestore: (snapshots, _) =>
              UserDataModel.fromJson(snapshots.data()!),
          toFirestore: (userData, _) => userData.toJson(),
        );

    DocumentReference<UserDataModel> myUserDoc = myUserCollection.doc(userId);

    return myUserDoc;
  }
}
