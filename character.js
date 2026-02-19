// ========== 角色相关函数 ==========
const getFavorLevel = (favor) => favor <= 10 ? 0 : favor <= 30 ? 1 : favor <= 50 ? 2 : favor <= 70 ? 3 : favor <= 90 ? 4 : 5;
const isSimaQuan = (char) => char.surname === "司马" && char.name === "权";
const isAdvancedSimaQuan = (char) => char.surname === "天魔" && char.name === "司马权";

function removeCharacterFromPool(fullName) { 
    gameState.allCharacters = gameState.allCharacters.filter(c => (c.surname + c.name) !== fullName); 
}

function addCharacterToPool(character) { 
    const fullName = character.surname + character.name; 
    if (!gameState.allCharacters.some(c => (c.surname + c.name) === fullName)) 
        gameState.allCharacters.push({ ...character }); 
}

// ---------- 根据规则重新生成角色爱好 ----------
function generateHobbiesForCharacter(char) {
  let total = 6;
  const forced = new Set();
  const fullName = char.surname + char.name;

  // 判断是否为预设角色（存在于 gameData.characters 中）
  const isPreset = gameData.characters.some(c => (c.surname + c.name) === fullName);

  // 判定角色是否允许魔、是否禁止威（保持不变）
  const isAllowedMagic = (char.faction === "灵门" || (char.surname === "天魔" && char.name === "司马权"));
  const isForbiddenPower = (char.faction === "灵门" || 
                            (char.surname === "司马" && char.name === "权") || 
                            (char.surname === "天魔" && char.name === "司马权"));


  // 通用硬性标准
  if (char.cultivation >= 90) forced.add("道");          // 道
  if (char.face >= 90) forced.add("丽");                 // 丽
  if (char.title === "掌门") forced.add("宗");           // 宗

  // 门派硬性/软性标准
  if (char.faction === "灵门") forced.add("魔");         // 魔（灵门必有）
  if (char.sect === "少清") forced.add("剑");            // 剑（少清所有）
  if (char.sect === "补天") {                            // 补天阁必有杂和器
    forced.add("杂");
    forced.add("器");
  }
  if (char.sect === "南华") forced.add("生");            // 生（南华）
  if (char.sect === "清羽") forced.add("生");            // 生（清羽）
  if (char.sect === "还真") forced.add("威");            // 威（还真必有）
  if (char.sect === "玉霄") forced.add("争");            // 争（玉霄所有）

  // 特定角色软性/硬性标准（按名单）
  // 鱼：秦墨白、齐云天、张衍、沈柏霜
  if (["秦墨白", "齐云天", "张衍", "沈柏霜"].includes(fullName)) forced.add("鱼");
  // 生：方心岸（南华、清羽已在上面处理）
  if (fullName === "方心岸") forced.add("生");
  // 剑：张衍、宁冲玄、屈如意（少清已在上面处理）
  if (["张衍", "宁冲玄", "屈如意"].includes(fullName)) forced.add("剑");
  // 杂：周崇举（补天已在上面处理）
  if (fullName === "周崇举") forced.add("杂");
  // 花：秦玉、乐羲容
  if (["秦玉", "乐羲容"].includes(fullName)) forced.add("花");
  // 尊：齐云天、吕钧阳、宁冲玄、洛清羽、方心岸
  if (["齐云天", "吕钧阳", "宁冲玄", "洛清羽", "方心岸"].includes(fullName)) forced.add("尊");
  // 怜：秦墨白、张衍、孙至言、晏长生、黄羽公、庞芸襄
  if (["秦墨白", "张衍", "孙至言", "晏长生", "黄羽公", "庞芸襄"].includes(fullName)) forced.add("怜");
  // 争：玉霄所有 + 晏长生、萧容鱼、班少明、黄羽公、风海洋、方舜同、费悦、霍轩、洛清羽、百里青殷、荀怀英
  if (["晏长生", "萧容鱼", "班少明", "黄羽公", "风海洋", "方舜同", "费悦", "屈如意","霍轩", "洛清羽", "百里青殷", "荀怀英"].includes(fullName)) forced.add("争");

  // 将强制爱好转为数组，并过滤掉不符合规则的内容（确保魔/威符合要求）
  let forcedArray = Array.from(forced);
  forcedArray = forcedArray.filter(h => {
    if (h === "魔" && !isAllowedMagic) return false;
    if (h === "威" && isForbiddenPower) return false;
    return true;
  });

  if (forcedArray.length > total) forcedArray = forcedArray.slice(0, total);
  let hobbies = [...forcedArray];
  let remain = total - forcedArray.length;

  if (remain > 0) {
    // 构造可用爱好池：排除已选爱好
    let available = gameData.allHobbies.filter(h => !hobbies.includes(h));

    // 硬性爱好过滤函数（根据角色属性过滤）
    const isEligibleForHobby = (hobby) => {
        switch (hobby) {
            case "道": return char.cultivation >= 90;
            case "丽": return char.face >= 90;
            case "宗": return char.title === "掌门";
            case "剑": 
                // 预设角色遵循原有规则，随机角色全部允许
                if (isPreset) {
                    return char.sect === "少清" || ["张衍", "宁冲玄", "屈如意"].includes(fullName);
                } else {
                    return true;
                }
            case "魔": 
                return char.faction === "灵门" || (char.surname === "天魔" && char.name === "司马权");
            case "尊":
                if (isPreset) {
                    return ["齐云天", "吕钧阳", "宁冲玄", "洛清羽", "方心岸"].includes(fullName);
                } else {
                    return true;
                }
            case "怜":
                if (isPreset) {
                    return ["秦墨白", "张衍", "孙至言", "晏长生", "黄羽公", "庞芸襄"].includes(fullName);
                } else {
                    return true;
                }
            case "争":
                if (isPreset) {
                    return char.sect === "玉霄" || ["晏长生", "萧容鱼", "班少明", "黄羽公", "风海洋", "方舜同", "费悦", "霍轩", "洛清羽", "百里青殷", "荀怀英"].includes(fullName);
                } else {
                    return true;
                }
            // 其他爱好（鱼、生、蚀、棋、闲、法、花、器、杂）默认允许
            default: return true;
        }
    };

    // 先根据硬性条件过滤（保留允许的爱好）
    available = available.filter(isEligibleForHobby);

    // 再根据魔/威的全局禁止规则过滤（保持不变）
    if (!isAllowedMagic) {
        available = available.filter(h => h !== "魔");
    }
    if (isForbiddenPower) {
        available = available.filter(h => h !== "威");
    }

    const shuffled = shuffleArray([...available]);
    const selected = shuffled.slice(0, remain);
    hobbies.push(...selected);
  }

  return Array.from(new Set(hobbies));
}

