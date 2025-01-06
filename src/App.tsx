import React, { useState, useEffect, useCallback, useMemo, ReactElement } from 'react';

interface Cell {
  revealed: boolean;
  mine: boolean;
  adjacentMines: number;
  flagged: boolean;
}

const BOARD_SIZE = 10;
const TOTAL_MINES = 15;

const generateBoard = (size: number, mines: number): Cell[][] => {
  const board: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      revealed: false,
      mine: false,
      adjacentMines: 0,
      flagged: false,
    }))
  );

  // Place mines randomly
  let placedMines = 0;
  while (placedMines < mines) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    if (!board[row][col].mine) {
      board[row][col].mine = true;
      placedMines++;
    }
  }

  // Calculate adjacent mines
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col].mine) continue;

      const adjacentCells = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],         [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];

      let adjacentMinesCount = 0;
      adjacentCells.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
          if (board[newRow][newCol].mine) {
            adjacentMinesCount++;
          }
        }
      });

      board[row][col].adjacentMines = adjacentMinesCount;
    }
  }

  return board;
};

const App: React.FC = () => {
  const [board, setBoard] = useState(generateBoard(BOARD_SIZE, TOTAL_MINES));
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flags, setFlags] = useState(TOTAL_MINES);

  const revealCell = useCallback((row: number, col: number) => {
    if (gameOver || gameWon) return;
    if (board[row][col].revealed || board[row][col].flagged) return;

    const newBoard = [...board];
    newBoard[row][col].revealed = true;
    setBoard(newBoard);

    if (newBoard[row][col].mine) {
      setGameOver(true);
      return;
    }

    if (newBoard.every(row => row.every(cell => cell.revealed || cell.mine))) {
      setGameWon(true);
      return;
    }
  }, [board, gameOver, gameWon]);

  const toggleFlag = useCallback((row: number, col: number) => {
    if (gameOver || gameWon) return;
    if (board[row][col].revealed) return;

    const newBoard = [...board];
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);
    setFlags(prevFlags => newBoard[row][col].flagged ? prevFlags - 1 : prevFlags + 1);
  }, [board, gameOver, gameWon]);

  const resetGame = useCallback(() => {
    setBoard(generateBoard(BOARD_SIZE, TOTAL_MINES));
    setGameOver(false);
    setGameWon(false);
    setFlags(TOTAL_MINES);
  }, []);

  const renderCell = useCallback((cell: Cell, row: number, col: number): ReactElement => {
    const cellClass = cell.revealed
      ? 'bg-white text-black border-gray-200'
      : 'bg-gray-300 text-white border-gray-400';

    const cellContent = cell.revealed
      ? cell.mine ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2C5.586 2 2 5.586 2 10s3.586 8 8 8 8-3.586 8-8S14.414 2 10 2zm0 16a8 8 0 100-16 8 8 0 000 16zm-3.293-6.707a1 1 0 011.414 0L10 10.586l1.293-1.293a1 1 0 111.414 1.414L11.414 12l1.293 1.293a1 1 0 01-1.414 1.414L10 13.414l-1.293 1.293a1 1 0 11-1.414-1.414L8.586 12 7.293 10.707a1 1 0 010-1.414L8.586 8.586z" clipRule="evenodd" />
          </svg>
        ) : cell.adjacentMines > 0 ? cell.adjacentMines : null
      : cell.flagged ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a1 1 0 112 0 1 1 0 01-2 0zM17.28 2.12c.43.92.53 2.005.28 3.115L15.44 8.281a1 1 0 01-.376.765L12.06 15.12c-.168.558-.786.954-1.482.965a3.5 3.5 0 01-3.139-1.457L4.68 8.746a1 1 0 01-.376-.765L2.324 5.236c-.247-1.11-.142-2.197.28-3.115A1 1 0 013.695 2h12.609a1 1 0 01.986.836zM10 15a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
        ) : null;

    return (
      <div
        key={`${row}-${col}`}
        className={`w-10 h-10 border flex items-center justify-center cursor-pointer ${cellClass}`}
        onClick={() => revealCell(row, col)}
        onContextMenu={(e) => { e.preventDefault(); toggleFlag(row, col); }}
        aria-label={`Cell at row ${row + 1}, column ${col + 1}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            revealCell(row, col);
          } else if (e.key === 'f' || e.key === 'F') {
            toggleFlag(row, col);
          }
        }}
      >
        {cellContent}
      </div>
    );
  }, [board, revealCell, toggleFlag, gameOver, gameWon]);

  const boardDisplay = useMemo(() => (
    <div className="grid grid-cols-10 gap-1">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
      )}
    </div>
  ), [board, renderCell]);

  return (
    <div className="bg-gray-900 text-white min- flex flex-col items-center justify-center p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 2a1 1 0 112 0 1 1 0 01-2 0zM17.28 2.12c.43.92.53 2.005.28 3.115L15.44 8.281a1 1 0 01-.376.765L12.06 15.12c-.168.558-.786.954-1.482.965a3.5 3.5 0 01-3.139-1.457L4.68 8.746a1 1 0 01-.376-.765L2.324 5.236c-.247-1.11-.142-2.197.28-3.115A1 1 0 013.695 2h12.609a1 1 0 01.986.836zM10 15a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            <span className="text-lg font-semibold">{flags}</span>
          </div>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={resetGame}
          >
            New Game
          </button>
        </div>
        {gameOver && (
          <div className="bg-red-600 text-white p-4 mb-4 rounded-lg text-center">
            <p className="text-lg font-semibold">Game Over! You hit a mine.</p>
          </div>
        )}
        {gameWon && (
          <div className="bg-green-600 text-white p-4 mb-4 rounded-lg text-center">
            <p className="text-lg font-semibold">Congratulations! You won!</p>
          </div>
        )}
        {boardDisplay}
      </div>
    </div>
  );
};

export default App;