import trackAudioManager from "@managers/trackAudio";

export const handleMainStationVolumeAdded = () => {
  if (trackAudioManager.isConnected) {
    trackAudioManager.refreshMainOutputVolume();
  }
};
