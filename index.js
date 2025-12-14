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
// 注意：passcodeStatusBarTime 在 index.html 中未定义，暂时不使用。
const passcodeStatusBarTime = document.querySelector('#passcode-screen .top-status-bar .status-time'); 


const emojis = ['💗', '😻', '⭐', '💕', '🐾'] ;
const ANIMATION_DURATION = 480;

// 【新增】：用于模拟电量和充电状态
let simulatedBatteryLevel = 85; // 默认模拟电量
let isSimulatedCharging = false;  // 默认非充电状态
let batterySimulatorInterval = null; // 用于存储模拟器的定时器

// 【新增】：记录相机是否是从锁屏打开的
let cameraOpenedFromLock = false; 

// index.js (在现有代码的获取元素部分添加)
const cameraAppIcon = document.querySelector('.camera-app-icon');
const cameraApp = document.getElementById('camera-app');
// 【修复】：新增 modeSelector 的获取
const modeSelector = document.querySelector('.mode-selector'); 
const cameraCloseButton = document.getElementById('camera-close-button');
const shutterButton = document.querySelector('.shutter-button'); 

// 【新增】获取锁屏相机的快捷方式
const lockScreenCameraShortcut = document.querySelector('.lock-screen .shortcut-icon.camera');

// index.js (在文件开头，获取元素的部分新增)
const cameraViewfinder = document.querySelector('.camera-viewfinder'); 

// 【新增】专业模式控制元素
const proControls = document.querySelector('.pro-controls'); 
const isoSlider = document.getElementById('iso-slider');
const isoValueSpan = document.getElementById('iso-value');
const shutterSlider = document.getElementById('shutter-slider');
const shutterValueSpan = document.getElementById('shutter-value');

// ISO/快门速度的映射表（模拟真实相机参数）
// [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const shutterSpeedMap = [
    '1s', '1/2s', '1/4s', '1/8s', '1/15s', '1/30s', '1/60s', '1/125s', '1/250s', '1/500s', '1/1000s'
];


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
}

// 更新模拟电量UI的函数（新增）
function updateSimulatedBatteryUI() {
    const levelText = simulatedBatteryLevel + '%';

    // 1. 更新文字数字
    if (lockStatusBarBatteryLevel) lockStatusBarBatteryLevel.textContent = levelText;
    if (homeStatusBarBatteryLevel) homeStatusBarBatteryLevel.textContent = levelText;

    // 2. 更新图标和动画 (调用原有的函数)
    updateBatteryIcon(simulatedBatteryLevel, isSimulatedCharging);

    // 3. 模拟电量变化
    if (isSimulatedCharging) {
        // 充电时电量上升
        if (simulatedBatteryLevel < 100) {
            simulatedBatteryLevel = Math.min(100, simulatedBatteryLevel + 1);
        }
    } else {
        // 非充电时电量下降
        if (simulatedBatteryLevel > 1) {
            simulatedBatteryLevel = Math.max(1, simulatedBatteryLevel - 1);
        }
    }
}

// 切换模拟充电状态的函数（新增）
function toggleSimulatedCharging() {
    // 只有在模拟模式下才允许切换
    if (batterySimulatorInterval) { 
        isSimulatedCharging = !isSimulatedCharging;
        console.log(`模拟充电状态切换为: ${isSimulatedCharging ? '充电中' : '非充电'}`);
        
        // 立即触发一次 UI 更新
        updateSimulatedBatteryUI(); 
    }
}

// 启动电量模拟器（新增）
function startBatterySimulator() {
    // 每 5 秒更新一次模拟电量和 UI (模拟缓慢变化)
    batterySimulatorInterval = setInterval(updateSimulatedBatteryUI, 5000); 

    // 立即更新一次
    updateSimulatedBatteryUI();
    
    // 【新增】：监听锁屏状态栏点击，切换充电状态
    document.querySelector('#lock-screen .top-status-bar').addEventListener('click', toggleSimulatedCharging);
    document.querySelector('#home-screen .top-status-bar').addEventListener('click', toggleSimulatedCharging);
}

// 初始化真实电池系统（核心修改在这里）
function initRealBatterySystem() {
    // 检查浏览器是否支持电池 API
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            console.log("当前浏览器支持电池API，使用真实数据。");
            
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
        // 如果设备不支持，启动模拟器
        console.log("当前浏览器不支持电池API，启动模拟电量。");
        startBatterySimulator(); 
    }
}

// 启动电池功能
initRealBatterySystem();


