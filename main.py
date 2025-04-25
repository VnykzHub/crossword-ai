import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import AzureOpenAI, OpenAI
import json
import re

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

# Determine which API type to use (azure or openai)
api_type = os.getenv('OPENAI_API_TYPE', 'azure').lower()

# Initialize the appropriate client based on API type
if api_type == 'azure':
    endpoint = os.getenv('ENDPOINT_URL')
    deployment = os.getenv('DEPLOYMENT_NAME')
    subscription_key = os.getenv('AZURE_OPENAI_API_KEY')
    api_version = os.getenv('AZURE_API_VERSION', '2024-02-15-preview')
    
    client = AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=subscription_key,
        api_version=api_version
    )
    model = deployment
else:
    # Standard OpenAI configuration
    api_key = os.getenv('OPENAI_API_KEY')
    org_id = os.getenv('OPENAI_ORGANIZATION')
    base_url = os.getenv('OPENAI_BASE_URL')
    
    client_kwargs = {'api_key': api_key}
    if org_id:
        client_kwargs['organization'] = org_id
    if base_url:
        client_kwargs['base_url'] = base_url
        
    client = OpenAI(**client_kwargs)
    model =  os.getenv('DEPLOYMENT_NAME',"gpt-4.1")  # Default model for standard OpenAI

