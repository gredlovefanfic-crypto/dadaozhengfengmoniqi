// ==========================================
// 大道相亲模拟器 - 事件处理核心系统 (events.js)
// ==========================================

const REUNION_PROB = 0.2; // 20%

// ---------- 1. 辅助与判定函数 ----------
function isGiftOwner(char, owners) {
    for (let owner of owners) {
        if (typeof owner === 'string') {
            if (owner === 'any') return true;
            if (owner === '灵门' && char.faction === '灵门') return true;
            if (owner === char.sect) return true;
        } else if (typeof owner === 'object') {
            if (char.surname === owner.surname && char.name === owner.name) return true;
        }
    }
    return false;
}

function handleRandomEvent(silent = false) {
    if (Math.random() > 0.2 || gameState.randomEventTriggered) return 0;
    gameState.randomEventTriggered = true;
    if (Math.random() < 0.02) {
        const change = getRandomInt(-20, 0);
        if (!silent) {
            let description = "";
            if (change <= -15) description = "😈 遭天魔了！天魔现身，道友重伤垂危，好感大跌！";
            else if (change <= -5) description = "😈 遭天魔了！天魔余威震荡，道友对你心生埋怨。";
            else description = "😈 遭天魔了！天魔虚影掠过，道友惊魂未定。";
            addSystemMessage(`${description} (好感度 ${change})`);
            addToHistory(`<p class="other-message">✨ 随机事件：${description}</p>`);
        }
        return change;
    }
    if (Math.random() < 0.04) {
        const sum = gameState.player.cultivation + gameState.currentCharacter.cultivation;
        let change = 0, description = "";
        if (sum >= 180) { change = 5; description = "⚔️ 触发随机事件：人劫前奏——这是小辈的事，与你们无关。"; }
        else if (sum >= 150) { change = 2; description = "⚔️ 触发随机事件：人劫前奏——打了小的来了老的。你是那个老的。"; }
        else { change = 0; description = "⚔️ 触发随机事件：人劫前奏——修为不足，忧心忡忡。"; }
        if (!silent) {
            addSystemMessage(description);
            addToHistory(`<p class="other-message">✨ 随机事件：${description}</p>`);
        }
        return change;
    }
    const ev = getRandomElement(gameData.randomEvents);
    const change = getRandomInt(ev.effect.min, ev.effect.max);
    if (!silent) {
        addSystemMessage(`✨ 触发随机事件：${ev.name}——${ev.description}`);
        addToHistory(`<p class="other-message">✨ 随机事件：${ev.name}——${ev.description}</p>`);
    }
    return change;
}

function checkSpecialDialogueCondition(player, target, charData) {
  if (player.faction === "灵门" && target.sect === "还真" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "万炼雷池之威，可敢一试？"; }
  if (player.surname === "张" && player.name === "衍" && target.surname === "张" && target.name === "蓁" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "兄长要此物，可是弟子中有人中了魔毒么？"; }
  if (player.surname === "司马" && player.name === "权" && target.sect === "还真" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "冥泉宗的长老？"; }
  if (player.surname === "秦" && player.name === "墨白" && target.surname === "沈" && target.name === "柏霜" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "明天我想去喂赢妫。"; }
  if (player.face >= 90 && target.face >= 90 && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "道友风姿不凡。"; }
  if (player.surname === "张" && player.name === "衍" && target.sect === "少清" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "可惜道友非我少清门下"; }
  if (player.surname === "秦" && player.name === "墨白" && target.surname === "晏" && target.name === "长生" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "秦墨白……"; }
  if (player.surname === "晏" && player.name === "长生" && target.surname === "秦" && target.name === "墨白" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "大师兄。"; }
  if ((player.surname === "张" && player.name === "衍" || player.sect === "冥泉") && target.surname === "司马" && target.name === "权" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "我想回冥泉"; }
  if (player.surname === "陶" && player.name === "真宏" && target.surname === "张" && target.name === "衍" && !charData.specialDialogueTriggered && Math.random() < 0.04) { charData.specialDialogueTriggered = true; return "真人欲见我，我自是能走到真人面前，真人若是不欲见我，我再使力也是见不到真人。"; }
  if (player.surname === "岳" && player.name === "轩霄" && ((target.surname === "戚" && target.name === "宏禅") || (target.surname === "濮" && target.name === "玄升")) && !charData.specialDialogueTriggered && Math.random() < 0.02) { charData.specialDialogueTriggered = true; return "少清、溟沧联手，玄门两大派站在一处，便与天下为敌又如何？"; }
  return null;
}

function getAvailableCharacters() { 
    return gameState.allCharacters; 
}

// ---------- 1.5 核心改动：分离要闻检测 ----------
function checkAndTriggerNewsAlert() {
    // 如果已经有要闻在排队，就不再触发
    if (gameState.newsReady) return; 
    
    if (gameState.eventMessageIndex !== undefined && gameState.eventMessageIndex < gameData.globalEventMessages.length) {
        // 每次行动有 3% 概率触发要闻排队
        if (Math.random() < 0.03) { 
            gameState.newsReady = true;
            const btn = document.getElementById('newFriendBtn');
            if (btn) {
                btn.textContent = '📰 查阅要闻';
            }
        }
    }
}

