import {useState, useCallback, useRef, useEffect} from "react";
import useInterval from "@/hooks/useInterval";
export interface AudioRecControls {
    startRecording: () => void;
    stopRecording: () => void;
    togglePauseResume: () => void;
    isRecording: boolean;
    isPaused: boolean;
    recordingTime: number;
    channelData: Float32Array[]
}

const useAudioRec: () => AudioRecControls = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [timerIntervalFlag, setTimerIntervalFlag] = useState<boolean>(false);
    const mediaRecorder = useRef<MediaRecorder|undefined>(undefined)
    const audioContextRef = useRef<AudioContext|undefined>();
    const [channelData, setChannelData] = useState<Float32Array[]>([]);

    useEffect(()=>{
        return () => {
            stopRecording();
            audioContextRef.current?.close();
        }
    }, []);

    useInterval(()=>{
        setRecordingTime((time) => time + 1);
    }, !timerIntervalFlag ? null: 1000)

    const startTimer: () => void = () => {
        setTimerIntervalFlag(true)
    };

    const stopTimer: () => void = () => {
        setTimerIntervalFlag(false);
    };

    const startRecording: () => void = useCallback(() => {
        //이미 진행중이니 리턴함
        if (timerIntervalFlag) return;

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {

                let localRecording = true;
                setIsRecording(localRecording);
                //브라우저 media 기능
                const recorder: MediaRecorder = new MediaRecorder(stream, {audioBitsPerSecond: 128000});
                mediaRecorder.current = recorder;
                recorder.start(5000);
                startTimer();

                /**
                 * audionode 연결시켜 처리데이터 실시간 감시
                 */
                if(!audioContextRef.current) audioContextRef.current = initAudioContext();

                const source = audioContextRef.current!.createMediaStreamSource(stream);

                //연결 종료 함수
                let dissFunc: (() => void) | undefined = undefined;

                recorder.addEventListener("stop", () => {
                    localRecording = false;
                    console.log("STOP")
                    recorder.stream.getTracks().forEach((t) => t.stop());

                    mediaRecorder.current = undefined;

                    source.disconnect();
                    audioContextRef.current?.destination.disconnect();
                    dissFunc?.();

                    stopTimer();
                    setRecordingTime(0);
                    setIsRecording(false);
                    setIsPaused(false);
                })

                initOnAudioProcessor(audioContextRef.current!, source, setChannelData)
                    .then(obj=>{
                        dissFunc = obj;
                        recorder.addEventListener("start", ()=>{
                        })
                    })
                    .catch(() => {
                        stopRecording()
                    })
            })
            .catch((err) => console.log(err));
    }, [timerIntervalFlag]);

    const stopRecording: () => void = () => {
        mediaRecorder.current?.stop();
    };


    const togglePauseResume: () => void = () => {
        setIsPaused(!isPaused);
        if(isPaused) {
            mediaRecorder.current?.resume();
            audioContextRef.current?.resume();
            startTimer();
        } else {
            stopTimer();
            mediaRecorder.current?.pause();
            audioContextRef.current?.suspend();
        }
    };

    return {
        startRecording,
        stopRecording,
        togglePauseResume,
        isRecording,
        isPaused,
        recordingTime,
        channelData
    };
};

export default useAudioRec;

function initAudioContext():AudioContext|undefined {
    const InitAudioContext = (window.AudioContext || window.webkitAudioContext);
    if(InitAudioContext) return new InitAudioContext();
    return undefined;
}


async function initOnAudioProcessor
(audioContext:AudioContext, source:MediaStreamAudioSourceNode, onMessageChannelDataArr:(arg:Float32Array[])=>void):Promise<(() => void)>{
    if(audioContext.audioWorklet) {

        console.log("Register the worklet");

        let bufferDetectorNode:AudioWorkletNode;
        try {
            bufferDetectorNode = new AudioWorkletNode(audioContext, 'buffer-detector');
        } catch {

            await audioContext.audioWorklet.addModule('/js/worklets.js');

            bufferDetectorNode = new AudioWorkletNode(audioContext, 'buffer-detector');
        }
        bufferDetectorNode.port.onmessage = (e) => onMessageChannelDataArr(e.data);

        source.connect(bufferDetectorNode!);

        return () => {
            bufferDetectorNode.port.postMessage('disconnect')
        }

    } else {
        const scriptProcessorNode = audioContext.createScriptProcessor(2048,1,1);

        scriptProcessorNode.onaudioprocess = function(event) {

            const channelLen = event.inputBuffer.numberOfChannels;
            const channelArr = [];
            for (let j = 0; j < channelLen; j++) {
                channelArr.push(event.inputBuffer.getChannelData(j))
            }
            onMessageChannelDataArr(channelArr);
        };

        source.connect(scriptProcessorNode);
        scriptProcessorNode.connect(audioContext.destination)

        return () => {
            scriptProcessorNode.disconnect();
        }

    }

}