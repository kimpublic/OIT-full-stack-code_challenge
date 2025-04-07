
const guessInput = document.getElementById('guess');
const submitGuessBtn = document.getElementById('submitGuess');
const message = document.getElementById('message');
const triesDisplay = document.getElementById('tries');
const restartBtn = document.getElementById('restartBtn');


let targetWord = ''; // 랜덤 단어 초기상태태
let displayWord = []; // 화면 표시
let guessedLetters = []; // 이미 입력한 글자
let attemptsLeft = 7; // 시도 횟수
let difficultyLevel = 1; // 난이도 레벨 (1: 쉬움, 2: 보통, 3: 어려움)
let targetMeaning = ''; // 단어의 의미
let targetPartOfSpeech = ''; // 단어의 품사
let hintAllowed = true; // 힌트 사용 여부
const maxAttempts = 7; // 최대 시도 횟수



function getRandomLength(difficultyLevel) {
    if (difficultyLevel === 1) return Math.floor(Math.random() * (5 - 4 + 1)) + 4;
    if (difficultyLevel === 2) return Math.floor(Math.random() * (8 - 6 + 1)) + 6;
    if (difficultyLevel === 3) return Math.floor(Math.random() * (10 - 9 + 1)) + 9;
    throw new Error('Invalid difficulty level');
}

async function fetchRandomWord(difficultyLevel) {
    const length = getRandomLength(difficultyLevel);
    const inputForAPI = '?'.repeat(length);
    const fetchedWords100 = await fetch(`https://api.datamuse.com/words?sp=${inputForAPI}&max=100`); // 단어 100개 가져오기기
    const wordsJson = await fetchedWords100.json(); // JSON으로 변환

    if (wordsJson.length > 0) {
        const targetWord = wordsJson[Math.floor(Math.random() * wordsJson.length)].word; // 랜덤 단어 선택
        return targetWord.toLowerCase(); // 소문자로 변환
    } else {
        throw new Error('No word found');
    }
}

async function fetchDefinition(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await response.json();

    const firstMeaning = data[0]?.meanings[0];
    const partOfSpeech = firstMeaning?.partOfSpeech;
    const definition = firstMeaning?.definitions[0]?.definition;

    return { partOfSpeech, definition };
  } catch (error) {
    console.error('Error fetching definition:', error);
    return {
      partOfSpeech: 'N/A',
      definition: 'N/A'
    };
  }
}

function updateWordDisplay() {
    const wordDisplay = document.getElementById('word');
    wordDisplay.textContent = displayWord.join(' ');
}

async function endGame() {
    guessInput.disabled = true; // 입력 비활성화
    submitGuessBtn.disabled = true; // 버튼 비활성화
    restartBtn.style.display = 'block'; // 재시작 버튼 표시
    const { partOfSpeech, definition } = await fetchDefinition(targetWord); // 단어의 의미와 품사 가져오기
    targetPartOfSpeech = partOfSpeech; // 단어의 품사 저장
    targetMeaning = definition; // 단어의 의미 저장
    message.innerHTML += `<br>Part of Speech: ${targetPartOfSpeech} | Definition: ${targetMeaning}`; // 단어의 품사와 의미 표시
}

function checkGameEnd() {
    if (!displayWord.includes('_')) {
      message.textContent = 'You win! 🎉';
      endGame();
    } else if (attemptsLeft === 0) {
      message.textContent = `You lose! The word was "${targetWord}".`;
      endGame();
    }
  }

function handleGuess() {
    const input = guessInput.value.toLowerCase();
    guessInput.value = '';
  
    if (!input.match(/^[a-z]$/)) {
      message.textContent = 'Type a single letter.';
      return;
    }
  
    if (guessedLetters.includes(input)) {
      message.textContent = 'You already guessed that letter.';
      return;
    }
  
    guessedLetters.push(input);
  
    if (targetWord.includes(input)) {
      for (let i = 0; i < targetWord.length; i++) {
        if (targetWord[i] === input) {
          displayWord[i] = input;
        }
      }
      updateWordDisplay();
      message.textContent = 'It is in the word!';
    } else {
      attemptsLeft--;
      triesDisplay.textContent = attemptsLeft;
      message.textContent = `Wrong guess. Try again!`;
    }
  
    checkGameEnd();
}


async function startGame() {
    console.log('startGame() 호출');
    document.getElementById('homeBtn').style.display = 'inline-block'; // 홈 버튼 표시
    hintAllowed = true;
    difficultyLevel = parseInt(document.getElementById('difficulty').value); // 난이도 레벨 가져오기
    targetWord = await fetchRandomWord(difficultyLevel); // 랜덤 단어 가져오기
    const wordLength = targetWord.length; // 단어 길이

    attemptsLeft = maxAttempts; // 시도 횟수 초기화
    displayWord = Array(wordLength).fill('_'); // 화면 표시용 배열 초기화
    guessedLetters = []; // 맞춘 글자 초기화

    updateWordDisplay(); // 화면 표시 업데이트
    triesDisplay.textContent = attemptsLeft; // 시도 횟수 표시
    message.textContent = ''; // 메시지 초기화
    restartBtn.style.display = 'none'; // 재시작 버튼 숨기기

    document.getElementById('welcome').style.display = 'none'; // 환영 메시지 숨기기
    document.getElementById('game').style.display = 'block'; // 게임 화면 표시

    guessInput.value = ''; // 입력창 초기화

    guessInput.disabled = false;
    submitGuessBtn.disabled = false;

    
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('hintBtn').addEventListener('click', async () => {
    if (!hintAllowed) {
      message.textContent = 'Hint already used!';
      return;
    }
    const hint = document.getElementById('hint');
    const splitedLetters = targetWord.split('');
    const unrevealedLetters = [];
    for (let i = 0; i < splitedLetters.length; i++) {
      if (!guessedLetters.includes(splitedLetters[i])) {
        if (!unrevealedLetters.includes(splitedLetters[i])) {
          unrevealedLetters.push(splitedLetters[i]);
        }
      }
    }
    if (unrevealedLetters.length > 0) {
      const randomIndex = Math.floor(Math.random() * unrevealedLetters.length);
      const selectedHint = unrevealedLetters[randomIndex];
      hint.textContent = `Hint: One of the letters is "${selectedHint}".`;
    } else {
      hint.textContent = 'No hints available.';
    }
    hintAllowed = false; // 힌트 사용 여부 업데이트
});
document.getElementById('homeBtn').addEventListener('click', () => {
  location.reload(); // 페이지 전체 새로고침
});
submitGuessBtn.addEventListener('click', handleGuess);
restartBtn.addEventListener('click', startGame);

