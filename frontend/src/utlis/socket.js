import { io } from "socket.io-client";
import { getSocketServerUrl } from "../lib/api";

const SOCKET_URL = getSocketServerUrl();

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

export default socket;
