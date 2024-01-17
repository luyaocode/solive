import './App.css';
import { useState } from 'react';

const items = ['Sword', 'Shield', 'Potion', 'Staff', 'Helmet'];

function Square({ value, onSquareClick }) {
  if (value === '○') {
    return (
      <button className="square" onClick={onSquareClick}>
        <span className="white-piece"></span>
      </button>
    )
  }
  else if (value === '●') {
    return (
      <button className="square" onClick={onSquareClick}>
        <span className="black-piece"></span>
      </button>
    );
  }
  else {
    return (
      <button className="square" onClick={onSquareClick}>
        {value}
      </button>
    );
  }
}

function Board({ xIsNext, board, onPlay, gameOver, setGameOver, selectedItem }) {

  const renderCell = (cellValue, rowIndex, colIndex) => {
    return (
      <Square value={cellValue} onSquareClick={() => handleClick(rowIndex, colIndex)} />
    );
  };

  function handleClick(i, j) {
    if (board[i][j]) {
      return;
    }
    if (gameOver) {
      alert("游戏已结束！");
      return;
    }
    // const nextBoard = board.slice();
    const nextBoard = JSON.parse(JSON.stringify(board));
    if (xIsNext) {
      nextBoard[i][j] = '●';
    } else {
      nextBoard[i][j] = '○';
    }
    onPlay(nextBoard);
    if (calculateWinner(nextBoard, j, i)) {
      alert(nextBoard[i][j] + '胜利！');
      setGameOver(true);
      return;
    }
  }
  let nextPiece = xIsNext ? '●' : '○';
  let nextPieceStatus = '下一个棋子: ' + (nextPiece);
  let nextItemStatus = '下一个道具: ' + (selectedItem);
  return (
    <>
      <div className="status">{nextPieceStatus}</div>
      <div className="status">{nextItemStatus}</div>
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

function Game() {
  const [history, setHistory] = useState([Array.from({ length: 19 }, () => Array(19).fill(''))]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentBoard = history[currentMove];
  const [gameOver, setGameOver] = useState(false);
  const [selectedItem, setSelectedItem] = useState(items[Math.floor(Math.random() * items.length)]);
  const [selectedItemHistory, setSelectedItemHistory] = useState([selectedItem]);

  function pickRandomItem() {
    const randomIndex = Math.floor(Math.random() * items.length);
    const randomItem = items[randomIndex];
    setSelectedItem(randomItem);
    const nextItemHistory = [...selectedItemHistory.slice(0, currentMove + 1), selectedItem];
    setSelectedItemHistory(nextItemHistory);
  };

  function handlePlay(nextBoard) {
    pickRandomItem();
    const nextHistory = [...history.slice(0, currentMove + 1), nextBoard];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
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
        <Board xIsNext={xIsNext} board={currentBoard} onPlay={handlePlay} gameOver={gameOver} setGameOver={setGameOver}
          selectedItem={selectedItem} />
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

  const player = board[y][x];
  const checkDirection = (dx, dy) => {
    // 计算当前方向上的连珠数
    const count = (dx, dy) => {
      let result = 0;
      let i = 1;

      while (i <= 4) {
        const newX = x + i * dx;
        const newY = y + i * dy;

        if (newX >= 0 && newX < 19 && newY >= 0 && newY < 19 && board[newY][newX] === player) {
          result++;
        } else {
          break;
        }

        i++;
      }

      return result;
    };

    // 检查当前方向上是否有五子连珠
    return (count(dx, dy) + count(-dx, -dy) >= 4) ? player : null;
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
