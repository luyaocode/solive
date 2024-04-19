import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Form, Space, Radio, Table } from 'antd';
import { CopyToClipboard } from "react-copy-to-clipboard"
import Draggable from 'react-draggable';
import Peer from "simple-peer"
import wrtc from "wrtc"
import QRCode from 'qrcode.react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import ProgressBar from 'react-progressbar';

import './Game.css';
import './VideoChat.css';
import {
    Avatar_Number_X,
    Avatar_Number_Y,
    Config_ClientIpsColumns,
    Config_GameInfoColumns,
    Config_StepInfoColumns,
    GameMode, LoginStatus,
    Piece_Type_Black,
    Table_Client_Ips, Table_Game_Info, Table_Step_Info,
    Messages_Max_Send, Message_Max_Len, Text_Max_Len,
    View, Live_Messages_Max_Send, Live_Message_Max_Len,
    AudioIcon, AudioIconDisabled, MessageIcon, LiveChatPanelIcon,
    VideoIcon, VideoIconDisabled,
    NoVideoIcon, SpeakerIcon, ShareIcon, MediaTrackSettingsIcon, SelectVideoIcon,
    ShareScreenIcon, StopShareScreenIcon, StatPanelIcon, SwitchCameraIcon,
    BGM1, BGM2, SmallSpeakerIcon, SmallSpeakerSilentIcon, MediaCtlMenuIcon,
    DeviceType, CloseMediaCtlMenuIcon, DragIcon, FullScreenIcon, RefreshLiveStreamIcon,
    root, FileTransferIcon, Chunk_Max_Size,
    Piece_Type_White, LiveStreamRole, Live_Room_ID_Len, ExitLiveStreamBtnWaitTime,
    InitMediaTrackSettings, FacingMode, FrameRate, FrameWidth, FrameHeight, SampleRate, GlobalSignal,
} from './ConstDefine.jsx';
import { Howl } from 'howler';
import {
    Sword, Shield, Bow, InfectPotion, TimeBomb, XFlower
    , FreezeSpell
} from './Item.ts';

import _ from 'lodash';
import {
    showNotification, formatFileSize,
    maskSocketId, formatTime,
} from './Plugin.jsx'

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
            <div className='gamelog-container'>
                <Button
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onMouseDown={startPress}
                    onMouseUp={cancelPress}
                    onMouseLeave={cancelPress}
                    className='gamelog-button'
                    onClick={handleButtonClick}>{gameLog[gameLog.length - 1][0]}</Button>
                {(gameMode === GameMode.MODE_ROOM || gameMode === GameMode.MODE_MATCH) &&
                    <>
                        <span>房间号: {roomId}</span><span className='span-blank'></span>
                        <span>昵称: {nickName}</span>
                    </>
                }
                {isModalOpen && (
                    <div className="gamelog-modal-overlay" onClick={handleCloseModalOutside}>
                        <div className="gamelog-modal">
                            <span className="gamelog-modal-close-btn" onClick={closeModal}>X</span>
                            <h4>本局记录：</h4>
                            {allInfo}
                        </div>
                    </div>
                )}
            </div>
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
    const audioSrc1 = BGM1;
    const audioSrc2 = BGM2;
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
        for (let i = 0, j = seeds[ITEM_LOAD_PER_TIME] + 1; i < ITEM_LOAD_PER_TIME; i++, j = Math.pow(Math.sin(j), 2) * ITEM_LOAD_PER_TIME + seeds[ITEM_LOAD_PER_TIME]) {
            const seed = seeds[Math.floor(j) % ITEM_LOAD_PER_TIME];
            const item = _.cloneDeep(getItem(seed));
            temp.push(item);
        }
        // for (let i = 0; i < temp.length; i++) {
        //     let item = temp[i];
        //     console.log('more:' + i + '：' + item.name);
        // }
        setItems(prevItems => [...prevItems, ...temp]);
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

function LoadingModal({ setModalOpen, loadingText, noCancelBtn }) {
    const onCancelButtonClick = () => {
        setModalOpen(false);
    };

    const onRefreshPageButtonClick = () => {
        window.location.reload();
    };

    return (
        <>
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">{loadingText}</p>
                {!noCancelBtn ?
                    <button className="cancel-button" onClick={onCancelButtonClick}>取消</button>
                    :
                    <button className="cancel-button" onClick={onRefreshPageButtonClick}>刷新页面</button>
                }
            </div>
        </>
    );
}