// ==================== 2. 时间和日期 (每秒更新) ====================
function updateTimeAndDate() {
    const now = new Date();
    
    // --- 1. 锁屏日期 (手动拼接，100% 杜绝年份) ---
    const month = now.getMonth() + 1; // 获取月份
    const day = now.getDate();        // 获取日期
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[now.getDay()];

    // 🌟 格式结果： "12月9日 星期二"
    // (注意：这里没有加年份)
    const dateStr = `${month}月${day}日 ${weekDay}`;


    // --- 2. 锁屏时间 (24小时制) ---
    // 手动补零，确保 08:05 这种格式
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    // 🌟 格式结果： "22:13"
    const mainTimeStr = `${hours}:${minutes}`;


    // --- 3. 更新界面元素 ---
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    
    if (dateEl) dateEl.textContent = dateStr;
    if (timeEl) timeEl.textContent = mainTimeStr;

    // --- 4. 状态栏小时间 ---
    if (lockStatusBarTime) lockStatusBarTime.textContent = mainTimeStr;
    if (homeStatusBarTime) homeStatusBarTime.textContent = mainTimeStr;
    if (passcodeStatusBarTime) passcodeStatusBarTime.textContent = mainTimeStr;
}

// 立即运行
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


// ==================== 4. 向上滑动解锁事件监听 ====================
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

// ==================== 5. 主屏幕下拉返回锁屏事件监听 ====================
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

// ==================== 解锁核心逻辑函数 (新增/修正部分) ====================

const UNLOCK_THRESHOLD = 50; // 滑动超过 50px 才算有效解锁
const RETURN_THRESHOLD = 50; // 下拉超过 50px 返回

/**
 * 尝试解锁屏幕。
 * @param {number} endY 触摸/鼠标释放时的 Y 坐标
 */
function tryUnlock(endY) {
    // 只有当 touchStartY 被设置（即从屏幕内部开始滑动）时才执行
    if (touchStartY === 0) return; 

    const swipeDistance = touchStartY - endY; // 向上滑动距离

    if (swipeDistance > UNLOCK_THRESHOLD) {
        // 向上滑动距离超过阈值，执行解锁动画和切换
        lockScreen.classList.add('fade-out'); // 添加淡出和上滑动画类
        
        // 延时执行屏幕切换（等待动画完成）
        setTimeout(() => {
            lockScreen.classList.add('hidden'); // 实际隐藏锁屏
            lockScreen.classList.remove('fade-out'); // 移除动画类
            homeScreen.classList.remove('hidden'); // 显示主屏幕
        }, ANIMATION_DURATION); // ANIMATION_DURATION 是 480ms
    }
    
    // 重置起始位置，防止下次错误触发
    touchStartY = 0; 
}

/**
 * 尝试从主屏幕返回锁屏。
 * @param {number} endY 触摸/鼠标释放时的 Y 坐标
 */
function tryReturnToLock(endY) {
    // 只有当 homeTouchStartY 被设置（即从状态栏开始滑动）时才执行
    if (homeTouchStartY === 0) return; 
    
    const swipeDistance = endY - homeTouchStartY; // 向下滑动距离

    if (swipeDistance > RETURN_THRESHOLD) {
        // 向下滑动距离超过阈值，返回锁屏
        homeScreen.classList.add('hidden'); // 隐藏主屏幕
        lockScreen.classList.remove('hidden'); // 显示锁屏
        
        // 可选：添加一个短暂的动画效果，让返回更自然
        lockScreen.classList.add('fade-in', 'active');
        setTimeout(() => {
            lockScreen.classList.remove('fade-in', 'active');
        }, 50); 
    }
    
    // 重置起始位置
    homeTouchStartY = 0;
}
// =========================================================================


// ==================== 6. 相机应用打开/关闭逻辑 ====================

// 监听 Dock 栏相机图标点击事件 (从主屏幕打开)
if (cameraAppIcon && cameraApp) {
    cameraAppIcon.addEventListener('click', () => {
        // 【修改】：设置状态为 false
        cameraOpenedFromLock = false;

        // 确保先关闭主屏幕
        homeScreen.classList.add('hidden');
        
        // 延迟打开相机 App，模仿过渡
        setTimeout(() => {
            cameraApp.classList.remove('hidden');
        }, 50); 
    });
}

