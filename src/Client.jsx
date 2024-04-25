import { useEffect } from 'react';
import io from 'socket.io-client';
import {
    DeviceType, LoginStatus, Table_Client_Ips, Table_Game_Info, Table_Step_Info,
    Avatar_Number_X, Avatar_Number_Y, View
} from './ConstDefine.jsx'

import { showNotification } from './Plugin.jsx'

function Client({ socket, setSocket, setPieceType, setLastStep, setSeeds, gameMode,
    setDeviceType, setRoomDeviceType, setBoardWidth, setBoardHeight,
    setSynchronized, setHeadCount, setHistoryPeekUsers, setRoomId,
    setNickName, setMatched, setJoined, setStartModalOpen,
    setPlayerLeaveRoomModalOpen,
    setPlayerDisconnectedModalOpen, setRestartRequestModalOpen, setRestart,
    setRestartResponseModalOpen, setAllIsOk,
    setCommonModalText, setCommonModalOpen, setSkipRound,
    setNetConnected, setRestartInSameRoom, setUndoRound,
    setUndoRoundRequestModalOpen, setUndoRoundResponseModalOpen,
    setLoginSuccess,
    setClientIpsData, setGameInfoData, setStepInfoData, setAvatarIndex, setAvatarIndexPB,
    setMessages, setReceiveInviteModalOpen, setPublicMsgs, setNotices,
    setPeerSocketId, setCompletelyReady, currentView, chatPanelOpen }) {

    function getDeviceType() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            return DeviceType.MOBILE;
        }
        else {
            return DeviceType.PC;
        }
    }

    function setAvatar() {
        const x = Math.floor(Math.random() * Avatar_Number_X);
        const y = Math.floor(Math.random() * Avatar_Number_Y);
        setAvatarIndex([x, y]);
    }

    useEffect(() => {
        const deviceType = getDeviceType();
        setDeviceType(deviceType);
        // 设置头像
        setAvatar();

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
            socket.on("connected", () => {
                console.log('Connected to server');
                setNetConnected(true);
                // 发送token
                const token = localStorage.getItem('token');
                socket.emit('verifyToken', token);
            });

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

            socket.on('setRoomDeviceType', ({ roomDType, bWidth, bHeight, data }) => {
                setRoomDeviceType(roomDType);
                setBoardWidth(bWidth);
                setBoardHeight(bHeight);
                setSynchronized(true);
                setPeerSocketId(data.sid === socket.id ? data.asid : data.sid);
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

            socket.on('completelyReady', () => {
                setCompletelyReady(true);
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

            socket.on('login_resp', (resp) => {
                if (resp) {
                    setLoginSuccess(LoginStatus.OK);
                }
                else {
                    setLoginSuccess(LoginStatus.Failed);
                }
            });

            socket.on('tableData', ({ tableName, tableData }) => {
                setTableData(tableName, tableData);
            });

            socket.on('token', (token) => {
                localStorage.setItem('token', token);
            });

            socket.on('token_valid', (resp) => {
                if (resp) {
                    setLoginSuccess(LoginStatus.OK);
                } else {
                    setLoginSuccess(LoginStatus.LOGOUT);
                }
            });

            socket.on('set_avatar_pb', (avatarIndex) => {
                setAvatarIndexPB(avatarIndex);
            });

            socket.on('disconnect', () => {
                setNetConnected(false);
            });

            socket.on('publicMsgs', (msgs) => {
                setPublicMsgs(msgs);
            });

            socket.on('publicMsg', (msg) => {
                setPublicMsgs(prev => [...prev, msg]);
            });
            socket.on('notices', (msgs) => {
                setNotices(msgs);
            });
            socket.on('notice', (msg) => {
                setNotices(prev => [...prev, msg]);
            });
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const handleGetChatMsg = (msg) => {
            const newMessage = { text: msg, sender: 'other' };
            if (!chatPanelOpen) {
                showNotification(msg);
            }
            setMessages(prev => [...prev, newMessage]);
        }
        if (socket) {
            socket.on('chat_message', handleGetChatMsg);
            return () => {
                socket.off('chat_message', handleGetChatMsg);
            }
        }
    }, [chatPanelOpen, socket]);

    useEffect(() => {
        if (socket) {
            const handleInviteGame = () => {
                if (currentView === View.Menu) {
                    setReceiveInviteModalOpen(true);
                }
            };
            socket.on('inviteGame', handleInviteGame);
            return () => {
                socket.off('inviteGame', handleInviteGame);
            };
        }
    }, [currentView, socket]);

    function setTableData(tableName, tableData) {
        if (tableName === Table_Client_Ips) {
            setClientIpsData(tableData);
        }
        else if (tableName === Table_Game_Info) {
            setGameInfoData(tableData);
        }
        else if (tableName === Table_Step_Info) {
            setStepInfoData(tableData);
        }
    }

    return null;
}

export default Client;
