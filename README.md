# AI Powered Crossword Puzzles

An interactive web application that generates unique crossword puzzles using AI. Create personalized crossword puzzles with custom themes for endless fun and learning.

![Crossword AI Demo](https://i.imgur.com/EXAMPLE.png)

## Features

- **AI-Generated Content**: Every puzzle is unique, created by Azure OpenAI
- **Themed Puzzles**: Generate crosswords based on any topic of interest
- **Interactive Interface**: Click and type to fill in answers
- **Real-time Feedback**: Instant validation of correct/incorrect answers
- **Score Tracking**: Points awarded for correct answers
- **Timer**: Challenge yourself to complete puzzles quickly
- **Hint System**: Get help when stuck with reveal options
- **Difficulty Options**: Select from various grid sizes

## Table of Contents
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- Azure OpenAI API access

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/crossword-ai.git
   cd crossword-ai
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your OpenAI credentials:
   
   **For Azure OpenAI:**
   ```
   OPENAI_API_TYPE=azure
   AZURE_OPENAI_API_KEY=your_azure_openai_key
   ENDPOINT_URL=https://YOUR-RESOURCE-NAME.openai.azure.com/
   DEPLOYMENT_NAME=your_default_model_deployment_name
   AZURE_API_VERSION=2024-02-15-preview
   ```
   
   **For standard OpenAI:**
   ```
   OPENAI_API_TYPE=openai
   OPENAI_API_KEY=your_openai_api_key
   # Optional settings:
   # OPENAI_ORGANIZATION=your_organization_id
   # OPENAI_BASE_URL=https://api.openai.com/
   ```

4. Start the backend server:
   ```
   uvicorn main:app --host 0.0.0.0 --port 8080 --reload
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd crossword-client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Access the application at `http://localhost:3000`

## Usage

1. **Create a New Puzzle**:
   - Optionally enter a theme (e.g., "Space", "Movies", "Food")
   - Select grid size from dropdown menu
   - Click "New Game" button

2. **Play the Puzzle**:
   - Click on cells to select them
   - Type letters to fill in words
   - Correct letters turn green, incorrect ones turn red
   - Tab key toggles between across/down direction
   - Arrow keys navigate between cells

3. **Get Help**:
   - "Reveal Word" shows the solution for the selected word
   - "Reveal All" completes the entire puzzle

4. **Complete the Puzzle**:
   - All words must be correctly filled
   - Final score and time displayed upon completion

## Tech Stack

- **Frontend**: 
  - React 18
  - Modern JavaScript (ES6+)
  - CSS3

- **Backend**:
  - Python 3.8+
  - FastAPI
  - Azure OpenAI API

## Architecture

The application follows a client-server architecture:

- **Backend**: Python FastAPI service that generates crossword puzzles using Azure OpenAI
- **Frontend**: React SPA that renders the interactive crossword grid and manages game state

For detailed information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.