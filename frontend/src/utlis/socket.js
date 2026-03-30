import { io } from "socket.io-client";
import { getSocketServerUrl } from "../lib/api";

const SOCKET_URL = getSocketServerUrl();

const socket = io(SOCKET_URL, {
  withCredentials: true,
});

export default socket;
