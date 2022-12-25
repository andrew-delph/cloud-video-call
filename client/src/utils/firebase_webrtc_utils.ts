const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
    {
      urls: ["turn:relay.metered.ca:80"],
      username: 'db5611baf2f55446ccb6a207',
      credential: '95Cmq0CBYp6WiHDA',
    },
  ],
  iceCandidatePoolSize: 10,
};

export const createRoom = (
  localStream: MediaStream,
  remoteStream: MediaStream,
  socket_emit: (data: any) => void
): ((data: any) => void) => {
  const peerConnection = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // collect and send icecandidates
  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) {
      return;
    }
    socket_emit({ icecandidate: event.candidate.toJSON() });
  });

  // create and send the offer
  peerConnection.createOffer().then((offer) => {
    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    };
    socket_emit(roomWithOffer);
    peerConnection.setLocalDescription(offer);
  });

  // Code for creating a room above

  peerConnection.addEventListener("track", (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  });

  return (data: any) => {
    // Listening for answer
    if (data && data.answer) {
      const rtcSessionDescription = new RTCSessionDescription(data.answer);
      peerConnection.setRemoteDescription(rtcSessionDescription);
    }

    // Listen for remote ICE candidates below
    if (data && data.icecandidate) {
      peerConnection.addIceCandidate(new RTCIceCandidate(data.icecandidate));
    }
  };
};

export const joinRoom = (
  localStream: MediaStream,
  remoteStream: MediaStream,
  socket_emit: (data: any) => void
): ((data: any) => void) => {
  const peerConnection = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Code for collecting ICE candidates below
  peerConnection.addEventListener("icecandidate", (event) => {
    if (!event.candidate) {
      return;
    }

    socket_emit({ icecandidate: event.candidate.toJSON() });
  });
  // Code for collecting ICE candidates above

  peerConnection.addEventListener("track", (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  });

  return async (data: any) => {
    // Listening offer then send answer
    if (data && data.offer) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      };
      socket_emit(roomWithAnswer);
    }

    // Listening for remote ICE candidates below

    if (data && data.icecandidate) {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(data.icecandidate)
      );
    }
  };
};
