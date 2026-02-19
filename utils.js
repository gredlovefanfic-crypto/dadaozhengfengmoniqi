// ========== 工具函数 ==========
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

// ---------- 成就辅助函数 ----------
function countMetBySect(state, sect) {
  if (!state.metCharacters) return 0;
  let count = 0;
  for (let [id, data] of state.metCharacters.entries()) {
    if (data.favor >= 100 && data.character && data.character.sect === sect && data.relation === 'companion') {
      count++;
    }
  }
  return count;
}

function countMetByFaction(state, faction) {
  if (!state.metCharacters) return 0;
  let count = 0;
  for (let [id, data] of state.metCharacters.entries()) {
    if (data.favor >= 100 && data.character && data.character.faction === faction && data.relation === 'companion') {
      count++;
    }
  }
  return count;
}

// 获取角色所属的“成就类别”（溟沧/少清/玉霄/野/灵门），若不在这五类则返回null
function getAchievementCategory(char) {
  if (!char) return null;
  if (char.sect === '溟沧' || char.sect === '少清' || char.sect === '玉霄' || char.sect === '野') {
    return char.sect;
  }
  if (char.faction === '灵门') return '灵门';
  return null;
}

// 检查雨露均沾条件：前三个满好感角色类别均非空且互不相同
function checkYuluCondition(state) {
  const companionList = Array.from(state.metCharacters.entries())
    .filter(([id, data]) => data.favor >= 100 && data.relation === 'companion')
    .map(([id, data]) => data.character);

  if (companionList.length < 3) return false;

  const cats = companionList.slice(0, 3).map(char => getAchievementCategory(char));
  if (cats.includes(null)) return false;

  return new Set(cats).size === 3;
}