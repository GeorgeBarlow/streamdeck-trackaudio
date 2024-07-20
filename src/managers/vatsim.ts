import { VatsimData } from "@interfaces/vatsim";
import { handleAsyncException } from "@root/utils/handleAsyncException";
import axios from "axios";
import EventEmitter from "events";

export default class VatsimManager extends EventEmitter {
  private static instance: VatsimManager | null;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    super();
  }

  /**
   * Provides access to the Vatsim data service.
   * @returns The instance
   */
  public static getInstance(): VatsimManager {
    if (!VatsimManager.instance) {
      VatsimManager.instance = new VatsimManager();
    }
    return VatsimManager.instance;
  }

  private async fetchData() {
    try {
      const response = await axios.get<VatsimData>(
        "https://data.vatsim.net/v3/vatsim-data.json"
      );
      const data: VatsimData = response.data;

      this.emit("vatsimDataReceived", data);
    } catch (error) {
      console.error("Error fetching VATSIM data: ", error);
    }
  }

  /**
   * Starts polling VATSIM for new data every 5 minutes.
   *
   * @param intervalInMs The interval to poll VATSIM, in milliseconds. Default is 5 minutes.
   */
  public start(intervalInMs = 300000) {
    this.stop(); // Ensure no previous interval is running

    // Grab data right awawy
    this.fetchData().catch((error: unknown) => {
      handleAsyncException("Unable to fetch VATISM data: ", error);
    });

    // Set up polling
    this.intervalId = setInterval(() => {
      this.fetchData().catch((error: unknown) => {
        handleAsyncException("Unable to fetch VATSIM data: ", error);
      });
    }, intervalInMs);
  }

  /**
   * Stops polling VATSIM for new data.
   */
  public stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Forces a refresh of the data from VATSIM.
   */
  public refresh() {
    this.stop();
    this.start();
  }
}
