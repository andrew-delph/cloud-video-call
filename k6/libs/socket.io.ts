import { socketResponseType, socketResponseCode } from './constants';
import { soResponse } from './types';
import http from 'k6/http';

/**
 * This sets up your socket client connection with the backend client
 * @param domain the domain you're testing
 * @returns the sid for your socket connection
 */
export function makeConnection(domain: string, secure: boolean): string {
    let res;

    // Establishing a `polling` transport and getting the `sid`.
    res = http.get(
        `${
            secure ? `https` : `http`
        }://${domain}/socket.io/?EIO=4&transport=polling&t=${hashDate()}`
    );

    const sid = getSid(res.body as string);

    const data = `${socketResponseType.message}${socketResponseCode.connect}`;
    const headers = { 'Content-type': `text/plain;charset=UTF-8` };

    // `message connect` event
    res = http.post(
        `${
            secure ? `https` : `http`
        }://${domain}/socket.io/?EIO=4&transport=polling&t=${hashDate()}&sid=${sid}`,
        data,
        { headers: headers }
    );

    // also seems to be needed...
    res = http.get(
        `${
            secure ? `https` : `http`
        }://${domain}/socket.io/?EIO=4&transport=polling&t=${hashDate()}&sid=${sid}`
    );

    return sid;
}

/**
 * This method will check:
 * 1. The type of socket.io response
 * 2. The response code
 * And act accordingly.
 * @param message the socket.io response
 */
export function checkResponse(response: string): soResponse {
    return { type: parseInt(response[0]), code: parseInt(response[1]) };
}

export function getCallbackId(response: string): number {
    return parseInt(response.slice(2));
}

/**
 * In our message we're returning an array, but this may not be the case your app.
 * If that's the case, change the regex in the 'match' const.
 * @param response socketio response message
 * @returns the data from the response message
 */
export function getArrayFromRequest(response: string): string[] {
    const match = /\[.+\]/;
    const parsedResponse = response.match(match);
    return parsedResponse ? JSON.parse(parsedResponse[0]) : [];
}

/**
 * This function will only check for 'event' messages.
 * To see what other types of messages you can check for,
 * look at the enums in constants.ts.
 * @param msg message sent from socket.io backend client
 * @param checks a function that you pass through which performs checks on the parsed message
 */
export function checkForEventMessages(
    msg: string,
    callbackMap: { [key: number]: () => void },
    checks: (messageData: string[]) => void
): void {
    // check if callback
    // console.log("mssg", msg);
    if (
        checkResponse(msg).type === socketResponseType.message &&
    checkResponse(msg).code === socketResponseCode.ack
    ) {
        const callbackId = getCallbackId(msg);
        const callback = callbackMap[callbackId];
        if (callback != undefined) {
            delete callbackMap[callbackId];
            callback();
        }
        return;
    }

    // Check for event messages
    const msgObject =
    // you can change this to check for other message types
    checkResponse(msg).type === socketResponseType.message &&
    checkResponse(msg).code === socketResponseCode.event
        ? getArrayFromRequest(msg) // get data from message
        : null;

    if (msgObject) {
        checks(msgObject);
    }
}

function hashDate(): string {
    return (+new Date()).toString(36);
}

function getSid(parserEncoding: string): string {
    const match = /{.+?}/;
    const response = parserEncoding.match(match);
    return response ? JSON.parse(response[0]).sid : `No Response`;
}
