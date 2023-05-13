export enum responseType {
  open,
  close,
  ping,
  pong,
  message,
  upgrade,
  noop,
}

export enum responseCode {
  connect,
  disconnect,
  event,
  ack,
  error,
}
