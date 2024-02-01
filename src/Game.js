import './Game.css';
import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { ItemInfo, MusicPlayer, ConfirmModal } from './Control.jsx';

import {
  Sword, Shield, Bow, InfectPotion, TimeBomb, XFlower
  , FreezeSpell
} from './Item.ts'
import { GameMode, Piece_Type_Black, Piece_Type_White } from './ConstDefine.jsx';
const _ = require('lodash');
const root = document.documentElement;

// 样式
const Init_Square_Style = 'square';
const Square_Bomb_Style = 'square-bomb';
const Square_Current_Piece_Style = 'square-current-piece';
const Square_Growth_Black_Style = 'square-growth-black';
const Square_Growth_White_Style = 'square-growth-white';
const Square_Frozen = 'square-frozen';
const Piece_Winner_Style = 'piece-winner';

const Piece_Black_With_Sword = 'piece-black-with-sword';
const Piece_Black_With_Bow = 'piece-black-with-bow';
const Piece_Black_With_InfectPotion = 'piece-black-with-infectPotion';
const Piece_White_With_Sword = 'piece-white-with-sword';
const Piece_White_With_Bow = 'piece-white-with-bow';
const Piece_White_With_InfectPotion = 'piece-white-with-infectPotion';

// 音效
const Error_Target = 'error-target.mp3';
const Win = 'win.mp3';
const Failure = 'failure.mp3';
const Place_Piece = 'place-piece.mp3';
const Move_Piece = 'move-piece.wav';
const Sword_Defeat_Normal = 'sword-defeat-normal.wav';
const Sword_Defeat_Shield = 'sword-defeat-shield.mp3';
const Sword_Defeat_Flower = 'sword-defeat-flower.mp3';
const Sword_No_Effect = 'sword-no-effect.mp3';
const Take_Shield = 'take-shield.wav';
const Bow_Melee_Failed_Shield = 'bow-melee-failed-shield.mp3';
const Bow_Melee_Defeat_Normal = 'bow-melee-defeat-normal.mp3';
const Bow_Melee_Defeat_Flower = 'bow-melee-defeat-flower.mp3';
const Bow_Melee_No_Effect = 'bow-melee-no-effect.mp3';
const Bow_Ranged_Failed_Shield = 'bow-ranged-failed-shield.mp3';
const Bow_Ranged_Defeat_Normal = 'bow-ranged-defeat-normal.wav';
const Bow_Ranged_Defeat_Flower = 'bow-ranged-defeat-flower.mp3';
const Bow_Ranged_No_Effect = 'bow-ranged-no-effect.mp3';

const Infect_Normal = 'infect-normal.mp3';
const Infect_Flower = 'infect-flower.mp3';
const Infect_No_Effect = 'infect-no-effect.mp3';
const Infect_Failed_Shield = 'infect-failed-shield.mp3';

const Bomb_Attach = 'bomb-attach.mp3';
const Bomb_Bomb = 'bomb-bomb.mp3';
const Flower_Place = 'flower-place.mp3';
const Flower_Full_Grown = 'flower-full-grown.mp3';

// 按钮
const SOUND = '音效';
const BGM = '背景音乐';
const VOLUME = '音量';
const OPEN = '开启';
const CLOSE = '关闭';
const RESTART_GAME = '再来一局';
const OPEN_SOUND = OPEN + SOUND;
const CLOSE_SOUND = CLOSE + SOUND;
const OPEN_BGM = OPEN + BGM;
const CLOSE_BGM = CLOSE + BGM;
const MAX_VOLUME = 100;
const MIN_VOLUME = 0;
const VOLUME_PER_TIME = 10;

let _isMute = false;
let _volume = 100;

// 其他
const Square_Size_Pc = '1.39em';
// 获取设备的屏幕分辨率
const screenWidth = window.screen.width;
const screenHeight = window.screen.height;
const square_width = Math.floor(screenWidth / (1.39 * 24));
let Board_Width;
let Board_Height;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  Board_Width = square_width;
  Board_Height = square_width;
  root.style.setProperty('--gamelog-button-width', '45vh');
} else {
  Board_Width = 18;
  Board_Height = 18;
}

// 状态
const Item = {
  NONE: 0,
  SWORD: 1,
  SHIELD: 2,
  BOW: 3,
  INFECT_POTION: 4,
  BOMB: 5,
  XFLOWER: 6,
  FREEZE_SPELL: 7,
}
const InitPieceStatus = {
  bombCount: 0,
  withItem: Item.NONE,
  frozen: false,//冻结
  frozenTime: 0,//总冻结时常
  attachSeed: false,//是否种子
  growthTime: 0,//生成所需时间
  attachBomb: false,//是否绑定炸弹
  liveTime: 0,//自爆需要时间
}

let checkArray = [];// 判定胜利棋子数组

export class Piece {
  constructor(type = '', willBe = '', canBeDestroyed = true, canBeInfected = true, liveTime = -1, growthTime = -1, x = -1, y = -1, status) {
    this.type = type;
    this.willBe = willBe;
    this.canBeDestroyed = canBeDestroyed;
    this.canBeInfected = canBeInfected;
    this.style = 'piece-blank';
    this.liveTime = liveTime;
    this.growthTime = growthTime;
    this.x = x;
    this.y = y;
    this.squareStyle = Init_Square_Style;
    this.status = { ...status };
    this.setSquareStyle();
    this.setStyle();

  }

  setType(type) {
    this.type = type;
    this.canBeDestroyed = true;
    this.canBeInfected = true;
    this.setStyle();
  }

  getPieceColor() {
    if (this.type === '●') {
      return '#000000';
    }
    else if (this.type === '○') {
      return '#ffffff';
    }
    else {
      return '#000000,transparent';
    }
  }

  setWinnerPiece() {
    this.setStyle(Piece_Winner_Style);
    root.style.setProperty('--piece-winner-color', this.getPieceColor());
  }

  setWillBe(type) {
    this.willBe = type;
    this.canBeDestroyed = true;
  }

  setLiveTime(item) {
    if (this.liveTime > 0) {
      this.status.bombCount += 1;
    }
    this.liveTime = item.liveTime;
  }

  setGrowthTime(item, type, growthTime) {
    if (item === null) {
      this.growthTime = growthTime;
      this.setWillBe(type);
      this.setSquareStyle(null, Init_Square_Style);
    }
    else {
      this.growthTime = item.growthTime;
      if (this.growthTime > 0) {
        this.setWillBe(type);
        this.setSquareStyle(item, '');
      }
    }
  }

