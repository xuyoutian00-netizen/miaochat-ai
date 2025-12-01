const lockScreen = document.getElementById('lock-screen');
const homeScreen = document.getElementById('home-screen');
const catSlogan = document.getElementById('cat-slogan');
const emojiShower = document.getElementById('emoji-shower');
const flashlightToggle = document.getElementById('flashlight-toggle');
const homeStatusBar = document.getElementById('home-status-bar');

const emojis = ['💗', '😻', '⭐', '💕', '🐾'] ;
const ANIMATION_DURATION = 480;

// 实时时间 & 电量（你原来的代码完全保留，只是放在最上面）
function updateTimeAndDate() {
    const now = new Date();
    const optionsDate = { weekday: 'long', month: 'long', day: 'numeric' };
    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: false };

    // 中文环境特别处理（你页面是 zh-CN）
    const locale = 'zh-CN';
    const dateStr = now.toLocaleDateString(locale, optionsDate)
                       .replace('年', '年 ')   // 加个空格更好看
                       .replace('月', '月 ')
                       .replace('日', '');
    
    const timeStr = now.toLocaleTimeString(locale, optionsTime).replace(':', ':');

    document.getElementById('current-date').textContent = dateStr;
    document.getElementById('current-time').textContent = timeStr;
}

updateTimeAndDate();
setInterval(updateTimeAndDate, 1000);


// 点击标语喷表情
catSlogan.addEventListener('click', () => {
    const emoji = emojis[Math.random()*emojis.length|0];
    const el = document.createElement('span');
    el.textContent = emoji;
    el.classList.add('floating-emoji');
    el.style.transform = `translateX(${Math.random()*40-20}px)`;
    emojiShower.appendChild(el);
    setTimeout(() => el.remove(), 1600);
});

// 手电筒切换
flashlightToggle.addEventListener('click', e => {
    e.stopPropagation();
    const on = flashlightToggle.classList.toggle('on');
    flashlightToggle.querySelector('.heart-icon').textContent = on ? '💗' : '♡';
});
// ==================== 全新向上滑动解锁（手机+电脑都丝滑）===================
// 触摸/鼠标开始
let touchStartY = 0;

lockScreen.addEventListener('touchstart', e => {
    // 如果点在标语或快捷键上就不记录（防止误触）
    if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

lockScreen.addEventListener('mousedown', e => {
    if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
    touchStartY = e.clientY;
});

// 触摸/鼠标结束 → 判断是否向上滑足够距离
function tryUnlock(endY) {
    if (touchStartY === 0) return; // 没记录起点直接return
    if (touchStartY - endY > 60) { // 向上滑 60px 以上才解锁（数字可调）
        lockScreen.classList.add('fade-out');
        setTimeout(() => {
            lockScreen.classList.add('hidden');
            homeScreen.classList.remove('hidden');
            lockScreen.classList.remove('fade-out');
        }, ANIMATION_DURATION);
    }
    touchStartY = 0; // 重置
}

lockScreen.addEventListener('touchend', e => {
    if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
    tryUnlock(e.changedTouches[0].clientY);
});

lockScreen.addEventListener('mouseup', e => {
    if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
    tryUnlock(e.clientY);
});
// ==================== 主屏幕下拉返回锁屏（真机手势）===================
let homeTouchStartY = 0;

// 开始触摸/按下（只在状态栏区域生效，更像真机）
homeStatusBar.addEventListener('touchstart', e => {
    homeTouchStartY = e.touches[0].clientY;
}, { passive: true });

homeStatusBar.addEventListener('mousedown', e => {
    homeTouchStartY = e.clientY;
});

// 结束触摸/松开 → 判断是否下拉足够距离
function tryReturnToLock(endY) {
    if (homeTouchStartY === 0) return;
    
    const deltaY = endY - homeTouchStartY;
    if (deltaY > 70) {  // 下滑 70px 以上才触发（数字可微调）
        homeScreen.classList.add('hidden');
        lockScreen.classList.remove('hidden');
        
        // 淡入动画（跟真机一模一样）
        lockScreen.classList.add('fade-in', 'active');
        setTimeout(() => {
            lockScreen.classList.remove('fade-in', 'active');
        }, 50);
    }
    
    homeTouchStartY = 0; // 重置
}

homeStatusBar.addEventListener('touchend', e => {
    tryReturnToLock(e.changedTouches[0].clientY);
});

homeStatusBar.addEventListener('mouseup', e => {
    tryReturnToLock(e.clientY);
});