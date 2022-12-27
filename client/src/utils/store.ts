import {
  configureStore,
  createSlice,
  getDefaultMiddleware,
  PayloadAction,
} from "@reduxjs/toolkit";

export interface StreamsState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
}

const initialState: StreamsState = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
};

export const streamsSlice = createSlice({
  name: "steams",
  initialState,
  reducers: {
    setLocalStream: (
      state: StreamsState,
      action: PayloadAction<MediaStream>
    ) => {
      console.log("action.payload", action.payload);
      state.localStream = action.payload;
    },
    setRemoteStream: (
      state: StreamsState,
      action: PayloadAction<MediaStream>
    ) => {
      state.remoteStream = action.payload;
    },
    setPeerConnection: (
      state: StreamsState,
      action: PayloadAction<RTCPeerConnection>
    ) => {
      state.peerConnection = action.payload;
    },
  },
});

export const { setLocalStream, setRemoteStream, setPeerConnection } =
  streamsSlice.actions;

export const store = configureStore({
  reducer: { stream: streamsSlice.reducer },
  middleware: getDefaultMiddleware({
    serializableCheck: false,
  }),
});

// export const selectLocalStream = () =>
//   useSelector((state: StreamsState) => state.localStream);

// export const selectRemoteStream = () =>
//   useSelector((state: StreamsState) => state.remoteStream);

// export const selectLocalPeerConnection = () =>
//   useSelector((state: StreamsState) => state.localPeerConnection);

// export const selectRemotePeerConnection = () =>
//   useSelector((state: StreamsState) => state.remotePeerConnection);
