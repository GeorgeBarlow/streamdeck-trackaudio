import { ListenTo } from "@controllers/stationStatus";
import {
  action,
  DidReceiveSettingsEvent,
  JsonValue,
  KeyUpEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";
import actionManager from "@managers/action";
import { LONG_PRESS_THRESHOLD } from "@utils/constants";

@action({ UUID: "com.neil-enns.trackaudio.stationstatus" })
/**
 * Represents the status of a TrackAudio station
 */
export class StationStatus extends SingletonAction<StationSettings> {
  private _keyDownStart = 0;

  // When the action is added to a profile it gets saved in the ActionManager
  // instance for use elsewhere in the code. The default title is also set
  // to something useful.
  override onWillAppear(
    ev: WillAppearEvent<StationSettings>
  ): void | Promise<void> {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // KeyAction.
    if (!ev.action.isKey()) {
      return;
    }

    actionManager.addStation(ev.action, ev.payload.settings);
  }

  // When the action is removed from a profile it also gets removed from the ActionManager.
  override onWillDisappear(
    ev: WillDisappearEvent<StationSettings>
  ): void | Promise<void> {
    actionManager.remove(ev.action);
  }

  // When settings are received the ActionManager is called to update the existing
  // settings on the saved action.
  override onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<StationSettings>
  ): void | Promise<void> {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // KeyAction.
    if (!ev.action.isKey()) {
      return;
    }

    actionManager.updateStation(ev.action, ev.payload.settings);
  }

  override onKeyDown(): void | Promise<void> {
    this._keyDownStart = Date.now();
  }

  override onKeyUp(ev: KeyUpEvent<StationSettings>): Promise<void> | void {
    const pressLength = Date.now() - this._keyDownStart;

    if (pressLength > LONG_PRESS_THRESHOLD) {
      actionManager.stationStatusLongPress(ev.action);
    } else {
      actionManager.stationStatusShortPress(ev.action);
    }
  }
}

export interface StationSettings {
  autoSetListen?: boolean;
  autoSetRx?: boolean;
  blockedCommsImagePath?: string;
  activeCommsImagePath?: string;
  callsign?: string;
  clearAfterInMinutes?: number;
  lastReceivedCallsignCount?: number;
  listeningImagePath?: string;
  listenTo: ListenTo | null;
  mutedImagePath?: string;
  notListeningImagePath?: string;
  showCallsign?: boolean;
  showFrequency?: boolean;
  showListenTo?: boolean;
  showTitle?: boolean;
  title?: string;
  toggleMuteOnPress?: boolean;
  unavailableImagePath?: string;
  [key: string]: JsonValue;
}
