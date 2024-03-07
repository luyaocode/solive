import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Form, Space, Radio, Table } from 'antd';
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"

import './Game.css';
import {
    Avatar_Number_X,
    Avatar_Number_Y,
    Config_ClientIpsColumns,
    Config_GameInfoColumns,
    Config_StepInfoColumns,
    GameMode, LoginStatus,
    Piece_Type_Black,
    Table_Client_Ips, Table_Game_Info, Table_Step_Info,
    Messages_Max_Len,
    View,
    AudioIcon, AudioIconDisabled,
    VideoIcon, VideoIconDisabled,
    NoVideoIcon, SpeakerIcon,
    DeviceType,
    root,
} from './ConstDefine.jsx'
import { Howl } from 'howler';
import {
    Sword, Shield, Bow, InfectPotion, TimeBomb, XFlower
    , FreezeSpell
} from './Item.ts';

import _ from 'lodash';
import { showNotification } from './Plugin.jsx'

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

function GameLog({ isRestart, gameLog, setGameLog, roomId, nickName, setChatPanelOpen, gameMode }) {
    const [isActive, setIsActive] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);

    const [longPressActive, setLongPressActive] = useState(false);
    let pressTimer;

    const startPress = () => {
        pressTimer = setTimeout(() => {
            setLongPressActive(true);
        }, 1000);
    };

    const cancelPress = () => {
        clearTimeout(pressTimer);
    };

    const handleTouchStart = () => {
        startPress();
    };

    const handleTouchEnd = () => {
        cancelPress();
    };

    const handleTouchMove = () => {
        cancelPress();
    };

    const handleButtonClick = () => {
        if (longPressActive) {
            if (gameMode !== GameMode.MODE_SIGNAL) {
                setChatPanelOpen(true);
            }
            setLongPressActive(false);
        } else {
            showAll();
        }
    };

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
            <Button
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                className='gamelog-button'
                onClick={handleButtonClick}>{gameLog[gameLog.length - 1][0]}</Button>
            <span>房间号: {roomId}</span><span className='span-blank'></span>
            <span>昵称: {nickName}</span>
            {isModalOpen && (
                <div className="gamelog-modal-overlay" onClick={handleCloseModalOutside}>
                    <div className="gamelog-modal">
                        <span className="gamelog-modal-close-btn" onClick={closeModal}>X</span>
                        <h4>本局记录：</h4>
                        {allInfo}
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
                        <h4>{cname}：</h4>
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
            let timerId;
            timerId = setTimeout(() => {
                createInitItems();
                setItemsLoaded(true);
            }, timeDelay * 1000);
            return () => {
                clearTimeout(timerId);
            };
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
    joined, setAllIsOk, restartInSameRoom }) {
    const [isModalOpen, setModalOpen] = useState(false);

    const { text, text2 } = getTexts();
    const [description, setDescription] = useState(text);
    const [secondText, setSecondText] = useState(text2);

    function getTexts() {
        let text, text2;
        switch (gameMode) {
            case GameMode.MODE_SIGNAL:
                {
                    text = '正在加载棋盘...'
                    text2 = '加载成功';
                    break;
                }
            case GameMode.MODE_AI: {
                text = '正在匹配AI';
                text2 = '匹配成功';
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
        return { text, text2 };
    }

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
            // setDescription('正在重新开始...');
            setModalOpen(false);
            setAllIsOk(true);
        }
    }, [isRestart]);

    //
    useEffect(() => {
        if (restartInSameRoom) {
            setDescription('正在重新开始...');
            setModalOpen(false);
            setAllIsOk(true);
        }
        else {
            const { text, text2 } = getTexts();
            setDescription(text);
            setSecondText(text2);
        }
    }, [restartInSameRoom]);

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
            <div style={{ marginTop: 10 + 'px' }}>
                <a href='https://beian.miit.gov.cn' target='_blank' className='record-number'>鄂ICP备2024037650号</a>
            </div>

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
    headCount, historyPeekUsers, netConnected, generateSeeds,
    isLoginModalOpen, setLoginModalOpen, isLoginSuccess,
    selectedTable, setSelectedTable, setTableViewOpen, avatarIndex }) {
    const cTitle = '混乱五子棋';
    const title = 'Chaos Gomoku';
    const [enterRoomModalOpen, setEnterRoomModalOpen] = useState(false);
    const [loginResultModalOpen, setLoginResultModalOpen] = useState(false);

    function onButtonClick(mode) {
        if (mode === GameMode.MODE_ROOM) {
            setEnterRoomModalOpen(true);
        }
        else if (mode === GameMode.MODE_SIGNAL || mode === GameMode.MODE_AI) {
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
        socket.emit('matchRoom', { deviceType, boardWidth, boardHeight, avatarIndex });
    }

    function enterRoom(roomId, nickName) {
        setStartModalOpen(true);
        sendMessage(roomId, nickName);
        setItemsLoading(true);
        setGameMode(GameMode.MODE_ROOM);
    }

    function login(account, passwd) {
        if (!netConnected) {
            setLoginResultModalOpen(true);
        }
        socket.emit('login', { account, passwd });
    }

    function sendMessage(roomId, nickName) {
        // 向服务器发送加入房间的请求，附带房间 ID 和昵称
        socket.emit('joinRoom', { roomId, nickName, deviceType, boardWidth, boardHeight });
        setNickName(nickName);
        setRoomId(roomId);
    }

    useEffect(() => {
        if (isLoginSuccess === LoginStatus.LOGOUT) {
            return;
        }
        if (isLoginModalOpen) {
            setLoginResultModalOpen(true);
        }
        if (isLoginSuccess === LoginStatus.OK) {
            setLoginModalOpen(false);
        }
    }, [isLoginSuccess]);

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
                    <button onClick={() => onButtonClick(GameMode.MODE_SIGNAL)}>面对面</button>
                    <button onClick={() => onButtonClick(GameMode.MODE_AI)}>AI模式</button>
                </div>
                <div className="menu-item">
                    {/* <img src="item2.jpg" alt="Item 2" /> */}
                    <h2>联机</h2>
                    {/* <p>模式介绍：...</p> */}
                    <button disabled={!netConnected} onClick={() => onButtonClick(GameMode.MODE_MATCH)}>匹配模式</button>
                    <button disabled={!netConnected} onClick={() => onButtonClick(GameMode.MODE_ROOM)}>房间模式</button>
                </div>
            </div>
            <SystemInfo headCount={headCount} historyPeekUsers={historyPeekUsers} netConnected={netConnected} />
            <LoginButton modalOpen={isLoginModalOpen} setModalOpen={setLoginModalOpen}
                isLoginSuccess={isLoginSuccess} setTableViewOpen={setTableViewOpen} />
            <Footer />
            {enterRoomModalOpen && <EnterRoomModal modalInfo='请输入信息'
                onOkBtnClick={enterRoom}
                OnCancelBtnClick={() => setEnterRoomModalOpen(false)} />}
            {isLoginModalOpen && <LoginModal modalInfo='请输入账号密码'
                onOkBtnClick={login}
                OnCancelBtnClick={() => setLoginModalOpen(false)} />}
            {
                loginResultModalOpen && <Modal modalInfo={isLoginSuccess === LoginStatus.OK ? '登录成功！' : '登录失败！'} setModalOpen={setLoginResultModalOpen} />
            }
        </div>
    );
}