function StartModal({ roomIsFullModalOpen, setRoomIsFullModalOpen, isRestart, setStartModalOpen, setItemsLoading, gameMode, setGameMode, socket, matched,
    joined, setAllIsOk, restartInSameRoom, roomId, headCount }) {
    const [isModalOpen, setModalOpen] = useState(false);

    const { text, text2 } = getTexts();
    const [description, setDescription] = useState(text);
    const [secondText, setSecondText] = useState(text2);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState();
    const [canShare, setCanShare] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false); // 邀请弹窗
    const qrCodeContainerRef = useRef(null);
    const shareModalRef = useRef(null);

    useEffect(() => {
        if (roomId) {
            setShareUrl(window.location.origin + '/room/' + roomId);
        }
    }, [roomId]);

    useEffect(() => {
        if (gameMode === GameMode.MODE_ROOM) {
            setCanShare(true);
        }
    }, []);

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
                text = '正在唤醒机器人';
                text2 = '唤醒成功';
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
                    text = '正在进入房间 ' + roomId;
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
        if (gameMode === GameMode.MODE_ROOM) {
            socket.emit('leaveRoom');
        }
        else if (gameMode === GameMode.MODE_MATCH) {
            socket.emit('exitMatching');
        } else {
        }
        setGameMode(GameMode.MODE_NONE);
    }

    function onBubbleClick(index) {
        setInviteModalOpen(true);
    }

    useEffect(() => {
        if (matched || joined) {
            setModalOpen(true);
        }
    }, [matched, joined]);

    useEffect(() => {
        if (isRestart) {
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

    useEffect(() => {
        if (isShareModalOpen && qrCodeContainerRef.current) {
            // 在分享模态框打开时且qrCodeContainerRef.current存在时注册保存函数
            window.saveQRCode = saveQRCode;
        }
    }, [isShareModalOpen, qrCodeContainerRef.current]);

    const handleClickOutSide = (event) => {
        if (isShareModalOpen && shareModalRef.current && !shareModalRef.current.contains(event.target)) {
            setShareModalOpen(false);
        }
    };

    useEffect(() => {
        if (isShareModalOpen && shareModalRef.current) {
            document.addEventListener('mousedown', handleClickOutSide);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutSide);
        };
    }, [isShareModalOpen, shareModalRef.current]);

    const saveQRCode = () => {
        if (!qrCodeContainerRef.current) return;

        const qrCodeContainer = qrCodeContainerRef.current;
        const qrCodeComponent = qrCodeContainer.querySelector('svg');

        const svgData = new XMLSerializer().serializeToString(qrCodeComponent);
        const canvas = document.createElement('canvas');

        // 获取SVG元素的尺寸
        const svgSize = qrCodeComponent.getBoundingClientRect();

        // 设置Canvas的宽度和高度为SVG元素的实际像素大小
        canvas.width = Math.ceil(svgSize.width);
        canvas.height = Math.ceil(svgSize.height);

        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // 绘制整个图像
            const dataURL = canvas.toDataURL('image/png');

            const a = document.createElement('a');
            a.href = dataURL;
            const picName = "chaosgomoku-room-" + roomId + ".png";
            a.download = picName;
            a.click();
        };

        // 使用 decodeURIComponent 替代 unescape
        img.src = 'data:image/svg+xml;base64,' + btoa(decodeURIComponent(encodeURIComponent(svgData)));

    };

    return (
        <>
            <div className="loading-overlay">
                {
                    gameMode === GameMode.MODE_MATCH &&
                    <BubbleScene headCount={headCount} onBubbleClick={onBubbleClick} />
                }
                {gameMode !== GameMode.MODE_MATCH && <div className="loading-spinner"></div>}
                <p className="loading-text">{description}</p>
                <button className="cancel-button" onClick={onCancelButtonClick}>取消</button>
                {canShare && <ShareButton onClick={() => setShareModalOpen(true)} />}
            </div>
            {isModalOpen &&
                <Modal modalInfo={secondText} setModalOpen={setModalOpen} timeDelay={1000} afterDelay={() => setAllIsOk(true)} />
            }
            {inviteModalOpen &&
                <ConfirmModal modalInfo='邀请Ta开始游戏吗？' onOkBtnClick={() => {
                    socket.emit('inviteGame');
                    setInviteModalOpen(false);
                }}
                    OnCancelBtnClick={() => setInviteModalOpen(false)} />
            }
            {isShareModalOpen &&
                <div className='share-modal-overlay'>
                    <div className="share-modal" ref={shareModalRef}>
                        <span className="close-button" onClick={() => setShareModalOpen(false)}>
                            &times;
                        </span>
                        <div className='share-button-container'>
                            <CopyToClipboard text={shareUrl} style={{ marginRight: '10px' }}>
                                <Button variant="contained" color="primary" onClick={() => showNotification('链接已复制到剪切板', 2000, 'white')}>
                                    复制链接
                                </Button>
                            </CopyToClipboard>
                            <Button variant="contained" color="primary" onClick={() => {
                                window.saveQRCode();
                                showNotification('二维码已保存', 2000, 'white');
                            }}>
                                保存二维码
                            </Button>
                        </div>
                        <div className='share-button-container' ref={qrCodeContainerRef}>
                            <QRCode
                                value={shareUrl}
                                size={200} // 设置二维码的尺寸
                                bgColor="transparent" // 设置背景颜色为透明
                                fgColor="green" // 设置前景颜色（二维码颜色）
                                level="H" // 设置容错级别（可选值：L、M、Q、H，默认为 L）
                                includeMargin={false} // 设置是否包含二维码外边距（默认为 true）
                                renderAs="svg" // 设置渲染格式（svg 或 canvas，默认为 svg）
                            />
                            <div className="text-container">
                                <span className="jumping-text">扫码进入房间</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {roomIsFullModalOpen &&
                <Modal modalInfo='房间已满员' setModalOpen={setRoomIsFullModalOpen} timeDelay={10000} />
            }
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
                <a href='https://beian.miit.gov.cn' target='_blank' className='record-number'>鄂ICP备2024037650号-1</a>
            </div>
            <div>
                <p style={{ color: 'gray' }}>Copyright&copy; 2024 chaosgomoku.fun. All rights reserved.</p>
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

function Menu({ enterRoomTried, setEnterRoomTried, setRoomIsFullModalOpen, rid, setGameMode, setItemsLoading, setStartModalOpen,
    socket, setNickName, setRoomId, setSeeds,
    deviceType, boardWidth, boardHeight,
    headCount, historyPeekUsers, netConnected, generateSeeds,
    isLoginModalOpen, setLoginModalOpen, isLoginSuccess,
    selectedTable, setSelectedTable, setTableViewOpen, avatarIndex, setShowOverlayArrow,
    gameInviteAccepted, locationData }) {
    const cTitle = '混乱五子棋';
    const title = 'Chaos Gomoku';
    const [enterRoomModalOpen, setEnterRoomModalOpen] = useState(false);
    const [loginResultModalOpen, setLoginResultModalOpen] = useState(false);
    const [confirmEnterRoomModalOpen, setConfirmEnterRoomModalOpen] = useState(false);

    useEffect(() => {
        if (gameInviteAccepted) {
            matchRoom(GameMode.MODE_MATCH);
        }
    }, [gameInviteAccepted]);

    useEffect(() => {
        if (enterRoomModalOpen) {
            setShowOverlayArrow(false);
        }
        else {
            setShowOverlayArrow(true);
        }
    }, [enterRoomModalOpen]);

    useEffect(() => {
        if (socket) {
            socket.on('roomIsFull', () => {
                setTimeout(() => {
                    setRoomIsFullModalOpen(true);
                }, 1000);
            });
        }
    }, [socket]);

    useEffect(() => {
        if (rid && socket && deviceType && boardWidth !== 0 && boardHeight !== 0 && !enterRoomTried) {
            setConfirmEnterRoomModalOpen(true);
        }
    }, [rid, socket, boardWidth, boardHeight]);

    const enterRoomByUrl = () => {
        enterRoom(rid, '大魔王');
        setEnterRoomTried(true);
    }

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
        socket.emit('matchRoom', { deviceType, boardWidth, boardHeight, avatarIndex, locationData });
    }

    function enterRoom(roomId, nickName, shareRoom) {
        setStartModalOpen(true);
        sendMessage(roomId, nickName, shareRoom);
        setItemsLoading(true);
        setGameMode(GameMode.MODE_ROOM);
    }

    function login(account, passwd) {
        if (!netConnected) {
            setLoginResultModalOpen(true);
        }
        socket.emit('login', { account, passwd });
    }

    function sendMessage(roomId, nickName, shareRoom) {
        // 向服务器发送加入房间的请求，附带房间 ID 和昵称
        socket.emit('joinRoom', { roomId, nickName, deviceType, boardWidth, boardHeight, locationData, shareRoom });
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
        <>
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
                        <button onClick={() => onButtonClick(GameMode.MODE_SIGNAL)}>好友对战</button>
                        <button onClick={() => onButtonClick(GameMode.MODE_AI)}>人机对战</button>
                    </div>
                    <div className="menu-item">
                        {/* <img src="item2.jpg" alt="Item 2" /> */}
                        <h2>联机</h2>
                        {/* <p>模式介绍：...</p> */}
                        <button disabled={!netConnected} onClick={() => onButtonClick(GameMode.MODE_MATCH)}>匹配模式</button>
                        <button disabled={!netConnected} onClick={() => onButtonClick(GameMode.MODE_ROOM)}>进入房间</button>
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
                {
                    confirmEnterRoomModalOpen &&
                    <ConfirmModal modalInfo={'是否进入房间[' + rid + '] ？'}
                        onOkBtnClick={() => {
                            enterRoomByUrl();
                            setConfirmEnterRoomModalOpen(false);
                        }
                        }
                        noCancelBtn={true}
                    />
                }
            </div>
            <ToolBar backgroundColor='transparent' />
        </>
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

function ConfirmModal({ modalInfo, onOkBtnClick, OnCancelBtnClick, noCancelBtn }) {
    function closeModal() {
        OnCancelBtnClick();
    }
    return (
        <div className="modal-overlay">
            <div className="modal">
                {!noCancelBtn &&
                    <span className="close-button" onClick={closeModal}>
                        &times;
                    </span>}
                <p>{modalInfo}</p>
                <div className='button-confirm-container'>
                    <Button onClick={onOkBtnClick}>确定</Button>
                    {!noCancelBtn &&
                        <Button onClick={OnCancelBtnClick}>取消</Button>}
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

function Switch({ isOn, setIsOn, onInfo, offInfo }) {

    const toggleSwitch = () => {
        setIsOn(prev => !prev);
    };

    return (
        <div className={`switch ${isOn ? 'on' : 'off'}`} onClick={toggleSwitch}
            onTouchStart={toggleSwitch}>
            <div className="switch-toggle"></div>
            <span className="switch-label">{isOn ? onInfo : offInfo}</span>
        </div>
    );
}

function EnterRoomModal({ modalInfo, onOkBtnClick, OnCancelBtnClick }) {
    const [shareRoom, setShareRoom] = useState(true);

    function closeModal() {
        OnCancelBtnClick();
    }

    function onFinish(values) {
        const { roomId, nickName } = values;
        onOkBtnClick(roomId, nickName, shareRoom);
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
                            <Switch isOn={shareRoom} setIsOn={setShareRoom}
                                onInfo='公开房间号' offInfo='隐藏房间号' />
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

function ShareButton({ onClick }) {
    return (
        <div className="share-button" onClick={onClick}>
            <img src={ShareIcon} alt="ShareIcon" />
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
        img.src = '/picture/avatar/avatar.png';

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

function ChatPanel({ messages, setMessages, setChatPanelOpen, ncobj }) {
    const [inputText, setInputText] = useState('');
    const textareaRef = useRef(null);
    const messageContainerRef = useRef(null);
    const handleSendMessageRef = useRef(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const handleSendMessage = () => {
            if (messages.length > Messages_Max_Send) {
                setModalOpen(true);
                return;
            }
            if (inputText !== '') {
                const textValid = inputText.substring(0, Message_Max_Len);
                const newMessage = { text: textValid, sender: 'me' };
                if (ncobj) {
                    if (ncobj.io) {
                        if (ncobj.connected) {
                            // 发送到服务器
                            ncobj.emit('chatMessage', newMessage);
                        }
                        else {
                            showNotification('连接已断开');
                        }
                    }
                    else {
                        // P2P
                        const messageString = JSON.stringify(newMessage);
                        if (!ncobj.destroyed) {
                            ncobj.send(messageString);
                        }
                        else {
                            showNotification('连接已断开');
                        }
                    }
                    setMessages(prev => [...prev, newMessage]);
                    setInputText('');
                    adjustTextareaHeight();
                }
            }
        };
        if (handleSendMessageRef) {
            handleSendMessageRef.current = handleSendMessage;
        }
    }, [ncobj, handleSendMessageRef, inputText]);
    // 处理发送消息

    function onClose() {
        setChatPanelOpen(false);
    }

    const handleChange = (e) => {
        let inputValue = e.target.value;
        let newValue = inputValue;
        if (inputValue.length > Message_Max_Len) {
            showNotification('输入字符长度达到上限！');
            newValue = inputValue.substring(0, Messages_Max_Send);
        }
        setInputText(newValue);
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
                                minHeight: 'auto', // 调整最小高度为自动
                                maxHeight: '54px', // 调整最大高度
                                fontSize: '20px', // 调整字体大小
                                border: '1px solid #ccc',
                                resize: 'none',
                                overflow: 'auto',
                                lineHeight: '1.2', // 设置行高与字体大小相同
                                padding: '10px', // 调整内边距
                                scrollbarWidth: 'none',
                            }}
                        />
                        <button onClick={() => handleSendMessageRef.current()}>发送</button>
                    </div>
                </div>
            </div>
            {modalOpen && <Modal modalInfo='消息数量已达上限！' setModalOpen={setModalOpen} />}
        </>
    );
}

function LiveRoomChatPanel({ messages, setMessages, socket, peerConn, anchorSocketId,
    deviceType, liveRoomChatPanelDisplay, setLiveRoomChatPanelDisplay, selectedRole,
    isConnected,
}) {
    const [inputText, setInputText] = useState('');
    const textareaRef = useRef(null);
    const messageContainerRef = useRef(null);
    const handleSendMessageRef = useRef(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (selectedRole === LiveStreamRole.Anchor) {
            setLiveRoomChatPanelDisplay(true);
        }
        else if (selectedRole === LiveStreamRole.Unknown) {
            setLiveRoomChatPanelDisplay(false);
        }
    }, [selectedRole]);

    useEffect(() => {
        if (selectedRole === LiveStreamRole.Viewer) {
            setLiveRoomChatPanelDisplay(isConnected);
        }
    }, [isConnected, selectedRole]);

    useEffect(() => {
        const handleSendMessage = () => {
            if (messages.length > Live_Messages_Max_Send) {
                setModalOpen(true);
                return;
            }
            if (inputText !== '') {
                const textValid = inputText.substring(0, Live_Message_Max_Len);
                const newMessage = {
                    text: textValid,
                    sender: socket?.id,
                    timestamp: Date.now(),
                };
                const messageString = JSON.stringify(newMessage);
                if (peerConn) {
                    for (let id in peerConn) {
                        if (id.startsWith('$')) continue;
                        const peer = peerConn[id].peer;
                        if (peer && !peer.destroyed && peer._pcReady) {
                            peer.send(messageString);
                        }
                    }
                }
                setMessages(prev => [...prev, newMessage]);
                setInputText('');
                adjustTextareaHeight();
            }
        };
        if (handleSendMessageRef) {
            handleSendMessageRef.current = handleSendMessage;
        }
    }, [handleSendMessageRef, inputText, socket, peerConn]);
    // 处理发送消息

    function onClose() {
        setLiveRoomChatPanelDisplay(false);
    }

    const handleChange = (e) => {
        let inputValue = e.target.value;
        let newValue = inputValue;
        if (inputValue.length > Live_Message_Max_Len) {
            showNotification('输入字符长度达到上限！');
            newValue = inputValue.substring(0, Live_Message_Max_Len);
        }
        setInputText(newValue);
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

    return (
        <>
            <div className={`live-chat-panel ${deviceType === DeviceType.MOBILE ? 'mobile' : ''} ${liveRoomChatPanelDisplay ? '' : 'display-none'}`}>
                {/* <div className="live-chatpanel-close-button" onClick={onClose}>&times;</div> */}
                <div ref={messageContainerRef} className="live-message-container">
                    {messages?.map((message, index) => (
                        <div key={index} className={`live-message ${selectedRole === LiveStreamRole.Anchor ?
                            (message.sender === socket.id ? 'anchor' : 'other') :
                            (selectedRole === LiveStreamRole.Viewer ?
                                (message.sender === anchorSocketId ? 'anchor' : (message.sender === socket.id ? 'me' : 'other')) :
                                '')}`}
                        >
                            <div className='msg-inline'>
                                <div className='msg-container'>
                                    <p className='msg-name'>{(message.sender === socket.id ? '[我]' : (message.sender === anchorSocketId ? '[主播]' : '')) + maskSocketId(message.sender)}</p>
                                    <div className='msg-timestamp'>{formatTime(message.timestamp)}</div>
                                </div>
                                <p className='msg-info'>{message.text.replace(/ /g, '\u00a0')}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="live-input-container">
                    <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={handleChange}
                        placeholder="请输入..."
                        onClick={onTextAreaClick}
                        style={{
                            width: '80%',
                            height: '2rem',
                            maxHeight: '54px', // 调整最大高度
                            fontSize: '16px', // 调整字体大小
                            resize: 'none',
                            overflow: 'auto',
                            lineHeight: '1.2', // 设置行高与字体大小相同
                            padding: '10px', // 调整内边距
                            scrollbarWidth: 'none',
                        }}
                    />
                    <button onClick={() => handleSendMessageRef.current()}>发送</button>
                </div>
            </div >
            {modalOpen && <Modal modalInfo='消息数量已达上限！' setModalOpen={setModalOpen} />
            }
        </>
    );
}

function VideoStatsTool({ connectionRef, localStream, isShareScreen,
    setInboundBitrate, setInboundVideoDelay, setInboundFramesPerSecond,
    setInboundFrameWidth, setInboundFrameHeight,
    setOutboundBitrate, setOutboundFramesPerSecond,
    setOutboundFrameWidth, setOutboundFrameHeight
}) {
    const lastBytesReceivedRef = useRef();
    const lastBytesSentRef = useRef();
    const lastFramesDecodedRef = useRef();
    const lastInboundVideoTimestampRef = useRef();
    const lastOutboundVideoTimestampRef = useRef();
    const lastTotalProcessingDelayRef = useRef();
    const intervalRef = useRef();

    function initRefs() {
        lastBytesReceivedRef.current = 0;
        lastBytesSentRef.current = 0;
        lastFramesDecodedRef.current = 0;
        lastInboundVideoTimestampRef.current = 0;
        lastTotalProcessingDelayRef.current = 0;
    }

    function checkVideoBitrate(peer, vt) {
        if (peer && !peer.destroyed) {
            peer._pc.getStats(vt ? vt : null).then((stats) => {
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.kind === 'video') {
                        if (lastBytesReceivedRef.current && lastInboundVideoTimestampRef.current &&
                            lastBytesReceivedRef.current >= 0 &&
                            report.bytesReceived >= lastBytesReceivedRef.current
                        ) {
                            const bytesReceived = report.bytesReceived - lastBytesReceivedRef.current;
                            const deltaTime = (report.timestamp - lastInboundVideoTimestampRef.current) / 1000;
                            const bitrate = (bytesReceived / deltaTime) * 8 / 1000000; // 转换为兆比特每秒
                            if (bitrate >= 0 && bitrate !== Infinity) {
                                setInboundBitrate(bitrate);
                            }
                            // console.log('远程视频比特率:', bitrate.toFixed(4), 'Mbps');

                            // const totalProcessingDelay = report.totalProcessingDelay * 1000;
                            // const averDelay = totalProcessingDelay / report.framesDecoded;
                            // console.log('远程视频平均延迟:', averDelay.toFixed(4), 'ms');
                            const processDelay = (report.totalProcessingDelay - lastTotalProcessingDelayRef.current) * 1000;
                            const framesDecoded = report.framesDecoded - lastFramesDecodedRef.current;
                            const nowDelay = processDelay / framesDecoded;
                            if (nowDelay > 0) {
                                setInboundVideoDelay(nowDelay);
                            }
                            // console.log('远程视频瞬时延迟:', delay.toFixed(4), 'ms');

                            const framesPerSecond = report.framesPerSecond;
                            if (framesPerSecond) {
                                setInboundFramesPerSecond(framesPerSecond);
                            }
                            else {
                                setInboundFramesPerSecond(framesDecoded / deltaTime);
                            }
                            // console.log('远程视频帧率:', framesPerSecond.toFixed(4), 'ms');
                        }
                        lastBytesReceivedRef.current = report.bytesReceived;
                        lastFramesDecodedRef.current = report.framesDecoded;
                        lastTotalProcessingDelayRef.current = report.totalProcessingDelay;
                        lastInboundVideoTimestampRef.current = report.timestamp;
                        if (report.frameWidth > 0) {
                            setInboundFrameWidth(report.frameWidth);
                        }
                        if (report.frameHeight) {
                            setInboundFrameHeight(report.frameHeight);
                        }
                    }
                    else if (report.type === 'outbound-rtp' && report.kind === 'video') {
                        if (lastBytesSentRef.current && lastOutboundVideoTimestampRef.current &&
                            lastBytesSentRef.current > 0 &&
                            report.bytesSent > lastBytesSentRef.current
                        ) {
                            const bytesSent = report.bytesSent - lastBytesSentRef.current;
                            const deltaTime = (report.timestamp - lastOutboundVideoTimestampRef.current) / 1000;
                            if (deltaTime !== 0) {
                                const bitrate = (bytesSent / deltaTime) * 8 / 1000000; // 转换为兆比特每秒
                                if (bitrate > 0) {
                                    setOutboundBitrate(bitrate);
                                }
                            }
                            const framesPerSecond = report.framesPerSecond;
                            if (framesPerSecond) {
                                setOutboundFramesPerSecond(framesPerSecond);
                            }
                        }
                        lastBytesSentRef.current = report.bytesSent;
                        lastOutboundVideoTimestampRef.current = report.timestamp;
                        if (report.frameWidth) {
                            setOutboundFrameWidth(report.frameWidth);
                        }
                        if (report.frameHeight) {
                            setOutboundFrameHeight(report.frameHeight);
                        }
                    }
                });
            }).catch(error => {
                // console.error(error);
            });
        }
        else {
            // console.error("RTCPeerConnection is not established or in an invalid state.");
        }
    }

    useEffect(() => {
        if (isShareScreen) {
            if (connectionRef?.current?.peer && !connectionRef.current.peer.destroyed) {
                const peer = connectionRef.current.peer;
                clearInterval(intervalRef.current);
                const id = setInterval(() => checkVideoBitrate(peer), 1000);
                intervalRef.current = id;
                return () => {
                    clearInterval(intervalRef.current);
                }
            }
        }
        else if (connectionRef?.current?.peer && !connectionRef.current.peer.destroyed) {
            if (localStream) {
                const peer = connectionRef.current.peer;
                clearInterval(intervalRef.current);
                initRefs();
                if (localStream.getVideoTracks().length > 0) {
                    const id = setInterval(() => checkVideoBitrate(peer, localStream.getVideoTracks()[0]), 1000);
                    intervalRef.current = id;
                }
                return () => {
                    clearInterval(intervalRef.current);
                }
            } else {
                const peer = connectionRef.current.peer;
                const handleOnStream = (stream) => {
                    clearInterval(intervalRef.current);
                    initRefs();
                    const id = setInterval(() => checkVideoBitrate(peer, stream.getVideoTracks()[0]), 1000);
                    intervalRef.current = id;
                };
                peer.on('stream', handleOnStream);
                return () => {
                    clearInterval(intervalRef.current);
                }
            }
        }
    }, [connectionRef.current, localStream]);

    useEffect(() => {
        return () => {
            clearInterval(intervalRef.current);
        }
    }, []);

    return null;
}

function MediaTrackSettingsModal({ localVideoWidth, setLocalVideoWidth, localVideoHeight,
    setLocalVideoHeight, localFrameRate, setLocalFrameRate, echoCancellation, setEchoCancellation,
    noiseSuppression, setNoiseSuppression, sampleRate, setSampleRate, setModalOpen, setConstraint,
    videoEnabled, audioEnabled, facingMode
}) {
    const [localVideoWidth_Temp, setLocalVideoWidth_Temp] = useState(localVideoWidth);
    const [localVideoHeight_Temp, setLocalVideoHeight_Temp] = useState(localVideoHeight);
    const [localFrameRate_Temp, setLocalFrameRate_Temp] = useState(localFrameRate);
    const [echoCancellation_Temp, setEchoCancellation_Temp] = useState(echoCancellation);
    const [noiseSuppression_Temp, setNoiseSuppression_Temp] = useState(noiseSuppression);
    const [sampleRate_Temp, setSampleRate_Temp] = useState(sampleRate);

    const handleWidthChange = (event) => {
        setLocalVideoWidth_Temp(parseInt(event.target.value));
    };

    const handleWidthBlur = (event) => {
        let val = event.target.value;
        if (val > FrameWidth.Max) {
            val = FrameWidth.Max;
        }
        else if (val < FrameWidth.Min) {
            val = FrameWidth.Min;
        }
        setLocalVideoWidth_Temp(parseInt(val));
    }

    const handleHeightChange = (event) => {
        setLocalVideoHeight_Temp(parseInt(event.target.value));
    };

    const handleHeightBlur = (event) => {
        let val = event.target.value;
        if (val > FrameHeight.Max) {
            val = FrameHeight.Max;
        }
        else if (val < FrameHeight.Min) {
            val = FrameHeight.Min;
        }
        setLocalVideoHeight_Temp(parseInt(val));
    }

    const handleFrameRateChange = (event) => {
        const value = parseInt(event.target.value);
        if (value >= FrameRate.Min && value <= FrameRate.Max) {
            setLocalFrameRate_Temp(value);
        }
    };

    const handleEchoCancellationChange = (e) => {
        setEchoCancellation_Temp((prevValue) => !prevValue);
    };

    const handleNoiseSuppressionChange = () => {
        setNoiseSuppression_Temp((prevValue) => !prevValue);
    };

    const handleSampleRateChange = (event) => {
        setSampleRate_Temp(parseInt(event.target.value));
    };

    const handleSampleRateBlur = (event) => {
        let val = event.target.value;
        if (val > SampleRate.Max) {
            val = SampleRate.Max;
        }
        else if (val < SampleRate.Min) {
            val = SampleRate.Min;
        }
        setSampleRate_Temp(parseInt(val));
    }

    const onRestoreBtnClick = () => {
        setLocalVideoWidth_Temp(InitMediaTrackSettings.localVideoWidth);
        setLocalVideoHeight_Temp(InitMediaTrackSettings.localVideoHeight);
        setLocalFrameRate_Temp(InitMediaTrackSettings.localFrameRate);
        setEchoCancellation_Temp(InitMediaTrackSettings.echoCancellation);
        setNoiseSuppression_Temp(InitMediaTrackSettings.noiseSuppression);
        setSampleRate_Temp(InitMediaTrackSettings.sampleRate);
    }

    const onOkBtnClick = () => {
        setLocalVideoWidth(localVideoWidth_Temp);
        setLocalVideoHeight(localVideoHeight_Temp);
        setLocalFrameRate(localFrameRate_Temp);
        setEchoCancellation(echoCancellation_Temp);
        setNoiseSuppression(noiseSuppression_Temp);
        setSampleRate(sampleRate_Temp);
        setModalOpen(false);

        setConstraint({
            video: videoEnabled ? {
                width: localVideoWidth_Temp,
                height: localVideoHeight_Temp,
                frameRate: localFrameRate_Temp,
                facingMode: facingMode,
            } : false,
            audio: audioEnabled ? {
                echoCancellation: echoCancellation_Temp,
                noiseSuppression: noiseSuppression_Temp,
                sampleRate: sampleRate_Temp,
            } : false,
        });
    }

    const onCancelBtnClick = () => {
        setModalOpen(false);
    }

    return (
        <div className='media-track-settings-modal-overlay'>
            <div className='media-track-settings-modal'>
                <p>媒体轨道设置</p>
                <span className="close-button" onClick={onCancelBtnClick}>
                    &times;
                </span>
                <div className='video-settings'>
                    <label>
                        视频宽度:
                        <input type="number" value={localVideoWidth_Temp} onChange={handleWidthChange}
                            onBlur={handleWidthBlur}
                            min={FrameWidth.Min} max={FrameWidth.Max} />
                    </label>
                    <label>
                        视频高度:
                        <input type="number" value={localVideoHeight_Temp} onChange={handleHeightChange}
                            onBlur={handleHeightBlur}
                            min={FrameHeight.Min} max={FrameHeight.Max} />
                    </label>
                    <label>
                        帧率:
                        <input type="range" min="30" max="120" value={localFrameRate_Temp} onChange={handleFrameRateChange} />
                        {localFrameRate_Temp}
                    </label>
                </div>
                <div className='audio-settings'>
                    <label style={{ width: 'fit-content' }}>
                        回声消除:
                        <button onClick={handleEchoCancellationChange}>{echoCancellation_Temp ? '开启' : '关闭'}</button>
                    </label>
                    <label style={{ width: 'fit-content' }}>
                        噪声抑制:
                        <button onClick={handleNoiseSuppressionChange}>{noiseSuppression_Temp ? '开启' : '关闭'}</button>
                    </label>
                    <label>
                        采样率:
                        <input type="number" value={sampleRate_Temp} onChange={handleSampleRateChange}
                            onBlur={handleSampleRateBlur}
                            min={SampleRate.Min} max={SampleRate.Max} />
                    </label>
                </div>
                <div className='media-track-settings-button-confirm-container'>
                    <button className='button-normal' style={{ marginLeft: '0' }} variant="contained" color="primary" onClick={onRestoreBtnClick}>
                        恢复默认
                    </button>
                    <button className='button-normal' variant="contained" color="primary" onClick={onCancelBtnClick}>
                        取消
                    </button>
                    <button className='button-normal' variant="contained" color="primary" onClick={onOkBtnClick}>
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
}

function SelectVideoModal({ setModalOpen, selectedVideoRef, setSelectedMediaStream,
    selectedLocalFile, setSelectedLocalFile, audioSource, setAudioSource,
    audioCtx, setAudioCtx, setUrl }) {
    const videoRef = useRef(null);
    const [selFile, setSelFile] = useState();
    const [inputDisabled, setInputDisabled] = useState(true);
    const [isClickSpan, setIsClickSpan] = useState(false);

    useEffect(() => {
        if (isClickSpan) {
            setIsClickSpan(false);
        }
    }, [isClickSpan]);

    const handlePlayVideo = (file, videoRef, replaceCameraMideaStream) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            if (!videoRef.current) return;
            const video = videoRef.current;
            if (!video.paused) {
                video.pause();
            }
            const url = URL.createObjectURL(file);
            video.src = url;
            setUrl(url);
            await video.play();
            if (replaceCameraMideaStream) {
                let actx, source;
                if (audioSource && audioCtx) {
                    audioSource.disconnect();
                    source = audioSource;
                    actx = audioCtx;
                }
                else {
                    actx = new AudioContext();
                    source = actx.createMediaElementSource(video);
                    setAudioSource(source);
                    setAudioCtx(actx);
                }
                const destination = actx.createMediaStreamDestination();
                source.connect(destination);

                const mediaStream = new MediaStream();
                const mediaTracks = video.captureStream().getTracks();
                mediaTracks.forEach(track => {
                    mediaStream.addTrack(track);
                });
                setSelectedMediaStream(mediaStream);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    const onOkBtnClick = () => {
        if (selFile) {
            setSelectedLocalFile(selFile);
        }
        handlePlayVideo(selFile, selectedVideoRef, true);
        setModalOpen(false);
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setSelFile(file);
        handlePlayVideo(file, videoRef);
    };

    const handleSpanClick = () => {
        // 触发文件输入元素的点击事件
        setInputDisabled(false);
        setIsClickSpan(true);
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    };

    const handleInputChange = (event) => {
        if (isClickSpan) {
            handleFileChange(event);
        }
        else {
            setInputDisabled(true);
        }
    };

    return (
        <div className='select-video-modal-overlay'>
            <div className='select-video-modal'>
                <span className="close-button" onClick={() => setModalOpen(false)}>
                    &times;
                </span>
                <label className="custom-file-upload" htmlFor="fileInput">
                    <input id="fileInput" type="file" accept="video/*" onChange={handleFileChange}
                        onClick={handleInputChange}
                        disabled={inputDisabled}
                        style={{ display: 'none' }} />
                    <span onClick={handleSpanClick}>选择视频</span>
                </label>
                {selFile?.name ?
                    <>
                        <p>{selFile.name}</p>
                        <video ref={videoRef} controls
                            className='video' />
                    </> : selectedLocalFile?.name ?
                        <div style={{ display: 'flex' }}>
                            <p style={{ minWidth: '5rem', whiteSpace: 'nowrap' }}>上次选择：</p><p style={{ color: 'gray' }}>{selectedLocalFile.name}</p>
                        </div> : null
                }
                <ButtonBox onOkBtnClick={onOkBtnClick} OnCancelBtnClick={() => setModalOpen(false)} />
            </div>
        </div>
    );
}

function VolumeCtlSlider({ handleVolumeChange, videoRef, volume, setVolume }) {

    useEffect(() => {
        const onVolumeChange = () => {
            if (videoRef && videoRef.current) {
                setVolume(videoRef.current.volume);
            }
        };
        videoRef?.current?.addEventListener('volumechange', onVolumeChange);
        return () => {
            videoRef?.current?.removeEventListener('volumechange', onVolumeChange);
        };
    }, [videoRef]);

    return (
        <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => {
                setVolume(parseFloat(event.target.value));
                handleVolumeChange(event, videoRef)
            }}
            title='音量' />
    );
}

function TextArea({ isReadyOnly, placeholder, label, value, onChange }) {
    return (
        <textarea
            readOnly={isReadyOnly}
            placeholder={placeholder}
            id="filled-basic"
            label={label}
            variant="filled"
            value={value}
            onChange={(e) => onChange(e)}
            style={{
                width: '100%',
                height: '1.5em', // 设置初始高度为一行文本的高度
                minHeight: 'auto', // 调整最小高度为自动
                // maxHeight: '54px', // 调整最大高度
                fontSize: '20px', // 调整字体大小
                border: '1px solid #ccc',
                resize: 'none',
                lineHeight: '1.2', // 设置行高与字体大小相同
                scrollbarWidth: 'none',
                whiteSpace: 'nowrap'
            }}
        />
    );
}

function CallButton({ callAccepted, callEnded, idToCall,
    onLeaveCallBtnClick, onInviteCallBtnClick, onCallUserBtnClick,
    socket }) {
    return (
        <div className="call-button">
            {callAccepted && !callEnded ? (
                <Button variant="contained" color="secondary" onClick={onLeaveCallBtnClick}
                    style={{ backgroundColor: 'red', color: 'white', fontWeight: 'bolder', }}>
                    挂断
                </Button>
            ) : (
                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={onInviteCallBtnClick}
                        className='invite-call-button' disabled={!(socket?.connected)}>
                        邀请通话
                    </Button>
                    <Button disabled={idToCall?.length === 0 || !(socket?.connected)} color="primary" aria-label="call"
                        onClick={onCallUserBtnClick}
                        className='call-user-button'>
                        呼叫
                    </Button>
                </div>
            )}
        </div>
    );
}

function ReturnMenuButton({ sid, onBtnClick }) {
    return (
        <>
            {!sid &&
                <button className="return-menu-button" onClick={onBtnClick}>
                    返回主页
                </button>
            }
        </>
    );
}

function LocalVideoDisplayBoard({ selectedVideoRef, selectedMediaStream, name, handleVideoClick,
    isDragging }) {

    useEffect(() => {

    }, [selectedVideoRef.current]);

    const onVideoClick = (event) => {
        if (isDragging) {
            handleVideoClick(event);
        }
    };

    const onTouchStart = (event) => {
        onVideoClick(event);
        const video = selectedVideoRef.current;
        if (video.paused) {
            video.play();
        }
        else {
            video.pause();
        }
    };

    return (
        <div className='local-video'>
            <video ref={selectedVideoRef} playsInline controls loop={true}
                className={`local-media-stream ${selectedMediaStream ? '' : 'display-none'}`}
                onClick={event => onVideoClick(event)}
                onTouchStart={event => onTouchStart(event)}
            />
            {selectedMediaStream &&
                <TextOverlay
                    position="top-center"
                    content={(name ? name : '') + '的本地视频'}
                />
            }
        </div>
    );
}

function ToolBar({ backgroundColor }) {
    return (
        <div className='toolbar' style={{ backgroundColor: backgroundColor }}>
            <p> </p>
        </div>
    );
}

function TransferModal({ setModalOpen, peer, fileTransferAccepted, setFileTransferAccepted,
    setWaitConfirmTransferFileModalOpen, modalVisible, setModalVisible,
    receiveFileProgress, preAcceptFileName, preAcceptFileSize
}) {
    const [dragging, setDragging] = useState(false);
    const [filePath, setFilePath] = useState();
    const [selFile, setSelFile] = useState();
    const [progress, setProgress] = useState(0);
    const [controller, setController] = useState(new AbortController());
    const [stopTransferFileModalOpen, setStopTransferFileModalOpen] = useState(false);

    useEffect(() => {
        return () => {
            setFileTransferAccepted(false);
            setModalVisible(true);
        };
    }, []);

    useEffect(() => {
        if (fileTransferAccepted) {
            sendFile(peer, selFile);
        }
    }, [fileTransferAccepted]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFilePath(file.name);
        setSelFile(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        setFilePath(file.name);
        setSelFile(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const onDragLeave = () => {
        setDragging(false);
    };

    const handleInputClick = (e) => {
    };

    const handleAreaClick = (e) => {
    };

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const sendFile = (peer, file) => {
        const chunkSize = Chunk_Max_Size;
        const reader = new FileReader();
        const MAX_BUFFERED_AMOUNT = 1024;
        const newController = new AbortController();
        setController(newController);
        const { signal } = newController;
        reader.onload = () => {
            const fileArrayBuffer = reader.result;
            const fileSize = fileArrayBuffer.byteLength;
            let offset = 0;
            let chunkIndex = 0;
            let isFirstChunk = true;
            peer.send(JSON.stringify({
                type: 'transferFile',
                fileName: file.name,
                fileSize, fileSize
            }));
            async function sendChunks() {
                try {
                    while (offset < fileSize) {
                        if (signal.aborted) {
                            console.log('Transmission aborted');
                            return;
                        }
                        const bufferedAmount = peer._channel.bufferedAmount;
                        if (bufferedAmount > MAX_BUFFERED_AMOUNT) {
                            await wait(10);
                            continue;
                        }
                        const isLastChunk = offset + chunkSize >= fileSize;
                        const chunk = new Uint8Array(fileArrayBuffer.slice(offset, offset + chunkSize));
                        const messageBytes = new Uint8Array(10);
                        messageBytes[0] = (chunkIndex >> 56) & 0xFF;
                        messageBytes[1] = (chunkIndex >> 48) & 0xFF;
                        messageBytes[2] = (chunkIndex >> 40) & 0xFF;
                        messageBytes[3] = (chunkIndex >> 32) & 0xFF;
                        messageBytes[4] = (chunkIndex >> 24) & 0xFF;
                        messageBytes[5] = (chunkIndex >> 16) & 0xFF;
                        messageBytes[6] = (chunkIndex >> 8) & 0xFF;
                        messageBytes[7] = chunkIndex & 0xFF;
                        messageBytes[8] = isFirstChunk ? 1 : 0;
                        messageBytes[9] = isLastChunk ? 1 : 0;

                        const data = new Uint8Array(messageBytes.length + chunk.length);
                        data.set(messageBytes, 0);
                        data.set(chunk, messageBytes.length);

                        peer.send(data);
                        offset += chunkSize;
                        if (isLastChunk) {
                            setProgress(Number((100).toFixed(2)));
                        }
                        else {
                            setProgress(Number((offset / fileSize * 100).toFixed(2)));
                        }
                        chunkIndex++;
                        isFirstChunk = false;
                    }
                }
                catch (error) {
                    if (error.name === 'AbortError') {
                        console.log('Transmission aborted');
                        return;
                    }
                }
            }
            sendChunks();
        }
        reader.readAsArrayBuffer(file);
    };

    const onOkBtnClick = () => {
        if (progress > 0 && progress < 100) {
            return;
        }
        if (peer && selFile) {
            const reader = new FileReader();
            reader.onload = () => {
                const fileArrayBuffer = reader.result;
                const fileSize = fileArrayBuffer.byteLength;
                peer.send(JSON.stringify({
                    type: 'transferFileRequest',
                    fileName: selFile.name,
                    fileSize: fileSize,
                }));
                setWaitConfirmTransferFileModalOpen(true);
            };
            reader.readAsArrayBuffer(selFile);
        }
    };

    const onCancelBtnClick = () => {
        if (progress > 0 && progress < 100) {
            setStopTransferFileModalOpen(true);
        }
        else {
            setModalOpen(false);
        }
    };

    const stopTransferFile = () => {
        controller.abort();
        setStopTransferFileModalOpen(false);
        setProgress(0);
        if (peer) {
            peer.send(JSON.stringify({
                type: 'transferFileStopped',
            }));
        }
    };

    const closeModal = () => {
        if (progress > 0 && progress < 100) {
            setModalVisible(false);
        }
        else {
            setModalOpen(false);
        }
    };

    return (
        <div className='select-video-modal-overlay' style={{
            display: modalVisible ? '' : 'none'
        }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}>
            <div className='select-video-modal'>
                <span className="close-button" onClick={closeModal}>
                    &times;
                </span>
                <ReceivingFileInfo progress={receiveFileProgress} preAcceptFileName={preAcceptFileName}
                    preAcceptFileSize={preAcceptFileSize} />
                <label htmlFor="fileTransferInput" className='file-upload'>
                    <input id="fileTransferInput" type="file" accept="*/*"
                        style={{ display: 'none' }}
                        onClick={handleInputClick}
                        onChange={handleFileChange}
                    />
                    <div className={`drag - drop - area ${dragging ? 'dragging' : ''}`}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onClick={handleAreaClick}
                    >
                        <span>＋</span>
                        {
                            filePath ? (
                                <p>已选择文件：{filePath}</p>
                            ) : (
                                <p>将文件拖放到此处，建议文件小于1 GB</p>
                            )
                        }
                    </div>
                </label>
                <div className='progress-bar'>
                    {progress !== 0 && <span>{progress}%</span>}
                    <ProgressBar completed={progress} />
                </div>
                <ButtonBox onOkBtnClick={onOkBtnClick} OnCancelBtnClick={onCancelBtnClick} okBtnInfo='上传' />
            </div >
            {
                stopTransferFileModalOpen &&
                <ConfirmModal modalInfo='文件上传中，确定终止吗？' onOkBtnClick={stopTransferFile}
                    OnCancelBtnClick={() => setStopTransferFileModalOpen(false)} />
            }
        </div >
    );
}

function ReceivingFileInfo({ progress, preAcceptFileName, preAcceptFileSize, }) {
    const formattedFileSize = formatFileSize(preAcceptFileSize);
    const styles = {
        container: {
            backgroundColor: '#f0f0f0',
            padding: '10px',
            borderRadius: '5px',
            textAlign: 'center',
            margin: '20px',
        },
        fileName: {
            fontWeight: 'bold',
            marginRight: '5px',
        },
    };
    return (
        <>
            {progress !== 0 &&
                <div>
                    <div style={styles.container}>
                        <span>
                            正在接收远程文件 <span style={styles.fileName}>{preAcceptFileName}</span>[{formattedFileSize}]，请耐心等待
                        </span>
                    </div>
                    <div className='progress-bar'>
                        <span>{progress}%</span>
                        <ProgressBar completed={progress} />
                    </div>
                </div >
            }
        </>
    );
}

function AcceptFileModal({ setModalOpen, progress, setReceiveFileAccepted, peer,
    preAcceptFileName, preAcceptFileSize }) {
    const onOkBtnClick = () => {
        setReceiveFileAccepted(true);
        peer.send(JSON.stringify({
            type: 'transferFileAccepted',
            value: true,
        }));
    };
    const onCancelBtnClick = () => {
        if (progress === 0)
            setReceiveFileAccepted(false);
        peer.send(JSON.stringify({
            type: 'transferFileAccepted',
            value: false,
        }));
        setModalOpen(false);
    };

    const formattedFileSize = formatFileSize(preAcceptFileSize);
    const styles = {
        container: {
            backgroundColor: '#f0f0f0',
            padding: '10px',
            borderRadius: '5px',
            textAlign: 'center',
            margin: '20px',
        },
        fileName: {
            fontWeight: 'bold',
            marginRight: '5px',
        },
    };
    return (
        <div className='select-video-modal-overlay'>
            <div className='select-video-modal'>
                <span className="close-button" onClick={onCancelBtnClick}>
                    &times;
                </span>
                <div style={styles.container}>
                    {progress === 0 ?
                        <span>
                            收到远程文件 <span style={styles.fileName}>{preAcceptFileName}</span>[{formattedFileSize}]，是否接收？
                        </span> :
                        <span>
                            正在接收远程文件 <span style={styles.fileName}>{preAcceptFileName}</span>[{formattedFileSize}]，请耐心等待
                        </span>
                    }
                </div>
                <div className='progress-bar'>
                    {progress !== 0 && <span>{progress}%</span>}
                    <ProgressBar completed={progress} />
                </div>
                {progress === 0 &&
                    <ButtonBox onOkBtnClick={onOkBtnClick} OnCancelBtnClick={onCancelBtnClick} />
                }
            </div >
        </div >
    );
}

function WaitModal({ modalInfo, setModalOpen, onCancelBtnClick, peer }) {
    function onCancelBtnClick() {
        setModalOpen(false);
        if (peer) {
            peer.send(JSON.stringify({
                type: 'transferFileCanceled',
            }));
        }
    }
    return (
        <div className="modal-overlay">
            <div className="modal">
                <p>{modalInfo}</p>
                <div className='button-confirm-container'>
                    <Button onClick={onCancelBtnClick}>取消</Button>
                </div>
            </div>
        </div>
    );
}

function VideoChat({ sid, deviceType, socket, returnMenuView,
    messages, setMessages, chatPanelOpen, setChatPanelOpen,
    peerSocketId/* 游戏中对方的socke id*/,
    pieceType,/*用于确定主动方 */
    localAudioEnabled, setPeerAudioEnabled, /**显示麦克风图标 */
    globalSignal, /**用于跨组件通信 */
    videoCallModalOpen, setVideoCallModalOpen, setFloatButtonVisible,
    floatButtonVisible,
    isLiveStream, liveStreamModalOpen, setLiveStreamModalOpen, lid, netConnected,/**直播 */
}) {
    // 通话
    const [me, setMe] = useState("");               // 本地socketId
    const [localStream, setLocalStream] = useState();
    const [localScreenStream, setLocalScreenStream] = useState();
    const [remoteStream, setRemoteStream] = useState();
    const [remoteScreenStream, setRemoteScreenStream] = useState();
    const [calling, setCalling] = useState(false);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");       // 拨打过来的socketId
    const [callerSignal, setCallerSignal] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callAcceptedSignalSend, setCallAcceptedSignalSend] = useState(false); // 接受信号送出
    const [callRejected, setCallRejected] = useState(false);
    const [idToCall, setIdToCall] = useState("");   // 要拨打的socketId
    const [isIdToCallReadOnly, setIsIdToCallReadOnly] = useState(false);
    const [toCallIsBusy, setToCallIsBusy] = useState(false); // 拨打的用户通话中
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState("");   // 我的昵称
    const [isNameReadOnly, setIsNameReadOnly] = useState(false);
    const [anotherName, setAnotherName] = useState(""); // 对方昵称
    const [another, setAnother] = useState();       // 当前通话的socketId
    const [noResponse, setNoResponse] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [prepareCallModal, setPrepareCallModal] = useState(false);

    // 控制
    const [videoEnabled, setVideoEnabled] = useState(peerSocketId ? false : (!isLiveStream));
    const [audioEnabled, setAudioEnabled] = useState(!isLiveStream);
    const [myVideoVolume, setMyVideoVolume] = useState(0); // myVideo volume
    const [userVideoVolume, setUserVideoVolume] = useState(0); // userVideo volume
    const [remoteShareScreenVolume, setRemoteShareScreenVolume] = useState(0); // remoteShareScreen volume
    const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(false);
    const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(false);
    const [screenAudioEnabled, setScreenAudioEnabled] = useState(true); // display media audio
    const [remoteScreenAudioEnabled, setRemoteScreenAudioEnabled] = useState(true);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    const [hasLocalVideoTrack, setHasLocalVideoTrack] = useState(true);
    const [hasRemoteVideoTrack, setHasRemoteVideoTrack] = useState(true);
    const [hasLocalAudioTrack, setHasLocalAudioTrack] = useState(true);
    const [hasRemoteAudioTrack, setHasRemoteAudioTrack] = useState(true);
    const [isShareScreen, setIsShareScreen] = useState(false);
    const [isReceiveShareScreen, setIsReceiveShareScreen] = useState(false);
    const [inviteVideoChatModalOpen, setInviteVideoChatModalOpen] = useState(false);
    const [strNowDate, setStrNowDate] = useState(); // current time formatted from server
    const [peerConfig, setPeerConfig] = useState();
    // MediaTrackSettings
    const [mediaTrackSettingsModalOpen, setMediaTrackSettingsModalOpen] = useState(false);
    const [localVideoWidth, setLocalVideoWidth] = useState(InitMediaTrackSettings.localVideoWidth);
    const [localVideoHeight, setLocalVideoHeight] = useState(InitMediaTrackSettings.localVideoHeight);
    const [localFrameRate, setLocalFrameRate] = useState(InitMediaTrackSettings.localFrameRate);
    const [facingMode, setFacingMode] = useState(InitMediaTrackSettings.facingMode);
    const [echoCancellation, setEchoCancellation] = useState(InitMediaTrackSettings.echoCancellation);
    const [noiseSuppression, setNoiseSuppression] = useState(InitMediaTrackSettings.noiseSuppression);
    const [sampleRate, setSampleRate] = useState(InitMediaTrackSettings.sampleRate);
    const [constraint, setConstraint] = useState({
        video: videoEnabled ? {
            width: localVideoWidth,
            height: localVideoHeight,
            frameRate: localFrameRate,
            facingMode: facingMode,
        } : false,
        audio: audioEnabled ? {
            echoCancellation: echoCancellation,
            noiseSuppression: noiseSuppression,
            sampleRate: sampleRate,
        } : false,
    });

    const [selectVideoModalOpen, setSelectVideoModalOpen] = useState(false);
    const [selectedLocalFile, setSelectedLocalFile] = useState();
    const [selectedMediaStream, setSelectedMediaStream] = useState();
    const [prevConstraint, setPrevConstraint] = useState(constraint);
    const [audioSource, setAudioSource] = useState();
    const [audioCtx, setAudioCtx] = useState();
    const selectedVideoRef = useRef(null);

    const onSelectedMediaStreamOn = () => {
        setPrevConstraint(constraint);
        setAudioEnabled(false);
        setVideoEnabled(false);
    }

    const onSelectedMediaStreamOff = () => {
        setConstraint(prevConstraint);
        setAudioEnabled(prevConstraint?.audio);
        setVideoEnabled(prevConstraint?.video);
    }

    useEffect(() => {
        if (selectedMediaStream) {
            if (myVideo?.current) {
                myVideo.current.muted = false;
                myVideo.current.volume = 1;
            }
            onSelectedMediaStreamOn();
        }
        else {
            onSelectedMediaStreamOff();
        }
    }, [selectedMediaStream]);

    useEffect(() => {
        setConstraint({
            video: videoEnabled ? {
                width: localVideoWidth,
                height: localVideoHeight,
                frameRate: localFrameRate,
                facingMode: facingMode,
            } : false,
            audio: audioEnabled ? {
                echoCancellation: echoCancellation,
                noiseSuppression: noiseSuppression,
                sampleRate: sampleRate,
            } : false,
        });
    }, [facingMode]);

    useEffect(() => {
        setConstraint({
            video: videoEnabled ? {
                width: localVideoWidth,
                height: localVideoHeight,
                frameRate: localFrameRate,
                facingMode: facingMode,
            } : false,
            audio: audioEnabled ? {
                echoCancellation: echoCancellation,
                noiseSuppression: noiseSuppression,
                sampleRate: sampleRate,
            } : false,
        });
    }, [audioEnabled, videoEnabled]);

    // 游戏语音模块
    const [haveCalledOnce, setHaveCalledOnce] = useState(false);

    // 统计inbound-rtp
    const [inboundVideoBitrate, setInboundBitrate] = useState(0);               // 入站视频比特率
    const [inboundVideoDelay, setInboundVideoDelay] = useState(0);              // 入站视频时延
    const [inboundFramesPerSecond, setInboundFramesPerSecond] = useState(0);    // 入站视频帧率
    const [inboundFrameWidth, setInboundFrameWidth] = useState(0);              // 入站视频帧宽度
    const [inboundFrameHeight, setInboundFrameHeight] = useState(0);            // 入站视频帧高度

    // 统计outbound-rtp
    const [outboundVideoBitrate, setOutboundBitrate] = useState(0);             // 出站视频比特率
    const [outboundFramesPerSecond, setOutboundFramesPerSecond] = useState(0);  // 出站视频帧率
    const [outboundFrameWidth, setOutboundFrameWidth] = useState(0);            // 出站视频帧宽度
    const [outboundFrameHeight, setOutboundFrameHeight] = useState(0);          // 出站视频帧高度

    // 分享屏幕
    const [inboundVideoBitrate_SC, setInboundBitrate_SC] = useState(0);               // 入站视频比特率
    const [inboundVideoDelay_SC, setInboundVideoDelay_SC] = useState(0);              // 入站视频时延
    const [inboundFramesPerSecond_SC, setInboundFramesPerSecond_SC] = useState(0);    // 入站视频帧率
    const [inboundFrameWidth_SC, setInboundFrameWidth_SC] = useState(0);              // 入站视频帧宽度
    const [inboundFrameHeight_SC, setInboundFrameHeight_SC] = useState(0);            // 入站视频帧高度
    const [outboundVideoBitrate_SC, setOutboundBitrate_SC] = useState(0);             // 出站视频比特率
    const [outboundFramesPerSecond_SC, setOutboundFramesPerSecond_SC] = useState(0);  // 出站视频帧率
    const [outboundFrameWidth_SC, setOutboundFrameWidth_SC] = useState(0);            // 出站视频帧宽度
    const [outboundFrameHeight_SC, setOutboundFrameHeight_SC] = useState(0);          // 出站视频帧高度

    const [localVideoDisplayRenderKey, setLocalVideoDisplayRenderKey] = useState(0);
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);
    const [enlargedVideoFrom, setEnlargedVideoFrom] = useState();
    const [localVideoUrl, setLocalVideoUrl] = useState();

    useEffect(() => {
        if (!selectedMediaStream && localVideoUrl) {
            URL.revokeObjectURL(localVideoUrl);
        }
    }, [selectedMediaStream]);

    const myVideo = useRef();
    const userVideo = useRef();
    const shareScreenVideo = useRef();
    const remoteShareScreenVideo = useRef();
    const connectionRef = useRef();
    const shareScreenConnRef = useRef();
    const timerRef = useRef();
    const videoPlayerRef = useRef(null);

    // 文件传输
    const expectedChunkIndexRef = useRef(0);
    const receivedChunksRef = useRef([]);
    const isTransferCompleteRef = useRef(false);
    const receiveFileNameRef = useRef('default_received_file_name');
    const [transferFileModalOpen, setTransferFileModalOpen] = useState(false);
    const [transferFileModalVisible, setTransferFileModalVisible] = useState(true);
    const [preAcceptFileModalOpen, setPreAcceptFileModalOpen] = useState(false); // Confirm modal
    const [preAcceptFileName, setPreAcceptFileName] = useState();
    const [preAcceptFileSize, setPreAcceptFileSize] = useState(0);
    const [receivedBytes, setReceivedBytes] = useState(0);
    const [receiveFileProgress, setReceiveFileProgress] = useState(0);
    const [fileTransferAccepted, setFileTransferAccepted] = useState(false);// Caller transfer when true
    const [receiveFileAccepted, setReceiveFileAccepted] = useState(false);// Callee receive when true
    const [waitConfirmTransferFileModalOpen, setWaitConfirmTransferFileModalOpen] = useState(false);

    // /////////////直播相关变量//////////////////////
    const [selectedRole, setSelectedRole] = useState();//扮演的角色
    const [liveRoomId, setLiveRoomId] = useState(); // 服务器分配给主播的房间号
    const [liveUrl, setLiveUrl] = useState(); // 直播间链接
    const [liveRoomIdToEnter, setLiveRoomIdToEnter] = useState(); // 观众进入的直播间号
    const [anchorSocketId, setAnchorSocketId] = useState();// 主播socketId
    const [anchorName, setAnchorName] = useState();//主播名称
    const [newViewer, setNewViewer] = useState(); //新加入的观众socketId
    const [newViewerName, setNewViewerName] = useState();//新加入观众的名称unused
    const [isConnected, setIsConnected] = useState(false);//观众是否连接到主播
    const [prepareEnterLiveRoomModal, setPrepareEnterLiveRoomModal] = useState(false);
    const [peerConn, setPeerConn] = useState({});//对等连接信息
    const [screenPeerConn, setScreenPeerConn] = useState({});//共享屏幕对等连接信息
    const [enteringLiveRoomModalOpen, setEnteringLiveRoomModalOpen] = useState(false);
    const [liveBtnClicked, setLiveBtnClicked] = useState(false); // 我是主播按钮是否被点击
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalInfo, setAlertModalInfo] = useState();
    const [anchorStopLiveStream, setAnchorStopLiveStream] = useState(false); // 主播离开房间
    const [viewerLeaveLiveRoom, setViewerLeaveLiveRoom] = useState(false); // 观众离开房间
    const [liveRoomChatPanelDisplay, setLiveRoomChatPanelDisplay] = useState(false); // 显示/隐藏聊天板
    const [liveMsgs, setLiveMsgs] = useState([]);
    // /////////////直播相关变量//////////////////////

    useEffect(() => {
        if (receivedBytes) {
            setReceiveFileProgress(Number((receivedBytes / preAcceptFileSize * 100).toFixed(2)));
        }
    }, [receivedBytes]);

    useEffect(() => {
        if (fileTransferAccepted) {
            setTimeout(() => setFileTransferAccepted(false), 1000);
        }
    }, [fileTransferAccepted]);

    const initTransferRefs = (fileName) => {
        setReceivedBytes(0);
        setReceiveFileProgress(0);
        expectedChunkIndexRef.current = 0;
        receivedChunksRef.current = [];
        isTransferCompleteRef.current = false;
        receiveFileNameRef.current = fileName ? fileName : 'default_received_file_name';
    }

    useEffect(() => {
        if (globalSignal && globalSignal[GlobalSignal.Active] && globalSignal[GlobalSignal.ReturnMenu]) {
            onReturnMenuBtnClick();
        }
    }, [globalSignal]);

    const getVideoCountInContainer = (selector) => {
        const videoContainer = document.querySelector(selector);
        if (!videoContainer) {
            return 0;
        }
        const videoChildren = videoContainer.querySelectorAll(selector + ' > .video');
        return videoChildren.length;
    };

    useEffect(() => {
        const nVCount = getVideoCountInContainer('.video-container');
        setShowVideoPlayer(nVCount !== 1);
        if (nVCount === 1) {
            root.style.setProperty('--video-container-width', '100%');
            root.style.setProperty('--video-container-height', '100%');
            root.style.setProperty('--video-container-video-height', '100%');
            root.style.setProperty('--video-container-video-width', '100%');
            return;
        }
        if (deviceType === DeviceType.PC) {
            root.style.setProperty('--video-container-flex-direction', 'row');
            root.style.setProperty('--video-container-width', '30%');
            const singleHeight = (1 / (nVCount > 2 ? 2 : nVCount) * 100 + 10).toFixed(2) + '%';
            root.style.setProperty('--video-container-overflow-y', 'scroll');
            root.style.setProperty('--video-container-video-height', singleHeight);
            root.style.setProperty('--video-container-overflow-x', 'hidden');
            root.style.setProperty('--video-container-flex-wrap', 'wrap');
        }
        else if (deviceType === DeviceType.MOBILE) {
            root.style.setProperty('--video-container-height', '30%');
            const singleWidth = (1 / 1 * 100 - 10).toFixed(2) + '%';
            root.style.setProperty('--video-container-video-width', singleWidth);
            root.style.setProperty('--video-container-overflow-x', 'scroll');
            root.style.setProperty('--video-container-flex-wrap', 'wrap');
        }
        setLocalVideoDisplayRenderKey(prev => !prev);
    }, [callAccepted, isShareScreen, isReceiveShareScreen]);

    useEffect(() => {
        if (!showVideoPlayer || !videoPlayerRef.current) return;
        if (remoteStream?.active) {
            videoPlayerRef.current.srcObject = remoteStream;
            setEnlargedVideoFrom(getEnlargedVideoFrom(remoteStream?.id));
        }
    }, [showVideoPlayer, videoPlayerRef.current, remoteStream]);

    useEffect(() => {
        if (!showVideoPlayer || !videoPlayerRef.current) return;
        if (localScreenStream?.active) {
            videoPlayerRef.current.srcObject = localScreenStream;
            setEnlargedVideoFrom(getEnlargedVideoFrom(localScreenStream?.id));
        }
    }, [showVideoPlayer, videoPlayerRef.current, localScreenStream]);

    useEffect(() => {
        if (!showVideoPlayer || !videoPlayerRef.current) return;
        if (remoteScreenStream?.active) {
            videoPlayerRef.current.srcObject = remoteScreenStream;
            setEnlargedVideoFrom(getEnlargedVideoFrom(remoteScreenStream?.id));
        }
    }, [showVideoPlayer, videoPlayerRef.current, remoteScreenStream]);

    useEffect(() => {
        if (socket.id) {
            setMe(socket.id);
        }
    }, [socket.id]);

    useEffect(() => {
        if (callAccepted) {
            if (typeof setVideoCallModalOpen === 'function') {
                setVideoCallModalOpen(false);
            }
        }
    }, [callAccepted]);

    useEffect(() => {
        const iceServers = [];
        iceServers.push({ urls: 'stun:stun.l.google.com:19302' });
        if (process.env.REACT_APP_STUN_URL) {
            iceServers.push({
                urls: process.env.REACT_APP_STUN_URL,
            });
        }
        if (process.env.REACT_APP_TURN_URL) {
            iceServers.push({
                urls: process.env.REACT_APP_TURN_URL,
                credential: process.env.REACT_APP_TURN_CREDENTIAL,
                username: process.env.REACT_APP_TURN_USERNAME,
            });
        }

        setPeerConfig({
            iceServers: iceServers
        });
    }, []);

    useEffect(() => {
        if (localAudioEnabled !== undefined) {
            setAudioEnabled(localAudioEnabled);
            if (socket && peerSocketId) {
                socket.emit("peerAudioStatus", { to: peerSocketId, status: localAudioEnabled });
            }
            if (!localAudioEnabled) {
                stopMediaTracks(localStream);
            }
        }
    }, [localAudioEnabled]); // 游戏语音通话

    useEffect(() => {
        clearTimeout(timerRef.current);
        if (peerSocketId && localStream) {
            if (peerSocketId && pieceType === Piece_Type_White) {
                setIdToCall(peerSocketId);
                setIsIdToCallReadOnly(true);
                timerRef.current = setTimeout(() => callUser(peerSocketId, true), 1000);
            }
        }
        return () => clearTimeout(timerRef.current);
    }, [localStream]);

    useEffect(() => {
        if (socket) {
            socket.on("peerAudioStatus", (status) => {
                setPeerAudioEnabled(status);
            });
        }
    }, [socket]);

    // 组件卸载时关闭流
    useEffect(() => {
        return () => {
            window.cleanupMediaTracks();
            delete window.cleanupMediaTracks;
        };
    }, []);

    useEffect(() => {
        window.cleanupMediaTracks = () => {
            stopMediaTracks(localStream);
            stopMediaTracks(localScreenStream);
        };
    }, [localStream, localScreenStream]);

    useEffect(() => {
        if (socket) {
            socket.on("formatDateGot", (data) => {
                setStrNowDate(data);
            });
        }
    }, [socket]);

    useEffect(() => {
        if (another && isShareScreen && localScreenStream) {
            shareScreen(localScreenStream, another);
        }
    }, [another]);

    useEffect(() => {
        if (sid) {
            setIdToCall(sid);
            setName('大魔王');
            setIsIdToCallReadOnly(true);
            setIsNameReadOnly(true);
            setPrepareCallModal(true);
        }
    }, [sid, socket]);

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
            const stream = await navigator.mediaDevices.getUserMedia(constraint);
            return stream;
        } catch (error) {
            console.error('未打开摄像头和麦克风', error);
        }
    }

    // 获取屏幕共享流
    async function getDisplayMediaStream() {
        try {
            // 请求用户选择屏幕或应用程序窗口
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            stream.oninactive = function () {
                stream.getTracks().forEach(track => track.stop());
                setIsShareScreen(false);
            };
            return stream;
        } catch (error) {
            console.error('Error accessing screen:', error);
        }
    }

    // 停止分享本地屏幕
    const notifyShareScreenStopped = () => {
        stopMediaTracks(localScreenStream);
        if (shareScreenConnRef.current && shareScreenConnRef.current.peer) {
            shareScreenConnRef.current.peer.destroy();
        }
        if (another) {
            socket.emit("shareScreenStopped", { to: another });
        }
        if (isLiveStream) { /**直播 */
            if (selectedRole === LiveStreamRole.Anchor) {
                for (let id in peerConn) {
                    if (id.startsWith('$')) continue;
                    stopLiveLocalScreenStream(id);
                    socket.emit("stopLiveScreenStream", { to: id, from: socket.id });
                }
            }
        }
    };

    // 使对方停止分享屏幕
    const stopAnotherScreenSharing = () => {
        if (another) {
            socket.emit("stopShareScreen", { to: another });
        }
    };

    useEffect(() => {
        if (!isShareScreen) {
            notifyShareScreenStopped();
        }
        else if (isShareScreen && shareScreenVideo.current && !shareScreenVideo.current.srcObject) {
            getDisplayMediaStream()
                .then(stream => {
                    if (stream) {
                        const audioTracksLength = stream.getAudioTracks().length;
                        if (audioTracksLength > 0) {
                            setScreenAudioEnabled(true);
                        }
                        else {
                            setScreenAudioEnabled(false);
                        }
                        setLocalScreenStream(stream);
                        shareScreenVideo.current.srcObject = stream;
                        if (callAccepted) {
                            shareScreen(stream, another);
                        }
                        if (isLiveStream && selectedRole === LiveStreamRole.Anchor) {/**直播 */
                            for (let id in peerConn) {
                                if (id === '$isCloseConn') continue;
                                pushScreenStream(id, stream, true);
                            }
                        }
                    }
                    else {
                        setIsShareScreen(false);
                    }
                });
        }
    }, [isShareScreen]);

    const stopMediaTracks = (stream) => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }
    };

    // 更新轨道
    useEffect(() => {
        if (!peerSocketId) {
            if (!videoEnabled) {
                stopMediaTracks(localStream);
            }
        }
        getUserMediaStream()
            .then(stream => {
                // 已连接
                if (connectionRef.current && connectionRef.current.peer && !connectionRef.current.peer.destroyed) {
                    if (selectedMediaStream) {
                        if (localStream && localStream.active) {
                            localStream.getTracks().forEach(track => {
                                connectionRef.current.peer.removeTrack(track, localStream);
                            });
                        }
                        if (selectedMediaStream) {
                            selectedMediaStream.getTracks().forEach(track => {
                                setTimeout(() => connectionRef.current.peer.addTrack(track, stream), 1000);// 需要延迟否则视频轨道接收不到
                            });
                        }
                    }
                    else {
                        if (localStream && localStream.active) {
                            localStream.getTracks().forEach(track => {
                                const submap = connectionRef.current.peer._senderMap.get(track);
                                const sender = submap ? submap.get(stream) : null;
                                if (sender) {
                                    connectionRef.current.peer.removeTrack(track, localStream);
                                }
                            });
                        }
                        if (stream) {
                            stream.getTracks().forEach(track => {
                                setTimeout(() => connectionRef.current.peer.addTrack(track, stream), 1000); // 需要延迟否则视频轨道接收不到
                            });
                        }
                        else {
                            // No MediaStream
                            // connectionRef.current.peer.send('nomedia');
                            socket.emit("nomedia", { to: another });
                        }
                    }
                }
                if (selectedMediaStream) {
                    setLocalStream(selectedMediaStream);
                    if (myVideo.current) {
                        myVideo.current.srcObject = selectedMediaStream;
                    }
                }
                else {
                    setLocalStream(stream);
                    if (myVideo.current) {
                        myVideo.current.srcObject = stream;
                    }
                }
            });

        return () => {
            // 在组件卸载时停止媒体流
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [constraint, selectedAudioDevice, selectedVideoDevice, selectedMediaStream]);

    useEffect(() => {
        if (socket && myVideo.current) {
            getUserMediaStream()
                .then(stream => {
                    if (stream) {
                        setLocalStream(stream);
                        if (myVideo?.current) {
                            myVideo.current.srcObject = stream;
                        }
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
                    userVideo.current.srcObject = null;
                }
                if (connectionRef.current) {
                    connectionRef.current.peer.destroy();
                }
                // 退出屏幕共享
                if (remoteShareScreenVideo.current && remoteShareScreenVideo.current.srcObject) {
                    remoteShareScreenVideo.current.srcObject.getTracks().forEach(track => {
                        track.stop();
                    });
                    remoteShareScreenVideo.current.srcObject = null;
                }
                if (shareScreenVideo.current && shareScreenVideo.current.srcObject) {
                    shareScreenVideo.current.srcObject.getTracks().forEach(track => {
                        track.stop();
                    });
                    shareScreenVideo.current.srcObject = null;
                }
                if (shareScreenConnRef.current) {
                    shareScreenConnRef.current.peer.destroy();
                }
            });

            socket.on("callCanceled", () => {
                setReceivingCall(false);
            });

            socket.on("nomedia", () => {
                setHasRemoteVideoTrack(false);
                setHasRemoteAudioTrack(false);
            });

            socket.on("shareScreen", (data) => {
                setIsReceiveShareScreen(true);
                acceptShareScreen(data.signal);
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
        socket.on("isBusy", handleToCallBusy);
        return () => {
            socket.off("isBusy", handleToCallBusy);
        }
    }, [calling]);

    useEffect(() => {
        if (callAcceptedSignalSend) {
            setCallAcceptedSignalSend(false);
            // 重写被动方peer监听器
            const handleAnswerSignal = (data) => {
                if (callAccepted) {
                    socket.emit("changeTrack", { signal: data, to: caller });
                } // 当主叫方切换流
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

    // const canvas = document.createElement('canvas'); // 创建画布元素
    // const ctx = canvas.getContext('2d'); // 获取画布上下文对象
    useEffect(() => {
        if (connectionRef.current) {
            const peer = connectionRef.current.peer;
            if (connectionRef.current.isCaller) {
                peer.on("signal", (data) => {
                    const dataType = data.type;
                    // const trackCount = parseSDP(data.sdp);
                    if (dataType === 'offer') {
                        socket.emit("callUser", {
                            userToCall: connectionRef.current.idToCall,
                            signalData: data,
                            from: me ? me : socket.id,
                            name: name,
                            isInGame: connectionRef.current.isInGame
                        });
                        setCallerSignal(data);
                    }
                });
                // 接收到流（stream）时触发
                peer.on("stream", (stream) => {
                    if (userVideo.current) {
                        userVideo.current.srcObject = stream;
                        setRemoteStream(stream);
                    }
                });

                socket.on("callAccepted", (data) => {
                    setCallAccepted(true);
                    if (!peer.destroyed) {
                        peer.signal(data.signal);
                    }
                    setCalling(false);
                    setAnother(idToCall);
                    setAnotherName(data.name);
                });

                socket.on("changeTrackAgreed", (signal) => {
                    if (!peer.destroyed) {
                        peer.signal(signal);
                    }
                });

                peer.on('connect', () => {
                    console.log('Connected with ' + idToCall);
                    // checkVideoBitrate(peer);
                });

            } // 主叫方
            else {
                const handleAnswerSignal = (data) => {
                    const dataType = data.type;
                    if (dataType === 'answer') {
                        socket.emit("acceptCall", { signal: data, to: caller, name: name });
                        setCallAcceptedSignalSend(true);
                    }
                }
                peer.on("signal", handleAnswerSignal);
                peer.on("stream", (stream) => {
                    if (userVideo.current) {
                        userVideo.current.srcObject = stream;
                        setRemoteStream(stream);
                    }

                    // 测试
                    // 由于通信双方处于对称NAT网络，需要配置stun服务器进行流量中继。
                    // setInterval(() => {
                    //     // 将视频帧绘制到画布上
                    //     ctx.drawImage(userVideo.current, 0, 0, canvas.width, canvas.height);

                    //     // 从画布中获取图像数据
                    //     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    //     // 这里可以将图像数据发送到服务器或者进行其他处理
                    //     console.log(imageData); // 举例：在控制台输出图像数据
                    // }, 5000); // 每1秒执行一次
                });
                peer.on('connect', () => {
                    console.log('Connected with ' + another);
                    // checkVideoBitrate(peer);
                });
            }

            peer.on('error', (err) => {
                console.error(err);
            });
            peer.on('close', () => {
                console.log('连接关闭：' + another);
            });

            // There is process not defined bug
            // Now it is solved by installing module 'process'.
            peer.on('data', (data) => {
                if (isJSON(data)) {
                    const msg = JSON.parse(data);
                    if (msg.type === 'remoteAudioStatus') {
                        setRemoteAudioEnabled(msg.status);
                    }
                    else if (msg.type === 'remoteVideoStatus') {
                        setRemoteVideoEnabled(msg.status);
                    }
                    else if (msg.sender) { // 文本通信
                        console.log('Received message from peer: ' + msg.text);
                        if (!chatPanelOpen) {
                            showNotification(msg.text);
                        }
                        msg.sender = 'other';
                        setMessages(prev => [...prev, msg]);
                    }
                    else if (msg.type === 'transferFileRequest') {
                        setPreAcceptFileModalOpen(true);
                        setPreAcceptFileName(msg.fileName);
                        setPreAcceptFileSize(msg.fileSize);
                    }
                    else if (msg.type === 'transferFileCanceled') {
                        setPreAcceptFileModalOpen(false);
                        setPreAcceptFileName();
                        setPreAcceptFileSize(0);
                    }
                    else if (msg.type === 'transferFileAccepted') {
                        setFileTransferAccepted(msg.value);
                        setWaitConfirmTransferFileModalOpen(false);
                    }
                    else if (msg.type === 'transferFileStopped') {
                        initTransferRefs();
                    }
                    else if (msg.type === 'transferFile') {
                        initTransferRefs(msg.fileName);
                    }
                }
                else {
                    receiveTransferFile(data);
                }
            });
            return () => {
                peer.removeAllListeners('data'); // Clear effect of chatPanelOpen
            }
        }
    }, [connectionRef.current, chatPanelOpen]);

    const isJSON = (str) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    const receiveTransferFile = (data) => {
        const messageBytes = data.slice(0, 10);
        const chunkData = data.slice(10);
        const chunkIndex =
            (messageBytes[0] << 56) |
            (messageBytes[1] << 48) |
            (messageBytes[2] << 40) |
            (messageBytes[3] << 32) |
            (messageBytes[4] << 24) |
            (messageBytes[5] << 16) |
            (messageBytes[6] << 8) |
            messageBytes[7];
        const isFirstChunk = messageBytes[8] === 1;
        const isLastChunk = messageBytes[9] === 1;
        if (chunkIndex === expectedChunkIndexRef.current) {
            receivedChunksRef.current.push(chunkData);
            setReceivedBytes(prev => prev + chunkData.byteLength);
            if (isFirstChunk) {
                setReceivedBytes(0);
            }
            if (isLastChunk) {
                const receivedArrayBuffer = new Uint8Array(receivedChunksRef.current.reduce((acc, byteChunk) => {
                    const tmp = new Uint8Array(acc.byteLength + byteChunk.byteLength);
                    tmp.set(new Uint8Array(acc), 0);
                    tmp.set(new Uint8Array(byteChunk), acc.byteLength);
                    return tmp.buffer;
                }, new ArrayBuffer(0)));
                const receivedBlob = new Blob([receivedArrayBuffer]);
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(receivedBlob);
                downloadLink.download = receiveFileNameRef.current;
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();

                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(downloadLink.href);
                initTransferRefs();
                setPreAcceptFileModalOpen(false);
                setPreAcceptFileName();
                setPreAcceptFileSize(0);
                setReceivedBytes(0);
                setReceiveFileProgress(0);
            }
            expectedChunkIndexRef.current += 1;
        }
    };

    useEffect(() => {
        if (shareScreenConnRef.current) {
            const peer = shareScreenConnRef.current.peer;
            if (shareScreenConnRef.current.isSharer) {
                peer.on("signal", (data) => {
                    if (shareScreenConnRef.current.idToShare) {
                        socket.emit("shareScreen", {
                            idToShare: shareScreenConnRef.current.idToShare,
                            from: socket.id,
                            signalData: data,
                        });
                    }
                });
                // 接收到流（stream）时触发
                peer.on("stream", (stream) => {
                    if (remoteShareScreenVideo.current) {
                        remoteShareScreenVideo.current.srcObject = stream;
                        setRemoteStream(stream);
                    }
                });

                peer.on('error', (err) => {
                    console.error(err);
                });

                socket.on("shareScreenAccepted", (signal) => {
                    if (!peer.destroyed) {
                        peer.signal(signal);
                    }
                });
            }
            else {
                const handleAnswerSignal = (data) => {
                    socket.emit("acceptShareScreen", {
                        signal: data,
                        to: another,
                    });
                }
                peer.on("signal", handleAnswerSignal);
                peer.on("stream", (stream) => {
                    // console.log('receiveLocalScreenStream--------');
                    // stream.getTracks().forEach((track) => {
                    //     console.log(track.kind);
                    // });
                    if (remoteShareScreenVideo.current) {
                        remoteShareScreenVideo.current.srcObject = stream;
                        setRemoteScreenStream(stream);
                    }
                });
                peer.on('error', (err) => {
                    console.error(err);
                });
            }
            socket.on("shareScreenStopped", () => {
                setIsReceiveShareScreen(false);
                shareScreenConnRef.current.peer.destroy();
            });

            socket.on("stopShareScreen", () => {
                setIsShareScreen(false);
            });
        }
    }, [shareScreenConnRef.current]);

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
                if (data.isInGame) { // 游戏语音
                    setCaller(data.from);
                    setAnotherName(data.name);
                    setCallerSignal(data.signal);
                    setTimeout(() => acceptCall(data.signal, data.from), 5000);
                }
                else {
                    setReceivingCall(true);
                    setCaller(data.from);
                    setAnotherName(data.name);
                    setCallerSignal(data.signal);
                }
            } // 处理初次连接
        }
        socket.on("callUser", handleCallUser);
        return () => {
            socket.off("callUser", handleCallUser);
        };
    }, [callAccepted]);

    useEffect(() => {
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

    const shareScreen = (stream, id) => {
        const peer = createCallPeer(stream);
        // console.log('sendLocalScreenStream--------');
        // stream.getTracks().forEach((track) => {
        //     console.log(track.kind);
        // });
        shareScreenConnRef.current = {
            peer: peer,
            isSharer: true,
            idToShare: id,
        }
    }

    const acceptShareScreen = (signal) => {
        const peer = createAnswerPeer();
        peer.signal(signal);
        shareScreenConnRef.current = {
            peer: peer,
            isSharer: false
        };
    };

    const createCallPeer = (stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
            wrtc: wrtc,
            config: peerConfig,
        });
        return peer;
    }

    const callUser = (id, isInGame, stream) => {
        if (isInGame) {
            if (haveCalledOnce) {
                return;
            }
            else {
                setHaveCalledOnce(true);
            }
        }
        if (!peerSocketId) {
            if (!audioEnabled) {
                showNotification("请打开麦克风");
                return;
            }
            if (!videoEnabled) {
                showNotification("请打开摄像头");
                return;
            }
        }
        setCalling(true);
        const peer = createCallPeer(stream ? stream : localStream);
        connectionRef.current = {
            peer: peer,
            isCaller: true,
            idToCall: id,
            isInGame: isInGame
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
            stream: stream,
            wrtc: wrtc,
            config: peerConfig,
        });

        return peer;
    }

    const acceptCall = (signal, from) => {
        setReceivingCall(false);
        setCallAccepted(true);
        const peer = createAnswerPeer(localStream);
        if (signal) { // 游戏语音
            peer.signal(signal);
            setAnother(from);
        }
        else {
            peer.signal(callerSignal);
            setAnother(caller);
        }
        connectionRef.current = {
            peer: peer,
            isCaller: false
        };
    }

    const rejectCall = () => {
        setReceivingCall(false);
        socket.emit("rejectCall", { to: caller });
    }

    const leaveCall = () => {
        socket.emit("endConnect", { me: me, another: another });
    }


    const createVirtualStream = () => {
        // 创建一个 Canvas 元素
        const canvas = document.createElement('canvas');
        canvas.width = 640; // 设置 Canvas 的宽度
        canvas.height = 480; // 设置 Canvas 的高度
        const ctx = canvas.getContext('2d');

        function drawSnow() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < 100; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 5;
                ctx.fillStyle = 'white';
                ctx.fillRect(x, y, size, size);
            }
            requestAnimationFrame(drawSnow);
        }
        drawSnow();
        const virtualStream = new MediaStream();
        const virtualVideoTrack = canvas.captureStream().getVideoTracks()[0];
        virtualStream.addTrack(virtualVideoTrack);

        return virtualStream;
    };

    ///////////////////////////////////直播////////////////////////////////////////////////

    const stopLiveRemoteScreenStream = () => {
        // 退出屏幕共享
        if (remoteShareScreenVideo.current && remoteShareScreenVideo.current.srcObject) {
            remoteShareScreenVideo.current.srcObject.getTracks().forEach(track => {
                track.stop();
            });
            remoteShareScreenVideo.current.srcObject = null;
        }
        setIsReceiveShareScreen(false);
    };

    const stopLiveLocalScreenStream = (id) => {
        const screenPeer = screenPeerConn[id]?.peer;
        if (shareScreenVideo.current && shareScreenVideo.current.srcObject) {
            shareScreenVideo.current.srcObject.getTracks().forEach(track => {
                track.stop();
            });
            shareScreenVideo.current.srcObject = null;
        }
        if (screenPeer) {
            screenPeer.destroy();
        }
        setIsShareScreen(false);
    };

    const stopLiveScreenStream = (id) => {
        stopLiveRemoteScreenStream();
        stopLiveLocalScreenStream(id);
    };

    const stopLiveStream = (id) => {
        if (!id) return;
        const peer = peerConn[id]?.peer;
        if (userVideo.current && userVideo.current.srcObject) {
            userVideo.current.srcObject.getTracks().forEach(track => {
                track.stop();
            });
            userVideo.current.srcObject = null;
        }
        if (peer) {
            peer.destroy();
        }
        stopLiveScreenStream(id);
    };

    const stopLive = () => {
        for (let id in peerConn) {
            if (id.startsWith('$')) continue;
            stopLiveStream(id);
            socket.emit("stopLiveStream", { to: id, from: socket.id });
        }
        setVideoEnabled(false);
        setAudioEnabled(false);
    };

    const leaveLiveRoom = () => {
        for (let id in peerConn) {
            if (id.startsWith('$')) continue;
            stopLiveStream(id);
            socket.emit("leaveLiveRoom", { to: id, from: socket.id });
            setViewerLeaveLiveRoom(true);
        }
    };

    const replaceLiveStream = (id, userMediaStream, selectedMediaStream) => {
        if (!id) return;
        const peer = peerConn[id]?.peer;
        let newStream = selectedMediaStream ? selectedMediaStream : userMediaStream;
        if (peer) {
            if (localStream && localStream.active) {
                localStream.getTracks().forEach(track => {
                    const submap = peer._senderMap.get(track);
                    const sender = submap ? submap.get(userMediaStream) : null;
                    if (sender) {
                        peer.removeTrack(track, localStream);
                    }
                });
            }
            // peer.removeStream(localStream);
            if (newStream && !peer.destroyed) {
                newStream.getTracks().forEach(track => {
                    peer.addTrack(track, newStream);// 需要延迟否则视频轨道接收不到
                });
            }
        }
        setLocalStream(newStream);
        if (myVideo.current) {
            myVideo.current.srcObject = newStream;
        }
    };

    // 更新直播轨道
    useEffect(() => {
        getUserMediaStream()
            .then(stream => {
                for (let id in peerConn) {
                    if (id.startsWith('$')) continue;
                    replaceLiveStream(id, stream, selectedMediaStream);
                }
            });
        return () => {
            stopMediaTracks(localStream);
        };
    }, [constraint, selectedAudioDevice, selectedVideoDevice, selectedMediaStream]);

    useEffect(() => {
        if (socket) {
            socket.on("viewerLeaveLiveRoom", (data) => {
                // showNotification(data.from + '离开了直播间', 2000, 'dark', 'bottom', 'right');
            });

            const handleEnterLiveRoomFailure = (res) => {
                setEnteringLiveRoomModalOpen(false);
                let alertInfo;
                if (res === 'anchorOffline') {
                    alertInfo = '主播暂时离开了直播间';
                }
                else if (res === "liveRoomNotExist") {
                    alertInfo = '直播间不存在';
                }
                setAlertModalInfo(alertInfo);
                setAlertModalOpen(true);
            };
            socket.on("anchorOffline", handleEnterLiveRoomFailure);
            socket.on("liveRoomNotExist", handleEnterLiveRoomFailure);
        }
    }, [socket]);

    const enterLiveRoom = (liveRoomId) => {
        if (liveRoomId) {
            setEnteringLiveRoomModalOpen(true);
            socket.emit("enterLiveRoom", liveRoomId);
        }
    }

    const connectViewer = (id) => {
        pushStream(id);
        if (isShareScreen) {
            pushScreenStream(id);
        }
    }

    // useEffect(() => {
    //     if (newViewer) {
    //         pushStream(newViewer);
    //         if (isShareScreen) {
    //             pushScreenStream(newViewer);
    //         }
    //     }
    // }, [newViewer]);

    useEffect(() => {
        if (socket) {
            const handleEnterLiveRoomRequest = (data) => {
                if (selectedRole !== LiveStreamRole.Anchor) {
                    socket.emit('anchorOffline', data);
                    return;
                };
                if (data) {
                    setNewViewer(data);
                }
                connectViewer(data);
            };
            socket.on("enterLiveRoomRequest", handleEnterLiveRoomRequest);

            const handleQueryWaitingViewersResult = (res) => {
                if (res) {
                    res.forEach((viewerId) => {
                        connectViewer(viewerId);
                    });
                }
            }
            socket.on("queryWaitingViewersResult", handleQueryWaitingViewersResult);

            return () => {
                socket.off("enterLiveRoomRequest", handleEnterLiveRoomRequest);
                socket.off("queryWaitingViewersResult", handleQueryWaitingViewersResult);
            };
        }
    }, [socket, isShareScreen, localStream, localScreenStream, selectedRole]);

    useEffect(() => {
        if (lid) {
            setSelectedRole(LiveStreamRole.Viewer);
            setAudioEnabled(false);
            setVideoEnabled(false);
            setLiveRoomIdToEnter(lid);
            setName('观众' + maskSocketId(socket?.id));
            setEnteringLiveRoomModalOpen(true);
            if (netConnected && userVideo.current) {
                enterLiveRoom(lid);
            }
        }
    }, [lid, netConnected, userVideo.current]);

    useEffect(() => {
        if (selectedRole === LiveStreamRole.Viewer && (lid || liveRoomIdToEnter)) {
            setEnteringLiveRoomModalOpen(!isConnected);
        }
    }, [isConnected, selectedRole, lid]);

    useEffect(() => {
        if (anchorStopLiveStream) {
            setEnteringLiveRoomModalOpen(false);
            setAlertModalInfo('主播离开了直播间');
            setAlertModalOpen(true);
            setAnchorStopLiveStream(false);
            setLiveRoomChatPanelDisplay(true);
        }
    }, [anchorStopLiveStream]);

    useEffect(() => {
        if (viewerLeaveLiveRoom) {
            setEnteringLiveRoomModalOpen(false);
            setViewerLeaveLiveRoom(false);
            setLiveRoomChatPanelDisplay(true);
        }
    }, [viewerLeaveLiveRoom]);

    const registPeerFunc = (peer, id, isAnchor) => {
        if (isAnchor) {
            peer.on("signal", (data) => {
                const dataType = data.type;
                if (dataType === 'offer') {
                    socket.emit("pushStream", {
                        userToCall: id,
                        signalData: data,
                        from: socket.id,
                        name: name,
                    });
                }
            });
            // 接收到流（stream）时触发
            peer.on("stream", (stream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                    setRemoteStream(stream);
                }
            });

            peer.on('connect', () => {
                console.log('Connected with ' + id);
            });
        }
        else {
            const handleAnswerSignal = (data) => {
                const dataType = data.type;
                if (dataType === 'answer') {
                    socket.emit("acceptStream", { signal: data, to: id, name: name, from: socket.id });
                }
            }
            peer.on("signal", handleAnswerSignal);
            peer.on("stream", (stream) => {
                // console.log('receiveStream--------');
                // stream.getTracks().forEach((track) => {
                //     console.log(track.kind);
                // });
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                    setRemoteStream(stream);
                }
            });
            peer.on('connect', () => {
                console.log('Connected with ' + id);
                setIsConnected(true);
            });
        }
        peer.on('error', (err) => {
            console.error(err);
        });
        peer.on('close', () => {
            console.log('连接关闭：' + id);
            setPeerConn(prev => {
                const { [id]: idToRemoveValue, ...rest } = prev;
                if (idToRemoveValue === peer) {
                    return {
                        ...rest,
                        $isCloseConn: true,
                    };
                }
                else {
                    return prev;
                }
            });
            // showNotification(socket.id + '离开了直播间', 2000, 'dark', 'bottom', 'right');
            setIsConnected(false);
        });

        // peer.on('data', handleOnData);
    };

    const forwardData = (peerConn, data, from) => {
        if (!peerConn) return;
        for (let id in peerConn) {
            if (id.startsWith('$') || id === from) continue;
            const peer = peerConn[id].peer;
            if (peer && !peer.destroyed) {
                peer.send(data);
            }
        }
    };

    useEffect(() => {
        const handleOnData = (data) => {
            if (isJSON(data)) {
                const msg = JSON.parse(data);
                if (msg.sender) {
                    setLiveMsgs(prev => [...prev, msg]);
                    // 转发
                    if (selectedRole === LiveStreamRole.Anchor) {
                        forwardData(peerConn, data, msg.sender);
                    }
                }
            }
        };
        for (let id in peerConn) {
            if (id.startsWith('$')) continue;
            const peer = peerConn[id].peer;
            if (peer && !peer.destroyed) {
                peer.on('data', handleOnData);
            }
        }
        return () => {
            for (let id in peerConn) {
                if (id.startsWith('$')) continue;
                const peer = peerConn[id].peer;
                if (peer && !peer.destroyed) {
                    peer.removeAllListeners('data', handleOnData);
                }
            }
        }
    }, [peerConn, selectedRole]);

    useEffect(() => {
        // if (peerConn['$isCloseConn']) return;
        if (socket && peerConn) {
            const handleStreamAccepted = (data) => {
                const peer = peerConn[data.from]?.peer;
                if (peer && !peer.destroyed) {
                    peer.signal(data.signal);
                }
            };

            socket.on("streamAccepted", handleStreamAccepted);
            return () => {
                // if (peerConn['$isCloseConn']) return;
                socket.off("streamAccepted", handleStreamAccepted);
            }
        }
    }, [socket, peerConn]);

    useEffect(() => {
        // if (peerConn['$isCloseConn'] || screenPeerConn['$isCloseConn']) return;
        if (socket && peerConn && screenPeerConn) {
            const handleStopLiveStream = (data) => {
                stopLiveStream(data.from);
                setAnchorStopLiveStream(true);
            };

            socket.on("liveStreamStopped", handleStopLiveStream);
            return () => {
                // if (peerConn['$isCloseConn'] || screenPeerConn['$isCloseConn']) return;
                socket.off("liveStreamStopped", handleStopLiveStream);
            }
        }
    }, [socket, peerConn, screenPeerConn]);

    useEffect(() => {
        // if (screenPeerConn['$isCloseConn']) return;
        if (socket && screenPeerConn) {
            const handleStopLiveScreenStream = (data) => {
                stopLiveRemoteScreenStream(data.from);
            };

            socket.on("liveScreenStreamStopped", handleStopLiveScreenStream);
            return () => {
                // if (screenPeerConn['$isCloseConn']) return;
                socket.off("liveScreenStreamStopped", handleStopLiveScreenStream);
            }
        }
    }, [socket, screenPeerConn]);

    useEffect(() => {
        if (socket) {
            const handleGetLiveStream = (data) => {
                if (isConnected) {
                    const peer = peerConn[data.from]?.peer;
                    if (peer && !peer.destroyed) {
                        peer.signal(data.signal);
                    }
                }
                else {
                    getStream(data.signal, data.from);
                    setAnchorName(data.name);
                }
            };

            socket.on("getLiveStream", handleGetLiveStream);
            return () => {
                socket.off("getLiveStream", handleGetLiveStream);
            };
        }
    }, [socket, isConnected]);

    useEffect(() => {
        if (socket) {
            const handleGetLiveScreenStream = (data) => {
                setIsReceiveShareScreen(true);
                getLiveScreenStream(data.signal, data.from);
            };

            socket.on("getLiveScreenStream", handleGetLiveScreenStream);

            return () => {
                socket.off("getLiveScreenStream", handleGetLiveScreenStream);
            };
        }
    }, [socket]);


    useEffect(() => {
        // if (screenPeerConn['$isCloseConn']) return;
        if (socket && screenPeerConn) {
            const handleLiveScreenStreamAccepted = (data) => {
                const peer = screenPeerConn[data.from]?.peer;
                if (peer && !peer.destroyed) {
                    peer.signal(data.signal);
                }
            };

            socket.on("liveScreenStreamAccepted", handleLiveScreenStreamAccepted);
            return () => {
                // if (screenPeerConn['$isCloseConn']) return;
                socket.off("liveScreenStreamAccepted", handleLiveScreenStreamAccepted);
            }
        }
    }, [socket, screenPeerConn]);

    useEffect(() => {
        if (socket) {
            const handleRefreshLiveStream = (data) => {
                pushStream(data.from);
            };
            socket.on("refreshLiveStream", handleRefreshLiveStream);
            return () => {
                socket.off("refreshLiveStream", handleRefreshLiveStream);
            }
        }
    }, [socket, localStream]);

    useEffect(() => {
        if (socket) {
            const handleRefreshLiveScreenStream = (data) => {
                pushScreenStream(data.from);
            };
            socket.on("refreshLiveScreenStream", handleRefreshLiveScreenStream);
            return () => {
                socket.off("refreshLiveScreenStream", handleRefreshLiveScreenStream);
            }
        }
    }, [socket, localScreenStream, screenPeerConn]);

    const pushStream = (viewerId) => {
        showNotification(viewerId + '进入直播间', 2000, 'dark', 'top', 'right');
        const peer = createCallPeer(localStream);
        registPeerFunc(peer, viewerId, true);
        setPeerConn(prev => ({
            ...prev,
            $isCloseConn: false,
            [viewerId]: {
                peer: peer,
                isCaller: true,
                idToCall: viewerId,
            },
        }));
    }

    const getStream = (signal, from) => {
        const peer = createAnswerPeer(localStream);
        registPeerFunc(peer, from, false);
        peer.signal(signal);
        setAnchorSocketId(from);
        setPeerConn(prev => ({
            ...prev,
            $isCloseConn: false,
            [from]: {
                peer: peer,
                isCaller: false,
            }
        }));
    }

    const registScreenPeerFunc = (peer, id, isSharer) => {
        if (isSharer) {
            peer.on("signal", (data) => {
                socket.emit("pushScreenStream", {
                    idToShare: id,
                    from: socket.id,
                    signalData: data,
                });
            });
            // 接收到流（stream）时触发
            peer.on("stream", (stream) => {
                if (remoteShareScreenVideo.current) {
                    remoteShareScreenVideo.current.srcObject = stream;
                    setRemoteStream(stream);
                }
            });
        }
        else {
            const handleAnswerSignal = (data) => {
                socket.emit("acceptLiveScreenStream", {
                    signal: data,
                    to: id,
                    from: socket.id,
                });
            }
            peer.on("signal", handleAnswerSignal);
            peer.on("stream", (stream) => {
                // console.log('receiveLocalScreenStream--------');
                // stream.getTracks().forEach((track) => {
                //     console.log(track.kind);
                // });
                if (remoteShareScreenVideo.current) {
                    remoteShareScreenVideo.current.srcObject = stream;
                    setRemoteScreenStream(stream);
                }
            });
        }

        peer.on('error', (err) => {
            console.error(err);
        });
        peer.on('close', () => {
            console.log('屏幕共享连接关闭：' + id);
            setScreenPeerConn(prev => {
                const { [id]: idToRemoveValue, ...rest } = prev;
                if (idToRemoveValue === peer) {
                    return {
                        ...rest,
                        $isCloseConn: true,
                    };
                }
                else {
                    return prev;
                }
            });
        });
    }

    /**
     * Share screen stream in live streaming
     * @param {*} viewerId
     * @param {*} stream
     */
    const pushScreenStream = (viewerId, stream) => {
        const peer = createCallPeer(stream ? stream : localScreenStream);
        registScreenPeerFunc(peer, viewerId, true);
        setScreenPeerConn(prev => {
            return {
                ...prev,
                $isCloseConn: false,
                [viewerId]: {
                    peer: peer,
                    isSharer: true,
                    idToShare: viewerId,
                }
            }
        });
    }

    const getLiveScreenStream = (signal, from) => {
        const peer = createAnswerPeer();
        registScreenPeerFunc(peer, from, false);
        peer.signal(signal);
        setScreenPeerConn(prev => ({
            ...prev,
            $isCloseConn: false,
            [from]: {
                peer: peer,
                isSharer: false,
            }
        }));
    };

    const refreshLiveStream = () => {
        if (socket) {
            stopMediaTracks(remoteStream);
            if (peerConn) {
                const peer = peerConn[anchorSocketId]?.peer;
                if (peer && !peer.destroyed) {
                    peer.destroy();
                }
            }
            socket.emit("refreshLiveStream", { to: anchorSocketId, from: socket.id });
        }
    };

    const refreshLiveScreenStream = () => {
        if (socket) {
            stopMediaTracks(remoteScreenStream);
            if (screenPeerConn) {
                const peer = screenPeerConn[anchorSocketId]?.peer;
                if (peer && !peer.destroyed) {
                    peer.destroy();
                }
            }
            socket.emit("refreshLiveScreenStream", { to: anchorSocketId, from: socket.id });
        }
    };

    const onLiveBtnClick = () => {
        setAudioEnabled(true);
        setVideoEnabled(true);
        setName('主播' + maskSocketId(socket?.id));
        socket.emit("createLiveRoom");
        setLiveBtnClicked(true);
        setSelectedRole(LiveStreamRole.Anchor);
    };

    useEffect(() => {
        if (localStream && liveBtnClicked) {
            socket.emit("queryWaitingViewers");
        }
    }, [localStream, liveBtnClicked]);

    const onViewBtnClick = () => {
        setName('观众' + maskSocketId(socket?.id));
        setSelectedRole(LiveStreamRole.Viewer);
    };

    useEffect(() => {
        if (liveBtnClicked) {
            const liveBtnClickedTimer = setTimeout(() => {
                setLiveBtnClicked(false);
            }, ExitLiveStreamBtnWaitTime);
            return () => clearTimeout(liveBtnClickedTimer);
        }
    }, [liveBtnClicked]);

    ///////////////////////////////////直播////////////////////////////////////////////////

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
            const resV = checkVideoTrack(stream);
            const resA = checkAudioTrack(stream);
            setHasRemoteVideoTrack(resV);
            setHasRemoteAudioTrack(resA);
        }
    }

    useEffect(() => {
        if (myVideo.current && myVideo.current.srcObject) {
            myVideo.current.srcObject.addEventListener('loadedmetadata', () => checkTrack(localStream, 'local'));
        }

        checkTrack(localStream, 'local');
        return () => {
            if (myVideo.current && myVideo.current.srcObject) {
                myVideo.current.srcObject.removeEventListener('loadedmetadata', () => checkTrack(localStream, 'local'));
            }
        };
    }, [localStream]);

    useEffect(() => {
        if (userVideo.current && userVideo.current.srcObject) {
            userVideo.current.srcObject.addEventListener('loadedmetadata', () => checkTrack(remoteStream, 'remote'));
        }

        checkTrack(remoteStream, 'remote');
        return () => {
            if (userVideo.current && userVideo.current.srcObject) {
                userVideo.current.srcObject.removeEventListener('loadedmetadata', () => checkTrack(remoteStream, 'remote'));
            }
        };
    }, [remoteStream]);

    const getEnlargedVideoFrom = (streamId) => {
        if (!streamId) return undefined;
        let from;
        if (streamId === myVideo?.current?.srcObject?.id) {
            from = name;
        } else if (streamId === userVideo?.current?.srcObject?.id) {
            from = (selectedRole === LiveStreamRole.Viewer ? anchorName + '的直播间' : anotherName);
        }
        else if (streamId === shareScreenVideo?.current?.srcObject?.id) {
            from = name + '的屏幕';
        }
        else if (streamId === remoteShareScreenVideo?.current?.srcObject?.id) {
            from = (selectedRole === LiveStreamRole.Viewer ? anchorName : anotherName) + '的屏幕';
        }
        return from;
    };


    const handleVideoClick = (event) => {
        if (videoPlayerRef?.current && event.currentTarget?.srcObject &&
            videoPlayerRef.current.srcObject !== event.currentTarget.srcObject) {
            videoPlayerRef.current.srcObject = event.currentTarget.srcObject;
        }
        const streamId = event.currentTarget?.srcObject?.id;
        const from = getEnlargedVideoFrom(streamId);
        setEnlargedVideoFrom(from);
        event.preventDefault();
        event.stopPropagation();
    };

    const handleVolumeChange = (event, videoRef) => {
        const newVolume = parseFloat(event.target.value);
        if (videoRef.current) {
            if (videoRef.current.volume < newVolume) {
                if (videoRef.current.muted) {
                    videoRef.current.muted = false;
                }
            }
            else if (newVolume === 0) {
                if (!videoRef.current.muted) {
                    videoRef.current.muted = true;
                }
            }
            videoRef.current.volume = newVolume;
        }
    };

    const onNameTextAreaChange = (e) => {
        let newValue = e.target.value.replace(/\n/g, '');
        if (newValue.length > Text_Max_Len) {
            showNotification('输入字符长度达到上限！');
            newValue = newValue.substring(0, Text_Max_Len);
        }
        setName(newValue);
    };

    const onIdToCallTextAreaChange = (e) => {
        let newValue = e.target.value.replace(/\n/g, '');
        if (newValue.length > Text_Max_Len) {
            showNotification('输入字符长度达到上限！');
            newValue = newValue.substring(0, Text_Max_Len);
        }
        setIdToCall(newValue);
    };

    const onLeaveCallBtnClick = () => {
        leaveCall();
        setIsShareScreen(false);
        stopAnotherScreenSharing();
    };

    const onInviteCallBtnClick = () => {
        setInviteVideoChatModalOpen(true);
    };

    const onCallUserBtnClick = () => {
        callUser(idToCall);
    };

    const onReturnMenuBtnClick = () => {
        if (callAccepted) {
            setConfirmLeave(true);
        }
        else {
            returnMenuView();
        }
    };

    return (
        <>
            <div className='video-chat-view'>
                <div className={`video-container-parent ${deviceType === DeviceType.MOBILE ? 'mobile' : ''}`}>
                    <div className="video-container">
                        {selectedRole !== LiveStreamRole.Viewer &&
                            <div className='video'>
                                <video ref={myVideo} playsInline loop={true} muted controls={false} autoPlay
                                    style={{ position: 'relative', zIndex: 0, width: '100%' }}
                                    onClick={handleVideoClick}
                                />
                                {!hasLocalVideoTrack && !hasLocalAudioTrack && (
                                    <img src={NoVideoIcon} alt="NoVideo" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 0, height: '100%', width: '100%' }} />
                                )}
                                {!hasLocalVideoTrack && hasLocalAudioTrack && (
                                    <img src={SpeakerIcon} alt="Speaker" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 0, height: '100%', width: '100%' }} />
                                )}
                                <TextOverlay
                                    position="top-left"
                                    content={name}
                                />
                                <TextOverlay
                                    isMediaCtlMenu={true}
                                    position="top-center"
                                    audioEnabled={audioEnabled}
                                    setAudioEnabled={setAudioEnabled}
                                    videoEnabled={videoEnabled}
                                    setVideoEnabled={setVideoEnabled}
                                    handleVolumeChange={handleVolumeChange}
                                    videoRef={myVideo}
                                    setSelectedAudioDevice={setSelectedAudioDevice}
                                    setSelectedVideoDevice={setSelectedVideoDevice}
                                    callAccepted={callAccepted}
                                    isNameReadOnly={isNameReadOnly}
                                    name={name}
                                    onNameTextAreaChange={onNameTextAreaChange}
                                    isIdToCallReadOnly={isIdToCallReadOnly}
                                    idToCall={idToCall}
                                    onIdToCallTextAreaChange={onIdToCallTextAreaChange}
                                    isShareScreen={isShareScreen}
                                    setIsShareScreen={setIsShareScreen}
                                    setChatPanelOpen={setChatPanelOpen}
                                    selectedMediaStream={selectedMediaStream}
                                    setMediaTrackSettingsModalOpen={setMediaTrackSettingsModalOpen}
                                    setFacingMode={setFacingMode}
                                    setSelectVideoModalOpen={setSelectVideoModalOpen}
                                    callEnded={callEnded}
                                    onLeaveCallBtnClick={onLeaveCallBtnClick}
                                    onInviteCallBtnClick={onInviteCallBtnClick}
                                    onCallUserBtnClick={onCallUserBtnClick}
                                    sid={sid}
                                    onReturnMenuBtnClick={onReturnMenuBtnClick}
                                    myVideoVolume={myVideoVolume}
                                    setMyVideoVolume={setMyVideoVolume}
                                    setFloatButtonVisible={setFloatButtonVisible}
                                    floatButtonVisible={floatButtonVisible}
                                    setTransferFileModalOpen={setTransferFileModalOpen}
                                    setTransferFileModalVisible={setTransferFileModalVisible}
                                    isLiveStream={isLiveStream}
                                    selectedRole={selectedRole}
                                    setLiveRoomChatPanelDisplay={setLiveRoomChatPanelDisplay}
                                />
                                <TextOverlay
                                    position="top-left-local-video"
                                    selectedFileName={selectedLocalFile?.name}
                                    setSelectedMediaStream={setSelectedMediaStream}
                                    isShowLocalVideo={true}
                                    selectedMediaStream={selectedMediaStream}
                                    selectedVideoRef={selectedVideoRef}
                                    name={name}
                                    parentRef={myVideo}
                                    handleVideoClick={handleVideoClick}
                                    localVideoDisplayRenderKey={localVideoDisplayRenderKey}
                                />
                                <TextOverlay
                                    position="top-right"
                                    iconSrc={StatPanelIcon}
                                    contents={[
                                        {
                                            name: 'Video Bitrate',
                                            data: outboundVideoBitrate.toFixed(4),
                                            unit: 'Mbps'
                                        },
                                        {
                                            name: 'Video Frame Rate',
                                            data: outboundFramesPerSecond.toFixed(2),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Width',
                                            data: outboundFrameWidth.toFixed(0),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Width',
                                            data: outboundFrameHeight.toFixed(0),
                                            unit: ''
                                        },
                                    ]}
                                />
                                <TextOverlay
                                    position="bottom-right"
                                    iconSrc={FullScreenIcon}
                                    parentRef={myVideo}
                                />
                            </div>}
                        {(isLiveStream ? (selectedRole === LiveStreamRole.Viewer) : (callAccepted && !callEnded)) ?
                            <div className="video">
                                <video ref={userVideo} playsInline autoPlay loop={true} controls={false}
                                    muted={lid} /**直播通过链接打开时默认静音 */
                                    style={{
                                        position: 'relative', zIndex: 0, width: '100%',
                                        opacity: hasRemoteVideoTrack ? '1' : '0'
                                    }}
                                    onClick={handleVideoClick} />
                                {!hasRemoteVideoTrack && !hasRemoteAudioTrack && (
                                    <img src={NoVideoIcon} alt="NoVideo" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 9, height: '100%', width: '100%' }} />
                                )}
                                <TextOverlay
                                    position="top-left"
                                    content={selectedRole === LiveStreamRole.Viewer ? (anchorName ? anchorName + '的直播间' : '') : anotherName}
                                    audioEnabled={hasRemoteAudioTrack}
                                />
                                {selectedRole === LiveStreamRole.Viewer && isConnected &&
                                    <TextOverlay
                                        isMediaCtlMenu={true}
                                        isLiveStream={isLiveStream}
                                        selectedRole={selectedRole}
                                        position="top-center"
                                        videoRef={userVideo}
                                        userVideoVolume={userVideoVolume}
                                        setUserVideoVolume={setUserVideoVolume}
                                        handleVolumeChange={handleVolumeChange}
                                        refreshLiveStream={refreshLiveStream}
                                        setLiveRoomChatPanelDisplay={setLiveRoomChatPanelDisplay}
                                    />}
                                <TextOverlay
                                    position="top-right"
                                    iconSrc={StatPanelIcon}
                                    contents={[
                                        {
                                            name: 'Video Bitrate',
                                            data: inboundVideoBitrate.toFixed(4),
                                            unit: 'Mbps'
                                        },
                                        {
                                            name: 'Video Delay',
                                            data: inboundVideoDelay.toFixed(1),
                                            unit: 'ms'
                                        },
                                        {
                                            name: 'Video Frame Rate',
                                            data: inboundFramesPerSecond.toFixed(2),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Width',
                                            data: inboundFrameWidth.toFixed(0),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Height',
                                            data: inboundFrameHeight.toFixed(0),
                                            unit: ''
                                        },
                                    ]}
                                />
                                <TextOverlay
                                    position="bottom-right"
                                    iconSrc={FullScreenIcon}
                                    parentRef={userVideo}
                                />
                            </div>
                            : null
                        }
                        {isShareScreen &&
                            <div className='video'>
                                <video ref={shareScreenVideo} playsInline muted autoPlay
                                    style={{ position: 'relative', zIndex: 0, width: '100%' }}
                                    onClick={handleVideoClick} />
                                <TextOverlay
                                    position="top-left"
                                    content={name + '的屏幕'}
                                />
                                <TextOverlay
                                    position="top-right"
                                    iconSrc={StatPanelIcon}
                                    contents={[
                                        {
                                            name: 'Video Bitrate',
                                            data: outboundVideoBitrate_SC.toFixed(4),
                                            unit: 'Mbps'
                                        },
                                        {
                                            name: 'Video Frame Rate',
                                            data: outboundFramesPerSecond_SC.toFixed(2),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Width',
                                            data: outboundFrameWidth_SC.toFixed(0),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Width',
                                            data: outboundFrameHeight_SC.toFixed(0),
                                            unit: ''
                                        },
                                    ]}
                                />
                                <TextOverlay
                                    position="bottom-right"
                                    iconSrc={FullScreenIcon}
                                    parentRef={shareScreenVideo}
                                />
                            </div>
                        }
                        {isReceiveShareScreen &&
                            <div className='video'>
                                <video ref={remoteShareScreenVideo} playsInline autoPlay
                                    muted={lid} /**直播通过链接打开时默认静音 */
                                    style={{ position: 'relative', zIndex: 0, width: '400px' }}
                                    onClick={handleVideoClick} />
                                <TextOverlay
                                    position="top-left"
                                    content={(selectedRole === LiveStreamRole.Viewer ? anchorName : anotherName) + '的屏幕'}
                                />
                                {selectedRole === LiveStreamRole.Viewer && isConnected &&
                                    <TextOverlay
                                        isMediaCtlMenu={true}
                                        isLiveStream={isLiveStream}
                                        selectedRole={selectedRole}
                                        position="top-center"
                                        videoRef={remoteShareScreenVideo}
                                        userVideoVolume={remoteShareScreenVolume}
                                        setUserVideoVolume={setRemoteShareScreenVolume}
                                        handleVolumeChange={handleVolumeChange}
                                        refreshLiveStream={refreshLiveScreenStream}
                                        setLiveRoomChatPanelDisplay={setLiveRoomChatPanelDisplay}
                                    />}
                                <TextOverlay
                                    position="top-right"
                                    iconSrc={StatPanelIcon}
                                    contents={[
                                        {
                                            name: 'Video Bitrate',
                                            data: inboundVideoBitrate_SC.toFixed(4),
                                            unit: 'Mbps'
                                        },
                                        {
                                            name: 'Video Delay',
                                            data: inboundVideoDelay_SC.toFixed(1),
                                            unit: 'ms'
                                        },
                                        {
                                            name: 'Video Frame Rate',
                                            data: inboundFramesPerSecond_SC.toFixed(2),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Width',
                                            data: inboundFrameWidth_SC.toFixed(0),
                                            unit: ''
                                        },
                                        {
                                            name: 'Video Frame Height',
                                            data: inboundFrameHeight_SC.toFixed(0),
                                            unit: ''
                                        },
                                    ]}
                                />
                                <TextOverlay
                                    position="bottom-right"
                                    iconSrc={FullScreenIcon}
                                    parentRef={remoteShareScreenVideo}
                                />
                            </div>
                        }
                    </div>
                    {showVideoPlayer &&
                        <div className={
                            `enlarged-video-container ${deviceType === DeviceType.MOBILE ? 'mobile' : ''}`}>
                            <div className='video'>
                                <video ref={videoPlayerRef} playsInline muted autoPlay
                                    style={{ position: 'relative', zIndex: 0, width: '100%' }}
                                    onClick={handleVideoClick}
                                />
                                <TextOverlay
                                    position="top-left"
                                    content={enlargedVideoFrom}
                                />
                                <TextOverlay
                                    position="bottom-right"
                                    iconSrc={FullScreenIcon}
                                    parentRef={videoPlayerRef}
                                />
                                {selectedRole !== LiveStreamRole.Viewer &&
                                    <TextOverlay
                                        isMediaCtlMenu={true}
                                        position="top-center"
                                        audioEnabled={audioEnabled}
                                        setAudioEnabled={setAudioEnabled}
                                        videoEnabled={videoEnabled}
                                        setVideoEnabled={setVideoEnabled}
                                        handleVolumeChange={handleVolumeChange}
                                        videoRef={myVideo}
                                        setSelectedAudioDevice={setSelectedAudioDevice}
                                        setSelectedVideoDevice={setSelectedVideoDevice}
                                        callAccepted={callAccepted}
                                        isNameReadOnly={isNameReadOnly}
                                        name={name}
                                        onNameTextAreaChange={onNameTextAreaChange}
                                        isIdToCallReadOnly={isIdToCallReadOnly}
                                        idToCall={idToCall}
                                        onIdToCallTextAreaChange={onIdToCallTextAreaChange}
                                        isShareScreen={isShareScreen}
                                        setIsShareScreen={setIsShareScreen}
                                        setChatPanelOpen={setChatPanelOpen}
                                        selectedMediaStream={selectedMediaStream}
                                        setMediaTrackSettingsModalOpen={setMediaTrackSettingsModalOpen}
                                        setFacingMode={setFacingMode}
                                        setSelectVideoModalOpen={setSelectVideoModalOpen}
                                        callEnded={callEnded}
                                        onLeaveCallBtnClick={onLeaveCallBtnClick}
                                        onInviteCallBtnClick={onInviteCallBtnClick}
                                        onCallUserBtnClick={onCallUserBtnClick}
                                        sid={sid}
                                        onReturnMenuBtnClick={onReturnMenuBtnClick}
                                        myVideoVolume={myVideoVolume}
                                        setMyVideoVolume={setMyVideoVolume}
                                        setFloatButtonVisible={setFloatButtonVisible}
                                        floatButtonVisible={floatButtonVisible}
                                        setTransferFileModalOpen={setTransferFileModalOpen}
                                        setTransferFileModalVisible={setTransferFileModalVisible}
                                        isLiveStream={isLiveStream}
                                        selectedRole={selectedRole}
                                        setLiveRoomChatPanelDisplay={setLiveRoomChatPanelDisplay}
                                    />
                                }
                            </div>
                        </div>
                    }
                    {
                        <LiveRoomChatPanel
                            messages={liveMsgs}
                            setMessages={setLiveMsgs}
                            deviceType={deviceType}
                            liveRoomChatPanelDisplay={liveRoomChatPanelDisplay}
                            setLiveRoomChatPanelDisplay={setLiveRoomChatPanelDisplay}
                            selectedRole={selectedRole} isConnected={isConnected}
                            socket={socket} peerConn={peerConn} anchorSocketId={anchorSocketId}
                        />
                    }
                </div>
                <ToolBar backgroundColor='black' />
                {!peerSocketId && /*以下都不会在游戏语音通话模块中加载 */
                    <>
                        <div>
                            {receivingCall && !callAccepted &&
                                (selectedRole !== LiveStreamRole.Viewer) && /**直播时无需确认是否接受 */
                                <div className='modal-overlay-receive-call'>
                                    <div className="modal-receive-call">
                                        <div className="caller">
                                            <h1 >{anotherName === '' ? '未知号码' : anotherName} 邀请视频通话...</h1>
                                            <ButtonBox onOkBtnClick={() => {
                                                acceptCall();
                                                setInviteVideoChatModalOpen(false);
                                            }} OnCancelBtnClick={rejectCall}
                                                okBtnInfo='接听' cancelBtnInfo='拒绝' />
                                        </div>
                                    </div>
                                </div>}
                            {(calling && !peerSocketId) && (!newViewer) &&/**仅游戏语音时取消弹窗 */
                                < CallingModal isDisabled={sid}
                                    modalInfo={"正在呼叫 " + idToCall}
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

                            {inviteVideoChatModalOpen &&
                                <InviteVideoChatModal closeModal={() => setInviteVideoChatModalOpen(false)}
                                    me={me} name={name} socket={socket} inviteVideoChatModalOpen={inviteVideoChatModalOpen}
                                    strNowDate={strNowDate} />
                            }
                            {prepareCallModal &&
                                <ConfirmModal modalInfo="将要发起视频通话，是否继续？" onOkBtnClick={() => {
                                    setPrepareCallModal(false);
                                    setTimeout(() => {
                                        if (localStream) {
                                            callUser(sid);
                                        }
                                        else {

                                            getUserMediaStream().then((stream) => {
                                                setLocalStream(stream);
                                                callUser(sid, false, stream);
                                            });
                                        }
                                    }, 1000);
                                }}
                                    noCancelBtn={true} />
                            }
                            {prepareEnterLiveRoomModal &&
                                <ConfirmModal modalInfo="是否进入直播间？" onOkBtnClick={() => {
                                    setPrepareEnterLiveRoomModal(false);
                                    enterLiveRoom(lid);
                                }}
                                    noCancelBtn={true} />
                            }
                            {
                                chatPanelOpen &&
                                <ChatPanel messages={messages} setMessages={setMessages} setChatPanelOpen={setChatPanelOpen} ncobj={connectionRef?.current?.peer} />
                            }
                            {
                                mediaTrackSettingsModalOpen &&
                                <MediaTrackSettingsModal
                                    localVideoWidth={localVideoWidth} setLocalVideoWidth={setLocalVideoWidth}
                                    localVideoHeight={localVideoHeight} setLocalVideoHeight={setLocalVideoHeight}
                                    localFrameRate={localFrameRate} setLocalFrameRate={setLocalFrameRate}
                                    echoCancellation={echoCancellation} setEchoCancellation={setEchoCancellation}
                                    noiseSuppression={noiseSuppression} setNoiseSuppression={setNoiseSuppression}
                                    sampleRate={sampleRate} setSampleRate={setSampleRate}
                                    setModalOpen={setMediaTrackSettingsModalOpen}
                                    setConstraint={setConstraint} videoEnabled={videoEnabled} audioEnabled={audioEnabled}
                                    facingMode={facingMode}
                                />
                            }
                            {selectVideoModalOpen &&
                                <SelectVideoModal setModalOpen={setSelectVideoModalOpen} selectedVideoRef={selectedVideoRef}
                                    setSelectedMediaStream={setSelectedMediaStream}
                                    selectedLocalFile={selectedLocalFile} setSelectedLocalFile={setSelectedLocalFile}
                                    audioSource={audioSource} setAudioSource={setAudioSource}
                                    setAudioCtx={setAudioCtx} audioCtx={audioCtx} setUrl={setLocalVideoUrl} />
                            }
                        </div>
                        <VideoStatsTool
                            connectionRef={connectionRef}
                            setInboundBitrate={setInboundBitrate}
                            setInboundVideoDelay={setInboundVideoDelay}
                            setInboundFramesPerSecond={setInboundFramesPerSecond}
                            setInboundFrameWidth={setInboundFrameWidth}
                            setInboundFrameHeight={setInboundFrameHeight}
                            setOutboundBitrate={setOutboundBitrate}
                            setOutboundFramesPerSecond={setOutboundFramesPerSecond}
                            setOutboundFrameWidth={setOutboundFrameWidth}
                            setOutboundFrameHeight={setOutboundFrameHeight}
                        />
                        <VideoStatsTool
                            connectionRef={connectionRef}
                            localStream={localStream}
                            setInboundBitrate={setInboundBitrate}
                            setInboundVideoDelay={setInboundVideoDelay}
                            setInboundFramesPerSecond={setInboundFramesPerSecond}
                            setInboundFrameWidth={setInboundFrameWidth}
                            setInboundFrameHeight={setInboundFrameHeight}
                            setOutboundBitrate={setOutboundBitrate}
                            setOutboundFramesPerSecond={setOutboundFramesPerSecond}
                            setOutboundFrameWidth={setOutboundFrameWidth}
                            setOutboundFrameHeight={setOutboundFrameHeight}
                        />
                        <VideoStatsTool
                            connectionRef={shareScreenConnRef}
                            isShareScreen={true}
                            setInboundBitrate={setInboundBitrate_SC}
                            setInboundVideoDelay={setInboundVideoDelay_SC}
                            setInboundFramesPerSecond={setInboundFramesPerSecond_SC}
                            setInboundFrameWidth={setInboundFrameWidth_SC}
                            setInboundFrameHeight={setInboundFrameHeight_SC}
                            setOutboundBitrate={setOutboundBitrate_SC}
                            setOutboundFramesPerSecond={setOutboundFramesPerSecond_SC}
                            setOutboundFrameWidth={setOutboundFrameWidth_SC}
                            setOutboundFrameHeight={setOutboundFrameHeight_SC}
                        />
                        {videoCallModalOpen &&
                            <VideoCallModal props={{
                                parent: 'ChaosGomoku',
                                setVideoCallModalOpen,
                                callAccepted, isNameReadOnly, name, onNameTextAreaChange,
                                isIdToCallReadOnly, idToCall, onIdToCallTextAreaChange,
                                callEnded, onLeaveCallBtnClick, onInviteCallBtnClick, onCallUserBtnClick,
                                socket,
                            }} />
                        }
                        {
                            liveStreamModalOpen &&
                            <LiveStreamModal socket={socket}
                                selectedRole={selectedRole}
                                setSelectedRole={setSelectedRole}
                                liveRoomId={liveRoomId}
                                setLiveRoomId={setLiveRoomId}
                                liveUrl={liveUrl}
                                setLiveUrl={setLiveUrl}
                                setNewViewer={setNewViewer}
                                setModalOpen={setLiveStreamModalOpen}
                                onLiveBtnClick={onLiveBtnClick}
                                onViewBtnClick={onViewBtnClick}
                                name={name} setName={setName}
                                setAnchorName={setAnchorName}
                                enterLiveRoom={enterLiveRoom}
                                liveRoomIdToEnter={liveRoomIdToEnter}
                                setLiveRoomIdToEnter={setLiveRoomIdToEnter}
                                stopLive={stopLive}
                                leaveLiveRoom={leaveLiveRoom}
                                isConnected={isConnected}
                                lid={lid}
                                liveBtnClicked={liveBtnClicked}
                            />
                        }
                        {enteringLiveRoomModalOpen &&
                            <LoadingModal setModalOpen={setEnteringLiveRoomModalOpen}
                                loadingText={'正在进入直播间' + (lid ? lid : '')}
                                noCancelBtn={lid} />
                        }
                        {
                            alertModalOpen &&
                            <InfoModal modalInfo={alertModalInfo} setModalOpen={setAlertModalOpen} />
                        }
                        {
                            transferFileModalOpen &&
                            <TransferModal setModalOpen={setTransferFileModalOpen}
                                peer={connectionRef?.current?.peer}
                                fileTransferAccepted={fileTransferAccepted}
                                setFileTransferAccepted={setFileTransferAccepted}
                                setWaitConfirmTransferFileModalOpen={setWaitConfirmTransferFileModalOpen}
                                modalVisible={transferFileModalVisible}
                                setModalVisible={setTransferFileModalVisible}
                                receiveFileProgress={receiveFileProgress}
                                preAcceptFileName={preAcceptFileName}
                                preAcceptFileSize={preAcceptFileSize}
                            />
                        }
                        {
                            preAcceptFileModalOpen &&
                            <AcceptFileModal setModalOpen={setPreAcceptFileModalOpen}
                                progress={receiveFileProgress}
                                setReceiveFileAccepted={setReceiveFileAccepted}
                                peer={connectionRef?.current?.peer}
                                preAcceptFileName={preAcceptFileName}
                                preAcceptFileSize={preAcceptFileSize}
                            />
                        }
                        {waitConfirmTransferFileModalOpen &&
                            <WaitModal modalInfo='等待对方同意...'
                                setModalOpen={setWaitConfirmTransferFileModalOpen}
                                peer={connectionRef?.current?.peer} />
                        }
                    </>
                }
            </div >
        </>
    )
}

