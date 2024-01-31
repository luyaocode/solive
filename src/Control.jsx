import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import './Game.css';
import { GameMode } from './ConstDefine.jsx'
import { Howl } from 'howler';
import {
    Sword, Shield, Bow, InfectPotion, TimeBomb, XFlower
    , FreezeSpell
} from './Item.ts';

import _ from 'lodash';

function Timer({ isRestart, setRestart, round, totalRound }) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    useEffect(() => {
        let interval;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds((seconds) => seconds + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        if (isRestart) {
            setSeconds(0);
            setRestart(false);
        }
        return () => clearInterval(interval);
    }, [isActive, isRestart]);

    let hour = Math.floor(seconds / 3600);
    if (hour < 10) {
        hour = '0' + hour;
    }
    let minute = Math.floor((seconds - hour * 3600) / 60);
    if (minute < 10) {
        minute = '0' + minute;
    }
    let second = seconds - hour * 3600 - minute * 60;
    if (second < 10) {
        second = '0' + second;
    }
    return (
        <div className="timer">
            <span>开局时间: {hour}:{minute}:{second}</span><span className='span-blank'></span>
            <span>当前回合: {round}/{totalRound}</span>
        </div>

    );
}

function GameLog({ isRestart, gameLog, setGameLog }) {
    const [isActive, setIsActive] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (isActive) {

        }
        if (isRestart) {
            setGameLog([[' ', null, null, null]]);
        }
    }, [isActive, isRestart]);

    const allInfo = (
        <ol>
            {gameLog.map((e, i) => {
                if (i === 0) {
                    return null;
                }
                let logSpanStyle;
                if (e[1].type === '●') {
                    logSpanStyle = 'gamelog-black-piece';
                }
                else if (e[1].type === '○') {
                    logSpanStyle = 'gamelog-white-piece';
                }
                return (
                    <li key={i} className={logSpanStyle}>
                        {e[0]}
                    </li>
                );
            })}
        </ol>
    );

    const showAll = () => {
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
    }

    const handleCloseModalOutside = (e) => {
        if (e.target.classList.contains('gamelog-modal-overlay')) {
            setModalOpen(false);
        }
    };
    return (
        <>
            <Button className='gamelog-button' onClick={showAll}>{gameLog[gameLog.length - 1][0]}</Button>
            {isModalOpen && (
                <div className="gamelog-modal-overlay" onClick={handleCloseModalOutside}>
                    <div className="gamelog-modal">
                        <span className="gamelog-modal-close-btn" onClick={closeModal}>X</span>
                        <h4>本局记录：</h4>
                        <p>{allInfo}</p>
                    </div>
                </div>
            )}
        </>
    );
}

function ItemInfo({ item }) {
    const [isModalOpen, setModalOpen] = useState(false);

    const itemName = item.cname;
    const itemInfo = item.info;
    const onButtonClick = () => {
        setModalOpen(true);
    }
    const closeModal = () => {
        setModalOpen(false);
    }

    const handleCloseModalOutside = (e) => {
        if (e.target.classList.contains('item-info-overlay') ||
            e.target.classList.contains('game-board')) {
            setModalOpen(false);
        }
    };

    return (
        <>
            <button className='item-name-button' onClick={onButtonClick}>
                {itemName}
            </button>
            {isModalOpen && (
                <div className="item-info-overlay" onClick={handleCloseModalOutside}>
                    <div className="item-info">
                        <span className="item-info-close-btn" onClick={closeModal}>X</span>
                        <h4>{itemName}：</h4>
                        <p>{itemInfo}</p>
                    </div>
                </div>
            )}
        </>
    );
}

function MusicPlayer({ audioSrc, isRestart }) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [description, setDescription] = useState('暂停背景音乐');
    const [volume, setVolume] = useState(0.3);
    const audioSrc1 = 'audio/bgm/cruising-down-8bit-lane.mp3';
    const audioSrc2 = 'audio/bgm/after_the_rain.mp3';
    const soundRef = useRef(null);

    const playMusic = () => {
        if (isPlaying) {
            soundRef.current.pause();
            setDescription('播放背景音乐');
            setIsPlaying(false);
        }
        else {
            soundRef.current.play();
            setDescription('暂停背景音乐');
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        let src;
        if (Math.random() < 0.5) {
            src = audioSrc1;
        }
        else {
            src = audioSrc2;
        }
        soundRef.current = new Howl({
            src: [src],
            volume: volume,
            loop: true,
        });
        if (soundRef.current) {
            soundRef.current.play();
        }
        return () => {
            if (soundRef.current) {
                soundRef.current.stop();
                soundRef.current.unload();
            }
        };
    }, [volume, isRestart]);
    return (
        <button className="button-normal" onClick={playMusic}>{description}</button>
    );
};