function SystemInfo({ headCount, historyPeekUsers, netConnected }) {
    const [count, setCount] = useState(headCount);
    const [icon, setIcon] = useState('🔥');
    const [showPeekUsers, setShowPeekUsers] = useState(false);
    function showHistoryPeekUsers() {
        if (!showPeekUsers) {
            setCount(historyPeekUsers);
            setIcon('🔝');
        }
        else {
            setCount(headCount);
            setIcon('🔥');
        }
        setShowPeekUsers(!showPeekUsers);
    }

    useEffect(() => {
        setCount(headCount);
    }, [headCount])

    return (
        <div onClick={() => showHistoryPeekUsers(showPeekUsers)} disabled={!netConnected} style={{ cursor: 'pointer' }}>
            <div className="highest-online-users">
                {netConnected ?
                    <>
                        <span className="count">{count}</span>
                        <span className="icon">{icon}</span>
                    </> :
                    <span className='disconnected'>离 线</span>}
            </div>
        </div>
    );
}

function TableViewer({ socket, selectedTable, setSelectedTable, clientIpsData, gameInfoData, stepInfoData, setTableViewOpen,
    setLoginSuccess, logoutModalOpen, setLogoutModalOpen }) {
    function handleTableSelect(e) {
        setSelectedTable(e.target.value);
    }

    function logout() {
        setLoginSuccess(LoginStatus.LOGOUT);
        setLogoutModalOpen(false);
        setTableViewOpen(false);
        localStorage.removeItem('token');
        // socket.emit('logout');
    }

    return (
        <>
            <div className='table-menu'>
                <button className="button-normal" type="primary" onClick={() => setTableViewOpen(false)}>
                    &times; 返回主页
                </button>
                <button className="button-normal" type="primary" onClick={() => setLogoutModalOpen(true)}>
                    &times; 退出登录
                </button>
                <Radio.Group onChange={handleTableSelect} value={selectedTable} >
                    <Radio.Button value={Table_Client_Ips}>IP登录表</Radio.Button>
                    <Radio.Button value={Table_Game_Info}>所有对局表</Radio.Button>
                    <Radio.Button value={Table_Step_Info}>单次对局表</Radio.Button>
                </Radio.Group>
            </div>
            {selectedTable === Table_Client_Ips && <IpLoginTable data={clientIpsData} setSelectedTable={setSelectedTable} />}
            {selectedTable === Table_Game_Info && <AllGamesTable data={gameInfoData} setSelectedTable={setSelectedTable} />}
            {selectedTable === Table_Step_Info && <SingleGameTable data={stepInfoData} setSelectedTable={setSelectedTable} />}
            {logoutModalOpen && <ConfirmModal modalInfo='确定退出登录吗？' onOkBtnClick={logout}
                OnCancelBtnClick={() => setLogoutModalOpen(false)} />}
        </>
    );
}

