// 全局变量
let currentUser = null;
let gameRenderer = null;
let isFirstPerson = false;
let audioManager = null;
let moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};
let joystickStates = {
    left: { x: 0, y: 0, active: false },
    right: { x: 0, y: 0, active: false }
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkMobileDevice();
    initAudioManager();
});

// 初始化应用
function initializeApp() {
    const token = localStorage.getItem('token');
    if (token) {
        verifyToken(token);
    } else {
        showLogin();
    }
}

// 初始化音频管理器
function initAudioManager() {
    audioManager = new AudioManager();
    // 预加载游戏音效
    audioManager.loadSound('join', 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXLHpuoA2Sg==');
    audioManager.loadSound('click', 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXLHpuoA2Sg==');
}

// 验证Token
async function verifyToken(token) {
    try {
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            showMain();
            initSocket();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showLogin();
        }
    } catch (error) {
        console.error('Token验证失败:', error);
        showLogin();
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 移动端触摸事件
    setupMobileControls();
    
    // 聊天输入框事件
    setupChatInputEvents();
    
    // 个人偏好设置事件
    setupPreferencesEvents();
    
    // 头像上传事件
    setupAvatarUploadEvents();
}

// 设置聊天输入事件
function setupChatInputEvents() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessageFromInput();
            }
        });
    }
}

// 设置个人偏好事件
function setupPreferencesEvents() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', function() {
            volumeValue.textContent = this.value + '%';
            if (audioManager) {
                audioManager.setVolume(this.value / 100);
            }
        });
    }
}

// 设置头像上传事件
function setupAvatarUploadEvents() {
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadAvatar(file);
            }
        });
    }
}

// 检测移动设备
function checkMobileDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }
}

// 显示不同界面
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // 播放界面切换音效
    if (audioManager) {
        audioManager.play('click', 0.3);
    }
}

function showLogin() {
    showScreen('loginScreen');
}

function showRegister() {
    showScreen('registerScreen');
}

function showMain() {
    showScreen('mainScreen');
    updateUserInfo();
    
    // 检查是否是管理员
    if (currentUser && currentUser.isAdmin) {
        addAdminButton();
    }
}

function showRooms() {
    showScreen('roomsScreen');
    loadRoomsList();
}

function createRoom() {
    showScreen('createRoomScreen');
}

function showGameRoom() {
    showScreen('gameRoomScreen');
    
    // 确保有当前房间数据
    if (!currentRoom) {
        showMessage('房间数据加载失败', 'error');
        showRooms();
        return;
    }

    // 更新房间显示
    updateRoomDisplay();
    
    // 初始化聊天区域
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 添加房间事件监听
    setupRoomEventListeners();
    
    // 清除加载状态
    showLoading(false);
    
    // 播放加入房间音效
    if (audioManager) {
        audioManager.play('join', 0.5);
    }
}

function setupRoomEventListeners() {
    // 准备按钮
    const readyBtn = document.getElementById('readyBtn');
    if (readyBtn) {
        readyBtn.onclick = toggleReady;
    }
    
    // 开始游戏按钮
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.onclick = forceStartGame;
    }
    
    // 离开房间按钮
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    if (leaveRoomBtn) {
        leaveRoomBtn.onclick = leaveRoom;
    }
    
    // 聊天发送按钮
    const chatSendBtn = document.getElementById('chatSendBtn');
    if (chatSendBtn) {
        chatSendBtn.onclick = sendChatMessageFromInput;
    }
}

function showProfile() {
    showScreen('profileScreen');
    loadUserProfile();
}

function showForum() {
    showScreen('forumScreen');
    loadForumPosts();
}

function showCreatePost() {
    showScreen('createPostScreen');
}

function showEquipment() {
    showScreen('equipmentScreen');
    loadEquipment();
}

function showRules() {
    showScreen('rulesScreen');
}

function showAdmin() {
    if (currentUser && currentUser.isAdmin) {
        showScreen('adminScreen');
        loadAdminData();
    } else {
        showMessage('权限不足', 'error');
    }
}

// 添加管理员按钮
function addAdminButton() {
    const functionArea = document.querySelector('.function-area');
    if (functionArea && !document.getElementById('adminBtn')) {
        const adminBtn = document.createElement('button');
        adminBtn.id = 'adminBtn';
        adminBtn.className = 'btn-function';
        adminBtn.textContent = '🏛️ 管理员控制台';
        adminBtn.onclick = showAdmin;
        functionArea.appendChild(adminBtn);
    }
}

