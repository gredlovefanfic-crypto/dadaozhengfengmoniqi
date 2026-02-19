// ==========================================
// 大道相亲模拟器 - 对话与交互核心系统 (dialogue.js)
// ==========================================

const HISTORY_KEY = 'daoyou_history_v1';

// ========== 1. 对话 UI 生成 ==========

// 添加玩家消息（左侧头像）
function addPlayerMessage(text) {
    let avatarSrc = 'images/avatar/player-default.png';
    let playerName = '我';
    if (gameState.player) {
        if (gameState.player.avatar) {
            avatarSrc = 'images/avatar/' + gameState.player.avatar;
        }
        playerName = gameState.player.surname + gameState.player.name;
    }
    const html = `
    <div class="message-container message-left">
        <div class="avatar-wrapper">
            <img class="avatar" src="${avatarSrc}" alt="${playerName}">
            <span class="avatar-name">${playerName}</span>
        </div>
        <div class="bubble">${text}</div>
    </div>`;
    const box = document.getElementById('dialogueBox');
    box.insertAdjacentHTML('beforeend', html);
    box.scrollTop = box.scrollHeight;
}

// 添加道友消息（右侧头像）
function addDaoyouMessage(text, speakerName, character) {
    let avatarSrc = 'images/avatar/daoyou-default.png';
    if (character && character.avatar) {
        avatarSrc = 'images/avatar/' + character.avatar;
    }
    const name = speakerName || '道友';
    const html = `
    <div class="message-container message-right">
        <div class="bubble">${text}</div>
        <div class="avatar-wrapper">
            <img class="avatar" src="${avatarSrc}" alt="${name}">
            <span class="avatar-name">${name}</span>
        </div>
    </div>`;
    const box = document.getElementById('dialogueBox');
    box.insertAdjacentHTML('beforeend', html);
    box.scrollTop = box.scrollHeight;
    addToHistory(`<p class="character-dialogue">${name}：${text}</p>`);
}

// 添加系统提示消息
function addSystemMessage(text) {
    const dialogueBox = document.getElementById('dialogueBox');
    const lastChild = dialogueBox.lastElementChild;

    // 如果最后一条也是系统消息，则合并，减少屏占比
    if (lastChild && lastChild.classList.contains('system-message')) {
        lastChild.innerHTML += '<br>' + text;
    } else {
        const html = `<div class="system-message">${text}</div>`;
        dialogueBox.insertAdjacentHTML('beforeend', html);
    }
    dialogueBox.scrollTop = dialogueBox.scrollHeight;
}

// ========== 2. 历史记录 (知与不由) ==========

function addToHistory(htmlContent) {
    const historyDiv = document.getElementById('historyContent');
    if (!historyDiv) return;

    if (historyDiv.children.length === 1 && historyDiv.children[0].innerText.includes('符诏初展')) {
        historyDiv.innerHTML = '';
    }

    const entry = document.createElement('div');
    entry.className = 'history-entry';
    entry.innerHTML = htmlContent;
    historyDiv.appendChild(entry);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        if (history.length >= 500) history.shift();
        history.push(htmlContent);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('历史存档失败', e);
    }
}

function loadHistory() {
    const historyDiv = document.getElementById('historyContent');
    if (!historyDiv) return;

    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        if (history.length === 0) {
            historyDiv.innerHTML = '<p class="other-message">符诏初展，一片混沌。</p>';
            return;
        }
        historyDiv.innerHTML = '';
        history.forEach(content => {
            const entry = document.createElement('div');
            entry.className = 'history-entry';
            entry.innerHTML = content;
            historyDiv.appendChild(entry);
        });
        historyDiv.scrollTop = historyDiv.scrollHeight;
    } catch (e) {
        historyDiv.innerHTML = '<p class="other-message">符诏初展，一片混沌。</p>';
    }
}

// ========== 3. 核心交互：话题选择 (双端适配) ==========

