import React, { useEffect } from 'react';
import io from 'socket.io-client';
import './ConstDefine.jsx'

function Client({ setSocket, setPieceType, setLastStep, setSeeds }) {
    useEffect(() => {
        const socket = io.connect('ws://47.97.186.50:5000');
        // 当连接成功时触发
        setSocket(socket);

        socket.on('connect', () => {
            console.log('Connected to server');
            // 当从服务器接收到消息时触发
            socket.on('message', (data) => {
                console.log('Server:', data);
            });

            socket.on('broadcast', (data) => {
                console.log('Server[广播]:', data);
            });

            socket.on('setPieceType', (data) => {
                setPieceType(data);
            });

            socket.on('setItemSeed', (seeds) => {
                setSeeds(seeds);
                console.log('Server[广播]:', '道具已经生成');
            });

            socket.on('step', ({ i, j }) => {
                setLastStep([i, j]);
            });
        });

        // 监听连接关闭事件
        socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
        };
        return () => {
            socket.disconnect();
        };
    }, []);
    return null;
}

export default Client;
