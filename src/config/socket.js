import { io } from "socket.io-client";
import { BASE_URl } from "@/config";

let socket;

export const getChatSocket = () => {
  if (!socket) {
    socket = io(BASE_URl, {
      withCredentials: true,
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};
