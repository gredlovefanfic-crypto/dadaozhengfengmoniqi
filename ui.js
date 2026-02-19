// ========== UI 更新函数 ==========
function refreshInventoryUI() {
  const inventoryList = document.getElementById('inventoryList');
  if (!inventoryList) return;
  if (!gameState.player || !gameState.player.inventory || gameState.player.inventory.length === 0) {
    inventoryList.innerHTML = '<span style="color: #999; font-size: 0.85rem;">目前袋内空无一物...</span>';
    return;
  }
  let html = '';
  gameState.player.inventory.forEach((item, index) => {
    html += `<div class="inventory-item" data-index="${index}">${item.name || item.hobby}</div>`;
  });
  inventoryList.innerHTML = html;
  document.querySelectorAll('.inventory-item').forEach(el => {
    el.addEventListener('click', function(e) {
      const index = parseInt(this.getAttribute('data-index'), 10);
      window.useItem(index);
    });
  });
}

function refreshPlayerInsightUI() { 
    const playerCultivationVal = document.getElementById('playerCultivationVal');
    const playerInsightVal = document.getElementById('playerInsightVal');
    const giftedHobbiesList = document.getElementById('giftedHobbiesList');
    const usedGiftList = document.getElementById('usedGiftList');
    if (gameState.player) { 
        playerCultivationVal.textContent = (gameState.player.cultivation || 0).toFixed(1); 
        playerInsightVal.textContent = (gameState.player.insightPoints || 0).toFixed(1); 
        
        // 悟得：每个爱好加上颜色类
        const gifted = gameState.player.giftedHobbies || [];
        if (gifted.length) {
            const giftedHtml = gifted.map(h => `<span class="hobby-color-${h}">${h}</span>`).join(' ');
            giftedHobbiesList.innerHTML = giftedHtml;
        } else {
            giftedHobbiesList.textContent = '无';
        }
        
        // 已用：每个物品根据对应的爱好加上颜色类
        if (usedGiftList) {
            const used = gameState.player.usedGiftHobbies || [];
            if (used.length) {
                const usedHtml = used.map(h => {
                    const itemName = GIFT_ITEM_MAP[h] || h;
                    return `<span class="hobby-color-${h}">${itemName}</span>`;
                }).join(' ');
                usedGiftList.innerHTML = usedHtml;
            } else {
                usedGiftList.textContent = '无';
            }
        } 
    }
}

function displayCurrentCharacter() {
  const c = gameState.currentCharacter; if (!c) return;
  const charId = c.surname + c.name; const data = gameState.metCharacters.get(charId);
  let title = c.title ? `(${c.title})` : ""; let favorLevel = "未知", hearts = "", talksInfo = "";
  if (data) { 
    const f = data.favor; 
    favorLevel = f <= 10 ? "厌恶" : f <= 30 ? "萍水相逢" : f <= 50 ? "点头之交" : f <= 70 ? "朋友" : f <= 90 ? "至交" : "爱慕"; 
    
    // 判断关系
    if (data.relation === 'enemy') {
        hearts = '<span class="heart-enemy">🖤</span>';
    } else if (f === 0) {
        hearts = '<span class="heart-empty">♡</span>';
    } else if (f === 100) {
        hearts = '<span class="heart-special">💞</span>';
    } else {
        const heartCount = Math.floor(f / 10);
        hearts = '<span class="heart">♥</span>'.repeat(heartCount);
    }
    
    talksInfo = `对话: ${data.talks}/1`; 
    if (data.isAdvancedSimaQuan) title = "(天魔)"; 
}
  const sectFaction = `${c.faction}·${c.sect}`;
  const html = `<div class="character-card"><div class="name-title-row"><span class="character-name">${charId} ${title}</span><span class="character-title">${sectFaction}</span></div><div class="favor-row"><span>好感度: ${favorLevel} (${data ? data.favor : 0})</span><span class="hearts">${hearts}</span><span style="white-space:nowrap;">${talksInfo}</span></div></div>`;
  document.getElementById('currentCharacter').innerHTML = html;
}

function displayPlayerInfo() {
  if (!gameState.player) return;
  const p = gameState.player;
  const fullName = p.surname + p.name;
  const title = p.title ? `(${p.title})` : '';
  const factionSect = `${p.faction}·${p.sect}`;
  const html = `<div class="character-card">
    <div class="name-title-row">
      <span class="character-name">${fullName}${title}</span>
      <span class="character-title">${factionSect}</span>
    </div>
  </div>`;
  const characterDetails = document.getElementById('characterDetails');
  characterDetails.innerHTML = html;
}

