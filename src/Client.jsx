import { useEffect } from 'react';
import io from 'socket.io-client';
import { DeviceType } from './ConstDefine.jsx'

function Client({ setSocket, setPieceType, setLastStep, setSeeds, gameMode,
    setDeviceType, setRoomDeviceType, setBoardWidth, setBoardHeight,
    setSynchronized, setHeadCount, setHistoryPeekUsers, setRoomId,
    setNickName, setMatched, setJoined, setStartModalOpen,
    setPlayerLeaveRoomModalOpen,
    setPlayerDisconnectedModalOpen, setRestartRequestModalOpen, setRestart,
    setRestartResponseModalOpen, setAllIsOk,
    setCommonModalText, setCommonModalOpen, setSkipRound,
    setNetConnected, setRestartInSameRoom, setUndoRound,
    setUndoRoundRequestModalOpen, setUndoRoundResponseModalOpen }) {

    function getDeviceType() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            return DeviceType.MOBILE;
        }
        else {
            return DeviceType.PC;
        }
    }

    useEffect(() => {
        // if (gameMode === GameMode.MODE_NONE || gameMode === GameMode.MODE_SIGNAL ||
        //     gameMode === undefined) {
        //     return;
        // }
        const deviceType = getDeviceType();
        setDeviceType(deviceType);

        // 连接服务器
        let serverUrl;
        if (process.env.REACT_APP_ENV === 'dev') {
            serverUrl = process.env.REACT_APP_BACKEND_URL_DEV;
        }
        else if (process.env.REACT_APP_ENV === 'prod') {
            serverUrl = process.env.REACT_APP_BACKEND_URL;
        }
        const socket = io.connect(serverUrl);
        setSocket(socket);
        socket.on('connect', () => {
            console.log('Connected to server');
            setNetConnected(socket.connected);
            // 当从服务器接收到消息时触发
            socket.on('message', (data) => {
                console.log('Server:', data);
            });

            socket.on('currentHeadCount', (data) => {
                setHeadCount(data);
            });

            socket.on('historyPeekUsers', (data) => {
                setHistoryPeekUsers(data);
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

            socket.on('setRoomDeviceType', ({ roomDType, bWidth, bHeight }) => {
                setRoomDeviceType(roomDType);
                setBoardWidth(bWidth);
                setBoardHeight(bHeight);
                setSynchronized(true);
                console.log('Server[广播]:', '调整棋盘完成，采用模式:' + roomDType + '， ' + bWidth + ' x ' + bHeight);
            });

            socket.on('matchedRoomId', (data) => {
                setRoomId(data);
                setNickName(socket.id);
                setTimeout(() => {
                    setMatched(true);
                }, 1000);
            });

            socket.on('joined', () => {
                setTimeout(() => {
                    setJoined(true);
                }, 1000);
            });

            socket.on('step', ({ i, j }) => {
                setLastStep([i, j]);
            });

            socket.on('playerLeaveRoom', (data) => {
                console.log('Server:', data);
                setPlayerLeaveRoomModalOpen(true);
            });

            socket.on('playerDisconnected', (data) => {
                console.log('Server:', data);
                setPlayerDisconnectedModalOpen(true);
            });

            socket.on('restart_request', ({ gameMode, nickName, gameOver }) => {
                setRestartRequestModalOpen(true);
            });

            socket.on('restart_resp', ({ resp, socketId }) => {
                if (resp) {
                    setRestartInSameRoom(true);
                    if (socketId !== socket.id) {
                        setCommonModalText('对方已同意');
                        setCommonModalOpen(true);
                    }
                    setTimeout(() => {
                        setRestart(true);
                        setStartModalOpen(true);
                        setAllIsOk(false);
                    }, 1000);
                }
                else if (socketId !== socket.id) {
                    setCommonModalText('对方已拒绝');
                    setCommonModalOpen(true);
                }
                setRestartResponseModalOpen(false);
            });

            socket.on('skipRound', () => {
                setSkipRound(true);
            });

            socket.on('undoRoundRequest', () => {
                setUndoRoundResponseModalOpen(true);
            });

            socket.on('undoRound', ({ resp, socketId }) => {
                if (resp) {
                    setUndoRound(true);
                    if (socketId !== socket.id) {
                        setUndoRoundRequestModalOpen(false);
                        setCommonModalText('对方已同意');
                        setCommonModalOpen(true);
                    }
                }
                else if (socketId !== socket.id) {
                    setUndoRoundRequestModalOpen(false);
                    setCommonModalText('对方已拒绝');
                    setCommonModalOpen(true);
                }
            });

            socket.on('disconnect', () => {
                setNetConnected(false);
            });
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    return null;
}

export default Client;
