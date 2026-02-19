// ========== 对话系统 ==========
// 添加玩家消息（左侧头像）- 不记录历史
function addPlayerMessage(text) {
    let avatarSrc = 'images/avatar/player-default.png';
    let playerName = '我';
    if (gameState.player) {
        if (gameState.player.avatar) {
            avatarSrc = 'images/avatar/' + gameState.player.avatar;
        }
        playerName = gameState.player.surname + gameState.player.name;
    }
    const html = `<div class="message-container message-left">
        <div class="avatar-wrapper">
            <img class="avatar" src="${avatarSrc}" alt="${playerName}">
            <span class="avatar-name">${playerName}</span>
        </div>
        <div class="bubble">${text}</div>
    </div>`;
    document.getElementById('dialogueBox').insertAdjacentHTML('beforeend', html);
    document.getElementById('dialogueBox').scrollTop = document.getElementById('dialogueBox').scrollHeight;
}

function addDaoyouMessage(text, speakerName, character) {
    let avatarSrc = 'images/avatar/daoyou-default.png';
    if (character && character.avatar) {
        avatarSrc = 'images/avatar/' + character.avatar;
    }
    const name = speakerName || '道友';
    const html = `<div class="message-container message-right">
        <div class="bubble">${text}</div>
        <div class="avatar-wrapper">
            <img class="avatar" src="${avatarSrc}" alt="${name}">
            <span class="avatar-name">${name}</span>
        </div>
    </div>`;
    document.getElementById('dialogueBox').insertAdjacentHTML('beforeend', html);
    document.getElementById('dialogueBox').scrollTop = document.getElementById('dialogueBox').scrollHeight;
    addToHistory(`<p class="character-dialogue">${name}：${text}</p>`);
}

function addSystemMessage(text) {
    const dialogueBox = document.getElementById('dialogueBox');
    const lastChild = dialogueBox.lastElementChild;

    if (lastChild && lastChild.classList.contains('system-message')) {
        lastChild.innerHTML += '<br>' + text;
    } else {
        const html = `<div class="system-message">${text}</div>`;
        dialogueBox.insertAdjacentHTML('beforeend', html);
    }
    dialogueBox.scrollTop = dialogueBox.scrollHeight;
}

function addToHistory(htmlContent) {
    const historyDiv = document.getElementById('historyContent');
    if (!historyDiv) return;

    if (historyDiv.children.length === 1 && historyDiv.children[0].innerText === '符诏初展，一片混沌。') {
        historyDiv.innerHTML = '';
    }

    const entry = document.createElement('div');
    entry.className = 'history-entry';
    entry.innerHTML = htmlContent;
    historyDiv.appendChild(entry);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        let history = [];
        const saved = localStorage.getItem(HISTORY_KEY);
        if (saved) {
            history = JSON.parse(saved);
        }
        if (history.length >= 500) {
            history.shift();
        }
        history.push(htmlContent);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.warn('保存历史记录失败', e);
    }
}

function loadHistory() {
    const historyDiv = document.getElementById('historyContent');
    if (!historyDiv) return;

    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        if (!saved) {
            historyDiv.innerHTML = '<p class="other-message">符诏初展，一片混沌。</p>';
            return;
        }

        const history = JSON.parse(saved);
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
        console.warn('加载历史记录失败', e);
        historyDiv.innerHTML = '<p class="other-message">符诏初展，一片混沌。</p>';
    }
}

