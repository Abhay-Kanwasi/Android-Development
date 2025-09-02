// src/components/YouTubePlayer.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

interface YouTubeVideoPlayerProps {
  videoId: string;
  onVideoEnd?: () => void;
  onProgressUpdate?: (currentTime: number) => void;
  height?: number;
}

const YouTubeVideoPlayer: React.FC<YouTubeVideoPlayerProps> = ({ 
  videoId, 
  onVideoEnd, 
  onProgressUpdate, 
  height = 200 
}) => {
  const [playing, setPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      onVideoEnd && onVideoEnd();
    }
  }, [onVideoEnd]);

  const onProgress = useCallback((data: { currentTime: number }) => {
    setCurrentTime(data.currentTime);
    onProgressUpdate && onProgressUpdate(data.currentTime);
  }, [onProgressUpdate]);

  return (
    <View style={styles.container}>
      <YoutubePlayer
        height={height}
        videoId={videoId}
        play={playing}
        onChangeState={onStateChange}
        onProgress={onProgress}
        volume={50}
        playbackRate={1}
        playerParams={{
          cc_lang_pref: 'en',
          showClosedCaptions: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default YouTubeVideoPlayer;