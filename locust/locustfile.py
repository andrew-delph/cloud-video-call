import time
from locust import task, User, events, TaskSet
import socketio
from threading import Timer


connected_rps = False

class RepeatTimer(Timer):
    def run(self):
        while not self.finished.wait(self.interval):
            self.function(*self.args, **self.kwargs)


class SocketIOTasks(TaskSet):

    connection_start = None

    manual_disconnect = False

    connected_rps_task = None

    def on_start(self):
        self.sio = socketio.Client(reconnection=False)
        self.sio.on("connect", self.on_connect)
        self.sio.on("connect_error", self.on_connect_error)
        # self.sio.on("message", self.on_message)
        self.sio.on("error", self.on_error)
        self.sio.on("disconnect", self.on_disconnect)
        self.manual_disconnect = False
        self.connect()

    
    def connected_rps_interval(self):
        events.request.fire(
            request_type="socketio",
            name="connected_rps",
            response_time=0,
            response_length=0,
            exception=None,
            context=None,
        )

    def on_stop(self, env=None):
        self.disconnect()

    def connect(self):
        self.connection_start = time.time()
        self.sio.connect(self.user.host, transports=["websocket"])

    def disconnect(self):
        # NOTE we can turn off the disconnect handle here to not report the disconnection
        self.manual_disconnect = True
        if self.sio.connected:
            self.sio.disconnect()

    def on_connect(self):
        events.request.fire(
            request_type="socketio",
            name="connection",
            response_time=time.time() - self.connection_start,
            response_length=0,
            exception=None,
            context=None,
        )
        if connected_rps:
            self.connected_rps_task = RepeatTimer(1, self.connected_rps_interval)
            self.connected_rps_task.start()


    def on_connect_error(self, data):
        events.request.fire(
            request_type="socketio",
            name="connection",
            response_time=time.time() - self.connection_start,
            response_length=0,
            exception="connection failed"+str(data),
            context=None,
        )
        self.interrupt()

    def on_disconnect(self):
        if connected_rps:
            self.connected_rps_task.cancel()
        if self.manual_disconnect == False:
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
        pass
        # print("got msg: " + data)
        # events.request.fire(
        #     request_type="socketio",
        #     name="message",
        #     response_time=1,
        #     response_length=0,
        #     context=None,
        #     exception=None,
        # )

    def on_error(self, data):
        events.request.fire(
            request_type="socketio",
            name="error",
            response_time=1,
            response_length=0,
            exception="error:"+str(data),
            context=None,
        )
        self.interrupt()

    @task
    def sleep(self):
        time.sleep(5)

    @task
    def ready(self):
        start_time = time.time()

        match_event = [False]

        def match_callback(match_event, start_time, data):
            match_event[0] = True
            events.request.fire(
                request_type="socketio",
                name="match",
                response_time=time.time() - start_time,
                response_length=0,
                exception=None,
                context=None,
            )
            return None

        self.sio.on("match", lambda data: match_callback(match_event, start_time, data))

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

        self.sio.emit("ready", "locust is ready", callback=lambda: ready_callback(ready_event, start_time))

        while match_event[0] == False:
            if time.time() - start_time > 300:
                break
            time.sleep(1)

        self.sio.on("match", lambda: None)

        if ready_event[0] == False:
            events.request.fire(
                request_type="socketio",
                name="ready",
                response_time=None,
                response_length=0,
                exception="never received ready ack",
                context=None,
            )

        if match_event[0] == False:
            events.request.fire(
                request_type="socketio",
                name="match",
                response_time=None,
                response_length=0,
                exception="match time limit exceeded",
                context=None,
            )

    @task
    def ping(self):
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
        self.sio.emit("myping", "I am a locust.", callback=lambda: ping_callback(ping_event, start_time))

        while ping_event[0] == False:
            if time.time() - start_time > 15:
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