  setCanBeDestroyed(canBeDestroyed) {
    this.canBeDestroyed = canBeDestroyed;
    this.setStyle();
  }

  setCanBeInfected(canBeInfected) {
    this.canBeInfected = canBeInfected;
    this.setStyle();
  }

  setStyle(style) {
    if (style) {
      this.style = style;
    }
    else if (this.status.attachBomb) {
      this.style = 'piece-bomb';
    }
    else if (this.type === '●') {
      if (!this.canBeDestroyed) {
        if (this.status.frozen) {
          this.style = 'piece-black-can-not-be-destroyed-frozen';
        }
        else {
          this.style = 'piece-black-can-not-be-destroyed';
        }
      }
      else {
        if (this.status.frozen) {
          this.style = 'piece-black-frozen';
        }
        else {
          switch (this.status.withItem) {
            case Item.SWORD: {
              this.style = Piece_Black_With_Sword;
              break;
            }
            case Item.BOW: {
              this.style = Piece_Black_With_Bow;
              break;
            } case Item.INFECT_POTION: {
              this.style = Piece_Black_With_InfectPotion;
              break;
            }
            default: {
              this.style = 'piece-black';
              break;
            }
          }
        }
      }
    }
    else if (this.type === '○') {
      if (!this.canBeDestroyed) {
        if (this.status.frozen) {
          this.style = 'piece-white-can-not-be-destroyed-frozen';
        }
        else {
          this.style = 'piece-white-can-not-be-destroyed';
        }
      }
      else {
        if (this.status.frozen) {
          this.style = 'piece-white-frozen';
        }
        else {
          switch (this.status.withItem) {
            case Item.SWORD: {
              this.style = Piece_White_With_Sword;
              break;
            }
            case Item.BOW: {
              this.style = Piece_White_With_Bow;
              break;
            } case Item.INFECT_POTION: {
              this.style = Piece_White_With_InfectPotion;
              break;
            }
            default: {
              this.style = 'piece-white';
              break;
            }
          }
        }
      }
    }
    else {
      this.style = 'piece-blank';
    }
  }

  setSquareStyle(item, squareStyle) {
    if (item === undefined && squareStyle === undefined) {
      if (this.liveTime > 0) {
        this.squareStyle = Square_Bomb_Style;
      }
      else if (this.status.frozen) {
        this.squareStyle = Square_Frozen;
      }
      else if (this.growthTime > 0) {
        if (this.willBe === '●') {
          this.squareStyle = Square_Growth_Black_Style;
        }
        else if (this.willBe === '○') {
          this.squareStyle = Square_Growth_White_Style;
        }
      }
      else if (this.growthTime === 0) {
        this.squareStyle = Init_Square_Style;
      }
      else {
        this.squareStyle = Init_Square_Style;
      }
      return;
    }
    if (item === undefined && squareStyle !== '') {
      this.squareStyle = squareStyle;
      return;
    }
    if (item === null && squareStyle !== '') {
      this.squareStyle = squareStyle;
      return;
    }
    if (this.type !== '') { //后处理走这里
      // this.squareStyle = Square_Current_Piece_Style; 使用棋子阴影表示道具使用状态
      if (!this.canBeDestroyed && item instanceof Bow) { // 攻击失败
        this.squareStyle = Init_Square_Style;
      }
    }
    else if (item !== null && item.isUsed) {
      this.squareStyle = Init_Square_Style;
      if (this.growthTime > 0) {
        if (this.willBe === '●') {
          this.squareStyle = Square_Growth_Black_Style;
        }
        else if (this.willBe === '○') {
          this.squareStyle = Square_Growth_White_Style;
        }
      }
    }
    else if (this.liveTime > 0) {
      this.squareStyle = Square_Bomb_Style;
    }
    else if (this.growthTime > 0) {
      if (!this.status.frozen) {
        if (this.willBe === '●') {
          this.squareStyle = Square_Growth_Black_Style;
        }
        else if (this.willBe === '○') {
          this.squareStyle = Square_Growth_White_Style;
        }
      }
    }
  }
  useItem(item, board) {
    if (item.isUsed) {
      return;
    }
    if (item.name === 'shield') {
      this.setCanBeDestroyed(false);
      this.setCanBeInfected(false);
    } else if (item.name === 'timeBomb') {
      this.attachBomb(item, board);
    } else if (item.name === 'xFlower') {
      this.attachSeed(item, board);
    }
    else if (item instanceof FreezeSpell) {
      this.useFreezeSpell(item, board);
    }
    item.isUsed = true;
  }

  useFreezeSpell(item, board) {
    const validPos = this.getValidPosition(item);
    for (const arr of validPos) {
      const tr = arr[0];
      const tc = arr[1];
      board[tr][tc].status.frozen = true;
      board[tr][tc].setSquareStyle();
      board[tr][tc].setStyle();
    }
  }

