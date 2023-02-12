import ws, { Socket } from 'k6/ws';
import { check, sleep } from 'k6';
import { makeConnection } from '../libs/socket.io';
import { Counter, Trend } from 'k6/metrics';
import { SocketWrapper } from '../libs/SocketWrapper';

export const options = {
    // stages: [{ duration: "10s", target: 50 }],
    vus: 20,
    duration: `1h`,
};

const ready_waiting_time = new Trend(`ready_waiting_time`, true);

const match_waiting_time = new Trend(`match_waiting_time`, true);

export default function (): void {
    // const secure = __ENV.REMOTE == "true" ? true : false;

    // const domain = secure
    //   ? `react-video-call-fjutjsrlaa-uc.a.run.app`
    //   : `34.27.73.223`;

    const secure = false;

    const domain = __ENV.LOCAL == `true` ? `localhost:8080` : `nginx`;

    // const sid = makeConnection(domain, secure);

    // Let's do some websockets
    const url = `${
        secure ? `wss` : `ws`
    }://${domain}/socket.io/?EIO=4&transport=websocket`;

    const response = ws.connect(url, {}, function (socket) {
        const socketWrapper = new SocketWrapper(socket);

        const readyEvent = () => {
            socketWrapper.listen(
                `match`,
                15000,
                (
                    isSuccess: boolean,
                    elapsed: number,
                    data: any,
                    callback?: (data: any) => void
                ) => {
                    if (isSuccess) {
                        match_waiting_time.add(elapsed);
                    } else {
                        // console.log("match failure:" + data);
                    }

                    check(isSuccess, { 'match event': (r) => r });

                    if (callback) callback({});
                }
            );

            socketWrapper.sendWithAck(
                `ready`,
                { test: `looking for ack` },
                5000,
                (isSuccess: boolean, elapsed: number, data: any) => {
                    if (isSuccess) {
                        ready_waiting_time.add(elapsed);
                    } else {
                        // console.log("ready failure:" + data);
                    }
                    check(isSuccess, { 'ready event': (r) => r });
                }
            );
        };

        socketWrapper.setOnConnect(() => {
            readyEvent();
        });

        socketWrapper.setEventMessageHandle(`message`, (msg: any) => {
            // console.log("message:", msg);
        });

        socketWrapper.setEventMessageHandle(`myping`, (msg: any, callback) => {
            if (callback) callback(`k6 myping ack`);
        });

        socket.on(`close`, function close() {
            socketWrapper.failWaitingEvents();
        });

        socket.on(`error`, function (e) {
            console.log(`error`, JSON.stringify(e));
            if (e.error() != `websocket: close sent`) {
                console.log(`An unexpected error occured: `, e.error());
            }
        });

        socket.on(`open`, () => {
            socket.send(`40`);
        });

        socket.setTimeout(function () {
            socket.close();
        }, 1000 * 20);
    });

    check(response, { 'status is 101': (r) => r && r.status === 101 });
}
