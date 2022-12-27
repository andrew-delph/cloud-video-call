import "./App.css";
import { useEffect, useState } from "react";
import { createRoom, joinRoom } from "./utils/firebase_webrtc_utils";
import io, { Socket } from "socket.io-client";
import { StreamArea } from "./components/StreamArea/StreamArea";
import { useDispatch, useSelector } from "react-redux";
import { setLocalStream, setRemoteStream, streamsSlice } from "./utils/store";

const socket: Socket = io({});

function App() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [connected, setConnect] = useState<boolean>(false);

  const dispatch = useDispatch();

  const localStream = useSelector((state: any) => state.stream.localStream);
  const remoteStream = useSelector((state: any) => state.stream.remoteStream);

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

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const startButton = () => {
    return navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        dispatch(setLocalStream(stream));
        dispatch(setRemoteStream(new MediaStream()));
      })
      .finally(() => {
        setLoaded(true);
      });
  };

  const readyButton = () => {
    startButton().then(() => {
      socket.emit("ready");
    });

    socket.on("set_client_host", (value) => {
      console.log("I am the host of room:", value);
      socket.off("client_host");
      socket.off("client_guest");

      const client_host_emit = (data: any) => {
        socket.emit("client_host", data);
      };

      if (!localStream || remoteStream) return;

      const client_host_listener = createRoom(
        localStream,
        remoteStream,
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

      if (!localStream || remoteStream) return;

      const client_guest_listener = joinRoom(
        localStream,
        remoteStream,
        client_guest_emit
      );

      socket.on("client_guest", client_guest_listener);
    });
  };

  return (
    <div>
      {!loaded && <button onClick={startButton}>Load</button>}
      {loaded && (
        <div>
          {connected && <button onClick={readyButton}>Ready</button>}
          {!connected && (
            <h1 style={{ color: "red" }}>NOT CONNECTED TO SOCKETIO</h1>
          )}

          <StreamArea></StreamArea>
        </div>
      )}
    </div>
  );
}

export default App;