function InviteVideoChatModal({ closeModal, me, name, socket, inviteVideoChatModalOpen, strNowDate }) {
    const url = window.location.origin + '/call/' + me;
    const text = '，点击链接直接通话：';

    const inviteInfo = name + ' 邀请您进行视频通话，时间：' + strNowDate;

    useEffect(() => {
        if (inviteVideoChatModalOpen) {
            socket.emit("getFormatDate");
        }
    }, [inviteVideoChatModalOpen]);

    return (
        <div className="modal-overlay">
            <div className="invite-video-chat-modal">
                <span className="close-button" onClick={closeModal}>
                    &times;
                </span>
                <p>{inviteInfo}</p>
                <p>{text}</p><p style={{
                    color: 'blue',
                }}>{url}</p>
                <div className='button-confirm-container'>
                    <CopyToClipboard text={url} style={{ marginRight: '10px' }}>
                        <Button variant="contained" color="primary" onClick={() => {
                            showNotification('链接已复制到剪切板', 2000, 'white');
                        }
                        }>
                            复制链接
                        </Button>
                    </CopyToClipboard>
                    <CopyToClipboard text={inviteInfo + text + url} style={{
                        marginRight: '10px',
                        fontWeight: 'bold',
                        backgroundColor: '#3b5eec',
                        color: 'white'
                    }}>
                        <Button variant="contained" onClick={() => {
                            showNotification('全部信息已复制到剪切板', 2000, 'white');
                        }}>
                            复制完整信息
                        </Button>
                    </CopyToClipboard>
                    <CopyToClipboard text={me} style={{ marginRight: '10px' }}>
                        <Button variant="contained" color="primary" onClick={() => {
                            showNotification('ID已复制到剪切板', 2000, 'white');
                        }
                        }>
                            复制我的ID
                        </Button>
                    </CopyToClipboard>
                </div>

            </div>
        </div >
    );
}

