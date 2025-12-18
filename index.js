// ============================================
//              PurrPhone - 完整修复版
// ============================================

console.log('🚀 PurrPhone 正在启动...');

// ==================== 全局变量 ====================
let simulatedBatteryLevel = 85;
let isSimulatedCharging = false;
let cameraOpenedFromLock = false;
let touchStartY = 0;
let homeTouchStartY = 0;

// ==================== 工具函数 ====================

function $(id) {
    return document.getElementById(id);
}

function qs(selector) {
    return document.querySelector(selector);
}

function qsa(selector) {
    return document.querySelectorAll(selector);
}

// ==================== 1. 初始状态设置 ====================

function initScreenStates() {
    console.log('📱 初始化屏幕状态...');
    
    // 确保正确的初始显示状态
    $('lock-screen').classList.remove('hidden');
    $('lock-screen').style.display = 'flex';
    $('lock-screen').style.visibility = 'visible';
    $('lock-screen').style.opacity = '1';
    
    $('home-screen').classList.add('hidden');
    $('home-screen').style.display = 'none';
    
    if ($('camera-app')) {
        $('camera-app').classList.add('hidden');
        $('camera-app').style.display = 'none';
    }
    
    if ($('chat-app')) {
        $('chat-app').classList.add('hidden');
        $('chat-app').style.display = 'none';
    }
    
    console.log('✅ 屏幕状态初始化完成');
}

// ==================== 2. 时间和日期 ====================

function initTimeAndDate() {
    console.log('⏰ 初始化时间系统...');
    
    function updateTime() {
        try {
            const now = new Date();
            
            // 日期格式化
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            const weekDay = weekDays[now.getDay()];
            const dateStr = `${month}月${day}日 ${weekDay}`;
            
            // 时间格式化
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            // 更新锁屏显示
            const dateEl = $('current-date');
            const timeEl = $('current-time');
            
            if (dateEl) dateEl.textContent = dateStr;
            if (timeEl) timeEl.textContent = timeStr;
            
            // 更新状态栏时间
            qsa('.status-time').forEach(el => {
                if (el) el.textContent = timeStr;
            });
            
            // 调试信息
            console.log(`🕐 时间更新: ${dateStr} ${timeStr}`);
        } catch (error) {
            console.error('❌ 更新时间失败:', error);
        }
    }
    
    // 立即更新一次
    updateTime();
    // 每秒更新一次
    setInterval(updateTime, 1000);
    
    console.log('✅ 时间系统初始化完成');
}

// ==================== 3. 电池系统 ==================== 

function initBatterySystem() {
    console.log('🔋 正在初始化智能电池系统...');

    // 更新图标和样式的通用函数
    function updateBatteryUI(level, isCharging) {
        let iconClass = '';
        if (level > 90) iconClass = 'fa-battery-full';
        else if (level > 60) iconClass = 'fa-battery-three-quarters';
        else if (level > 30) iconClass = 'fa-battery-half';
        else if (level > 10) iconClass = 'fa-battery-quarter';
        else iconClass = 'fa-battery-empty';

        qsa('.battery-icon').forEach(icon => {
            if (icon) {
                icon.className = `fas ${iconClass} battery-icon`;
                if (isCharging) {
                    icon.classList.add('charging');
                    icon.style.color = '#90ee90'; // 充电绿色
                } else {
                    icon.classList.remove('charging');
                    icon.style.color = level <= 10 ? '#ff3b30' : 'white';
                }
            }
        });

        qsa('.battery-level').forEach(el => {
            if (el) el.textContent = level + '%';
        });

        // 小组件充电特效
        const leftWidget = qs('.widget.left-widget');
        if (leftWidget) {
            isCharging ? leftWidget.classList.add('widget-charging-flash') : leftWidget.classList.remove('widget-charging-flash');
        }
    }

    // 方案 A: 使用真实浏览器 API
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            console.log("✅ 已链接系统电池 API");
            
            const refresh = () => updateBatteryUI(Math.round(battery.level * 100), battery.charging);
            
            refresh();
            battery.addEventListener('levelchange', refresh);
            battery.addEventListener('chargingchange', refresh);
        });
    } 
    // 方案 B: 降级为模拟系统
    else {
        console.log("⚠️ 浏览器不支持电池 API，开启模拟模式");
        
        const runSimulation = () => {
            if (isSimulatedCharging) {
                simulatedBatteryLevel = Math.min(100, simulatedBatteryLevel + 1);
            } else {
                simulatedBatteryLevel = Math.max(1, simulatedBatteryLevel - 1);
            }
            updateBatteryUI(simulatedBatteryLevel, isSimulatedCharging);
        };

        setInterval(runSimulation, 5000);
        updateBatteryUI(simulatedBatteryLevel, isSimulatedCharging);
        
        // 只有模拟模式下，点击状态栏才能手动切换充电状态（方便调试）
        qsa('.top-status-bar').forEach(bar => {
            bar.addEventListener('click', () => {
                isSimulatedCharging = !isSimulatedCharging;
                updateBatteryUI(simulatedBatteryLevel, isSimulatedCharging);
            });
        });
    }
}

