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

  useEffect(() => {
    console.log("here1");

    socket.on("connect", () => {
      console.log("connect " + socket.id);
      socket.emit("ready");
    });

    socket.io.on("error", (error) => {
      console.log("error", error);
    });

    socket.on("disconnect", () => {
      console.log("disconnect");
    });

    socket.on("message", (value) => {
      console.log("message", value);
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
      });
  };

  const createRoomButton = () => {
    if (!localStream || !remoteStream) alert("stream is undefined");
    createRoom(
      localStream || new MediaStream(),
      remoteStream || new MediaStream()
    ).then((roomId) => {
      console.log("created room");
      setRoomId(roomId);
    });
  };

  const joinRoomButton = () => {
    if (!localStream || !remoteStream) alert("stream is undefined");
    if (!roomId) alert("roomId is undefined");

    joinRoom(
      roomId || "test",
      localStream || new MediaStream(),
      remoteStream || new MediaStream()
    ).then(() => {
      console.log("room joined");
    });
  };

  return (
    <div>
      <button onClick={startButton}>Load</button>
      {localStream && (
        <div>
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
