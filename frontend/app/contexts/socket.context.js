// app/contexts/socket.context.js

import React from "react";
import { Platform } from "react-native";
import io from "socket.io-client";

export const socketEndpoint = Platform.OS === 'web' ? "http://localhost:3000" : "http://172.20.10.2:3000";

export const socket = io(socketEndpoint, {
  transports: ["websocket"],
});

export let hasConnection = false;

socket.on("connect", () => {
  hasConnection = true;
});

socket.on("disconnect", () => {
  hasConnection = false;
  socket.removeAllListeners();
});

export const SocketContext = React.createContext();