// ---------- 2. 抽取流程 ----------
function meetNewCharacter() {
    const newFriendBtn = document.getElementById('newFriendBtn');
    
    // 【拦截检查】：如果按钮现在是“查阅要闻”状态，点它就只显示要闻，不抽人！
    if (gameState.newsReady) {
        if (newFriendBtn) {
            newFriendBtn.disabled = true;
            newFriendBtn.style.opacity = '0.6';
            newFriendBtn.style.cursor = 'not-allowed';
        }
        const message = gameData.globalEventMessages[gameState.eventMessageIndex];
        gameState.eventMessageIndex++;
        gameState.newsReady = false; // 重置状态
        
        addToHistory(`<p class="other-message" style="background:#e6f7ff;">📰 东华洲要闻：${message}</p>`);
        saveGame();
        showEventModal(message); // 弹窗关闭时会把按钮变回“抽取新道友”
        return; 
    }

    // 正常抽取前置处理
    if (newFriendBtn) {
        newFriendBtn.disabled = true;
        newFriendBtn.style.opacity = '0.6';
        newFriendBtn.style.cursor = 'not-allowed';
    }

    if (!gameState.player) {
        addSystemMessage("请先创建角色。");
        if (newFriendBtn) {
            newFriendBtn.disabled = false;
            newFriendBtn.style.opacity = '1';
            newFriendBtn.style.cursor = 'pointer';
        }
        return;
    }

    try {
        // ---------- 触发“迁羽量胜”判断 ----------
        if (gameState.eventMessageIndex >= gameData.globalEventMessages.length) {
            let qianYuProb = 0.005; 
            if (gameState.trialPassModalShown) qianYuProb = 0;

            if (Math.random() < qianYuProb) {
                const exemptNames = ["张衍", "秦墨白", "岳轩霄", "周阳廷", "梁循义", "沈崇"];
                let killableNPCs = gameState.allCharacters.filter(c => !exemptNames.includes(c.surname + c.name));
                let playerIsKillable = !exemptNames.includes(gameState.player.surname + gameState.player.name) && gameState.player.cultivation < 90;

                if (killableNPCs.length > 0 || playerIsKillable) {
                    let candidates = killableNPCs.map(c => ({ ...c, isPlayer: false }));
                    if (playerIsKillable) candidates.push({ ...gameState.player, isPlayer: true });

                    const victim = getRandomElement(candidates);
                    handleQianYuKill(victim, victim.surname + victim.name); 
                    return; 
                }
            }
        }

        // ---------- 正常抽取 ----------
        const available = getAvailableCharacters();
        if (available.length === 0) {
            addSystemMessage(`暂无其他真人可结识（皆已大道圆满）。`);
            if (newFriendBtn) {
                newFriendBtn.disabled = false;
                newFriendBtn.style.opacity = '1';
                newFriendBtn.style.cursor = 'pointer';
            }
            return;
        }

        let selectedChar = null;
        let attempts = 0;
        while (attempts < 15) {
            const candidate = getRandomElement(available);
            const candidateId = candidate.surname + candidate.name;
            const existingData = gameState.metCharacters.get(candidateId);
            const isEnded = existingData && (existingData.favor >= 100 || existingData.relation === 'enemy');
            
            if (!isEnded || Math.random() < REUNION_PROB) {
                selectedChar = candidate;
                break;
            }
            attempts++;
        }
        if (!selectedChar) selectedChar = getRandomElement(available);

        gameState.currentCharacter = { ...selectedChar };
        const charId = gameState.currentCharacter.surname + gameState.currentCharacter.name;
        let charData = gameState.metCharacters.get(charId);

        if (!charData) {
            charData = {
                character: gameState.currentCharacter, favor: calculateInitialFavor(),
                talks: 0, specialDialogueTriggered: false, isAdvancedSimaQuan: false,
                favorMaxed: false, relation: 'none'
            };
            gameState.metCharacters.set(charId, charData);
            gameState.isFirstEncounter = true;
            displayEncounterInfo(charData.favor);
        } else {
            if (charData.relation === 'enemy' && Math.random() < 0.5) {
                const loss = 5;
                gameState.player.insightPoints = Math.max(0, (gameState.player.insightPoints || 0) - loss);
                addSystemMessage(`⚠️ 怨侣重逢！${charId} 的干扰让你损失了 ${loss} 点感悟！`);
                refreshPlayerInsightUI();
            }
            charData.talks = 0;
            gameState.isFirstEncounter = false;
            
            const isEnded = charData.favor >= 100 || charData.relation === 'enemy';
            if (isEnded) renderEndgameReunion(charId, charData);
            else displayReencounterInfo(charData.favor);
        }

        gameState.canTalk = (charData.favor < 100 && charData.relation !== 'enemy');
        gameState.randomEventTriggered = false;
        document.getElementById('currentInteraction').textContent = charId;
        displayCurrentCharacter();
        
        if (gameState.canTalk) prepareHobbySelection();
        else document.getElementById('options').innerHTML = "";

        updateStats();
        updateRanking();
        
        // 抽取结束，检查是否要预报下一条要闻
        checkAndTriggerNewsAlert();
        saveGame();

    } catch (e) {
        console.error("抽取失败:", e);
        addSystemMessage("抽取灵机紊乱，请重试。");
    } finally {
        const modal = document.getElementById('eventModal');
        if (newFriendBtn && (!modal || modal.style.display !== 'flex')) {
            newFriendBtn.disabled = false;
            newFriendBtn.style.opacity = '1';
            newFriendBtn.style.cursor = 'pointer';
        }
    }
}

function renderEndgameReunion(charId, charData) {
    document.getElementById('dialogueBox').innerHTML = '';
    let dialogue = "……";
    if (charData.relation === 'companion') {
        dialogue = getRandomElement(gameData.enemyDialogues?.fullFavorDialogues?.default || ["道友。"]);
    } else {
        const level = getFavorLevel(charData.favor);
        dialogue = getRandomElement(gameData.enemyDialogues?.default[level] || ["哼。"]);
    }
    addDaoyouMessage(dialogue, charId, gameState.currentCharacter);
}
  