def get_crossword(theme=None, size=15, word_count=20):
    # Default is 15x15 which is standard for crosswords
    prompt = (  
    f"Please create a list of {word_count} unique English words, each between 3 and {size-2} letters in length, "  
    f"that will fit well into a classic crossword puzzle measuring {size}x{size}. All chosen words must be tied "  
    f"to the following theme: {theme if theme else 'Random'}, ensuring consistency and variety.\n\n"  
  
    "1) THEME AND WORD REQUIREMENTS:\n"  
    "- Include words of different lengths (some short options ranging from 3–5 letters, as well as longer entries), "  
    "and make certain every word clearly relates to the designated theme.\n"  
    "- Avoid repeating similar words or overly obscure terms. Words should be recognizable, yet not trivial.\n\n"  
  
    "2) CLUE DEVELOPMENT:\n"  
    "- Each word should be accompanied by a single, clever, and challenging clue that does NOT include the target word.\n"  
    "- Clues may incorporate direct definitions, wordplay, indirect hints, or cryptic elements, as long as they remain fair.\n"  
    "- The clue should create an ‘Aha!’ moment for solvers, but remain solvable with logical or inspired thinking.\n\n"  
  
    "3) CROSSWORD CONVENTIONS:\n"  
    "- Maintain standard crossword norms (letters only, no punctuation in the words, consistent style).\n"  
    "- Ensure the words are plausible fill for a symmetrical crossword grid—no dangling or isolated entries.\n"  
    "- If using cryptic clue elements, remember that any manipulation (like anagrams or reversals) should be hinted at.\n\n"  
  
    "4) FINAL OUTPUT FORMAT:\n"  
    "- Please return the responses as a JSON array of objects, using the key/value pairs: \"word\" and \"clue\".\n"  
    "- For example: [{\"word\": \"EXAMPLE\", \"clue\": \"Might illustrate a demonstration?\"}, ...].\n"  
    "- Do not provide any additional commentary outside of the JSON structure.\n\n"  
  
    "Draw on the principles discussed in the provided crossword-construction guidelines: develop a focused, "  
    "theme-consistent set of words, and write clues that make use of creative wordplay or subtle definitions. "  
    "Remember to keep the solver engaged with enough challenge to discover the answers, yet maintain fairness "  
    "by guiding them toward the correct word. Good luck!"  
    )  
    # prompt = (
    #     f"Create a list of {word_count} unique English words (min 3 letters, max {size-2} letters) that are "
    #     f"suitable for a classic crossword of size {size}x{size}."
    #     " For each word, provide a clever and challenging clue that does NOT contain the word itself. "
    #     f"Theme: {theme if theme else 'Random'}."
    #     " Respond as a JSON array: [{\"word\": \"\", \"clue\": \"\"}, ...]"
    #     " Ensure all words are theme-related and vary in length."
    #     " Include both short (3-5 letters) and longer words."
    # )
  
    response = client.chat.completions.create(
        model=model,
        temperature=1.1,
        messages=[{"role": "user", "content": prompt}]
    )
    txt = response.choices[0].message.content
    matches = re.findall(r'\[[\s\S]*\]', txt)
    words = []
    if matches:
        try:
            words = json.loads(matches[0])
        except Exception:
            pass
    
    # More advanced word layout algorithm - based on crossword puzzle principles
    grid = [['' for _ in range(size)] for _ in range(size)]
    placements = []
    
    # Sort words by length (descending) to place longer words first
    words.sort(key=lambda x: len(x["word"]), reverse=True)
    
    # Try to place words at the center of the grid first
    center = size // 2
    
    # Place the first word horizontally through center
    if words:
        first_word = words[0]["word"].upper()
        first_word_start = center - (len(first_word) // 2)
        
        # Place the first word horizontally
        for i, letter in enumerate(first_word):
            grid[center][first_word_start + i] = letter
        
        placements.append({
            "row": center,
            "col": first_word_start,
            "dir": "across",
            "length": len(first_word),
            "word": first_word,
            "clue": words[0]["clue"]
        })
        
        # Place the second word vertically crossing the center
        if len(words) > 1:
            second_word = words[1]["word"].upper()
            placement_successful = False
            
            # Find a good crossing point
            for i, letter in enumerate(first_word):
                # Try to find all occurrences of this letter in the second word
                occurrences = [j for j, ltr in enumerate(second_word) if ltr == letter]
                
                # Try each possible crossing point
                for cross_index in occurrences:
                    col_index = first_word_start + i
                    row_start = center - cross_index
                    
                    # Skip if this would cause the word to go out of bounds
                    if row_start < 0 or row_start + len(second_word) > size:
                        continue
                    
                    # Check if the word fits
                    can_place = True
                    for j, sl in enumerate(second_word):
                        if j != cross_index and grid[row_start + j][col_index]:
                            can_place = False
                            break
                    
                    if can_place:
                        for j, sl in enumerate(second_word):
                            grid[row_start + j][col_index] = sl
                        
                        placements.append({
                            "row": row_start,
                            "col": col_index,
                            "dir": "down",
                            "length": len(second_word),
                            "word": second_word,
                            "clue": words[1]["clue"]
                        })
                        placement_successful = True
                        break
                
                # If we successfully placed the second word, exit the outer loop too
                if placement_successful:
                    break
    
    # For remaining words, try to fit them into the grid by crossing existing words
    remaining_words = words[2:] if len(words) > 2 else []
    across_count = 1  # First word is already across
    down_count = 1    # Second word is already down
    
    # Limit attempts to prevent infinite loops
    max_attempts = 500
    attempts = 0
    
    while remaining_words and (across_count < 10 or down_count < 10) and attempts < max_attempts:
        attempts += 1
        word_obj = remaining_words[0]
        word = word_obj["word"].upper()
        
        # Decide direction based on what we need more of
        direction = "across" if across_count < down_count else "down"
        
        # Try to place the word
        placed = False
        
        # Scan the grid for potential placement spots
        for r in range(size):
            for c in range(size):
                # Skip empty cells or out of bounds
                if r >= size or c >= size:
                    continue
                    
                if direction == "across" and c + len(word) <= size:
                    # Check if we can place across
                    can_place = True
                    has_intersection = False
                    
                    for i, letter in enumerate(word):
                        # Check for conflicts
                        if grid[r][c + i] and grid[r][c + i] != letter:
                            can_place = False
                            break
                        # Check for intersection with existing letter
                        if grid[r][c + i] == letter:
                            has_intersection = True
                    
                    # Check adjacent cells to avoid words running into each other
                    if can_place:
                        # Check left (unless it's the edge of the grid)
                        if c > 0 and grid[r][c - 1]:
                            can_place = False
                        # Check right (unless it's the edge of the grid)
                        if c + len(word) < size and grid[r][c + len(word)]:
                            can_place = False
                        
                        # For each position in the word, check above and below to avoid unintended word creation
                        for i in range(len(word)):
                            # Only check cells where we're not creating an intentional intersection
                            if not grid[r][c + i]:  # This position doesn't already have a letter
                                # Check above (unless it's the edge of the grid)
                                if r > 0 and grid[r-1][c + i]:
                                    can_place = False
                                    break
                                # Check below (unless it's the edge of the grid)
                                if r < size-1 and grid[r+1][c + i]:
                                    can_place = False
                                    break
                    
                    # Only place if we have an intersection or it's a starting word
                    if can_place and (has_intersection or not placements):
                        for i, letter in enumerate(word):
                            grid[r][c + i] = letter
                            
                        placements.append({
                            "row": r,
                            "col": c,
                            "dir": "across",
                            "length": len(word),
                            "word": word,
                            "clue": word_obj["clue"]
                        })
                        
                        placed = True
                        across_count += 1
                        break
                
                elif direction == "down" and r + len(word) <= size:
                    # Check if we can place down
                    can_place = True
                    has_intersection = False
                    
                    for i, letter in enumerate(word):
                        # Check for conflicts
                        if grid[r + i][c] and grid[r + i][c] != letter:
                            can_place = False
                            break
                        # Check for intersection
                        if grid[r + i][c] == letter:
                            has_intersection = True
                    
                    # Check adjacent cells
                    if can_place:
                        # Check above (unless it's the edge of the grid)
                        if r > 0 and grid[r - 1][c]:
                            can_place = False
                        # Check below (unless it's the edge of the grid)
                        if r + len(word) < size and grid[r + len(word)][c]:
                            can_place = False
                        
                        # For each position in the word, check left and right to avoid unintended word creation
                        for i in range(len(word)):
                            # Only check cells where we're not creating an intentional intersection
                            if not grid[r + i][c]:  # This position doesn't already have a letter
                                # Check left (unless it's the edge of the grid)
                                if c > 0 and grid[r + i][c-1]:
                                    can_place = False
                                    break
                                # Check right (unless it's the edge of the grid)
                                if c < size-1 and grid[r + i][c+1]:
                                    can_place = False
                                    break
                    
                    if can_place and (has_intersection or not placements):
                        for i, letter in enumerate(word):
                            grid[r + i][c] = letter
                            
                        placements.append({
                            "row": r,
                            "col": c,
                            "dir": "down",
                            "length": len(word),
                            "word": word,
                            "clue": word_obj["clue"]
                        })
                        
                        placed = True
                        down_count += 1
                        break
            
            if placed:
                break
        
        if placed:
            remaining_words.pop(0)
        else:
            # If we couldn't place this word, move it to the end of the list and try others
            remaining_words.append(remaining_words.pop(0))
    
    # If we don't have enough words, fill in dummy entries to meet the requirement
    # This is just a fallback to ensure 10 across and 10 down words
    if across_count < 10 or down_count < 10:
        # Generate additional words by using subsets of existing ones if needed
        pass  # We'll implement this fallback if the above algorithm doesn't consistently produce enough words
    
    return {"size": size, "grid": grid, "placements": placements}

@app.post("/api/new_crossword")
async def new_crossword(req: Request):
    data = await req.json()
    theme = data.get('theme')
    size = data.get('size', 15)  # Default size is 15x15
    word_count = data.get('wordCount', 20)  # Default word count is 20
    
    # Ensure values are within reasonable limits
    if size < 5:
        size = 5
    elif size > 21:  # Most newspaper puzzles max out at 21x21
        size = 21
        
    if word_count < 10:
        word_count = 10
    elif word_count > 40:  # Reasonable upper limit
        word_count = 40
        
    # Calculate a reasonable max word count based on grid size
    # Using a more generous heuristic for smaller grids
    if size <= 5:
        max_words_for_size = (size * size) // 4  # Allow more words in small grids
    else:
        max_words_for_size = (size * size) // 7  # More generous heuristic overall
    
    if word_count > max_words_for_size:
        word_count = max_words_for_size
    
    crossword = get_crossword(theme, size, word_count)
    return crossword

# Run with:
# uvicorn main:app --host 0.0.0.0 --port 8080 --reload