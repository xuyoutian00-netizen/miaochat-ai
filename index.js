const lockScreen = document.getElementById('lock-screen');
const homeScreen = document.getElementById('home-screen');
const catSlogan = document.getElementById('cat-slogan');
const emojiShower = document.getElementById('emoji-shower');
const flashlightToggle = document.getElementById('flashlight-toggle');
const homeStatusBar = document.getElementById('home-status-bar');

// 获取状态栏时间/电量元素
const lockStatusBarTime = document.querySelector('#lock-screen .top-status-bar .status-time');
const lockStatusBarBatteryLevel = document.querySelector('#lock-screen .top-status-bar .battery-level');
const homeStatusBarTime = document.querySelector('#home-screen .top-status-bar .status-time');
const homeStatusBarBatteryLevel = document.querySelector('#home-screen .top-status-bar .battery-level');

const emojis = ['💗', '😻', '⭐', '💕', '🐾'] ;
const ANIMATION_DURATION = 480;

// ==================== 1. 电池核心功能 (已包含充电特效) ====================

// 更新图标样式的函数
function updateBatteryIcon(level, isCharging) {
    let iconClass = '';
    
    // 1. 根据电量决定状态栏电池图标形状
    if (level > 90) iconClass = 'fa-battery-full';
    else if (level > 60) iconClass = 'fa-battery-three-quarters';
    else if (level > 30) iconClass = 'fa-battery-half';
    else if (level > 10) iconClass = 'fa-battery-quarter';
    else iconClass = 'fa-battery-empty'; // 电量极低

    // 2. 更新所有状态栏电池图标的样式
    document.querySelectorAll('.battery-icon').forEach(icon => {
        icon.className = `fas ${iconClass} battery-icon`;
        if (isCharging) {
            icon.classList.add('charging'); 
        } else {
            icon.classList.remove('charging'); 
            if (level <= 10) {
                icon.style.color = '#ff3b30'; 
            } else {
                icon.style.color = ''; 
            }
        }
    });

    // 3. 【控制闪电小组件的充电特效】 (左上角的小组件)
    const leftWidget = document.querySelector('.widget.left-widget');
    if (leftWidget) {
        if (isCharging) {
            // 如果正在充电，添加一个特殊的类
            leftWidget.classList.add('widget-charging-flash');
        } else {
            // 否则移除
            leftWidget.classList.remove('widget-charging-flash');
        }
    }

    // 4. 控制手电筒快捷图标的充电特效 (已移除)
    // 保持手电筒图标不受充电状态影响
}

// 初始化真实电池系统
function initRealBatterySystem() {
    // 检查浏览器是否支持电池 API
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            
            // 定义更新逻辑
            function updateAllBatteryUI() {
                // battery.level 是 0.0 到 1.0 的小数，转换成百分比
                const level = Math.round(battery.level * 100);
                const isCharging = battery.charging; // true 代表正在充电

                // 更新文字数字 (新增百分号 %)
                const levelText = level + '%';
                if (lockStatusBarBatteryLevel) lockStatusBarBatteryLevel.textContent = levelText;
                if (homeStatusBarBatteryLevel) homeStatusBarBatteryLevel.textContent = levelText;

                // 更新图标和动画
                updateBatteryIcon(level, isCharging);
            }

            // 立即运行一次
            updateAllBatteryUI();

            // 监听电量变化
            battery.addEventListener('levelchange', updateAllBatteryUI);
            // 监听充电状态变化 (插拔电源时触发)
            battery.addEventListener('chargingchange', updateAllBatteryUI);
        });
    } else {
        // 如果设备不支持，显示默认值
        console.log("当前浏览器不支持电池API");
        // 默认显示 85%
        if (lockStatusBarBatteryLevel) lockStatusBarBatteryLevel.textContent = '85%';
        if (homeStatusBarBatteryLevel) homeStatusBarBatteryLevel.textContent = '85%';
        updateBatteryIcon(85, false); 
    }
}

