import * as signalR from "@microsoft/signalr";
import API_URL from "@/config/api";

const HUB_URL = `${API_URL}/chatHub`;

export const hubConnection = new signalR.HubConnectionBuilder()
  .withUrl(HUB_URL, {
    accessTokenFactory: () =>
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      "",
  })
  .withAutomaticReconnect()
  .build();

export async function startSignalRConnection() {
  if (hubConnection.state === signalR.HubConnectionState.Connected) {
    return;
  }

  if (hubConnection.state === signalR.HubConnectionState.Connecting) {
    return;
  }

  try {
    await hubConnection.start();
    console.log("Connected to SignalR");
  } catch (err) {
    console.error("SignalR connect error:", err);
    setTimeout(() => {
      startSignalRConnection();
    }, 5000);
    throw err;
  }
}

export async function joinConversation(conversationId) {
  if (!conversationId) return;

  await startSignalRConnection();
  return await hubConnection.invoke("JoinConversation", String(conversationId));
}

export function onReceiveMessage(callback) {
  hubConnection.off("ReceiveMessage");
  hubConnection.on("ReceiveMessage", callback);
}

export function offReceiveMessage(callback) {
  if (callback) {
    hubConnection.off("ReceiveMessage", callback);
    return;
  }
  hubConnection.off("ReceiveMessage");
}
