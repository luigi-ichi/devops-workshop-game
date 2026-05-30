import { useState } from 'react';
import { Hand, HandFist } from 'lucide-react';
import rockSvg from './assets/rock.svg';
import paperSvg from './assets/paper.svg';
import scissorsSvg from './assets/scissors.svg';
import customScissorsIcon from './assets/scissors-hand.svg';

const getAssetUrl = (localAsset, filename) => {
  return import.meta.env.VITE_CDN_URL ? `${import.meta.env.VITE_CDN_URL}/${filename}` : localAsset;
};

const HandScissorsIcon = ({ className, size = 40 }) => (
  <img 
    src={getAssetUrl(customScissorsIcon, 'scissors-hand.svg')} 
    className={className} 
    style={{ width: size, height: size, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
    alt="Scissors Hand Sign" 
  />
);

const CHOICES = [
  { id: 'rock', name: 'Rock', icon: HandFist, image: getAssetUrl(rockSvg, 'rock.svg') },
  { id: 'paper', name: 'Paper', icon: Hand, image: getAssetUrl(paperSvg, 'paper.svg') },
  { id: 'scissors', name: 'Scissors', icon: HandScissorsIcon, image: getAssetUrl(scissorsSvg, 'scissors.svg') },
];

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const startGame = () => {
    setIsPlaying(true);
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setPlayerScore(0);
    setComputerScore(0);
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  const determineWinner = (player, computer) => {
    if (player === computer) return 'draw';
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    return 'lose';
  };

  const handleChoice = (choiceId) => {
    if (isAnimating || !isPlaying) return;
    
    setPlayerChoice(choiceId);
    setIsAnimating(true);
    setComputerChoice(null);
    setResult(null);
    
    let counter = 0;
    const interval = setInterval(() => {
      const randomChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
      setComputerChoice(randomChoice);
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        const finalComputerChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
        setComputerChoice(finalComputerChoice);
        const matchResult = determineWinner(choiceId, finalComputerChoice);
        setResult(matchResult);
        
        if (matchResult === 'win') setPlayerScore(p => p + 1);
        if (matchResult === 'lose') setComputerScore(c => c + 1);
        
        setIsAnimating(false);
      }
    }, 100);
  };

  const getChoiceImage = (id) => CHOICES.find(c => c.id === id)?.image;

  return (
    <div className="min-h-screen bg-white text-black font-karla flex flex-col items-center justify-center py-10 overflow-x-hidden">
      {/* Title */}
      <h1 
        className="font-jersey font-bold text-center text-5xl md:text-7xl tracking-wider text-stroke-lg mb-8 text-gradient-yellow"
      >
        Rock Paper Scissors
      </h1>

      {/* Scores Area */}
      <div className="w-full max-w-[500px] md:max-w-[700px] flex justify-between px-8 mb-2 z-10">
        <div className="text-center font-bold">
          <div className="text-2xl tracking-wide mb-1">You</div>
          <div className="text-lg font-normal">Score: {playerScore}</div>
        </div>
        <div className="text-center font-bold">
          <div className="text-2xl tracking-wide mb-1">Computah</div>
          <div className="text-lg font-normal">Score: {computerScore}</div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative flex items-center justify-center w-[calc(100%-80px)] md:w-full max-w-[300px] sm:max-w-[500px] md:max-w-[700px] ml-16 md:mx-auto mt-4">
        {/* Buttons */}
        <div className="absolute -left-20 md:-left-28 flex flex-col gap-4 z-20">
          {CHOICES.map(choice => {
            const Icon = choice.icon;
            return (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                disabled={isAnimating || !isPlaying}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-[4px] md:border-[5px] border-black flex items-center justify-center transition-transform ${isPlaying && !isAnimating ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                style={{ background: 'linear-gradient(180deg, #FFE100 0%, #FF8C00 100%)' }}
              >
                <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={2.5} size={40} />
              </button>
            )
          })}
        </div>

        {/* Battle Arena */}
        <div 
          className="w-full h-[200px] sm:h-[260px] md:h-[350px] border-[5px] md:border-[6px] border-black relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4CE7E7 0%, #3D3E80 100%)' }}
        >
          {playerChoice && (
            <img src={getChoiceImage(playerChoice)} className="absolute -left-8 md:-left-12 top-1/2 -translate-y-1/2 w-[160px] sm:w-[220px] md:w-[320px] object-contain drop-shadow-2xl rotate-90" />
          )}

          {result && !isAnimating && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-white border-[4px] border-black px-6 py-2 rounded-xl shadow-[4px_4px_0_0_#000]">
                <span className="font-jersey text-5xl md:text-6xl font-bold text-stroke-lg text-gradient-yellow">
                  {result === 'win' ? 'WIN!' : result === 'lose' ? 'LOSE!' : 'DRAW!'}
                </span>
              </div>
            </div>
          )}

          {computerChoice && (
            <img src={getChoiceImage(computerChoice)} className="absolute -right-8 md:-right-12 top-1/2 -translate-y-1/2 w-[160px] sm:w-[220px] md:w-[320px] object-contain drop-shadow-2xl -rotate-90 -scale-x-100" />
          )}
        </div>
      </div>

      {/* Start/Reset Button */}
      {!isPlaying ? (
        <button 
          onClick={startGame}
          className="mt-10 px-10 py-3 border-[4px] md:border-[5px] border-black rounded-2xl font-jersey font-bold text-3xl md:text-4xl hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-[0_4px_0_0_#000]"
          style={{ 
            background: 'linear-gradient(180deg, #FFE100 0%, #FF8C00 100%)',
          }}
        >
          Start Game
        </button>
      ) : (
        <button 
          onClick={resetGame}
          className="mt-10 px-10 py-3 border-[4px] md:border-[5px] border-black rounded-2xl font-jersey font-bold text-3xl md:text-4xl hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-[0_4px_0_0_#000] bg-white text-black"
        >
          Reset Game
        </button>
      )}

    </div>
  );
}

export default App;
