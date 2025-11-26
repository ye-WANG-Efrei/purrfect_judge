import React, { useState, useEffect, useRef } from 'react';
import { generateCharacterImage, getJudgment } from './services/geminiService';
import { CharacterImages, CharacterPrompts, CharacterType, Verdict, CaseRound } from './types';
import { AvatarDisplay } from './components/AvatarDisplay';
import { VerdictPanel } from './components/VerdictPanel';
import { playSound } from './utils/soundEffects';
import { loadImagesFromDB, saveImagesToDB, clearImagesFromDB } from './services/storageService';

const STORAGE_KEY = 'purrfect_justice_avatars_v1';

const App: React.FC = () => {
  // State for Images
  const [images, setImages] = useState<CharacterImages>({
    judge: null,
    catDebater: null,
    dogDebater: null,
  });
  const [loadingImages, setLoadingImages] = useState<boolean>(true);

  // State for Names (Empty by default per user request)
  const [catName, setCatName] = useState('');
  const [dogName, setDogName] = useState('');

  // State for Arguments
  const [catArg, setCatArg] = useState('');
  const [dogArg, setDogArg] = useState('');

  // State for Verdict & History
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [isJudging, setIsJudging] = useState(false);
  const [history, setHistory] = useState<CaseRound[]>([]);

  // Refs for throttling typing sound
  const lastTypeTime = useRef<number>(0);

  // Initial Image Generation / Loading from Cache
  useEffect(() => {
    const loadImages = async () => {
      // 1. Try to load from IndexedDB first (Async, High Capacity)
      try {
        const cached = await loadImagesFromDB(STORAGE_KEY);
        if (cached && cached.judge && cached.catDebater && cached.dogDebater) {
          setImages(cached);
          setLoadingImages(false);
          return; 
        }
      } catch (e) {
        console.warn("Failed to load images from DB", e);
      }

      // 2. If no cache, generate new images (Slow, but one-time)
      setLoadingImages(true);
      try {
        const [judgeImg, catImg, dogImg] = await Promise.all([
          generateCharacterImage(CharacterPrompts[CharacterType.JUDGE]),
          generateCharacterImage(CharacterPrompts[CharacterType.CAT_DEBATER]),
          generateCharacterImage(CharacterPrompts[CharacterType.DOG_DEBATER]),
        ]);

        const newImages = {
          judge: judgeImg,
          catDebater: catImg,
          dogDebater: dogImg,
        };

        setImages(newImages);
        
        // 3. Save to IndexedDB for next time
        await saveImagesToDB(STORAGE_KEY, newImages);
        
      } catch (apiError) {
        console.error("Failed to generate images:", apiError);
      } finally {
        setLoadingImages(false);
      }
    };

    loadImages();
  }, []);

  const handleTypingSound = () => {
    const now = Date.now();
    // Throttle sound to play at most every 100ms
    if (now - lastTypeTime.current > 100) {
      playSound('typing');
      lastTypeTime.current = now;
    }
  };

  const handleJudgeClick = async () => {
    if (!catArg.trim() || !dogArg.trim()) return;
    
    playSound('gavel');
    
    setIsJudging(true);
    setVerdict(null); // Clear previous to show loading state if desired, or keep it. Let's clear for effect.
    
    // Use defaults if names are empty
    const effectiveCatName = catName || '喵喵辩手';
    const effectiveDogName = dogName || '汪汪辩手';
    
    try {
      const result = await getJudgment(catArg, dogArg, effectiveCatName, effectiveDogName, history);
      setVerdict(result);
    } catch (e) {
      console.error(e);
      alert("法官正在打盹，请重试。");
    } finally {
      setIsJudging(false);
    }
  };

  const handleAppeal = () => {
    if (!verdict) return;
    
    // Save current state to history
    const newRound: CaseRound = {
      roundNumber: history.length + 1,
      catArg,
      dogArg,
      verdict
    };
    
    setHistory([...history, newRound]);
    
    // Reset for next round
    setVerdict(null);
    setCatArg('');
    setDogArg('');
    
    // Scroll to top of arguments
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcceptVerdict = () => {
    // Reset everything
    setVerdict(null);
    setCatArg('');
    setDogArg('');
    setHistory([]);
    setCatName('');
    setDogName('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetImages = async () => {
    if (window.confirm("确定要重新生成头像吗？这需要一点时间。")) {
      await clearImagesFromDB(STORAGE_KEY);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-[#fef6f6]">
      
      {/* Header / Judge Section */}
      <header className="bg-gradient-to-b from-purple-100 via-purple-50 to-[#fef6f6] pt-8 pb-12 rounded-b-[3rem] px-4 text-center relative z-10 border-b border-purple-100 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <AvatarDisplay 
            imageData={images.judge} 
            isLoading={loadingImages} 
            label="喵喵法官"
            borderColor="border-purple-400"
            isJudging={isJudging}
          />
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm">
            喵喵 <span className="text-purple-500">法庭</span>
          </h1>
          <p className="mt-2 text-slate-500 text-lg">最公平的法院</p>
        </div>
      </header>

      <main className="container mx-auto px-4 -mt-8 relative z-20">
        
        {/* Intro / Instruction Card */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg border border-purple-100 text-center transform hover:scale-[1.01] transition-transform">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
              ⚖️ 解决争端，不行解决一只
            </h2>
            <p className="text-slate-600 leading-relaxed">
              陷入争论了吗？让 <strong>猫猫法官</strong> 来裁决！
              {history.length > 0 ? (
                <span className="block mt-2 text-purple-600 font-bold">上诉回合: 第 {history.length + 1} 轮</span>
              ) : (
                " 在下方输入你们的观点，获取一个公正的判决。"
              )}
            </p>
          </div>
        </div>

        {/* History Log (Visible if appeals exist) */}
        {history.length > 0 && (
          <div className="max-w-5xl mx-auto mb-8 bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <h3 className="text-center text-gray-400 font-bold uppercase text-xs tracking-widest mb-4">案件记录</h3>
            <div className="space-y-4">
              {history.map((round) => (
                <div key={round.roundNumber} className="flex flex-col md:flex-row gap-4 text-sm bg-white p-3 rounded-xl shadow-sm">
                  <div className="flex-1 border-l-4 border-blue-300 pl-3">
                    <span className="font-bold text-blue-500 text-xs">第 {round.roundNumber} 轮 - 喵喵</span>
                    <p className="text-gray-600 line-clamp-2">{round.catArg}</p>
                  </div>
                  <div className="flex-1 border-l-4 border-purple-300 pl-3 bg-purple-50/50">
                    <span className="font-bold text-purple-500 text-xs">判决结果</span>
                    <p className="text-gray-700 font-medium">{round.verdict.reasoning}</p>
                  </div>
                  <div className="flex-1 border-l-4 border-orange-300 pl-3">
                    <span className="font-bold text-orange-500 text-xs">第 {round.roundNumber} 轮 - 汪汪</span>
                    <p className="text-gray-600 line-clamp-2">{round.dogArg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Debate Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 max-w-5xl mx-auto">
          
          {/* Cat Side */}
          <div className="bg-gradient-to-b from-blue-100 to-white rounded-3xl p-6 shadow-xl border-t-8 border-blue-400 flex flex-col items-center transform transition-transform hover:-translate-y-1">
            <div className="-mt-20 mb-4 w-full flex justify-center">
              <AvatarDisplay 
                imageData={images.catDebater} 
                isLoading={loadingImages} 
                label={catName}
                borderColor="border-blue-400"
                onNameChange={setCatName}
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-bold text-blue-600 mb-2 uppercase tracking-wide">
                {catName || '喵喵辩手'} 的 {history.length > 0 ? '反驳' : '观点'}
              </label>
              <textarea
                value={catArg}
                onChange={(e) => {
                  setCatArg(e.target.value);
                  handleTypingSound();
                }}
                disabled={isJudging || !!verdict}
                placeholder={history.length > 0 ? "法官大人，请听我一言..." : "喵！这本来就是我的盒子，因为..."}
                className="w-full h-40 p-4 border border-blue-100 bg-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none text-slate-700 placeholder-blue-300 shadow-inner disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* Dog Side */}
          <div className="bg-gradient-to-b from-orange-100 to-white rounded-3xl p-6 shadow-xl border-t-8 border-orange-400 flex flex-col items-center transform transition-transform hover:-translate-y-1 mt-16 md:mt-0">
             <div className="-mt-20 mb-4 w-full flex justify-center">
              <AvatarDisplay 
                imageData={images.dogDebater} 
                isLoading={loadingImages} 
                label={dogName}
                borderColor="border-orange-400"
                onNameChange={setDogName}
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-bold text-orange-600 mb-2 uppercase tracking-wide">
                {dogName || '汪汪辩手'} 的 {history.length > 0 ? '反驳' : '观点'}
              </label>
              <textarea
                value={dogArg}
                onChange={(e) => {
                  setDogArg(e.target.value);
                  handleTypingSound();
                }}
                disabled={isJudging || !!verdict}
                placeholder={history.length > 0 ? "汪！反对，法官大人..." : "汪！我没吃那个鞋子，它自己爆炸了..."}
                className="w-full h-40 p-4 border border-orange-100 bg-white rounded-xl focus:ring-2 focus:ring-orange-400 focus:outline-none resize-none text-slate-700 placeholder-orange-300 shadow-inner disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

        </div>

        {/* Action Button */}
        {!verdict && (
          <div className="flex justify-center mt-12">
            <button
              onClick={handleJudgeClick}
              disabled={isJudging || !catArg || !dogArg}
              className={`
                relative group overflow-hidden rounded-full py-4 px-12 text-white font-black text-xl shadow-2xl transition-all
                ${isJudging || !catArg || !dogArg ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 active:scale-95'}
              `}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isJudging ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    法官思考中...
                  </>
                ) : (
                  <>
                    🔨 {history.length > 0 ? '上诉裁决' : '现在开庭'}
                  </>
                )}
              </span>
            </button>
          </div>
        )}

        {/* Verdict Display & Appeal Controls */}
        {verdict && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <VerdictPanel 
              verdict={verdict} 
              judgeImage={images.judge} 
              catName={catName || '喵喵辩手'}
              dogName={dogName || '汪汪辩手'}
            />
            
            {/* Satisfaction / Appeal Buttons */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mt-6 border border-purple-100 max-w-xl w-full text-center">
              <h3 className="text-lg font-bold text-slate-700 mb-4">你对判决满意吗？</h3>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={handleAcceptVerdict}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  ✅ 满意，结案
                </button>
                <button 
                  onClick={handleAppeal}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  ✋ 不服，上诉！
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-3">上诉将允许你针对判决提出反驳，并获得新的裁决。</p>
            </div>
          </div>
        )}

      </main>

      <footer className="text-center mt-20 pb-8 text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} 喵喵法庭 • Powered by Gemini AI</p>
        <button 
          onClick={handleResetImages}
          className="mt-2 text-xs text-slate-300 hover:text-purple-400 underline transition-colors"
        >
          重新生成头像
        </button>
      </footer>
    </div>
  );
};

export default App;