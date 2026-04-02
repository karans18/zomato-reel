import { io } from "socket.io-client";
import { getSocketServerUrl, getStoredAuthToken } from "../lib/api";

const SOCKET_URL = getSocketServerUrl();

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
  auth: (callback) => {
    const token = getStoredAuthToken();
    callback(token ? { token } : {});
  },
});

export default socket;
