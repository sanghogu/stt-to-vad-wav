'use client'

import styles from "./page.module.css";
import AudioRecorder from "@/_components/AudioRecorder";
import useAudioRec from "@/hooks/useAudioRec";

export default function Home() {

    const recorderControls = useAudioRec()


  return (
    <div>

      <div className={styles.root}>

          <AudioRecorder recorderControls={recorderControls}/>
      </div>

    </div>
  );
}
