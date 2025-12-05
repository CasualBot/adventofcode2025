const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Read the input file
const inputPath = path.join(__dirname, 'input');
const input = fs.readFileSync(inputPath, 'utf-8');

// Parse rotations
const rotations = input
  .trim()
  .split('\n')
  .filter(line => line.length > 0);

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function renderDial(position) {
    const width = process.stdout.columns || 80;
    const dialWidth = Math.max(50, width - 4);
    const centerPos = Math.floor(dialWidth / 2);

    const displayRange = dialWidth;
    let scale = '';
    let numbersArray = new Array(displayRange).fill(' ');

    const windowStart = position - Math.floor(centerPos / 2);

    // Build the scale and number display
    for (let i = 0; i < displayRange; i++) {
        const actualPos = ((windowStart + i) % 100 + 100) % 100;

        if (actualPos % 10 === 0) {
            scale += '|';
            const numStr = actualPos.toString().padStart(2, '0');
            numbersArray[i] = numStr[0];
            if (i + 1 < displayRange) {
                numbersArray[i + 1] = numStr[1];
            }
        } else if (actualPos % 5 === 0) {
            scale += '|';
        } else {
            scale += '·';
        }
    }

    const numbers = numbersArray.join('');
    const pointer = ' '.repeat(centerPos) + '▲';

    return { numbers, scale, pointer };
}

// Dial state and counters
let currentPosition = 50;
let previousPosition = 50;
let startAtZeroCount = 0;
let landedOnZeroCount = 0;
let rotationIndex = 0;

// Prompt user for speed preference
rl.question('Would you like to run FAST (f), SLOW (s), or INSTANT (i)? ', async (answer) => {
  let animationDelay;
  if (answer.toLowerCase() === 's') {
    animationDelay = 150;
  } else if (answer.toLowerCase() === 'i') {
    animationDelay = 0;
  } else {
    animationDelay = 50;
  }

  // Initial dial render
  let dialDisplay = renderDial(currentPosition);
  console.log(`${dialDisplay.numbers}`);
  console.log(`${dialDisplay.scale}`);
  console.log(`${dialDisplay.pointer}`);
    console.log('');

    // Process each rotation
    (async () => {
      for (const instruction of rotations) {
        const rotationDirection = instruction[0];
        const rotationDistance = parseInt(instruction.slice(1));

        if (currentPosition === 0) {
          startAtZeroCount++;
        }

        previousPosition = currentPosition;

        // Step through each click in the rotation
        for (let step = 0; step < rotationDistance; step++) {
          if (rotationDirection === 'R') {
            currentPosition = (currentPosition + 1) % 100;
          } else if (rotationDirection === 'L') {
            currentPosition = (currentPosition - 1) % 100;
            if (currentPosition < 0) {
              currentPosition += 100;
            }
          }

          if (currentPosition === 0) {
            landedOnZeroCount++;
          }
        }

        // Display every 10th rotation for feedback
        rotationIndex++;
        if (rotationIndex % 10 === 0 || rotationIndex <= 5) {
          dialDisplay = renderDial(currentPosition);
          // Move cursor up 4 lines and clear from cursor to end of display
          process.stdout.write('\x1B[4A\x1B[0J');
          console.log(`${dialDisplay.numbers}`);
          console.log(`${dialDisplay.scale}`);
          console.log(`${dialDisplay.pointer}`);

          const directionLabel = rotationDirection === 'R' ? 'RIGHT' : 'LEFT';
          const movementText = `${directionLabel} ${rotationDistance.toString().padStart(3)}`;
          const previousPosFormatted = previousPosition.toString().padStart(2, '0');
          const currentPosFormatted = currentPosition.toString().padStart(2, '0');
          const landedIndicator = currentPosition === 0 ? ' ✓ LANDED!' : '';
          console.log(`${movementText} | Last: ${previousPosFormatted} → Next: ${currentPosFormatted}${landedIndicator}`);

          if (animationDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, animationDelay));
          }
        }
      }

      // Show final result
      console.log('\n🔓 PADLOCK UNLOCKED 🔓\n');
      console.log(`PASSWORD 1 (Started at 0): ${startAtZeroCount}`);
      console.log(`PASSWORD 2 (Landed on 0): ${landedOnZeroCount}\n`);

        rl.close();
    })();
});