function ScrollingText({ text, selectedMediaStream }) {
    const containerRef = useRef(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        if (containerRef.current && selectedMediaStream) {
            const containerWidth = containerRef.current.offsetWidth;
            const textWidth = containerRef.current.scrollWidth;
            if (textWidth > containerWidth) {
                setShouldScroll(true);
            } else {
                setShouldScroll(false);
            }
        }

    }, [text, containerRef.current, selectedMediaStream]);

    return (
        <div ref={containerRef} style={{
            overflow: 'hidden', whiteSpace: 'nowrap',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            color: '#d9d9d9',
            fontSize: '16px',
            marginTop: '1rem',
            marginBottom: '0.1rem',
        }}>
            {shouldScroll ? (
                <span className='scrolling-text'>
                    {text}
                </span>
            ) : (
                <span>{text}</span>
            )}
        </div>
    );
};


function LocalVideoDisplay({ selectedMediaStream, onBackButtonClick,
    selectedFileName, selectedVideoRef, name, parentRef, handleVideoClick,
    localVideoDisplayRenderKey }) {
    const [bounds, setBounds] = useState();
    const [elementSize, setElementSize] = useState();
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState();
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const elementRef = useRef(null);
    useEffect(() => {
        if (parentRef.current && elementRef.current && selectedMediaStream) {
            const { width, height } = elementRef.current.getBoundingClientRect();
            setElementSize({ width, height });
            const parentRect = parentRef.current.getBoundingClientRect();
            const initialX = (parentRect.width - width) / 2;
            const initialY = (parentRect.height - height) / 2;
            setPosition({ x: initialX, y: initialY });
        }
    }, [parentRef.current, elementRef.current, selectedMediaStream, localVideoDisplayRenderKey]);

    useEffect(() => {
        if (parentRef.current && elementSize) {
            const parentRect = parentRef.current.getBoundingClientRect();
            // 计算边界
            setBounds({
                left: 0,
                top: 0,
                right: parentRect.width - elementSize.width,
                bottom: parentRect.height - elementSize.height,
            });
        }
    }, [parentRef.current, elementSize]);

    const handleStart = (e, ui) => {
        setIsDragging(false);
        setInitialPosition({ x: ui.x, y: ui.y });
    };

    const handleStop = (e, ui) => {
        const { x, y } = ui;
        // 计算拖拽的位移
        const deltaX = x - initialPosition.x;
        const deltaY = y - initialPosition.y;
        const threshold = 5;
        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            setIsDragging(true);
        } else {
            setIsDragging(false);
        }
    };

    const handleDrag = (e, ui) => {
        const { x, y } = ui;
        setPosition({ x, y });
    };

    return (
        <Draggable
            bounds={bounds}
            position={position}
            onStart={handleStart}
            onStop={handleStop}
            onDrag={handleDrag}
        >
            <div ref={elementRef} className={`text-overlay-container ${selectedMediaStream ? '' : 'display-none'}`}>
                <div style={{ backgroundColor: 'rgb(0,0,0,0.8)' }}>
                    <img src={DragIcon} alt="Drag" style={{
                        position: 'absolute',
                        top: 6, left: 6,
                    }} />
                    <button className="close-button" style={{
                        color: 'red', backgroundColor: 'transparent',
                        border: 'none',
                    }}
                        onClick={onBackButtonClick}
                        onTouchStart={onBackButtonClick}
                    >
                        &times;
                    </button>
                    <ScrollingText text={selectedFileName} selectedMediaStream={selectedMediaStream} />
                </div>
                <LocalVideoDisplayBoard selectedVideoRef={selectedVideoRef}
                    selectedMediaStream={selectedMediaStream}
                    name={name} handleVideoClick={handleVideoClick}
                    isDragging={isDragging} />
            </div>
        </Draggable>
    );
}

