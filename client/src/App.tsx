import "./App.css";
import StreamHolder from "./components/StreamHolder/StreamHolder";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { createRoom, joinRoom } from "./utils/firebase_webrtc_utils";
import io, { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";

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

    socket.on("set_client_host", (value) => {
      console.log("I am the host of room:", value);
      const offer = uuid();
      console.log(`my offer: ${offer}`);
      socket.emit("client_host", {
        offer: offer,
      });
    });

    socket.on("set_client_guest", (value) => {
      console.log("I am the guest of room:", value);
    });

    socket.on("client_host", (value) => {
      console.log("host message:", value);
      if (value && value.answer) setRoomId(value.answer);
    });

    socket.on("client_guest", (value) => {
      console.log("guest message:", value);
      if (value && value.offer) setRoomId(value.offer);
      const answer = uuid();
      console.log(`my answer: ${answer}`);
      socket.emit("client_guest", {
        answer: answer,
      });
    });

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

  const createRoomButton = () => {
    if (!localStream || !remoteStream) {
      alert("stream is undefined");
      return;
    }
    createRoom(localStream, remoteStream).then((roomId) => {
      console.log("created room");
      setRoomId(roomId);
    });
  };

  const joinRoomButton = () => {
    if (!localStream || !remoteStream) {
      alert("stream is undefined");
      return;
    }
    if (!roomId) {
      alert("roomId is undefined");
      return;
    }

    joinRoom(roomId, localStream, remoteStream).then(() => {
      console.log("room joined");
    });
  };

  const readyButton = () => {
    socket.emit("ready");
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
          <Grid container>
            <button onClick={createRoomButton}>createRoom</button>{" "}
            <div>{roomId}</div>
          </Grid>
          <Grid container>
            <input
              onChange={(e) => {
                setRoomId(e.target.value);
              }}
            ></input>
            <button onClick={joinRoomButton}>join</button>
          </Grid>
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
