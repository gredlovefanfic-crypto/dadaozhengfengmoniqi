// ========== 🚀 存档系统 ==========
const SAVE_KEY = 'daodao_save_v1';
const HISTORY_KEY = 'daodao_history_v1';

// ========== 游戏状态 ==========
let gameState = {
  player: null,
  currentCharacter: null,
  allCharacters: gameData.characters.map(c => {
    let charCopy = { ...c };
    if (!charCopy.hobbies || charCopy.hobbies.length === 0) {
      charCopy.hobbies = generateHobbiesForCharacter(charCopy);
    }
    return charCopy;
  }),
		eventMessageIndex: 0,      // 新增：全局事件消息当前索引，从0开始
		qianYuKillCount: 0,      // ← 新加的，用于记录“迁羽量胜”杀了几次
		killedCompanions: 0,
  metCharacters: new Map(),
  maxFavorCharacters: 0,
  maxFavorSectMasters: new Set(),
  isFirstEncounter: true,
  canTalk: true,
  randomEventTriggered: false,
  specialDialogueTriggered: false,
  achievementsUnlocked: [],
  maxFavorOrder: [],
		eventMessageIndex: 0,   // ← 添加这一行
  trialPassModalShown: false,   
};

function saveGame() {
  if (!gameState.player) return;
  try {
    const saveObj = {
      player: gameState.player,
      currentCharacter: gameState.currentCharacter,
		qianYuKillCount: gameState.qianYuKillCount,   // ← 新加
      allCharacters: gameState.allCharacters,
      metCharacters: Array.from(gameState.metCharacters.entries()),
      maxFavorCharacters: gameState.maxFavorCharacters,
      maxFavorSectMasters: Array.from(gameState.maxFavorSectMasters),
      isFirstEncounter: gameState.isFirstEncounter,
      canTalk: gameState.canTalk,
      randomEventTriggered: gameState.randomEventTriggered,
      specialDialogueTriggered: gameState.specialDialogueTriggered,
      achievementsUnlocked: gameState.achievementsUnlocked,
      maxFavorOrder: gameState.maxFavorOrder,
			eventMessageIndex: gameState.eventMessageIndex
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveObj));
    showStatus('✅ 进度已自动存档', 'success');
  } catch(e) { console.warn('存档失败', e); }
}