function LoginButton({ modalOpen, setModalOpen, isLoginSuccess, setTableViewOpen }) {
    function onClick() {
        if (isLoginSuccess === LoginStatus.LOGOUT) {
            setModalOpen(!modalOpen);
        }
        else if (isLoginSuccess === LoginStatus.OK) {
            setTableViewOpen(true);
        }
    }

    return (
        <>
            <div className="loginButton" onClick={onClick}>
                <span>☁️</span>
            </div>
        </>
    );
}

function IpLoginTable({ data, setSelectedTable }) {
    return (
        <>
            <div className='table-container'>
                <button className="button-normal" type="primary" onClick={() => setSelectedTable(null)}>
                    &times; 关闭
                </button>
                <Table dataSource={data} columns={Config_ClientIpsColumns} scroll={{ x: 'max-content' }} />
            </div>
        </>
    );
}

function AllGamesTable({ data, setSelectedTable }) {
    return (
        <>
            <div className='table-container'>
                <button className="button-normal" type="primary" onClick={() => setSelectedTable(null)}>
                    &times; 关闭
                </button>
                <Table dataSource={data} columns={Config_GameInfoColumns} scroll={{ x: 'max-content' }} />
            </div>
        </>
    );
}

function SingleGameTable({ data, setSelectedTable }) {
    return (
        <>
            <div className='table-container'>
                <button className="button-normal" type="primary" onClick={() => setSelectedTable(null)}>
                    &times; 关闭
                </button>
                <Table dataSource={data} columns={Config_StepInfoColumns} scroll={{ x: 'max-content' }} />
            </div>
        </>
    );
}


