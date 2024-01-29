import React, { useState, useEffect } from 'react';
import './App.css';
import Timer from './Control.jsx'
import Game from './App.js'

function ChaosGomoku() {
    const [isRestart, setRestart] = useState(false);
    const [round, setRound] = useState(0);
    const [totalRound, setTotalRound] = useState(0);
    const [roundMoveArr, setRoundMoveArr] = useState([]);

    return (
        <React.StrictMode className='game-container'>
            <Timer isRestart={isRestart} setRestart={setRestart} round={round} totalRound={totalRound} />
            <Game isRestart={isRestart} setRestart={setRestart} round={round} setRound={setRound}
                roundMoveArr={roundMoveArr} setRoundMoveArr={setRoundMoveArr}
                totalRound={totalRound} setTotalRound={setTotalRound} />
        </React.StrictMode>
    );
}


export default ChaosGomoku;
