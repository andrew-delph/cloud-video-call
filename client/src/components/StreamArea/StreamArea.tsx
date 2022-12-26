import { Grid } from "@mui/material";
import StreamHolder from "../StreamHolder/StreamHolder";

const isMobile = window.matchMedia(
  "(pointer: coarse) and (hover: none)"
).matches;

export const StreamArea = (props: {
  localStream: MediaStream | undefined;
  remoteStream: MediaStream | undefined;
}) => {
  const desktopStreamStyle = {
    width: "640px",
    height: "100%",
    display: "block",
    margin: "1em",
  };

  const desktopStreamArea = (
    <Grid container>
      <Grid item>
        {props.localStream && (
          <div>
            <h1>local</h1>
            <StreamHolder
              stream={props.localStream}
              muted={true}
              style={desktopStreamStyle}
            />
          </div>
        )}
      </Grid>
      <Grid item>
        {props.remoteStream && (
          <div>
            <h1>remote</h1>
            <StreamHolder
              stream={props.remoteStream}
              muted={false}
              style={desktopStreamStyle}
            />
          </div>
        )}
      </Grid>
    </Grid>
  );

  const mobileStreamStyleRemote = {
    width: "100%",
    height: "100%",
    display: "block",
  };

  const mobileStreamStyleLocal = {
    height: "30%",
    position: "absolute",
    bottom: "0px",
    right: "0",
  };

  const mobileStreamArea = (
    <div>
      {props.remoteStream && (
        <StreamHolder
          stream={props.remoteStream}
          muted={true}
          style={mobileStreamStyleRemote}
        />
      )}
      {props.localStream && (
        <StreamHolder
          stream={props.localStream}
          muted={true}
          style={mobileStreamStyleLocal}
        />
      )}
    </div>
  );

  return <div>{isMobile ? mobileStreamArea : desktopStreamArea}</div>;
};