  getValidPosition(item) {
    const atkRange = item.attackRange;
    if (item.attackRange > 0) {
      let validPos = [];
      const r = this.x;
      const c = this.y;
      if (atkRange <= 1) {
        const arrayToCheck = [[r, c], [r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
        for (const arr of arrayToCheck) {
          const tr = arr[0];
          const tc = arr[1];
          if (tr >= 0 && tr < Board_Height && tc >= 0 && tc < Board_Width) {
            validPos.push([tr, tc]);
          }
        }
      }
      else if (atkRange <= 1.5) {
        const arrayToCheck = [[r, c], [r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c], [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
        for (const arr of arrayToCheck) {
          let tr = arr[0];
          let tc = arr[1];
          if (tr >= 0 && tr < Board_Height && tc >= 0 && tc < Board_Width) {
            validPos.push([tr, tc]);
          }
        }
      }
      return validPos;
    }
  }

  handleSound(item, currPiece = null) {
    // 音效
    if (item instanceof Sword) {
      if (this.type === '') {
        playSound(Sword_No_Effect);
      }
      else if (this.growthTime > 0) {
        playSound(Sword_Defeat_Flower);
      }
      else if (this.canBeDestroyed) {
        playSound(Sword_Defeat_Normal);
      }
      else {
        playSound(Sword_Defeat_Shield);
      }
    }
    else if (item instanceof Bow) {
      if (!currPiece) {
        return;
      }
      const r = currPiece.x;
      const c = currPiece.y;
      const dist = Math.sqrt(Math.pow(this.x - r, 2) + Math.pow(this.y - c, 2));
      if (this.type === '') {
        if (dist <= 1) {
          playSound(Bow_Melee_No_Effect);
        } else {
          playSound(Bow_Ranged_No_Effect);
        }
      }
      else if (this.growthTime > 0) {
        if (dist <= 1) {
          playSound(Bow_Melee_Defeat_Flower);
        } else {
          playSound(Bow_Ranged_Defeat_Flower);
        }
      }
      else if (this.canBeDestroyed) {
        if (dist <= 1) {
          playSound(Bow_Melee_Defeat_Normal);
        } else {
          playSound(Bow_Ranged_Defeat_Normal);
        }
      }
      else {
        if (dist <= 1) {
          playSound(Bow_Melee_Failed_Shield);
        } else {
          playSound(Bow_Ranged_Failed_Shield);
        }
      }
    }
    else if (item instanceof InfectPotion) {
      if (this.type === '') {
        playSound(Infect_No_Effect);
      }
      else if (!this.canBeDestroyed) {
        playSound(Infect_Failed_Shield);
      }
      else if (this.growthTime > 0) {
        playSound(Infect_Flower);
      }
      else {
        playSound(Infect_Normal);
      }
    }
    else if (item instanceof TimeBomb) {
      playSound(Bomb_Attach);
    }
    else if (item instanceof XFlower) {
      playSound(Flower_Place);
    }
  }

  destroy(item, board, piece = null, byBomb) {
    this.handleSound(item, piece);
    if (board === null) {
      return;
    }
    if (item) {
      item.isUsed = true;
    }
    if (byBomb) {
      if (this.status.frozen) {
        this.status.frozen = false;
        this.status.frozenTime = 0;
        this.setSquareStyle();
        this.setStyle();
      }
      if (this.growthTime > 0) {
        if (this.status.frozen) {
          this.status.frozen = false;
        }
        if (this.status.attachSeed) {
          this.status.attachSeed = false;
          this.status.growthTime = 0;
          const r = this.x;
          const c = this.y;
          const arrayToCheck = [[r, c], [r - 1, c - 1], [r + 1, c + 1], [r + 1, c - 1], [r - 1, c + 1]];
          for (const arr of arrayToCheck) {
            const tr = arr[0];
            const tc = arr[1];
            if (tr >= 0 && tr < Board_Height && tc >= 0 && tc < Board_Width) {
              if (board[tr][tc].growthTime > 0) {
                board[tr][tc].setGrowthTime(null, '', -1);
              }
              this.setType('');
            }
          }
        }
        else {
          this.setType('');
        }
      }
      else { // 攻击普通单位
        this.setType('');
      }
    }
    else {
      if (this.status.frozen) {
        this.status.frozen = false;
        this.status.frozenTime = 0;
        this.setSquareStyle();
        this.setStyle();
        return;
      }
      // 攻击花朵
      if (this.growthTime > 0) {
        if (this.status.attachSeed) {
          this.status.attachSeed = false;
          this.status.growthTime = 0;
          const r = this.x;
          const c = this.y;
          const arrayToCheck = [[r, c], [r - 1, c - 1], [r + 1, c + 1], [r + 1, c - 1], [r - 1, c + 1]];
          for (const arr of arrayToCheck) {
            const tr = arr[0];
            const tc = arr[1];
            if (tr >= 0 && tr < Board_Height && tc >= 0 && tc < Board_Width) {
              if (board[tr][tc].growthTime > 0) {
                board[tr][tc].setGrowthTime(null, '', -1);
              }
            }
          }
          this.setType('');
        }
        else {
          if (this.type !== '') {
            if (this.canBeDestroyed || item instanceof Sword) {
              this.setType('');
            }
          }
        }
      }
      else { //攻击普通单位
        if (this.type !== '') {
          if (this.canBeDestroyed || item instanceof Sword) {
            this.setType('');
          }
        }
      }
    }

    this.setSquareStyle();
    this.setStyle();
  }


  infect(item, piece, board) {
    this.handleSound(item, piece);
    if (this.status.frozen) {
      item.isUsed = true;
      return;
    }
    else {
      if (this.type === '') {
        item.isUsed = true;
        return;
      }
    }
    // 侵蚀花朵
    if (this.growthTime > 0) {
      if (this.status.attachSeed) {
        this.status.attachSeed = false;
        this.status.growthTime = 0;
        const r = this.x;
        const c = this.y;
        const arrayToCheck = [[r, c], [r - 1, c - 1], [r + 1, c + 1], [r + 1, c - 1], [r - 1, c + 1]];
        for (const arr of arrayToCheck) {
          const tr = arr[0];
          const tc = arr[1];
          if (tr >= 0 && tr < Board_Height && tc >= 0 && tc < Board_Width) {
            if (board[tr][tc].growthTime > 0) {
              board[tr][tc].setGrowthTime(null, '', -1);
            }
          }
        }
        if (this.canBeInfected) {
          this.setType(piece.type);
        }
      }
      else {
        if (this.canBeInfected) {
          this.setType(piece.type);
        }
      }
    }
    else { //攻击普通单位
      if (this.canBeInfected) {
        this.setType(piece.type);
      }
    }
    this.setSquareStyle();
    this.setStyle();
    item.isUsed = true;
  }

  attachBomb(item, board) {
    this.handleSound(item);
    const r = this.x;
    const c = this.y;
    const arrayToCheck = [[r, c], [r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
    for (const arr of arrayToCheck) {
      const tr = arr[0];
      const tc = arr[1];
      if (tr >= 0 && tr < Board_Height && tc >= 0 && tc < Board_Width) {
        if (board[tr][tc].liveTime < 0) {
          board[tr][tc].setLiveTime(item);
        } else if (board[tr][tc].liveTime < item.liveTime) {
          board[tr][tc].setLiveTime(item);
        }
        board[tr][tc].setSquareStyle();
      }
    }
    item.isUsed = true;
    this.status.attachBomb = true;
    this.setSquareStyle();
    this.setStyle();
  }

  bomb(item, board, byBomb) {
    if (this.status.bombCount === 0) {
      this.liveTime = -1;
    }
    if (this.status.bombCount > 0) {
      this.status.bombCount -= 1;
    }
    this.destroy(item, board, null, byBomb);
    if (this.status.attachBomb) {
      this.status.attachBomb = false;
    }
    this.setSquareStyle();
    this.setStyle();
  }

  attachSeed(item, board) {
    this.handleSound(item);
    if (this.status.frozen) {
      item.isUsed = true;
      this.status.attachSeed = true;
      this.setStyle();
      return;
    }
    const r = this.x;
    const c = this.y;
    const arrayToCheck = [[r, c], [r - 1, c - 1], [r + 1, c + 1], [r + 1, c - 1], [r - 1, c + 1]];
    for (const arr of arrayToCheck) {
      const tr = arr[0];
      const tc = arr[1];
      if (tr >= 0 && tr < Board_Height && tc >= 0 && tc < Board_Width) {
        // 冰冻不能生长
        if (board[tr][tc].status.frozen) {
          continue;
        }
        if (board[tr][tc].growthTime < 0) {
          board[tr][tc].setGrowthTime(item, this.type);
        } else if (board[tr][tc].growthTime < item.growthTime) {
          board[tr][tc].setGrowthTime(item, this.type);
        }
      }
    }
    item.isUsed = true;
    this.status.attachSeed = true;
    this.status.growthTime = item.growthTime;
    this.setStyle();
  }

  grow(item) {
    let grown = false;
    if (this.growthTime > 0) {
      this.setSquareStyle();
    }
    else if (this.growthTime === 0) {
      grown = true;
      if (this.status.attachSeed) {
        this.attachSeed = false;
      }
      this.growthTime = -1;
      if (this.status.frozen) {
        return grown;
      }
      if (this.type === '') {
        this.setType(this.willBe);
        checkArray.push([this.x, this.y]);
      }
      this.setSquareStyle();
    }
    return grown;
  }

  beforeUse(item) {
    if (this.type !== '') {
      item.beforeUse();
      if (item instanceof Sword) {
        this.status.withItem = Item.SWORD;
      }
      else if (item instanceof Bow) {
        this.status.withItem = Item.BOW;
      }
      else if (item instanceof InfectPotion) {
        this.status.withItem = Item.INFECT_POTION;
      }
      this.setStyle();
    }
  }
}

function Square({ piece, onSquareClick, squareStyle, playSound }) {
  const playMovePieceSound = () => {
    if (piece.type !== '' || _isMute) {
      return;
    }
    const sound = new Howl({
      src: ['audio/' + Move_Piece],
      volume: _volume / 100,
    });
    sound.play();
  };
  return (
    <button className={piece.squareStyle} onClick={onSquareClick} onMouseEnter={playMovePieceSound}>
      <span className={piece.style}></span>
    </button>
  );

}

function deepCloneBoard(board) {
  return board.map(row => row.map(piece => (piece instanceof Piece ? deepClonePiece(piece) : piece)));
}

function deepClonePiece(piece) {
  const clonedPiece = new Piece(piece.type, piece.willBe, piece.canBeDestroyed, piece.canBeInfected, piece.liveTime, piece.growthTime, piece.x, piece.y, piece.status);
  return clonedPiece;
}

function Board({ xIsNext, board, setBoard, currentMove, onPlay, gameOver,
  setGameOver, selectedItem, nextSelItem, selectedItemHistory, gameStart, setGameStart,
  openModal, playSound, UndoButton, RedoButton, RestartButton, SwitchSoundButton,
  VolumeControlButton, logAction, isRestart, lastClick, setLastClick,
  socket, pieceType, lastStep, gameMode }) {

  const [squareStyle, setSquareStyle] = useState(Init_Square_Style);
  const renderCell = (cellValue, rowIndex, colIndex) => {
    const key = [rowIndex, colIndex];
    return (
      <Square key={key}
        piece={cellValue} onSquareClick={() => handleClick(rowIndex, colIndex)}
        squareStyle={squareStyle} playSound={playSound} />
    );
  };

  function handleClick(i, j, isEnemyTurn) {
    if (gameMode !== GameMode.MODE_SIGNAL) {
      if (isEnemyTurn) {

      }
      else {
        if ((pieceType === Piece_Type_Black && !xIsNext) ||
          pieceType === Piece_Type_White && xIsNext) {
          playSound(Error_Target);
          return;
        }
      }
    }

    // 预处理
    if (gameStart) {
      setGameStart(false);
    }

    if (gameOver) {
      openModal("游戏已结束！再来一局吧", 3000);
      return;
    }
    if (board[i][j].type !== '') {
      if (!selectedItem.before) {
        playSound(Error_Target);
        return;
      }
    }
    else {
      switch (selectedItem.name) {
        case 'shield': {
          if (board[i][j].type !== '') {
            return;
          }
          break;
        }
        case 'sword':
        case 'bow': {
          break;
        }
        case 'infectPotion': {
          break;
        }
        case 'timeBomb': {
          break;
        }
        default: {
          break;
        }
      }
    }
    // const nextBoard = board.slice();
    // const nextBoard = JSON.parse(JSON.stringify(board));
    const nextBoard = deepCloneBoard(board);
    if (selectedItem.name === 'timeBomb') {
      if (board[i][j].liveTime > 0) {
        // openModal('不能在此放置炸弹！');
        playSound(Error_Target);
        return;
      }
      if (xIsNext) {
        nextBoard[i][j].setType('●');
      } else {
        nextBoard[i][j].setType('○');
      }
    } else {
      if (!selectedItem.before) {
        if (xIsNext) {
          nextBoard[i][j].setType('●');
        } else {
          nextBoard[i][j].setType('○');
        }
      }
    }

    onPlay(lastClick, setLastClick, nextBoard, i, j);

    // 胜利判定
    checkArray.push([i, j]);
    for (const arr of checkArray) {
      const winnerInfo = calculateWinner(nextBoard, arr[1], arr[0]);
      if (winnerInfo[0]) {
        openModal(winnerInfo[0] + '胜利！', 60000);
        setGameOver(true);
        logAction(nextBoard[i][j], nextBoard[i][j], selectedItem, true);
        for (const arr of winnerInfo[1]) {
          const x = arr[0];
          const y = arr[1];
          nextBoard[x][y].setWinnerPiece();
        }
        playSound(Win);
        break;
      }
    }
    checkArray = [];

    // 发送消息
    if (!isEnemyTurn) {
      socket.emit('step', { i, j });
    }
  }

  useEffect(() => {
    if (lastStep.length === 0) {
      return;
    }
    handleClick(lastStep[0], lastStep[1], true);
  }, [lastStep]);

  let currentPiece = xIsNext ? '●' : '○';
  let nextPiece = xIsNext ? '○' : '●';
  // let currentItem = selectedItemHistory[currentMove];
  let currentItem = selectedItem;

  let nextPieceStatus = '下一回合行动棋子: ';
  let currentPieceStatus = '当前回合行动棋子: ';
  // let isUsedStatus = currentItem.isUsed ? '已使用' : '未使用';
  // if (currentItem.isUsed) {
  //   root.style.setProperty('--item-used-status-span-color', 'red');
  // }
  // else {
  //   root.style.setProperty('--item-used-status-span-color', 'green');
  // }

  // if (currentItem.isUsed) {
  //   root.style.setProperty('--item-used-status-span-color', 'red');
  // }
  // else {
  //   root.style.setProperty('--item-used-status-span-color', 'green');
  // }
  let currentItemStatus = '当前道具: ';
  let nextItemStatus = '下个道具: ';
  return (
    <>
      <div className='game-info'>
        <div className="piece-status">{currentPieceStatus}<span className='piece-name'>{currentPiece}</span><span className='span-blank'></span>
          {currentItemStatus}<ItemInfo item={selectedItem} />
        </div>
        <div className="piece-status">{nextPieceStatus}<span className='piece-name'>{nextPiece}</span><span className='span-blank'></span>
          {nextItemStatus}<ItemInfo item={nextSelItem} /></div>
        <div className="button-container">
          <UndoButton />
          <RedoButton />
          <RestartButton />
          <SwitchSoundButton />
          <VolumeControlButton />
          <MusicPlayer isRestart={isRestart} />
        </div>
      </div>
      <div className="board-row">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
          </div>
        ))}
      </div>
    </>
  );
}

// 创建棋盘
function createBoard(setGameStart) {
  const board = [];
  for (let i = 0; i < Board_Height; i++) {
    const row = [];
    for (let j = 0; j < Board_Width; j++) {
      const piece = new Piece('', '', true, true, -1, -1, i, j, InitPieceStatus);
      row.push(piece);
    }
    board.push(row);
  }
  setGameStart(true);
  return board;
}

function playSound(audioName) {
  if (_isMute) {
    return;
  }
  let audioSrc = audioName ? 'audio/' + audioName : null;
  if (!audioSrc) {
    return;
  }
  const sound = new Howl({
    src: [audioSrc],
    volume: _volume / 100,
  });
  sound.play();
};

/**
 * 是否存在可被选中的棋子
 */
function haveValidPiece(item, lastClick, i, j, board, statusObj) {
  let result = false;
  if (item.isUsed) {
    return false;
  }
  if (!(item instanceof FreezeSpell) && board[i][j].status.frozen) {
    if (item instanceof TimeBomb) {
      result = true;
    }
    else if (item instanceof XFlower) {
      result = true;
    }
    else {
      statusObj.pieceStatus = board[i][j].status;
    }
    return result;
  }
  if (item.name === 'sword') {
    const arrayToCheck = [[i, j + 1], [i, j - 1], [i + 1, j], [i - 1, j]];
    for (const arr of arrayToCheck) {
      let x = arr[0];
      let y = arr[1];
      if (x >= 0 && x < Board_Height && y >= 0 && y < Board_Width && board[x][y].liveTime < 0) {
        if (board[x][y].status.frozen) {
          result = true;
          break;
        }
        else if (board[x][y].type !== board[i][j].type && board[x][y].type !== '') {
          result = true;
          break;
        }
      }
    }
  }
  else if (item.name === 'bow') {
    const arrayToCheck = [[i, j + 1], [i, j - 1], [i + 1, j], [i - 1, j], [i - 1, j - 1], [i - 1, j + 1], [i + 1, j - 1], [i + 1, j + 1]];
    for (const arr of arrayToCheck) {
      let x = arr[0];
      let y = arr[1];
      if (x >= 0 && x < Board_Height && y >= 0 && y < Board_Width && board[x][y].liveTime < 0) {
        if (board[x][y].status.frozen) {
          result = true;
          break;
        }
        else if (board[x][y].type !== board[i][j].type && board[x][y].type !== '' && board[x][y].canBeDestroyed) {
          result = true;
          break;
        }
      }
    }
  }
  else if (item.name === 'shield') {
    result = true;
  }
  else if (item.name === 'infectPotion') {
    const arrayToCheck = [[i, j + 1], [i, j - 1], [i + 1, j], [i - 1, j]];
    for (const arr of arrayToCheck) {
      let x = arr[0];
      let y = arr[1];
      if (x >= 0 && x < Board_Height && y >= 0 && y < Board_Width && board[x][y].liveTime < 0) {
        if (board[x][y].status.frozen) {
          continue;
        }
        if (board[x][y].type !== board[i][j].type && board[x][y].type !== '' && board[x][y].canBeInfected) {
          result = true;
          break;
        }
      }
    }
  }
  else if (item.name === 'timeBomb') {
    result = true;
  }
  else if (item.name === 'xFlower') {
    result = true;
  }
  else if (item instanceof FreezeSpell) {
    result = true;
  }
  return result;
}

function validateLoc(item, lastClick, i, j, board, openModal, closeModal) {
  let isRangeValid = false;
  let isObjectValid = true;
  let isHitValid = true;
  let r = lastClick[0];
  let c = lastClick[1];
  if (_.isEqual(lastClick, [i, j])) {
    return isRangeValid;
  }
  if (board[r][c].type === '') {
    return -1; // 当前使用道具的主体已被摧毁
  }
  if (item.name === 'sword') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
    isRangeValid = arrayToCheck.some(([a, b]) => (a === i && b === j));
    if (!isRangeValid) {
      // openModal('目标超出攻击范围！');
      playSound(Error_Target);
    }
    else if (board[i][j].type === '') {
      if (board[i][j].status.frozen) {
        // openModal('敲碎了冰块');
      } else {
        // openModal('糟糕，没有击中目标！');

      }
    }
    else if (board[i][j].type === board[r][c].type) {
      if (board[i][j].status.frozen) {
        // openModal('敲碎了冰块');
      }
      else {
        isObjectValid = false;
        playSound(Error_Target);
        // openModal('不能攻击同类棋子');
      }
    }
    else if (!board[i][j].canBeDestroyed) {
      // openModal('给予敌方装甲致命一击！');
    }
    else {
      // openModal('轻轻一击');
    }
  }
  else if (item.name === 'bow') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c], [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
    isRangeValid = arrayToCheck.some(([a, b]) => (a === i && b === j));
    if (!isRangeValid) {
      // openModal('太远了，打不到！');
      playSound(Error_Target);
    }
    else if (board[i][j].type === '') {
      if (board[i][j].status.frozen) {
        // openModal('击碎了冰块');
      } else {
        // openModal('糟糕，箭射偏了！');
      }
    }
    else if (board[i][j].type === board[r][c].type) {
      if (board[i][j].status.frozen) {
        // openModal('击碎了冰块');
      } else {
        isObjectValid = false;
        // openModal('不能打同类！');
        playSound(Error_Target);
      }
    }
    else if (!board[i][j].canBeDestroyed) {
      if (board[i][j].status.frozen) {
        // openModal('击碎了冰块');
      } else {
        // isHitValid = false;
        // openModal('未能击穿敌方装甲！');
        const currPiece = board[r][c];
        board[i][j].handleSound(item, board, currPiece);
      }
    }
    else {
      // openModal('轻轻一击');
    }
  }
  else if (item.name === 'shield') {
    return true;
  } else if (item.name === 'infectPotion') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
    isRangeValid = arrayToCheck.some(([a, b]) => (a === i && b === j));
    if (!isRangeValid) {
      // openModal('太远了，无法侵蚀！');
      playSound(Error_Target);
    }
    if (board[i][j].status.frozen) {
      isObjectValid = false;
      // openModal('无法侵蚀冰块！');
      playSound(Error_Target);
    }
    else if (board[i][j].type === '') {
      // openModal('糟糕，没有侵蚀目标！');
    }
    else if (board[i][j].type === board[r][c].type) {
      isObjectValid = false;
      // openModal('不能侵蚀同类棋子');
      playSound(Error_Target);
    }
    else if (!board[i][j].canBeDestroyed) {
      isHitValid = false;
      // openModal('目标具有护盾，不能被侵蚀！');
      const currPiece = board[r][c];
      board[i][j].handleSound(item, board, currPiece);
    }
    else {
      // openModal('侵蚀成功！');
    }
  }
  else if (item.name === 'timeBomb') {
    isRangeValid = true;
    isHitValid = true;
    if (board[i][j].type !== '') {
      isObjectValid = false;
      openModal('不能在棋子上放置炸弹！');
      playSound(Error_Target);
    }
    else {
      // openModal('炸弹放置成功！');
    }
  }
  return isRangeValid && isObjectValid && isHitValid;
}

