import React, { useEffect, useState } from 'react';
import './Game.css';
import { Timer, GameLog, ItemManager, StartModal, Menu } from './Control.jsx'
import Game from './Game.js'
import { GameMode, Piece_Type_Black } from './ConstDefine.jsx'
import Client from './Client.jsx'

function ChaosGomoku() {
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
    const [nickName, setNickName] = useState();     // 昵称
    const [roomId, setRoomId] = useState();         // 房间号
    const [pieceType, setPieceType] = useState(Piece_Type_Black); // 己方棋子颜色
    const [lastStep, setLastStep] = useState([]); // 对方棋子下的位置
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
    return (
        <React.StrictMode className='game-container'>
            <Client setSocket={setSocket} setPieceType={setPieceType} setLastStep={setLastStep} setSeeds={setSeeds}
                gameMode={gameMode}
            />
            {gameMode === GameMode.MODE_NONE && (
                <>
                    <Menu setGameMode={setGameMode} setItemsLoading={setItemsLoading} setStartModalOpen={setStartModalOpen}
                        socket={socket} setNickName={setNickName} setRoomId={setRoomId} setSeeds={setSeeds} />
                </>)
            }
            {gameMode !== GameMode.MODE_NONE && (
                <>
                    <ItemManager pageLoaded={pageLoaded} isRestart={isRestart} timeDelay={timeDelay}
                        items={items} setItems={setItems} setItemsLoaded={setItemsLoaded}
                        seeds={seeds} gameMode={gameMode} />
                    {itemsLoading && itemsLoaded ? (
                        <>
                            <Timer isRestart={isRestart} setRestart={setRestart} round={round} totalRound={totalRound}
                                nickName={nickName} roomId={roomId} />
                            <Game items={items} setItems={setItems} setRestart={setRestart} round={round} setRound={setRound}
                                roundMoveArr={roundMoveArr} setRoundMoveArr={setRoundMoveArr}
                                totalRound={totalRound} setTotalRound={setTotalRound}
                                gameLog={gameLog} setGameLog={setGameLog} isRestart={isRestart} gameMode={gameMode} setGameMode={setGameMode} GameMode={GameMode}
                                socket={socket} pieceType={pieceType} lastStep={lastStep} seeds={seeds}
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