function updateStats() { 
  const metCount = document.getElementById('metCount');
  const maxFavorCount = document.getElementById('maxFavorCount');
  const sectMasterCount = document.getElementById('sectMasterCount');
  metCount.textContent = gameState.metCharacters.size; 
  maxFavorCount.textContent = Array.from(gameState.metCharacters.values()).filter(c => c.favor >= 100).length; 
  sectMasterCount.textContent = getMaxFavorSectMasterCount(); 
}

// ---------- 好感榜分页 ----------
let rankingListData = [];
let rankingCurrentPage = 1;
const RANKING_PAGE_SIZE = 5;

function updateRanking() {
  const arr = Array.from(gameState.metCharacters.entries())
    .map(([id, d]) => ({ 
      id, name: id, favor: d.favor, 
      character: d.character, relation: d.relation
    }))
    .filter(c => c.favor > 0 || (c.favor === 0 && c.relation === 'enemy'))
    .sort((a, b) => b.favor - a.favor);
  rankingListData = arr;
  rankingCurrentPage = 1;
  renderRankingPage();
}

function renderRankingPage() {
  const rankingList = document.getElementById('rankingList');
  if (!rankingList) return;
  if (rankingListData.length === 0) { rankingList.innerHTML = '<p class="loading">暂无数据</p>'; return; }
  const totalPages = Math.ceil(rankingListData.length / RANKING_PAGE_SIZE);
  if (rankingCurrentPage < 1) rankingCurrentPage = 1;
  if (rankingCurrentPage > totalPages) rankingCurrentPage = totalPages;
  const start = (rankingCurrentPage - 1) * RANKING_PAGE_SIZE;
  const end = start + RANKING_PAGE_SIZE;
  const pageData = rankingListData.slice(start, end);
  let itemsHtml = '';
  pageData.forEach(c => {
    let hearts = '';
    if (c.relation === 'enemy') {
    hearts = '<span class="heart-enemy">🖤</span>';
} else if (c.favor === 0) {
    hearts = '<span class="heart-empty">♡</span>';
} else if (c.favor === 100) {
    hearts = '<span class="heart-special">💞</span>';
} else {
    const heartCount = Math.floor(c.favor / 10);
    hearts = '<span class="heart">♥</span>'.repeat(heartCount);
}
    itemsHtml += `<div class="ranking-item">
      <div class="ranking-info">
        <span class="ranking-name">${c.name}${c.character.title ? '(' + c.character.title + ')' : ''}</span>
        <span class="ranking-details">${c.character.faction}·${c.character.sect}</span>
      </div>
      <div class="ranking-hearts">${hearts}</div>
    </div>`;
  });
  let paginationHtml = '';
  if (totalPages > 1) {
    paginationHtml = `<div class="pagination">
      <button id="prevPageBtn" ${rankingCurrentPage === 1 ? 'disabled' : ''}>◀ 上一页</button>
      <span class="page-info">第 ${rankingCurrentPage} / ${totalPages} 页</span>
      <button id="nextPageBtn" ${rankingCurrentPage === totalPages ? 'disabled' : ''}>下一页 ▶</button>
    </div>`;
  }
  rankingList.innerHTML = itemsHtml + paginationHtml;
  const prevBtn = document.getElementById('prevPageBtn'); const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) { prevBtn.addEventListener('click', function(e) { e.stopPropagation(); if (rankingCurrentPage > 1) { rankingCurrentPage--; renderRankingPage(); } }); }
  if (nextBtn) { nextBtn.addEventListener('click', function(e) { e.stopPropagation(); if (rankingCurrentPage < totalPages) { rankingCurrentPage++; renderRankingPage(); } }); }
}

function refreshAchievementUI() {
  const grid = document.getElementById('achievementGrid');
  if (!grid) return;
  const unlocked = gameState.achievementsUnlocked || [];
  let html = '';
  ACHIEVEMENTS.forEach(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    html += `<div class="achievement-badge ${isUnlocked ? 'unlocked' : ''}">
                <span class="achievement-name">${isUnlocked ? '✔️ ' : '🔒 '}${ach.name}</span>
                <span class="achievement-desc">${ach.desc}</span>
              </div>`;
  });
  grid.innerHTML = html;
}

