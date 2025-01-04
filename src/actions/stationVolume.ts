import {
  action,
  DialAction,
  DialDownEvent,
  DialRotateEvent,
  DidReceiveSettingsEvent,
  JsonValue,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";
import { handleRemove } from "@events/streamDeck/remove";
import { handleAddStationVolume } from "@events/streamDeck/stationVolume/addStationVolume";
import { handleDialPress } from "@events/streamDeck/stationVolume/dialPress";
import { handleDialRotate } from "@events/streamDeck/stationVolume/dialRotate";
import { handleUpdateStationVolumeSettings } from "@events/streamDeck/stationVolume/updateStationVolumeSettings";
import debounce from "debounce";

@action({ UUID: "com.neil-enns.trackaudio.stationvolume" })
/**
 * Represents the volume of a TrackAudio station
 */
export class StationVolume extends SingletonAction<StationVolumeSettings> {
  debouncedUpdate = debounce(
    (action: DialAction, settings: StationVolumeSettings) => {
      handleUpdateStationVolumeSettings(action, settings);
    },
    300
  );

  override onWillAppear(
    ev: WillAppearEvent<StationVolumeSettings>
  ): Promise<void> | void {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // DialAction.
    if (!ev.action.isDial()) {
      return;
    }

    handleAddStationVolume(ev.action, ev.payload.settings);
  }

  override onDialRotate(
    ev: DialRotateEvent<StationVolumeSettings>
  ): Promise<void> | void {
    handleDialRotate(ev.action, ev.payload.ticks);
  }

  override onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<StationVolumeSettings>
  ): Promise<void> | void {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // DialAction.
    if (!ev.action.isDial()) {
      return;
    }

    this.debouncedUpdate(ev.action, ev.payload.settings);
  }

  override onDialDown(
    ev: DialDownEvent<StationVolumeSettings>
  ): Promise<void> | void {
    handleDialPress(ev.action);
  }

  override onWillDisappear(
    ev: WillDisappearEvent<StationVolumeSettings>
  ): Promise<void> | void {
    handleRemove(ev.action);
  }
}

export interface StationVolumeSettings {
  unavailableImagePath?: string;
  callsign?: string;
  changeAmount?: number;
  mutedImagePath?: string;
  notMutedImagePath?: string;
  [key: string]: JsonValue;
}