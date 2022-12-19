import "./App.css";
import StreamHolder from "./components/StreamHolder/StreamHolder";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { createRoom, joinRoom } from "./utils/firebase_webrtc_utils";
import io, { Socket } from "socket.io-client";

const socket: Socket = io("ws://localhost:4000", {
  transports: ["websocket"],
});

function App() {
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const [roomId, setRoomId] = useState<string>();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [connected, setConnect] = useState<boolean>(false);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connect " + socket.id);
      setConnect(true);
    });

    socket.io.on("error", (error) => {
      console.log("error", error);
      setConnect(false);
    });

    socket.on("disconnect", () => {
      console.log("disconnect");
      setConnect(false);
    });

    socket.on("message", (value) => {
      console.log("message:", value);
    });

    startButton();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const startButton = () => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        setLocalStream(stream);
        setRemoteStream(new MediaStream());
      })
      .finally(() => {
        setLoaded(true);
      });
  };

  const readyButton = () => {
    socket.emit("ready");

    socket.on("set_client_host", (value) => {
      console.log("I am the host of room:", value);
      socket.off("client_host");
      socket.off("client_guest");

      const client_host_emit = (data: any) => {
        socket.emit("client_host", data);
      };

      const client_host_listener = createRoom(
        localStream || new MediaStream(),
        remoteStream || new MediaStream(),
        client_host_emit
      );

      socket.on("client_host", client_host_listener);
    });

    socket.on("set_client_guest", (value) => {
      console.log("I am the guest of room:", value);
      socket.off("client_host");
      socket.off("client_guest");

      const client_guest_emit = (data: any) => {
        socket.emit("client_guest", data);
      };

      const client_guest_listener = joinRoom(
        localStream || new MediaStream(),
        remoteStream || new MediaStream(),
        client_guest_emit
      );

      socket.on("client_guest", client_guest_listener);
    });
  };

  return (
    <div>
      <button onClick={startButton}>Load</button>
      {loaded && (
        <div>
          {connected && <button onClick={readyButton}>Ready</button>}
          {!localStream && <h1 style={{ color: "red" }}>localStream ERROR</h1>}
          {!remoteStream && (
            <h1 style={{ color: "red" }}>remoteStream ERROR</h1>
          )}
          {!connected && (
            <h1 style={{ color: "red" }}>NOT CONNECTED TO SOCKETIO</h1>
          )}

          <Grid container>
            <Grid item>
              {localStream && (
                <StreamHolder title={"Local"} stream={localStream} />
              )}
            </Grid>
            <Grid item>
              {remoteStream && (
                <StreamHolder title={"Remote"} stream={remoteStream} />
              )}
            </Grid>
          </Grid>
        </div>
      )}
    </div>
  );
}

export default App;