function handleHobbySelection(selectedHobby, isReal) {
    if (window.isHandlingTalk) return;
    window.isHandlingTalk = true;
    try {
        let char = gameState.currentCharacter;
        let charId = char.surname + char.name;
        let charData = gameState.metCharacters.get(charId);
        const player = gameState.player;

        charData.talks++;
        gameState.metCharacters.set(charId, charData);
        gameState.canTalk = charData.talks < 1;

        let favorChange = 0;

        addPlayerMessage(`你对 ${charId} 提及【${selectedHobby}】`);

        const isEnded = charData.favor >= 100 || charData.relation === 'enemy';
        const useEndgameLogic = isEnded || (charData.relation === 'companion' && !isReal);

        if (!useEndgameLogic) {
            const special = checkSpecialDialogueCondition(player, gameState.currentCharacter, charData);
            if (special) {
                addDaoyouMessage(special, charId, char);
            } else {
                if (charData.favor >= 100) {
                    const pool = gameData.enemyDialogues?.fullFavorDialogues?.default || ["……"];
                    const dialogue = getRandomElement(pool);
                    const daoyouMsg = isReal ? `【${selectedHobby}】${dialogue}` : dialogue;
                    addDaoyouMessage(daoyouMsg, charId, char);
                }
                else if (charData.relation === 'enemy') {
                    const level = getFavorLevel(charData.favor);
                    const enemyPool = gameData.enemyDialogues?.default || gameData.dialogues.default;
                    const dialogue = getRandomElement(enemyPool[level] || enemyPool[0] || ["……"]);
                    const daoyouMsg = isReal ? `【${selectedHobby}】${dialogue}` : dialogue;
                    addDaoyouMessage(daoyouMsg, charId, char);
                } else {
                    if (isReal) {
                        const level = getFavorLevel(charData.favor);
                        const pool = gameData.dialogues[selectedHobby] || gameData.dialogues.default;
                        const dialogue = getRandomElement(pool[level] || pool[0] || ["……"]);
                        const daoyouMsg = `【${selectedHobby}】${dialogue}`;
                        addDaoyouMessage(daoyouMsg, charId, char);

                        const playerAllRealHobbies = [...(player.hobbies || []), ...(player.giftedHobbies || [])];
                        if (playerAllRealHobbies.includes(selectedHobby)) {
                            favorChange = 10;
                            if (player.giftedHobbies && player.giftedHobbies.includes(selectedHobby)) {
                                favorChange += 3;
                                addSystemMessage(`由于你对「${selectedHobby}」有回礼感悟，交谈格外投机！`);
                            }
                        } else {
                            favorChange = 5;
                        }
                    } else {
                        let specialTriggered = false;
                        if (charData.favor <= 20 && Math.random() < 0.3) {
                            const specialLine = getLowFavorSpecialLine(player, char);
                            if (specialLine) {
                                addDaoyouMessage(specialLine, charId, char);
                                specialTriggered = true;
                                favorChange = 0;
                            }
                        }
                        if (!specialTriggered) {
                            const level = getFavorLevel(charData.favor);
                            const pool = gameData.dialogues.default;
                            const dialogue = getRandomElement(pool[level] || pool[0]);
                            addDaoyouMessage(dialogue, charId, char);
                            favorChange = -5;
                        }
                    }
                }
            }

            const randomEventChange = handleRandomEvent(false);
            favorChange += randomEventChange;

            const oldFavor = charData.favor;
            charData.favor = Math.max(0, Math.min(100, oldFavor + favorChange));
            const actualChange = charData.favor - oldFavor;
            gameState.metCharacters.set(charId, charData);

            if (favorChange > 0) addSystemMessage(`好感度 +${favorChange}`);
            else if (favorChange < 0) addSystemMessage(`好感度 ${favorChange}`);
            else addSystemMessage(`好感度无变化`);

        } else {
            let baseChange = 0;
            const playerAllRealHobbies = [...(player.hobbies || []), ...(player.giftedHobbies || [])];

            if (isReal) {
                if (playerAllRealHobbies.includes(selectedHobby)) {
                    baseChange = 10;
                    if (player.giftedHobbies && player.giftedHobbies.includes(selectedHobby)) {
                        baseChange += 3;
                    }
                } else {
                    baseChange = 5;
                }
            } else {
                baseChange = -5;
                if (player.cultivation - char.cultivation >= 25) baseChange += getRandomInt(0, 1);
                if (player.face - char.face >= 25) baseChange += getRandomInt(0, 1);
                if (char.tsundere >= 90) baseChange += getRandomInt(0, 1);
            }

            if (charData.relation === 'companion' && !isReal) baseChange = baseChange * 6;
            else if (charData.relation === 'enemy' && isReal) baseChange = baseChange * 3;
            else baseChange = baseChange * 2;

            const randomChange = handleRandomEvent(true) * 2; 
            let favorChange = baseChange + randomChange;

            if (charData.relation === 'companion' && !isReal) {
                const lines = char.companionLines || (char.companionLine ? [char.companionLine] : ["……"]);
                const idx = charData.companionIndex || 0;
                const dialogue = lines[idx % lines.length];
                charData.companionIndex = idx + 1;
                addDaoyouMessage(dialogue, charId, char);
            } else if (charData.relation === 'enemy' && isReal) {
                const lines = char.enemyLines || (char.enemyLine ? [char.enemyLine] : ["……"]);
                const idx = charData.enemyIndex || 0;
                const dialogue = lines[idx % lines.length];
                charData.enemyIndex = idx + 1;
                addDaoyouMessage(dialogue, charId, char);
            }

            if (player.stance !== char.stance) {
                if (favorChange > 0) favorChange = Math.floor(favorChange / 2);
                else if (favorChange < 0) favorChange = favorChange * 2;
            }

            const oldFavor = charData.favor;
            charData.favor = Math.max(0, Math.min(100, oldFavor + favorChange));
            const actualChange = charData.favor - oldFavor;
            gameState.metCharacters.set(charId, charData);

            if (favorChange > 0) addSystemMessage(`好感度 +${favorChange}`);
            else if (favorChange < 0) addSystemMessage(`好感度 ${favorChange}`);
            else addSystemMessage(`好感度无变化`);

            if (charData.relation === 'companion' && charData.favor <= 0) {
                if (confirm(`你和 ${charId} 的关系已降至冰点！是否愿意消耗10点修为挽回这段感情？`)) {
                    if (gameState.player.cultivation >= 10) {
                        gameState.player.cultivation -= 10;
                        charData.favor = 1;
                        addSystemMessage(`你消耗10点修为，与 ${charId} 重归于好。`);
                        addToHistory(`<p class="special-dialogue">你消耗10点修为，与 ${charId} 重归于好。</p>`);
                    } else {
                        alert(`修为不足10点，无法挽回。`);
                        charData.relation = 'enemy';
                        charData.favor = 0;
                        addSystemMessage(`修为不足，${charId} 与你恩断义绝。`);
                        addToHistory(`<p class="special-dialogue">修为不足，${charId} 与你恩断义绝。</p>`);
                    }
                } else {
                    charData.relation = 'enemy';
                    charData.favor = 0;
                    charData.favorMaxed = false;  
                    addSystemMessage(`你放弃了挽回，${charId} 与你恩断义绝。`);
                    addToHistory(`<p class="special-dialogue">你放弃了挽回，${charId} 与你恩断义绝。</p>`);
                }
                gameState.metCharacters.set(charId, charData);
                displayCurrentCharacter();
            }
        }

        if (charData.favor >= 70 && Math.random() < 0.1) tryGiveGift(char, charData);
        
        if (charData.favor >= 100 && !charData.favorMaxed) {
            charData.favorMaxed = true;

            if (charData.relation === 'enemy') {
                if (confirm(`你与 ${charId} 好感已满，但你们现在是仇敌。是否愿意消耗10点修为，与对方重修旧好？`)) {
                    if (gameState.player.cultivation >= 10) {
                        gameState.player.cultivation -= 10;
                        charData.relation = 'companion';
                        charData.wasEnemyBefore = true; 
                        const extraCultivation = getRandomInt(0, 20); 
                        gameState.player.cultivation += extraCultivation;
                        addSystemMessage(`重修旧好，你意外获得 ${extraCultivation} 点修为！`);
                        const specialLine = char.companionLine;
                        if (specialLine && specialLine.trim() !== "") {
                            addSpecialMessage(specialLine, char);
                            addSystemMessage(`✨ 你与 ${charId} 重修旧好，结为道侣。`);
                            addToHistory(`<p class="special-dialogue">✨ 你与 ${charId} 重修旧好，结为道侣。 ${specialLine}</p>`);
                        } else {
                            addSystemMessage(`✨ 你与 ${charId} 重修旧好，结为道侣！`);
                            addToHistory(`<p class="special-dialogue">✨ 你与 ${charId} 重修旧好，结为道侣！</p>`);
                        }
                        gameState.maxFavorCharacters++;
                        if (!gameState.maxFavorOrder) gameState.maxFavorOrder = [];
                        gameState.maxFavorOrder.push(charId);
                        updateTrialProgress();
                        saveGame();
                    } else {
                        alert(`修为不足10点，无法重修。`);
                    }
                }
            } else {
                gameState.maxFavorCharacters++;
                if (!gameState.maxFavorOrder) gameState.maxFavorOrder = [];
                gameState.maxFavorOrder.push(charId);
                updateTrialProgress();

                const newFriendBtn = document.getElementById('newFriendBtn');
                if (newFriendBtn) {
                    newFriendBtn.disabled = true;
                    newFriendBtn.style.opacity = '0.6';
                    newFriendBtn.style.cursor = 'not-allowed';
                }

                const modalCharId = charId;
                setTimeout(() => showSuccessModal(modalCharId), 600);
                checkAchievements();
                updateRanking();
                updateStats();
                saveGame();
            }
        }

        if (Math.random() < INSIGHT_CHANCE) {
            let canGainInsight = true;
            if (char.cultivation >= 80 && player.cultivation < 80) canGainInsight = false;
            if (char.cultivation >= 90 && player.cultivation < 90) canGainInsight = false;
            if (canGainInsight) {
                player.insightPoints = Math.round((player.insightPoints || 0) * 10 + 1) / 10;
                addSystemMessage(`你对大道有所感悟，获得0.1点感悟。`);
                while (player.insightPoints >= 10) {
                    player.cultivation++;
                    player.insightPoints -= 10;
                    addSystemMessage(`✨ 感悟圆满！修为提升至 ${player.cultivation}！`);
                }
                refreshPlayerInsightUI();
            }
        }

        if (isSimaQuan(gameState.currentCharacter) && charData.favor >= 80 && !charData.isAdvancedSimaQuan) {
            removeCharacterFromPool("司马权");
            const advanced = { ...gameData.simaQuanAdvanced, hobbies: [...gameData.simaQuanAdvanced.hobbies] };
            addCharacterToPool(advanced);
            gameState.currentCharacter = advanced;
            gameState.metCharacters.delete("司马权");
            const newCharId = "天魔司马权";
            const newCharData = { 
                character: advanced, favor: charData.favor, talks: charData.talks, 
                specialDialogueTriggered: charData.specialDialogueTriggered, 
                isAdvancedSimaQuan: true, favorMaxed: charData.favorMaxed || false, 
                relation: charData.relation || 'none', companionIndex: charData.companionIndex || 0,
                enemyIndex: charData.enemyIndex || 0
            };
            gameState.metCharacters.set(newCharId, newCharData);
            char = advanced; charId = newCharId; charData = newCharData;
            const evolutionHtml = `<div class="evolution-message"><strong>仰吞初阳火，炼得天魔身，倒卷地灵气，相成阴中神！司马权气息突变，成就天魔之身！</strong></div>`;
            addSystemMessage(evolutionHtml);
            addToHistory(evolutionHtml);
            
            if (charData.favor >= 100) {
                if (charData.favorMaxed && charData.relation === 'none') charData.favorMaxed = false;
                if (!charData.favorMaxed) {
                    charData.favorMaxed = true;
                    gameState.maxFavorCharacters++;
                    gameState.maxFavorOrder.push(newCharId);
                    updateTrialProgress();
                    setTimeout(() => showSuccessModal(newCharId), 600);
                    checkAchievements();
                    updateRanking();
                    updateStats();
                    saveGame();
                }
            }
        }

        displayCurrentCharacter();
        updateStats();
        updateRanking();
        refreshPlayerInsightUI();
        const optionsDiv = document.getElementById('options');
        optionsDiv.innerHTML = "";

        if (charData.talks >= 1 && charData.favor < 100) {
            const special = checkSpecialDialogueCondition(player, gameState.currentCharacter, charData);
            if (special) addDaoyouMessage(special, charId, char);
            else addSystemMessage(`已交流1次，请抽取新道友。`);
        }
        
        // 动作结束，检查预报要闻
        checkAndTriggerNewsAlert();
        saveGame();
        checkAchievements();   
    } finally {
        window.isHandlingTalk = false;
    }
}

