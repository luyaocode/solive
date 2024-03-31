import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Game.css';
import {
    Timer, GameLog, ItemManager, StartModal, Menu, Modal, ConfirmModal,
    TableViewer,
    ChatPanel,
    VideoChat,
    OverlayArrow, NoticeBoard, AudioIconComponent
} from './Control.jsx'
import Game from './Game.js'
import {
    GameMode, Piece_Type_Black, DeviceType, root,
    Highest_Online_Users_Background,
    LoginStatus,
    Avatar_Number_X,
    Avatar_Number_Y,
    View, PublicMsg_Max_Length, Notice_Max_Length, TitleNotice,
    GlobalSignal,
} from './ConstDefine.jsx';
import Client from './Client.jsx';
import { DraggableButton, Live2DRole } from './Tool.jsx';
import { VideoCallModal } from './Control.jsx';
import { SaveVideoModal } from './VideoChat.jsx';

function ChaosGomoku() {
    const [boardWidth, setBoardWidth] = useState(0);
    const [boardHeight, setBoardHeight] = useState(0);
    const [isRestart, setRestart] = useState(false);
    const [round, setRound] = useState(0);
    const [totalRound, setTotalRound] = useState(0);
    const [roundMoveArr, setRoundMoveArr] = useState([]);
    const [gameLog, setGameLog] = useState([[' ', null, null, null]]);
    const [items, setItems] = useState([]);
    const [seeds, setSeeds] = useState([]);     // 服务器生成的种子
    const [itemsLoading, setItemsLoading] = useState(true);
    const [itemsLoaded, setItemsLoaded] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [timeDelay, setTimeDelay] = useState(0);
    const [startModalOpen, setStartModalOpen] = useState(true);
    const [gameMode, setGameMode] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // 联机部分
    const [socket, setSocket] = useState(null);
    const [headCount, setHeadCount] = useState(0);
    const [historyPeekUsers, setHistoryPeekUsers] = useState(0);
    const [netConnected, setNetConnected] = useState(false);

    const [nickName, setNickName] = useState();     // 昵称
    const [roomId, setRoomId] = useState();         // 房间号
    const [roomIsFullModalOpen, setRoomIsFullModalOpen] = useState(false); // 房间满员
    const [pieceType, setPieceType] = useState(Piece_Type_Black); // 己方棋子颜色
    const [lastStep, setLastStep] = useState([]); // 对方棋子下的位置
    const [deviceType, setDeviceType] = useState(DeviceType.UNKNOWN);
    const [roomDeviceType, setRoomDeviceType] = useState(DeviceType.UNKNOWN);
    const [allIsOk, setAllIsOk] = useState(false);
    const [synchronized, setSynchronized] = useState(false); // 和对方同步
    const [completelyReady, setCompletelyReady] = useState(false); // 标志游戏双方是否完全准备好了
    const [peerSocketId, setPeerSocketId] = useState(); // 游戏中对方socketId
    const [matched, setMatched] = useState(false); // 匹配是否成功
    const [joined, setJoined] = useState(false); // 进入房间是否成功
    const [isPlayerLeaveRoomModalOpen, setPlayerLeaveRoomModalOpen] = useState(false);
    const [isPlayerDisconnectedModalOpen, setPlayerDisconnectedModalOpen] = useState(false);
    const [isRestartRequestModalOpen, setRestartRequestModalOpen] = useState(false);
    const [restartResponseModalOpen, setRestartResponseModalOpen] = useState(false);
    const [receiveInviteModalOpen, setReceiveInviteModalOpen] = useState(false);
    const [gameInviteAccepted, setGameInviteAccepted] = useState(false);

    // 通用弹窗
    const [commonModalText, setCommonModalText] = useState('');
    const [commonModalOpen, setCommonModalOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    const [isSkipRound, setSkipRound] = useState(false);
    const [restartInSameRoom, setRestartInSameRoom] = useState(false); // 是否在同一房间重开
    const [isUndoRound, setUndoRound] = useState(false); // 悔棋
    const [undoRoundRequestModalOpen, setUndoRoundRequestModalOpen] = useState(false);
    const [undoRoundResponseModalOpen, setUndoRoundResponseModalOpen] = useState(false);
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isLoginSuccess, setLoginSuccess] = useState(LoginStatus.LOGOUT);

    // 后端数据
    const [clientIpsData, setClientIpsData] = useState([]);
    const [gameInfoData, setGameInfoData] = useState([]);
    const [stepInfoData, setStepInfoData] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [tableViewOpen, setTableViewOpen] = useState(false);

    // 头像
    const [avatarIndex, setAvatarIndex] = useState(
        [Math.floor(Math.random() * Avatar_Number_X),
        Math.floor(Math.random() * Avatar_Number_Y)]);
    const [avatarIndexPB, setAvatarIndexPB] = useState(
        [Math.floor(Math.random() * Avatar_Number_X),
        Math.floor(Math.random() * Avatar_Number_Y)]);

    // 文本消息
    const [messages, setMessages] = useState([]);
    const [chatPanelOpen, setChatPanelOpen] = useState(false);
    const [locationData, setLocationData] = useState(null);

    // 语音通话
    const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
    const [peerAudioEnabled, setPeerAudioEnabled] = useState(true);

    // 公告板
    const [notices, setNotices] = useState([]);
    useEffect(() => {
        if (notices.length > Notice_Max_Length) {
            setNotices(prev => prev.slice(prev.length / 2));
        }
    }, [notices]);

    const [publicMsgs, setPublicMsgs] = useState([]);
    useEffect(() => {
        if (publicMsgs.length > PublicMsg_Max_Length) {
            setPublicMsgs(prev => prev.slice(prev.length / 2));
        }
    }, [publicMsgs]);

    const [currentOutsideText, setCurrentOutsideText] = useState(TitleNotice); // 公告板显示的最新消息
    const [currentMsgIndex, setCurrentMsgIndex] = useState();
    const [firstLoad, setFirstLoad] = useState(true);

    useEffect(() => {
        if (publicMsgs.length === 0) {
            return;
        }
        if (firstLoad) {
            setCurrentMsgIndex(publicMsgs.length > 10 ? publicMsgs.length - 10 : 0);
            setFirstLoad(false);
            return;
        }
        const interval = setInterval(() => {
            if (currentMsgIndex < publicMsgs.length) {
                setCurrentOutsideText(publicMsgs[currentMsgIndex]);
                setCurrentMsgIndex(prev => prev + 1);
            } else {
                setCurrentOutsideText({});
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [publicMsgs, currentMsgIndex]);

    // 系统界面
    const [currentView, setCurrentView] = useState(View.Menu);
    const [showOverlayArrow, setShowOverlayArrow] = useState(false);
    useEffect(() => {
        if (currentView === View.Menu && !isLoginModalOpen) {
            setShowOverlayArrow(true);
        }
        else {
            setShowOverlayArrow(false);
        }
    }, [currentView, isLoginModalOpen]);

    // 路由
    const { sid } = useParams(); // socketId in url
    useEffect(() => {
        if (sid && socket) {
            enterVideoChatView();
        }
    }, [sid, socket]);

    const [enterRoomTried, setEnterRoomTried] = useState(false);
    const { rid } = useParams(); // roomId in url

    // 悬浮球控制
    const [showLive2DRole, setShowLive2DRole] = useState(false);
    const [videoCallModalOpen, setVideoCallModalOpen] = useState(false);
    const [saveVideoModalOpen, setSaveVideoModalOpen] = useState(false);

    // 信号
    const [globalSignal, setGlobalSignal] = useState({});

    // 持续200ms的信号
    useEffect(() => {
        if (globalSignal && globalSignal[GlobalSignal.Active]) {
            setTimeout(() => setGlobalSignal(prev => {
                const newSignal = { ...prev };
                for (const key in newSignal) {
                    newSignal[key] = false;
                }
                return newSignal;
            }), 200);
        }
    }, [globalSignal]);

    // 获取地理位置信息
    const fetchLocation = async (api = 'https://ipinfo.io/json/') => {
        try {
            const response = await axios.get(api);
            setLocationData({
                country: response.data.country,
                region: response.data.region,
                city: response.data.city
            });
        } catch (error) {
            console.error('获取地理位置信息失败', error);
        }
    };

    useEffect(() => {
        if (!locationData) {
            fetchLocation();
        }
    }, []);

    useEffect(() => {
        if (gameInviteAccepted) {
            setGameInviteAccepted(false);
        }
    }, [gameInviteAccepted]);

    const enterVideoChatView = () => {
        setCurrentView(View.VideoChat);
    }
    const returnMenuView = () => {
        setCurrentView(View.Menu);
    }

    useEffect(() => {
        if (isUndoRound) {
            setUndoRound(false);
        }
    }, [isUndoRound]);

    useEffect(() => {
        if (isSkipRound) {
            setSkipRound(false);
        }
    }, [isSkipRound]);

    useEffect(() => {
        let delay;
        if (window.performance && window.performance.timeOrigin) {
            const pageOpenTime = window.performance.now();
            delay = 2 + (pageOpenTime > 5000 ? (pageOpenTime > 10000 ? 10 : pageOpenTime / 1000) : pageOpenTime / 1000);
        }
        else {
            delay = 3 + (Math.random() - 0.5) * 2;
        }
        setTimeDelay(delay);
        setPageLoaded(true);
    }, []);

    useEffect(() => {
        if (isRestart) {
            setRound(0);
            setTotalRound(0);
            setItems([]);
            setItemsLoaded(false);
            if (gameMode === GameMode.MODE_SIGNAL || gameMode === GameMode.MODE_AI) {
                let seeds = generateSeeds();
                setSeeds(seeds);
            } else {
                setSeeds([]);
            }
            setSynchronized(false);
            setMatched(false);
            setLastStep([]);
            if (gameMode === GameMode.MODE_SIGNAL || gameMode === GameMode.MODE_AI) {
                setAllIsOk(true);
            }
            // 清空消息
            if (!restartInSameRoom) {
                setMessages([]);
            }
        }
    }, [isRestart]);

    useEffect(() => {
        const screenWidth = window.screen.width;
        // const screenHeight = window.screen.height;
        const square_width = Math.floor(screenWidth / (1.5 * 24));
        switch (deviceType) {
            case DeviceType.MOBILE: {
                setBoardWidth(square_width);
                setBoardHeight(square_width);
                break;
            }
            case DeviceType.PC: {
                setBoardWidth(18);
                setBoardHeight(18);
                break;
            }
            default: break;
        }
    }, [deviceType]);

    useEffect(() => {
        if (gameMode === GameMode.MODE_NONE) {
            setRestartInSameRoom(false);
            setPeerSocketId();
            setCompletelyReady(false); // 清除状态
        }
        if (gameMode === GameMode.MODE_SIGNAL || gameMode === GameMode.MODE_AI) {
            setPieceType(Piece_Type_Black);
            setRoomId();
            setNickName();
            if (boardWidth !== 0 && boardHeight !== 0) {
                setAllIsOk(true);
            }
            setPeerSocketId();
        }
        // 清空消息
        setMessages([]);

        if (gameMode === GameMode.MODE_NONE) {
            setCurrentView(View.Menu);
        }
        else {
            setCurrentView(View.Game);
        }
    }, [gameMode]);

    useEffect(() => {
        if (tableViewOpen) {
            setCurrentView(View.Table);
        }
        else {
            setCurrentView(View.Menu);
        }
    }, [tableViewOpen]);

    useEffect(() => {
        if (netConnected) {
            root.style.setProperty('--highest-online-users-background', Highest_Online_Users_Background);
        }
        else {
            root.style.setProperty('--highest-online-users-background', 'gray');
        }
    }, [netConnected]);

    useEffect(() => {
        if (isLoginSuccess === LoginStatus.Failed) {
            setTimeout(() => {
                setLoginSuccess(LoginStatus.LOGOUT, 1000);
            })
        }
        else if (isLoginSuccess === LoginStatus.OK) {
            root.style.setProperty('--login-button-span-background-color', 'linear-gradient(145deg, #00ff00, #c7c7c7)')
        }
        else if (isLoginSuccess === LoginStatus.LOGOUT) {
            root.style.setProperty('--login-button-span-background-color', 'none')
        }
    }, [isLoginSuccess]);

    useEffect(() => {
        if (selectedTable) {
            socket.emit('fetchTable', selectedTable);
        }
    }, [selectedTable]);

    function generateSeeds() {
        let seeds = [];
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                let randomValue;
                do { randomValue = Math.floor(Math.random() * 100) / 100; }
                while (randomValue === 1);
                seeds.push(randomValue);
            }
        }
        return seeds;
    }

    return (
        <React.StrictMode className='game-container'>
            <DraggableButton setShowLive2DRole={setShowLive2DRole}
                showLive2DRole={showLive2DRole}
                setGlobalSignal={setGlobalSignal}
                setVideoCallModalOpen={setVideoCallModalOpen}
                deviceType={deviceType}
                setSaveVideoModalOpen={setSaveVideoModalOpen}
                globalSignal={globalSignal}
                enterVideoChatView={enterVideoChatView}
            />
            {
                receiveInviteModalOpen &&
                <ConfirmModal modalInfo='有人邀请您开始游戏，是否同意？' onOkBtnClick={() => {
                    setGameInviteAccepted(true);
                    setReceiveInviteModalOpen(false);
                }}
                    OnCancelBtnClick={() => setReceiveInviteModalOpen(false)} />
            }
            {
                true && <NoticeBoard currentView={currentView} notices={notices} publicMsgs={publicMsgs}
                    setPublicMsgs={setPublicMsgs} socket={socket} locationData={locationData}
                    fetchLocation={fetchLocation} currentOutsideText={currentOutsideText} />
            }
            {
                showOverlayArrow &&
                <OverlayArrow onClick={enterVideoChatView} currentView={currentView} />
            }
            <Client socket={socket} setSocket={setSocket} setPieceType={setPieceType} setLastStep={setLastStep} setSeeds={setSeeds}
                gameMode={gameMode} setDeviceType={setDeviceType} setRoomDeviceType={setRoomDeviceType}
                setBoardWidth={setBoardWidth} setBoardHeight={setBoardHeight} setSynchronized={setSynchronized}
                setHeadCount={setHeadCount} setHistoryPeekUsers={setHistoryPeekUsers} setRoomId={setRoomId}
                setNickName={setNickName} setMatched={setMatched} setJoined={setJoined}
                setStartModalOpen={setStartModalOpen}
                setPlayerLeaveRoomModalOpen={setPlayerLeaveRoomModalOpen}
                setPlayerDisconnectedModalOpen={setPlayerDisconnectedModalOpen}
                setRestartRequestModalOpen={setRestartRequestModalOpen} setRestart={setRestart}
                setRestartResponseModalOpen={setRestartResponseModalOpen} setAllIsOk={setAllIsOk}
                setCommonModalText={setCommonModalText} setCommonModalOpen={setCommonModalOpen}
                setSkipRound={setSkipRound} setNetConnected={setNetConnected}
                setRestartInSameRoom={setRestartInSameRoom} setUndoRound={setUndoRound}
                setUndoRoundRequestModalOpen={setUndoRoundRequestModalOpen}
                setUndoRoundResponseModalOpen={setUndoRoundResponseModalOpen}
                setLoginSuccess={setLoginSuccess}
                setClientIpsData={setClientIpsData} setGameInfoData={setGameInfoData} setStepInfoData={setStepInfoData}
                setAvatarIndex={setAvatarIndex} setAvatarIndexPB={setAvatarIndexPB}
                setMessages={setMessages} setReceiveInviteModalOpen={setReceiveInviteModalOpen}
                setPublicMsgs={setPublicMsgs} setNotices={setNotices} setPeerSocketId={setPeerSocketId}
                setCompletelyReady={setCompletelyReady} currentView={currentView} chatPanelOpen={chatPanelOpen}
            />
            {
                gameMode === GameMode.MODE_NONE && (
                    <>
                        {tableViewOpen ?
                            <TableViewer {...{
                                socket,
                                selectedTable, setSelectedTable, clientIpsData, gameInfoData, stepInfoData, setTableViewOpen,
                                setLoginSuccess, logoutModalOpen, setLogoutModalOpen
                            }} /> : (currentView === View.Menu ?
                                (<Menu enterRoomTried={enterRoomTried} setEnterRoomTried={setEnterRoomTried}
                                    setRoomIsFullModalOpen={setRoomIsFullModalOpen} rid={rid} setGameMode={setGameMode} setItemsLoading={setItemsLoading} setStartModalOpen={setStartModalOpen}
                                    socket={socket} setNickName={setNickName} setRoomId={setRoomId} setSeeds={setSeeds}
                                    deviceType={deviceType} boardWidth={boardWidth} boardHeight={boardHeight}
                                    headCount={headCount} historyPeekUsers={historyPeekUsers} netConnected={netConnected}
                                    generateSeeds={generateSeeds} isLoginModalOpen={isLoginModalOpen} setLoginModalOpen={setLoginModalOpen}
                                    isLoginSuccess={isLoginSuccess} selectedTable={selectedTable} setSelectedTable={setSelectedTable}
                                    setTableViewOpen={setTableViewOpen} avatarIndex={avatarIndex} setShowOverlayArrow={setShowOverlayArrow}
                                    gameInviteAccepted={gameInviteAccepted} locationData={locationData} />
                                ) :
                                (currentView === View.VideoChat ?
                                    <VideoChat sid={sid} deviceType={deviceType} socket={socket} returnMenuView={returnMenuView}
                                        messages={messages} setMessages={setMessages} chatPanelOpen={chatPanelOpen} setChatPanelOpen={setChatPanelOpen}
                                        globalSignal={globalSignal} videoCallModalOpen={videoCallModalOpen}
                                        setVideoCallModalOpen={setVideoCallModalOpen} />
                                    : null
                                )
                            )
                        }
                    </>)
            }
            {
                gameMode !== GameMode.MODE_NONE && (
                    <>
                        {completelyReady &&
                            <>
                                <AudioIconComponent audioEnabled={localAudioEnabled} setAudioEnabled={setLocalAudioEnabled} isAnother={false} />
                                <AudioIconComponent audioEnabled={peerAudioEnabled} setAudioEnabled={setPeerAudioEnabled} isAnother={true} />
                            </>
                        }
                        {
                            peerSocketId &&
                            <div className='audio-call'>
                                <VideoChat deviceType={deviceType} socket={socket} returnMenuView={returnMenuView}
                                    peerSocketId={peerSocketId} pieceType={pieceType}
                                    localAudioEnabled={localAudioEnabled} setPeerAudioEnabled={setPeerAudioEnabled} />
                            </div>
                        }
                        <ItemManager pageLoaded={pageLoaded} isRestart={isRestart} timeDelay={timeDelay}
                            items={items} setItems={setItems} itemsLoaded={itemsLoaded} setItemsLoaded={setItemsLoaded}
                            seeds={seeds} gameMode={gameMode} />
                        {itemsLoading && allIsOk && itemsLoaded ? (
                            <>
                                <Timer isRestart={isRestart} setRestart={setRestart} round={round} totalRound={totalRound}
                                    nickName={nickName} roomId={roomId} />
                                <Game boardWidth={boardWidth} boardHeight={boardHeight} items={items} setItems={setItems} setRestart={setRestart} round={round} setRound={setRound}
                                    roundMoveArr={roundMoveArr} setRoundMoveArr={setRoundMoveArr}
                                    totalRound={totalRound} setTotalRound={setTotalRound}
                                    gameLog={gameLog} setGameLog={setGameLog} isRestart={isRestart} gameMode={gameMode} setGameMode={setGameMode} GameMode={GameMode}
                                    socket={socket} pieceType={pieceType} lastStep={lastStep} seeds={seeds}
                                    deviceType={deviceType} roomDeviceType={roomDeviceType}
                                    isPlayerLeaveRoomModalOpen={isPlayerLeaveRoomModalOpen} setPlayerLeaveRoomModalOpen={setPlayerLeaveRoomModalOpen}
                                    isPlayerDisconnectedModalOpen={isPlayerDisconnectedModalOpen} setPlayerDisconnectedModalOpen={setPlayerDisconnectedModalOpen}
                                    gameOver={gameOver} setGameOver={setGameOver}
                                    isRestartRequestModalOpen={isRestartRequestModalOpen} setRestartRequestModalOpen={setRestartRequestModalOpen}
                                    restartResponseModalOpen={restartResponseModalOpen} setRestartResponseModalOpen={setRestartResponseModalOpen}
                                    isSkipRound={isSkipRound} setSkipRound={setSkipRound} setRestartInSameRoom={setRestartInSameRoom}
                                    isUndoRound={isUndoRound}
                                    setUndoRoundRequestModalOpen={setUndoRoundRequestModalOpen}
                                    avatarIndex={avatarIndex} avatarIndexPB={avatarIndexPB} setChatPanelOpen={setChatPanelOpen}
                                    completelyReady={completelyReady}
                                />
                                <GameLog isRestart={isRestart} gameLog={gameLog} setGameLog={setGameLog}
                                    roomId={roomId} nickName={nickName} setChatPanelOpen={setChatPanelOpen}
                                    gameMode={gameMode} />
                                {commonModalOpen &&
                                    <Modal modalInfo={commonModalText} setModalOpen={setCommonModalOpen} />
                                }
                                {undoRoundRequestModalOpen &&
                                    <Modal modalInfo='等待对方回应...' setModalOpen={setUndoRoundRequestModalOpen} timeDelay={false} />
                                }
                                {
                                    undoRoundResponseModalOpen &&
                                    <ConfirmModal modalInfo='对方请求悔棋，是否同意？' onOkBtnClick={() => {
                                        socket.emit('undoRoundResponse', true);
                                        setUndoRoundResponseModalOpen(false);
                                    }} OnCancelBtnClick={() => {
                                        socket.emit('undoRoundResponse', false);
                                        setUndoRoundResponseModalOpen(false);
                                    }
                                    } />
                                }
                                {
                                    chatPanelOpen &&
                                    <ChatPanel messages={messages} setMessages={setMessages} setChatPanelOpen={setChatPanelOpen} ncobj={socket} />}
                            </>
                        ) : (
                            startModalOpen &&
                            <StartModal
                                roomIsFullModalOpen={roomIsFullModalOpen} setRoomIsFullModalOpen={setRoomIsFullModalOpen} isRestart={isRestart} setStartModalOpen={setStartModalOpen}
                                setItemsLoading={setItemsLoading} gameMode={gameMode} setGameMode={setGameMode} socket={socket} matched={matched}
                                joined={joined} setAllIsOk={setAllIsOk} restartInSameRoom={restartInSameRoom} roomId={roomId} headCount={headCount} />
                        )}
                    </>)
            }
            {deviceType === DeviceType.PC && !sid &&
                < div style={{
                    display: (showLive2DRole ? 'block' : 'none'),
                    zIndex: 2,
                }}>
                    <Live2DRole />
                </div>
            }
            {/* Modal */}
            {
                saveVideoModalOpen &&
                <SaveVideoModal
                    globalSignal={globalSignal}
                    setGlobalSignal={setGlobalSignal}
                    setSaveVideoModalOpen={setSaveVideoModalOpen}
                />
            }

        </React.StrictMode >
    );
}


export default ChaosGomoku;
