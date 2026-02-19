// ========== 事件处理 ==========

// 重逢概率：抽中已达成结局（满好感/反目）的角色时，实际接受该角色的概率
const REUNION_PROB = 0.2; // 20%

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

function meetNewCharacter() {
    const newFriendBtn = document.getElementById('newFriendBtn');
    const actionButtons = document.getElementById('actionButtons');
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
        // ---------- 概率触发东华洲要闻 ----------
        if (gameState.eventMessageIndex !== undefined && 
            gameState.eventMessageIndex < gameData.globalEventMessages.length) {
            if (Math.random() < 0.025) {
                const message = gameData.globalEventMessages[gameState.eventMessageIndex];
                showEventModal(message);
                addToHistory(`<p class="other-message" style="background:#e6f7ff;">📰 东华洲要闻：${message}</p>`);
                gameState.eventMessageIndex++;
                saveGame();
                return; // 弹窗处理，此处中断流程
            }
        }

        // ---------- 触发“迁羽量胜”判断 ----------
        if (gameState.eventMessageIndex >= gameData.globalEventMessages.length) {
            let qianYuProb = 0.005; 
            if (gameState.trialPassModalShown) qianYuProb = 0;

            if (Math.random() < qianYuProb) {
                const exemptNames = ["张衍", "秦墨白", "岳轩霄", "周阳廷", "梁循义", "沈崇"];
                let killableNPCs = gameState.allCharacters.filter(c => !exemptNames.includes(c.surname + c.name));
                
                let playerIsKillable = false;
                const playerFullName = gameState.player.surname + gameState.player.name;
                if (!exemptNames.includes(playerFullName) && gameState.player.cultivation < 90) {
                    playerIsKillable = true;
                }

                if (killableNPCs.length > 0 || playerIsKillable) {
                    let candidates = killableNPCs.map(c => ({ ...c, isPlayer: false }));
                    if (playerIsKillable) candidates.push({ ...gameState.player, isPlayer: true });

                    const victim = getRandomElement(candidates);
                    const victimName = victim.surname + victim.name;
                    
                    handleQianYuKill(victim, victimName);
                    return;
                }
            }
        }

        // ---------- 正常抽取流程 ----------
        const available = getAvailableCharacters();
        if (available.length === 0) {
            addSystemMessage(`暂无其他真人可结识（皆已大道圆满）。`);
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
                character: gameState.currentCharacter,
                favor: calculateInitialFavor(),
                talks: 0,
                specialDialogueTriggered: false,
                isAdvancedSimaQuan: false,
                favorMaxed: false,
                relation: 'none'
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
            if (isEnded) {
                renderEndgameReunion(charId, charData);
            } else {
                displayReencounterInfo(charData.favor);
            }
        }

        gameState.canTalk = (charData.favor < 100 && charData.relation !== 'enemy');
        gameState.randomEventTriggered = false;
        document.getElementById('currentInteraction').textContent = charId;
        displayCurrentCharacter();
        
        if (gameState.canTalk) {
            prepareHobbySelection();
        } else {
            document.getElementById('options').innerHTML = "";
        }

        updateStats();
        updateRanking();
        saveGame();

    } catch (e) {
        console.error("抽取失败:", e);
        addSystemMessage("抽取灵机紊乱，请重试。");
    } finally {
        // 如果没有显示异步弹窗，则恢复按钮
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

function showEventModal(message) {
    const modal = document.getElementById('eventModal');
    const msgDiv = document.getElementById('eventModalMessage');
    const confirmBtn = document.getElementById('eventModalConfirmBtn');
    const newFriendBtn = document.getElementById('newFriendBtn');
    
    if (!modal || !msgDiv || !confirmBtn) return;

    confirmBtn.style.display = 'none';
    if (window.eventModalTimer) clearTimeout(window.eventModalTimer);

    msgDiv.textContent = message;
    modal.style.display = 'flex';

    window.eventModalTimer = setTimeout(() => {
        confirmBtn.style.display = 'inline-block';
        confirmBtn.onclick = function() {
            modal.style.display = 'none';
            confirmBtn.style.display = 'none';
            
            // 关闭弹窗后必须恢复按钮状态
            if (newFriendBtn) {
                newFriendBtn.disabled = false;
                newFriendBtn.style.opacity = '1';
                newFriendBtn.style.cursor = 'pointer';
            }
        };
    }, 2000);
}

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
    confirmBtn.style.display = 'none';

    setTimeout(() => {
        confirmBtn.style.display = 'inline-block';
        confirmBtn.onclick = function() {
            modal.style.display = 'none';
            if (victim.isPlayer) {
                gameOver();
            } else {
                gameState.allCharacters = gameState.allCharacters.filter(c => 
                    !(c.surname === victim.surname && c.name === victim.name)
                );
                if (gameState.metCharacters.has(victimName)) {
                    gameState.metCharacters.delete(victimName);
                }
                gameState.qianYuKillCount++;
                
                // 恢复按钮状态
                if (newFriendBtn) {
                    newFriendBtn.disabled = false;
                    newFriendBtn.style.opacity = '1';
                    newFriendBtn.style.cursor = 'pointer';
                }
                saveGame();
                updateRanking();
                updateStats();
                updateTrialProgress();
            }
        };
    }, 2000);
}
