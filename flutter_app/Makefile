windows:
	flutter build windows

chrome:
	flutter run -d chrome

chrome-prod:
	flutter run -d chrome

prod:
	flutter run --dart-define="SOCKET_ADDRESS=https://react-video-call-fjutjsrlaa-uc.a.run.app"

web-server:
	flutter run -d web-server --dart-define="SOCKET_ADDRESS=https://react-video-call-fjutjsrlaa-uc.a.run.app" --web-port=8080 --web-hostname=0.0.0.0


format:
	dart format .
	dart fix --apply
	flutter pub run import_sorter:main


analyze:
	flutter pub run dependency_validator
	dart analyze

dev:
	flutter run -d chrome --hot


