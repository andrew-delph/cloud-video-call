import 'package:flutter_app/state_machines.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:statemachine/statemachine.dart';

void main() {
  test('test state machines', () {
    Machine<SocketStates> socketMachine = getSocketMachine();
    Machine<ChatStates> chatMachine = getChatMachine();

    socketMachine[SocketStates.connected].addNested(chatMachine);

    expect(socketMachine.current?.identifier, equals(null));
    expect(chatMachine.current?.identifier, equals(null));

    socketMachine.current = SocketStates.connected;

    expect(socketMachine.current?.identifier, equals(SocketStates.connected));
    expect(chatMachine.current?.identifier, equals(ChatStates.waiting));

    socketMachine.current = SocketStates.connecting;

    print("socketMachine " + socketMachine.current.toString());
    print("chatMachine" + chatMachine.current.toString());
  });
}
