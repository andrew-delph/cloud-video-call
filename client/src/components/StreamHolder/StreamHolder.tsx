import React, { createRef, useEffect } from "react";

function StreamHolder(props: {
  stream: MediaStream;
  muted: boolean;
  style: any;
}) {
  const stream: MediaStream = props.stream;

  const videoRef = createRef<HTMLVideoElement>();

  useEffect(() => {
    if (videoRef && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div>
      <video
        ref={videoRef}
        style={props.style}
        id="localVideo"
        muted={props.muted}
        autoPlay
        playsInline
      ></video>
    </div>
  );
}

export default StreamHolder;