// ==================== 4. 锁屏交互 ====================

function initLockScreenInteractions() {
    console.log('📱 初始化锁屏交互...');
    
    const lockScreen = $('lock-screen');
    const homeScreen = $('home-screen');
    const catSlogan = $('cat-slogan');
    const flashlight = $('flashlight-toggle');
    
    if (!lockScreen || !homeScreen) {
        console.error('❌ 找不到锁屏或主屏幕元素');
        return;
    }
    
    // 猫咪口号点击 - 表情雨
    if (catSlogan) {
        catSlogan.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('🐱 猫咪口号被点击');
            
            const emojis = ['💗', '😻', '⭐', '💕', '🐾'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const emojiShower = $('emoji-shower');
            
            if (emojiShower) {
                const emojiEl = document.createElement('span');
                emojiEl.textContent = emoji;
                emojiEl.className = 'floating-emoji';
                emojiEl.style.transform = `translateX(${Math.random() * 40 - 20}px)`;
                
                emojiShower.appendChild(emojiEl);
                setTimeout(() => {
                    if (emojiEl.parentNode === emojiShower) {
                        emojiShower.removeChild(emojiEl);
                    }
                }, 1600);
            }
        });
    }
    
    // 手电筒开关
    if (flashlight) {
        flashlight.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('🔦 手电筒被点击');
            
            const isOn = flashlight.classList.toggle('on');
            const heartIcon = flashlight.querySelector('.heart-icon');
            
            if (heartIcon) {
                heartIcon.textContent = isOn ? '💗' : '♡';
                heartIcon.style.color = isOn ? '#ff6dc8' : 'white';
                heartIcon.style.textShadow = isOn ? '0 0 15px #ff6dc8' : 'none';
            }
        });
    }
    
    // 锁屏相机快捷方式
    const lockScreenCamera = qs('.lock-screen .shortcut-icon.camera');
    if (lockScreenCamera) {
        lockScreenCamera.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('📷 从锁屏打开相机');
            
            cameraOpenedFromLock = true;
            lockScreen.classList.add('hidden');
            lockScreen.style.display = 'none';
            
            const cameraApp = $('camera-app');
            if (cameraApp) {
                setTimeout(() => {
                    cameraApp.classList.remove('hidden');
                    cameraApp.style.display = 'flex';
                }, 50);
            }
        });
    }
    
    // 解锁滑动逻辑
    lockScreen.addEventListener('touchstart', function(e) {
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) {
            return;
        }
        touchStartY = e.touches[0].clientY;
        console.log(`👆 触摸开始: ${touchStartY}px`);
    }, { passive: true });
    
    lockScreen.addEventListener('touchend', function(e) {
        if (touchStartY === 0) return;
        
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) {
            touchStartY = 0;
            return;
        }
        
        const endY = e.changedTouches[0].clientY;
        const distance = touchStartY - endY;
        console.log(`👆 触摸结束: ${endY}px, 滑动距离: ${distance}px`);
        
        if (distance > 50) {
            unlockPhone();
        }
        
        touchStartY = 0;
    });
    
    // 鼠标事件支持
    lockScreen.addEventListener('mousedown', function(e) {
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) return;
        touchStartY = e.clientY;
        console.log(`🖱️ 鼠标按下: ${touchStartY}px`);
    });
    
    lockScreen.addEventListener('mouseup', function(e) {
        if (touchStartY === 0) return;
        
        if (e.target.closest('#cat-slogan') || e.target.closest('.shortcut-icon')) {
            touchStartY = 0;
            return;
        }
        
        const endY = e.clientY;
        const distance = touchStartY - endY;
        console.log(`🖱️ 鼠标释放: ${endY}px, 滑动距离: ${distance}px`);
        
        if (distance > 50) {
            unlockPhone();
        }
        
        touchStartY = 0;
    });
    
    // 解锁函数
  function unlockPhone() {
    const lockScreen = $('lock-screen');
    const homeScreen = $('home-screen');

    // 1️⃣ 锁屏滑走
    lockScreen.classList.add('slide-up-exit');

    // 2️⃣ 显示主屏幕
    homeScreen.classList.remove('hidden');
    homeScreen.style.display = 'flex';

    // ⭐ 关键：强制重播动画
    homeScreen.classList.remove('home-screen-animate');
    void homeScreen.offsetWidth; // 👈 强制浏览器重排（非常关键）
    homeScreen.classList.add('home-screen-animate');

    // 3️⃣ 收尾
    setTimeout(() => {
        lockScreen.classList.add('hidden');
        lockScreen.style.display = 'none';
        lockScreen.classList.remove('slide-up-exit');
    }, 600);
}
    
    // 主屏幕下拉返回锁屏
    const homeStatusBar = $('home-status-bar');
    if (homeStatusBar) {
        homeStatusBar.addEventListener('touchstart', function(e) {
            homeTouchStartY = e.touches[0].clientY;
            console.log(`📱 主屏幕触摸开始: ${homeTouchStartY}px`);
        }, { passive: true });
        
        homeStatusBar.addEventListener('touchend', function(e) {
            if (homeTouchStartY === 0) return;
            
            const endY = e.changedTouches[0].clientY;
            const distance = endY - homeTouchStartY;
            console.log(`📱 主屏幕触摸结束: ${endY}px, 下拉距离: ${distance}px`);
            
            if (distance > 50) {
                lockPhone();
            }
            
            homeTouchStartY = 0;
        });
        
        // 鼠标事件
        homeStatusBar.addEventListener('mousedown', function(e) {
            homeTouchStartY = e.clientY;
            console.log(`🖱️ 主屏幕鼠标按下: ${homeTouchStartY}px`);
        });
        
        homeStatusBar.addEventListener('mouseup', function(e) {
            if (homeTouchStartY === 0) return;
            
            const endY = e.clientY;
            const distance = endY - homeTouchStartY;
            console.log(`🖱️ 主屏幕鼠标释放: ${endY}px, 下拉距离: ${distance}px`);
            
            if (distance > 50) {
                lockPhone();
            }
            
            homeTouchStartY = 0;
        });
    }
    
    // 锁屏函数
    function lockPhone() {
        console.log('🔒 返回锁屏！');
        
        homeScreen.classList.add('hidden');
        homeScreen.style.display = 'none';
        
        lockScreen.classList.remove('hidden');
        lockScreen.style.display = 'flex';
        lockScreen.classList.add('fade-in');
        
        setTimeout(() => {
            lockScreen.classList.remove('fade-in');
        }, 50);
    }
    
    console.log('✅ 锁屏交互初始化完成');
}

