const cells = [...document.querySelectorAll('.cell')];
const modeSelect = document.getElementById('mode');
const difficultySelect = document.getElementById('difficulty');
const difficultyLabel = document.getElementById('difficultyLabel');
const turnBanner = document.getElementById('turnBanner');
const turnText = document.getElementById('turnText');
const result = document.getElementById('result');
const soundToggle = document.getElementById('soundToggle');
let board = Array(9).fill('');
let current = 'X', gameOver = false, round = 1, soundOn = true;
let scores = { wins: 0, draws: 0, losses: 0 };
const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
document.getElementById('year').textContent = new Date().getFullYear();

function beep(freq=520,duration=.07){
  if(!soundOn) return;
  try { const ctx = new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(), gain=ctx.createGain(); osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=freq;gain.gain.setValueAtTime(.045,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);osc.start();osc.stop(ctx.currentTime+duration); } catch(e){}
}
function setTurn(){
  const isX = current==='X';
  turnBanner.querySelector('.turn-symbol').textContent=current;
  turnBanner.querySelector('.turn-symbol').style.color=isX?'var(--gold)':'var(--text)';
  turnText.textContent = modeSelect.value==='cpu' ? (isX?'Your move':'NOIR AI is thinking') : `Player ${current}`;
  turnBanner.querySelector('small').textContent = isX ? "IT'S YOUR TURN" : (modeSelect.value==='cpu'?'AI TURN':"PLAYER TWO'S TURN");
}
function winner(){
  for(const line of wins){const [a,b,c]=line;if(board[a]&&board[a]===board[b]&&board[a]===board[c])return {mark:board[a],line};}
  return board.every(Boolean)?{mark:'draw',line:[]}:null;
}
function render(){
  cells.forEach((cell,i)=>{cell.textContent=board[i];cell.classList.toggle('o',board[i]==='O');cell.classList.remove('win');cell.disabled=gameOver||!!board[i]||(modeSelect.value==='cpu'&&current==='O');});
  setTurn();
}
function finish(outcome){
  gameOver=true;
  if(outcome.mark==='draw'){scores.draws++;result.textContent="A balanced match. It's a draw.";}
  else{
    const humanWon = modeSelect.value==='pvp' ? outcome.mark==='X' : outcome.mark==='X';
    if(modeSelect.value==='pvp') result.textContent=`PLAYER ${outcome.mark} TAKES THE ROUND!`;
    else result.textContent=humanWon?'VICTORY. WELL PLAYED!':'NOIR AI WINS THIS ROUND.';
    if(humanWon)scores.wins++;else scores.losses++;
    outcome.line.forEach(i=>cells[i].classList.add('win'));
    beep(760,.18);
  }
  if(outcome.mark==='draw')beep(340,.15);
  updateStats();
  cells.forEach(c=>c.disabled=true);
  turnBanner.querySelector('small').textContent='ROUND COMPLETE';
  turnText.textContent='Game over';
}
function play(index){
  if(gameOver||board[index]||(modeSelect.value==='cpu'&&current==='O'))return;
  board[index]=current;beep(current==='X'?580:430);render();
  const outcome=winner();if(outcome){finish(outcome);return;}
  current=current==='X'?'O':'X';render();
  if(modeSelect.value==='cpu'&&current==='O')setTimeout(aiMove,420);
}
function available(){return board.map((v,i)=>v?null:i).filter(v=>v!==null);}
function findWinningMove(mark){
  for(const i of available()){board[i]=mark;const won=wins.some(line=>line.every(n=>board[n]===mark));board[i]='';if(won)return i;}return null;
}
function minimax(state, isMax){
  const outcome=(()=>{for(const line of wins){const [a,b,c]=line;if(state[a]&&state[a]===state[b]&&state[a]===state[c])return state[a];}return state.every(Boolean)?'draw':null;})();
  if(outcome==='O')return 10;if(outcome==='X')return -10;if(outcome==='draw')return 0;
  let best=isMax?-Infinity:Infinity;
  for(let i=0;i<9;i++)if(!state[i]){state[i]=isMax?'O':'X';const score=minimax(state,!isMax);state[i]='';best=isMax?Math.max(best,score):Math.min(best,score);}
  return best;
}
function aiMove(){
  if(gameOver)return;
  let move;
  const level=difficultySelect.value;
  if(level==='easy'){const a=available();move=a[Math.floor(Math.random()*a.length)];}
  else if(level==='medium'){
    move=findWinningMove('O');if(move===null)move=findWinningMove('X');
    if(move===null&&Math.random()<.55)move=available()[Math.floor(Math.random()*available().length)];
    if(move===null)move=findBest();
  }else move=findBest();
  if(move===undefined||move===null)return;
  board[move]='O';beep(430);render();
  const outcome=winner();if(outcome){finish(outcome);return;}
  current='X';render();
}
function findBest(){
  let best=-Infinity,chosen=null;
  for(const i of available()){board[i]='O';const score=minimax(board,false);board[i]='';if(score>best){best=score;chosen=i;}}
  return chosen;
}
function newGame(){
  board=Array(9).fill('');current='X';gameOver=false;result.textContent='';
  document.getElementById('roundLabel').textContent=`ROUND ${String(round).padStart(2,'0')}`;
  render();
}
function updateStats(){
  document.getElementById('wins').textContent=scores.wins;
  document.getElementById('draws').textContent=scores.draws;
  document.getElementById('losses').textContent=scores.losses;
  const total=scores.wins+scores.draws+scores.losses;
  const rate=total?Math.round(scores.wins/total*100):0;
  document.getElementById('winRate').textContent=rate+'%';
  document.getElementById('progressBar').style.width=rate+'%';
}
function updateMode(){
  const cpu=modeSelect.value==='cpu';
  difficultySelect.hidden=!cpu;difficultyLabel.hidden=!cpu;
  document.getElementById('playerTwoName').textContent=cpu?'NOIR AI':'PLAYER TWO';
  newGame();showToast(cpu?'Computer mode selected':'Two-player mode selected');
}
function showToast(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700);}
cells.forEach(cell=>cell.addEventListener('click',()=>play(Number(cell.dataset.index))));
document.getElementById('newGameBtn').addEventListener('click',()=>{round++;newGame();beep(500);});
modeSelect.addEventListener('change',updateMode);
difficultySelect.addEventListener('change',()=>{newGame();showToast(`${difficultySelect.value[0].toUpperCase()+difficultySelect.value.slice(1)} AI selected`);});
document.getElementById('resetStats').addEventListener('click',()=>{scores={wins:0,draws:0,losses:0};updateStats();showToast('Statistics reset');});
soundToggle.addEventListener('click',()=>{soundOn=!soundOn;soundToggle.textContent=soundOn?'♫':'♪';showToast(soundOn?'Sound enabled':'Sound muted');});
document.getElementById('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('light');showToast(document.body.classList.contains('light')?'Light theme':'Dark theme');});
newGame();