function XSign({ onClick }) {
    return (
        <div style={{
            width: '100%', height: 'auto',
            display: 'flex', flexDirection: 'row-reverse'
        }}>
            <button className="x-sign" type="primary" onClick={onClick}>
                &times;
            </button>
        </div>

    );
}

function VideoCallModal({ props }) {
    return (
        <>
            <div className={`myId-parent ${props.parent ? props.parent : ''}`}>
                <div className={`myId ${props.parent ? props.parent : ''}`}>
                    {props?.parent &&
                        <XSign onClick={() => props?.setVideoCallModalOpen(false)} />
                    }
                    {!props?.callAccepted &&
                        <>
                            <TextArea isReadyOnly={props?.isNameReadOnly} placeholder='我的昵称'
                                label='Name' value={props?.name} onChange={props?.onNameTextAreaChange} />
                            <TextArea isReadyOnly={props?.isIdToCallReadOnly} placeholder='对方号码'
                                label='ID to call' value={props?.idToCall} onChange={props?.onIdToCallTextAreaChange} />
                        </>
                    }
                    <CallButton callAccepted={props?.callAccepted} callEnded={props?.callEnded}
                        idToCall={props?.idToCall} onLeaveCallBtnClick={props?.onLeaveCallBtnClick}
                        onInviteCallBtnClick={props?.onInviteCallBtnClick}
                        onCallUserBtnClick={props?.onCallUserBtnClick} socket={props?.socket} />
                </div>
            </div >
        </>
    );
}

