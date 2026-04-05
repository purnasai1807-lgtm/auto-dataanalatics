import { useEffect } from "react";
interface UseDatasetSocketArgs {
  datasetId?: string | null;
  token?: string | null;
  onMessage: (payload: any) => void;
}
export function useDatasetSocket({ datasetId, token, onMessage }: UseDatasetSocketArgs) {
  useEffect(() => {
    if (!datasetId || !token) {
      return;
    }
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = import.meta.env.VITE_WS_HOST ?? window.location.host;
    const socket = new WebSocket(`${protocol}://${host}/ws/datasets/${datasetId}?token=${token}`);
    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        onMessage(event.data);
      }
    };
    return () => {
      socket.close();
    };
  }, [datasetId, token, onMessage]);
}
