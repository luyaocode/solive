import React, { useState, useEffect } from 'react';
import './Game.css';
import { Timer, GameLog } from './Control.jsx'
import Game from './Game.js'

function ChaosGomoku() {
    const [isRestart, setRestart] = useState(false);
    const [round, setRound] = useState(0);
    const [totalRound, setTotalRound] = useState(0);
    const [roundMoveArr, setRoundMoveArr] = useState([]);
    const [gameLog, setGameLog] = useState([[' ', null, null, null]]);

    return (
        <React.StrictMode className='game-container'>
            <Timer isRestart={isRestart} setRestart={setRestart} round={round} totalRound={totalRound} />
            <Game setRestart={setRestart} round={round} setRound={setRound}
                roundMoveArr={roundMoveArr} setRoundMoveArr={setRoundMoveArr}
                totalRound={totalRound} setTotalRound={setTotalRound}
                gameLog={gameLog} setGameLog={setGameLog} />
            <GameLog isRestart={isRestart} gameLog={gameLog} setGameLog={setGameLog} />
        </React.StrictMode>
    );
}


export default ChaosGomoku;