function formatHobbyTagInString(text) { 
    if (!text) return text; 
    return text.replace(/【([^】]+)】/g, '<span class="hobby-tag">【$1】</span>'); 
}

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
  
  // 用于记录手机端点击状态
  let lastClickedHobby = null;

  optionsDiv.innerHTML = `<p style="margin-bottom:8px; color:#333; font-weight:600;">请选择一个话题：</p>${allOptions.map(hobby => `<button class="option" data-hobby="${hobby}">${hobby}</button>`).join('')}`; 
  
  document.querySelectorAll('.option').forEach(btn => { 
    // --- 1. 点击逻辑 (核心适配手机) ---
    btn.addEventListener('click', function (e) { 
      const selectedHobby = this.getAttribute('data-hobby'); 
      const isReal = realHobbies.includes(selectedHobby); 
      
      // 如果是窄屏(手机)环境
      if (window.innerWidth < 768) {
        if (lastClickedHobby !== selectedHobby) {
          // 第一次点击：只出解释，不触发对话
          e.preventDefault();
          lastClickedHobby = selectedHobby;
          showTooltipLogic(selectedHobby, e);
          return; // 拦截
        }
      }

      // 第二次点击或电脑点击：执行选择
      tooltip.style.display = 'none'; 
      lastClickedHobby = null;
      handleHobbySelection(selectedHobby, isReal); 
    }); 
    
    // --- 2. 鼠标悬浮 (电脑端) ---
    btn.addEventListener('mouseenter', function(e) {
      if (window.innerWidth >= 768) {
        showTooltipLogic(this.getAttribute('data-hobby'), e);
      }
    });

    btn.addEventListener('mousemove', function(e) {
      if (window.innerWidth >= 768) moveTooltip(e);
    });

    btn.addEventListener('mouseleave', function() {
      tooltip.style.display = 'none';
    });
    
    // --- 3. 长按逻辑 (保持你原有的) ---
    btn.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      const hobby = this.getAttribute('data-hobby');
      const desc = hobbyDescriptions[hobby] || hobby;
      addSystemMessage(`【${hobby}】 - ${desc}`);
    });
  });

  // 显示 Tooltip 的统一逻辑
  function showTooltipLogic(hobby, e) {
    const desc = hobbyDescriptions[hobby] || "此话题深不可测...";
    tooltip.innerHTML = `<strong>【${hobby}】</strong><br>${desc}${window.innerWidth < 768 ? '<br><span style="color:#ffb347;font-size:0.7rem;">(再次点击确认选择)</span>' : ''}`;
    tooltip.style.display = 'block';
    moveTooltip(e);
  }

  // 计算位置逻辑
  function moveTooltip(e) {
    if (window.innerWidth < 768) {
        // 手机端居中显示，不受鼠标/指尖位置干扰
        tooltip.style.left = '50%';
        tooltip.style.top = '30%';
        tooltip.style.transform = 'translateX(-50%)';
    } else {
        // 电脑端跟随鼠标
        let x = e.clientX + 15;
        let y = e.clientY + 15;
        if (x + 200 > window.innerWidth) x = e.clientX - 210;
        if (y + 100 > window.innerHeight) y = e.clientY - 110;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.transform = 'none';
    }
  }

  // 点击空白处关闭解释
  document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('option')) {
      tooltip.style.display = 'none';
      lastClickedHobby = null;
    }
  }, { once: true });
}

// ========== 好感≤20时的阵营特殊对话（用于错误话题） ==========
function getLowFavorSpecialLine(player, char) {
  const playerFaction = player.faction;
  const playerSect = player.sect;
  const charFaction = char.faction;
  const charSect = char.sect;

  if (playerSect === "野") {
    if (charSect === "野") {
      return "同是天涯沦落人。";
    } else if (charFaction === "玄门" || charFaction === "灵门") {
      return "。。。";
    }
  }
  else if (playerFaction === "玄门" || playerFaction === "灵门") {
    if (charSect === "野") {
      return "真人有礼。";
    }
    if (playerFaction === charFaction) {
      if (playerFaction === "玄门") {
        return "真人请让开。";
      } else if (playerFaction === "灵门") {
        return "道友客气。";
      }
    }
    else {
      if (playerFaction === "玄门" && charFaction === "灵门") {
        return "玄灵有别。";
      } else if (playerFaction === "灵门" && charFaction === "玄门") {
        return "玄魔有别";
      }
    }
  }
  return null;

}
