import * as signalR from "@microsoft/signalr";

const HUB_URL = `${import.meta.env.VITE_API_URL}/chatHub`;

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
  await hubConnection.invoke("JoinConversation", conversationId);
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
