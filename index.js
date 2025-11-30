// --- index.js: 实时更新时钟和日期的 JavaScript 代码 ---

function updateTimeAndDate() {
    // 1. 获取当前的日期和时间对象
    const now = new Date(); 

    // --- 2. 处理时间 (例如: 09:39) ---
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    // padStart(2, '0') 确保时间总是两位数，例如 9 变成 09
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    
    const timeString = `${hours}:${minutes}`;

    // --- 3. 处理日期 (例如: Sunday, November 30) ---
    // 完整的星期几和月份名称列表
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const dayName = days[now.getDay()]; 
    const monthName = months[now.getMonth()]; 
    const dateOfMonth = now.getDate(); // 获取日期数字 (如 30)

    const dateString = `${dayName}, ${monthName} ${dateOfMonth}`;
    
    // --- 4. 找到 HTML 元素并更新内容 ---
    
    // 通过 ID 找到我们在 index.html 中设置的元素
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    if (timeElement) {
        timeElement.textContent = timeString; // 更新大号时间
    }
    
    if (dateElement) {
        dateElement.textContent = dateString; // 更新日期
    }

    // --- 5. 同时更新所有状态栏时间 (包括锁屏和桌面) ---
    // 顶部时间使用 H:MM 格式 (不需要 H 小时前补 0)
    const topTimeElements = document.querySelectorAll('.status-time'); 
    topTimeElements.forEach(element => {
        element.textContent = `${now.getHours()}:${minutes}`;
    });
}

// A. 首次调用函数，立即显示正确的时间，避免页面加载时是静态的 08:37
updateTimeAndDate();

// B. 设置一个定时器：每隔 1000 毫秒 (即 1 秒) 就调用一次 updateTimeAndDate 函数
// 这就是让时钟“走动”的关键
setInterval(updateTimeAndDate, 1000);
// --- 实时更新电量信息的 JavaScript 代码 ---

function updateBatteryStatus(battery) {
    const batteryLevel = Math.floor(battery.level * 100); // 将电量从 0-1 转换到 0-100 的整数
    
    // 找到所有电量显示元素
    const batteryElements = document.querySelectorAll('.battery-level');
    
    batteryElements.forEach(element => {
        element.textContent = batteryLevel; // 更新所有电量数字
    });
}

// 检查浏览器是否支持 Battery Status API
if ('getBattery' in navigator) {
    // navigator.getBattery() 返回一个 Promise
    navigator.getBattery().then(function(battery) {
        // 首次加载时更新电量
        updateBatteryStatus(battery);

        // 监听电量变化事件，实时更新
        battery.addEventListener('levelchange', function() {
            updateBatteryStatus(battery);
        });

        // 监听充电状态变化事件 (可选：可以在 CSS 中给元素添加一个充电指示图标)
        // battery.addEventListener('chargingchange', function() {
        //     console.log('Charging status changed:', battery.charging);
        // });
    });
} else {
    // 如果浏览器不支持 Battery API (例如在桌面 Chrome 以外的某些环境)
    console.log("Battery Status API Not Supported.");
    // 我们可以设置一个静态值，例如 75
    const batteryElement = document.querySelector('.battery-level');
    if (batteryElement) {
         batteryElement.textContent = '75'; 
    }
}

// 注意：在许多桌面浏览器和 Acode 的某些环境中，出于安全考虑，这个 API 可能无法获取准确数据，
// 但在移动设备上运行的浏览器中，它的工作效果更好。

// --- 猫咪大王点击交互效果 ---

const catSlogan = document.getElementById('cat-slogan');
const emojiShower = document.getElementById('emoji-shower');

// 定义飘动的表情数组
const emojis = ['💖', '✨', '🐾', '⭐', '😻', '💕'];