// ---------- 物品使用 ----------
window.useItem = function(index) {
  if (!gameState.player || !gameState.player.inventory) return;
  const item = gameState.player.inventory[index];
  if (!item) return;

  gameState.player.cultivation = (gameState.player.cultivation || 0) + 0.2;

  const char = gameState.currentCharacter;
  if (char) {
    const charId = char.surname + char.name;
    const charData = gameState.metCharacters.get(charId);
    if (charData) {
      const oldFavor = charData.favor;
      const favorGain = getRandomInt(0, 10);
      charData.favor = Math.min(100, oldFavor + favorGain);
      const actualChange = charData.favor - oldFavor;
      addSystemMessage(`🎁 你将【${item.name || item.hobby}】赠予 ${charId}，好感度 +${favorGain}！`);

      if (actualChange >= 10) {
          if (charData.relation === 'companion' && charData.favorMaxed) {
              const lines = char.companionLines || [];
              if (lines.length > 0) {
                  const idx = charData.companionIndex || 0;
                  const dialogue = lines[idx % lines.length];
                  charData.companionIndex = (idx + 1) % lines.length;
                  addDaoyouMessage(dialogue, charId, char);
              }
          }
          else if (charData.relation === 'enemy') {
              const lines = char.enemyLines || [];
              if (lines.length > 0) {
                  const idx = charData.enemyIndex || 0;
                  const dialogue = lines[idx % lines.length];
                  charData.enemyIndex = (idx + 1) % lines.length;
                  addDaoyouMessage(dialogue, charId, char);
              }
          }
      }

      if (charData.favor >= 100 && !charData.favorMaxed) {
          charData.favorMaxed = true;
          if (charData.relation === 'enemy') {
              if (confirm(`你与 ${charId} 好感已满，但你们现在是仇敌。是否愿意消耗10点修为，与对方重修旧好？`)) {
                  if (gameState.player.cultivation >= 10) {
                      gameState.player.cultivation -= 10;
                      charData.relation = 'companion';
                      gameState.player.cultivation += 0.3;
                      const specialLine = char.companionLine;
                      if (specialLine && specialLine.trim() !== "") {
                          addSpecialMessage(specialLine, char);
                          addSystemMessage(`✨ 你与 ${charId} 重修旧好，结为道侣。`);
                          addToHistory(`<p class="special-dialogue">✨ 你与 ${charId} 重修旧好，结为道侣。 ${specialLine}</p>`);
                      } else {
                          addSystemMessage(`✨ 你与 ${charId} 重修旧好，结为道侣！`);
                          addToHistory(`<p class="special-dialogue">✨ 你与 ${charId} 重修旧好，结为道侣！</p>`);
                      }
                      gameState.maxFavorCharacters++;
                      if (!gameState.maxFavorOrder) gameState.maxFavorOrder = [];
                      gameState.maxFavorOrder.push(charId);
                      updateTrialProgress();
                      saveGame();
                  } else {
                      alert(`修为不足10点，无法重修。`);
                  }
              }
          } else {
              gameState.maxFavorCharacters++;
              if (!gameState.maxFavorOrder) gameState.maxFavorOrder = [];
              gameState.maxFavorOrder.push(charId);
              updateTrialProgress();         
              setTimeout(() => showSuccessModal(charId), 600); 
              checkAchievements();             
              updateRanking();              
              updateStats();                 
              saveGame();
              checkAchievements();
          }
      }
      
      if (charData.favor >= 70 && Math.random() < 0.1) tryGiveGift(char, charData);
    }
  }

  if (!gameState.player.receivedGiftHobbies.includes(item.hobby)) gameState.player.receivedGiftHobbies.push(item.hobby);
  if (!gameState.player.usedGiftHobbies) gameState.player.usedGiftHobbies = [];
  if (!gameState.player.usedGiftHobbies.includes(item.hobby)) gameState.player.usedGiftHobbies.push(item.hobby);
  
  gameState.player.inventory.splice(index, 1);
  refreshPlayerInsightUI();
  refreshInventoryUI();
  displayCurrentCharacter();
  updateRanking();
  updateStats();
  
  checkAndTriggerNewsAlert();
  saveGame();
};

