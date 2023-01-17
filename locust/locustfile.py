import time
import json
from locust import task, User, events
import socketio

class SocketIOUser(User):

    def on_start(self):
        print("start.")
        self.connect()

    def on_stop(self, env=None):
        print("stop.")
        self.disconnect()

    @task
    def hello_world(self):
        print("test")
        time.sleep(0.5)
    
    def connect(self):
        self.sio = socketio.Client()
        self.sio.on('connect', self.on_connect)
        self.sio.on("message", self.on_message)
        self.sio.connect(self.host)

    def disconnect(self):
        self.sio.disconnect()

    def on_connect(self):
        events.request_success.fire(
            request_type='socketio',
            name='connect',
            response_time=1,
            response_length=0
        )

    def on_message(self, data):
        print("got msg: "+data)
        events.request_success.fire(
            request_type='socketio',
            name='message',
            response_time=1,
            response_length=0
        )
