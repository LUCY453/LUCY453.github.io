// 虚拟摇杆事件处理
class VirtualJoystick {
  constructor(joystickElement, side) {
    this.joystick = joystickElement;
    this.side = side;
    this.handle = document.createElement('div');
    this.handle.className = 'joystick-handle';
    this.joystick.appendChild(this.handle);
    
    this.isTouching = false;
    this.maxMove = 35;
    this.initEvents();
  }

  initEvents() {
    this.joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isTouching = true;
      this.joystick.classList.add('active');
      this.updatePosition(e.touches[0]);
    });

    // 只在摇杆区域内阻止默认行为
    this.joystick.addEventListener('touchmove', (e) => {
      if (this.isTouching) {
        e.preventDefault();
        this.updatePosition(e.touches[0]);
      }
    });

    // 全局监听触摸移动，但不阻止默认行为
    document.addEventListener('touchmove', (e) => {
      if (this.isTouching) {
        this.updatePosition(e.touches[0]);
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (this.isTouching) {
        this.resetPosition();
        this.joystick.classList.remove('active');
        this.isTouching = false;
        joystickStates[this.side].active = false;
      }
    });
  }

  updatePosition(touch) {
    const rect = this.joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const centerY = rect.top + rect.height/2;
    
    let deltaX = touch.clientX - centerX;
    let deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
    
    if (distance > this.maxMove) {
      deltaX = deltaX * this.maxMove / distance;
      deltaY = deltaY * this.maxMove / distance;
    }
    
    this.handle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // 更新摇杆状态
    joystickStates[this.side].x = deltaX / this.maxMove;
    joystickStates[this.side].y = deltaY / this.maxMove;
    joystickStates[this.side].active = true;
  }

  resetPosition() {
    this.handle.style.transform = 'translate(0, 0)';
    joystickStates[this.side].x = 0;
    joystickStates[this.side].y = 0;
  }
}

// 按钮状态对象
let buttonStates = {};

// 初始化按钮
function initGameButtons() {
  const buttons = document.querySelectorAll('.game-button');
  
  buttons.forEach(button => {
    const buttonId = button.id;
    buttonStates[buttonId] = false;
    
    // 鼠标事件
    button.addEventListener('mousedown', () => {
      buttonStates[buttonId] = true;
      button.classList.add('active');
    });
    
    button.addEventListener('mouseup', () => {
      buttonStates[buttonId] = false;
      button.classList.remove('active');
    });
    
    button.addEventListener('mouseleave', () => {
      buttonStates[buttonId] = false;
      button.classList.remove('active');
    });
    
    // 触摸事件
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      buttonStates[buttonId] = true;
      button.classList.add('active');
    });
    
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      buttonStates[buttonId] = false;
      button.classList.remove('active');
    });
    
    button.addEventListener('touchcancel', (e) => {
      buttonStates[buttonId] = false;
      button.classList.remove('active');
    });
  });
}

// 全局摇杆实例
let leftJoystick, rightJoystick;

// 初始化摇杆和按钮
function initControls(showJoysticks = false) {
  // 确保joystickStates已定义
  if (typeof joystickStates === 'undefined') {
    joystickStates = {
      left: { x: 0, y: 0, active: false },
      right: { x: 0, y: 0, active: false }
    };
  }

  const leftElement = document.getElementById('leftJoystick');
  const rightElement = document.getElementById('rightJoystick');
  
  // 显示/隐藏摇杆
  leftElement.style.display = showJoysticks ? 'block' : 'none';
  rightElement.style.display = showJoysticks ? 'block' : 'none';

  if (!leftJoystick) {
    leftJoystick = new VirtualJoystick(leftElement, 'left');
    rightJoystick = new VirtualJoystick(rightElement, 'right');

    // 阻止默认触摸行为
    document.querySelectorAll('.joystick').forEach(joystick => {
      joystick.addEventListener('touchstart', e => e.preventDefault());
      joystick.addEventListener('touchmove', e => e.preventDefault());
    });
  }
  
  // 初始化游戏按钮
  initGameButtons();
}

// 默认不显示摇杆
document.addEventListener('DOMContentLoaded', () => {
  initControls(false);
});