function resetAllCharactersHobbies() {
  gameData.characters.forEach(char => { char.hobbies = generateHobbiesForCharacter(char); });
  gameData.simaQuanAdvanced.hobbies = generateHobbiesForCharacter(gameData.simaQuanAdvanced);
}

// ========== 🖼️ 头像字段自动初始化 (使用 PNG) ==========
const AVATAR_EXT = '.png';
const DEFAULT_PLAYER_AVATAR = 'player-default.png';

function setAvatarIfMissing(char) {
    if (char && char.surname && char.name && !char.avatar) {
        char.avatar = char.surname + char.name + AVATAR_EXT;
    }
}

function fixGameStateAvatars() {
    if (!gameState) return;
    
    if (gameState.allCharacters) {
        gameState.allCharacters.forEach(setAvatarIfMissing);
    }
    
    if (gameState.metCharacters) {
        gameState.metCharacters.forEach(data => {
            if (data.character) setAvatarIfMissing(data.character);
        });
    }
    
    if (gameState.player) {
        const playerFullName = gameState.player.surname + gameState.player.name;
        const isPreset = gameData && gameData.characters && 
            gameData.characters.some(c => (c.surname + c.name) === playerFullName);
        if (isPreset) {
            setAvatarIfMissing(gameState.player);
        } else {
            delete gameState.player.avatar;
        }
    }
}

// 初始调用（但要在 data 加载后）
if (gameData && gameData.characters) {
    gameData.characters.forEach(setAvatarIfMissing);
}
if (gameData && gameData.simaQuanAdvanced) {
    setAvatarIfMissing(gameData.simaQuanAdvanced);
}

function calculateInitialFavor() {
    const p = gameState.player;
    const t = gameState.currentCharacter;
    
    // 防御性检查：如果玩家或当前角色不存在，返回默认好感度（例如 50）
    if (!p || !t) return 50;

    let f = 0; 
    if (p.face >= 90 && t.face >= 90) f += 3; 
    else if (p.face >= 80 && t.face >= 80) f += 2; 
    if (p.cultivation >= 85 && t.cultivation >= 85) f += 3; 
    else if (p.cultivation >= 75 && t.cultivation >= 75) f += 2; 
    if (p.faction === t.faction) f += 3; 
    if (p.sect === t.sect) f += 3; 
    if (p.stance === t.stance) f += 3; 
    f += getRandomInt(-3, 3); 
    return Math.max(0, Math.min(100, f));
}

function displayEncounterInfo(favor) {
    const c = gameState.currentCharacter;
    const full = c.surname + c.name + (c.title ? `(${c.title})` : "");
    document.getElementById('dialogueBox').innerHTML = '';
    addSystemMessage(`${full} · ${c.faction}·${c.sect}`);
    let dialogueText = "";
    if (favor <= 10) dialogueText = "对方没有看你。";
    else if (favor <= 30) dialogueText = "你们萍水相逢。";
    else if (favor <= 50) dialogueText = "你们互相点头致意。";
    else if (favor <= 70) dialogueText = "你们相谈甚欢。";
    else if (favor <= 90) dialogueText = "你们已是知己。";
    else dialogueText = "你们心有慕意。";
    addSystemMessage(dialogueText);
}

function displayReencounterInfo(favor) {
    const c = gameState.currentCharacter;
    const full = c.surname + c.name + (c.title ? `(${c.title})` : "");
    document.getElementById('dialogueBox').innerHTML = '';
    addSystemMessage(`${full} · ${c.faction}·${c.sect}`);
    let dialogueText = "";
    if (favor <= 10) dialogueText = "对方冷淡依旧。";
    else if (favor <= 30) dialogueText = "你们客套寒暄。";
    else if (favor <= 50) dialogueText = "你们互相问候。";
    else if (favor <= 70) dialogueText = "朋友相见。";
    else if (favor <= 90) dialogueText = "知己重逢。";
    else dialogueText = "情意绵绵。";
    addSystemMessage(dialogueText);
}