const ITEM_INIT_SIZE = 18 * 18;
const ITEM_MIN_SIZE = 100;
const ITEM_LOAD_PER_TIME = 100;
const sword = new Sword();
const shield = new Shield();
const bow = new Bow();
const infectPotion = new InfectPotion();
const timeBomb = new TimeBomb();
const xFlower = new XFlower();
const freezeSpell = new FreezeSpell();
let its = [sword, shield, bow, infectPotion, timeBomb, xFlower, freezeSpell];
// const weights = {
//     sword: 20,
//     shield: 18,
//     bow: 15,
//     infectPotion: 14,
//     timeBomb: 13,
//     xFlower: 9,
//     freezeSpell: 11,
// };
const weights = {
    sword: 10,
    shield: 0,
    bow: 0,
    infectPotion: 0,
    timeBomb: 10,
    xFlower: 0,
    freezeSpell: 0,
};
function ItemManager({ pageLoaded, isRestart, timeDelay, items, setItems, setItemsLoaded }) {
    useEffect(() => {
        let timerId;
        if (pageLoaded) {
            timerId = setTimeout(() => {
                createInitItems();
                setItemsLoaded(true);
            }, timeDelay * 1000);
        }

        return () => {
            clearTimeout(timerId);
        };
    }, [isRestart, pageLoaded]);

    function getItem() {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        const randomValue = Math.random() * totalWeight;
        let selectedElement;
        let cumulativeWeight = 0;
        for (const element of its) {
            cumulativeWeight += weights[element.name];
            if (randomValue <= cumulativeWeight) {
                selectedElement = element;
                break;
            }
        }
        return selectedElement;
    }

    function createInitItems() {
        let temp = [];
        for (let i = 0; i < ITEM_INIT_SIZE; i++) {
            const item = _.cloneDeep(getItem());
            temp.push(item);
        }
        setItems(temp);
    }

    function loadMoreItems() {
        let temp = [];
        for (let i = 0; i < ITEM_LOAD_PER_TIME; i++) {
            const item = _.cloneDeep(getItem());
            temp.push(item);
        }
        setItems(prevItems => [...prevItems, temp]);
    };

    useEffect(() => {
        if (items.length < ITEM_MIN_SIZE) {
            loadMoreItems();
        }
    }, [items]);
    return null;
}

function StartModal({ setStartModalOpen, setItemsLoading, setGameMode }) {
    const [description, setDescription] = useState('棋盘加载中...');
    function onCancelButtonClick() {
        setItemsLoading(false);
        setStartModalOpen(false);
        setGameMode(GameMode.MODE_NONE);
    }
    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p className="loading-text">{description}</p>
            <button className="cancel-button" onClick={onCancelButtonClick}>取消加载</button>
        </div>
    );
}

function Footer() {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        fetch('https://api.github.com/users/luyaocode')
            .then(response => response.json())
            .then(data => setUserData(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    return (
        <footer className="menu-footer">
            {userData && (
                <div className="github-info">
                    <img src={userData.avatar_url} alt="GitHub Avatar" className="github-avatar" />
                    <div>
                        <a href="https://github.com/luyaocode/chaos-gomoku" target="_blank" rel="noopener noreferrer">Chaos Gomoku</a>
                    </div>
                </div>
            )}
        </footer>
    );
}

function FancyTitle({ text }) {
    useEffect(() => {
        const title = document.querySelector('.menu-header h1');

        const titleText = title.innerText;
        const letters = titleText.split('');

        title.innerHTML = '';
        letters.forEach((letter, index) => {
            const span = document.createElement('span');
            span.textContent = letter;
            span.classList.add(`letter-${index}`);
            span.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`;
            span.style.animationName = `shake-${Math.random() > 0.5 ? 'x' : 'y'}`;
            title.appendChild(span);
        });
    }, []);

    return (
        <div className="menu-header">
            <h1>{text}</h1>
        </div>
    );
}

function FancyTitle2({ text }) {
    useEffect(() => {
        const title = document.querySelector('.menu-header2 h1');

        // 获取标题文本并分割成单个字母
        const titleText = title.innerText;
        const letters = titleText.split('');

        title.innerHTML = '';
        // 为每个字母创建随机动画
        letters.forEach((letter, index) => {
            const span = document.createElement('span');
            span.textContent = letter;
            span.classList.add(`letter-${index}`);
            span.style.animationDuration = `${Math.random() * 0.5 + 0.5}s`; // 随机动画持续时间
            span.style.animationName = `shake-${Math.random() > 0.5 ? 'x' : 'y'}`; // 随机选择X或Y轴抖动

            title.appendChild(span);
        });
    }, []);

    return (
        <div className="menu-header2">
            <h1>{text}</h1>
        </div>
    );
}

function Menu({ setGameMode, setItemsLoading, setStartModalOpen }) {
    const cTitle = '混乱五子棋';
    const title = 'Chaos Gomoku';
    function onButtonClick(mode) {
        setGameMode(mode);
        setItemsLoading(true);
        setStartModalOpen(true);
    }
    return (
        <div className="menu-container">
            <div>
                <FancyTitle text={cTitle} />
                <FancyTitle2 text={title} />
            </div>
            <div className="menu-items">
                <div className="menu-item">
                    {/* <img src="item1.jpg" alt="Item 1" /> */}
                    <h2>单机</h2>
                    <p>模式介绍：...</p>
                    <button onClick={() => onButtonClick(GameMode.MODE_SIGNAL)}>开始游戏</button>
                </div>
                <div className="menu-item">
                    {/* <img src="item2.jpg" alt="Item 2" /> */}
                    <h2>联机</h2>
                    <p>模式介绍：...</p>
                    <button onClick={() => onButtonClick(GameMode.MODE_MATCH)}>匹配模式</button>
                    <button onClick={() => onButtonClick(GameMode.MODE_ROOM)}>房间模式</button>
                </div>
            </div>
            <Footer />
        </div>
    );
}

function ConfirmModal({ modalInfo, onOkBtnClick, OnCancelBtnClick }) {
    function closeModal() {
        OnCancelBtnClick();
    }
    return (
        <div className="modal-overlay">
            <div className="modal">
                <span className="close-button" onClick={closeModal}>
                    &times;
                </span>
                <p>{modalInfo}</p>
                <div className='button-confirm-container'>
                    <Button onClick={onOkBtnClick}>确定</Button>
                    <Button onClick={OnCancelBtnClick}>取消</Button>
                </div>

            </div>
        </div>
    );
}


export { Timer, GameLog, ItemInfo, MusicPlayer, ItemManager, StartModal, Menu, ConfirmModal };