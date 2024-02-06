import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Form, Space } from 'antd';
import './Game.css';
import { GameMode, GlobalCtx } from './ConstDefine.jsx'
import { Howl } from 'howler';
import {
    Sword, Shield, Bow, InfectPotion, TimeBomb, XFlower
    , FreezeSpell
} from './Item.ts';

import _ from 'lodash';

function Timer({ isRestart, setRestart, round, totalRound, nickName, roomId }) {
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
            <span>当前回合: {round}/{totalRound}</span><span className='span-blank'></span>
        </div>

    );
}

function GameLog({ isRestart, gameLog, setGameLog, roomId, nickName }) {
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
            <span>房间号: {roomId}</span><span className='span-blank'></span>
            <span>昵称: {nickName}</span>
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

    let name, cname, info;
    if (item) {
        name = item.name;
        cname = item.cname;
        info = item.info;
    }

    return (
        <>
            <button className='item-name-button' onClick={onButtonClick}>
                {cname}
            </button>
            {isModalOpen && (
                <div className="item-info-overlay" onClick={handleCloseModalOutside}>
                    <div className="item-info">
                        <span className="item-info-close-btn" onClick={closeModal}>X</span>
                        <h4>{name}：</h4>
                        <p>{info}</p>
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


const ITEM_INIT_SIZE = 200;
const ITEM_MIN_SIZE = 10;
const ITEM_LOAD_PER_TIME = 100;
const sword = new Sword();
const shield = new Shield();
const bow = new Bow();
const infectPotion = new InfectPotion();
const timeBomb = new TimeBomb();
const xFlower = new XFlower();
const freezeSpell = new FreezeSpell();
let its = [sword, shield, bow, infectPotion, timeBomb, xFlower, freezeSpell];
const weights = {
    sword: 20,
    shield: 18,
    bow: 15,
    infectPotion: 14,
    timeBomb: 13,
    xFlower: 9,
    freezeSpell: 11,
};
// const weights = {
//     sword: 10,
//     shield: 0,
//     bow: 0,
//     infectPotion: 0,
//     timeBomb: 0,
//     xFlower: 0,
//     freezeSpell: 0,
// };
function ItemManager({ pageLoaded, isRestart, timeDelay, items, setItems, itemsLoaded, setItemsLoaded,
    seeds, gameMode }) {
    useEffect(() => {
        if (gameMode === GameMode.MODE_ROOM || gameMode === GameMode.MODE_MATCH) {
            return;
        }
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

    useEffect(() => {
        if (seeds.length > 0) {
            createInitItems();
            setItemsLoaded(true);
        }
    }, [seeds]);

    function getItem(seed) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        // let random;
        // if (gameMode === GameMode.MODE_ROOM || gameMode === GameMode.MODE_MATCH) {
        //     random = seed;
        // }
        // else {
        //     random = Math.random();
        // }
        const randomValue = seed * totalWeight;
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
            const seed = seeds[i];
            const item = _.cloneDeep(getItem(seed));
            temp.push(item);
        }
        // for (let i = 0; i < temp.length; i++) {
        //     let item = temp[i];
        //     console.log(i + '：' + item.name);
        // }
        setItems(temp);
    }

    function loadMoreItems() {
        let temp = [];
        for (let i = 0; i < ITEM_LOAD_PER_TIME; i++) {
            const seed = seeds[i];
            const item = _.cloneDeep(getItem(seed));
            temp.push(item);
        }
        // for (let i = 0; i < temp.length; i++) {
        //     let item = temp[i];
        //     console.log('more:' + i + '：' + item.name);
        // }
        setItems(prevItems => [...prevItems, temp]);
    };

    useEffect(() => {
        if (!itemsLoaded) {
            return;
        }
        if (items.length < ITEM_MIN_SIZE) {
            loadMoreItems();
        }
    }, [items]);
    return null;
}

function StartModal({ isRestart, setStartModalOpen, setItemsLoading, gameMode, setGameMode, socket, matched,
    joined, setAllIsOk }) {
    const [isModalOpen, setModalOpen] = useState(false);
    let text, text2;
    switch (gameMode) {
        case GameMode.MODE_SIGNAL:
            {
                text = '正在加载棋盘...'
                text2 = '加载成功';
                break;
            }
        case GameMode.MODE_MATCH:
            {
                text = '正在匹配...';
                text2 = '匹配成功';
                break;
            }
        case GameMode.MODE_ROOM:
            {
                text = '正在进入房间...'
                text2 = '进入成功';
                break;
            }
        default: {
            break;
        }
    }
    const [description, setDescription] = useState(text);
    const [secondText, setSecondText] = useState(text2);
    function onCancelButtonClick() {
        setItemsLoading(false);
        setStartModalOpen(false);
        //
        if (gameMode === GameMode.MODE_ROOM) {
            socket.emit('leaveRoom');
        }
        else if (gameMode === GameMode.MODE_MATCH) {
            socket.emit('exitMatching');
        } else {
        }
        setGameMode(GameMode.MODE_NONE);
    }

    useEffect(() => {
        if (matched || joined) {
            setModalOpen(true);
        }
    }, [matched, joined]);

    useEffect(() => {
        if (isRestart) {
            setDescription('正在重新开始');
            setModalOpen(false);
            setAllIsOk(true);
        }
    }, [isRestart]);

    return (
        <>
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">{description}</p>
                <button className="cancel-button" onClick={onCancelButtonClick}>取消</button>
            </div>
            {isModalOpen &&
                <Modal modalInfo={secondText} setModalOpen={setModalOpen} timeDelay={1000} afterDelay={() => setAllIsOk(true)} />}
        </>
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
                        <a href="https://github.com/luyaocode/chaos-gomoku" target="_blank" rel="noopener noreferrer">Github</a>
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

function Menu({ setGameMode, setItemsLoading, setStartModalOpen,
    socket, setNickName, setRoomId, setSeeds,
    deviceType, boardWidth, boardHeight,
    headCount, historyPeekUsers }) {
    const cTitle = '混乱五子棋';
    const title = 'Chaos Gomoku';
    const [enterRoomModalOpen, setEnterRoomModalOpen] = useState(false);

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

    function onButtonClick(mode) {
        if (mode === GameMode.MODE_ROOM) {
            setEnterRoomModalOpen(true);
        }
        else if (mode === GameMode.MODE_SIGNAL) {
            const seeds = generateSeeds();
            setSeeds(seeds);
            setStartModalOpen(true);
            setItemsLoading(true);
            setGameMode(mode);
        }
        else if (mode === GameMode.MODE_MATCH) {
            matchRoom(mode);
        }
        else {
            setStartModalOpen(true);
            setGameMode(mode);
            setItemsLoading(true);
        }
    }

    function matchRoom(mode) {
        setStartModalOpen(true);
        setGameMode(mode);
        setItemsLoading(true);
        socket.emit('matchRoom', { deviceType, boardWidth, boardHeight });
    }

    function enterRoom(roomId, nickName) {
        setStartModalOpen(true);
        sendMessage(roomId, nickName);
        setItemsLoading(true);
        setGameMode(GameMode.MODE_ROOM);
    }

    function sendMessage(roomId, nickName) {
        // 向服务器发送加入房间的请求，附带房间 ID 和昵称
        socket.emit('joinRoom', { roomId, nickName, deviceType, boardWidth, boardHeight });
        setNickName(nickName);
        setRoomId(roomId);
    }

    return (
        <div className="menu-container">
            <div>
                <FancyTitle text={title} />
                <FancyTitle2 text={cTitle} />
            </div>
            <div className="menu-items">
                <div className="menu-item">
                    {/* <img src="item1.jpg" alt="Item 1" /> */}
                    <h2>单机</h2>
                    {/* <p>模式介绍：...</p> */}
                    <button onClick={() => onButtonClick(GameMode.MODE_SIGNAL)}>开始游戏</button>
                </div>
                <div className="menu-item">
                    {/* <img src="item2.jpg" alt="Item 2" /> */}
                    <h2>联机</h2>
                    {/* <p>模式介绍：...</p> */}
                    <button onClick={() => onButtonClick(GameMode.MODE_MATCH)}>匹配模式</button>
                    <button onClick={() => onButtonClick(GameMode.MODE_ROOM)}>房间模式</button>
                </div>
            </div>
            <SystemInfo headCount={headCount} historyPeekUsers={historyPeekUsers} />
            <Footer />
            {enterRoomModalOpen && <EnterRoomModal modalInfo='请输入信息'
                onOkBtnClick={enterRoom}
                OnCancelBtnClick={() => setEnterRoomModalOpen(false)} />}
        </div>
    );
}

function SystemInfo({ headCount, historyPeekUsers }) {

    return (
        <div className="highest-online-users">
            <span className="count">{headCount}</span>
            <span className="icon">🔥</span>
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

function InfoModal({ modalInfo, setModalOpen }) {
    function closeModal() {
        setModalOpen(false);
    }
    return (
        <div className="modal-overlay">
            <div className="modal">
                <span className="close-button" onClick={closeModal}>
                    &times;
                </span>
                <p>{modalInfo}</p>
                <div className='button-confirm-container'>
                    <Button onClick={closeModal}>确定</Button>
                </div>

            </div>
        </div>
    );
}

// 若干时间之后自动关闭的Modal
function Modal({ modalInfo, setModalOpen, timeDelay = 1000, afterDelay }) {
    useEffect(() => {
        if (timeDelay) {
            const timer = setTimeout(() => {
                setModalOpen(false);
                if (afterDelay) {
                    afterDelay();
                }
            }, timeDelay);
            return () => clearTimeout(timer);
        }
    });
    return (
        <div className="modal-overlay">
            <div className="modal">
                <p>{modalInfo}</p>
            </div>
        </div>
    );
}

function EnterRoomModal({ modalInfo, onOkBtnClick, OnCancelBtnClick }) {
    function closeModal() {
        OnCancelBtnClick();
    }

    function onFinish(values) {
        const { roomId, nickName } = values;
        onOkBtnClick(roomId, nickName);
    }
    return (
        <div className="modal-overlay">
            <div className="modal">
                <span className="close-button" onClick={closeModal}>
                    &times;
                </span>
                <p>{modalInfo}</p>
                <Form
                    name="basic"
                    onFinish={onFinish}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                >
                    <Form.Item
                        label="房间号"
                        name="roomId"
                        rules={[{ required: true, message: '请输入房间号!' }]}
                    >
                        <Input placeholder="请输入房间号" />
                    </Form.Item>

                    <Form.Item
                        label="昵称"
                        name="nickName"
                        rules={[{ required: true, message: '请输入昵称!' }]}
                    >
                        <Input placeholder="请输入昵称" />
                    </Form.Item>

                    <Form.Item wrapperCol={{ span: 24 }} style={{ textAlign: 'right' }}>
                        <Space size={10}>
                            <Button type="primary" htmlType="submit">
                                确定
                            </Button>
                            <Button type="primary" onClick={closeModal}>
                                取消
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}

export {
    Timer, GameLog, ItemInfo, MusicPlayer, ItemManager, StartModal,
    Menu, ConfirmModal, InfoModal, Modal
};