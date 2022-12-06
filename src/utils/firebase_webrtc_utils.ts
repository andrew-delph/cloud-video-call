import { db } from "../firebase";

export const createRoom = async (
  localStream: MediaStream,
  remoteStream: MediaStream
): Promise<string> => {
  console.log("db", db);
  const roomRef = await db.collection("rooms").doc();

  // const roomRef: any = {}; // get from db_utils.ts

  const configuration = undefined;

  console.log("Create PeerConnection with configuration: ", configuration);
  const peerConnection = new RTCPeerConnection();

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Code for collecting ICE candidates below
  const callerCandidatesCollection = roomRef.collection("callerCandidates");

  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) {
      console.log("Got final candidate!");
      return;
    }
    console.log("Got candidate: ", event.candidate);
    callerCandidatesCollection.add(event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log("Created offer:", offer);

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
    console.log("Got remote track:", event.streams[0]);
    event.streams[0].getTracks().forEach((track) => {
      console.log("Add a track to the remoteStream:", track);
      remoteStream.addTrack(track);
    });
  });

  // Listening for remote session description below
  roomRef.onSnapshot(async (snapshot: any) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data && data.answer) {
      console.log("Got remote description: ", data.answer);
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
        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
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

  const configuration = undefined;

  // const roomRef: any = {};
  const roomSnapshot = await roomRef.get();
  console.log("Got room:", roomSnapshot.exists);

  if (!roomSnapshot.exists) {
    alert("room doesnt exist");
    return;
  }

  const roomSnapshotData = roomSnapshot.data();

  if (!roomSnapshotData) {
    alert("roomSnapshotData is undefined");
    return;
  }

  console.log("Create PeerConnection with configuration: ", configuration);
  const peerConnection = new RTCPeerConnection(configuration);
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Code for collecting ICE candidates below
  const calleeCandidatesCollection = roomRef.collection("calleeCandidates");
  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) {
      console.log("Got final candidate!");
      return;
    }
    console.log("Got candidate: ", event.candidate);
    calleeCandidatesCollection.add(event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  peerConnection.addEventListener("track", (event) => {
    console.log("Got remote track:", event.streams[0]);
    event.streams[0].getTracks().forEach((track) => {
      console.log("Add a track to the remoteStream:", track);
      remoteStream.addTrack(track);
    });
  });

  // Code for creating SDP answer below
  const offer = roomSnapshotData.offer;
  console.log("Got offer:", offer);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  console.log("Created answer:", answer);
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
        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
  // Listening for remote ICE candidates above
};
