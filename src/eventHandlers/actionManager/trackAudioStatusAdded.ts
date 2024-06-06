import ActionManager from "../../actionManager";
import TrackAudioManager from "../../trackAudioManager";

export const handleTrackAudioStatusAdded = (count: number) => {
  const actionManager = ActionManager.getInstance();
  const trackAudio = TrackAudioManager.getInstance();

  if (count === 1) {
    trackAudio.connect();
  }

  // Refresh the button state so the new button gets the proper state from the start.
  actionManager.setTrackAudioConnectionState(trackAudio.isConnected());
};