// ==================== 5. 主屏幕功能 ====================

function initHomeScreen() {
    console.log('🏠 初始化主屏幕...');
    
    // 主屏幕相机图标
    const cameraAppIcon = qs('.camera-app-icon');
    if (cameraAppIcon) {
        cameraAppIcon.addEventListener('click', function() {
            console.log('📷 从主屏幕打开相机');
            cameraOpenedFromLock = false;
            
            const homeScreen = $('home-screen');
            if (homeScreen) {
                homeScreen.classList.add('hidden');
                homeScreen.style.display = 'none';
            }
            
            const cameraApp = $('camera-app');
            if (cameraApp) {
                setTimeout(() => {
                    cameraApp.classList.remove('hidden');
                    cameraApp.style.display = 'flex';
                }, 50);
            }
        });
    }
    
    // Chat应用图标
    const chatWidget = qs('.wechat-app-widget');
    if (chatWidget) {
        chatWidget.addEventListener('click', function() {
            console.log('💬 打开Chat应用');
            
            const homeScreen = $('home-screen');
            if (homeScreen) {
                homeScreen.classList.add('hidden');
                homeScreen.style.display = 'none';
            }
            
            const chatApp = $('chat-app');
            if (chatApp) {
                chatApp.classList.remove('hidden');
                chatApp.style.display = 'flex';
            }
        });
    }
    
    console.log('✅ 主屏幕初始化完成');
}

// ==================== 6. 相机应用 ====================

