// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../routes/app_pages.dart';
import '../services/auth_service.dart';

class NavItem {
  final Icon icon;
  final String route;
  final String header;

  NavItem({
    required this.icon,
    required this.route,
    required this.header,
  });
}

final List<NavItem> navList = [
  NavItem(icon: const Icon(Icons.home), route: Routes.HOME, header: "Home"),
  NavItem(
      icon: const Icon(Icons.history),
      route: Routes.HISTORY,
      header: "History"),
  NavItem(
      icon: const Icon(Icons.settings),
      route: Routes.OPTIONS,
      header: "Settings"),
];

class CustomNavigationDrawer extends StatelessWidget {
  final Widget body;
  final String title;

  const CustomNavigationDrawer(
      {super.key, required this.body, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text(title),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () async {
              Get.find<AuthService>().signOut();
            },
          ),
        ],
      ),
      body: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: navList.map((navItem) {
              return leftNavItem(navItem);
            }).toList(),
          ),
          const VerticalDivider(),
          Expanded(child: body)
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex:
            navList.indexWhere((navItem) => navItem.route == Get.currentRoute),
        onTap: (value) {
          String route = navList[value].route;
          Get.toNamed(route);
        },
        items: navList.map((navItem) {
          return bottomNavItem(navItem);
        }).toList(),
      ),
    );
  }

  Widget leftNavItem(NavItem navItem) {
    return Row(children: [
      IconButton(
        icon: navItem.icon,
        onPressed: () {
          Get.toNamed(navItem.route);
        },
        // tooltip: header,
        color: navItem.route == Get.currentRoute ? Colors.amber : null,
      ),
      Text(navItem.header)
    ]);
  }

  BottomNavigationBarItem bottomNavItem(NavItem navItem) {
    return BottomNavigationBarItem(icon: navItem.icon, label: navItem.header);
  }
}
