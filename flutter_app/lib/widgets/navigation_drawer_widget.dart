// Flutter imports:
import 'package:flutter/material.dart';

// Package imports:
import 'package:get/get.dart';

// Project imports:
import '../routes/app_pages.dart';
import '../services/auth_service.dart';

class NavItem {
  final IconData iconData;
  final String route;
  final String header;

  NavItem({
    required this.iconData,
    required this.route,
    required this.header,
  });
}

final List<NavItem> navList = [
  NavItem(iconData: Icons.home, route: Routes.HOME, header: "Home"),
  NavItem(iconData: Icons.history, route: Routes.HISTORY, header: "History"),
  NavItem(iconData: Icons.settings, route: Routes.OPTIONS, header: "Settings"),
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
    return LeftNavWidget(navItem: navItem);
  }

  BottomNavigationBarItem bottomNavItem(NavItem navItem) {
    return BottomNavigationBarItem(
        icon: Icon(navItem.iconData), label: navItem.header);
  }
}

class LeftNavWidget extends StatelessWidget {
  final NavItem navItem;

  const LeftNavWidget({super.key, required this.navItem});

  @override
  Widget build(BuildContext context) {
    return InkWell(
        onTap: () {
          Get.toNamed(navItem.route);
        },
        hoverColor: Colors.lightBlue,
        child: Padding(
            padding: const EdgeInsets.only(left: 16.0, right: 16.0),
            child: Row(children: [
              Icon(navItem.iconData),
              Padding(
                  padding: const EdgeInsets.only(left: 16.0, right: 16.0),
                  child: Text(navItem.header))
            ])));
  }
}