function LiveStreamModal({ socket, selectedRole, setSelectedRole,
    liveRoomId, setLiveRoomId, liveUrl, setLiveUrl, setNewViewer,
    setModalOpen, onLiveBtnClick, onViewBtnClick, name, setName,
    setAnchorName,
    enterLiveRoom, liveRoomIdToEnter, setLiveRoomIdToEnter,
    stopLive, leaveLiveRoom, isConnected, lid, liveBtnClicked,
}) {
    const [countdown, setCountdown] = useState(ExitLiveStreamBtnWaitTime / 1000);

    useEffect(() => {
        if (liveBtnClicked) {
            const timer = setInterval(() => {
                setCountdown(prevCountdown => prevCountdown - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
        else {
            setCountdown(ExitLiveStreamBtnWaitTime / 1000);
        }
    }, [liveBtnClicked]);

    useEffect(() => {
        setLiveUrl(window.location.origin + '/live/' + liveRoomId);
    }, [liveRoomId]);

    useEffect(() => {
        if (socket) {
            const handleLiveStreamRoomId = (data) => {
                if (data) {
                    setLiveRoomId(data);
                }
            };
            socket.on("liveStreamRoomId", handleLiveStreamRoomId);
            return () => {
                socket.off("liveStreamRoomId", handleLiveStreamRoomId);
            };
        }
    }, [socket]);

    const handleLiveBtnClick = () => {
        onLiveBtnClick();
    };

    const handleViewBtnClick = () => {
        onViewBtnClick();
    };

    const onNameTextAreaChange = (e) => {
        let newValue = e.target.value.replace(/\n/g, '');
        if (newValue.length > Text_Max_Len) {
            showNotification('输入字符长度达到上限！');
            newValue = newValue.substring(0, Text_Max_Len);
        }
        setName(newValue);
    };

    const onLiveRoomIdTextAreaChange = (e) => {
        let newValue = e.target.value.replace(/\n/g, '');
        if (newValue.length > Live_Room_ID_Len) {
            showNotification('输入字符长度达到上限！');
            newValue = newValue.substring(0, Live_Room_ID_Len);
        }
        setLiveRoomIdToEnter(newValue);
    };

    const onXSignClick = () => {
        setModalOpen(false);
    };

    const onEnterLiveRoomBtnClick = () => {
        if (liveRoomIdToEnter) {
            if (liveRoomIdToEnter.length < Live_Room_ID_Len) {
                showNotification('输入直播间号无效！');
                return;
            }
            enterLiveRoom(liveRoomIdToEnter);
            setModalOpen(false);
        }
    };

    const onExitBtnClick = () => {
        if (selectedRole === LiveStreamRole.Anchor) {
            setName('');
            stopLive();
        }
        else if (selectedRole === LiveStreamRole.Viewer) {
            leaveLiveRoom();
            setAnchorName('');
        }
        if (!lid) {
            setSelectedRole(LiveStreamRole.Unknown);
        }
    };

    return (
        <div className='modal-overlay'>
            <div className='modal' style={{
                paddingTop: '0rem',
                paddingLeft: '0rem',
                paddingRight: '0rem',
            }}>
                {
                    <XSign onClick={onXSignClick} />
                }
                {!selectedRole ?
                    <ButtonBoxN props={{
                        infoArray: ['我是主播', '我是观众'],
                        onClickArray: [
                            handleLiveBtnClick,
                            handleViewBtnClick],
                    }} /> : null
                }
                {selectedRole === LiveStreamRole.Anchor &&
                    <>
                        <div style={{
                            margin: '2rem 1rem'
                        }}>
                            <TextArea placeholder='我的昵称' label='Name'
                                value={name} onChange={onNameTextAreaChange} />
                        </div>
                        <CopyToClipboard text={liveUrl} style={{ marginRight: '10px' }}>
                            <Button variant="contained" color="primary" onClick={() => showNotification('直播间链接已复制到剪切板', 2000, 'white')}>
                                分享直播间
                            </Button>
                        </CopyToClipboard>
                        <CopyToClipboard text={liveRoomId} style={{ marginRight: '10px' }}>
                            <Button variant="contained" color="primary" onClick={() => showNotification('直播间号已复制到剪切板', 2000, 'white')}>
                                复制直播间号
                            </Button>
                        </CopyToClipboard>
                        <Button id='exit-live-btn' disabled={liveBtnClicked} variant="contained" color="primary" onClick={onExitBtnClick} >
                            {liveBtnClicked ? countdown : '退出直播'}
                        </Button>
                    </>
                }
                {selectedRole === LiveStreamRole.Viewer &&
                    <>
                        <div style={{
                            margin: '2rem 1rem'
                        }}>
                            <TextArea placeholder='我的昵称' label='Name'
                                value={name} onChange={onNameTextAreaChange} />
                        </div>
                        <div style={{
                            margin: '2rem 1rem'
                        }}>
                            <TextArea isReadyOnly={lid} placeholder='直播间号' label='LiveRoomId'
                                value={liveRoomIdToEnter} onChange={onLiveRoomIdTextAreaChange} />
                        </div>
                        {!isConnected ?
                            <Button variant="contained" color="primary" style={{ marginRight: '10px' }}
                                disabled={!liveRoomIdToEnter}
                                onClick={onEnterLiveRoomBtnClick}>
                                进入直播间
                            </Button> :
                            <Button variant="contained" color="primary" onClick={onExitBtnClick} style={{
                                backgroundColor: 'red',
                                color: 'white'
                            }}>
                                退出直播间
                            </Button>
                        }
                    </>
                }
            </div>
        </div >
    );
}

function TextOverlay({ position, content, contents, audioEnabled, setAudioEnabled,
    iconSrc, videoEnabled, setVideoEnabled, setSelectedAudioDevice,
    setSelectedVideoDevice, callAccepted, selectedFileName, setSelectedMediaStream,
    isMediaCtlMenu, videoRef, handleVolumeChange, name, peerSocketId, isShareScreen,
    setIsShareScreen, setChatPanelOpen, selectedMediaStream,
    setMediaTrackSettingsModalOpen, setFacingMode, setSelectVideoModalOpen,
    isShowLocalVideo, selectedVideoRef, parentRef, handleVideoClick,
    myVideoVolume, setMyVideoVolume, localVideoDisplayRenderKey, setFloatButtonVisible,
    floatButtonVisible, setTransferFileModalOpen, setTransferFileModalVisible,
    isLiveStream, selectedRole, userVideoVolume, setUserVideoVolume, refreshLiveStream,
    setLiveRoomChatPanelDisplay
}) {

    const [speakerIcon, setSpeakerIcon] = useState(SmallSpeakerIcon);
    const [showStatPanel, setShowStatPanel] = useState(false);
    const [showMediaCtlMenu, setShowMediaCtlMenu] = useState(!isLiveStream);
    const node = useRef();
    const volumeSliderContainerRef = useRef();
    const volumeSliderTimerRef = useRef();

    useEffect(() => {
        if (videoRef?.current) {
            setSpeakerIcon(videoRef.current.muted ? SmallSpeakerSilentIcon : SmallSpeakerIcon);
        }
    }, [videoRef]);

    useEffect(() => {
        if (!isLiveStream) {
            setShowMediaCtlMenu(!callAccepted);
        }
    }, [callAccepted]);

    useEffect(() => {
        if (selectedMediaStream) {
            setTimeout(() => setShowMediaCtlMenu(false), 1000); // to store volue change
        }
    }, [selectedMediaStream]);

    useEffect(() => {
        const handleVolumeChange = () => {
            if (videoRef && videoRef.current) {
                setSpeakerIcon(videoRef?.current?.muted ? SmallSpeakerSilentIcon : SmallSpeakerIcon);
            }
        };
        videoRef?.current?.addEventListener('volumechange', handleVolumeChange);
        return () => {
            videoRef?.current?.removeEventListener('volumechange', handleVolumeChange);
        };
    }, [videoRef]);

    useEffect(() => {
        if (node.current) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [node.current]);

    // 根据位置设置文本的定位样式
    const getPositionStyle = () => {
        switch (position) {
            case 'top-left':
                return {
                    top: 0,
                    left: 0,
                    zIndex: 40,
                    maxWidth: '45%'
                };
            case 'top-left-local-video':
                return {
                    top: 0,
                    left: 0,
                    fontSize: '16px',
                    maxWidth: '40%',
                    height: 'auto',
                    maxHeight: '40%',
                    visibility: selectedMediaStream ? 'visible' : 'hidden',
                    backgroundColor: 'transparent',
                    zIndex: 30,
                };
            case 'top-center':
                return {
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 40,
                };
            case 'top-right':
                return {
                    top: 0,
                    right: 0,
                    zIndex: 20,
                };
            case 'bottom-left':
                return { bottom: '1rem', left: '1rem' };
            case 'bottom-right':
                return { bottom: 0, right: 0 };
            default:
                return { top: 0, left: 0 };
        }
    };
    function toggleStatPanel() {
        if (contents) {
            setShowStatPanel(prev => !prev);
        }
    }

    function toggleCtlMenu() {
        const prev = showMediaCtlMenu;
        setShowMediaCtlMenu(prev => !prev);
    }

    function handleSpeakerClick() {
        if (videoRef.current) {
            if (videoRef.current.muted) {
                videoRef.current.volume = 1;
            }
            videoRef.current.muted = !(videoRef.current.muted);
        }
    }

    const handleClickOutside = (e) => {
        if (node.current && !node.current.contains(e.target) &&
            !e.target.classList.contains('icon')) {
            setShowStatPanel(false);
        }
    };

    const onBackButtonClick = () => {
        setSelectedMediaStream(null);
    };

    const handleMouseEnter = () => {
        clearTimeout(volumeSliderTimerRef.current);
        volumeSliderContainerRef.current.classList.add('show-input');
    };

    const handleMouseLeave = () => {
        volumeSliderTimerRef.current = setTimeout(() => {
            if (volumeSliderContainerRef.current) {
                volumeSliderContainerRef.current.classList.remove('show-input');
            }
        }, 200);
    };

    const toggleFullScreen = () => {
        const video = parentRef.current;
        if (video) {
            if (!document.fullscreenElement) {
                video.requestFullscreen().catch((err) => {
                    console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    const onRefreshLiveStreamIconClick = () => {
        refreshLiveStream();
    };

    if (peerSocketId) {
        return null;
    }
    else {
        return (
            <div
                ref={node}
                style={{
                    position: 'absolute',
                    padding: '10px',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    fontSize: '12px',
                    maxWidth: '100%',
                    whiteSpace: 'pre-warp',
                    wordBreak: 'break-word',
                    maxHeight: '100vh',
                    zIndex: 20,
                    ...getPositionStyle(), // 应用位置样式
                }}
            >
                {isMediaCtlMenu &&
                    <div className='media-ctl-menu'>
                        {!showMediaCtlMenu &&
                            <img src={MediaCtlMenuIcon} alt="MediaCtlMenu" className="menu-icon" onClick={toggleCtlMenu} />
                        }
                        {showMediaCtlMenu &&
                            <>
                                <img src={CloseMediaCtlMenuIcon} alt="CloseMediaCtlMenu" className="icon close-menu-icon" onClick={toggleCtlMenu} />
                                <div className='func-icon-container'>
                                    {selectedRole === LiveStreamRole.Viewer ?
                                        <>
                                            <div ref={volumeSliderContainerRef} className="slider-container"
                                                onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                                <VolumeCtlSlider handleVolumeChange={handleVolumeChange} videoRef={videoRef}
                                                    volume={userVideoVolume} setVolume={setUserVideoVolume} />
                                                <img src={speakerIcon} alt="Speaker" className="icon" onClick={handleSpeakerClick}
                                                    title='扬声器' />
                                            </div>
                                            <img src={LiveChatPanelIcon} alt="LiveChatPanel" className="icon" onClick={() => {
                                                setLiveRoomChatPanelDisplay(prev => !prev);
                                            }} title='公屏' />
                                            <img src={RefreshLiveStreamIcon} alt="RefreshLiveStream" className="icon"
                                                onClick={onRefreshLiveStreamIconClick}
                                                title='刷新' />
                                        </> :
                                        <>
                                            <>
                                                <AudioDeviceSelector audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled}
                                                    setSelectedDevice={setSelectedAudioDevice} callAccepted={callAccepted}
                                                    selectedMediaStream={selectedMediaStream} />
                                                <VideoDeviceSelector videoEnabled={videoEnabled} setVideoEnabled={setVideoEnabled}
                                                    setSelectedDevice={setSelectedVideoDevice} callAccepted={callAccepted}
                                                    selectedMediaStream={selectedMediaStream} />
                                            </>
                                            <div ref={volumeSliderContainerRef} className="slider-container"
                                                onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                                                <VolumeCtlSlider handleVolumeChange={handleVolumeChange} videoRef={videoRef}
                                                    volume={myVideoVolume} setVolume={setMyVideoVolume} />
                                                <img src={speakerIcon} alt="Speaker" className="icon" onClick={handleSpeakerClick}
                                                    title='扬声器' />
                                            </div>
                                            <img src={isShareScreen ? StopShareScreenIcon : ShareScreenIcon} alt="ShareScreen" className="icon" onClick={() => {
                                                setIsShareScreen(prev => !prev);
                                            }} title='分享屏幕' />
                                            {selectedRole === LiveStreamRole.Anchor ?
                                                <img src={LiveChatPanelIcon} alt="LiveChatPanel" className="icon" onClick={() => {
                                                    setLiveRoomChatPanelDisplay(prev => !prev);
                                                }} title='公屏' /> :
                                                <img src={MessageIcon} alt="Message" className="icon" onClick={() => {
                                                    setChatPanelOpen(prev => !prev);
                                                }} title='短信' />
                                            }
                                            <img src={MediaTrackSettingsIcon} alt="MediaTrackSettings" className={`icon ${selectedMediaStream ? 'grayed-out' : ''}`} onClick={() => {
                                                setMediaTrackSettingsModalOpen(prev => !prev);
                                            }} title='媒体轨道设置' />
                                            <img src={SwitchCameraIcon} alt="SwitchCamera" className={`icon ${selectedMediaStream ? 'grayed-out' : ''}`} onClick={() => {
                                                setFacingMode(prev => (prev === FacingMode.Behind ? FacingMode.Front : FacingMode.Behind));
                                            }} title='切换摄像头' />
                                            <img src={SelectVideoIcon} alt="SelectVideo" className="icon" onClick={() => {
                                                setSelectVideoModalOpen(true);
                                            }} title='共享视频' />
                                            <img src={FileTransferIcon} alt="FileTransfer" className="icon" onClick={() => {
                                                setTransferFileModalOpen(true);
                                                setTransferFileModalVisible(true);
                                            }
                                            } title='传输文件' />
                                            <div id='float-button-icon' className={`float-button-icon ${floatButtonVisible ? 'clicked' : ''}`}
                                                onClick={
                                                    () => setFloatButtonVisible(prev => !prev)
                                                } title='其他'>
                                            </div>
                                        </>
                                    }
                                </div>
                            </>
                        }
                    </div>
                }
                {
                    iconSrc &&
                    <img src={iconSrc} alt="Icon" className="icon" onClick={() => {
                        switch (iconSrc) {
                            case StatPanelIcon:
                                toggleStatPanel();
                                break;
                            case FullScreenIcon:
                                toggleFullScreen();
                                break;
                            default:
                                break;
                        }
                    }}
                    />
                }
                {content && (isMediaCtlMenu ? !showMediaCtlMenu : true) && content}
                {
                    isShowLocalVideo &&
                    <LocalVideoDisplay selectedMediaStream={selectedMediaStream} onBackButtonClick={onBackButtonClick}
                        selectedFileName={selectedFileName} selectedVideoRef={selectedVideoRef}
                        name={name} parentRef={parentRef} handleVideoClick={handleVideoClick}
                        localVideoDisplayRenderKey={localVideoDisplayRenderKey} />
                }
                {
                    contents && showStatPanel &&
                    <div>
                        {
                            contents.map((item, index) => (
                                <div key={index}>
                                    <p>{item.name}: {item.data} {item.unit}</p>
                                </div>
                            ))
                        }
                    </div>
                }
            </div >
        );
    }
}

function AudioDeviceSelector({ audioEnabled, setAudioEnabled, setSelectedDevice, callAccepted,
    selectedMediaStream }) {
    const [audioDevices, setAudioDevices] = useState([]);
    const [audioIcon, setAudioIcon] = useState(AudioIcon);
    const [canToggleAudio, setCanToggleAudio] = useState(true);

    // 获取音频设备列表
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            const audioDevicesList = devices.filter(device => device.kind === 'audioinput');
            setAudioDevices(audioDevicesList);
            if (audioDevicesList.length === 0) {
                setAudioEnabled(false);
                setCanToggleAudio(false);
            }
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
        if (!canToggleAudio) {
            return;
        }
        if (audioEnabled) {
            if (callAccepted) {
                setAudioEnabled((prev) => !prev);
            }
        }
        else {
            setAudioEnabled((prev) => !prev);
        }
    };

    return (
        <div className="audio-device-selector-container">
            <img src={audioIcon} alt="Audio" className={`icon ${selectedMediaStream ? 'grayed-out' : ''}`} onClick={toggleAudioOpen}
                style={{ margin: 0 }} title='麦克风' />
            <select id="audioDevices" className="select" disabled={selectedMediaStream}
                onChange={handleSelectChange} title='音频设备'>
                {renderAudioDeviceOptions()}
            </select>
        </div>
    );
}

function VideoDeviceSelector({ videoEnabled, setVideoEnabled, setSelectedDevice, callAccepted,
    selectedMediaStream }) {
    const [videoDevices, setVideoDevices] = useState([]);
    const [videoIcon, setVideoIcon] = useState(VideoIcon);
    const [canToggleVideo, setCanToggleVideo] = useState(true);

    // 获取视频设备列表
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            const videoDevicesList = devices.filter(device => device.kind === 'videoinput');
            setVideoDevices(videoDevicesList);
            if (videoDevicesList.length === 0) {
                setVideoEnabled(false);
                setCanToggleVideo(false);
            }
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
        if (!canToggleVideo) {
            return;
        }
        if (videoEnabled) {
            if (callAccepted) {
                setVideoEnabled((prev) => !prev);
            }
        }
        else {
            setVideoEnabled((prev) => !prev);
        }
    };

    return (
        <div className="video-device-selector-container">
            <img src={videoIcon} alt="Video" className={`icon ${selectedMediaStream ? 'grayed-out' : ''}`} onClick={toggleVideoOpen}
                style={{ margin: 0 }} title='摄像头' />
            <select id="videoDevices" className="select" disabled={selectedMediaStream}
                onChange={handleSelectChange} title='视频设备'>
                {renderVideoDeviceOptions()}
            </select>
        </div>
    );
}

// 包含两个按钮的组合框,自定义按钮文本(默认为 确定 取消 )和功能
function ButtonBox({ onOkBtnClick, OnCancelBtnClick, okBtnInfo = '确定', cancelBtnInfo = '取消' }) {
    return (
        <div className='button-confirm-container'>
            <button className='button-normal' variant="contained" color="primary" onClick={OnCancelBtnClick}>
                {cancelBtnInfo}
            </button>
            <button className='button-normal' variant="contained" color="primary" onClick={onOkBtnClick}>
                {okBtnInfo}
            </button>
        </div>
    );
}

// 包含N个按钮的组合框
function ButtonBoxN({ props }) {
    return (
        <div className='button-confirm-container'>
            {props?.infoArray.map((e, i) => {
                return (
                    <button key={i} className='button-normal' variant="contained" color="primary"
                        onClick={props?.onClickArray ? props.onClickArray[i] : undefined}
                        disabled={props?.disabled ? props?.disabled[i] : false}>
                        {e}
                    </button>
                );
            })}
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
                (< div className="overlay bottom" onMouseEnter={() => setIsArrowVisible(true)}
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

// 公告栏
function NoticeBoard({ currentView, notices, publicMsgs, setPublicMsgs, socket, locationData, fetchLocation,
    currentOutsideText }) {
    const [showLine, setShowLine] = useState(true);
    const [selectedOption, setSelectedOption] = useState(2);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isBoardExpand, setIsBoardExpand] = useState(false);
    const textareaRef = useRef(null);
    const Max_Length = 50;
    function handleClick() {
        root.style.setProperty('--overlay-notice-board-height', '60%');
        root.style.setProperty('--overlay-notice-board-width', '98%');
        setShowLine(false);
        setTimeout(() => setIsBoardExpand(true), 500);
    }

    function handleMouseLeave() {
        if (isTyping) return;
        root.style.setProperty('--overlay-notice-board-height', '2rem');
        root.style.setProperty('--overlay-notice-board-width', '52%');
        setShowLine(true);
        setTimeout(() => setIsBoardExpand(false), 500);
    };

    const handleOptionClick = (option) => {
        setSelectedOption(option);
    };

    const handleChange = (e) => {
        setInputText(e.target.value.substring(0, Max_Length));
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
        setIsTyping(e.target.value.length > 0);
    };

    const handleSendMessage = () => {
        if (inputText !== '') {
            const newMessage = {
                message: inputText.substring(0, Max_Length),
                timestamp: Date.now(),
                locationData: locationData,
                id: socket.id,
            };
            // 发送到服务器
            socket.emit('publishPublicMsg', newMessage);
            setPublicMsgs(prev => [...prev, newMessage]);
            setInputText('');
            setIsTyping(false);
            setTimeout(() => adjustNoticeAreaHeight(), 10);
        }
    };

    // 气泡高度自适应
    const adjustNoticeAreaHeight = () => {
        // 获取所有的气泡元素
        const noticeItems = document.querySelectorAll('.notice-item');

        // 遍历每个气泡元素
        noticeItems.forEach(item => {
            // 获取气泡内容元素和时间戳元素
            const noticeContent = item.querySelector('.notice');
            const timestamp = item.querySelector('.timestamp');
            if (noticeContent && timestamp) {
                // 计算气泡内容的高度
                const contentHeight = noticeContent.offsetHeight;
                // 计算时间戳的高度
                const timestampHeight = timestamp.offsetHeight;

                // 计算气泡的总高度（内容高度 + 时间戳高度 + padding）
                const totalHeight = contentHeight + timestampHeight + 10; // 这里的10是额外的 padding 和 margin

                // 将计算出的总高度应用到气泡元素上
                item.style.height = totalHeight + 'px';
            }
        });
    }

    setTimeout(adjustNoticeAreaHeight, 10);

    const formatDate = (timestamp) => {
        // 根据时间戳生成格式化的时间字符串
        const date = new Date(timestamp);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    const formatLoc = (locationData) => {
        return locationData
            ? locationData.country
                ? locationData.region
                    ? locationData.city
                        ? locationData.country + ' ' + locationData.region + ' ' + locationData.city
                        : locationData.country + ' ' + locationData.region + ' 未知城市'
                    : locationData.country + ' 未知地区'
                : '未知国家'
            : '获取地理信息失败';
    }
    const formatID = (id) => {
        if (!id) {
            return '未知用户';
        }
        if (id.length <= 8) {
            return id;
        }
        const firstFour = id.slice(0, 4);
        const lastFour = id.slice(-4);
        const maskedMiddle = '*'.repeat(4); // 构造与中间字符串长度相同的 '*' 字符串
        return firstFour + maskedMiddle + lastFour; // 返回遮蔽后的字符串
    }

    const formatNotice = (notice) => {
        let nt;
        let socketId = formatID(notice.id);
        if (notice.type === 'startMatch') {
            nt = '刚刚，' + socketId + '开始了匹配';
        }
        else if (notice.type === 'createRoom') {
            nt = '刚刚，' + socketId + '【' + notice.nickName + '】' + '创建了房间【' + notice.roomId + '】';
        }
        return nt;
    }


    useEffect(() => {
        if (!locationData) {
            fetchLocation();
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const overlayNoticeBoard = document.querySelector('.overlay-notice-board');
            if (overlayNoticeBoard && isBoardExpand && !overlayNoticeBoard.contains(event.target)) {
                handleMouseLeave();
            }
        };
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isBoardExpand]);

    return (
        <>
            {currentView === View.Menu &&
                (<div className="overlay-notice-board"
                    onMouseLeave={handleMouseLeave}
                >
                    {showLine ?
                        (<>
                            {<div className='outside-text'>{currentOutsideText.message}</div>}
                            <div className="line-container" onClick={handleClick}>
                                <div style={{ cursor: 'pointer' }}>
                                    <div className="line"></div>
                                    <div className="line"></div>
                                    <div className="line"></div>
                                </div>
                            </div>
                        </>) :
                        (<>
                            <div className='vertical-layout'>
                                <div className='option-container'>
                                    <Button className={`option ${selectedOption === 1 ? 'selected' : ''}`}
                                        onClick={() => handleOptionClick(1)}><span>组队</span></Button>
                                    <Button className={`option ${selectedOption === 2 ? 'selected' : ''}`}
                                        onClick={() => handleOptionClick(2)}><span>世界</span></Button>
                                </div>
                                {selectedOption === 1 && (
                                    <div className='text-contianer'>
                                        {notices.map((notice, index) => (
                                            <div key={index} className='notice-item'>
                                                <div className="notice">{formatNotice(notice)}</div>
                                                <div className="timestamp">{formatDate(notice.timestamp) + ' ' + formatLoc(notice.locationData)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedOption === 2 && (
                                    <div className='text-contianer'>
                                        {publicMsgs.map((notice, index) => (
                                            <div key={index} className='notice-item'>
                                                <div className="notice">{notice.message}</div>
                                                <div className="timestamp">{formatID(notice.id) + ' ' + formatDate(notice.timestamp) + ' ' + formatLoc(notice.locationData)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="input-container">
                                    <textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={handleChange}
                                        placeholder="请输入..."
                                        style={{
                                            width: '80%',
                                            height: '2.2rem', // 设置初始高度为一行文本的高度
                                            minHeight: 'auto', // 调整最小高度为自动
                                            maxHeight: '100px', // 调整最大高度
                                            fontSize: '16px', // 调整字体大小
                                            border: '1px solid #ccc',
                                            resize: 'none',
                                            overflowY: 'auto',
                                            lineHeight: '1.2', // 设置行高与字体大小相同
                                            padding: '8px', // 调整内边距
                                        }}
                                    />
                                    <button onClick={handleSendMessage}>发送</button>
                                </div>
                            </div>
                        </>)
                    }
                </div>)
            }
        </>
    );
};

function CallingModal({ isDisabled, modalInfo, onClick }) {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <p>{modalInfo}</p>
                <div className='button-confirm-container'>
                    <Button disabled={isDisabled} onClick={onClick}>取消</Button>
                </div>
            </div>
        </div>
    );
}

function BubbleScene({ headCount, onBubbleClick }) {
    const mount = useRef(null);

    useEffect(() => {
        let scene, camera, renderer, controls, bubbles = [];

        const init = () => {
            scene = new THREE.Scene();
            scene.background = null;

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 10;

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);

            mount.current.appendChild(renderer.domElement);

            // 创建控制器
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.enableZoom = true;

            const generateStarColor = () => {
                const colors = [
                    0xffffff, 0xffd700, 0xffa500, 0xff7f50, 0xff6347, 0xff4500,
                    0xff1493, 0xff69b4, 0xff00ff, 0xda70d6, 0xba55d3, 0x8a2be2,
                    0x483d8b, 0x0000ff, 0x00ffff, 0x7fff00, 0x32cd32, 0x228b22,
                    0x006400, 0x556b2f
                ];
                return colors[Math.floor(Math.random() * colors.length)];
            };

            const checkIntersection = (position, bubbles) => {
                for (let i = 0; i < bubbles.length; i++) {
                    const distance = position.distanceTo(bubbles[i].position);
                    if (distance < 1) {
                        return true;
                    }
                }
                return false;
            };

            const handleBubbleClick = (index) => {
                onBubbleClick(index);
            };

            // 创建小气泡
            const smallBubbleGeometry = new THREE.SphereGeometry(1, 32, 32);
            for (let i = 0; i < headCount - 1; i++) {
                let isIntersecting = true;
                let position;
                while (isIntersecting) {
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(Math.random() * 2 - 1);
                    const radius = Math.random() * 20;
                    position = new THREE.Vector3(
                        radius * Math.sin(phi) * Math.cos(theta),
                        radius * Math.sin(phi) * Math.sin(theta),
                        radius * Math.cos(phi)
                    );
                    isIntersecting = checkIntersection(position, bubbles);
                }

                const smallBubbleMaterial = new THREE.MeshBasicMaterial({ color: generateStarColor() });
                const smallBubble = new THREE.Mesh(smallBubbleGeometry, smallBubbleMaterial);
                smallBubble.position.copy(position);
                smallBubble.userData.index = i; // 保存小气泡的索引
                bubbles.push(smallBubble);
                scene.add(smallBubble);
            }

            const handleMouseClick = (event) => {
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2();

                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);

                const intersects = raycaster.intersectObjects(bubbles, true);

                if (intersects.length > 0) {
                    const clickedBubble = intersects[0].object;
                    const bubbleIndex = clickedBubble.userData.index;
                    handleBubbleClick(bubbleIndex);
                }
            };

            window.addEventListener('click', handleMouseClick, false);

            const animate = () => {
                requestAnimationFrame(animate);

                bubbles.forEach(bubble => {
                    const radius = 10;
                    const angle = 0.002;
                    const x = bubble.position.x;
                    const y = bubble.position.y;
                    const z = bubble.position.z;

                    bubble.position.x = x * Math.cos(angle) + z * Math.sin(angle);
                    bubble.position.z = z * Math.cos(angle) - x * Math.sin(angle);
                });

                controls.update();
                renderer.render(scene, camera);
            };

            animate();
        };

        init();

        return () => {
            if (mount.current) mount.current.removeChild(renderer.domElement);
        };
    }, []);

    return <div style={{ borderRadius: '50%', overflow: 'hidden' }} ref={mount} />;
};

function AudioIconComponent({ audioEnabled, setAudioEnabled, isAnother }) {
    const [audioIcon, setAudioIcon] = useState(AudioIcon);

    useEffect(() => {
        if (audioEnabled) {
            setAudioIcon(AudioIcon);
        }
        else {
            setAudioIcon(AudioIconDisabled);
        }
    }, [audioEnabled]);

    return (
        <>
            {
                < div className='audio-icon-container'>
                    <img src={audioIcon} alt="Audio" className={`audio-icon${isAnother ? '-another' : ''}`}
                        onClick={() => {
                            if (!isAnother) {
                                setAudioEnabled(prev => !prev)
                            }
                        }} />
                </div >
            }
        </>
    );
}

export {
    Timer, GameLog, ItemInfo, MusicPlayer, ItemManager, StartModal,
    Menu, ConfirmModal, InfoModal, Modal, SettingsButton, LoginButton, LoginModal,
    TableViewer, PlayerAvatar, ChatPanel, VideoChat, OverlayArrow, NoticeBoard,
    AudioIconComponent, ReturnMenuButton, VideoCallModal, ButtonBox, ButtonBoxN, XSign,
    Switch,
};