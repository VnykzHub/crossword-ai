import React, { useEffect, useState } from 'react';
import './App.css';

function Cell({value, userValue, onClick, correct, selected, number, revealed, isPartOfSelectedWord}) {
  // If the cell has no value (empty cell in the crossword), make it black
  const isEmpty = !value;
  let className = "cell";
  if (isEmpty) className += " empty";
  if (selected && !isEmpty) className += " selected";
  if (isPartOfSelectedWord && !isEmpty && !selected) className += " in-selected-word";
  if (revealed) className += " revealed";
  else if (userValue && !isEmpty) {
    className += correct===true ? " correct": correct===false ? " wrong":"";
  }
  
  return (
    <td 
      className={className} 
      onClick={!isEmpty ? onClick : undefined}
      style={isEmpty ? {cursor: 'default'} : {cursor: 'pointer'}}
    >
      {!isEmpty && number && <span className="cell-number">{number}</span>}
      {!isEmpty && (
        <div className="cell-content">
          {userValue || ''}
        </div>
      )}
    </td>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function App() {
  const [theme, setTheme] = useState('');
  const [crossword, setCrossword] = useState(null);
  const [inputs, setInputs] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState('across');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealedCells, setRevealedCells] = useState({});
  const [gameFinished, setGameFinished] = useState(false);
  const [completedWords, setCompletedWords] = useState({});
  const [gridSize, setGridSize] = useState(15);
  const [wordCount, setWordCount] = useState(20);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Calculate numbers for cells
  const getCellNumbers = () => {
    if (!crossword) return {};
    
    const numbers = {};
    let counter = 1;
    
    crossword.placements.forEach(placement => {
      const key = `${placement.row},${placement.col}`;
      if (!numbers[key]) {
        numbers[key] = counter++;
      }
    });
    
    return numbers;
  };
  
  // Only run this effect when the crossword changes, not when intervalId changes
  useEffect(() => {
    if(crossword) {
      // Clear all game state
      setInputs({});
      setScore(0);
      setTimer(0);
      setRevealedCells({});
      setCompletedWords({});
      setSelectedDirection('across');
      setGameFinished(false);
      setLoading(false); // Ensure loading is set to false
      
      // Clear any existing timer
      if(intervalId) {
        clearInterval(intervalId);
      }
      
      // Start a new timer
      const id = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
      
      // Save the timer ID
      setIntervalId(id);
      
      // Cleanup function to clear the timer when component unmounts or when crossword changes
      return () => {
        clearInterval(id);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crossword]);
  
  // Function to get all cells for a word
  const getWordCells = (placement) => {
    if (!placement) return [];
    
    const cells = [];
    if (placement.dir === 'across') {
      for (let i = 0; i < placement.length; i++) {
        cells.push(`${placement.row},${placement.col + i}`);
      }
    } else { // down
      for (let i = 0; i < placement.length; i++) {
        cells.push(`${placement.row + i},${placement.col}`);
      }
    }
    return cells;
  };
  
  // Find the current selected word based on selected cell and direction
  const getSelectedWord = () => {
    if (!selectedCell || !crossword) return null;
    
    const [r, c] = selectedCell.split(',').map(Number);
    
    // Find words that include the selected cell
    const words = crossword.placements.filter(p => 
      (p.dir === selectedDirection && p.row === r && c >= p.col && c < p.col + p.length) ||
      (p.dir !== selectedDirection && p.col === c && r >= p.row && r < p.row + p.length)
    );
    
    // Prefer words in the selected direction
    const directionalWords = words.filter(p => p.dir === selectedDirection);
    if (directionalWords.length > 0) {
      return directionalWords[0];
    }
    
    // Fall back to any word containing this cell
    return words.length > 0 ? words[0] : null;
  };
  
  // Check if a word is completely filled and correct
  const checkWordCompletion = (updatedInputs) => {
    if (!crossword) return;
    
    // First calculate the new state
    const newCompletedWords = { ...completedWords };
    let stateChanged = false;
    
    crossword.placements.forEach(placement => {
      const cells = getWordCells(placement);
      let isComplete = true;
      
      // Check if all cells are filled correctly
      for (const cell of cells) {
        const [r, c] = cell.split(',').map(Number);
        if (!updatedInputs[cell] || updatedInputs[cell] !== crossword.grid[r][c]) {
          isComplete = false;
          break;
        }
      }
      
      // Update completed words only if there's an actual change
      const wordKey = `${placement.row},${placement.col},${placement.dir}`;
      if (newCompletedWords[wordKey] !== isComplete) {
        newCompletedWords[wordKey] = isComplete;
        stateChanged = true;
      }
    });
    
    // Only update state if something changed to avoid unnecessary renders
    if (stateChanged) {
      setCompletedWords(newCompletedWords);
      
      // Check if all words are complete - if so, finish the game
      const allComplete = Object.values(newCompletedWords).every(complete => complete === true);
      if (allComplete && !gameFinished) {
        setGameFinished(true);
        // Stop the timer when the game is finished
        if (intervalId) {
          clearInterval(intervalId);
          setIntervalId(null);
        }
      }
    }
  };
  
  // Function to reveal a single word
  const revealSelectedWord = () => {
    if (!selectedCell || !crossword) return;
    
    const [r, c] = selectedCell.split(',').map(Number);
    // Find the words that include the selected cell
    const wordsToReveal = crossword.placements.filter(p => 
      (p.dir === 'across' && p.row === r && c >= p.col && c < p.col + p.length) ||
      (p.dir === 'down' && p.col === c && r >= p.row && r < p.row + p.length)
    );
    
    // Choose one word to reveal (prefer the selected direction if available)
    const preferredDirectionWords = wordsToReveal.filter(p => p.dir === selectedDirection);
    const word = preferredDirectionWords.length > 0 ? preferredDirectionWords[0] : wordsToReveal[0];
    
    if (word) {
      const newRevealed = { ...revealedCells };
      const newInputs = { ...inputs };
      const cellsToReveal = [];
      
      // Reveal each letter in the word
      if (word.dir === 'across') {
        for (let i = 0; i < word.length; i++) {
          const key = `${word.row},${word.col + i}`;
          // Count only cells that aren't already revealed or correct
          if (!newRevealed[key] && (!newInputs[key] || newInputs[key] !== word.word[i])) {
            cellsToReveal.push(key);
          }
          newRevealed[key] = true;
          newInputs[key] = word.word[i];
        }
      } else { // down
        for (let i = 0; i < word.length; i++) {
          const key = `${word.row + i},${word.col}`;
          // Count only cells that aren't already revealed or correct
          if (!newRevealed[key] && (!newInputs[key] || newInputs[key] !== word.word[i])) {
            cellsToReveal.push(key);
          }
          newRevealed[key] = true;
          newInputs[key] = word.word[i];
        }
      }
      
      setRevealedCells(newRevealed);
      setInputs(newInputs);
      
      // Apply a score penalty - 2 points per cell revealed
      const penaltyPoints = cellsToReveal.length * 2;
      setScore(score => Math.max(0, score - penaltyPoints));
      
      // Check for word completion after revealing
      checkWordCompletion(newInputs);
    }
  };
  
  // Function to reveal all words
  const revealAll = () => {
    if (!crossword) return;
    
    const newRevealed = {};
    const newInputs = {};
    const cellsToReveal = [];
    
    // Reveal all cells with letters
    for (let r = 0; r < crossword.grid.length; r++) {
      for (let c = 0; c < crossword.grid[r].length; c++) {
        if (crossword.grid[r][c]) {
          const key = `${r},${c}`;
          // Count only cells that aren't already revealed or correct
          if (!revealedCells[key] && (!inputs[key] || inputs[key] !== crossword.grid[r][c])) {
            cellsToReveal.push(key);
          }
          newRevealed[key] = true;
          newInputs[key] = crossword.grid[r][c];
        }
      }
    }
    
    setRevealedCells(newRevealed);
    setInputs(newInputs);
    
    // Apply a score penalty - 2 points per cell revealed
    const penaltyPoints = cellsToReveal.length * 2;
    setScore(score => Math.max(0, score - penaltyPoints));
    
    setGameFinished(true);
    setCompletedWords({}); // Mark all words as completed
    
    // Stop the timer
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };
  
  // Define size presets with recommended word counts
  const sizePresets = [
    { size: 5, wordCount: 6, label: "5×5 (Easy)" },
    { size: 9, wordCount: 14, label: "9×9 (Small)" },
    { size: 15, wordCount: 22, label: "15×15 (Standard)" },
    { size: 19, wordCount: 32, label: "19×19 (Large)" },
    { size: 21, wordCount: 38, label: "21×21 (Challenge)" }
  ];
  
  // Function to update size and word count based on preset
  const handlePresetChange = (e) => {
    const selectedSize = parseInt(e.target.value);
    const preset = sizePresets.find(p => p.size === selectedSize);
    if (preset) {
      setGridSize(preset.size);
      setWordCount(preset.wordCount);
    }
  };
  
  function startNewGame() {
    // Use the current hostname instead of hardcoded localhost
    const apiUrl = `${window.location.protocol}//${window.location.hostname}:8080/api/new_crossword`;
    
    // Make local copies of state to prevent issues with async state updates
    const currentTheme = theme;
    const currentSize = gridSize;
    const currentWordCount = wordCount;
    
    setLoading(true);
    
    fetch(apiUrl, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        theme: currentTheme,
        size: currentSize,
        wordCount: currentWordCount
      })
    })
    .then(res=>res.json())
    .then(data => {
      setCrossword(data);
      setCompletedWords({});
      setLoading(false);
    })
    .catch(error => {
      console.error("Error fetching crossword:", error);
      alert("Failed to generate crossword. Please try again.");
      setLoading(false);
    });
  }
  
  function onCellClick(r, c) {
    const cellKey = `${r},${c}`;
    
    // Get words in both directions at this cell
    const acrossWord = crossword?.placements.find(p => 
      p.dir === 'across' && p.row === r && c >= p.col && c < p.col + p.length
    );
    
    const downWord = crossword?.placements.find(p => 
      p.dir === 'down' && p.col === c && r >= p.row && r < p.row + p.length
    );
    
    // If the cell is already selected, toggle the direction (if both directions available)
    if (selectedCell === cellKey) {
      // Toggle direction only if both directions have words
      if (acrossWord && downWord) {
        setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
      }
    } else {
      // Set the selected cell
      setSelectedCell(cellKey);
      
      // Smart direction selection:
      // 1. If only one direction has a word, use that
      // 2. If both have words, prefer the current direction if possible
      // 3. Default to 'across' if both available and no current preference
      
      if (acrossWord && !downWord) {
        setSelectedDirection('across');
      } else if (!acrossWord && downWord) {
        setSelectedDirection('down');
      } else if (acrossWord && downWord) {
        // Both directions available - keep current direction if that word contains this cell
        const currentDirWord = selectedDirection === 'across' ? acrossWord : downWord;
        if (currentDirWord) {
          // Keep current direction
        } else {
          // Default to across
          setSelectedDirection('across');
        }
      }
    }
    
    // Ensure we're not in input focused mode and focus the app container
    setIsInputFocused(false);
    if (appRef.current) {
      // Short timeout to ensure DOM updates
      setTimeout(() => appRef.current.focus(), 10);
    }
  }
  
  // Move to the next cell in the current word
  const moveToNextCell = () => {
    if (!selectedCell || !crossword) return;
    
    const [r, c] = selectedCell.split(',').map(Number);
    
    // First try to get a word in the current direction
    let currentDirectionWord = null;
    
    if (selectedDirection === 'across') {
      currentDirectionWord = crossword.placements.find(p => 
        p.dir === 'across' && p.row === r && c >= p.col && c < p.col + p.length
      );
      
      if (currentDirectionWord) {
        const offset = c - currentDirectionWord.col;
        
        // If not at the end of the word, move right
        if (offset < currentDirectionWord.length - 1) {
          setSelectedCell(`${r},${c + 1}`);
          return;
        }
      }
    } else { // down
      currentDirectionWord = crossword.placements.find(p => 
        p.dir === 'down' && p.col === c && r >= p.row && r < p.row + p.length
      );
      
      if (currentDirectionWord) {
        const offset = r - currentDirectionWord.row;
        
        // If not at the end of the word, move down
        if (offset < currentDirectionWord.length - 1) {
          setSelectedCell(`${r + 1},${c}`);
          return;
        }
      }
    }
    
    // If we couldn't move in the current direction or we're at the end of the word,
    // see if we're at an intersection point
    const intersectingWord = crossword.placements.find(p => 
      // Find a word in the other direction
      p.dir !== selectedDirection &&
      // That contains the current cell
      ((p.dir === 'across' && p.row === r && c >= p.col && c < p.col + p.length) ||
       (p.dir === 'down' && p.col === c && r >= p.row && r < p.row + p.length))
    );
    
    if (intersectingWord) {
      // Toggle the direction and keep the same cell selected
      setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
    }
  };
  
  // Handle keyboard input
  function handleKeyDown(e){
    // Don't process if there's no crossword loaded or game is finished
    if(!crossword || gameFinished) return;
    
    // Skip keyboard handling when focus is on input form elements
    // but allow it for the crossword grid which uses the app's main focus
    if (e.target !== appRef.current && (
        isInputFocused || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'SELECT' || 
        e.target.tagName === 'TEXTAREA')) {
      return;
    }
    
    // Handle letter input
    if(selectedCell && /^[a-zA-Z]$/.test(e.key)) {
      // Prevent default behavior for letter keys
      e.preventDefault();
      
      const [r,c]=selectedCell.split(',').map(Number);
      
      // Don't allow changing revealed cells
      if(revealedCells[selectedCell]) return;
      
      // Make sure we're within valid grid bounds
      if (r < 0 || r >= crossword.grid.length || c < 0 || c >= crossword.grid[0].length) return;
      
      // Make sure the cell has a letter in the solution
      if (!crossword.grid[r][c]) return;
      
      // Update inputs state safely without triggering a reset
      const newInputs = {...inputs};
      newInputs[selectedCell] = e.key.toUpperCase();
      setInputs(newInputs);
      
      // Check correctness
      if(e.key.toUpperCase() === crossword.grid[r][c]){
        setScore(prevScore => prevScore + 1);
      } else {
        setScore(prevScore => Math.max(0, prevScore - 1));
      }
      
      // Check if any words are completed
      checkWordCompletion(newInputs);
      
      // Move to the next cell in the word
      moveToNextCell();
    }
    // Handle tab key for toggling direction
    else if (e.key === "Tab" && selectedCell) {
      e.preventDefault();
      setSelectedDirection(selectedDirection === 'across' ? 'down' : 'across');
    }
    // Handle arrow keys for navigation
    else if(selectedCell && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const [r,c]=selectedCell.split(',').map(Number);
      let newRow = r;
      let newCol = c;
      
      if(e.key === "ArrowUp") newRow = Math.max(0, r-1);
      else if(e.key === "ArrowDown") newRow = Math.min(crossword.grid.length-1, r+1);
      else if(e.key === "ArrowLeft") newCol = Math.max(0, c-1);
      else if(e.key === "ArrowRight") newCol = Math.min(crossword.grid[0].length-1, c+1);
      
      // Only allow moving to cells with letters
      if(crossword.grid[newRow][newCol]) {
        setSelectedCell(`${newRow},${newCol}`);
      }
    }
  }
  
  // Use a stable reference to the handler function to avoid re-adding listeners
  const keyDownHandlerRef = React.useRef(handleKeyDown);
  
  // Update the reference when necessary dependencies change
  useEffect(() => {
    keyDownHandlerRef.current = handleKeyDown;
  }, [crossword, gameFinished, selectedCell, selectedDirection, revealedCells, inputs, isInputFocused]);
  
  // Only add/remove the event listener once
  useEffect(() => {
    const handler = (e) => keyDownHandlerRef.current(e);
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  
  function getClueForCell(r,c) {
    if(!crossword) return '';
    
    // Find all clues for this cell
    const clues = [];
    for(let p of crossword.placements) {
      if(
        (p.dir==='across' && p.row===r && c>=p.col && c<p.col+p.length) ||
        (p.dir==='down' && p.col===c && r>=p.row && r<p.row+p.length)
      ) {
        const cellNumber = cellNumbers[`${p.dir === 'across' ? p.row : p.row},${p.dir === 'across' ? p.col : p.col}`];
        clues.push(`${cellNumber}${p.dir === 'across' ? 'A' : 'D'}: ${p.clue}`);
      }
    }
    
    return clues.join(' | ');
  }
  
  // Organize clues by direction
  const getOrganizedClues = () => {
    if (!crossword) return { across: [], down: [] };
    
    const across = crossword.placements
      .filter(p => p.dir === 'across')
      .sort((a, b) => getCellNumbers()[`${a.row},${a.col}`] - getCellNumbers()[`${b.row},${b.col}`]);
      
    const down = crossword.placements
      .filter(p => p.dir === 'down')
      .sort((a, b) => getCellNumbers()[`${a.row},${a.col}`] - getCellNumbers()[`${b.row},${b.col}`]);
    
    return { across, down };
  };
  
  const cellNumbers = getCellNumbers();
  const { across, down } = getOrganizedClues();
  
  // Create a ref for the app container to maintain focus
  const appRef = React.useRef(null);
  
  // Reference to track if the initial setup has been done
  const initialSetupDone = React.useRef(false);
  
  // Ensure the app container is focused when a cell is clicked
  // but only if we're not currently interacting with form inputs
  useEffect(() => {
    if (selectedCell && appRef.current && !isInputFocused) {
      appRef.current.focus();
    }
  }, [selectedCell, isInputFocused]);
  
  // Function to calculate total possible score (one point per letter in the grid)
  const calculateMaxScore = () => {
    if (!crossword) return 0;
    
    let letterCount = 0;
    for (let r = 0; r < crossword.grid.length; r++) {
      for (let c = 0; c < crossword.grid[r].length; c++) {
        if (crossword.grid[r][c]) {
          letterCount++;
        }
      }
    }
    return letterCount;
  };
  
  // Separate effect to handle initial setup only once
  useEffect(() => {
    initialSetupDone.current = true;
  }, []);
  
  // Moved to the top with other state variables
  
  return (
    <div 
      className="App" 
      ref={appRef}
      tabIndex={0} // Make div focusable
      // Only refocus if we're not focused on an input element
      onBlur={(e) => {
        // Check if the related target is outside our component or not a form control
        const relatedTarget = e.relatedTarget;
        const isFormElement = relatedTarget && 
          (relatedTarget.tagName === 'INPUT' || 
           relatedTarget.tagName === 'SELECT' || 
           relatedTarget.tagName === 'BUTTON');
        
        if (appRef.current && !isFormElement && !isInputFocused) {
          // Only re-focus if focus is truly lost outside the app
          setTimeout(() => {
            // Double-check we're not in the middle of editing an input
            if (!document.activeElement || 
                (document.activeElement.tagName !== 'INPUT' && 
                 document.activeElement.tagName !== 'SELECT')) {
              appRef.current.focus();
            }
          }, 10);
        }
      }}
    >
      <div className="app-header">
        <h1>AI Powered Crossword</h1>
        <p>Generate unique, AI-created crossword puzzles on demand</p>
      </div>
      
      <div className="controls">
        <div className="settings">
          <input 
            className="theme-input"
            placeholder="Enter Theme (optional)" 
            value={theme}
            onChange={e=>setTheme(e.target.value)}
            disabled={loading}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          
          <select 
            className="size-select"
            value={gridSize}
            onChange={handlePresetChange}
            disabled={loading}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          >
            {sizePresets.map((preset) => (
              <option key={preset.size} value={preset.size}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="new-game-btn" 
          onClick={startNewGame}
          disabled={loading}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        >
          {loading ? 'Generating...' : 'New Game'}
        </button>
      </div>
      
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time</span>
          <span className="stat-value">{formatTime(timer)}</span>
        </div>
      </div>
      
      {!crossword && !loading && (
        <div className="empty-state">
          <h2>Welcome to AI Crossword!</h2>
          <p>Enter an optional theme and click "New Game" to generate a unique crossword puzzle.</p>
        </div>
      )}
      
      {loading && (
        <div className="empty-state">
          <h2>Generating your crossword puzzle...</h2>
          <p>Please wait while our AI creates your customized crossword.</p>
        </div>
      )}
      
      {crossword && (
        <div className="game-container">
          <div className="grid-container">
            <table className="crossword-grid">
              <tbody>
                {crossword.grid.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <Cell 
                        key={c} 
                        value={cell}
                        number={cellNumbers[`${r},${c}`]}
                        userValue={inputs[`${r},${c}`]}
                        correct={inputs[`${r},${c}`] 
                          ? (cell && inputs[`${r},${c}`]===cell ? true : false)
                          : undefined}
                        selected={selectedCell === `${r},${c}`}
                        revealed={revealedCells[`${r},${c}`]}
                        isPartOfSelectedWord={cell && getSelectedWord() && getWordCells(getSelectedWord()).includes(`${r},${c}`)}
                        onClick={() => onCellClick(r, c)} 
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="info-panel">
            <div className="action-buttons">
              <button 
                className="reveal-btn" 
                onClick={() => {
                  revealSelectedWord();
                  // Reset focus state and focus the app
                  setIsInputFocused(false);
                  if (appRef.current) {
                    setTimeout(() => appRef.current.focus(), 10);
                  }
                }} 
                disabled={!selectedCell || gameFinished}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              >
                Reveal Word
              </button>
              <button 
                className="reveal-all-btn" 
                onClick={() => {
                  revealAll();
                  // Reset focus state and focus the app
                  setIsInputFocused(false);
                  if (appRef.current) {
                    setTimeout(() => appRef.current.focus(), 10);
                  }
                }}
                disabled={gameFinished}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              >
                Reveal All
              </button>
            </div>
            
            {selectedCell && (
              <div className="current-clue">
                {getClueForCell(...selectedCell.split(',').map(Number))}
              </div>
            )}
            
            {gameFinished && (
              <div className="finished-banner">
                <h3>Puzzle Complete!</h3>
                <p>Final Score: {score} / {calculateMaxScore()}</p>
                <p>Time: {formatTime(timer)}</p>
              </div>
            )}
            
            <div className="clue-lists">
              <div className="clue-section">
                <h3>Across</h3>
                <ul className="clue-list">
                  {across.map((p, i) => (
                    <li 
                      key={i} 
                      className={`clue-item ${
                        // Active if this is the selected word
                        (getSelectedWord() && 
                         getSelectedWord().row === p.row && 
                         getSelectedWord().col === p.col && 
                         getSelectedWord().dir === p.dir)
                          ? 'active' : ''
                      } ${
                        // Completed class if the word is correct
                        completedWords[`${p.row},${p.col},${p.dir}`] ? 'completed' : ''
                      }`}
                      onClick={() => {
                        setSelectedCell(`${p.row},${p.col}`);
                        setSelectedDirection('across');
                      }}
                      ref={el => {
                        // Auto-scroll to the selected clue
                        if (el && getSelectedWord() && 
                            getSelectedWord().row === p.row && 
                            getSelectedWord().col === p.col && 
                            getSelectedWord().dir === 'across') {
                          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                    >
                      <span className="clue-word">{cellNumbers[`${p.row},${p.col}`]}.</span>
                      <span>{p.clue}</span>
                      {completedWords[`${p.row},${p.col},${p.dir}`] && 
                        <span className="checkmark">✓</span>}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="clue-section">
                <h3>Down</h3>
                <ul className="clue-list">
                  {down.map((p, i) => (
                    <li 
                      key={i} 
                      className={`clue-item ${
                        // Active if this is the selected word
                        (getSelectedWord() && 
                         getSelectedWord().row === p.row && 
                         getSelectedWord().col === p.col && 
                         getSelectedWord().dir === p.dir)
                          ? 'active' : ''
                      } ${
                        // Completed class if the word is correct
                        completedWords[`${p.row},${p.col},${p.dir}`] ? 'completed' : ''
                      }`}
                      onClick={() => {
                        setSelectedCell(`${p.row},${p.col}`);
                        setSelectedDirection('down');
                      }}
                      ref={el => {
                        // Auto-scroll to the selected clue
                        if (el && getSelectedWord() && 
                            getSelectedWord().row === p.row && 
                            getSelectedWord().col === p.col && 
                            getSelectedWord().dir === 'down') {
                          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }}
                    >
                      <span className="clue-word">{cellNumbers[`${p.row},${p.col}`]}.</span>
                      <span>{p.clue}</span>
                      {completedWords[`${p.row},${p.col},${p.dir}`] && 
                        <span className="checkmark">✓</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;