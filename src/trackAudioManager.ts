import WebSocket from "ws";
import {
  Message,
  isFrequencyStateUpdate,
  isRxBegin,
  isRxEnd,
  isTxBegin,
  isTxEnd,
} from "./types/messages";
import { EventEmitter } from "events";

export default class TrackAudioManager extends EventEmitter {
  private static instance: TrackAudioManager;
  private socket: WebSocket | null = null;
  private reconnectInterval = 1000 * 5; // 5 seconds
  private url: string = "ws://localhost:49080/ws";
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {
    super();
  }

  /**
   * Provides access to the TrackAudio websocket connection
   * @returns The websocket instance
   */
  public static getInstance(): TrackAudioManager {
    if (!TrackAudioManager.instance) {
      TrackAudioManager.instance = new TrackAudioManager();
    }
    return TrackAudioManager.instance;
  }

  /**
   * Sets the connection URL for TrackAudio
   * @param url The URL for the TrackAudio instance
   */
  public setUrl(url: string) {
    this.url = url;
  }

  /**
   * Connects to a TrackAudio instance
   * @param url The URL of the TrackAudio instance to connect to, typically ws://localhost:49080/ws
   */
  public connect(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.warn("WebSocket is already connected or connecting.");
      return;
    }

    // Cancel any pending reconnect timer just in case there is one
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket = new WebSocket(this.url);

    this.socket.on("open", () => {
      console.log("WebSocket connection established.");
      TrackAudioManager.instance.emit("connected");
    });

    this.socket.on("close", () => {
      console.log("WebSocket connection closed");
      TrackAudioManager.instance.emit("disconnected");
      this.reconnect();
    });

    this.socket.on("error", (err: Error & { code: string }) => {
      if (err.code === "ECONNREFUSED") {
        console.error(
          "Unable to connect to TrackAudio, connection refused. TrackAudio probably isn't running."
        );
      } else {
        console.error("WebSocket error:", err.message);
      }
      this.reconnect();
    });

    this.socket.on("message", this.processMessage);
  }

  private processMessage(message: string): void {
    console.log("received: %s", message);

    // Parse the message as JSON
    const data: Message = JSON.parse(message);

    // Check if the received message is of the desired event type
    if (isFrequencyStateUpdate(data)) {
      TrackAudioManager.instance.emit("frequencyUpdate", data);
    } else if (isRxBegin(data)) {
      TrackAudioManager.instance.emit("rxBegin", data);
    } else if (isRxEnd(data)) {
      TrackAudioManager.instance.emit("rxEnd", data);
    } else if (isTxBegin(data)) {
      TrackAudioManager.instance.emit("txBegin", data);
    } else if (isTxEnd(data)) {
      TrackAudioManager.instance.emit("txEnd", data);
    }
  }

  /**
   * Sets up a timer to attempt to reconnect to the websocket
   */
  private reconnect(): void {
    // Check to see if a reconnect attempt is already in progress. If so
    // skip starting another one.
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect...`);
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Disconnects from a TrackAudio instance
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Sends a message to the TrackAudio instance
   * @param data The data to send
   */
  public send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected.");
    }
  }
}