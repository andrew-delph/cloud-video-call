import time
import json
from locust import task, User, events, TaskSet
import socketio


class SocketIOTasks(TaskSet):

    connection_start = None

    def on_start(self):
        print("start.")
        self.sio = socketio.Client(reconnection=False)
        self.sio.on("connect", self.on_connect)
        self.sio.on("connect_error", self.on_connect_error)
        self.sio.on("message", self.on_message)
        self.sio.on("error", self.on_error)
        self.sio.on("disconnect", self.on_disconnect)
        self.connect()

    def on_stop(self, env=None):
        print("stop.")
        self.disconnect()

    def connect(self):
        self.connection_start = time.time()
        self.sio.connect(self.user.host, transports=["websocket"])

    def disconnect(self):
        print("disconnect.")
        # NOTE we can turn off the disconnect handle here to not report the disconnection
        if self.sio.connected:
            self.sio.disconnect()

    def on_connect(self):
        print("on_connect")
        events.request.fire(
            request_type="socketio",
            name="connection",
            response_time=time.time() - self.connection_start,
            response_length=0,
            exception=None,
            context=None,
        )

    def on_connect_error(self, data):
        print("on_connect_error: " + data)
        events.request.fire(
            request_type="socketio",
            name="connection",
            response_time=time.time() - self.connection_start,
            response_length=0,
            exception="connection failed",
            context=None,
        )
        self.interrupt()

    def on_disconnect(self):
        print("on_disconnect.")
        events.request.fire(
            request_type="socketio",
            name="on_disconnect",
            response_time=time.time() - self.connection_start,
            response_length=0,
            exception="on_disconnect",
            context=None,
        )
        self.interrupt()

    def on_message(self, data):
        print("got msg: " + data)
        # events.request.fire(
        #     request_type="socketio",
        #     name="message",
        #     response_time=1,
        #     response_length=0,
        #     context=None,
        #     exception=None,
        # )

    def on_error(self, data):
        print("on_error")
        events.request.fire(
            request_type="socketio",
            name="error",
            response_time=1,
            response_length=0,
            exception="error",
            context=None,
        )
        self.interrupt()

    @task
    def sleep(self):
        # print("sleep")
        time.sleep(1)

    @task
    def ready(self):
        print("ready")
        start_time = time.time()

        ready_event = [False]

        def ready_callback(ready_event, start_time):
            ready_event[0] = True
            events.request.fire(
                request_type="socketio",
                name="ready",
                response_time=time.time() - start_time,
                response_length=0,
                exception=None,
                context=None,
            )

        self.sio.on("set_client_guest", lambda: ready_callback(ready_event, start_time))
        self.sio.on("set_client_host", lambda: ready_callback(ready_event, start_time))

        self.sio.emit("ready")

        while ready_event[0] == False:
            if time.time() - start_time > 15:
                print("Ready Time limit exceeded")
                break
            time.sleep(1)

        self.sio.on("set_client_guest", lambda: None)
        self.sio.on("set_client_host", lambda: None)

        if ready_event[0] == False:
            events.request.fire(
                request_type="socketio",
                name="ready",
                response_time=None,
                response_length=0,
                exception="not ready event received",
                context=None,
            )

    @task
    def ping(self):
        print("ping")
        ping_event = [False]

        def ping_callback(ping_event, start_time):
            ping_event[0] = True
            events.request.fire(
                request_type="socketio",
                name="ping",
                response_time=time.time() - start_time,
                response_length=0,
                exception=None,
                context=None,
            )

        start_time = time.time()
        self.sio.emit("myping", callback=lambda: ping_callback(ping_event, start_time))

        while ping_event[0] == False:
            if time.time() - start_time > 15:
                print("Ping Time limit exceeded")
                break
            time.sleep(1)

        if ping_event[0] == False:
            events.request.fire(
                request_type="socketio",
                name="ping",
                response_time=None,
                response_length=0,
                exception="not ping event received",
                context=None,
            )


class SocketIOUser(User):
    tasks = [SocketIOTasks]