function LoginModal({ modalInfo, onOkBtnClick, OnCancelBtnClick }) {
    function closeModal() {
        OnCancelBtnClick();
    }

    function onFinish(values) {
        const { account, passwd } = values;
        onOkBtnClick(account, passwd);
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
                        label="账号"
                        name="account"
                        rules={[{ required: true, message: '请输入账号!' }]}
                    >
                        <Input placeholder="请输入账号" />
                    </Form.Item>

                    <Form.Item
                        label="密码"
                        name="passwd"
                        rules={[{ required: true, message: '请输入密码!' }]}
                    >
                        <Input.Password placeholder="请输入密码" />
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

function SettingsButton({ SwitchSoundButton, VolumeControlButton, isRestart }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const toggleSettings = () => {
        setIsOpen(!isOpen);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        // 添加事件监听器
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // 卸载时移除事件监听器
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="settings-container">
            <button ref={buttonRef} onClick={toggleSettings} className="settings-button">
                设置
            </button>
            <div ref={dropdownRef} className='settings-dropdown' style={{ display: isOpen ? 'block' : 'none' }}>
                <SwitchSoundButton />
                <VolumeControlButton />
                <MusicPlayer isRestart={isRestart} />
            </div>
        </div>
    );
}

function PlayerAvatar({ avatarIndex, name, info, isMyTurn, pieceType, setChatPanelOpen }) {
    const [selectedAvatar, setSelectedAvatar] = useState('');

    useEffect(() => {
        const xIndex = avatarIndex[0];
        const yIndex = avatarIndex[1];
        // 加载图片
        const img = new Image();
        img.onload = function () {
            const avatarWidth = img.width / Avatar_Number_X;
            const avatarHeight = img.height / Avatar_Number_Y;
            const factor = 0.7;
            const scaledWidth = avatarWidth * factor;
            const scaledHeight = avatarHeight * factor;
            // 计算头像的位置
            const x = xIndex * avatarWidth;
            const y = yIndex * avatarHeight;
            // 创建Canvas元素
            const canvas = document.createElement('canvas');
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            const ctx = canvas.getContext('2d');

            if (pieceType === Piece_Type_Black) {
                ctx.fillStyle = 'black';
            } else {
                ctx.fillStyle = 'white';
            }
            ctx.fillRect(0, 0, scaledWidth, scaledHeight);

            // 绘制头像到Canvas
            ctx.drawImage(img, x, y, avatarWidth, avatarHeight, 0, 0, scaledWidth, scaledHeight);

            // 获取头像数据URL
            const avatarDataURL = canvas.toDataURL();
            setSelectedAvatar(avatarDataURL);
        }
        img.src = 'picture/avatar/avatar.png';

    }, []);

    return (
        <div className='player-avatar'>
            <span>{isMyTurn ? '💡' : '🌿'}</span>
            {selectedAvatar && <img src={selectedAvatar} alt="Avatar" className="avatar-img"
                onClick={() => { if (setChatPanelOpen) { setChatPanelOpen(true) } }} />}
            <span>{name}</span>
        </div>
    );
}

function ChatPanel({ messages, setMessages, setChatPanelOpen, socket }) {
    const [inputText, setInputText] = useState('');
    const textareaRef = useRef(null);
    const messageContainerRef = useRef(null);
    const [modalOpen, setModalOpen] = useState(false);

    // 处理发送消息
    const handleSendMessage = () => {
        if (messages.length > Messages_Max_Len) {
            setModalOpen(true);
            return;
        }
        if (inputText !== '') {
            const textValid = inputText.substring(0, 2000);
            const newMessage = { text: textValid, sender: 'me' };
            // 发送到服务器
            socket.emit('chatMessage', newMessage);
            setMessages(prev => [...prev, newMessage]);
            setInputText('');
            adjustTextareaHeight();
        }
    };

    function onClose() {
        setChatPanelOpen(false);
    }

    const handleChange = (e) => {
        setInputText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    function onTextAreaClick() {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            if (textareaRef.current) {
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // 设置初始高度为一行文本的高度
            }
        }
    }, []); // 只在组件加载时执行

    return (
        <>
            <div className='chat-panel-wrapper'>
                <div className="chat-panel">
                    <div className="chatpanel-close-button" onClick={onClose}>&times;</div>
                    <div ref={messageContainerRef} className="message-container">
                        {messages.map((message, index) => (
                            <div key={index} className={`message ${message.sender}`}>
                                {message.text.replace(/ /g, '\u00a0')} {/* 使用空格的 HTML 实体替换空格 */}
                            </div>
                        ))}
                    </div>
                    <div className="input-container">
                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={handleChange}
                            placeholder="请输入..."
                            onClick={onTextAreaClick}
                            style={{
                                width: '80%',
                                height: '1.5em', // 设置初始高度为一行文本的高度
                                minHeight: 'auto', // 调整最小高度为自动
                                maxHeight: '100px', // 调整最大高度
                                fontSize: '20px', // 调整字体大小
                                border: '1px solid #ccc',
                                resize: 'none',
                                overflow: 'hidden',
                                lineHeight: '1.2', // 设置行高与字体大小相同
                                padding: '10px', // 调整内边距
                            }}
                        />
                        <button onClick={handleSendMessage}>发送</button>
                    </div>
                </div>
            </div>
            {modalOpen && <Modal modalInfo='消息已达上限！' setModalOpen={setModalOpen} />}
        </>
    );
}

function VideoChat({ deviceType, socket, returnMenuView }) {
    const [me, setMe] = useState("");               // 本地socketId
    const [localStream, setLocalStream] = useState();
    const [remoteStream, setRemoteStream] = useState();
    const [calling, setCalling] = useState(false);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");       // 拨打过来的socketId
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callAcceptedSignalSend, setCallAcceptedSignalSend] = useState(false); // 接受信号送出
    const [callRejected, setCallRejected] = useState(false);
    const [idToCall, setIdToCall] = useState("");   // 要拨打的socketId
    const [toCallIsBusy, setToCallIsBusy] = useState(false); // 拨打的用户通话中
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");
    const [another, setAnother] = useState();       // 当前通话的socketId
    const [noResponse, setNoResponse] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);

    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');

    const [hasLocalVideoTrack, setHasLocalVideoTrack] = useState(true);
    const [hasRemoteVideoTrack, setHasRemoteVideoTrack] = useState(true);
    const [hasLocalAudioTrack, setHasLocalAudioTrack] = useState(true);
    const [hasRemoteAudioTrack, setHasRemoteAudioTrack] = useState(true);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        switch (deviceType) {
            case DeviceType.MOBILE: {
                root.style.setProperty('--video-container-flex-direction', 'column');
                break;
            }
            case DeviceType.PC: {
                root.style.setProperty('--video-container-flex-direction', 'row');
                break;
            }
            default: break;
        }
    }, [deviceType]);

    // 获取媒体流
    async function getUserMediaStream() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoEnabled,
                audio: audioEnabled
            });
            return stream;
        } catch (error) {
            console.error('获取媒体流失败：');
        }
    }

    // 更新轨道
    useEffect(() => {
        getUserMediaStream()
            .then(stream => {
                if (connectionRef.current) {
                    // 替换轨道
                    if (localStream) {
                        localStream.getTracks().forEach(track => {
                            connectionRef.current.peer.removeTrack(track, localStream);
                        });
                    }
                    if (stream) {
                        stream.getTracks().forEach(track => {
                            connectionRef.current.peer.addTrack(track, stream);
                        });
                    }
                    else {
                        // No MediaStream
                        connectionRef.current.peer.send('nomedia');
                    }
                }
                setLocalStream(stream);
                myVideo.current.srcObject = stream;
            });

        return () => {
            // 在组件卸载时停止媒体流
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [videoEnabled, audioEnabled, selectedAudioDevice, selectedVideoDevice]);

    useEffect(() => {
        if (socket && myVideo.current) {
            getUserMediaStream()
                .then(stream => {
                    if (stream) {
                        setLocalStream(stream);
                        myVideo.current.srcObject = stream;
                    }
                });

            socket.on("callRejected", () => {
                setCallAccepted(false);
                setCallRejected(true);
                setCalling(false);
            });

            socket.on("connectEnded", () => {
                setCallEnded(true);
                setCallAccepted(false);
                if (userVideo.current && userVideo.current.srcObject) {
                    userVideo.current.srcObject.getTracks().forEach(track => {
                        track.stop();
                    });
                    userVideo.current.srcObject = null; // 清除引用，以便内存回收
                }
                if (connectionRef.current) {
                    connectionRef.current.peer.destroy();
                }
            });

            socket.on("callCanceled", () => {
                setReceivingCall(false);
            });
        }
    }, [socket, myVideo]);

    useEffect(() => {
        const handleToCallBusy = () => {
            if (calling) {
                setCalling(false);
            }
            setToCallIsBusy(true);
        }
        socket.off("isBusy", handleToCallBusy);
        socket.on("isBusy", handleToCallBusy);

        return () => {
            socket.off("isBusy", handleToCallBusy);
        }
    }, [calling]);

    useEffect(() => {
        if (callAcceptedSignalSend) {
            setCallAcceptedSignalSend(false);
            // 重写peer监听器
            const handleAnswerSignal = (data) => {
                if (callAccepted) {
                    socket.emit("changeTrack", { signal: data, to: caller });
                } // 主叫方切换流
                else {
                    socket.emit("acceptCall", { signal: data, to: caller });
                }
            }

            if (connectionRef.current && !connectionRef.current.isCaller) {
                connectionRef.current.peer.removeAllListeners("signal");
                connectionRef.current.peer.on("signal", handleAnswerSignal);
            }
        }
    }, [callAcceptedSignalSend]);

    useEffect(() => {
        if (connectionRef.current) {
            const peer = connectionRef.current.peer;
            if (connectionRef.current.isCaller) {
                peer.on("signal", (data) => {
                    // const trackCount = parseSDP(data.sdp);
                    socket.emit("callUser", {
                        userToCall: connectionRef.current.idToCall,
                        signalData: data,
                        from: me,
                        name: name
                    });
                    setCallerSignal(data);
                });
                // 接收到流（stream）时触发
                peer.on("stream", (stream) => {
                    if (userVideo.current) {
                        userVideo.current.srcObject = stream;
                        setRemoteStream(stream);
                    }
                });

                socket.on("callAccepted", (signal) => {
                    setCallAccepted(true);
                    if (!peer.destroyed) {
                        peer.signal(signal);
                    }
                    setCalling(false);
                    setAnother(idToCall);
                });

                socket.on("changeTrackAgreed", (signal) => {
                    if (!peer.destroyed) {
                        peer.signal(signal);
                    }
                });
            } // 主叫方
            else {
                const handleAnswerSignal = (data) => {
                    socket.emit("acceptCall", { signal: data, to: caller });
                    setCallAcceptedSignalSend(true);
                }
                peer.on("signal", handleAnswerSignal);
                peer.on("stream", (stream) => {
                    if (userVideo.current) {
                        userVideo.current.srcObject = stream;
                        setRemoteStream(stream);
                    }
                });
                peer.on("data", (data) => {
                    if (data === 'nomedia') {
                        checkTrack(remoteStream, 'remote');
                    }
                });
            }
        }
    }, [connectionRef.current]);

    useEffect(() => {
        const handleCallUser = (data) => {
            if (callAccepted) {
                if (another === data.from) {
                    if (connectionRef.current) {
                        connectionRef.current.peer.signal(data.signal);
                    }
                } // 主叫方切换流
                else {
                    showNotification((data.name === '' ? '未知号码' : data.name) + ' 请求视频通话...', 2000, '');
                    socket.emit('isBusy', { to: data.from });
                } // 新用户打进来
            }
            else {
                setReceivingCall(true);
                setCaller(data.from);
                setName(data.name);
                setCallerSignal(data.signal);
            } // 处理初次连接
        }

        socket.off("callUser", handleCallUser);
        socket.on("callUser", handleCallUser);

        return () => {
            socket.off("callUser", handleCallUser);
        };
    }, [callAccepted]);

    useEffect(() => {
        if (socket) {
            setMe(socket.id);
        }
        return () => {
            if (connectionRef.current) {
                connectionRef.current.peer.destroy();
            }
        }
    }, []);

    useEffect(() => {
        if (callEnded) {
            setCallEnded(false);
        }
    }, [callEnded]);

    const parseSDP = (sdpText) => {
        var sdpLines = sdpText.split('\n');
        var trackCount = 0;
        sdpLines.forEach(function (line) {
            if (line.startsWith('m=') && !line.startsWith('m=application')) {
                console.log(line);
                trackCount++;
            }
        });
        console.log(new Date());
        console.log('---------------');
        return trackCount;
    }

    const createCallPeer = (stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        });
        return peer;
    }

    const callUser = (id) => {
        setCalling(true);
        const peer = createCallPeer(localStream);
        connectionRef.current = {
            peer: peer,
            isCaller: true,
            idToCall: id
        }
        setTimeout(() => {
            if (calling && !callAccepted) {
                setNoResponse(true);
                setCalling(false);
            }
        }, 30000);
    }

    const createAnswerPeer = (stream) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        });

        return peer;
    }

    const acceptCall = () => {
        setReceivingCall(false);
        setCallAccepted(true);
        const peer = createAnswerPeer(localStream);
        peer.signal(callerSignal);
        connectionRef.current = {
            peer: peer,
            isCaller: false
        };
        setAnother(caller);
    }

    const rejectCall = () => {
        setReceivingCall(false);
        socket.emit("rejectCall", { to: caller });
    }

    const leaveCall = () => {
        socket.emit("endConnect", { me: me, another: another });
    }

    const checkVideoTrack = (stream) => {
        if (stream) {
            const videoTracks = stream.getVideoTracks();
            return videoTracks.length > 0;
        }
        return false;
    };

    const checkAudioTrack = (stream) => {
        if (stream) {
            const audioTracks = stream.getAudioTracks();
            return audioTracks.length > 0;
        }
        return false;
    }

    const checkTrack = (stream, type) => {
        if (type === 'local') {
            setHasLocalVideoTrack(() => checkVideoTrack(stream));
            setHasLocalAudioTrack(() => checkAudioTrack(stream));
        }
        else if (type === 'remote') {
            setHasRemoteVideoTrack(() => checkVideoTrack(stream));
            setHasRemoteAudioTrack(() => checkAudioTrack(stream));
        }
    }

    useEffect(() => {
        if (myVideo.current && myVideo.current.srcObject) {
            myVideo.current.srcObject.addEventListener('loadedmetadata', () => checkTrack(localStream, 'local'));
        }
        if (userVideo.current && userVideo.current.srcObject) {
            userVideo.current.srcObject.addEventListener('loadedmetadata', () => checkTrack(remoteStream, 'remote'));
        }

        checkTrack(localStream, 'local');
        checkTrack(remoteStream, 'remote');
        return () => {
            if (myVideo.current && myVideo.current.srcObject) {
                myVideo.current.srcObject.removeEventListener('loadedmetadata', () => checkTrack(localStream));
            }
            if (userVideo.current && userVideo.current.srcObject) {
                userVideo.current.srcObject.removeEventListener('loadedmetadata', () => checkTrack(remoteStream));
            }
        };
    }, [localStream, remoteStream]);

    return (
        <>
            <div className='video-chat-view'>
                <h1 style={{ textAlign: "center", color: '#fff' }}>视频通话</h1>
                <button className="button-normal" type="primary" onClick={() => {
                    if (callAccepted) {
                        setConfirmLeave(true);
                    }
                    else {
                        returnMenuView();
                    }
                }}>
                    &times; 返回主页
                </button>
                <div className="container">
                    <div className="video-container">
                        {/* <div className="video">
                            {<video playsInline muted ref={myVideo} autoPlay style={{ width: "400px" }} />}
                        </div> */}
                        <div className='video'>
                            <video ref={myVideo} controls={hasLocalVideoTrack} autoPlay style={{ position: 'relative', zIndex: 0, width: '400px' }}>
                            </video>
                            {!hasLocalVideoTrack && !hasLocalAudioTrack && (
                                <img src={NoVideoIcon} alt="NoVideo" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1, height: '100%', width: '100%' }} />
                            )}
                            {!hasLocalVideoTrack && hasLocalAudioTrack && (
                                <img src={SpeakerIcon} alt="Speaker" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1, height: '100%', width: '100%' }} />
                            )}
                        </div>
                        {callAccepted && !callEnded ?
                            <div className="video">
                                <video ref={userVideo} controls={hasRemoteVideoTrack} autoPlay style={{ position: 'relative', zIndex: 0, width: '400px' }} >
                                </video>
                                {!hasRemoteVideoTrack && !hasRemoteAudioTrack && (
                                    <img src={NoVideoIcon} alt="NoVideo" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1, height: '100%', width: '100%' }} />
                                )}
                                {!hasRemoteVideoTrack && hasRemoteAudioTrack && (
                                    <img src={SpeakerIcon} alt="Speaker" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1, height: '100%', width: '100%' }} />
                                )}
                            </div>
                            : null
                        }
                    </div>
                    <div className="myId">
                        {!callAccepted &&
                            <>
                                <textarea
                                    placeholder="我的昵称"
                                    id="filled-basic"
                                    label="Name"
                                    variant="filled"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (e.target.scrollHeight > 40) { // 如果内容高度超过两行，设置最小高度为两行高度
                                            e.target.style.minHeight = '40px'; // 设置最小高度为两行高度
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        } else {
                                            e.target.style.minHeight = '20px'; // 设置最小高度为一行高度
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '1.5em', // 设置初始高度为一行文本的高度
                                        minHeight: 'auto', // 调整最小高度为自动
                                        maxHeight: '100px', // 调整最大高度
                                        fontSize: '20px', // 调整字体大小
                                        border: '1px solid #ccc',
                                        resize: 'none',
                                        lineHeight: '1.2', // 设置行高与字体大小相同
                                    }}
                                />
                                <textarea
                                    placeholder="对方号码"
                                    id="filled-basic"
                                    label="ID to call"
                                    variant="filled"
                                    value={idToCall}
                                    onChange={(e) => {
                                        setIdToCall(e.target.value);
                                        if (e.target.scrollHeight > 40) { // 如果内容高度超过两行，设置最小高度为两行高度
                                            e.target.style.minHeight = '40px'; // 设置最小高度为两行高度
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        } else {
                                            e.target.style.minHeight = '20px'; // 设置最小高度为一行高度
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '1.5em', // 设置初始高度为一行文本的高度
                                        minHeight: '20px', // 调整最小高度为自动
                                        maxHeight: '100px', // 调整最大高度
                                        fontSize: '20px', // 调整字体大小
                                        border: '1px solid #ccc',
                                        resize: 'none',
                                        lineHeight: '1.2', // 设置行高与字体大小相同
                                    }}
                                />
                            </>}
                        <AudioDeviceSelector audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled} setSelectedDevice={setSelectedAudioDevice} />
                        <VideoDeviceSelector videoEnabled={videoEnabled} setVideoEnabled={setVideoEnabled} setSelectedDevice={setSelectedVideoDevice} />
                        <div className="call-button">
                            {callAccepted && !callEnded ? (
                                <Button variant="contained" color="secondary" onClick={leaveCall} style={{ backgroundColor: 'red', color: 'white', fontWeight: 'bolder', }}>
                                    挂断
                                </Button>
                            ) : (
                                <>
                                    <CopyToClipboard text={me} style={{ marginRight: '10px' }}>
                                        <Button variant="contained" color="primary">
                                            复制我的ID
                                        </Button>
                                    </CopyToClipboard>
                                    <Button disabled={idToCall.length === 0} color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
                                        呼叫
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    {receivingCall && !callAccepted &&
                        <div className='modal-overlay-receive-call'>
                            <div className="modal-receive-call">
                                <div className="caller">
                                    <h1 >{name === '' ? '未知号码' : name} 邀请视频通话...</h1>
                                    <ButtonBox onOkBtnClick={acceptCall} OnCancelBtnClick={rejectCall}
                                        okBtnInfo='接听' cancelBtnInfo='拒绝' />
                                </div>
                            </div>
                        </div>}
                    {calling &&
                        <CallingModal modalInfo={"正在呼叫 " + idToCall}
                            onClick={() => {
                                setCalling(false);
                                socket.emit("callCanceled", { to: idToCall });
                            }} />}
                    {callRejected &&
                        <Modal modalInfo="已挂断" setModalOpen={setCallRejected} />}
                    {noResponse &&
                        <Modal modalInfo="超时,无应答" setModalOpen={setNoResponse} />}
                    {confirmLeave &&
                        <ConfirmModal modalInfo='确定挂断吗？' onOkBtnClick={() => {
                            leaveCall();
                            setConfirmLeave(false);
                        }} OnCancelBtnClick={() => setConfirmLeave(false)} />}
                    {toCallIsBusy &&
                        <Modal modalInfo='用户忙' setModalOpen={setToCallIsBusy} />}
                </div >
            </div>
        </>
    )
}