function doItem(item, board, i, j, lastClick) {
  let r = lastClick[0];
  let c = lastClick[1];
  const currPiece = board[r][c];
  switch (item.name) {
    case 'shield': {
      break;
    }
    case 'sword':
    case 'bow': {
      currPiece.status.withItem = Item.NONE;
      board[i][j].destroy(item, board, currPiece);
      break;
    }
    case 'infectPotion': {
      currPiece.status.withItem = Item.NONE;
      board[i][j].infect(item, currPiece, board);
      break;
    }
    case 'timeBomb': {
      board[i][j].attachBomb();
      break;
    }
    case 'xFlower': {
      board[i][j].attachSeed();
      break;
    }
    default: {
      break;
    }
  }
  currPiece.setStyle();
}

function SwitchSoundButton() {
  const [buttonStatus, setButtonStatus] = useState(CLOSE_SOUND);
  function onButtonClick() {
    _isMute = !_isMute;
    if (_isMute) {
      setButtonStatus(OPEN_SOUND);
    }
    else {
      setButtonStatus(CLOSE_SOUND);
    }
  }
  return (
    <button className='button-normal' onClick={onButtonClick}>{buttonStatus}</button>
  );
}

function VolumeControlButton() {
  const [volume, setVolume] = useState(MAX_VOLUME);

  function handleVolumeChange(amount) {
    _volume += amount;
    if (_volume > MAX_VOLUME) {
      _volume = MAX_VOLUME;
    }
    else if (_volume < 0) {
      _volume = MIN_VOLUME;
    }
    setVolume(_volume);
  }

  return (
    <div>
      <span>{VOLUME}</span>
      <button className='button-normal' onClick={() => { handleVolumeChange(-VOLUME_PER_TIME) }}>
        <MinusOutlined />
      </button>
      <span>{volume}</span>
      <button className='button-normal' onClick={() => { handleVolumeChange(VOLUME_PER_TIME) }}>
        <PlusOutlined />
      </button>
    </div>
  );
};

