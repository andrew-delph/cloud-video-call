import {
  configureStore,
  createSlice,
  getDefaultMiddleware,
  PayloadAction,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export interface StreamsState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localPeerConnection: RTCPeerConnection | null;
  remotePeerConnection: RTCPeerConnection | null;
}

const initialState: StreamsState = {
  localStream: null,
  remoteStream: null,
  localPeerConnection: null,
  remotePeerConnection: null,
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
  },
});

export const { setLocalStream, setRemoteStream } = streamsSlice.actions;

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