function AudioDeviceSelector({ audioEnabled, setAudioEnabled, setSelectedDevice }) {
    const [audioDevices, setAudioDevices] = useState([]);
    const [audioIcon, setAudioIcon] = useState(AudioIcon);

    // 获取音频设备列表
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            const audioDevicesList = devices.filter(device => device.kind === 'audioinput');
            setAudioDevices(audioDevicesList);
        });
    }, []);

    useEffect(() => {
        setAudioIcon(audioEnabled ? AudioIcon : AudioIconDisabled);
    }, [audioEnabled]);

    // 渲染音频设备选项
    const renderAudioDeviceOptions = () => {
        return audioDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || `音频设备 ${device.deviceId}`}</option>
        ));
    };

    // 处理选择框变化
    const handleSelectChange = (event) => {
        setSelectedDevice(event.target.value);
    };

    // 音频开关
    const toggleAudioOpen = () => {
        setAudioEnabled((prev) => !prev);
    };

    return (
        <div className="audio-device-selector-container">
            <img src={audioIcon} alt="Audio" className="icon" onClick={toggleAudioOpen} />
            {/* <label htmlFor="audioDevices" className="label">选择音频驱动:</label> */}
            <select id="audioDevices" className="select" onChange={handleSelectChange}>
                {renderAudioDeviceOptions()}
            </select>
            {/* {selectedDevice && <p className="selected-device">当前音频设备: {selectedDevice}</p>} */}
        </div>
    );
}