// ========== 送礼逻辑（唯一礼物） ==========
function tryGiveGift(char, charData) {
  if (charData.favor < 70) return; 

  const obtained = gameState.player.receivedGiftHobbies || [];
  const availableGifts = GIFTS.filter(gift => 
    !obtained.includes(gift.hobby) && isGiftOwner(char, gift.owners)
  );

  if (availableGifts.length === 0) return;

  const selectedGift = getRandomElement(availableGifts);
  const hobby = selectedGift.hobby;
  const itemName = selectedGift.name;

  if (!gameState.player.inventory) gameState.player.inventory = [];
  gameState.player.inventory.push({ hobby, name: itemName });

  if (!obtained.includes(hobby)) {
    gameState.player.receivedGiftHobbies.push(hobby);
    if (!gameState.player.giftedHobbies) gameState.player.giftedHobbies = [];
    if (!gameState.player.giftedHobbies.includes(hobby)) {
      gameState.player.giftedHobbies.push(hobby);
    }
  }

  addSystemMessage(`✨ ${char.surname + char.name} 赠与你【${itemName}】（${hobby}类）！`);
  addToHistory(`<p class="other-message" style="background:#e8f5e8;">🎁 ${char.surname + char.name} 赠与你【${itemName}】</p>`);
  refreshInventoryUI();
}

// ========== 满好感弹窗 ==========
let successModalTimer = null;

function setModalButtonsEnabled(enabled) {
    const btns = ['companionBtn', 'enemyBtn', 'continueBtn', 'exitBtn'].map(id => document.getElementById(id));
    btns.forEach(btn => {
        if (btn) {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '' : '0.5';
            btn.style.cursor = enabled ? '' : 'not-allowed';
        }
    });
}

function clearModalTimerAndEnable() {
    if (successModalTimer) {
        clearTimeout(successModalTimer);
        successModalTimer = null;
    }
    setModalButtonsEnabled(true);
    const newFriendBtn = document.getElementById('newFriendBtn');
    if (newFriendBtn) {
        newFriendBtn.disabled = false;
        newFriendBtn.style.opacity = '1';
        newFriendBtn.style.cursor = 'pointer';
    }
}