function Game({ items, setItems, setRestart, round, setRound, roundMoveArr, setRoundMoveArr, totalRound, setTotalRound,
  gameLog, setGameLog, isRestart, gameMode, setGameMode, GameMode,
  socket, pieceType, lastStep, seeds }) {

  // 消息弹窗
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState('');
  const timeoutIdRef = useRef(null);

  const [gameStart, setGameStart] = useState(false);
  const [board, setBoard] = useState(() => createBoard(setGameStart));
  const [history, setHistory] = useState([board]);
  const [currentMove, setCurrentMove] = useState(0);
  const currentBoard = history[currentMove];
  const [gameOver, setGameOver] = useState(false);
  let random1, random2;
  if (gameMode === GameMode.MODE_ROOM || gameMode === GameMode.MODE_MATCH) {
    random1 = seeds[0];
    random2 = seeds[1];
  } else {
    random1 = Math.random();
    random2 = Math.random();
  }
  const [selectedItem, setSelectedItem] = useState(items[Math.floor(random1 * items.length)]);
  const [nextSelItem, setNextSelItem] = useState(items[Math.floor(random2 * items.length)]);
  const [selectedItemHistory, setSelectedItemHistory] = useState([selectedItem]);
  const [xIsNext, setIsNext] = useState(true);
  const [isUndo, setIsUndo] = useState(false);
  const [isRedo, setIsRedo] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSkipModalOpen, setSkipModalOpen] = useState(false);
  const [lastClick, setLastClick] = useState([null, null]);

  function pickRandomItem() {
    if (selectedItem.isUsed) {
      const temp = items.filter(item => item !== selectedItem && !item.isUsed && item !== undefined);
      setItems(temp);
      // const randomIndex = Math.floor(Math.random() * items.length);
      // const randomItem = items[randomIndex];
      setSelectedItem(nextSelItem);
      let random;
      if (gameMode === GameMode.MODE_ROOM || gameMode === GameMode.MODE_MATCH) {
        random = seeds[round];
      }
      else {
        random = Math.random();
      }
      const nextIndex = Math.floor(random * temp.length);
      const nextRandomItem = temp[nextIndex];

      setNextSelItem(nextRandomItem);
    }
    const nextItemHistory = [...selectedItemHistory.slice(0, currentMove + 1), selectedItem];
    setSelectedItemHistory(nextItemHistory);
  };

  function logAction(srcPiece, tarPiece, item, isGameOver) {
    if (isGameOver) {
      const actionInfo = srcPiece.type + ' 胜利！';
      setGameLog([...gameLog, [actionInfo, srcPiece, tarPiece, selectedItem]]);
    }
    else {
      item.srcPiece = srcPiece;
      item.tarPiece = tarPiece;
      const actionInfo = item.do();
      setGameLog([...gameLog, [actionInfo, srcPiece, tarPiece, selectedItem]]);
    }
  }

  function handlePlay(lastClick, setLastClick, nextBoard, i, j) {
    // 重置悔棋、还原标志
    setIsUndo(false);
    setIsRedo(false);

    if (!selectedItem.isUsed && selectedItem.before) {
      // 判断二次选中棋子合法性
      let isValid = validateLoc(selectedItem, lastClick, i, j, currentBoard, openModal, closeModal);
      if (isValid === true) {
        logAction(nextBoard[lastClick[0]][lastClick[1]], nextBoard[i][j], selectedItem);
        doItem(selectedItem, nextBoard, i, j, lastClick);
        setIsNext(!xIsNext);
      }
      else if (isValid === -1) {
        setIsNext(!xIsNext);
      }
      else if (isValid === -2) {
        setIsNext(!xIsNext);
      }
      else {
        return;
      }
    }
    if (_.isEqual(lastClick, [null, null])) {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
      logAction(nextBoard[i][j], nextBoard[i][j], selectedItem);
    }
    if (_.isEqual(lastClick, [i, j])) {
      if (nextBoard[i][j] !== '') {
        // return;
      }
    }
    if (selectedItem.name === 'shield') {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
      playSound(Take_Shield);
      logAction(nextBoard[i][j], nextBoard[i][j], selectedItem);
    }
    else if (selectedItem.name === 'timeBomb') {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
      logAction(nextBoard[i][j], nextBoard[i][j], selectedItem);
    }
    else if (selectedItem.name === 'xFlower') {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
      logAction(nextBoard[i][j], nextBoard[i][j], selectedItem);
    }
    else if (selectedItem instanceof FreezeSpell) {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
      logAction(nextBoard[i][j], nextBoard[i][j], selectedItem);
    }
    else {
      if (!selectedItem.before && !selectedItem.isUsed) {
        nextBoard[i][j].beforeUse(selectedItem);
        playSound(Place_Piece);
      }
    }
    // 后处理事件
    let statusObj = { pieceStatus: InitPieceStatus };
    let haveValid = haveValidPiece(selectedItem, lastClick, i, j, nextBoard, statusObj);
    if (!haveValid) {
      if (selectedItem.before) {
        logAction(nextBoard[i][j], nextBoard[i][j], selectedItem);
        // 清除棋子持有道具状态
        nextBoard[i][j].status.withItem = Item.NONE;
        nextBoard[i][j].setStyle();
      }
      selectedItem.isUsed = true;
    }
    let bombed = false;
    nextBoard.forEach((row) => {
      row.forEach((cell) => {
        if (selectedItem.isUsed) {
          cell.liveTime -= 1;
        }
        if (cell.liveTime === 0 || cell.status.bombCount > 0) {
          bombed = true;
          cell.bomb(null, nextBoard, bombed);
        }
      })
    });
    if (bombed) {
      playSound(Bomb_Bomb);
    }
    let grew = false;
    let grown = false;
    nextBoard.forEach((row) => {
      row.forEach((cell) => {
        if (selectedItem.isUsed) {
          cell.growthTime -= 1;
        }
        if (cell.growthTime >= 0) {
          grew = true;
          if (cell.grow(null)) {
            grown = true;
          }
        }
      })
    });
    if (grown) {
      playSound(Flower_Full_Grown);
    }
    if (bombed || !haveValid) {
      if (bombed && nextBoard[i][j].liveTime > 0) {
        setIsNext(!xIsNext);
        selectedItem.before = false;
        selectedItem.isUsed = true;
      }
      else if (!haveValid) {
        if (!selectedItem.isUsed) {
          // openModal('没有有效目标，已为您自动跳过！');
        }
        setIsNext(!xIsNext);
        selectedItem.before = false;
        selectedItem.isUsed = true;
      }
    }
    nextBoard[i][j].setSquareStyle(selectedItem);
    pickRandomItem();
    const nextHistory = [...history.slice(0, currentMove + 1), nextBoard];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setLastClick([i, j]);
  }

  function jumpTo(nextRound, isUndo, isRedo) {
    if (isUndo) {
      if (nextRound < 1) {
        return;
      }
      setIsUndo(true);
      setIsNext(!xIsNext);
      const lastMove = roundMoveArr[nextRound - 1];
      setCurrentMove(lastMove);
      setRound(round - 1);
      setSelectedItem(selectedItemHistory[lastMove]);
      for (const [index, item] of selectedItemHistory.entries()) {
        if (index >= lastMove) {
          item.isUsed = false;
        }
      }
    }
    else if (isRedo) {
      if (nextRound > roundMoveArr.length || nextRound > totalRound) {
        return;
      }
      setIsRedo(true);
      setIsNext(!xIsNext);
      const nextMove = roundMoveArr[nextRound - 1];
      setCurrentMove(nextMove);
      setRound(round + 1);
      setSelectedItem(selectedItemHistory[nextMove]);
      for (const [index, item] of selectedItemHistory.entries()) {
        if (index >= nextMove) {
          item.isUsed = false;
        }
      }
    }
  }

  const moves = history.map((board, move) => {
    if (move === 0) {
      return null;
    }
    let description = '回退到：' + move;
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  const UndoButton = () => {
    let description = "悔棋";
    const lastRound = round - 1;
    return (
      <button className='button-normal' onClick={() => jumpTo(lastRound, true)}>{description}</button>
    );
  }

  const RedoButton = () => {
    let description = "还原";
    const nextRound = round + 1;
    return (
      <button className='button-normal' onClick={() => jumpTo(nextRound, false, true)}>{description}</button>
    );
  }

  const RestartButton = () => {
    let description = RESTART_GAME;
    function onButtonClick() {
      const initBoardHistory = [...history.slice(0, 1)];
      setHistory(initBoardHistory);
      setCurrentMove(0);
      const initItemHistory = [...selectedItemHistory.slice(0, 1)];
      setSelectedItemHistory(initItemHistory);
      setSelectedItem(items[Math.floor(Math.random() * items.length)]);
      setNextSelItem(items[Math.floor(Math.random() * items.length)]);
      setGameOver(false);
      setRestart(true);
      setIsNext(true);
      setRound(1);
    }
    return (
      <button className='button-normal' onClick={onButtonClick}>{description}</button>
    );
  }

  const ExitButton = () => {
    let description = "退出";
    function onButtonClick() {
      setConfirmModalOpen(true);
    }
    return (
      <button className='button-normal' onClick={onButtonClick}>{description}</button>
    );
  }

  const SkipButton = () => {
    let description = "跳过";
    function onButtonClick() {
      setSkipModalOpen(true);
    }
    return (
      <button className='button-normal' onClick={onButtonClick}>{description}</button>
    );
  }

  function skipRound() {
    if (!_.isEqual(lastClick, [null, null])) {
      const r = lastClick[0];
      const c = lastClick[1];
      const currPiece = currentBoard[r][c];
      logAction(currPiece, currPiece, selectedItem);
      if (selectedItem instanceof Sword || selectedItem instanceof Bow || selectedItem instanceof InfectPotion) {
        currPiece.status.withItem = Item.NONE;
        currPiece.setStyle();
        currPiece.setSquareStyle();
      }
    }
    pickRandomItem();
    setIsNext(!xIsNext);
    setSkipModalOpen(false);
  }

  function exitGame() {
    setGameMode(GameMode.MODE_NONE);
    setRestart(true);
  }

  const openModal = (info, time = 500) => {
    // return;//暂时屏蔽弹窗
    setModalOpen(true);
    setModalInfo(info);
    timeoutIdRef.current = setTimeout(() => {
      closeModal();
    }, time);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // 使用 useEffect 来清除定时器，确保在组件卸载时不会触发关闭
  useEffect(() => {
    const timeoutId = timeoutIdRef.current;
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (isUndo || isRedo) {
      return;
    }
    setRound(round + 1);
    setTotalRound(round + 1);
    const tempArr = [...roundMoveArr.slice(0, round + 1), currentMove];
    setRoundMoveArr(tempArr);
  }, [xIsNext]);

  return (
    <div className="game">
      <div className='side-button-container'>
        <ExitButton />
        <SkipButton />
      </div>
      <div className="game-board">
        <Board xIsNext={xIsNext} board={currentBoard} setBoard={setBoard}
          currentMove={currentMove} onPlay={handlePlay} gameOver={gameOver}
          setGameOver={setGameOver} selectedItem={selectedItem} nextSelItem={nextSelItem} selectedItemHistory={selectedItemHistory}
          gameStart={gameStart} setGameStart={setGameStart} openModal={openModal}
          playSound={playSound} UndoButton={UndoButton} RedoButton={RedoButton}
          RestartButton={RestartButton} SwitchSoundButton={SwitchSoundButton}
          VolumeControlButton={VolumeControlButton} logAction={logAction}
          isRestart={isRestart} lastClick={lastClick} setLastClick={setLastClick}
          socket={socket} pieceType={pieceType} lastStep={lastStep} gameMode={gameMode}
        />
      </div>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <span className="close-button" onClick={closeModal}>
              &times;
            </span>
            <p>{modalInfo}</p>
          </div>
        </div>
      )}
      {isConfirmModalOpen && (
        <ConfirmModal modalInfo='确定退出游戏吗？' onOkBtnClick={exitGame} OnCancelBtnClick={() => setConfirmModalOpen(false)} />
      )}
      {isSkipModalOpen && (
        <ConfirmModal modalInfo='确定跳过本回合吗？' onOkBtnClick={skipRound} OnCancelBtnClick={() => setSkipModalOpen(false)} />
      )}
    </div>
  );
}