// 用户认证功能
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showMessage('请输入用户名和密码', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showMessage('登录成功');
            showMain();
            initSocket();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('登录失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!username || !password || !confirmPassword) {
        showMessage('请填写所有字段', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('密码不匹配', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('密码至少6位', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showMessage('注册成功');
            showMain();
            initSocket();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('注册失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    disconnectSocket();
    showLogin();
    showMessage('已退出登录');
}

// 更新用户信息显示
function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userWelcome').textContent = `欢迎, ${currentUser.username}`;
        document.getElementById('userCoins').textContent = `金币: ${currentUser.coins}`;
        
        // 更新用户头像初始字母
        const userInitial = document.getElementById('userInitial');
        if (userInitial) {
            userInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        }
    }
}

// 房间管理功能
async function loadRoomsList() {
    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();
        
        const roomsList = document.getElementById('roomsList');
        roomsList.innerHTML = '';

        if (rooms.length === 0) {
            roomsList.innerHTML = '<div class="no-rooms">暂无房间，创建一个吧！</div>';
            return;
        }

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            roomElement.innerHTML = `
                <h3>${room.name}</h3>
                <p>游戏模式: ${getGameModeName(room.gameMode)}</p>
                <p>玩家: ${room.players}/${room.maxPlayers}</p>
                <p class="room-status status-${room.status}">${getStatusName(room.status)}</p>
                <button onclick="joinRoom('${room.id}')" 
                    ${room.status !== 'waiting' || room.players >= room.maxPlayers ? 'disabled' : ''} 
                    class="btn-primary">
                    ${room.status === 'waiting' && room.players < room.maxPlayers ? '加入房间' : '无法加入'}
                </button>
            `;
            roomsList.appendChild(roomElement);
        });
    } catch (error) {
        showMessage('加载房间列表失败', 'error');
    }
}

function getGameModeName(mode) {
    const names = {
        'classic': '怀旧局',
        'infection': '感染赛',
        'bodyguard': '保镖局'
    };
    return names[mode] || mode;
}

function getStatusName(status) {
    const names = {
        'waiting': '等待中',
        'playing': '游戏中',
        'finished': '已结束'
    };
    return names[status] || status;
}

function refreshRooms() {
    loadRoomsList();
    showMessage('房间列表已刷新');
}

function confirmCreateRoom() {
    const roomName = document.getElementById('roomName').value.trim();
    const gameMode = document.getElementById('gameMode').value;
    const maxPlayersInput = document.getElementById('maxPlayers');
    const maxPlayers = parseInt(maxPlayersInput.value);

    // 增强表单验证
    if (!roomName) {
        showMessage('请输入房间名称', 'error');
        return;
    }

    if (roomName.length > 20) {
        showMessage('房间名称不能超过20个字符', 'error');
        return;
    }

    if (isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 10) {
        showMessage('请输入有效的最大玩家数 (2-10)', 'error');
        return;
    }

    showLoading(true);
    
    try {
        // 调用Socket.IO创建房间
        if (socket) {
            socket.emit('createRoom', {
                name: roomName,
                gameMode: gameMode,
                maxPlayers: maxPlayers
            }, (response) => {
                showLoading(false);
                if (response.success) {
                    showMessage('房间创建成功');
                    currentRoom = response.room;
                    showGameRoom();
                } else {
                    showMessage(response.error || '创建房间失败', 'error');
                }
            });
        } else {
            showMessage('网络连接异常，请刷新页面重试', 'error');
        }
    } catch (error) {
        showLoading(false);
        showMessage('创建房间时发生错误: ' + error.message, 'error');
    }
}

// 游戏房间显示
function updateRoomDisplay() {
    if (!currentRoom) return;

    document.getElementById('roomTitle').textContent = `房间: ${currentRoom.name}`;
    
    const playersContainer = document.getElementById('roomPlayers');
    playersContainer.innerHTML = '';

    currentRoom.players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = `player-item ${player.ready ? 'player-ready' : ''}`;
        
        // 显示房主标识
        const hostIndicator = player.id === currentRoom.host ? ' 👑' : '';
        const playerName = player.id === currentUser.id ? '你' : player.username || `玩家${player.id.slice(0, 8)}`;
        
        playerElement.innerHTML = `
            <span>${playerName}${hostIndicator}</span>
            <span class="player-status">${player.ready ? '已准备' : '未准备'}</span>
        `;
        playersContainer.appendChild(playerElement);
    });

    // 更新准备按钮
    const readyBtn = document.getElementById('readyBtn');
    const myPlayer = currentRoom.players.find(p => p.id === currentUser.id);
    if (myPlayer) {
        readyBtn.textContent = myPlayer.ready ? '取消准备' : '准备';
        readyBtn.className = myPlayer.ready ? 'btn-warning' : 'btn-primary';
    }

    // 显示/隐藏强制开始按钮（仅房主可见）
    const startGameBtn = document.getElementById('startGameBtn');
    if (currentRoom.host === currentUser.id && currentRoom.players.length >= 2) {
        startGameBtn.style.display = 'block';
    } else {
        startGameBtn.style.display = 'none';
    }
}

