import React, { useEffect, useState } from 'react';
import './Game.css';
import { Timer, GameLog, ItemManager, StartModal, Menu, Modal } from './Control.jsx'
import Game from './Game.js'
import {
    GameMode, Piece_Type_Black, DeviceType, root,
    Highest_Online_Users_Background
} from './ConstDefine.jsx'
import Client from './Client.jsx'

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
    const [pieceType, setPieceType] = useState(Piece_Type_Black); // 己方棋子颜色
    const [lastStep, setLastStep] = useState([]); // 对方棋子下的位置
    const [deviceType, setDeviceType] = useState(DeviceType.UNKNOWN);
    const [roomDeviceType, setRoomDeviceType] = useState(DeviceType.UNKNOWN);
    const [allIsOk, setAllIsOk] = useState(false);
    const [synchronized, setSynchronized] = useState(false); // 和对方同步
    const [matched, setMatched] = useState(false); // 匹配是否成功
    const [joined, setJoined] = useState(false); // 进入房间是否成功
    const [isPlayerLeaveRoomModalOpen, setPlayerLeaveRoomModalOpen] = useState(false);
    const [isPlayerDisconnectedModalOpen, setPlayerDisconnectedModalOpen] = useState(false);
    const [isRestartRequestModalOpen, setRestartRequestModalOpen] = useState(false);
    const [restartResponseModalOpen, setRestartResponseModalOpen] = useState(false);

    // 通用弹窗
    const [commonModalText, setCommonModalText] = useState('');
    const [commonModalOpen, setCommonModalOpen] = useState(false);

    const [isSkipRound, setSkipRound] = useState(false);
    const [restartInSameRoom, setRestartInSameRoom] = useState(false);
    // useEffect(() => {
    //     if (restartInSameRoom) {
    //         setTimeout(() => setRestartInSameRoom(false), 1000);
    //     }
    // }, [restartInSameRoom]);

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
            if (gameMode === GameMode.MODE_SIGNAL) {
                let seeds = generateSeeds();
                setSeeds(seeds);
            } else {
                setSeeds([]);
            }
            setSynchronized(false);
            setMatched(false);
            setLastStep([]);
            if (gameMode === GameMode.MODE_SIGNAL) {
                setAllIsOk(true);
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
        }
        if (gameMode === GameMode.MODE_SIGNAL) {
            setPieceType(Piece_Type_Black);
            setRoomId();
            setNickName();
            if (boardWidth !== 0 && boardHeight !== 0) {
                setAllIsOk(true);
            }
        }
    }, [gameMode]);

    useEffect(() => {
        if (netConnected) {
            root.style.setProperty('--highest-online-users-background', Highest_Online_Users_Background);
        }
        else {
            root.style.setProperty('--highest-online-users-background', 'gray');
        }
    }, [netConnected]);

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
            <Client setSocket={setSocket} setPieceType={setPieceType} setLastStep={setLastStep} setSeeds={setSeeds}
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
                setRestartInSameRoom={setRestartInSameRoom}
            />
            {gameMode === GameMode.MODE_NONE && (
                <>
                    <Menu setGameMode={setGameMode} setItemsLoading={setItemsLoading} setStartModalOpen={setStartModalOpen}
                        socket={socket} setNickName={setNickName} setRoomId={setRoomId} setSeeds={setSeeds}
                        deviceType={deviceType} boardWidth={boardWidth} boardHeight={boardHeight}
                        headCount={headCount} historyPeekUsers={historyPeekUsers} netConnected={netConnected}
                        generateSeeds={generateSeeds} />
                </>)
            }
            {gameMode !== GameMode.MODE_NONE && (
                <>
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
                                isSkipRound={isSkipRound} setRestartInSameRoom={setRestartInSameRoom}
                            />
                            <GameLog isRestart={isRestart} gameLog={gameLog} setGameLog={setGameLog}
                                roomId={roomId} nickName={nickName} />
                            {commonModalOpen &&
                                <Modal modalInfo={commonModalText} setModalOpen={setCommonModalOpen} />
                            }
                        </>
                    ) : (
                        startModalOpen &&
                        <StartModal isRestart={isRestart} setStartModalOpen={setStartModalOpen} setItemsLoading={setItemsLoading} gameMode={gameMode} setGameMode={setGameMode} socket={socket} matched={matched}
                            joined={joined} setAllIsOk={setAllIsOk} restartInSameRoom={restartInSameRoom} />
                    )}
                </>)}

        </React.StrictMode>
    );
}


export default ChaosGomoku;
