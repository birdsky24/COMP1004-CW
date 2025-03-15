/*
* The ball asset is taken from: https://gamedeveloperstudio.itch.io/balls
*
*/
export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.score = 0;
        this.isGameOver = false;
        this.spawnTimer = null;
        this.scoreText = null;
        this.basket = null;
        this.basketSpeed = 500;
        this.obstacles = [];
        this.bombs = [];
        this.collectibles = [];
        this.spawnDelay = 1000;
        this.lives = 3;
        this.livesText = null;
        this.basketSprite = null;
    }

    create() {
        // Set background
        this.cameras.main.setBackgroundColor(0x1a237e); // Deep blue

        // Add background gradient
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0x1a237e, 0x1a237e, 0x000051, 0x000051, 1);
        gradient.fillRect(0, 0, this.game.config.width, this.game.config.height);

        // Background image if available
        if (this.textures.exists('background')) {
            this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'background')
                .setDisplaySize(this.game.config.width, this.game.config.height)
                .setAlpha(0.2);
        }

        // Set up physics
        this.physics.world.setBounds(0, 0, this.game.config.width, this.game.config.height);
        this.physics.world.gravity.y = 250;

        // Configure physics world bounds to have callbacks
        this.physics.world.setBoundsCollision(true, true, false, false); // Left, Right, Top, Bottom

        // Create obstacles (pegs)
        this.createObstacles();

        // Create the player's basket
        this.createBasket();

        // Create score display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });

        // Create lives display
        this.livesText = this.add.text(16, 50, 'Lives: 3', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        });

        // Start spawning items
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });

        // Tutorial text
        const tutorialText = this.add.text(this.game.config.width / 2, 584, 'Move basket left/right to catch balls and avoid bombs!', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        // Add fadeout for tutorial text
        this.tweens.add({
            targets: tutorialText,
            alpha: 0,
            delay: 5000,
            duration: 1000
        });

        // Set up input for basket control - mouse/touch movement
        this.input.on('pointermove', (pointer) => {
            if (!this.isGameOver) {
                // Create smooth movement towards pointer
                const targetX = Phaser.Math.Clamp(
                    pointer.x,
                    this.basket.displayWidth / 2,
                    this.game.config.width - this.basket.displayWidth / 2
                );
                // We'll use tweening for smoother movement in update()
                this.targetBasketX = targetX;
            }
        });

        // Allow touch/click to move basket too
        this.input.on('pointerdown', (pointer) => {
            if (!this.isGameOver) {
                const targetX = Phaser.Math.Clamp(
                    pointer.x,
                    this.basket.displayWidth / 2,
                    this.game.config.width - this.basket.displayWidth / 2
                );
                this.targetBasketX = targetX;
            }
        });

        // Add keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    createObstacles() {
        // Create pegs in a staggered grid pattern for objects to bounce off
        const pegRadius = 8;
        const pegColor = 0xFFD700; // Gold pegs
        const startX = 80;
        const startY = 120;
        const cols = 10;
        const rows = 6;
        const xSpacing = (this.game.config.width - 160) / cols;
        const ySpacing = 70;

        for (let row = 0; row < rows; row++) {
            const offsetX = (row % 2 === 0) ? 0 : xSpacing / 2;
            for (let col = 0; col < cols; col++) {
                const x = startX + offsetX + col * xSpacing;
                const y = startY + row * ySpacing;

                // Add a glow effect to pegs
                const glowCircle = this.add.circle(x, y, pegRadius + 4, pegColor, 0.3);

                // Main peg
                const peg = this.add.circle(x, y, pegRadius, pegColor);
                this.physics.add.existing(peg, true); // true makes it static

                // Add a shine effect
                const shineEffect = this.add.circle(x - 3, y - 3, pegRadius / 3, 0xffffff, 0.8);

                // Make the collision slightly larger than the visual
                peg.body.setCircle(pegRadius + 2);

                this.obstacles.push(peg);
            }
        }
    }

    createBasket() {
        const basketY = this.game.config.height - 10; // Position at the very bottom


        // Create a graphics object for the basket visual
        this.basketSprite = this.add.graphics();
        this.basketSprite.x = this.game.config.width / 2;
        this.basketSprite.y = basketY;

        // Main basket body
        this.basketSprite.fillStyle(0xD2691E, 1); // Lighter brown
        this.basketSprite.fillRect(-60, -15, 120, 30);

        // Basket sides (raised)
        this.basketSprite.fillStyle(0x8B4513, 1); // Darker brown
        this.basketSprite.fillRect(-60, -15, 10, 30); // Left side
        this.basketSprite.fillRect(50, -15, 10, 30);  // Right side

        // Basket detail lines
        this.basketSprite.lineStyle(2, 0x654321, 1);
        this.basketSprite.strokeRect(-60, -15, 120, 30);

        // Basket rim
        this.basketSprite.lineStyle(3, 0x654321, 1);
        this.basketSprite.strokeRect(-60, -15, 120, 5);

        // Now create the physics body at the same position - make it match the visual size
        this.basket = this.physics.add.existing(
            this.add.rectangle(
                this.game.config.width / 2,
                basketY,
                125, // Width matches the basket visual width
                40,  // Height matches the basket visual height
                0x000000
            ),
            true  // isStatic = true
        );

        // Make the physics body invisible
        this.basket.setAlpha(0);

        // Initialize the target position
        this.targetBasketX = this.game.config.width / 2;
    }

    spawnItem() {
        if (this.isGameOver) return;

        const x = Phaser.Math.Between(50, this.game.config.width - 50);
        const ballRadius = 15; // Consistent size for both physics and visual

        // Fixed 30% chance to spawn a bomb, feel free to play with it
        const itemType = Math.random() > 0.3 ? 'ball' : 'bomb';

        let container = this.add.container(x, 20);
        let mainSprite; // Will hold the main visual element

        if (itemType === 'ball') {
            mainSprite = this.add.sprite(0, 0, 'ball');

            // Scale to match physics body size
            const ballTexture = this.textures.get('ball');
            const ballWidth = ballTexture.getSourceImage().width;
            const scale = (ballRadius * 2) / ballWidth;
            mainSprite.setScale(scale);

            container.add(mainSprite);


            // Enable physics on the container
            this.physics.world.enable(container);

            // Configure the physics body to match the visual size exactly
            container.body.setCircle(ballRadius, -ballRadius, -ballRadius);
            container.body.setBounce(0.7 + Math.random() * 0.2);
            container.body.setVelocityX(Phaser.Math.Between(-50, 50));
            container.body.setCollideWorldBounds(true);
            container.body.onWorldBounds = true; // Enable worldbounds event

            // Store item type and size for collision detection
            container.itemType = 'ball';
            container.ballRadius = ballRadius;

            this.collectibles.push(container);
        } else {
            // Create a bomb
            if (this.textures.exists('bomb')) {
                // Use the bomb texture
                mainSprite = this.add.sprite(0, 0, 'bomb');

                // Scale to match physics body size
                const bombTexture = this.textures.get('bomb');
                const bombWidth = bombTexture.getSourceImage().width;
                const scale = (ballRadius * 2) / bombWidth;
                mainSprite.setScale(scale);

                container.add(mainSprite);

                // Add pulsing animation for bombs
                this.tweens.add({
                    targets: mainSprite,
                    scale: scale * 1.1,
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
            } else {
                // Create a manual bomb with details
                mainSprite = this.add.circle(0, 0, ballRadius, 0x000000);

                // Create bomb details
                const bombDetails = this.add.graphics();
                bombDetails.fillStyle(0xFF0000, 1);
                bombDetails.fillCircle(0, -ballRadius / 3, ballRadius / 5); // Fuse base

                // Fuse
                bombDetails.lineStyle(2, 0xFF0000, 1);
                bombDetails.beginPath();
                bombDetails.moveTo(0, -ballRadius / 3);
                bombDetails.lineTo(0, -ballRadius);
                bombDetails.strokePath();

                // Fuse glow
                const fuseGlow = this.add.circle(0, -ballRadius, ballRadius / 3, 0xFF6600, 0.7);

                const highlight = this.add.circle(-ballRadius / 3, -ballRadius / 3, ballRadius / 4, 0xFFFFFF, 0.4);

                container.add([mainSprite, bombDetails, fuseGlow, highlight]);

                // Add pulsing animation
                this.tweens.add({
                    targets: mainSprite,
                    scale: 1.1,
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
            }

            // Enable physics on the container
            this.physics.world.enable(container);

            // Configure physics to match visual size exactly
            container.body.setCircle(ballRadius, -ballRadius, -ballRadius);
            container.body.setBounce(0.5 + Math.random() * 0.2);
            container.body.setCollideWorldBounds(true);

            // Store item type and size for collision detection
            container.itemType = 'bomb';
            container.ballRadius = ballRadius;

            this.bombs.push(container);
        }

        // Add collision with obstacles
        this.obstacles.forEach(obstacle => {
            this.physics.add.collider(container, obstacle, this.hitObstacle, null, this);
        });

        // Add overlap with basket
        this.physics.add.overlap(container, this.basket, this.collectItem, null, this);
    }

    // Function for obstacle collision effects
    hitObstacle(item, obstacle) {
        // Simple particle effect without using createEmitter,
        // because why not learning new approaches?
        const particleColor = item.itemType === 'bomb' ? 0xFF0000 : 0xFFFF00;

        // Let's create a few simple particles
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 50;
            const size = Math.random() * 5;

            const particle = this.add.circle(
                obstacle.x,
                obstacle.y,
                size,
                particleColor,
                0.7
            );

            // Set velocity based on angle
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // Animate the particle
            this.tweens.add({
                targets: particle,
                x: obstacle.x + vx * 0.4,
                y: obstacle.y + vy * 0.4,
                alpha: 0,
                scale: 0.1,
                duration: 200,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // Add a small flash effect
        const flash = this.add.circle(obstacle.x, obstacle.y, 10, 0xffffff, 0.5);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    // Function to handle item collection
    collectItem(item, basket) {
        if (item.itemType === 'ball') {
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);

            const flash = this.add.circle(this.basket.x, this.basket.y, 50, 0xffff00, 0.7);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 1.5,
                duration: 300,
                onComplete: () => flash.destroy()
            });

            // Remove from active items
            const index = this.collectibles.indexOf(item);
            if (index > -1) {
                this.collectibles.splice(index, 1);
            }

            item.destroy();
        } else {
            // Hit by bomb
            this.lives--;
            this.livesText.setText('Lives: ' + this.lives);

            const explosion = this.add.circle(
                item.x,
                item.y,
                20,
                0xFF0000
            );

            this.tweens.add({
                targets: explosion,
                scale: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => explosion.destroy()
            });

            this.cameras.main.shake(200, 0.01);

            // Remove from active bombs
            const index = this.bombs.indexOf(item);
            if (index > -1) {
                this.bombs.splice(index, 1);
            }
            item.destroy();

            if (this.lives <= 0) {
                this.gameOver();
            }
        }
    }

    update() {
        if (this.isGameOver) return;

        if (this.basket && this.targetBasketX !== undefined) {
            const distance = this.targetBasketX - this.basket.x;
            const newX = this.basket.x + distance * 0.2;

            // Update the physics body position
            this.basket.body.position.x = newX - this.basket.width / 2;
            this.basket.x = newX;

            // Update the visual sprite
            if (this.basketSprite) {
                this.basketSprite.x = newX;
            }
        }

        // Check for items that have fallen off the bottom of the screen
        const bottomY = this.game.config.height + 30;
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            if (!item) continue;

            if (item.y > bottomY) {
                this.collectibles.splice(i, 1);
                item.destroy();
            }
        }

        // Let's do the same for bombs
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            if (!bomb) continue;

            if (bomb.y > bottomY) {
                this.bombs.splice(i, 1);
                bomb.destroy();
            }
        }
    }

    onWorldBoundsCollision(body, up, down, left, right) {

    }

    createBounceEffect(item) {
        // Different colors for different item types
        const color = item.itemType === 'bomb' ? 0xFF0000 : 0xFFFF00;

        const flash = this.add.circle(item.x, item.y, 8, color, 0.7);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.5,
            duration: 150,
            onComplete: () => flash.destroy()
        });
    }

    gameOver() {
        this.isGameOver = true;

        if (this.spawnTimer) {
            this.spawnTimer.remove();
        }

        const gameOverText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            'GAME OVER\n\nTap to restart',
            {
                fontFamily: 'Arial Black',
                fontSize: 40,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }
        ).setOrigin(0.5);

        const explosion = this.add.circle(
            this.basket.x,
            this.basket.y,
            30,
            0xFF0000
        );

        this.tweens.add({
            targets: explosion,
            scale: 4,
            alpha: 0,
            duration: 1000,
            onComplete: () => explosion.destroy()
        });

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}