function calculateWinner(board, x, y) {
  if (x < 0 || x >= Board_Width || y < 0 || y >= Board_Height || x === undefined || y === undefined) {
    return false;
  }
  if (board[y][x].status.frozen || board[y][x].status.attachBomb) {
    return false;
  }
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1], // 水平、垂直、右斜、左斜方向
  ];

  const currentType = board[y][x].type;
  const checkDirection = (dx, dy) => {
    // 计算当前方向上的连珠数
    const count = (dx, dy) => {
      let count = 0;
      let coordinates = [];
      let i = 1;
      while (i <= 4) {
        const newX = x + i * dx;
        const newY = y + i * dy;
        if (newX >= 0 && newX < Board_Width && newY >= 0 && newY < Board_Height && board[newY][newX].type === currentType &&
          !board[newY][newX].status.frozen && !board[newY][newX].status.attachBomb) {
          // 判断特殊效果
          count += 1;
          coordinates.push([newY, newX]);
        } else {
          break;
        }
        i++;
      }
      let result = [count, coordinates]
      return result;
    };

    // 检查当前方向上是否有五子连珠
    let res1 = count(dx, dy);
    let res2 = count(-dx, -dy);
    let count1 = res1[0];
    let count2 = res2[0];
    let coordinates1 = res1[1];
    let coordinates2 = res2[1];
    let rest = [];
    if (count1 + count2 >= 4) {
      let tem = [...coordinates1.reverse(), ...coordinates2].slice(0, 4);
      tem.push([y, x]);
      rest.push(currentType, tem);
    }
    else {
      rest.push(null, [null, null]);
    }
    return rest;
  };

  // 检查所有方向
  for (const [dx, dy] of directions) {
    const winnerInfo = checkDirection(dx, dy);
    if (winnerInfo[0] !== null) {
      return winnerInfo;
    }
  }

  return [null, [null, null]];
};

export default Game;