function showFireworks() { 
    const fireworks = document.getElementById('fireworks');
    fireworks.style.display = "block"; 
    for (let i = 0; i < 24; i++) setTimeout(() => { 
        const f = document.createElement('div'); 
        f.style.position = 'absolute'; 
        f.style.width = '4px'; 
        f.style.height = '4px'; 
        f.style.borderRadius = '50%'; 
        f.style.backgroundColor = getRandomElement(['#c03a2b','#b87333','#3c6e71','#8a6e4b','#5f7f9f']); 
        f.style.left = Math.random() * 100 + 'vw'; 
        f.style.top = Math.random() * 100 + 'vh'; 
        f.style.boxShadow = '0 0 6px currentColor'; 
        fireworks.appendChild(f); 
        setTimeout(() => f.remove(), 1300); 
    }, i * 80); 
    setTimeout(() => { fireworks.style.display = "none"; fireworks.innerHTML = ""; }, 1800); 
}

// ========== 🆕 统计满好感掌门的辅助函数 ==========
function getMaxFavorSectMasterCount() {
  let count = 0;
  for (let [id, data] of gameState.metCharacters.entries()) {
    if (data.favor >= 100 && data.character && data.character.title === "掌门") {
      count++;
    }
  }
  return count;
}

function getSpecialFavorSectMasterCount() {
  let count = 0;
  for (let [id, data] of gameState.metCharacters.entries()) {
    if (data.favor >= 100 && data.character && data.character.title === "掌门") {
      const c = data.character;
      if ( (c.sect === "溟沧" || c.sect === "少清" || c.sect === "玉霄") ||
           (c.surname === "梁" && c.name === "循义") ) {
        count++;
      }
    }
  }
  return count;
}

function isPlayerSpecialMaster() {
  if (!gameState.player) return false;
  const p = gameState.player;
  if (p.title !== "掌门") return false;
  return (p.sect === "溟沧" || p.sect === "少清" || p.sect === "玉霄") ||
         (p.surname === "梁" && p.name === "循义");
}

