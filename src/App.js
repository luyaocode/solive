import './App.css';
import { useState } from 'react';

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, board, onPlay }) {

  const renderCell = (cellValue, rowIndex, colIndex) => {
    return (
      <Square value={cellValue} onSquareClick={() => handleClick(rowIndex, colIndex)} />
    );
  };

  function handleClick(i, j) {
    if (calculateWinner(board) || board[i][j]) {
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
  }

  const winner = calculateWinner(board);
  let status;
  if (winner) {
    status = '胜利者: ' + winner;
    alert('胜利者是' + winner);
  } else {
    status = '下一个棋子: ' + (xIsNext ? '●' : '○');
  }

  return (
    <>
      <div className="status">{status}</div>
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

  function handlePlay(nextBoard) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextBoard];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = '回退到：' + move;
    } else {
      description = '重新开始';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} board={currentBoard} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default Game;
