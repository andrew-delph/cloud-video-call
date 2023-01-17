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
        self.connect()

    def on_stop(self, env=None):
        print("stop.")
        self.disconnect()

    def connect(self):
        self.connection_start = time.time()
        self.sio.connect(self.user.host, transports=["websocket"])

    def disconnect(self):
        self.sio.disconnect()
        self.interrupt(False)
        print("disconnected.")

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
        print("connect_error: " + data)
        events.request.fire(
            request_type="socketio",
            name="connection",
            response_time=time.time() - self.connection_start,
            response_length=0,
            exception="connection failed",
            context=None,
        )
        self.interrupt(False)

    def on_message(self, data):
        print("got msg: " + data)
        events.request.fire(
            request_type="socketio",
            name="message",
            response_time=1,
            response_length=0,
            context=None,
            exception=None,
        )

    def on_error(self, data):
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
        print("sleeping")
        time.sleep(5)

    @task
    def ready(self):
        print("ready")
        time.sleep(5)


class SocketIOUser(User):
    tasks = [SocketIOTasks]