function loadGame() {
  const saveStr = localStorage.getItem(SAVE_KEY);
  if (!saveStr) {
    refreshAchievementUI();
    return;
  }
  try {
    const saveObj = JSON.parse(saveStr);
	  gameState.trialPassModalShown = saveObj.trialPassModalShown || false;
    if (!saveObj.player) return;

    gameState.player = saveObj.player;
    if (!gameState.player.hobbies) gameState.player.hobbies = shuffleArray([...gameData.allHobbies]).slice(0, 7);
    if (!gameState.player.giftedHobbies) gameState.player.giftedHobbies = [];
    if (gameState.player.insightPoints === undefined) gameState.player.insightPoints = 0;
    if (gameState.player.cultivation === undefined) gameState.player.cultivation = 60;
    if (gameState.player.face === undefined) gameState.player.face = 75;
    if (!gameState.player.faction) gameState.player.faction = "玄门";
    if (!gameState.player.sect) gameState.player.sect = "溟沧";
    if (!gameState.player.stance) gameState.player.stance = "新";
    if (!gameState.player.inventory) gameState.player.inventory = [];
	if (!gameState.player.receivedGiftHobbies) {
    gameState.player.receivedGiftHobbies = [];
		if (!gameState.player.usedGiftHobbies) {
    gameState.player.usedGiftHobbies = [];
}
}
	

    gameState.currentCharacter = saveObj.currentCharacter;
	gameState.qianYuKillCount = saveObj.qianYuKillCount || 0;   // ← 新加
    gameState.allCharacters = saveObj.allCharacters;
    gameState.metCharacters = new Map(saveObj.metCharacters);
    gameState.maxFavorCharacters = saveObj.maxFavorCharacters || 0;
    gameState.maxFavorSectMasters = new Set(saveObj.maxFavorSectMasters || []);
    gameState.isFirstEncounter = saveObj.isFirstEncounter ?? true;
    gameState.canTalk = saveObj.canTalk ?? true;
    gameState.randomEventTriggered = saveObj.randomEventTriggered ?? false;
    gameState.specialDialogueTriggered = saveObj.specialDialogueTriggered ?? false;
    gameState.achievementsUnlocked = saveObj.achievementsUnlocked || [];
    gameState.maxFavorOrder = saveObj.maxFavorOrder || [];
	gameState.eventMessageIndex = saveObj.eventMessageIndex || 0;

    for (let [id, data] of gameState.metCharacters.entries()) {
  if (data.specialDialogueTriggered === undefined) data.specialDialogueTriggered = false;
  if (data.favorMaxed === undefined) data.favorMaxed = false;
  if (data.isAdvancedSimaQuan === undefined) data.isAdvancedSimaQuan = false;
  if (data.talks === undefined) data.talks = 0;
  if (data.relation === undefined) data.relation = 'none';
    if (data.companionIndex === undefined) data.companionIndex = 0;
  if (data.enemyIndex === undefined) data.enemyIndex = 0;
}

    // ===== 强制重新生成所有角色的爱好，确保符合最新规则 =====
    gameState.allCharacters.forEach(char => {
      char.hobbies = generateHobbiesForCharacter(char);
    });
    for (let [id, data] of gameState.metCharacters.entries()) {
      if (data.character) {
        data.character.hobbies = generateHobbiesForCharacter(data.character);
      }
    }

	// 为玩家角色也重新生成爱好（保留 giftedHobbies 不变）
    if (gameState.player) {
      gameState.player.hobbies = generateHobbiesForCharacter(gameState.player);
    }
	
    let maxFavorCount = 0;
    for (let [id, data] of gameState.metCharacters.entries()) {
      if (data.favor >= 100) {
        if (!data.favorMaxed) data.favorMaxed = true;
        maxFavorCount++;
      } else {
        if (data.favorMaxed) data.favorMaxed = false;
      }
    }
    gameState.maxFavorCharacters = maxFavorCount;

    if (gameState.player.insightPoints >= 10) {
      while (gameState.player.insightPoints >= 10) {
        gameState.player.cultivation++;
        gameState.player.insightPoints -= 10;
      }
    }

    displayPlayerInfo();
    playerInfo.style.display = "block";
    progressContainer.style.display = "block";
    startBtn.disabled = true;
    nameInput.disabled = true;
    refreshPlayerInsightUI();
    refreshInventoryUI();

    if (gameState.currentCharacter) {
      const charId = gameState.currentCharacter.surname + gameState.currentCharacter.name;
      const charData = gameState.metCharacters.get(charId);
      if (charData) {
        gameState.canTalk = (charData.talks < 1 && charData.favor < 100);
        displayCurrentCharacter();
        currentInteraction.textContent = charId;
        actionButtons.style.display = "block";

        if (charData.favor >= 100) {
          optionsDiv.innerHTML = "";
        } else if (!gameState.canTalk) {
          optionsDiv.innerHTML = "";
          const special = checkSpecialDialogueCondition(gameState.player, gameState.currentCharacter, charData);
          if (special) {
            addSystemMessage(`${charId}: "${special}"`);
          } else {
            addSystemMessage(`已与此真人交流过1次，请抽取新真人。`);
          }
        } else {
          prepareHobbySelection();
        }
      }
    }

    updateRanking();
    updateStats();
    refreshAchievementUI();
    checkAchievements();
    showStatus('📖 已加载上次存档', 'info');
    addSystemMessage(`✨ 存档载入成功，欢迎回来，${gameState.player.surname + gameState.player.name}道友。`);
    fixGameStateAvatars();
	
	if (gameState.player) {
    actionButtons.style.display = "block";
}

  } catch (e) {
    console.warn('读档失败', e);
    localStorage.removeItem(SAVE_KEY);
  }
}

function clearSave() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(HISTORY_KEY);   
    showStatus('🗑️ 存档已清除', 'info');
}

function showStatus(msg, type) { 
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    statusDiv.textContent = msg; 
    statusDiv.className = "status " + type; 
    statusDiv.style.display = "block"; 
    setTimeout(() => statusDiv.style.display = "none", 2000); 
}