function VideoDeviceSelector({ videoEnabled, setVideoEnabled, setSelectedDevice }) {
    const [videoDevices, setVideoDevices] = useState([]);
    const [videoIcon, setVideoIcon] = useState(VideoIcon);

    // 获取视频设备列表
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            const videoDevicesList = devices.filter(device => device.kind === 'videoinput');
            setVideoDevices(videoDevicesList);
        });
    }, []);

    useEffect(() => {
        setVideoIcon(videoEnabled ? VideoIcon : VideoIconDisabled);
    }, [videoEnabled]);

    // 渲染视频设备选项
    const renderVideoDeviceOptions = () => {
        return videoDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>{device.label || `视频设备 ${device.deviceId}`}</option>
        ));
    };

    // 处理选择框变化
    const handleSelectChange = (event) => {
        setSelectedDevice(event.target.value);
    };

    // 视频开关
    const toggleVideoOpen = () => {
        setVideoEnabled((prev) => !prev);
    };

    return (
        <div className="video-device-selector-container">
            <img src={videoIcon} alt="Audio" className="icon" onClick={toggleVideoOpen} />
            {/* <label htmlFor="videoDevices" className="label">选择视频驱动:</label> */}
            <select id="videoDevices" className="select" onChange={handleSelectChange}>
                {renderVideoDeviceOptions()}
            </select>
            {/* {selectedDevice && <p className="selected-device">当前视频设备: {selectedDevice}</p>} */}
        </div>
    );
}