function showSuccessModal(charName) {
    const charData = gameState.metCharacters.get(charName);
    if (!charData || charData.favor < 100) return;
    if (!gameState.currentCharacter || (gameState.currentCharacter.surname + gameState.currentCharacter.name) !== charName) return;

    const successModal = document.getElementById('successModal');
    const modalMessage = document.getElementById('modalMessage');
    if (successModal.style.display === 'flex') return;

    clearModalTimerAndEnable();
    modalMessage.textContent = `恭喜！${gameState.player.surname + gameState.player.name}与道友${charName}好感度已达满值，共赴大道之约！`; 
    successModal.style.display = "flex";

    const newFriendBtn = document.getElementById('newFriendBtn');
    if (newFriendBtn) {
        newFriendBtn.disabled = true;
        newFriendBtn.style.opacity = '0.6';
        newFriendBtn.style.cursor = 'not-allowed';
    }

    // ==========================================
    // 👇👇👇 修复假死错觉的核心修改部分 👇👇👇
    // ==========================================
    setModalButtonsEnabled(false);
    
    // 1. 获取按钮并给出视觉反馈，防止玩家以为游戏卡死
    const companionBtn = document.getElementById('companionBtn');
    // 保存原本的按钮文字（防备原本叫别的名字）
    const originalText = companionBtn ? companionBtn.textContent : '❤️ 结为道侣'; 
    if (companionBtn) {
        companionBtn.textContent = '💓 心动中...'; 
    }

    // 2. 将原本的 3000ms (3秒) 缩短为 800ms (0.8秒)
    successModalTimer = setTimeout(() => {
        setModalButtonsEnabled(true);
        // 3. 倒计时结束后恢复原本的按钮文字
        if (companionBtn) {
            companionBtn.textContent = originalText;
        }
        successModalTimer = null;
    }, 800); 
    // ==========================================
    // 👆👆👆 修改结束 👆👆👆
    // ==========================================

    showFireworks(); 
    updateStats(); 
}
// ========== 关系设置 ==========
let isSettingRelation = false;
function setRelation(type) {
    if (isSettingRelation) return;
    isSettingRelation = true;

    const char = gameState.currentCharacter;
    if (!char) {
        isSettingRelation = false;
        return;
    }

    const companionBtn = document.getElementById('companionBtn');
    const enemyBtn = document.getElementById('enemyBtn');
    if (companionBtn) companionBtn.disabled = true;
    if (enemyBtn) enemyBtn.disabled = true;

    try {
        const charId = char.surname + char.name;
        const charData = gameState.metCharacters.get(charId);
        if (!charData) return;

        if (type === 'companion') {
            gameState.player.cultivation += 0.5;
            if (!charData.favorMaxed) {
                charData.favorMaxed = true;
                gameState.maxFavorCharacters++;
            }
            charData.relation = 'companion';

            const specialLine = char.companionLine;
            if (specialLine && specialLine.trim() !== "") {
                addSpecialMessage(specialLine, char); 
                addSystemMessage(`✨ 你与 ${charId} 结为道侣。`);
                addToHistory(`<p class="special-dialogue">✨ 你与 ${charId} 结为道侣。 ${specialLine}</p>`);
            } else {
                addSystemMessage(`✨ 你与 ${charId} 结为道侣！`);
                addToHistory(`<p class="special-dialogue">✨ 你与 ${charId} 结为道侣！</p>`);
            }
        } else if (type === 'enemy') {
            const wasFavorMaxed = charData.favorMaxed === true;
            charData.favor = 0;
            charData.favorMaxed = false;
            charData.relation = 'enemy';

            if (wasFavorMaxed) {
                gameState.maxFavorCharacters = Math.max(0, gameState.maxFavorCharacters - 1);
                if (gameState.maxFavorOrder) {
                    gameState.maxFavorOrder = gameState.maxFavorOrder.filter(id => id !== charId);
                }
            }

            const specialLine = char.enemyLine;
            if (specialLine && specialLine.trim() !== "") {
                addSpecialMessage(specialLine, char);
                addSystemMessage(`💀 你与 ${charId} 恩断义绝。`);
                addToHistory(`<p class="special-dialogue">💀 你与 ${charId} 恩断义绝。 ${specialLine}</p>`);
            } else {
                addSystemMessage(`💀 你与 ${charId} 恩断义绝，从此大道漫漫，再无携手！`);
                addToHistory(`<p class="special-dialogue">💀 你与 ${charId} 恩断义绝，从此大道漫漫，再无携手！</p>`);
            }

            if (Math.random() < 0.2) {
                const playerAllHobbies = new Set([
                    ...(gameState.player.hobbies || []),
                    ...(gameState.player.giftedHobbies || [])
                ]);
                const stealableHobbies = char.hobbies.filter(h => !playerAllHobbies.has(h));
                if (stealableHobbies.length > 0) {
                    const stolen = getRandomElement(stealableHobbies);
                    if (!gameState.player.giftedHobbies) gameState.player.giftedHobbies = [];
                    gameState.player.giftedHobbies.push(stolen);
                    addSystemMessage(`✨ 因果纠缠！你与 ${charId} 反目，却在激烈争斗中意外领悟了【${stolen}】！`);
                    addToHistory(`<p class="special-dialogue">✨ 因果纠缠！你与 ${charId} 反目，却在激烈争斗中意外领悟了【${stolen}】！</p>`);
                }
            }
        }

        const successModal = document.getElementById('successModal');
        successModal.style.display = "none";
        
        const newFriendBtn = document.getElementById('newFriendBtn');
        if (newFriendBtn) {
            newFriendBtn.disabled = false;
            newFriendBtn.style.opacity = '1';
            newFriendBtn.style.cursor = 'pointer';
        }
        refreshPlayerInsightUI();
        updateStats();
        updateTrialProgress();
        updateRanking();
        checkAchievements();
        
        checkAndTriggerNewsAlert();
        saveGame();
        displayCurrentCharacter();

    } finally {
        isSettingRelation = false;
        if (companionBtn) companionBtn.disabled = false;
        if (enemyBtn) enemyBtn.disabled = false;
    }
}

// ========== 初始化游戏 ==========
window.isHandlingTalk = false;

