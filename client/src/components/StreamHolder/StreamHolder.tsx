import React, { createRef, useEffect } from "react";

function StreamHolder(props: { title: string; stream: MediaStream }) {
  const stream: MediaStream = props.stream;
  const title: string = props.title;

  const videoRef = createRef<HTMLVideoElement>();

  useEffect(() => {
    if (videoRef && videoRef.current) videoRef.current.srcObject = stream;
  }, [videoRef.current]);

  return (
    <div>
      <h2>{props.title}</h2>
      <video
        ref={videoRef}
        style={{
          background: "black",
          width: "640px",
          height: "100%",
          display: "block",
          margin: "1em",
        }}
        id="localVideo"
        muted
        autoPlay
        playsInline
      ></video>
    </div>
  );
}

export default StreamHolder;
