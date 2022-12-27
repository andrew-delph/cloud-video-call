import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import io, { Socket } from "socket.io-client";
import "./App.css";
import { StreamArea } from "./components/StreamArea/StreamArea";
import { createRoom, joinRoom } from "./utils/firebase_webrtc_utils";
import {
  setLocalStream,
  setPeerConnection,
  setRemoteStream,
} from "./utils/store";

const socket: Socket = io({});

function App() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [connected, setConnect] = useState<boolean>(false);

  const dispatch = useDispatch();

  const localStream = useSelector((state: any) => state.stream.localStream);
  const peerConnection = useSelector(
    (state: any) => state.stream.peerConnection
  );

  const auth = getAuth();
  signInAnonymously(auth)
    .then(() => {
      // Signed in..
      console.log("signed in");
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ...
    });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const uid = user.uid;
      console.log("uid", uid);
      // ...
    } else {
      // User is signed out
      // ...
    }
  });

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
      })
      .finally(() => {
        setLoaded(true);
      });
  };

  const readyButton = () => {
    if (peerConnection) {
      console.log("closing connection");
      peerConnection.close();
    }
    socket.off("set_client_host");
    socket.off("set_client_guest");

    socket.emit("ready");

    socket.on("set_client_host", (value) => {
      console.log("I am the host of room:", value);
      socket.off("client_host");
      socket.off("client_guest");

      const client_host_emit = (data: any) => {
        socket.emit("client_host", data);
      };

      if (!localStream) {
        alert("no local stream");
        return;
      }

      const createRoomResult = createRoom(
        localStream,
        dispatch(setRemoteStream(new MediaStream())).payload,
        client_host_emit
      );

      socket.on("client_host", createRoomResult.listener);
      dispatch(setPeerConnection(createRoomResult.peerConnection));
    });

    socket.on("set_client_guest", (value) => {
      console.log("I am the guest of room:", value);
      socket.off("client_host");
      socket.off("client_guest");

      const client_guest_emit = (data: any) => {
        socket.emit("client_guest", data);
      };

      if (!localStream) {
        alert("no local stream");
        return;
      }

      const joinRoomResult = joinRoom(
        localStream,
        dispatch(setRemoteStream(new MediaStream())).payload,
        client_guest_emit
      );

      socket.on("client_guest", joinRoomResult.listener);
      dispatch(setPeerConnection(joinRoomResult.peerConnection));
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
