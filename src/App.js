import './App.css';
import { useState, useEffect, useRef } from 'react';

import { Sword, Shield, Bow, InfectPotion, TimeBomb, XFlower } from './Item.ts'
import { toBeEmpty } from '@testing-library/jest-dom/dist/matchers.js';
const _ = require('lodash');

const Init_Square_Style = 'square';
const Square_Bomb_Style = 'square-bomb';
const Square_Current_Piece_Style = 'square-current-piece';
const Square_Growth_Black_Style = 'square-growth-black';
const Square_Growth_White_Style = 'square-growth-white';
const Piece_Winner_Style = 'piece-winner';


const root = document.documentElement;
const sword = new Sword();
const shield = new Shield();
const bow = new Bow();
const infectPotion = new InfectPotion();
const timeBomb = new TimeBomb();
const xFlower = new XFlower();

let its = [sword, shield, bow, infectPotion, timeBomb, xFlower];
// 设置每个元素的权重
const weights = {
  sword: 30,
  shield: 50,
  bow: 20,
  infectPotion: 40,
  timeBomb: 10,
  xFlower: 10,
};
function getItem(weights) {
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const randomValue = Math.random() * totalWeight;
  // 根据随机数选择元素
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

let items = [];
for (let i = 0; i < 19; i++) {
  for (let j = 0; j < 19; j++) {
    // 抽取道具
    const item = _.cloneDeep(getItem(weights));
    items.push(item);
  }
}

let checkArray = []

class Piece {
  constructor(type = '', willBe = '', canBeDestroyed = true, canBeInfected = true, liveTime = -1, growthTime = -1, x = -1, y = -1) {
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
    this.setStyle();
  }

  setType(type) {
    this.type = type;
    this.canBeDestroyed = true;
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
    this.liveTime = item.liveTime;
    this.setSquareStyle(item);
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
    else if (this.type === '●') {
      this.style = 'piece-black';
      if (!this.canBeDestroyed) {
        this.style = 'piece-black-can-not-be-destroyed';
      }
    }
    else if (this.type === '○') {
      this.style = 'piece-white';
      if (!this.canBeDestroyed) {
        this.style = 'piece-white-can-not-be-destroyed';
      }
    }
    else {
      this.style = 'piece-blank';
    }
  }

  setSquareStyle(item, squareStyle) {
    if (item === null && squareStyle !== '') {
      this.squareStyle = squareStyle;
    }
    if (this.type !== '') {
      this.squareStyle = Square_Current_Piece_Style;
    }
    else if (item !== null && item.isUsed) {
      this.squareStyle = Init_Square_Style;
    }
    if (this.growthTime > 0) {
      if (this.willBe === '●') {
        this.squareStyle = Square_Growth_Black_Style;
      }
      else if (this.willBe === '○')
        this.squareStyle = Square_Growth_White_Style;
    }
    else if (this.liveTime > 0) {
      this.squareStyle = Square_Bomb_Style;
    }

  }

  useItem(item, board) {
    if (item.name === 'shield') {
      this.setCanBeDestroyed(false);
      this.setCanBeInfected(false);
    } else if (item.name === 'timeBomb') {
      this.attachBomb(item, board);
    } else if (item.name === 'xFlower') {
      this.attachSeed(item, board);
    }
    item.do();
  }

  destroy(item) {
    this.setType('');
    if (item !== null) {
      item.isUsed = true;
    }
  }
  infect(item, piece, board) {
    if (this.type !== '' && this.canBeInfected) {
      this.setType(piece.type);
    }
    if (this.growthTime > 0) {
      const r = this.x;
      const c = this.y;
      const arrayToCheck = [[r, c], [r - 1, c - 1], [r + 1, c + 1], [r + 1, c - 1], [r - 1, c + 1]];
      for (const arr of arrayToCheck) {
        const tr = arr[0];
        const tc = arr[1];
        if (tr >= 0 && tr < 19 && tc >= 0 && tc < 19) {
          if (board[tr][tc].growthTime > 0) {
            board[tr][tc].setGrowthTime(null, this.type, -1);
          }
        }
      }
    }
    item.isUsed = true;
  }

  attachBomb(item, board) {
    const r = this.x;
    const c = this.y;
    const arrayToCheck = [[r, c], [r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
    for (const arr of arrayToCheck) {
      const tr = arr[0];
      const tc = arr[1];
      if (tr >= 0 && tr < 19 && tc >= 0 && tc < 19) {
        if (board[tr][tc].liveTime < 0) {
          board[tr][tc].setLiveTime(item);
        } else if (board[tr][tc].liveTime < item.liveTime) {
          board[tr][tc].setLiveTime(item);
        }
      }
    }
    item.isUsed = true;
    this.setStyle();
  }

  bomb(item) {
    this.destroy(item);
  }

  attachSeed(item, board) {
    const r = this.x;
    const c = this.y;
    const arrayToCheck = [[r, c], [r - 1, c - 1], [r + 1, c + 1], [r + 1, c - 1], [r - 1, c + 1]];
    for (const arr of arrayToCheck) {
      const tr = arr[0];
      const tc = arr[1];
      if (tr >= 0 && tr < 19 && tc >= 0 && tc < 19) {
        if (board[tr][tc].growthTime < 0) {
          board[tr][tc].setGrowthTime(item, this.type);
        } else if (board[tr][tc].growthTime < item.growthTime) {
          board[tr][tc].setGrowthTime(item, this.type);
        }
      }
    }
    item.isUsed = true;
    this.setStyle();
  }

  grow(item) {
    if (this.growthTime > 0) {
      this.setSquareStyle(item, '');
    }
    else if (this.growthTime === 0) {
      if (this.type === '') {
        this.setType(this.willBe);
        checkArray.push([this.x, this.y]);
      }
    }
  }

  beforeUse(item) {
    if (this.type !== '') {
      item.beforeUse();
    }
  }

  displayInfo() {
    console.log(`Type: ${this.type}, Can be Destroyed: ${this.canBeDestroyed}`);
  }
}

function Square({ piece, onSquareClick, squareStyle }) {
  return (
    <button className={piece.squareStyle} onClick={onSquareClick}>
      <span className={piece.style}></span>
    </button>
  );

}

function deepCloneBoard(board) {
  return board.map(row => row.map(piece => (piece instanceof Piece ? deepClonePiece(piece) : piece)));
}

function deepClonePiece(piece) {
  const clonedPiece = new Piece(piece.type, piece.willBe, piece.canBeDestroyed, piece.canBeInfected, piece.liveTime, piece.growthTime, piece.x, piece.y);
  return clonedPiece;
}

function Board({ xIsNext, board, setBoard, currentMove, onPlay, gameOver, setGameOver, selectedItem, selectedItemHistory, gameStart, setGameStart, openModal }) {
  const [lastClick, setLastClick] = useState([null, null]);
  const [squareStyle, setSquareStyle] = useState(Init_Square_Style);
  const renderCell = (cellValue, rowIndex, colIndex) => {
    return (
      <Square piece={cellValue} onSquareClick={() => handleClick(rowIndex, colIndex)} squareStyle={squareStyle} />
    );
  };

  function handleClick(i, j) {
    // 预处理
    if (gameStart) {
      setGameStart(false);
    }

    if (gameOver) {
      openModal("游戏已结束！");
      return;
    }
    if (board[i][j].type !== '') {
      if (!selectedItem.before) {
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
        openModal('不能在此放置炸弹！');
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
        openModal(winnerInfo[0] + '胜利！');
        setGameOver(true);
        for (const arr of winnerInfo[1]) {
          const x = arr[0];
          const y = arr[1];
          nextBoard[x][y].setWinnerPiece();
        }
      }
    }
    checkArray = [];
  }
  let nextPiece = xIsNext ? '●' : '○';
  let currentItem = selectedItemHistory[currentMove];
  let nextPieceStatus = '下一回合行动棋子: ' + (nextPiece);
  let isUsedStatus = currentItem.isUsed ? '已使用' : '未使用';
  let currentItemStatus = '当前道具: ' + (currentItem.cname) + '(' + (isUsedStatus) + ')';
  let nextItemStatus = '下一个道具: ' + (selectedItem.cname);
  return (
    <>
      <div className="status">{nextPieceStatus}</div>
      <div className="status" title={selectedItem.info}>{nextItemStatus}</div>
      <div className="status" title={currentItem.info}>{currentItemStatus}</div>
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
  for (let i = 0; i < 19; i++) {
    const row = [];
    for (let j = 0; j < 19; j++) {
      const piece = new Piece('', '', true, true, -1, -1, i, j);
      row.push(piece);
    }
    board.push(row);
  }
  setGameStart(true);
  return board;
}

/**
 * 是否存在可被选中的棋子
 */
function haveValidPiece(item, lastClick, i, j, board) {
  let result = false;
  if (item.name === 'sword') {
    const arrayToCheck = [[i, j + 1], [i, j - 1], [i + 1, j], [i - 1, j]];
    for (const arr of arrayToCheck) {
      let x = arr[0];
      let y = arr[1];
      if (x >= 0 && x < 19 && y >= 0 && y < 19 && board[x][y].type !== board[i][j].type && board[x][y].type !== '') {
        result = true;
        break;
      }
    }
  }
  else if (item.name === 'bow') {
    const arrayToCheck = [[i, j + 1], [i, j - 1], [i + 1, j], [i - 1, j], [i - 1, j - 1], [i - 1, j + 1], [i + 1, j - 1], [i + 1, j + 1]];
    for (const arr of arrayToCheck) {
      let x = arr[0];
      let y = arr[1];
      if (x >= 0 && x < 19 && y >= 0 && y < 19 && board[x][y].type !== board[i][j].type && board[x][y].type !== '' && board[x][y].canBeDestroyed) {
        result = true;
        break;
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
      if (x >= 0 && x < 19 && y >= 0 && y < 19 && board[x][y].type !== board[i][j].type && board[x][y].type !== '' && board[x][y].canBeInfected) {
        result = true;
        break;
      }
    }
  }
  else if (item.name === 'timeBomb') {
    result = true;
  }
  else if (item.name === 'xFlower') {
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
      openModal('太远了，打不到！');
    }
    else if (board[i][j].type === '') {
      openModal('糟糕，没有击中目标！');
    }
    else if (board[i][j].type === board[r][c].type) {
      isObjectValid = false;
      openModal('不能攻击同类棋子');
    }
    else if (!board[i][j].canBeDestroyed) {
      openModal('给予敌方装甲致命一击！');
    }
    else {
      openModal('轻轻一击~');
    }
  }
  else if (item.name === 'bow') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c], [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
    isRangeValid = arrayToCheck.some(([a, b]) => (a === i && b === j));
    if (!isRangeValid) {
      openModal('太远了，打不到！');
    }
    else if (board[i][j].type === '') {
      openModal('糟糕，箭射偏了！');
    }
    else if (board[i][j].type === board[r][c].type) {
      isObjectValid = false;
      openModal('不能打同类！');
    }
    else if (!board[i][j].canBeDestroyed) {
      isHitValid = false;
      openModal('未能击穿敌方装甲！');
    }
    else {
      openModal('轻轻一击~');
    }
  }
  else if (item.name === 'shield') {
    return true;
  } else if (item.name === 'infectPotion') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
    isRangeValid = arrayToCheck.some(([a, b]) => (a === i && b === j));
    if (!isRangeValid) {
      openModal('太远了，无法侵蚀！');
    }
    else if (board[i][j].type === '') {
      openModal('糟糕，没有侵蚀目标！');
    }
    else if (board[i][j].type === board[r][c].type) {
      isObjectValid = false;
      openModal('不能侵蚀同类棋子');
    }
    else if (!board[i][j].canBeDestroyed) {
      isHitValid = false;
      openModal('目标具有护盾，不能被侵蚀！');
    }
    else {
      openModal('侵蚀成功！');
    }
  }
  else if (item.name === 'timeBomb') {
    isRangeValid = true;
    isHitValid = true;
    if (board[i][j].type !== '') {
      isObjectValid = false;
      openModal('此处已有棋子，不能在此放置炸弹！');
    }
    else {
      openModal('炸弹放置成功！');
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
      board[i][j].destroy(item);
      break;
    }
    case 'infectPotion': {
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
}

function Game() {
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
  const [selectedItem, setSelectedItem] = useState(items[Math.floor(Math.random() * items.length)]);
  const [selectedItemHistory, setSelectedItemHistory] = useState([selectedItem]);
  const [xIsNext, setIsNext] = useState(true);

  function pickRandomItem() {
    if (selectedItem.isUsed) {
      items = items.filter(item => item !== selectedItem);
      const randomIndex = Math.floor(Math.random() * items.length);
      const randomItem = items[randomIndex];
      setSelectedItem(randomItem);
    }
    const nextItemHistory = [...selectedItemHistory.slice(0, currentMove + 1), selectedItem];
    setSelectedItemHistory(nextItemHistory);
  };

  function handlePlay(lastClick, setLastClick, nextBoard, i, j) {
    if (!selectedItem.isUsed && selectedItem.before) {
      // 判断二次选中棋子合法性
      let isValid = validateLoc(selectedItem, lastClick, i, j, currentBoard, openModal, closeModal);
      if (isValid === true) {
        // 执行操作
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
    }
    if (_.isEqual(lastClick, [i, j])) {
      if (nextBoard[i][j] !== '') {
        // return;
      }
    }
    if (selectedItem.name === 'shield') {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
    }
    else if (selectedItem.name === 'timeBomb') {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
    }
    else if (selectedItem.name === 'xFlower') {
      nextBoard[i][j].useItem(selectedItem, nextBoard);
      setIsNext(!xIsNext);
    }
    else {
      if (!selectedItem.before) {
        nextBoard[i][j].beforeUse(selectedItem);
      }
    }

    // 后处理事件
    let haveValid = haveValidPiece(selectedItem, lastClick, i, j, nextBoard);
    let bombed = false;
    nextBoard.forEach((row) => { row.forEach((cell) => { cell.liveTime -= 1; if (cell.liveTime === 0) { bombed = true; cell.bomb(null); } }) })
    let grew = false;
    nextBoard.forEach((row) => { row.forEach((cell) => { cell.growthTime -= 1; if (cell.growthTime >= 0) { grew = true; cell.grow(null); } }) })
    if (bombed || !haveValid) {
      setIsNext(!xIsNext);
      selectedItem.before = false;
      selectedItem.isUsed = true;
      if (!haveValid) {
        openModal('没有有效目标，已为您自动跳过！');
      }
    }
    pickRandomItem();
    nextBoard[i][j].setSquareStyle(selectedItem);
    const nextHistory = [...history.slice(0, currentMove + 1), nextBoard];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setLastClick([i, j]);
  }

  function jumpTo(nextMove) {
    if (nextMove < 0 || nextMove > history.length - 1) {
      return;
    }
    setCurrentMove(nextMove);
    setSelectedItem(selectedItemHistory[nextMove]);
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
    let description = "悔棋"
    return (
      <button onClick={() => jumpTo(currentMove - 1)}>{description}</button>
    )
  }

  const RedoButton = () => {
    let description = "还原"
    return (
      <button onClick={() => jumpTo(currentMove + 1)}>{description}</button>
    )
  }

  const RestartButton = () => {
    let description = "重新开始"
    function onButtonClick() {
      const initBoardHistory = [...history.slice(0, 1)];
      setHistory(initBoardHistory);
      setCurrentMove(0);
      const initItemHistory = [...selectedItemHistory.slice(0, 1)];
      setSelectedItemHistory(initItemHistory);
      setSelectedItem(items[Math.floor(Math.random() * items.length)]);
      setGameOver(false);
    }
    return (
      <button onClick={onButtonClick}>{description}</button>
    )
  }

  const openModal = (info) => {
    setModalOpen(true);
    setModalInfo(info);
    // 在打开弹窗后的3000毫秒（3秒）后，调用closeModal函数
    timeoutIdRef.current = setTimeout(() => {
      closeModal();
    }, 500);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  // 使用 useEffect 来清除定时器，确保在组件卸载时不会触发关闭
  useEffect(() => {
    return () => {
      clearTimeout(timeoutIdRef.current);
    };
  }, []);

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} board={currentBoard} setBoard={setBoard}
          currentMove={currentMove} onPlay={handlePlay} gameOver={gameOver}
          setGameOver={setGameOver} selectedItem={selectedItem} selectedItemHistory={selectedItemHistory}
          gameStart={gameStart} setGameStart={setGameStart} openModal={openModal}
        />
      </div>
      <div className="game-info">
        <UndoButton />
        <RedoButton />
        <RestartButton />
        <ol>{moves}</ol>
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
    </div>
  );
}

function calculateWinner(board, x, y) {
  if (x < 0 || x >= 19 || y < 0 || y >= 19 || x === undefined || y === undefined) {
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

        if (newX >= 0 && newX < 19 && newY >= 0 && newY < 19 && board[newY][newX].type === currentType) {
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
      let tem = [...coordinates1, ...coordinates2].slice(0, 4);
      tem.push([y, x]);
      rest.push(currentType, tem);
      if (toBeEmpty.length > 5) {
        rest = rest.slice(1);
      }
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
