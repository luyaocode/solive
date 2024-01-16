import './App.css';
import { useState } from 'react';
import { Sword, Shield, Bow } from './Item.ts'
const _ = require('lodash');

// const root = document.documentElement;
const sword = new Sword();
const shield = new Shield();
const bow = new Bow();
let its = [sword, shield, bow];
let items = [];
for (let i = 0; i < 19; i++) {
  for (let j = 0; j < 19; j++) {
    const item = _.cloneDeep(its[Math.floor(Math.random() * its.length)]);
    items.push(item);
  }
}

class Piece {
  constructor(type = '', canBeDestroyed = true) {
    this.type = type;
    this.canBeDestroyed = canBeDestroyed;
    this.style = 'piece-blank';
    this.setStyle();
  }

  setType(type) {
    this.type = type;
    this.setStyle();
  }

  setCanBeDestroyed(canBeDestroyed) {
    this.canBeDestroyed = canBeDestroyed;
    this.setStyle();
  }

  setStyle() {
    if (this.type === '●') {
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

  useItem(item) {
    if (item.name === 'sword') {
      // this.setType('');
    }
    else if (item.name === 'shield') {
      this.setCanBeDestroyed(false);
    }
    else if (item.name === 'bow' && this.canBeDestroyed) {
      // this.setType('');
    }
    else {
      return;
    }
    item.do();
  }

  destroy(item) {
    this.setType('');
    item.isUsed = true;
  }

  beforeUse(item) {
    item.beforeUse();
  }

  displayInfo() {
    console.log(`Type: ${this.type}, Can be Destroyed: ${this.canBeDestroyed}`);
  }
}

function Square({ piece, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      <span className={piece.style}></span>
    </button>
  );

}

function deepCloneBoard(board) {
  return board.map(row => row.map(piece => (piece instanceof Piece ? deepClonePiece(piece) : piece)));
}

function deepClonePiece(piece) {
  const clonedPiece = new Piece(piece.type, piece.canBeDestroyed);
  return clonedPiece;
}

function Board({ xIsNext, board, setBoard, currentMove, onPlay, gameOver, setGameOver, selectedItem, selectedItemHistory }) {
  const [lastClick, setLastClick] = useState([null, null]);
  const renderCell = (cellValue, rowIndex, colIndex) => {
    return (
      <Square piece={cellValue} onSquareClick={() => handleClick(rowIndex, colIndex)} />
    );
  };

  function handleClick(i, j) {
    if (gameOver) {
      alert("游戏已结束！");
      return;
    }
    // const nextBoard = board.slice();
    // const nextBoard = JSON.parse(JSON.stringify(board));
    const nextBoard = deepCloneBoard(board);
    if (xIsNext) {
      nextBoard[i][j].setType('●');
    } else {
      nextBoard[i][j].setType('○');
    }
    onPlay(lastClick, setLastClick, nextBoard, i, j);
    if (calculateWinner(nextBoard, j, i)) {
      alert(nextBoard[i][j].type + '胜利！');
      setGameOver(true);
      return;
    }
  }
  let nextPiece = xIsNext ? '●' : '○';
  let currentItem = selectedItemHistory[currentMove];
  let nextPieceStatus = '下一个棋子: ' + (nextPiece);
  let isUsedStatus = currentItem.isUsed ? '已使用' : '未使用';
  let currentItemStatus = '当前道具: ' + (currentItem.cname) + '(' + (isUsedStatus) + ')';
  let nextItemStatus = '下一个道具: ' + (selectedItem.cname);
  return (
    <>
      <div className="status" title='测试文本'>{nextPieceStatus}</div>
      <div className="status" title-tip='测试文本'>{nextItemStatus}</div>
      <div className="status">{currentItemStatus}</div>
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
function createBoard() {
  const board = [];
  for (let i = 0; i < 19; i++) {
    const row = [];
    for (let j = 0; j < 19; j++) {
      const piece = new Piece();
      row.push(piece);
    }
    board.push(row);
  }
  return board;
}

/**
 * 是否存在可被选中的棋子
 */
function haveValidPiece(item, lastClick, i, j, board) {
  let r = lastClick[0];
  let c = lastClick[1];
  let result = false;
  if (item.name === 'sword') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
    for (const arr of arrayToCheck) {
      let x = arr[0];
      let y = arr[1];
      if (x >= 0 && x < 19 && y >= 0 && y < 19 && board[x][y].type !== board[i][j] && board[x][y].type !== '') {
        result = true;
        break;
      }
    }
  }
  else if (item.name === 'bow') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c], [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
    for (const arr of arrayToCheck) {
      let x = arr[0];
      let y = arr[1];
      if (x >= 0 && x < 19 && y >= 0 && y < 19 && board[x][y].type !== board[i][j] && board[x][y].type !== '') {
        result = true;
        break;
      }
    }
  }
  else if (item.name === 'shield') {
    result = true;
  }
  return result;
}

function validateLoc(item, lastClick, i, j, board) {
  let isRangeValid = false;
  let isObjectValid = true;
  let isHitValid = true;
  let r = lastClick[0];
  let c = lastClick[1];
  if (_.isEqual(lastClick, [i, j])) {
    return isRangeValid;
  }
  // if (!haveValidPiece(item, lastClick, i, j, board)) {
  //   alert('没有有效目标，为您自动跳过！');
  //   return null;
  // }
  if (item.name === 'sword') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]];
    isRangeValid = arrayToCheck.some(([a, b]) => (a === i && b === j));
    if (!isRangeValid) {
      alert('太远了，打不到！');
    }
    else if (board[i][j].type === '') {
      alert('糟糕，没有击中目标！');
    }
    else if (board[i][j].type === board[r][c].type) {
      isObjectValid = false;
      alert('不能打同类！');
    }
    else if (!board[i][j].canBeDestroyed) {
      alert('给予敌方装甲致命一击！');
    }
    else {
      alert('轻轻一击~');
    }
  }
  else if (item.name === 'bow') {
    const arrayToCheck = [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c], [r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]];
    isRangeValid = arrayToCheck.some(([a, b]) => (a === i && b === j));
    if (!isRangeValid) {
      alert('太远了，打不到！');
    }
    else if (board[i][j].type === '') {
      alert('糟糕，箭射偏了！');
    }
    else if (board[i][j].type === board[r][c].type) {
      isObjectValid = false;
      alert('不能打同类！');
    }
    else if (!board[i][j].canBeDestroyed) {
      isHitValid = false;
      alert('未能击穿敌方装甲！');
    }
    else {
      alert('轻轻一击~');
    }
  }
  else if (item.name === 'shield') {
    return true;
  }
  return isRangeValid && isObjectValid && isHitValid;
}

