import axios from "axios";

console.log("hi");

const postData =
  "id=test&id=shard1%3Adxjyixyyubbaehtl8vn610th44t8jn&candidate=%7B%22candidate%22%3A%22candidate%3A3887379689%201%20udp%201677729535%20140.228.21.234%2059773%20typ%20srflx%20raddr%200.0.0.0%20rport%200%20generation%200%20ufrag%20Wv6g%20network-cost%20999%22%2C%22sdpMid%22%3A%220%22%2C%22sdpMLineIndex%22%3A0%2C%22usernameFragment%22%3A%22Wv6g%22%7D";

const decodedString = decodeURIComponent(postData);

const params = new URLSearchParams(decodedString);

console.log("id len", params.getAll("id").length);

params.delete("id");

console.log("id len", params.getAll("id").length);

const candidateParam = JSON.parse(params.get("candidate")!);

const candidateValue = candidateParam["candidate"];
const candidateSplit = candidateValue.split(" ");

candidateSplit[4] = "testing";

const updatedCandidate = candidateSplit.join(" ");

candidateParam["candidate"] = updatedCandidate;

params.set("updatedCandidate", JSON.stringify(candidateParam));

// console.log(candidateParam);
// console.log(params.get("candidate"));

const updatedInput = encodeURIComponent(params.toString());

// console.log("id:", id);
// console.log("candidate:", candidate);
// console.log("updatedCandidate:", updatedCandidate);

// axios.get("http://ip-api.com/json").then((data) => {
//   console.log(data.data.query);
// });