function checkTrialPassCondition() {
    if (!gameState.player) return { triggered: false, ending: null };
    // 迁羽量胜至少发动5次后才允许触发结局
    if ((gameState.qianYuKillCount || 0) < 5) return { triggered: false, ending: null };

    const newHeaven = countNewHeavenMasters();
    const union = countUnionMasters();
    const allCompanions = countAllCompanions();
    const allEnemies = countAllEnemies();
    const lingmenMasters = countLingmenMasters();
    const playerCult = gameState.player.cultivation; // 直接获取修为数值

    // 结局A：新天飞升（新天阵营主导）
    if (newHeaven >= 4 && union <= 2 && playerCult >= 90) {
        return { triggered: true, ending: 'NEW_HEAVEN' };
    }
    // 结局B：化合飞升（化合九洲阵营主导）
    if (union >= 5 && newHeaven <= 2 && playerCult >= 90) {
        return { triggered: true, ending: 'UNION' };
    }
    // 结局C：平衡飞升（两大阵营势均力敌）
    if (newHeaven >= 3 && union >= 3 && playerCult >= 80) {
        return { triggered: true, ending: 'BALANCE' };
    }
    // 结局D：孤独飞升（修为极高，但几乎没有道侣）
    if (playerCult >= 95 && allCompanions <= 2) {
        return { triggered: true, ending: 'LONELY' };
    }
    // 结局E：魔道飞升（与大量人反目，且与灵门掌管道侣较多）
    if (allEnemies >= 10 && lingmenMasters >= 3 && playerCult >= 95) {
        return { triggered: true, ending: 'DEMON' };
    }
    // 结局F：凡尘证道（至少一个道侣）
    if (allCompanions >= 1 && playerCult >= 80) {
        return { triggered: true, ending: 'NORMAL' };
    }

    // 保底：只要点杀次数达到5次，就触发寂灭飞升结局
    if ((gameState.qianYuKillCount || 0) >= 5) {
        return { triggered: true, ending: 'VOID' };
    }

    // 默认不触发
    return { triggered: false, ending: null };
}
function updateTrialProgress() {
  if (!gameState.player) return;
  
  const killCount = gameState.qianYuKillCount || 0;
  const target = 5;  // 触发结局所需点杀次数
  const progressPercent = Math.min(100, (killCount / target) * 100);
  
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (progressFill) progressFill.style.width = `${progressPercent}%`;
  if (progressText) progressText.textContent = `${killCount}/${target} 点杀`;

  // 保留结局检查（无需改动）
  const result = checkTrialPassCondition();
  if (result.triggered) {
    showTrialPassModal(result.ending);
  }
}
function showTrialPassModal(ending) {
    if (gameState.trialPassModalShown) return;
    gameState.trialPassModalShown = true;

    const player = gameState.player; 
    const playerFullName = player.surname + player.name;
    const playerFaction = player.faction; // "玄门" 或 "灵门"
    const playerSect = player.sect; // 具体门派，如 "溟沧"
    const playerCult = player.cultivation.toFixed(1);
    const isXuammen = playerFaction === "玄门";
    const isLingmen = playerFaction === "灵门";

    let title = "";
    let message = "";

    switch (ending) {
        case 'VOID':
            title = "🌫️ 寂灭·归虚";
            message = `${playerFullName}真人！\n\n`;
            if (isXuammen) message += `您出身玄门，未与任何修士结为道侣，也未达到绝世修为。`;
            else if (isLingmen) message += `您出身灵门，孤身行走，却终究无人相伴。`;
            else message += `您未与任何修士结为道侣，也未达到绝世修为。`;
            message += `在人劫中历经生死，大道苍茫。`;
            break;

        case 'NEW_HEAVEN':
            title = "⚔️ 新天·开辟";
            message = `${playerFullName}真人！\n\n`;
            if (isXuammen) {
                if (ASCENSION_SECTS.includes(playerSect)) {
                    message += `您身为${playerSect}真人，本就是溟沧少清的中坚，`;
                } else {
                    message += `您虽出身${playerSect}，却选择与溟沧少清携手，`;
                }
            } else if (isLingmen) {
                message += `您出身灵门，却与溟沧、少清诸位掌门结为道侣，`;
            } else {
                message += `您与溟沧、少清诸位掌门结为道侣，`;
            }
            message += `凭借高深修为（${playerCult}）带领溟沧少清一派共举大业。玉霄、灵门或降或亡，您随溟沧少清飞升，成就无上伟业！`;
            break;

        case 'UNION':
            title = "🌑 九洲·逆转";
            message = `${playerFullName}真人！\n\n`;
            if (isXuammen) {
                if (CONSERVATIVE_SECTS.includes(playerSect)) {
                    message += `您身为${playerSect}真人，本属玉霄灵门阵营，`;
                } else {
                    message += `您出身${playerSect}，却倒向玉霄灵门阵营，`;
                }
            } else if (isLingmen) {
                message += `您出身灵门，与玉霄、灵门诸位掌门结为道侣，`;
            } else {
                message += `您与玉霄、灵门诸位掌门结为道侣，`;
            }
            message += `凭借高深的修为（${playerCult}）反将溟沧、少清压制。九州格局从此改写。`;
            break;

        case 'BALANCE':
            title = "☯️ 大道之约";
            message = `${playerFullName}真人！\n\n`;
            if (isXuammen) {
                message += `您身为玄门修士，`;
            } else if (isLingmen) {
                message += `您身为灵门修士，`;
            } else {
                message += `您`;
            }
            message += `同时赢得了两大阵营大半掌门的倾心，双方在您的感召下放下成见，共举飞升。您凭借中正平和的修为（${playerCult}）调和阴阳，九州迎来真正的和平。`;
            break;

        case 'LONELY':
            title = "🗻 独证·飞升";
            message = `${playerFullName}真人！\n\n`;
            if (isXuammen) message += `您是玄门中人，`;
            else if (isLingmen) message += `您是灵门中人，`;
            else message += `您`;
            message += `以绝世修为（${playerCult}）大道独行，背影留在人间传说中。`;
            break;

        case 'DEMON':
            title = "💀 魔临·天下";
            message = `${playerFullName}真人！\n\n`;
            if (isLingmen) {
                message += `您身为灵门修士，与多位同道掌门结为道侣，`;
            } else {
                message += `您虽出身玄门，却与灵门多位掌门结为道侣，`;
            }
            message += `同时与大量修士反目成仇（敌人总数 ${countAllEnemies()}）。您（${playerCult}）震慑九州，灵门因您而昌盛！`;
            break;

        case 'NORMAL':
        default:
            title = "❀ 凡尘·证道";
            message = `${playerFullName}真人！\n\n`;
            if (isXuammen) message += `您作为玄门修士，`;
            else if (isLingmen) message += `您作为灵门修士，`;
            else message += `您`;
            message += `未能在九州留下惊天动地的传说，但凭借稳扎稳打的修为（${playerCult}）和几位知己（道侣 ${countAllCompanions()} 人），终究渡过人劫。平淡，也是一种福气。`;
            break;
    }
	
	 // ===== 添加道侣被杀的特殊描述（所有结局共享）=====
    const killed = gameState.killedCompanions || 0;
    if (killed > 0) {
        message += `\n\n你永远无法忘记，在修行路上，有 ${killed} 位道侣惨遭迁羽量胜毒手。这份伤痛刻在道心深处。`;
    }

    document.getElementById('trialMessage').textContent = message;
    const modalTitle = document.querySelector('#trialModal .modal-title');
    if (modalTitle) modalTitle.textContent = title;

    const trialModal = document.getElementById('trialModal');
    trialModal.style.display = "flex"; 
    showFireworks();

    addToHistory(`<p class="special-dialogue">${title}：${message.replace(/\n/g, ' ')}</p>`);
}
  // ========== 多结局统计函数 ==========