// 强制开始游戏（仅房主）
function forceStartGame() {
    if (currentRoom && currentRoom.host === currentUser.id) {
        if (socket) {
            socket.emit('forceStartGame', {
                roomId: currentRoom.id
            });
        }
    }
}

// 个人主页功能
function loadUserProfile() {
    if (currentUser) {
        document.getElementById('profileUsername').value = currentUser.username;
        document.getElementById('profileCoins').textContent = currentUser.coins;
        
        // 生成用户头像
        const avatarInitial = document.getElementById('avatarInitial');
        if (avatarInitial) {
            avatarInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        }
        
        // 显示用户头像
        if (currentUser.avatar) {
            const avatarImage = document.getElementById('avatarImage');
            if (avatarImage) {
                avatarImage.src = currentUser.avatar;
                avatarImage.style.display = 'block';
                avatarInitial.style.display = 'none';
            }
        }
        
        // 加载用户偏好设置
        if (currentUser.preferences) {
            const volumeSlider = document.getElementById('volumeSlider');
            const volumeValue = document.getElementById('volumeValue');
            const graphicsSelect = document.getElementById('graphicsSelect');
            
            if (volumeSlider && currentUser.preferences.volume !== undefined) {
                volumeSlider.value = currentUser.preferences.volume * 100;
                volumeValue.textContent = Math.round(currentUser.preferences.volume * 100) + '%';
            }
            
            if (graphicsSelect && currentUser.preferences.graphics) {
                graphicsSelect.value = currentUser.preferences.graphics;
            }
        }
    }
}

function changeAvatar() {
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.click();
    }
}

async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    showLoading(true);

    try {
        const response = await fetch('/api/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentUser.avatar = data.avatar;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('头像上传成功');
            loadUserProfile();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('上传失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 继续main.js文件的剩余部分

async function updateUsername() {
    const newUsername = document.getElementById('profileUsername').value;
    if (!newUsername.trim()) {
        showMessage('用户名不能为空', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username: newUsername })
        });

        if (response.ok) {
            const data = await response.json();
            currentUser.username = newUsername;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('用户名修改成功');
            updateUserInfo();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('修改失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    if (!newPassword || newPassword.length < 6) {
        showMessage('密码至少6位', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ password: newPassword })
        });

        if (response.ok) {
            document.getElementById('newPassword').value = '';
            showMessage('密码修改成功');
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('修改失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function savePreferences() {
    const volumeSlider = document.getElementById('volumeSlider');
    const graphicsSelect = document.getElementById('graphicsSelect');
    
    const preferences = {
        volume: volumeSlider.value / 100,
        graphics: graphicsSelect.value
    };

    showLoading(true);

    try {
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ preferences })
        });

        if (response.ok) {
            currentUser.preferences = preferences;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('设置保存成功');
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('保存失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 论坛功能
async function loadForumPosts() {
    showLoading(true);

    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        
        const postsList = document.getElementById('postsList');
        const officialAnnouncements = document.getElementById('officialAnnouncements');
        
        postsList.innerHTML = '';
        officialAnnouncements.innerHTML = '';

        if (posts.length === 0) {
            postsList.innerHTML = '<div class="no-posts">暂无帖子</div>';
            return;
        }

        // 分离官方公告和普通帖子
        const announcements = posts.filter(post => post.isOfficial);
        const regularPosts = posts.filter(post => !post.isOfficial);

        // 显示官方公告
        if (announcements.length > 0) {
            announcements.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-item post-official';
                postElement.innerHTML = `
                    <h3>${post.title} 🏛️ 官方</h3>
                    <div class="post-meta">
                        发布时间: ${new Date(post.createdAt).toLocaleString()}
                    </div>
                    <p>${post.content}</p>
                    ${post.image ? `<img src="${post.image}" alt="帖子图片" class="post-image">` : ''}
                `;
                officialAnnouncements.appendChild(postElement);
            });
        } else {
            officialAnnouncements.innerHTML = '<div class="no-posts">暂无官方公告</div>';
        }

        // 显示普通帖子
        if (regularPosts.length > 0) {
            regularPosts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-item';
                postElement.innerHTML = `
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                        作者: ${post.author} | 发布时间: ${new Date(post.createdAt).toLocaleString()}
                    </div>
                    <p>${post.content}</p>
                    ${post.image ? `<img src="${post.image}" alt="帖子图片" class="post-image">` : ''}
                    <div class="post-actions">
                        ${currentUser && currentUser.isAdmin ? `<button onclick="deletePost('${post.id}')" class="btn-warning">删除</button>` : ''}
                    </div>
                `;
                postsList.appendChild(postElement);
            });
        } else {
            postsList.innerHTML = '<div class="no-posts">暂无用户帖子</div>';
        }
    } catch (error) {
        showMessage('加载帖子失败', 'error');
    } finally {
        showLoading(false);
    }
}