// 启动电池功能
initRealBatterySystem();


// ==================== 2. 时间和日期 (每秒更新) ====================

function updateTimeAndDate() {
    const now = new Date();
    const locale = 'zh-CN';
    
    // --- 锁屏大标题日期 ---
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateStr = now.toLocaleDateString(locale, dateOptions)
                       .replace('年', '年 ')
                       .replace('月', '月 ')
                       .replace('日', '');
    
    // --- 锁屏大标题时间 ---
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: false };
    const mainTimeStr = now.toLocaleTimeString(locale, timeOptions).replace(':', ':');

    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    if (dateEl) dateEl.textContent = dateStr;
    if (timeEl) timeEl.textContent = mainTimeStr;

    // --- 状态栏小时间 ---
    const statusBarTimeStr = now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    if (lockStatusBarTime) lockStatusBarTime.textContent = statusBarTimeStr;
    if (homeStatusBarTime) homeStatusBarTime.textContent = statusBarTimeStr;
}

updateTimeAndDate();
setInterval(updateTimeAndDate, 1000);


// ==================== 3. 交互功能 (标语、手电筒) ====================

// 点击标语喷表情
if (catSlogan) {
    catSlogan.addEventListener('click', () => {
        const emoji = emojis[Math.random()*emojis.length|0];
        const el = document.createElement('span');
        el.textContent = emoji;
        el.classList.add('floating-emoji');
        el.style.transform = `translateX(${Math.random()*40-20}px)`;
        emojiShower.appendChild(el);
        setTimeout(() => el.remove(), 1600);
    });
}

// 手电筒切换
if (flashlightToggle) {
    flashlightToggle.addEventListener('click', e => {
        e.stopPropagation();
        const on = flashlightToggle.classList.toggle('on');
        const icon = flashlightToggle.querySelector('.heart-icon');
        if(icon) icon.textContent = on ? '💗' : '♡';
    });
}


// ==================== 4. 向上滑动解锁 ====================
let touchStartY = 0;

if (lockScreen) {
    lockScreen.addEventListener('touchstart', e => {
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    lockScreen.addEventListener('mousedown', e => {
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
        touchStartY = e.clientY;
    });

    lockScreen.addEventListener('touchend', e => {
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
        tryUnlock(e.changedTouches[0].clientY);
    });

    lockScreen.addEventListener('mouseup', e => {
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
        tryUnlock(e.clientY);
    });
}

function tryUnlock(endY) {
    if (touchStartY === 0) return; 
    if (touchStartY - endY > 60) { 
        lockScreen.classList.add('fade-out');
        setTimeout(() => {
            lockScreen.classList.add('hidden');
            homeScreen.classList.remove('hidden');
            lockScreen.classList.remove('fade-out');
        }, ANIMATION_DURATION);
    }
    touchStartY = 0; 
}


// ==================== 5. 主屏幕下拉返回锁屏 ====================
let homeTouchStartY = 0;

if (homeStatusBar) {
    homeStatusBar.addEventListener('touchstart', e => {
        homeTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    homeStatusBar.addEventListener('mousedown', e => {
        homeTouchStartY = e.clientY;
    });

    homeStatusBar.addEventListener('touchend', e => {
        tryReturnToLock(e.changedTouches[0].clientY);
    });

    homeStatusBar.addEventListener('mouseup', e => {
        tryReturnToLock(e.clientY);
    });
}

function tryReturnToLock(endY) {
    if (homeTouchStartY === 0) return;
    
    const deltaY = endY - homeTouchStartY;
    if (deltaY > 70) { 
        homeScreen.classList.add('hidden');
        lockScreen.classList.remove('hidden');
        
        lockScreen.classList.add('fade-in', 'active');
        setTimeout(() => {
            lockScreen.classList.remove('fade-in', 'active');
        }, 50);
    }
    homeTouchStartY = 0;
}