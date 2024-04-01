import React, { useState, useEffect, useRef } from 'react';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import ProgressBar from 'react-progressbar';

import {
    ButtonBoxN, XSign, ButtonBox, Switch,
} from './Control.jsx'
import './VideoChat.css';
import './Game.css';
import { GlobalSignal } from './ConstDefine.jsx';

function SaveVideoModal({ globalSignal, setGlobalSignal, setSaveVideoModalOpen,
}) {
    const [confirmModalOpen, setConfirmModalOpen] = useState();
    const [progress, setProgress] = useState(0);
    const [saveBtnDisabled, setSaveBtnDisabled] = useState(false);
    const [transcodeBtnDisabled, setTranscodeBtnDisabled] = useState(false);
    const [previewBtnDisabled, setPreviewBtnDisabled] = useState(false);
    const timerRef = useRef();

    useEffect(() => {
        return () => clearInterval(timerRef?.current);
    }, []);

    useEffect(() => {
        if (globalSignal && globalSignal[GlobalSignal.Active]) {
            if (globalSignal[GlobalSignal.TranscodeFinished]) {
                clearInterval(timerRef?.current);
                setProgress(100);
            }
        }
    }, [globalSignal]);

    const increaseProgress = (step) => {
        setProgress(prevProgress => {
            const newProgress = prevProgress >= 100 ? 0 : (prevProgress + step);
            return newProgress <= 100 ? (newProgress === 100 ? 99.99 : newProgress) : 0;
        });
    };

    const onSaveBtnClick = () => {
        setGlobalSignal(prev => ({
            ...prev, [GlobalSignal.Active]: true,
            [GlobalSignal.SaveVideoBtnClick]: true
        }));
        setSaveBtnDisabled(true);
    }
    const onTranscodeBtnClick = () => {
        setGlobalSignal(prev => ({
            ...prev, [GlobalSignal.Active]: true,
            [GlobalSignal.TranscodeBtnClick]: true
        }));
        timerRef.current = setInterval(() => increaseProgress(10), 1000);
        setTranscodeBtnDisabled(true);
    }

    const onPreviewBtnClick = () => {
        setGlobalSignal(prev => ({
            ...prev, [GlobalSignal.Active]: true,
            [GlobalSignal.PreviewVideoBtnClick]: true
        }));
    }

    const onXSignClick = () => {
        setConfirmModalOpen(true);
    }

    return (
        <div className='modal-overlay'>
            <div className='modal' style={{ padding: 0, }}>

                <XSign onClick={onXSignClick} />
                <span>{confirmModalOpen ? '关闭会清理录屏文件，确认要关闭吗？' : '录屏结束，请选择下一步操作'}</span>
                {confirmModalOpen ?
                    <ButtonBox onOkBtnClick={() => {
                        setSaveVideoModalOpen(false);
                        setGlobalSignal(prev => ({
                            ...prev, [GlobalSignal.Active]: true,
                            [GlobalSignal.StopTranscode]: true
                        }));
                    }}
                        OnCancelBtnClick={() => setConfirmModalOpen(false)} />
                    :
                    <ButtonBoxN props={{
                        infoArray: ['保存', '转码', '预览'],
                        onClickArray: [onSaveBtnClick, onTranscodeBtnClick, onPreviewBtnClick],
                        disabled: [saveBtnDisabled, transcodeBtnDisabled, previewBtnDisabled],
                    }} />
                }
                <div className='progress-bar'>
                    <ProgressBar completed={progress} />
                </div>
            </div>
        </div>
    );
}

function VideoRecorder({ setSaveVideoModalOpen, globalSignal,
    setGlobalSignal,
    isRecording, setIsRecording, ffmpeg,
    recorder,
    setRecorder,
    screenStream,
    setScreenStream,
    chunksRef,
    blobRef,
    toggleExpand
}) {

    const [audioEnabled, setAudioEnabled] = useState(false);

    useEffect(() => {
        window.addEventListener('error', function (event) {
            event.preventDefault();
            event.stopPropagation();
            console.error('发生了一个错误:', event.error);
        });
        window.addEventListener('unhandledrejection', function (event) {
            event.preventDefault();
            event.stopPropagation();
            console.error('发生了一个未处理的 Promise 错误:', event.reason);
        });
    }, []);

    useEffect(() => {
        if (globalSignal && globalSignal[GlobalSignal.Active]) {
            if (globalSignal[GlobalSignal.PreviewVideoBtnClick]) {
                previewVideo();
            }
            if (globalSignal[GlobalSignal.TranscodeBtnClick]) {
                downloadVideo(true);
            }
            if (globalSignal[GlobalSignal.SaveVideoBtnClick]) {
                downloadVideo();
            }
            if (globalSignal[GlobalSignal.StopTranscode]) {
                // Will cause runtime error on browser.
                ffmpeg.terminate();
            }
        }
    }, [globalSignal]);

    const previewVideo = () => {
        if (chunksRef?.current) {
            const url = URL.createObjectURL(blobRef.current);
            window.open(url);
        }
    }

    const startRecording = async () => {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: !audioEnabled
        });
        let stream = screenStream;
        if (audioEnabled) {
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            stream = new MediaStream();
            screenStream.getTracks().forEach(track => {
                stream.addTrack(track)
            });
            audioStream.getTracks().forEach(track => {
                stream.addTrack(track);
            });
        }
        if (!stream) return;
        chunksRef.current = [];
        blobRef.current = null;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'

        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        const recorder = new MediaRecorder(stream);
        setRecorder(recorder);
        setScreenStream(stream);

        recorder.ondataavailable = event => {
            chunksRef.current = [...chunksRef.current, event.data];
        };

        recorder.onstop = () => {
            setSaveVideoModalOpen(true);
            blobRef.current = new Blob(chunksRef.current, { type: 'video/webm' });
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        };
        recorder.start();
    };

    async function downloadVideo(isTranscode, fname) {
        let file;
        if (isTranscode) {
            await ffmpeg.writeFile('input.webm', await fetchFile(blobRef.current));
            const args = ['-i', 'input.webm', 'output.mp4'];
            await ffmpeg.exec(args);
            const outData = await ffmpeg.readFile('output.mp4');
            file = new File([outData], fname, { type: 'video/mp4' });
        }
        else {
            file = blobRef.current;
        }
        const currentDate = new Date();
        const timestamp = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}_${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
        const fileName = fname ? fname : `recording_${timestamp}${isTranscode ? '.mp4' : '.webm'}`;
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        if (isTranscode) {
            setGlobalSignal(prev => ({
                ...prev, [GlobalSignal.Active]: true,
                [GlobalSignal.TranscodeFinished]: true
            }));
        }
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
    }

    const stopRecording = () => {
        if (recorder && recorder.state === 'recording') {
            recorder.stop();
        }
    };

    const toggleRecord = async () => {
        toggleExpand();
        if (recorder?.state === 'recording') {
            stopRecording();
        }
        else {
            await startRecording();
            setIsRecording(true);
        }
    }

    return (
        <>
            <div className='video-recorder'>
                <button onClick={toggleRecord} onTouchStart={toggleRecord}>{isRecording ? '停止录制' : '录制视频'}</button>
                <Switch isOn={audioEnabled} setIsOn={setAudioEnabled} onInfo='外部音频' offInfo='内部音频' />
            </div>
        </>
    );
}

export {
    VideoRecorder, SaveVideoModal,
}