function initCameraApp() {
    console.log('📷 初始化相机应用...');
    
    const cameraApp = $('camera-app');
    if (!cameraApp) {
        console.warn('⚠️ 找不到相机应用元素');
        return;
    }
    
    // 关闭相机按钮
    const cameraCloseBtn = $('camera-close-button');
    if (cameraCloseBtn) {
        cameraCloseBtn.addEventListener('click', function() {
            console.log('❌ 关闭相机');
            
            cameraApp.classList.add('hidden');
            cameraApp.style.display = 'none';
            
            if (cameraOpenedFromLock) {
                // 返回锁屏
                const lockScreen = $('lock-screen');
                if (lockScreen) {
                    lockScreen.classList.remove('hidden');
                    lockScreen.style.display = 'flex';
                    lockScreen.classList.add('fade-in');
                    setTimeout(() => lockScreen.classList.remove('fade-in'), 50);
                }
            } else {
                // 返回主屏幕
                const homeScreen = $('home-screen');
                if (homeScreen) {
                    homeScreen.classList.remove('hidden');
                    homeScreen.style.display = 'flex';
                }
            }
        });
    }
    
    // 快门按钮
    const shutterBtn = qs('.shutter-button');
    if (shutterBtn) {
        shutterBtn.addEventListener('click', function() {
            console.log('📸 拍照！');
            shutterBtn.classList.add('shutter-active');
            
            setTimeout(() => {
                shutterBtn.classList.remove('shutter-active');
            }, 150);
        });
    }
    
    // 相机模式切换
    const modeSelector = qs('.mode-selector');
    if (modeSelector) {
        // 设置初始激活模式
        const photoMode = modeSelector.querySelector('[data-mode="photo"]');
        if (photoMode) photoMode.classList.add('mode-active');
        
        modeSelector.addEventListener('click', function(e) {
            if (e.target.tagName === 'SPAN' && e.target.dataset.mode) {
                const mode = e.target.dataset.mode;
                console.log(`🔄 切换到 ${mode} 模式`);
                
                // 移除所有激活状态
                qsa('.mode-selector span').forEach(span => {
                    span.classList.remove('mode-active');
                });
                
                // 激活当前模式
                e.target.classList.add('mode-active');
                
                // 专业模式显示控制面板
                const proControls = qs('.pro-controls');
                if (proControls) {
                    if (mode === 'pro') {
                        proControls.classList.remove('hidden');
                    } else {
                        proControls.classList.add('hidden');
                    }
                }
            }
        });
    }
    
    console.log('✅ 相机应用初始化完成');
}

// ==================== 7. Chat应用 ====================

function initChatApp() {
    console.log('💬 初始化Chat应用...');
    
    const chatApp = $('chat-app');
    if (!chatApp) {
        console.warn('⚠️ 找不到Chat应用元素');
        return;
    }
    
    // 退出Chat应用
    const exitChatBtn = $('exit-chat');
    if (exitChatBtn) {
        exitChatBtn.addEventListener('click', function() {
            console.log('👋 退出Chat应用');
            
            chatApp.classList.add('hidden');
            chatApp.style.display = 'none';
            
            const homeScreen = $('home-screen');
            if (homeScreen) {
                homeScreen.classList.remove('hidden');
                homeScreen.style.display = 'flex';
            }
        });
    }
    
    // Tab切换
    qsa('.tab-item').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            console.log(`📑 切换到 ${tabId} 标签`);
            
            // 更新Tab状态
            qsa('.tab-item').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // 更新内容
            qsa('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            const targetPane = $(`tab-${tabId}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });
    
    console.log('✅ Chat应用初始化完成');
}

// ==================== 主初始化函数 ====================

function initPurrPhone() {
    console.log('🔧 开始初始化PurrPhone...');
    
    try {
        // 按顺序初始化所有模块
        initScreenStates();              // 1. 初始屏幕状态
        initTimeAndDate();               // 2. 时间和日期
        initBatterySystem();             // 3. 电池系统
        initLockScreenInteractions();    // 4. 锁屏交互
        initHomeScreen();                // 5. 主屏幕功能
        initCameraApp();                 // 6. 相机应用
        initChatApp();                   // 7. Chat应用
        
        console.log('✅ PurrPhone 初始化完成！');
        console.log('================================');
        console.log('📱 使用说明：');
        console.log('1. 向上滑动锁屏解锁');
        console.log('2. 下拉主屏幕状态栏返回锁屏');
        console.log('3. 点击左下角❤️开关手电筒');
        console.log('4. 锁屏点击相机图标打开相机');
        console.log('5. 主屏幕点击相机图标打开相机');
        console.log('6. 主屏幕点击Chat图标打开聊天');
        console.log('================================');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
    }
}

// ==================== 页面加载事件 ====================

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPurrPhone);
} else {
    // DOM已经加载完成，直接初始化
    initPurrPhone();
}

// 页面完全加载后再次检查
window.addEventListener('load', function() {
    setTimeout(() => {
        const homeScreen = $('home-screen');
        if (homeScreen) {
            homeScreen.classList.add('hidden');
            homeScreen.style.display = 'none';
            // 初始加载时移除动画类，防止闪烁
            homeScreen.classList.remove('home-screen-animate'); 
        }
    }, 100);
});

// 防止页面滚动
document.addEventListener('touchmove', function(e) {
    if (e.target.closest('.phone-frame') || 
        e.target.closest('.lock-screen') || 
        e.target.closest('.home-screen')) {
        e.preventDefault();
    }
}, { passive: false });