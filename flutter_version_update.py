import yaml
import re
import os

files = os.listdir(os.curdir)
print(files)

file_name = 'flutter_app/pubspec.yaml'
with open(file_name, 'r') as file:
    pubspec = yaml.safe_load(file)

version = pubspec['version']

print("the current version is: " +version)

pattern = re.compile(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)$")
match = pattern.match(version)


major = int(match.group("major"))
minor = int(match.group("minor"))
patch = int(match.group("patch")) + 1

new_version = "{major}.{minor}.{patch}".format(major = major, minor= minor, patch= patch)

print("new_version: "+new_version)

pubspec['version'] = new_version

print(pubspec)


with open(file_name, 'w') as f:
    yaml.dump(pubspec, f)