function refreshPosts() {
    loadForumPosts();
    showMessage('帖子列表已刷新');
}

async function submitPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const imageFile = document.getElementById('postImage').files[0];

    if (!title.trim() || !content.trim()) {
        showMessage('请填写标题和内容', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    showLoading(true);

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (response.ok) {
            showMessage('帖子发布成功');
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            document.getElementById('postImage').value = '';
            showForum();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('发布失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function deletePost(postId) {
    if (!confirm('确定要删除这个帖子吗？')) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showMessage('帖子删除成功');
            loadForumPosts();
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('删除失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 装备商店功能
async function loadEquipment() {
    showLoading(true);

    try {
        const response = await fetch('/api/equipment');
        const equipment = await response.json();
        
        const equipmentList = document.getElementById('equipmentList');
        const ownedEquipmentList = document.getElementById('ownedEquipmentList');
        
        equipmentList.innerHTML = '';
        ownedEquipmentList.innerHTML = '';

        // 更新金币显示
        document.getElementById('equipmentCoins').textContent = currentUser.coins;

        // 显示商店装备
        equipment.forEach(item => {
            const isOwned = currentUser.equipment && currentUser.equipment.some(e => e.id === item.id);
            
            if (!isOwned) {
                const itemElement = document.createElement('div');
                itemElement.className = 'equipment-item';
                itemElement.innerHTML = `
                    <h3>${item.icon} ${item.name}</h3>
                    <p class="equipment-effect">${item.effect}</p>
                    <p class="equipment-price">💰 ${item.price} 金币</p>
                    <button onclick="purchaseEquipment('${item.id}')" 
                        ${currentUser.coins < item.price ? 'disabled' : ''} 
                        class="btn-primary">
                        ${currentUser.coins >= item.price ? '购买' : '金币不足'}
                    </button>
                `;
                equipmentList.appendChild(itemElement);
            }
        });

        // 显示已拥有装备
        if (currentUser.equipment && currentUser.equipment.length > 0) {
            currentUser.equipment.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'equipment-item';
                itemElement.innerHTML = `
                    <h3>${item.icon} ${item.name}</h3>
                    <p class="equipment-effect">${item.effect}</p>
                    <p style="color: #4caf50; font-weight: bold;">已拥有</p>
                `;
                ownedEquipmentList.appendChild(itemElement);
            });
        } else {
            ownedEquipmentList.innerHTML = '<div class="no-posts">暂无装备</div>';
        }

        if (equipmentList.children.length === 0) {
            equipmentList.innerHTML = '<div class="no-posts">所有装备已拥有</div>';
        }
    } catch (error) {
        showMessage('加载装备失败', 'error');
    } finally {
        showLoading(false);
    }
}

async function purchaseEquipment(equipmentId) {
    showLoading(true);

    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ equipmentId })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser.coins = data.coins;
            currentUser.equipment = data.equipment;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMessage('购买成功');
            updateUserInfo();
            loadEquipment();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('购买失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 管理员功能
async function loadAdminData() {
    if (!currentUser || !currentUser.isAdmin) {
        showMessage('权限不足', 'error');
        return;
    }

    showAdminTab('rooms');
    loadAdminRooms();
}

function showAdminTab(tabName) {
    // 切换标签
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');

    // 加载对应数据
    switch (tabName) {
        case 'rooms':
            loadAdminRooms();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'equipment':
            loadAdminEquipment();
            break;
    }
}

async function loadAdminRooms() {
    try {
        const response = await fetch('/api/admin/rooms-status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const rooms = await response.json();
            const roomsList = document.getElementById('adminRoomsList');
            
            roomsList.innerHTML = '';
            
            if (rooms.length === 0) {
                roomsList.innerHTML = '<div class="no-rooms">暂无活动房间</div>';
                return;
            }

            rooms.forEach(room => {
                const roomElement = document.createElement('div');
                roomElement.className = 'room-item';
                roomElement.innerHTML = `
                    <h3>房间: ${room.name}</h3>
                    <p>ID: ${room.id}</p>
                    <p>模式: ${getGameModeName(room.gameMode)}</p>
                    <p>状态: ${getStatusName(room.status)}</p>
                    <p>玩家数量: ${room.players.length}/${room.maxPlayers}</p>
                    <div class="players-list">
                        ${room.players.map(p => `
                            <div class="player-item">
                                <span>${p.username} (${p.id.slice(0, 8)})</span>
                                <span>状态: ${p.ready ? '已准备' : '未准备'}</span>
                                ${p.role ? `<span>角色: ${getRoleName(p.role)}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
                roomsList.appendChild(roomElement);
            });
        } else {
            showMessage('加载房间状态失败', 'error');
        }
    } catch (error) {
        showMessage('加载失败，请检查网络连接', 'error');
    }
}

function loadAdminUsers() {
    // 用户管理界面已预设，暂不需要特殊加载
    console.log('用户管理界面已加载');
}

function loadAdminEquipment() {
    // 装备管理界面已预设，暂不需要特殊加载
    console.log('装备管理界面已加载');
}

async function banUser() {
    const userId = document.getElementById('banUserId').value;
    
    if (!userId.trim()) {
        showMessage('请输入用户ID', 'error');
        return;
    }

    if (!confirm('确定要封禁这个用户吗？')) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/admin/ban-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            showMessage('用户封禁成功');
            document.getElementById('banUserId').value = '';
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('封禁失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

async function addEquipment() {
    const name = document.getElementById('equipmentName').value;
    const price = document.getElementById('equipmentPrice').value;
    const effect = document.getElementById('equipmentEffect').value;
    const icon = document.getElementById('equipmentIcon').value;

    if (!name.trim() || !price || !effect.trim()) {
        showMessage('请填写所有必填字段', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/equipment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, price, effect, icon })
        });

        if (response.ok) {
            showMessage('装备添加成功');
            document.getElementById('equipmentName').value = '';
            document.getElementById('equipmentPrice').value = '';
            document.getElementById('equipmentEffect').value = '';
            document.getElementById('equipmentIcon').value = '';
        } else {
            const data = await response.json();
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('添加失败，请检查网络连接', 'error');
    } finally {
        showLoading(false);
    }
}

// 游戏功能
function startGameScreen() {
    showScreen('gameScreen');
    initGame3D();
    updateGameUI();
    updateEquipmentPanel();
    // 显示虚拟摇杆
    if (typeof initControls === 'function') {
        initControls(true);
    }
}

function initGame3D() {
    const canvas = document.getElementById('gameCanvas');
    gameRenderer = new GameRenderer(canvas);
    gameRenderer.init();
    
    if (gameState) {
        gameRenderer.setupGame(gameState);
    }
    
    // 开始游戏循环
    gameLoop();
}

function gameLoop() {
    if (gameRenderer && document.getElementById('gameScreen').classList.contains('active')) {
        // 处理移动
        handleMovement();
        
        // 更新渲染器
        gameRenderer.update();
        gameRenderer.render();
        
        requestAnimationFrame(gameLoop);
    }
}

function handleMovement() {
    if (!gameRenderer) return;

    const speed = 0.5;
    let moved = false;

    // 键盘控制
    if (moveState.forward) {
        gameRenderer.movePlayer(0, 0, -speed);
        moved = true;
    }
    if (moveState.backward) {
        gameRenderer.movePlayer(0, 0, speed);
        moved = true;
    }
    if (moveState.left) {
        gameRenderer.movePlayer(-speed, 0, 0);
        moved = true;
    }
    if (moveState.right) {
        gameRenderer.movePlayer(speed, 0, 0);
        moved = true;
    }

    // 移动端虚拟摇杆控制
    if (joystickStates.left.active) {
        const moveX = joystickStates.left.x * speed;
        const moveZ = -joystickStates.left.y * speed;
        gameRenderer.movePlayer(moveX, 0, moveZ);
        moved = true;
    }

    if (joystickStates.right.active) {
        gameRenderer.rotatePlayer(joystickStates.right.x * 0.02, joystickStates.right.y * 0.02);
        moved = true;
    }

    // 发送移动数据到服务器
    if (moved) {
        const playerPos = gameRenderer.getPlayerPosition();
        const playerRot = gameRenderer.getPlayerRotation();
        sendPlayerMove(playerPos, playerRot);
    }
}

function updateGameUI() {
    if (!gameState) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const myPlayer = gameState.players.find(p => p.id === user.id);
    
    if (myPlayer) {
        document.getElementById('gameRole').textContent = `角色: ${getRoleName(myPlayer.role)}`;
        document.getElementById('playerLives').textContent = `生命: ${myPlayer.lives}`;
        document.getElementById('safeZoneUses').textContent = `安全区: ${myPlayer.safeZoneUses}次`;
        
        // 更新安全区按钮
        const safeZoneBtn = document.getElementById('safeZoneBtn');
        if (myPlayer.role === 'catcher' || myPlayer.safeZoneUses <= 0) {
            safeZoneBtn.style.display = 'none';
        } else {
            safeZoneBtn.style.display = 'block';
        }
    }

    // 更新倒计时
    updateGameTimer();
}

function updateEquipmentPanel() {
    const equipmentList = document.getElementById('equipmentList');
    if (!equipmentList) return;

    equipmentList.innerHTML = '';

    if (currentUser.equipment && currentUser.equipment.length > 0) {
        currentUser.equipment.forEach(item => {
            const equipmentElement = document.createElement('div');
            equipmentElement.className = 'equipment-item';
            equipmentElement.innerHTML = `
                <span>${item.icon}</span>
                <span>${item.name}</span>
            `;
            equipmentList.appendChild(equipmentElement);
        });
    } else {
        equipmentList.innerHTML = '<div style="color: #999; text-align: center;">无装备</div>';
    }
}

function getRoleName(role) {
    const names = {
        'catcher': '抓捕者',
        'runner': '逃亡者',
        'medic': '医护人员',
        'vip': '被保护者',
        'bodyguard': '保镖'
    };
    return names[role] || role;
}

function updateGameTimer() {
    if (!gameState) return;
    
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('gameTimer').textContent = 
        `时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function toggleView() {
    isFirstPerson = !isFirstPerson;
    if (gameRenderer) {
        gameRenderer.setFirstPerson(isFirstPerson);
    }
    showMessage(isFirstPerson ? '切换到第一人称' : '切换到第三人称');
}

function enterSafeZone() {
    sendEnterSafeZone();
}

function useEquipment() {
    // 装备使用逻辑
    if (currentUser.equipment && currentUser.equipment.length > 0) {
        showMessage('装备功能开发中...', 'info');
    } else {
        showMessage('没有可用装备', 'warning');
    }
}

function handleGameEnd(result, winners) {
    const user = JSON.parse(localStorage.getItem('user'));
    const isWinner = winners.includes(user.id);
    
    showMessage(
        isWinner ? '恭喜！你获得了胜利！' : '游戏结束！',
        isWinner ? 'success' : 'info'
    );
    
    if (isWinner) {
        currentUser.coins += 10;
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUserInfo();
    }
}

// 聊天功能
function sendChatMessageFromInput() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message && socket && currentRoom) {
        sendChatMessage(message);
        input.value = '';
    }
}

function addChatMessage(username, message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 键盘事件处理
function handleKeyDown(event) {
    if (!gameRenderer || !document.getElementById('gameScreen').classList.contains('active')) return;

    switch(event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveState.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveState.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveState.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveState.right = true;
            break;
        case 'KeyV':
            toggleView();
            break;
        case 'KeyE':
            enterSafeZone();
            break;
        case 'KeyQ':
            useEquipment();
            break;
    }
}

function handleKeyUp(event) {
    if (!gameRenderer || !document.getElementById('gameScreen').classList.contains('active')) return;

    switch(event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveState.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveState.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveState.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveState.right = false;
            break;
    }
}

// 添加移动端控制逻辑
function setupMobileControls() {
    const controls = document.createElement('div');
    controls.id = 'mobile-controls';
    controls.innerHTML = `
        <div class="joystick" id="leftJoystick"></div>
        <div class="joystick" id="rightJoystick"></div>
    `;
    document.body.appendChild(controls);

    // 初始化虚拟摇杆
    initJoystick('leftJoystick', 'left');
    initJoystick('rightJoystick', 'right');

    // 添加房间创建按钮的双事件绑定
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('touchstart', handleCreateRoom, { passive: true });
        createRoomBtn.addEventListener('click', handleCreateRoom);
    }
}

function initJoystick(elementId, type) {
    const joystick = document.getElementById(elementId);
    let touchId = null;

    joystick.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        updateJoystickPosition(touch, type);
        joystickStates[type].active = true;
    }, { passive: false });

    document.addEventListener('touchmove', e => {
        Array.from(e.changedTouches).forEach(touch => {
            if (touch.identifier === touchId) {
                e.preventDefault();
                updateJoystickPosition(touch, type);
            }
        });
    }, { passive: false });

    document.addEventListener('touchend', e => {
        Array.from(e.changedTouches).forEach(touch => {
            if (touch.identifier === touchId) {
                joystickStates[type] = { x: 0, y: 0, active: false };
                joystick.style.transform = 'translate(-50%, -50%)';
            }
        });
    });
}

function updateJoystickPosition(touch, type) {
    const joystick = document.getElementById(`${type}Joystick`);
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.min(Math.sqrt(deltaX*deltaX + deltaY*deltaY), 40);
    
    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    joystick.style.transform = `translate(${x}px, ${y}px)`;
    joystickStates[type].x = x / 40;
    joystickStates[type].y = y / 40;
}

// 更新CSS样式增强触控体验
const mobileControlsCSS = `
#mobile-controls {
    position: fixed;
    bottom: 20px;
    width: 100%;
    height: 150px;
    pointer-events: none;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    touch-action: none;
}

.joystick {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    position: relative;
    pointer-events: auto;
    touch-action: none;
}
`;
const style = document.createElement('style');
style.textContent = mobileControlsCSS;
document.head.appendChild(style);

function checkConnection() {
    if (socket && socket.connected) {
        showMessage('网络连接正常', 'success');
    } else {
        showMessage('网络连接断开，正在重连...', 'warning');
        initSocket();
    }
}

function showMessage(message, type = 'info') {
    const popup = document.getElementById('messagePopup');
    const messageText = document.getElementById('messageText');
    
    if (!popup || !messageText) return;
    
    messageText.textContent = message;
    popup.classList.add('show');
    
    // 根据类型添加样式
    popup.className = `message-popup show message-${type}`;
    
    // 3秒后自动关闭
    setTimeout(() => {
        closeMessage();
    }, 3000);
}

function closeMessage() {
    const popup = document.getElementById('messagePopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
}

// 音频管理器类
class AudioManager {
    constructor() {
        this.sounds = {};
        this.volume = 1.0;
        this.muted = false;
    }
    
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = audio;
                resolve(audio);
            });
            audio.addEventListener('error', reject);
        });
    }
    
    play(name, volume = 1.0) {
        if (this.muted) return;
        
        const sound = this.sounds[name];
        if (sound) {
            sound.volume = volume * this.volume;
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.error('播放音频失败:', error);
            });
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    mute() {
        this.muted = true;
    }
    
    unmute() {
        this.muted = false;
    }
    
    toggleMute() {
        this.muted = !this.muted;
    }
}

// 3D游戏渲染器类
class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.players = new Map();
        this.isFirstPerson = false;
        this.obstacles = [];
        this.safeZones = [];
    }

    init() {
        // 初始化Three.js场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // 设置相机
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 10);

        // 设置渲染器
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 添加光照
        this.addLighting();
        
        // 添加地面
        this.addGround();
        
        // 窗口大小变化事件
        window.addEventListener('resize', () => this.onWindowResize());
    }

    addLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    addGround() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    setupGame(gameState) {
        // 清除现有玩家
        this.players.forEach(player => {
            this.scene.remove(player);
        });
        this.players.clear();

        // 创建玩家
        gameState.players.forEach(playerData => {
            const player = this.createStickFigure(playerData.role);
            player.position.copy(playerData.position);
            player.userData = playerData;
            this.scene.add(player);
            this.players.set(playerData.id, player);

            // 如果是当前用户，设置为主玩家
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (playerData.id === currentUser.id) {
                this.player = player;
            }
        });

        // 添加障碍物
        this.addObstacles();
        
        // 添加安全区
        this.addSafeZones();
    }

    createStickFigure(role) {
        const group = new THREE.Group();

        // 根据角色选择颜色
        let color = 0x000000; // 默认黑色
        switch(role) {
            case 'catcher':
                color = 0xFF0000; // 红色
                break;
            case 'runner':
                color = 0x0000FF; // 蓝色
                break;
            case 'medic':
                color = 0x00FF00; // 绿色
                break;
            case 'vip':
                color = 0xFFD700; // 金色
                break;
            case 'bodyguard':
                color = 0x800080; // 紫色
                break;
        }

        const material = new THREE.MeshLambertMaterial({ color: color });

        // 头部
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const head = new THREE.Mesh(headGeometry, material);
        head.position.y = 1.7;
        head.castShadow = true;
        group.add(head);

        // 身体
        const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
        const body = new THREE.Mesh(bodyGeometry, material);
        body.position.y = 1;
        body.castShadow = true;
        group.add(body);

        // 手臂
        const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
        const leftArm = new THREE.Mesh(armGeometry, material);
        leftArm.position.set(-0.4, 1.2, 0);
        leftArm.rotation.z = Math.PI / 4;
        leftArm.castShadow = true;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, material);
        rightArm.position.set(0.4, 1.2, 0);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.castShadow = true;
        group.add(rightArm);

        // 腿部
        const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1, 6);
        const leftLeg = new THREE.Mesh(legGeometry, material);
        leftLeg.position.set(-0.15, 0.3, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, material);
        rightLeg.position.set(0.15, 0.3, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);

        return group;
    }

    addObstacles() {
        // 添加各种障碍物
        const obstacleTypes = [
            { geometry: new THREE.BoxGeometry(2, 3, 2), color: 0x8B4513 },
            { geometry: new THREE.CylinderGeometry(1, 1, 2, 8), color: 0x654321 },
            { geometry: new THREE.BoxGeometry(4, 1, 1), color: 0x696969 }
        ];

        for (let i = 0; i < 20; i++) {
            const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            const material = new THREE.MeshLambertMaterial({ color: obstacleType.color });
            const obstacle = new THREE.Mesh(obstacleType.geometry, material);
            
            obstacle.position.set(
                (Math.random() - 0.5) * 180,
                obstacleType.geometry.parameters.height / 2,
                (Math.random() - 0.5) * 180
            );
            
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
        }
    }

    addSafeZones() {
        // 添加安全区
        for (let i = 0; i < 3; i++) {
            const safeZoneGeometry = new THREE.CylinderGeometry(5, 5, 0.1, 16);
            const safeZoneMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FF00, 
                transparent: true, 
                opacity: 0.3 
            });
            const safeZone = new THREE.Mesh(safeZoneGeometry, safeZoneMaterial);
            
            safeZone.position.set(
                (Math.random() - 0.5) * 160,
                0.05,
                (Math.random() - 0.5) * 160
            );
            
            this.scene.add(safeZone);
            this.safeZones.push(safeZone);
        }
    }

    movePlayer(deltaX, deltaY, deltaZ) {
        if (!this.player) return;
        
        this.player.position.x += deltaX;
        this.player.position.y += deltaY;
        this.player.position.z += deltaZ;
        
        // 限制边界
        this.player.position.x = Math.max(-90, Math.min(90, this.player.position.x));
        this.player.position.z = Math.max(-90, Math.min(90, this.player.position.z));
    }

    rotatePlayer(deltaX, deltaY) {
        if (!this.player) return;
        this.player.rotation.y += deltaX;
    }

    updatePlayerPosition(playerId, position, rotation) {
        const player = this.players.get(playerId);
        if (player && player !== this.player) {
            player.position.copy(position);
            player.rotation.copy(rotation);
        }
    }

    setFirstPerson(firstPerson) {
        this.isFirstPerson = firstPerson;
    }

    getPlayerPosition() {
        return this.player ? this.player.position.clone() : new THREE.Vector3();
    }

    getPlayerRotation() {
        return this.player ? this.player.rotation.clone() : new THREE.Euler();
    }

    update() {
        if (!this.player) return;

        // 更新相机位置
        if (this.isFirstPerson) {
            this.camera.position.copy(this.player.position);
            this.camera.position.y += 1.6; // 眼部高度
            this.camera.rotation.copy(this.player.rotation);
        } else {
            // 第三人称视角
            const offset = new THREE.Vector3(0, 8, 10);
            offset.applyQuaternion(this.player.quaternion);
            this.camera.position.copy(this.player.position).add(offset);
            this.camera.lookAt(this.player.position);
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}