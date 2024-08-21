import {
  action,
  DidReceiveSettingsEvent,
  KeyUpEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";
import actionManager from "@managers/action";
import { LONG_PRESS_THRESHOLD } from "@utils/constants";

@action({ UUID: "com.neil-enns.trackaudio.trackaudiostatus" })
/**
 * Represents the status of the websocket connection to TrackAudio
 */
export class TrackAudioStatus extends SingletonAction<TrackAudioStatusSettings> {
  private _keyDownStart = 0;

  // When the action is added to a profile it gets saved in the ActionManager
  // instance for use elsewhere in the code.
  onWillAppear(
    ev: WillAppearEvent<TrackAudioStatusSettings>
  ): void | Promise<void> {
    actionManager.addTrackAudio(ev.action, ev.payload.settings);
  }

  // When the action is removed from a profile it also gets removed from the ActionManager.
  onWillDisappear(
    ev: WillDisappearEvent<TrackAudioStatusSettings>
  ): void | Promise<void> {
    actionManager.remove(ev.action);
  }

  onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<TrackAudioStatusSettings>
  ): Promise<void> | void {
    actionManager.updateTrackAudioStatus(ev.action, ev.payload.settings);
  }

  onKeyDown(): Promise<void> | void {
    this._keyDownStart = Date.now();
  }

  onKeyUp(ev: KeyUpEvent<TrackAudioStatusSettings>): Promise<void> | void {
    const pressLength = Date.now() - this._keyDownStart;

    if (pressLength > LONG_PRESS_THRESHOLD) {
      actionManager.trackAudioStatusLongPress(ev.action);
    }
  }
}

// Currently no settings are needed for this action
export interface TrackAudioStatusSettings {
  title?: string;
  notConnectedImagePath?: string;
  connectedImagePath?: string;
  voiceConnectedImagePath?: string;
  showTitle?: boolean;
}
