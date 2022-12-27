import { Grid } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setLocalStream } from "../../utils/store";
import StreamHolder from "../StreamHolder/StreamHolder";

const isMobile = window.matchMedia(
  "(pointer: coarse) and (hover: none)"
).matches;

export const StreamArea = () => {
  const desktopStreamStyle = {
    width: "640px",
    height: "100%",
    display: "block",
    margin: "1em",
  };

  const localStream = useSelector((state: any) => state.stream.localStream);
  const remoteStream = useSelector((state: any) => state.stream.remoteStream);

  const desktopStreamArea = (
    <Grid container>
      <Grid item>
        {localStream && (
          <div>
            <h1>local</h1>
            <StreamHolder
              stream={localStream}
              muted={true}
              style={desktopStreamStyle}
            />
          </div>
        )}
      </Grid>
      <Grid item>
        {remoteStream && (
          <div>
            <h1>remote</h1>
            <StreamHolder
              stream={remoteStream}
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
      {remoteStream && (
        <StreamHolder
          stream={remoteStream}
          muted={true}
          style={mobileStreamStyleRemote}
        />
      )}
      {localStream && (
        <StreamHolder
          stream={localStream}
          muted={true}
          style={mobileStreamStyleLocal}
        />
      )}
    </div>
  );

  return <div>{isMobile ? mobileStreamArea : desktopStreamArea}</div>;
};
