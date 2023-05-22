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
	flutter pub run import_sorter:main
	dart format .
	dart fix --apply

analyze:
	flutter pub run dependency_validator
	dart analyze