function initGame() {
  const nameInput = document.getElementById('nameInput');
  const fullName = nameInput.value.trim();
  if (!fullName) { showStatus("请输入姓名！", "info"); return; }

  let matched = null;
  for (let c of gameData.characters) {
    if ((c.surname + c.name) === fullName) {
      matched = { ...c };
      if (!matched.hobbies || matched.hobbies.length === 0) {
        matched.hobbies = generateHobbiesForCharacter(matched);
      }
      break;
    }
  }

  if (matched) {
    gameState.player = {
      ...matched, hobbies: [...matched.hobbies], insightPoints: 0,
      giftedHobbies: [], inventory: [], receivedGiftHobbies: [], usedGiftHobbies: []
    };
    gameState.player.hobbies = generateHobbiesForCharacter(gameState.player);
    showStatus(`匹配到已有角色：${fullName}`, "success");
  } else {
    const s = fullName.charAt(0);           
    const n = fullName.slice(1);             
    const factions = ["玄门", "灵门"];
    const faction = getRandomElement(factions);
    let sect;
    if (faction === "玄门") sect = getRandomElement(["溟沧","少清","玉霄","元阳","还真","平都","清羽","广源","补天","南华","野"]);
    else sect = getRandomElement(["冥泉","血魄","九灵","元蜃","野"]);
    
    gameState.player = {
      surname: s, name: n, title: "", face: getRandomInt(70, 95),
      cultivation: getRandomInt(60, 90), faction: faction,
      sect: sect, stance: getRandomElement(["新", "旧"]),
      hobbies: [], special: getRandomElement(["劫", "情", "劳", "殇", "转", "承"]),
      tsundere: getRandomInt(20, 90), insightPoints: 0, giftedHobbies: [], inventory: [],
      receivedGiftHobbies: [], usedGiftHobbies: []
    };
    gameState.player.hobbies = generateHobbiesForCharacter(gameState.player);
    showStatus(`未找到匹配角色，已创建新角色：${fullName}，爱好${gameState.player.hobbies.length}个`, "success");
  }

  const playerFullName = gameState.player.surname + gameState.player.name;
  gameState.allCharacters = gameState.allCharacters.filter(c => (c.surname + c.name) !== playerFullName);

  gameState.allCharacters.forEach(char => {
    if (!char.hobbies || char.hobbies.length === 0) char.hobbies = generateHobbiesForCharacter(char);
  });

  displayPlayerInfo();
  document.getElementById('playerInfo').style.display = "block";
  document.getElementById('progressContainer').style.display = "block";
  updateStats();
  refreshPlayerInsightUI();
  refreshInventoryUI();

  document.getElementById('startBtn').disabled = true;
  nameInput.disabled = true;
  meetNewCharacter();
  saveGame();
}

// ========== 按钮事件绑定 ==========
document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const nameInput = document.getElementById('nameInput');
  const newFriendBtn = document.getElementById('newFriendBtn');
  const continueBtn = document.getElementById('continueBtn');
  const exitBtn = document.getElementById('exitBtn');
  const companionBtn = document.getElementById('companionBtn');
  const enemyBtn = document.getElementById('enemyBtn');
  const continueTrialBtn = document.getElementById('continueTrialBtn');
  const restartTrialBtn = document.getElementById('restartTrialBtn');
  const manualSaveBtn = document.getElementById('manualSaveBtn');
  const clearSaveBtn = document.getElementById('clearSaveBtn');

  startBtn.addEventListener('click', initGame);
  nameInput.addEventListener('keypress', e => { if (e.key === 'Enter') initGame(); });
  newFriendBtn.addEventListener('click', meetNewCharacter);

  continueBtn.addEventListener('click', () => {
      clearModalTimerAndEnable();      
      document.getElementById('successModal').style.display = "none";
      meetNewCharacter();
  });

  exitBtn.addEventListener('click', () => {
      clearModalTimerAndEnable();
      document.getElementById('successModal').style.display = "none";
      alert("感谢游玩！");
  });

  companionBtn.addEventListener('click', () => { clearModalTimerAndEnable(); setRelation('companion'); });
  enemyBtn.addEventListener('click', () => { clearModalTimerAndEnable(); setRelation('enemy'); });
  continueTrialBtn.addEventListener('click', () => document.getElementById('trialModal').style.display = "none");

  restartTrialBtn.addEventListener('click', () => {
    document.getElementById('trialModal').style.display = "none";
    localStorage.removeItem(HISTORY_KEY);
      
    gameData.simaQuanAdvanced = {
      surname: "天魔", name: "司马权", title: "", face: 90, cultivation: 90,
      faction: "灵门", sect: "冥泉", stance: "新", hobbies: [], special: "转", tsundere: 90,
      companionLine: "天魔司马权声音低沉：「我这天魔可是举世皆敌，你当真要与我在一起？」",
      enemyLine: "司马权眼光深沉：「天魔变化万端，可出入阴阳，你分得出哪个不是我？」"
    };

    resetAllCharactersHobbies();

    gameState = {
      player: null, currentCharacter: null,
      allCharacters: gameData.characters.map(c => ({ ...c, hobbies: [...c.hobbies] })),
      metCharacters: new Map(), maxFavorCharacters: 0, maxFavorSectMasters: new Set(),
      isFirstEncounter: true, canTalk: true, randomEventTriggered: false,
      specialDialogueTriggered: false, achievementsUnlocked: [], maxFavorOrder: [],
      trialPassModalShown: false
    };
    
    nameInput.disabled = false;
    startBtn.disabled = false;
    nameInput.value = "";
    document.getElementById('playerInfo').style.display = "none";
    document.getElementById('progressContainer').style.display = "none";
    document.getElementById('options').innerHTML = "";
    newFriendBtn.disabled = true;
    newFriendBtn.style.opacity = '0.6';
    newFriendBtn.style.cursor = 'not-allowed';
    document.getElementById('actionButtons').style.display = "block";  
    document.getElementById('currentInteraction').textContent = "无";
    document.getElementById('currentCharacter').innerHTML = "";
    refreshAchievementUI();
    loadHistory();
    showStatus("游戏已重置，存档已清除。", "info");
    
    if (continueTrialBtn) continueTrialBtn.style.display = 'inline-block';
    if (restartTrialBtn) restartTrialBtn.style.display = 'none';
  });

  manualSaveBtn.addEventListener('click', () => { 
      if (gameState.player) { saveGame(); showStatus('📀 手动保存成功', 'success'); } 
      else { showStatus('请先创建角色', 'info'); } 
  });

  clearSaveBtn.addEventListener('click', () => { 
      if (confirm('重置将清除所有存档并回到标题，确定吗？')) { 
          localStorage.removeItem(SAVE_KEY); 
          localStorage.removeItem(HISTORY_KEY);
          location.reload(); 
      } 
  });
});