function prepareHobbySelection() {
    const char = gameState.currentCharacter;
    const realHobbies = [...char.hobbies];
    const selectedReal = shuffleArray(realHobbies).slice(0, 2);
    const fakePool = gameData.allHobbies.filter(h => !realHobbies.includes(h));
    const selectedFake = shuffleArray(fakePool).slice(0, 2);
    const allOptions = shuffleArray([...selectedReal, ...selectedFake]);

    const hobbyDescriptions = {
        '鱼': '垂钓：交流关于灵鱼垂钓、心境磨练的心得。',
        '生': '万生：讨论天地造化、动植物生长的奥秘。',
        '蚀': '蚀文：研习上古蚀文秘传，窥探符咒本源。',
        '道': '大道：论经讲道，探讨天地至理与修行根本。',
        '剑': '剑法：切磋剑道感悟，一剑破万法。',
        '杂': '杂学：丹道、阵法、炼器等辅修杂项。',
        '魔': '魔道：探讨灵门功法、剑走偏锋的修行方式。',
        '威': '伏魔：斩妖除魔，交流护法威能。',
        '棋': '对弈：以棋入道，在方寸之间演化阴阳。',
        '宗': '宗门：交流门派见闻、修仙界的势力分布。',
        '丽': '容颜：爱美之心人皆有之，驻颜有术。',
        '尊': '尊师：尊师重道，谈论师门传承。',
        '怜': '怜徒：提携后辈，讨论教导弟子的心得。',
        '局': '大局：纵览东华洲大势，博弈天下。',
        '闲': '闲情：修仙不仅是苦行，也有琴棋书画的雅趣。',
        '法': '法术：演练奇门遁法，五行变化。',
        '花': '花木：侍弄灵草，寄情于草木生灵。',
        '器': '法宝：品鉴奇珍异宝，探讨祭炼之法。',
        '争': '斗战：以战养战，交流实战与搏杀经验。'
    };

    const optionsDiv = document.getElementById('options');
    const tooltip = document.getElementById('hobbyTooltip');
    
    optionsDiv.innerHTML = `
        <p style="margin-bottom:8px; color:#333; font-weight:600;">请选择一个话题：</p>
        ${allOptions.map(hobby => `<button class="option" data-hobby="${hobby}">${hobby}</button>`).join('')}
    `;

    document.querySelectorAll('.option').forEach(btn => {
        let pressTimer = null;
        let isLongPress = false; // 增加标志位，防止长按后松手触发点击

        // --- 1. 点击逻辑 (Click) ---
        btn.addEventListener('click', function (e) {
            if (isLongPress) {
                isLongPress = false; // 如果是长按结束后的抬起，不触发点击
                return;
            }
            const hobby = this.getAttribute('data-hobby');
            const isReal = realHobbies.includes(hobby);
            tooltip.style.display = 'none';
            handleHobbySelection(hobby, isReal);
        });

        // --- 2. 手机端触摸逻辑 ---
        btn.addEventListener('touchstart', function (e) {
            isLongPress = false;
            const hobby = this.getAttribute('data-hobby');
            
            pressTimer = setTimeout(() => {
                isLongPress = true; // 确定进入长按状态
                const desc = hobbyDescriptions[hobby] || "此话题深不可测...";
                tooltip.innerHTML = `<strong>【${hobby}】</strong><br>${desc}`;
                tooltip.style.display = 'block';
                
                // 定位在屏幕上方
                tooltip.style.left = '50%';
                tooltip.style.top = '30%';
                tooltip.style.transform = 'translateX(-50%)';
                
                // 触感反馈（如果设备支持）
                if (navigator.vibrate) navigator.vibrate(20);
            }, 500); // 500ms 判定为长按
        }, {passive: true});

        btn.addEventListener('touchend', function () {
            clearTimeout(pressTimer);
            // 延迟一点点隐藏，让眼睛能看清
            setTimeout(() => { tooltip.style.display = 'none'; }, 100);
        });

        btn.addEventListener('touchmove', function () {
            clearTimeout(pressTimer); // 只要手指动了，就不算长按
        });

        // --- 3. 电脑端逻辑 ---
        btn.addEventListener('mouseenter', function (e) {
            if (window.innerWidth >= 768) {
                const hobby = this.getAttribute('data-hobby');
                tooltip.innerHTML = `<strong>【${hobby}】</strong><br>${hobbyDescriptions[hobby] || "..."}`;
                tooltip.style.display = 'block';
            }
        });

        btn.addEventListener('mousemove', function (e) {
            if (window.innerWidth >= 768) {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
                tooltip.style.transform = 'none';
            }
        });

        btn.addEventListener('mouseleave', function () {
            if (window.innerWidth >= 768) tooltip.style.display = 'none';
        });

        // 彻底禁止默认菜单
        btn.addEventListener('contextmenu', e => e.preventDefault());
    });
}

// ========== 4. 阵营对话逻辑 ==========

function getLowFavorSpecialLine(player, char) {
    const pFaction = player.faction;
    const pSect = player.sect;
    const cFaction = char.faction;
    const cSect = char.sect;

    if (pSect === "野") {
        if (cSect === "野") return "同是天涯沦落人。";
        if (cFaction === "玄门" || cFaction === "灵门") return "。。。";
    } else if (pFaction === "玄门" || pFaction === "灵门") {
        if (cSect === "野") return "真人有礼。";
        if (pFaction === cFaction) {
            return pFaction === "玄门" ? "真人请让开。" : "道友客气。";
        } else {
            return (pFaction === "玄门" && cFaction === "灵门") ? "玄灵有别。" : "玄魔有别";
        }
    }
    return null;
}

// 辅助工具：字符串内标签格式化
function formatHobbyTagInString(text) {
    if (!text) return text;
    return text.replace(/【([^】]+)】/g, '<span class="hobby-tag">【$1】</span>');
}


