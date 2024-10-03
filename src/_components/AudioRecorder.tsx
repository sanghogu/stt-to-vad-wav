import React, { ReactElement } from "react";

import styles from './audioRecorder.module.scss'
import {AiFillAudio, AiFillSave} from "react-icons/ai";
import {IoStop} from 'react-icons/io5'
import {RxResume} from 'react-icons/rx'
import {BsFillPauseFill} from 'react-icons/bs'
import {AudioRecControls} from "@/hooks/useAudioRec";

interface Props {
    // save클릭시 blob 내용 참고 가능
    onRecordingComplete?: () => void;
    /**
     * hook 에서 보내주는 파라미터들
     */
    recorderControls: AudioRecControls;
}

const AudioRecorder: (props: Props) => ReactElement = ({
                                                           recorderControls
                                                       }: Props) => {
    const {
        startRecording,
        stopRecording,
        togglePauseResume,
        isRecording,
        isPaused,
        recordingTime,
    } = recorderControls;
    const stopAudioRecorder: () => void = () => {
        stopRecording();
    };

    return (
        <div
            className={`${styles.audioRecorder} ${isRecording ? styles.recording : ""}`}
            data-testid="audio_recorder"
        >
            {
                isRecording
                    ?
                    <AiFillSave className={`${styles.reactIcon}`}  onClick={() => stopAudioRecorder()}/>
                    :
                    <AiFillAudio className={styles.reactIcon} onClick={startRecording} />
            }
            <span
                className={`${styles.audioRecorderTimer} ${
                    !isRecording ? styles.displayNone : ""
                } `}
                data-testid="ar_timer"
            >
        {Math.floor(recordingTime / 60)}:
                {String(recordingTime % 60).padStart(2, "0")}
      </span>
            <span
                className={`${styles.audioRecorderStatus} ${
                    !isRecording ? styles.displayNone : ""
                } `}
            >
        <span className={styles.audioRecorderStatusDot}></span>
        <span>Recording</span>
                {
                    isPaused &&
                    <span className={styles.waitText}>Wait</span>
                }
      </span>
            {
                isRecording &&
                <>
                    {
                        isPaused?
                            <RxResume
                                className={`${styles.reactIcon}`}
                                onClick={togglePauseResume}
                            />
                            :
                            <BsFillPauseFill
                                className={`${styles.reactIcon}`}
                                onClick={togglePauseResume}
                            />
                    }
                    <IoStop
                        className={`${styles.reactIcon}`}
                        onClick={() => stopAudioRecorder()}
                    />
                </>
            }

        </div>
    );
};

export default AudioRecorder;