function countNewHeavenMasters() {
    let count = 0;
    for (let [id, data] of gameState.metCharacters.entries()) {
        if (data.favor >= 100 && data.relation === 'companion' && data.character && data.character.title === "掌门") {
            if (ASCENSION_SECTS.includes(data.character.sect)) {
                count++;
            }
        }
    }
    return count;
}

function countUnionMasters() {
    let count = 0;
    for (let [id, data] of gameState.metCharacters.entries()) {
        if (data.favor >= 100 && data.relation === 'companion' && data.character && data.character.title === "掌门") {
            if (CONSERVATIVE_SECTS.includes(data.character.sect)) {
                count++;
            }
        }
    }
    return count;
}

// 统计玩家所有道侣总数（不计掌门身份）
function countAllCompanions() {
    let count = 0;
    for (let [id, data] of gameState.metCharacters.entries()) {
        if (data.favor >= 100 && data.relation === 'companion') {
            count++;
        }
    }
    return count;
}

// 统计玩家所有反目敌人总数
function countAllEnemies() {
    let count = 0;
    for (let [id, data] of gameState.metCharacters.entries()) {
        if (data.relation === 'enemy') {
            count++;
        }
    }
    return count;
}

// 统计灵门（魔道）掌门的道侣数量
function countLingmenMasters() {
    let count = 0;
    for (let [id, data] of gameState.metCharacters.entries()) {
        if (data.favor >= 100 && data.relation === 'companion' && data.character && data.character.title === "掌门") {
            if (data.character.faction === "灵门") {
                count++;
            }
        }
    }
    return count;
}

// 获取玩家修为等级（用于判定）
function getPlayerCultivationLevel() {
    if (!gameState.player) return 0;
    const cult = gameState.player.cultivation;
    if (cult >= 95) return 5;      // 绝世高手
    if (cult >= 85) return 4;      // 高阶
    if (cult >= 70) return 3;      // 中阶
    if (cult >= 50) return 2;      // 低阶
    return 1;                       // 萌新
}


/**
 * 大道攻略 - 话题悬浮解释逻辑
 */
const TooltipManager = {
    el: document.getElementById('hobbyTooltip'),
    
    init() {
        // 使用事件委托，效率更高，且支持动态生成的“话题”按钮
        document.addEventListener('mouseover', (e) => {
            // 假设你的话题元素有 'hobby-item' 这个 class
            // 或者根据你的 data.js 定义，识别特定的属性
            const target = e.target.closest('.hobby-item') || e.target.closest('[data-hobbystr]');
            
            if (target) {
                const tipText = target.getAttribute('data-tip') || "此话题深不可测...";
                this.show(tipText, e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.el.style.display === 'block') {
                this.move(e);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('.hobby-item') || e.target.closest('[data-hobbystr]')) {
                this.hide();
            }
        });
    },

    show(text, e) {
        this.el.innerHTML = text;
        this.el.style.display = 'block';
        this.el.style.opacity = '1';
        this.move(e);
    },

    move(e) {
        // 计算位置，防止超出屏幕右侧或底部
        let x = e.clientX + 15;
        let y = e.clientY + 15;

        const tipWidth = this.el.offsetWidth;
        const tipHeight = this.el.offsetHeight;

        if (x + tipWidth > window.innerWidth) {
            x = e.clientX - tipWidth - 15;
        }
        if (y + tipHeight > window.innerHeight) {
            y = e.clientY - tipHeight - 15;
        }

        this.el.style.left = `${x}px`;
        this.el.style.top = `${y}px`;
    },

    hide() {
        this.el.style.display = 'none';
        this.el.style.opacity = '0';
    }
};

// 页面加载后启动
window.addEventListener('DOMContentLoaded', () => TooltipManager.init());