function Game() {
  const [board, setBoard] = useState(() => createBoard());
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
      let isValid = validateLoc(selectedItem, lastClick, i, j, currentBoard);
      if (isValid === true) {
        nextBoard[i][j].destroy(selectedItem);
        setIsNext(!xIsNext);

      } else if (isValid === null) {
        setIsNext(!xIsNext);
      }
      else {
        return;
      }
    }
    if (_.isEqual(lastClick, [null, null])) {
      nextBoard[i][j].useItem(selectedItem);
      setIsNext(!xIsNext);

    }
    if (_.isEqual(lastClick, [i, j])) {
      if (nextBoard[i][j] !== '') {
        // return;
      }
    }
    if (selectedItem.name === 'shield') {
      nextBoard[i][j].useItem(selectedItem);
      setIsNext(!xIsNext);
    }
    else {
      if (!selectedItem.before) {
        nextBoard[i][j].beforeUse(selectedItem);
      }
    }
    pickRandomItem();
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

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} board={currentBoard} setBoard={setBoard}
          currentMove={currentMove} onPlay={handlePlay} gameOver={gameOver}
          setGameOver={setGameOver} selectedItem={selectedItem} selectedItemHistory={selectedItemHistory} />
      </div>
      <div className="game-info">
        <UndoButton />
        <RedoButton />
        <RestartButton />
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function calculateWinner(board, x, y) {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1], // 水平、垂直、右斜、左斜方向
  ];

  const currentType = board[y][x].type;
  const checkDirection = (dx, dy) => {
    // 计算当前方向上的连珠数
    const count = (dx, dy) => {
      let result = 0;
      let i = 1;

      while (i <= 4) {
        const newX = x + i * dx;
        const newY = y + i * dy;

        if (newX >= 0 && newX < 19 && newY >= 0 && newY < 19 && board[newY][newX].type === currentType) {
          result++;
        } else {
          break;
        }

        i++;
      }

      return result;
    };

    // 检查当前方向上是否有五子连珠
    return (count(dx, dy) + count(-dx, -dy) >= 4) ? currentType : null;
  };

  // 检查所有方向
  for (const [dx, dy] of directions) {
    const winner = checkDirection(dx, dy);
    if (winner !== null) {
      return winner;
    }
  }

  return null;
};

export default Game;
