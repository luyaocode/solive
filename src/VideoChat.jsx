import React, { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg({ log: true });

function VideoRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState();
    const [screenStream, setScreenStream] = useState();
    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });
        if (!stream) return;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
        const recorder = new MediaRecorder(stream);
        setRecorder(recorder);
        setScreenStream(stream);
        const chunks = [];

        recorder.ondataavailable = event => {
            chunks.push(event.data);
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            window.open(url);
            stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            downloadBlobAsMp4(blob);
        };
        recorder.start();
        setIsRecording(true);
    };

    async function downloadBlobAsMp4(blob, fname) {
        await ffmpeg.writeFile('input.webm', await fetchFile(blob));
        const args = ['-i', 'input.webm', 'output.mp4'];
        await ffmpeg.exec(args);
        const data = await ffmpeg.readFile('output.mp4');

        const currentDate = new Date();
        const timestamp = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}_${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;
        const fileName = fname ? fname : `recording_${timestamp}.mp4`;
        const file = new File([data], fname, { type: 'video/mp4' });
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
    }

    const stopRecording = () => {
        if (recorder && recorder.state === 'recording') {
            recorder.stop();
        }
    };

    const toggleRecord = async () => {
        if (recorder?.state === 'recording') {
            stopRecording();
        }
        else {
            await startRecording();
        }
    }

    return (
        <button onClick={toggleRecord}>{isRecording ? '停止录制' : '录制视频'}</button>
    );
}

export {
    VideoRecorder,
}
