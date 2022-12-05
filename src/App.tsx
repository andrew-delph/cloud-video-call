import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import StreamHolder from "./components/StreamHolder/StreamHolder";
import { Grid } from "@mui/material";

function App() {
  const [stream, setStream] = useState<MediaStream>();

  if (!stream)
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        console.log("the stream", stream);
        setStream(stream);
      });

  return (
    <div>
      <Grid container>
        <Grid item>
          {stream && <StreamHolder title={"Local"} stream={stream} />}
        </Grid>
        <Grid item>
          {stream && <StreamHolder title={"Remote"} stream={stream} />}
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
