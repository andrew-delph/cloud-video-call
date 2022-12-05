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
      <p>test</p>
      {stream && <StreamHolder stream={stream} />}
      <Grid container spacing={2}>
        <Grid item xs={4}>
          xs=4
        </Grid>
        <Grid item xs={4}>
          xs=4
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
