import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';

// A single crossword cell as a 3D cube
const Cell3D = ({
  position,
  letter,
  isCorrect,
  isWrong,
  isSelected,
  isPartOfSelectedWord,
  isRevealed,
  cellNumber,
  isEmpty,
  onClick
}) => {
  // References for animation
  const meshRef = useRef();
  
  // Define colors based on cell state
  let color = isEmpty ? '#222222' : '#ffffff';
  let emissive = '#000000';
  
  if (isSelected) {
    color = '#c7d2fe';
    emissive = '#4f46e5';
  } else if (isPartOfSelectedWord) {
    color = '#e0e7ff';
  } else if (isRevealed) {
    color = '#f0f9ff';
  } else if (isCorrect) {
    color = '#86efac';
    emissive = '#166534';
  } else if (isWrong) {
    color = '#fecaca';
    emissive = '#b91c1c';
  }
  
  // Animation for when cell is selected or has a state change
  const [spring, api] = useSpring(() => ({
    scale: [1, 1, 1],
    position: [position[0], position[1], position[2]],
    rotation: [0, 0, 0],
    config: { mass: 1, tension: 280, friction: 60 }
  }));

  useEffect(() => {
    // Animate when selected
    if (isSelected) {
      api.start({
        scale: [1.1, 1.1, 1.1],
        position: [position[0], position[1], 0.2],
        rotation: [0, Math.PI * 0.05, 0]
      });
    } else {
      api.start({
        scale: [1, 1, 1],
        position: [position[0], position[1], position[2]],
        rotation: [0, 0, 0]
      });
    }
  }, [isSelected, api, position]);

  // Hover animation
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    document.body.style.cursor = hovered && !isEmpty ? 'pointer' : 'auto';
  }, [hovered, isEmpty]);

  if (isEmpty) {
    // Return a smaller, darker cube for empty cells
    return (
      <mesh 
        position={position}
        scale={[0.9, 0.9, 0.2]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#222222"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    );
  }

  return (
    <a.group
      {...spring}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* The cube */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.95, 0.3]} />
        <meshPhysicalMaterial 
          color={color}
          emissive={emissive}
          emissiveIntensity={isSelected ? 0.4 : 0.2}
          metalness={0.2}
          roughness={0.8}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Cell number */}
      {cellNumber && (
        <Text
          position={[-0.35, 0.35, 0.16]}
          fontSize={0.2}
          color="#333333"
          anchorX="left"
          anchorY="top"
        >
          {cellNumber}
        </Text>
      )}

      {/* Letter */}
      {letter && (
        <Text
          position={[0, 0, 0.16]}
          fontSize={0.5}
          color={isRevealed ? '#2563eb' : (isCorrect ? '#166534' : (isWrong ? '#b91c1c' : '#333333'))}
          font="/fonts/Inter-Bold.woff"
          anchorX="center"
          anchorY="middle"
        >
          {letter}
        </Text>
      )}
    </a.group>
  );
};

// Main crossword grid component with camera controls
const CrosswordGrid3D = ({
  crossword,
  inputs,
  selectedCell,
  cellNumbers,
  revealedCells,
  onCellClick,
}) => {
  const cameraRef = useRef();
  const controlsRef = useRef();
  
  // Calculate grid dimensions
  const gridSize = crossword ? crossword.grid.length : 0;
  const halfGrid = gridSize / 2;

  // Reset camera when crossword changes
  useEffect(() => {
    if (cameraRef.current && controlsRef.current && crossword) {
      // Reset camera position
      cameraRef.current.position.set(0, -gridSize * 0.8, gridSize * 1.2);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.reset();
    }
  }, [crossword, gridSize]);

  // Handle cell selection
  const handleCellClick = (r, c) => {
    if (onCellClick) {
      onCellClick(r, c);
    }
  };

  // Determine if a cell is part of the selected word
  const isPartOfSelectedWord = (r, c) => {
    if (!selectedCell || !crossword) return false;
    
    const [selectedRow, selectedCol] = selectedCell.split(',').map(Number);
    
    // Find the selected word
    const selectedWord = crossword.placements.find(p => {
      if (p.dir === 'across' && p.row === selectedRow && 
          selectedCol >= p.col && selectedCol < p.col + p.length) {
        return true;
      }
      if (p.dir === 'down' && p.col === selectedCol && 
          selectedRow >= p.row && selectedRow < p.row + p.length) {
        return true;
      }
      return false;
    });
    
    if (!selectedWord) return false;
    
    if (selectedWord.dir === 'across' && r === selectedWord.row && 
        c >= selectedWord.col && c < selectedWord.col + selectedWord.length) {
      return true;
    }
    if (selectedWord.dir === 'down' && c === selectedWord.col && 
        r >= selectedWord.row && r < selectedWord.row + selectedWord.length) {
      return true;
    }
    
    return false;
  };

  return (
    <Canvas shadows dpr={[1, 2]} style={{ height: "60vh" }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Camera and Controls */}
      <PerspectiveCamera 
        ref={cameraRef} 
        makeDefault 
        position={[0, -gridSize * 0.8, gridSize * 1.2]} 
        fov={50}
      />
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={gridSize * 3}
        target={[0, 0, 0]}
      />

      {/* Scene background */}
      <color attach="background" args={['#f8f9fa']} />

      {/* Grid */}
      <group position={[-halfGrid + 0.5, halfGrid - 0.5, 0]}>
        {crossword && crossword.grid.map((row, r) => (
          row.map((cell, c) => {
            const position = [c, -r, 0];
            const key = `${r},${c}`;
            const isSelected = selectedCell === key;
            const userValue = inputs[key];
            let isCorrect = undefined;
            
            if (userValue) {
              isCorrect = userValue === cell;
            }

            return (
              <Cell3D
                key={key}
                position={position}
                letter={userValue}
                isEmpty={!cell}
                isCorrect={isCorrect === true}
                isWrong={isCorrect === false}
                isSelected={isSelected}
                isPartOfSelectedWord={isPartOfSelectedWord(r, c)}
                isRevealed={revealedCells[key]}
                cellNumber={cellNumbers[key]}
                onClick={() => cell && handleCellClick(r, c)}
              />
            );
          })
        ))}
      </group>
    </Canvas>
  );
};

export default CrosswordGrid3D;