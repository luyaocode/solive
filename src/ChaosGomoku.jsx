import React, { useEffect, useState } from 'react';
import './Game.css';
import { Timer, GameLog, ItemManager, StartModal, Menu } from './Control.jsx'
import Game from './Game.js'
import { GameMode, Piece_Type_Black, DeviceType } from './ConstDefine.jsx'
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
    const [socket, setSocket] = useState(null);
    // 联机部分
    const [headCount, setHeadCount] = useState(0);
    const [historyPeekUsers, setHistoryPeekUsers] = useState(0);

    const [nickName, setNickName] = useState();     // 昵称
    const [roomId, setRoomId] = useState();         // 房间号
    const [pieceType, setPieceType] = useState(Piece_Type_Black); // 己方棋子颜色
    const [lastStep, setLastStep] = useState([]); // 对方棋子下的位置
    const [deviceType, setDeviceType] = useState(DeviceType.UNKNOWN);
    const [roomDeviceType, setRoomDeviceType] = useState(DeviceType.UNKNOWN);
    const [allIsOk, setAllIsOk] = useState(false);
    const [synchronized, setSynchronized] = useState(false); // 和对方同步
    const [matched, setMatched] = useState(false); // 匹配是否成功
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
        }
    }, [isRestart]);

    useEffect(() => {
        const screenWidth = window.screen.width;
        // const screenHeight = window.screen.height;
        const square_width = Math.floor(screenWidth / (1.39 * 24));
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
        if (gameMode === GameMode.MODE_SIGNAL) {
            if (boardWidth !== 0 && boardHeight !== 0) {
                setAllIsOk(true);
            }
        }
    }, [gameMode]);

    useEffect(() => {
        if (synchronized) {
            setAllIsOk(true);

        }
    }, [synchronized]);

    return (
        <React.StrictMode className='game-container'>
            <Client setSocket={setSocket} setPieceType={setPieceType} setLastStep={setLastStep} setSeeds={setSeeds}
                gameMode={gameMode} setDeviceType={setDeviceType} setRoomDeviceType={setRoomDeviceType}
                setBoardWidth={setBoardWidth} setBoardHeight={setBoardHeight} setSynchronized={setSynchronized}
                setHeadCount={setHeadCount} setHistoryPeekUsers={setHistoryPeekUsers} setRoomId={setRoomId}
                setNickName={setNickName} setMatched={setMatched}
            />
            {gameMode === GameMode.MODE_NONE && (
                <>
                    <Menu setGameMode={setGameMode} setItemsLoading={setItemsLoading} setStartModalOpen={setStartModalOpen}
                        socket={socket} setNickName={setNickName} setRoomId={setRoomId} setSeeds={setSeeds}
                        deviceType={deviceType} boardWidth={boardWidth} boardHeight={boardHeight}
                        headCount={headCount} historyPeekUsers={historyPeekUsers} />
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
                            />
                            <GameLog isRestart={isRestart} gameLog={gameLog} setGameLog={setGameLog} />
                        </>
                    ) : (
                        startModalOpen &&
                        <StartModal setStartModalOpen={setStartModalOpen} setItemsLoading={setItemsLoading} setGameMode={setGameMode} />
                    )}
                </>)}

        </React.StrictMode>
    );
}


export default ChaosGomoku;
