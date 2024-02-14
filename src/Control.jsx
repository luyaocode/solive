import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Form, Space, Radio, Table } from 'antd';
import './Game.css';
import {
    Config_ClientIpsColumns,
    Config_GameInfoColumns,
    Config_StepInfoColumns,
    GameMode, LoginStatus,
    Piece_Type_Black,
    Table_Client_Ips, Table_Game_Info, Table_Step_Info
} from './ConstDefine.jsx'
import { Howl } from 'howler';
import {
    Sword, Shield, Bow, InfectPotion, TimeBomb, XFlower
    , FreezeSpell
} from './Item.ts';

import _ from 'lodash';
import { green } from '@mui/material/colors';

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
    selectedTable, setSelectedTable, setTableViewOpen }) {
    const cTitle = '混乱五子棋';
    const title = 'Chaos Gomoku';
    const [enterRoomModalOpen, setEnterRoomModalOpen] = useState(false);
    const [loginResultModalOpen, setLoginResultModalOpen] = useState(false);

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

    function login(account, passwd) {
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

function PlayerAvatar({ name, info, isMyTurn, pieceType }) {
    const [selectedAvatar, setSelectedAvatar] = useState('');

    useEffect(() => {
        const numRows = 5;
        const numCols = 16;
        const avatarWidth = 55.625;
        const avatarHeight = 51.8;
        const factor = 0.7;
        const scaledWidth = avatarWidth * factor;
        const scaledHeight = avatarHeight * factor;

        // 随机选择一个头像的行和列
        const randomRow = Math.floor(Math.random() * numRows);
        const randomCol = Math.floor(Math.random() * numCols);

        // 计算头像的位置
        const x = randomCol * avatarWidth;
        const y = randomRow * avatarHeight;

        // 加载图片
        const img = new Image();
        img.onload = function () {
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
            {selectedAvatar && <img src={selectedAvatar} alt="Avatar" className="avatar-img" />}
            <span>{name}</span>
            {!isMyTurn && <span>{info}</span>}
        </div>
    );
}

export {
    Timer, GameLog, ItemInfo, MusicPlayer, ItemManager, StartModal,
    Menu, ConfirmModal, InfoModal, Modal, SettingsButton, LoginButton, LoginModal,
    TableViewer, PlayerAvatar
};