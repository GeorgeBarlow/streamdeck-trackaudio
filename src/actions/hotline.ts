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

@action({ UUID: "com.neil-enns.trackaudio.hotline" })
/**
 * Represents the status of a TrackAudio station
 */
export class Hotline extends SingletonAction<HotlineSettings> {
  private _keyDownStart = 0;

  // When the action is added to a profile it gets saved in the ActionManager
  // instance for use elsewhere in the code. The default title is also set
  // to something useful.
  onWillAppear(ev: WillAppearEvent<HotlineSettings>): void | Promise<void> {
    actionManager.addHotline(ev.action, ev.payload.settings);
  }

  // When the action is removed from a profile it also gets removed from the ActionManager.
  onWillDisappear(
    ev: WillDisappearEvent<HotlineSettings>
  ): void | Promise<void> {
    actionManager.remove(ev.action);
  }

  // When settings are received the ActionManager is called to update the existing
  // settings on the saved action.
  onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<HotlineSettings>
  ): void | Promise<void> {
    actionManager.updateHotline(ev.action, ev.payload.settings);
  }

  onKeyDown(): void | Promise<void> {
    this._keyDownStart = Date.now();
  }

  onKeyUp(ev: KeyUpEvent<HotlineSettings>): Promise<void> | void {
    const pressLength = Date.now() - this._keyDownStart;

    if (pressLength > LONG_PRESS_THRESHOLD) {
      actionManager.hotlineLongPress(ev.action);
    } else {
      actionManager.hotlineShortPress(ev.action);
    }
  }
}

export interface HotlineSettings {
  primaryCallsign: string;
  hotlineCallsign: string;
  title?: string;
  receivingImagePath?: string;
  listeningImagePath?: string;
  hotlineActiveImagePath?: string;
  bothActiveImagePath?: string;
  neitherActiveImagePath?: string;
  unavailableImagePath?: string;
  showTitle?: boolean;
  showHotlineCallsign?: boolean;
  showPrimaryCallsign?: boolean;
}
