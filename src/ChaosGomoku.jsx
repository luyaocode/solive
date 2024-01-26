import React, { useState, useEffect } from 'react';
import './App.css';
import Timer from './Control.jsx'
import Game from './App.js'

function ChaosGomoku() {
    const [isRestart, setRestart] = useState(false);
    return (
        <React.StrictMode className='game-container'>
            <Timer isRestart={isRestart} />
            <Game setRestart={setRestart} />
        </React.StrictMode>
    );
}


export default ChaosGomoku;