function handleSloganClick() {
    // 1. 随机选择一个表情
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    // 2. 创建一个新的 <span> 元素来承载表情
    const emojiElement = document.createElement('span');
    emojiElement.textContent = randomEmoji;
    emojiElement.classList.add('floating-emoji');
    
    // 3. 随机化表情的起始水平位置，使其分散开，增加趣味性
    // 从 -20px 到 +20px 之间随机偏移
    const randomX = Math.floor(Math.random() * 40) - 20; 
    emojiElement.style.transform = `translateX(${randomX}px)`;

    // 4. 将表情元素添加到容器中
    emojiShower.appendChild(emojiElement);

    // 5. 设置定时器：当动画播放结束后，从 DOM 中移除这个表情元素
    // 动画持续时间是 1.5 秒 (见 CSS)，所以我们设置 1.5 秒后移除
    setTimeout(() => {
        emojiElement.remove();
    }, 1500); 
}

// 给底部的 "懒大王的 watch" 标语添加点击事件监听器
if (catSlogan) {
    catSlogan.addEventListener('click', handleSloganClick);
    // 也可以使用 'touchstart' 来获得更快的移动端响应
    // catSlogan.addEventListener('touchstart', handleSloganClick);
}

// --- 屏幕解锁/锁定逻辑 (带动画) ---

const lockScreen = document.querySelector('.lock-screen');
const homeScreen = document.getElementById('home-screen');
const lockButton = document.getElementById('lock-button');

// 定义动画持续时间 (必须和 CSS 中的 transition 时长一致)
const ANIMATION_DURATION = 500; // 0.5 秒

function unlockScreenWithAnimation(event) {
    // 检查点击是否发生在猫咪大王口号或其子元素上
    if (event.target.closest('#cat-slogan')) {
        return; 
    }

    // 阻止点击底部快捷图标和 Home Indicator 时解锁
    if (event.target.closest('.shortcut-icon') || event.target.closest('.home-indicator')) {
        return;
    }

    // 步骤 1: 确保锁屏可见并触发淡出动画
    lockScreen.classList.remove('hidden'); // 确保它不是隐藏的
    lockScreen.classList.add('fade-out');

    // 步骤 2: 等待动画完成
    setTimeout(() => {
        // 动画结束后，真正隐藏锁屏并显示桌面
        lockScreen.classList.add('hidden');
        if (homeScreen) {
            homeScreen.classList.remove('hidden');
        }
        
        // 移除 fade-out 类，以便下次锁定/解锁时能再次触发动画
        lockScreen.classList.remove('fade-out');

        // 立即重置锁屏的透明度和位置（下次显示时是完整的）
        lockScreen.style.opacity = 1;
        lockScreen.style.transform = 'translateY(0)';

    }, ANIMATION_DURATION);
}

// 1. 解锁功能：点击锁屏界面的任意位置
if (lockScreen) {
    // 替换为新的带动画的函数
    lockScreen.addEventListener('click', unlockScreenWithAnimation);
}

// 2. 锁定功能：点击主屏幕的“锁定屏幕”按钮
if (lockButton) {
    lockButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        
        // 锁定：直接隐藏主屏幕，显示锁屏
        if (homeScreen) {
            homeScreen.classList.add('hidden');
        }
        lockScreen.classList.remove('hidden');
    });
}
document.addEventListener('DOMContentLoaded', () => {
    // 获取手电筒图标元素
    const flashlightToggle = document.getElementById('flashlight-toggle');
    
    // 定义开/关状态的Emoji
    const ICON_OFF = '♡'; 
    const ICON_ON = '💗'; // 也可以使用 '♥'

    if (flashlightToggle) {
        // 添加点击事件监听器
        flashlightToggle.addEventListener('click', () => {
            
            // 1. 切换 CSS 状态 (发光效果)
            flashlightToggle.classList.toggle('on');

            // 2. 切换 Emoji 字符 (空心变实心)
            const isCurrentlyOn = flashlightToggle.classList.contains('on');
            
            if (isCurrentlyOn) {
                // 如果现在是开启状态，将内容设置为实心
                flashlightToggle.innerHTML = ICON_ON;
            } else {
                // 如果现在是关闭状态，将内容设置为空心
                flashlightToggle.innerHTML = ICON_OFF;
            }
        });
    }

    // （这里应该放您所有的 JS 代码，如时间更新、解锁逻辑等）

});