// ========== 特殊对话 / 成就消息 ==========
function addSpecialMessage(text, character) {
    const dialogueBox = document.getElementById('dialogueBox');
    const html = `<div class="special-dialogue-message">${text}</div>`;
    dialogueBox.insertAdjacentHTML('beforeend', html);
    dialogueBox.scrollTop = dialogueBox.scrollHeight;
}

function addSpecialAchievementMessage(text) {
    const dialogueBox = document.getElementById('dialogueBox');
    const html = `<div class="achievement-unlock-message">${text}</div>`;
    dialogueBox.insertAdjacentHTML('beforeend', html);
    dialogueBox.scrollTop = dialogueBox.scrollHeight;
}

// ========== 成就系统 ==========
function checkAchievements() {
  if (!gameState.achievementsUnlocked) gameState.achievementsUnlocked = [];
  ACHIEVEMENTS.forEach(ach => {
    if (!gameState.achievementsUnlocked.includes(ach.id) && ach.check(gameState)) {
      unlockAchievement(ach.id);
    }
  });
}

function unlockAchievement(achId) {
  if (!gameState.achievementsUnlocked) gameState.achievementsUnlocked = [];
  if (gameState.achievementsUnlocked.includes(achId)) return;
  gameState.achievementsUnlocked.push(achId);
  const ach = ACHIEVEMENTS.find(a => a.id === achId);
  if (ach) {
    const msg = `🏆 成就解锁：${ach.name} —— ${ach.desc}`;
    addSpecialAchievementMessage(msg);            
    addToHistory(`<p class="special-dialogue">${msg}</p>`);
    showStatus(`🏆 成就「${ach.name}」已达成！`, 'success');
  }
  refreshAchievementUI();
  saveGame();
}

// ========== 3. 修复：极速展示与文字重置的要闻弹窗 ==========
function showEventModal(message) {
    const modal = document.getElementById('eventModal');
    const msgDiv = document.getElementById('eventModalMessage');
    const confirmBtn = document.getElementById('eventModalConfirmBtn');
    const newFriendBtn = document.getElementById('newFriendBtn');

    if (!modal || !msgDiv || !confirmBtn) return;

    msgDiv.textContent = message;
    modal.style.display = 'flex';

    // 修复 1：去掉延迟，立刻显示“已知”按钮
    confirmBtn.style.display = 'inline-block';
    
    if (window.eventModalTimer) clearTimeout(window.eventModalTimer);

    confirmBtn.onclick = function() {
        modal.style.display = 'none';
        confirmBtn.style.display = 'none';
        
        // 修复 2：按完已知后，按钮变回“抽取新道友”且恢复可用
        if (newFriendBtn) {
            newFriendBtn.textContent = '抽取新道友';
            newFriendBtn.disabled = false;
            newFriendBtn.style.opacity = '1';
            newFriendBtn.style.cursor = 'pointer';
        }
    };
}

// ========== 补全：处理点杀事件的弹窗 ==========
function handleQianYuKill(victim, victimName) {
    const modal = document.getElementById('eventModal');
    const modalTitle = document.querySelector('#eventModal .modal-title');
    const msgDiv = document.getElementById('eventModalMessage');
    const confirmBtn = document.getElementById('eventModalConfirmBtn');
    const newFriendBtn = document.getElementById('newFriendBtn');

    if (!modal || !msgDiv || !confirmBtn) return;

    modalTitle.textContent = '⚡ 迁羽量胜 ⚡';
    const spellDesc = `“迁羽量胜”之术发动！一羽定天机！`;
    const fullMessage = victim.isPlayer ? 
        `${spellDesc}\n\n💀 不幸！你被选中，当场陨落！` : 
        `${spellDesc}\n\n💀 噩耗！${victimName} 真人不幸陨落！`;
    
    msgDiv.textContent = fullMessage;
    modal.style.display = 'flex';
    
    if (window.eventModalTimer) clearTimeout(window.eventModalTimer);
    confirmBtn.style.display = 'none';

    window.eventModalTimer = setTimeout(() => {
        confirmBtn.style.display = 'inline-block';
        confirmBtn.onclick = function() {
            modal.style.display = 'none';
            confirmBtn.style.display = 'none';
            
            if (victim.isPlayer) {
                gameOver();
            } else {
                gameState.allCharacters = gameState.allCharacters.filter(c => 
                    !(c.surname === victim.surname && c.name === victim.name)
                );
                if (gameState.metCharacters.has(victimName)) {
                    gameState.metCharacters.delete(victimName);
                }
                if (gameState.qianYuKillCount !== undefined) gameState.qianYuKillCount++;
                
                // 恢复按钮状态（点杀算作探索中的意外，所以文字不修改，只恢复可点）
                if (newFriendBtn) {
                    newFriendBtn.disabled = false;
                    newFriendBtn.style.opacity = '1';
                    newFriendBtn.style.cursor = 'pointer';
                }
                
                saveGame();
                updateRanking();
                updateStats();
            }
        };
    }, 2000);
}

// ========== 游戏结束 ==========
function gameOver() {
    const newFriendBtn = document.getElementById('newFriendBtn');
    if (newFriendBtn) {
        newFriendBtn.disabled = true;
        newFriendBtn.style.opacity = '0.6';
        newFriendBtn.style.cursor = 'not-allowed';
    }
    const optionsDiv = document.getElementById('options');
    if (optionsDiv) optionsDiv.innerHTML = '';

    const modal = document.getElementById('trialModal');
    const modalTitle = document.querySelector('#trialModal .modal-title');
    const modalMessage = document.getElementById('trialMessage');
    if (modalTitle) modalTitle.textContent = '☠️ 大道陨落 ☠️';
    if (modalMessage) modalMessage.textContent = '你被“迁羽量胜”之术击中，气数已尽，当场陨落。大道之路，就此终结。';
    
    const continueBtn = document.getElementById('continueTrialBtn');
    const restartBtn = document.getElementById('restartTrialBtn');
    if (continueBtn) continueBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'inline-block';

    modal.style.display = 'flex';
    const actionButtons = document.getElementById('actionButtons');
    if (actionButtons) actionButtons.style.display = "block";
}

