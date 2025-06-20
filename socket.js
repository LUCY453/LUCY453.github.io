// Socket.IO 连接管理
let socket = null;
let currentRoom = null;
let gameState = null;

// 初始化Socket连接
function initSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket = io('/', {
        auth: {
            token: token
        }
    });

    // [其他事件监听保持不变...]
}

// 创建房间 - 修改后的版本
function createRoom(roomName, gameMode, maxPlayers) {
    console.group('创建房间调试信息');
    try {
        console.log('初始参数:', {roomName, gameMode, maxPlayers});
        
        if (!socket) {
            console.error('Socket连接不存在');
            showMessage('网络连接错误', 'error');
            return;
        }

        if (!socket.connected) {
            console.error('Socket未连接');
            showMessage('网络连接未就绪', 'error');
            return;
        }

        // 参数验证和转换
        const validatedParams = {
            roomName: String(roomName || '').trim(),
            gameMode: String(gameMode || ''),
            maxPlayers: parseInt(maxPlayers) || 4,
            userId: ''
        };

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            console.error('无效的用户信息', user);
            showMessage('用户信息无效', 'error');
            return;
        }
        validatedParams.userId = String(user.id);

        console.log('验证后的参数:', validatedParams);

        if (!validatedParams.roomName) {
            showMessage('请输入房间名称', 'error');
            return;
        }

        if (!validatedParams.gameMode) {
            showMessage('请选择游戏模式', 'error');
            return;
        }

        if (validatedParams.maxPlayers < 2 || validatedParams.maxPlayers > 10) {
            showMessage('玩家数量需在2-10之间', 'error');
            return;
        }

        showLoading(true);
        console.log('准备发送创建房间请求:', validatedParams);

        socket.emit('createRoom', validatedParams, (response) => {
            console.log('服务器响应:', response);
            showLoading(false);
            
            if (!response) {
                console.error('无服务器响应');
                showMessage('服务器无响应', 'error');
                return;
            }

            if (response.success) {
                console.log('房间创建成功', response.room);
                currentRoom = response.room;
                showGameRoom();
                showMessage('房间创建成功');
            } else {
                console.error('创建失败:', response.error);
                showMessage(response.error || '创建房间失败', 'error');
            }
        });

    } catch (error) {
        console.error('创建房间异常:', error);
        showMessage('创建房间时发生错误', 'error');
        showLoading(false);
    } finally {
        console.groupEnd();
    }
}

// [其他函数保持不变...]