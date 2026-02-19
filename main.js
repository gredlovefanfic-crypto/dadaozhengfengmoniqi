window.addEventListener('DOMContentLoaded', function() {
    // 初始化所有全局 DOM 引用
    window.statusDiv = document.getElementById('status');
    window.playerInfo = document.getElementById('playerInfo');
    window.startBtn = document.getElementById('startBtn');
    window.nameInput = document.getElementById('nameInput');
    window.newFriendBtn = document.getElementById('newFriendBtn');
    window.optionsDiv = document.getElementById('options');
    window.actionButtons = document.getElementById('actionButtons');
    window.currentInteraction = document.getElementById('currentInteraction');
    window.characterDetails = document.getElementById('characterDetails');
    window.progressContainer = document.getElementById('progressContainer');
    window.progressFill = document.getElementById('progressFill');
    window.progressText = document.getElementById('progressText');
    window.rankingList = document.getElementById('rankingList');
    window.metCount = document.getElementById('metCount');
    window.maxFavorCount = document.getElementById('maxFavorCount');
    window.sectMasterCount = document.getElementById('sectMasterCount');
    window.giftedHobbiesList = document.getElementById('giftedHobbiesList');
    window.playerCultivationVal = document.getElementById('playerCultivationVal');
    window.playerInsightVal = document.getElementById('playerInsightVal');
    window.inventoryList = document.getElementById('inventoryList');
    window.successModal = document.getElementById('successModal');
    window.trialModal = document.getElementById('trialModal');
    window.modalMessage = document.getElementById('modalMessage');
    window.continueBtn = document.getElementById('continueBtn');
    window.exitBtn = document.getElementById('exitBtn');
    window.companionBtn = document.getElementById('companionBtn');
    window.enemyBtn = document.getElementById('enemyBtn');
    window.continueTrialBtn = document.getElementById('continueTrialBtn');
    window.restartTrialBtn = document.getElementById('restartTrialBtn');
    window.fireworks = document.getElementById('fireworks');

    // 加载游戏
    loadGame();
    loadHistory();
});