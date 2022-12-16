import { db } from "../firebase";

const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const createRoom = async (
  localStream: MediaStream,
  remoteStream: MediaStream
): Promise<string> => {
  const roomRef = await db.collection("rooms").doc();

  // const roomRef: any = {}; // get from db_utils.ts

  const peerConnection = new RTCPeerConnection();
  peerConnection.onconnectionstatechange = (ev) => {
    console.log("connection state change:", peerConnection.connectionState);
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Code for collecting ICE candidates below
  const callerCandidatesCollection = roomRef.collection("callerCandidates");

  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) {
      return;
    }
    callerCandidatesCollection.add(event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  const roomWithOffer = {
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  await roomRef.set(roomWithOffer);
  const roomId: string = roomRef.id;

  // Code for creating a room above

  peerConnection.addEventListener("track", (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  });

  // Listening for remote session description below
  roomRef.onSnapshot(async (snapshot: any) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data && data.answer) {
      const rtcSessionDescription = new RTCSessionDescription(data.answer);
      await peerConnection.setRemoteDescription(rtcSessionDescription);
    }
  });
  // Listening for remote session description above

  // Listen for remote ICE candidates below
  roomRef.collection("calleeCandidates").onSnapshot((snapshot: any) => {
    snapshot.docChanges().forEach(async (change: any) => {
      if (change.type === "added") {
        let data = change.doc.data();
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  return roomId;
};

export const joinRoom = async (
  roomId: String,
  localStream: MediaStream,
  remoteStream: MediaStream
): Promise<void> => {
  // const db = firebase.firestore();
  const roomRef = db.collection("rooms").doc(`${roomId}`);

  // const roomRef: any = {};
  const roomSnapshot = await roomRef.get();

  if (!roomSnapshot.exists) {
    alert("room doesnt exist");
    return;
  }

  const roomSnapshotData = roomSnapshot.data();

  if (!roomSnapshotData) {
    alert("roomSnapshotData is undefined");
    return;
  }

  const peerConnection = new RTCPeerConnection(configuration);
  peerConnection.onconnectionstatechange = (ev) => {
    console.log("connection state change:", peerConnection.connectionState);
  };

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Code for collecting ICE candidates below
  const calleeCandidatesCollection = roomRef.collection("calleeCandidates");
  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) {
      return;
    }
    calleeCandidatesCollection.add(event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  peerConnection.addEventListener("track", (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  });

  // Code for creating SDP answer below
  const offer = roomSnapshotData.offer;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  const roomWithAnswer = {
    answer: {
      type: answer.type,
      sdp: answer.sdp,
    },
  };
  await roomRef.update(roomWithAnswer);
  // Code for creating SDP answer above

  // Listening for remote ICE candidates below
  roomRef.collection("callerCandidates").onSnapshot((snapshot: any) => {
    snapshot.docChanges().forEach(async (change: any) => {
      if (change.type === "added") {
        let data = change.doc.data();
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
  // Listening for remote ICE candidates above
};
