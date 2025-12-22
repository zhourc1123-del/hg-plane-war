        // 获取画布和上下文
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');
        const lifeElement = document.getElementById('life');
        const gameOverPanel = document.getElementById('gameOverPanel');
        const finalScoreElement = document.getElementById('finalScore');

        // 游戏状态变量
        let score = 0;
        let life = 3;
        let gameOver = false;
        let animationId = null;

        // 玩家飞机类
        class PlayerPlane {
            constructor() {
                this.width = 50;
                this.height = 60;
                this.x = canvas.width / 2 - this.width / 2;
                this.y = canvas.height - this.height - 20;
                this.speed = 8;
                this.bullets = [];
                this.shootInterval = 200; // 发射子弹间隔(ms)
                this.lastShootTime = 0;
                // 飞机颜色
                this.color = '#00ff00';
            }

            // 绘制玩家飞机
            draw() {
                ctx.fillStyle = this.color;
                // 绘制飞机主体（简化为矩形）
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // 绘制飞机头部（小三角形）
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y - 10);
                ctx.lineTo(this.x, this.y);
                ctx.lineTo(this.x + this.width, this.y);
                ctx.fill();
            }

            // 更新飞机位置和子弹
            update(deltaTime, keys) {
                // 键盘控制移动
                if (keys.ArrowLeft && this.x > 0) {
                    this.x -= this.speed;
                }
                if (keys.ArrowRight && this.x < canvas.width - this.width) {
                    this.x += this.speed;
                }
                if (keys.ArrowUp && this.y > 0) {
                    this.y -= this.speed;
                }
                if (keys.ArrowDown && this.y < canvas.height - this.height) {
                    this.y += this.speed;
                }

                // 自动发射子弹
                this.lastShootTime += deltaTime;
                if (this.lastShootTime >= this.shootInterval) {
                    this.shoot();
                    this.lastShootTime = 0;
                }

                // 更新子弹
                this.bullets = this.bullets.filter(bullet => {
                    bullet.update();
                    // 移除超出画布的子弹
                    return bullet.y > -bullet.height;
                });
            }

            // 发射子弹
            shoot() {
                const bulletX = this.x + this.width / 2 - 2;
                const bulletY = this.y - 10;
                this.bullets.push(new Bullet(bulletX, bulletY, '#ffff00', 10));
            }

            // 绘制子弹
            drawBullets() {
                this.bullets.forEach(bullet => bullet.draw());
            }

            // 重置飞机状态
            reset() {
                this.x = canvas.width / 2 - this.width / 2;
                this.y = canvas.height - this.height - 20;
                this.bullets = [];
                this.lastShootTime = 0;
            }
        }

        // 子弹类
        class Bullet {
            constructor(x, y, color, speed) {
                this.width = 4;
                this.height = 10;
                this.x = x;
                this.y = y;
                this.color = color;
                this.speed = speed;
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }

            update() {
                this.y -= this.speed;
            }
        }

        // 敌机类
        class EnemyPlane {
            constructor() {
                this.width = 40;
                this.height = 50;
                // 随机生成位置（左右）
                this.x = Math.random() * (canvas.width - this.width);
                this.y = -this.height;
                // 随机速度（2-5）
                this.speed = 2 + Math.random() * 3;
                this.color = '#ff0000';
                this.hp = 1; // 生命值
            }

            draw() {
                ctx.fillStyle = this.color;
                // 绘制敌机主体
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // 绘制敌机尾部
                ctx.beginPath();
                ctx.moveTo(this.x + this.width / 2, this.y + this.height + 10);
                ctx.lineTo(this.x + 10, this.y + this.height);
                ctx.lineTo(this.x + this.width - 10, this.y + this.height);
                ctx.fill();
            }

            update() {
                this.y += this.speed;
            }

            // 检测是否被子弹击中
            checkHit(bullets) {
                for (let i = 0; i < bullets.length; i++) {
                    const bullet = bullets[i];
                    if (
                        bullet.x < this.x + this.width &&
                        bullet.x + bullet.width > this.x &&
                        bullet.y < this.y + this.height &&
                        bullet.y + bullet.height > this.y
                    ) {
                        // 移除击中的子弹
                        bullets.splice(i, 1);
                        this.hp--;
                        return this.hp <= 0;
                    }
                }
                return false;
            }
        }

        // 初始化游戏对象
        const player = new PlayerPlane();
        let enemies = [];
        let enemySpawnInterval = 1000; // 敌机生成间隔(ms)
        let lastEnemySpawnTime = 0;
        const keys = {}; // 存储键盘按键状态

        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
        });
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });

        // 重置游戏
        function restartGame() {
            score = 0;
            life = 3;
            gameOver = false;
            enemies = [];
            player.reset();
            lastEnemySpawnTime = 0;
            scoreElement.textContent = score;
            lifeElement.textContent = life;
            gameOverPanel.style.display = 'none';
            // 重新开始游戏循环
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            gameLoop();
        }

        // 游戏循环
        let lastTime = 0;
        function gameLoop(currentTime = 0) {
            if (gameOver) return;

            // 计算时间差（毫秒）
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 生成敌机
            lastEnemySpawnTime += deltaTime;
            if (lastEnemySpawnTime >= enemySpawnInterval) {
                enemies.push(new EnemyPlane());
                lastEnemySpawnTime = 0;
                // 随着游戏进行，加快敌机生成速度（最小500ms）
                enemySpawnInterval = Math.max(500, enemySpawnInterval - 10);
            }

            // 更新和绘制玩家飞机
            player.update(deltaTime, keys);
            player.draw();
            player.drawBullets();

            // 更新和绘制敌机
            enemies = enemies.filter(enemy => {
                enemy.update();
                // 检测敌机是否被击中
                const isHit = enemy.checkHit(player.bullets);
                if (isHit) {
                    // 加分
                    score += 10;
                    scoreElement.textContent = score;
                    return false;
                }

                // 检测敌机是否撞玩家
                if (
                    player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y
                ) {
                    // 扣生命值
                    life--;
                    lifeElement.textContent = life;
                    // 移除撞机的敌机
                    if (life <= 0) {
                        gameOver = true;
                        finalScoreElement.textContent = score;
                        gameOverPanel.style.display = 'block';
                    }
                    return false;
                }

                // 移除超出画布的敌机
                return enemy.y < canvas.height;
            });
            enemies.forEach(enemy => enemy.draw());

            // 继续循环
            animationId = requestAnimationFrame(gameLoop);
        }

        // 启动游戏
        restartGame();