// 包含两个按钮的组合框,自定义按钮文本(默认为 确定 取消 )和功能
function ButtonBox({ onOkBtnClick, OnCancelBtnClick, okBtnInfo = '确定', cancelBtnInfo = '取消' }) {
    return (
        <div className='button-confirm-container'>
            <button className='button-normal' variant="contained" color="primary" onClick={onOkBtnClick}>
                {okBtnInfo}
            </button>
            <button className='button-normal' variant="contained" color="primary" onClick={OnCancelBtnClick}>
                {cancelBtnInfo}
            </button>
        </div>
    );
}

function OverlayArrow({ onClick, currentView }) {
    const [isArrowVisible, setIsArrowVisible] = useState(false);
    const handleClick = () => {
        onClick();
    };

    return (
        <>
            {currentView === View.Menu &&
                (< div className="overlay" onMouseEnter={() => setIsArrowVisible(true)}
                    onMouseLeave={() => setIsArrowVisible(false)}>
                    {isArrowVisible &&
                        <div className="arrow-container" onClick={handleClick}>
                            <div className="arrow"></div>
                            <div className="arrow"></div>
                            <div className="arrow"></div>
                        </div>
                    }
                </div >)}
        </>
    );
};

function CallingModal({ modalInfo, onClick }) {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <p>{modalInfo}</p>
                <div className='button-confirm-container'>
                    <Button onClick={onClick}>取消</Button>
                </div>
            </div>
        </div>
    );
}

export {
    Timer, GameLog, ItemInfo, MusicPlayer, ItemManager, StartModal,
    Menu, ConfirmModal, InfoModal, Modal, SettingsButton, LoginButton, LoginModal,
    TableViewer, PlayerAvatar, ChatPanel, VideoChat, OverlayArrow
};