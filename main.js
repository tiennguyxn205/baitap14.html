// ===== Game Configuration =====
const DIFFICULTY = {
    easy: { pairs: 4, cards: ['🎮', '🎯', '🎲', '🎪'], baseScore: 1000 },
    medium: { pairs: 6, cards: ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭'], baseScore: 1500 },
    hard: { pairs: 8, cards: ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'], baseScore: 2000 }
};

// ===== Game State =====
const gameState = {
    difficulty: 'easy',
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    gameStarted: false,
    timer: null,
    seconds: 0,
    lockBoard: false,
    hintsRemaining: 3,
    soundEnabled: true,
    score: 0
};

// ===== DOM Elements =====
const gameBoard = document.getElementById('gameBoard');
const movesDisplay = document.getElementById('moves');
const timeDisplay = document.getElementById('time');
const accuracyDisplay = document.getElementById('accuracy');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const hintBtn = document.getElementById('hintBtn');
const soundBtn = document.getElementById('soundBtn');
const hintCountDisplay = document.getElementById('hintCount');
const soundIcon = document.getElementById('soundIcon');
const victoryModal = document.getElementById('victoryModal');
const playAgainBtn = document.getElementById('playAgainBtn');
const shareBtn = document.getElementById('shareBtn');
const diffBtns = document.querySelectorAll('.diff-btn');

// ===== Initialize Game =====
function initGame() {
    resetGameState();
    const config = DIFFICULTY[gameState.difficulty];
    const shuffledCards = shuffleCards([...config.cards, ...config.cards]);
    gameState.cards = shuffledCards;
    renderCards(shuffledCards);
    updateStats();
    initParticles();
}

// ===== Reset Game State =====
function resetGameState() {
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.moves = 0;
    gameState.totalAttempts = 0;
    gameState.correctAttempts = 0;
    gameState.gameStarted = false;
    gameState.seconds = 0;
    gameState.lockBoard = false;
    gameState.hintsRemaining = 3;
    gameState.score = 0;
    
    clearInterval(gameState.timer);
    hideModal();
    updateHintCount();
}

// ===== Shuffle Cards =====
function shuffleCards(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ===== Render Cards =====
function renderCards(cards) {
    gameBoard.innerHTML = '';
    const config = DIFFICULTY[gameState.difficulty];
    
    // Adjust grid columns based on difficulty
    if (config.pairs === 6) {
        gameBoard.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else if (config.pairs === 8) {
        gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
    } else {
        gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
    
    cards.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        gameBoard.appendChild(card);
    });
}

// ===== Create Card Element =====
function createCard(emoji, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-face card-back"></div>
            <div class="card-face card-front">${emoji}</div>
        </div>
    `;
    
    card.addEventListener('click', () => handleCardClick(card));
    
    return card;
}

// ===== Handle Card Click =====
function handleCardClick(card) {
    if (gameState.lockBoard || 
        card.classList.contains('flipped') || 
        card.classList.contains('matched')) {
        return;
    }
    
    if (!gameState.gameStarted) {
        startTimer();
        gameState.gameStarted = true;
    }
    
    flipCard(card);
    gameState.flippedCards.push(card);
    
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        gameState.totalAttempts++;
        updateStats();
        checkMatch();
    }
}

// ===== Flip Card =====
function flipCard(card) {
    card.classList.add('flipped');
    playSound('flip');
}

// ===== Check Match =====
function checkMatch() {
    gameState.lockBoard = true;
    
    const [card1, card2] = gameState.flippedCards;
    const emoji1 = card1.dataset.emoji;
    const emoji2 = card2.dataset.emoji;
    
    if (emoji1 === emoji2) {
        handleMatch(card1, card2);
    } else {
        handleMismatch(card1, card2);
    }
}

// ===== Handle Match =====
function handleMatch(card1, card2) {
    setTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        gameState.matchedPairs++;
        gameState.correctAttempts++;
        
        playSound('match');
        createMatchParticles(card1);
        
        calculateScore();
        resetFlippedCards();
        
        const config = DIFFICULTY[gameState.difficulty];
        if (gameState.matchedPairs === config.pairs) {
            handleVictory();
        }
    }, 600);
}

// ===== Handle Mismatch =====
function handleMismatch(card1, card2) {
    setTimeout(() => {
        card1.classList.add('wrong');
        card2.classList.add('wrong');
        
        playSound('wrong');
        
        setTimeout(() => {
            card1.classList.remove('flipped', 'wrong');
            card2.classList.remove('flipped', 'wrong');
            
            resetFlippedCards();
        }, 500);
    }, 1000);
}

// ===== Reset Flipped Cards =====
function resetFlippedCards() {
    gameState.flippedCards = [];
    gameState.lockBoard = false;
}

// ===== Calculate Score =====
function calculateScore() {
    const config = DIFFICULTY[gameState.difficulty];
    const timeBonus = Math.max(0, 300 - gameState.seconds);
    const accuracyBonus = Math.floor((gameState.correctAttempts / gameState.totalAttempts) * 500);
    const movesPenalty = gameState.moves * 10;
    
    gameState.score = Math.max(0, config.baseScore + timeBonus + accuracyBonus - movesPenalty);
    updateStats();
}

// ===== Update Stats Display =====
function updateStats() {
    movesDisplay.textContent = gameState.moves;
    scoreDisplay.textContent = gameState.score;
    
    const accuracy = gameState.totalAttempts > 0 
        ? Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100)
        : 100;
    accuracyDisplay.textContent = accuracy + '%';
}

// ===== Timer Functions =====
function startTimer() {
    gameState.timer = setInterval(() => {
        gameState.seconds++;
        updateTimeDisplay();
    }, 1000);
}

function updateTimeDisplay() {
    const minutes = Math.floor(gameState.seconds / 60);
    const seconds = gameState.seconds % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ===== Hint System =====
function useHint() {
    if (gameState.hintsRemaining <= 0 || gameState.lockBoard) return;
    
    const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
    if (unmatched.length < 2) return;
    
    // Find a matching pair
    const emojis = unmatched.map(card => card.dataset.emoji);
    const firstMatch = emojis.find((emoji, idx) => 
        emojis.indexOf(emoji, idx + 1) !== -1
    );
    
    if (firstMatch) {
        const matchingCards = unmatched.filter(card => card.dataset.emoji === firstMatch);
        matchingCards.slice(0, 2).forEach(card => {
            card.classList.add('hint');
            setTimeout(() => card.classList.remove('hint'), 1000);
        });
        
        gameState.hintsRemaining--;
        updateHintCount();
        playSound('hint');
    }
}

function updateHintCount() {
    hintCountDisplay.textContent = gameState.hintsRemaining;
    if (gameState.hintsRemaining === 0) {
        hintBtn.style.opacity = '0.5';
        hintBtn.style.cursor = 'not-allowed';
    }
}

// ===== Handle Victory =====
function handleVictory() {
    clearInterval(gameState.timer);
    calculateScore();
    
    setTimeout(() => {
        document.getElementById('finalMoves').textContent = gameState.moves;
        document.getElementById('finalTime').textContent = timeDisplay.textContent;
        document.getElementById('finalAccuracy').textContent = accuracyDisplay.textContent;
        document.getElementById('finalScore').textContent = gameState.score;
        
        updateStarRating();
        showModal();
        playSound('victory');
        createVictoryExplosion();
    }, 800);
}

// ===== Star Rating =====
function updateStarRating() {
    const stars = document.querySelectorAll('.star');
    const accuracy = parseInt(accuracyDisplay.textContent);
    
    let starCount = 1;
    if (accuracy >= 80) starCount = 2;
    if (accuracy >= 90) starCount = 3;
    
    stars.forEach((star, index) => {
        setTimeout(() => {
            if (index < starCount) {
                star.classList.add('active');
            }
        }, index * 200);
    });
}

// ===== Modal Functions =====
function showModal() {
    victoryModal.classList.add('active');
}

function hideModal() {
    victoryModal.classList.remove('active');
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
    });
}

// ===== Difficulty Change =====
function changeDifficulty(level) {
    gameState.difficulty = level;
    
    diffBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    initGame();
}

// ===== Sound Toggle =====
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundIcon.textContent = gameState.soundEnabled ? '🔊' : '🔇';
}

// ===== Share Score =====
function shareScore() {
    const text = `🎮 Memory Match - Neon Edition 🎮
🏆 Điểm: ${gameState.score}
⏱️ Thời gian: ${timeDisplay.textContent}
🎯 Độ chính xác: ${accuracyDisplay.textContent}
👆 Số lượt: ${gameState.moves}

Thử thách bản thân tại: [Your URL]`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Memory Match Score',
            text: text
        });
    } else {
        navigator.clipboard.writeText(text);
        alert('Đã copy kết quả vào clipboard!');
    }
}

// ===== Particles Effect =====
function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 217, 255, ${particle.opacity})`;
            ctx.fill();
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function createMatchParticles(card) {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.backgroundColor = '#00ff88';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.boxShadow = '0 0 10px #00ff88';
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / 20;
        const velocity = 2 + Math.random() * 2;
        
        particle.animate([
            { 
                transform: 'translate(0, 0) scale(1)',
                opacity: 1 
            },
            { 
                transform: `translate(${Math.cos(angle) * 100 * velocity}px, ${Math.sin(angle) * 100 * velocity}px) scale(0)`,
                opacity: 0 
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => particle.remove();
    }
}

function createVictoryExplosion() {
    const colors = ['#00d9ff', '#ff006e', '#8b5cf6', '#00ff88', '#ffea00'];
    
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.borderRadius = '50%';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / 100;
        const velocity = 3 + Math.random() * 3;
        
        particle.animate([
            { 
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1 
            },
            { 
                transform: `translate(calc(-50% + ${Math.cos(angle) * 200 * velocity}px), calc(-50% + ${Math.sin(angle) * 200 * velocity}px)) scale(0)`,
                opacity: 0 
            }
        ], {
            duration: 1500,
            easing: 'cubic-bezier(0, .9, .57, 1)'
        }).onfinish = () => particle.remove();
    }
}

// ===== Sound Effects =====
function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'flip':
                oscillator.frequency.value = 400;
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'match':
                oscillator.frequency.value = 800;
                gainNode.gain.value = 0.15;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'wrong':
                oscillator.frequency.value = 200;
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
            case 'hint':
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.12;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
            case 'victory':
                const frequencies = [523, 659, 784, 1047];
                frequencies.forEach((freq, index) => {
                    setTimeout(() => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(audioContext.destination);
                        osc.frequency.value = freq;
                        gain.gain.value = 0.2;
                        osc.start();
                        osc.stop(audioContext.currentTime + 0.3);
                    }, index * 150);
                });
                break;
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ===== Event Listeners =====
restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
    hideModal();
    initGame();
});
hintBtn.addEventListener('click', useHint);
soundBtn.addEventListener('click', toggleSound);
shareBtn.addEventListener('click', shareScore);

diffBtns.forEach(btn => {
    btn.addEventListener('click', () => changeDifficulty(btn.dataset.level));
});

victoryModal.addEventListener('click', (e) => {
    if (e.target === victoryModal) {
        hideModal();
    }
});

// ===== Initialize on Load =====
document.addEventListener('DOMContentLoaded', initGame);