// 监听锁屏相机快捷方式点击事件 (从锁屏打开)
if (lockScreenCameraShortcut && cameraApp) {
    lockScreenCameraShortcut.addEventListener('click', e => {
        // 阻止事件冒泡，防止点击相机图标时触发向上滑动解锁
        e.stopPropagation(); 
        
        // 【修改】：设置状态为 true
        cameraOpenedFromLock = true;
        
        // 1. 隐藏锁屏
        lockScreen.classList.add('hidden');
        
        // 2. 延迟打开相机 App，模仿过渡
        setTimeout(() => {
            cameraApp.classList.remove('hidden');
        }, 50); 
    });
}


// 监听相机 App 关闭按钮点击事件
if (cameraCloseButton && cameraApp) {
    cameraCloseButton.addEventListener('click', () => {
        // 隐藏相机 App
        cameraApp.classList.add('hidden');
        
        // 【核心修改】：根据 cameraOpenedFromLock 决定返回哪个界面
        if (cameraOpenedFromLock) {
            // 如果是从锁屏打开的，返回锁屏
            lockScreen.classList.remove('hidden');
            
            // 可选：添加一个短暂的动画效果，让返回更自然
            lockScreen.classList.add('fade-in', 'active');
            setTimeout(() => {
                lockScreen.classList.remove('fade-in', 'active');
            }, 50); 
        } else {
            // 否则（从主屏幕打开的），返回主屏幕
            homeScreen.classList.remove('hidden');
        }
    });
}

// ==================== 7. 快门按钮点击动画 ====================

if (shutterButton) {
    shutterButton.addEventListener('click', () => {
        // 1. 触发点击动画
        shutterButton.classList.add('shutter-active');

        // 2. 模拟拍摄/动画时间后，移除激活状态
        setTimeout(() => {
            shutterButton.classList.remove('shutter-active');
        }, 150); // 150毫秒的短暂动画
    });
}
// index.js (替换现有的 updateCameraMode 函数)
function updateCameraMode(newMode) {
    // 1. 更新模式激活状态
    document.querySelectorAll('.mode-selector span').forEach(span => {
        if (span.getAttribute('data-mode') === newMode) {
            span.classList.add('mode-active');
        } else {
            span.classList.remove('mode-active');
        }
    });

    // 2. 显示/隐藏专业模式控制面板
    if (proControls) {
        if (newMode === 'pro') {
            // PRO 模式：默认显示控制面板
            proControls.classList.remove('hidden');
        } else {
            // 其他模式：隐藏控制面板
            proControls.classList.add('hidden');
        }
    }
}

// 监听模式选择器点击事件
if (modeSelector) {
    modeSelector.addEventListener('click', (e) => {
        const target = e.target;
        // 确保点击的是带有 data-mode 属性的 span 元素
        if (target.tagName === 'SPAN' && target.hasAttribute('data-mode')) {
            const newMode = target.getAttribute('data-mode');
            updateCameraMode(newMode);
        }
    });
}

// ==================== 9. 专业模式滑块控制 (新增) ====================

// ISO 滑块监听器：更新 ISO 数值显示
if (isoSlider && isoValueSpan) {
    isoSlider.addEventListener('input', () => {
        isoValueSpan.textContent = isoSlider.value;
    });
}

// 快门速度滑块监听器：更新快门速度显示
if (shutterSlider && shutterValueSpan) {
    shutterSlider.addEventListener('input', () => {
        // 使用映射表将滑块的 0-10 索引映射到真实的快门速度值
        const valueIndex = parseInt(shutterSlider.value);
        shutterValueSpan.textContent = shutterSpeedMap[valueIndex] || 'Auto';
    });
    
    // 初始化快门速度显示（确保和 HTML 中的默认值一致）
    shutterValueSpan.textContent = shutterSpeedMap[shutterSlider.value];
}
// index.js (在文件开头，获取元素的部分新增)
// const cameraViewfinder = document.querySelector('.camera-viewfinder'); 

// ... (在文件末尾，新增以下代码块)

// ==================== 10. 专业模式控制面板隐藏/显示 (新增) ====================

// 监听取景框点击事件
if (cameraViewfinder && proControls) {
    cameraViewfinder.addEventListener('click', () => {
        // 只有在 PRO 模式下才执行隐藏操作
        const currentMode = document.querySelector('.mode-selector .mode-active').getAttribute('data-mode');
        
        if (currentMode === 'pro') {
            // 如果面板是可见的，则隐藏它；如果已隐藏，则再次显示（模拟开关）
            if (!proControls.classList.contains('hidden')) {
                proControls.classList.add('hidden');
            } else {
                // 如果用户再次点击，也可以重新显示它
                proControls.classList.remove('hidden');
            }
        }
    });
}