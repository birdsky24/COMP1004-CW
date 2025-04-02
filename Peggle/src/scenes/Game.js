export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.isGameOver = false;
        this.score = 0;
        this.lives = 10;
        this.Mult = 1;
        this.basket = null;
        this.scoreText = null;
        this.basketSpeed = 300;
        this.basketDirection = 1;
        this.obstacles = [];
        this.livesText = null;
        this.basketSprite = null;
        this.shotball = [];
        this.currentBall = null;
        this.orangehit = 0;
        this.scoretemp = 0;
    }

    create() {
        // Set background
        this.cameras.main.setBackgroundColor(0xeb3474); // Deep blue

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
        this.physics.world.setBoundsCollision(true, true, true, false); // Left, Right, Top, Bottom

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
        this.livesText = this.add.text(16, 50, 'Lives: 10', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        });

        this.multText = this.add.text(16, 84, 'x1', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        });

        // Listen for mouse click to fire the ball
        this.input.on('pointerdown', this.fireBall, this);

        // Tutorial text
        const tutorialText = this.add.text(this.game.config.width / 2, 650, 'Hit all Orange Pegs', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        // Add fadeout for tutorial text
        this.tweens.add({
            targets: tutorialText,
            alpha: 0,
            delay: 2000,
            duration: 1000
        });
    }

    createObstacles() {
        const pegRadius = 8;
        const pegColor = '0x1B398F'; // blue colour
        const orangeColor = '0xE45837'; // Orange colour
        const purpleColor = '0xB714AB'; // Purple color
        const startX = 80;
        const startY = 170;
        const cols = 12;
        const rows = 8;
        const xSpacing = (this.game.config.width - 160) / cols;
        const ySpacing = 60;

        // Store the coordinates of all pegs for random selection
    const allPegs = [];

    for (let row = 0; row < rows; row++) {
        const offsetX = (row % 2 === 0) ? 0 : xSpacing / 2;
        for (let col = 0; col < cols; col++) {
            const x = startX + offsetX + col * xSpacing;
            const y = startY + row * ySpacing;

            allPegs.push({ x, y });
        }
    }

    // Randomly select 25 pegs to be orange
    const orangePegs = new Set();
    while (orangePegs.size < 25) {
        const randomIndex = Math.floor(Math.random() * allPegs.length);
        orangePegs.add(randomIndex);
    }

    // Randomly select 1 peg to be purple
    let purplePegIndex = Math.floor(Math.random() * allPegs.length);
    // Ensure the purple peg is not already selected as orange
    while (orangePegs.has(purplePegIndex)) {
        purplePegIndex = Math.floor(Math.random() * allPegs.length);
    }

    // Now create the obstacles
    for (let row = 0; row < rows; row++) {
        const offsetX = (row % 2 === 0) ? 0 : xSpacing / 2;
        for (let col = 0; col < cols; col++) {
            const x = startX + offsetX + col * xSpacing;
            const y = startY + row * ySpacing;

            // Check if the current peg should be orange or purple
            const index = allPegs.findIndex(peg => peg.x === x && peg.y === y);
            let color = pegColor; // Default to blue

            if (orangePegs.has(index)) {
                color = orangeColor;
            } else if (index === purplePegIndex) {
                color = purpleColor;
            }

            const peg = this.add.circle(x, y, pegRadius, color);

            // Store the color on the peg
            peg.originalColor = color;

            this.physics.add.existing(peg, true);
            peg.body.setCircle(pegRadius + 2);

            this.obstacles.push(peg);
        }
    }
}

    createBasket() {
        const basketY = this.game.config.height - 10; // Position at the very bottom

        // Multiplied all the numbers by 1.3
        // Create a graphics object for the basket visual
        this.basketSprite = this.add.graphics();
        this.basketSprite.x = this.game.config.width / 2;
        this.basketSprite.y = basketY;

        // Main basket body
        this.basketSprite.fillStyle(0xD2691E, 1); // Lighter brown
        this.basketSprite.fillRect(-90, -23, 180, 45);

        // Basket sides (raised)
        this.basketSprite.fillStyle(0x8B4513, 1); // Darker brown
        this.basketSprite.fillRect(-90, -23, 15, 45); // Left side
        this.basketSprite.fillRect(75, -23, 15, 45);  // Right side

        // Basket detail lines
        this.basketSprite.lineStyle(2, 0x654321, 1);
        this.basketSprite.strokeRect(-90, -23, 180, 45);

        // Basket rim
        this.basketSprite.lineStyle(3, 0x654321, 1);
        this.basketSprite.strokeRect(-90, -23, 180, 8);

        // Now create the physics body at the same position - make it match the visual size
        this.basket = this.physics.add.existing(
            this.add.rectangle(
                this.game.config.width / 2,
                basketY,
                188, // Width matches the basket visual width
                60,  // Height matches the basket visual height
                0x000000
            ),
            true  // isStatic = true
        );

        // Make the physics body invisible
        this.basket.setAlpha(0);

        // Initialize the target position
        this.targetBasketX = this.game.config.width / 2;
    }

    hitObstacle(ball, obstacle) {
        // Check if the obstacle (peg) is already marked for deletion
        if (!obstacle.markedForDeletion) {
            // Mark the peg for deletion
            obstacle.markedForDeletion = true;
    
            // Check peg colour and change it based on colour
            if (obstacle.originalColor === '0xE45837') { // Orange peg
                obstacle.setFillStyle(0xFEA350);
                this.orangehit += 1;
                this.score += 100;
                this.scoreText.setText('Score: ' + this.score);
            } else if (obstacle.originalColor === '0xB714AB') { // Purple peg
                obstacle.setFillStyle(0xDF74DC);
                this.score += 500;
                this.scoreText.setText('Score: ' + this.score);
            } else {
                obstacle.setFillStyle(0x91E1FA); // Blue peg
                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);
            }
    
            // Optionally, play a sound or animation here if needed
        }
    }

    fireBall(pointer) {
        if (this.isGameOver) return;
    
        // Check if there is already an active ball
        if (this.currentBall) return; // If a ball is already fired, do nothing
    
        const startX = this.game.config.width / 2; // Top middle of the screen
        const startY = 0;
    
        // Get the pointer position (mouse click position)
        const targetX = pointer.x;
        const targetY = pointer.y;
    
        // Calculate the direction vector
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        // Normalize the direction
        const velocityX = (dx / distance) * 500;  // Speed is 500
        const velocityY = (dy / distance) * 500;
    
        // Create the ball as a container (similar to spawnItem)
        const ballRadius = 8;
        let container = this.add.container(startX, startY);
        let mainSprite = this.add.sprite(0, 0, 'ball');
    
        // Scale the ball
        const ballTexture = this.textures.get('ball');
        const ballWidth = ballTexture.getSourceImage().width;
        const scale = (ballRadius * 2) / ballWidth;
        mainSprite.setScale(scale);
    
        container.add(mainSprite);
    
        // Enable physics on the container
        this.physics.world.enable(container);
    
        // Set the physics body to match the ball's visual size
        container.body.setCircle(ballRadius, -ballRadius, -ballRadius);
        container.body.setBounce(0.7 + Math.random() * 0.2); // Random bounce
        container.body.setVelocity(velocityX, velocityY);
        container.body.setCollideWorldBounds(true);
        container.body.onWorldBounds = true; // Enable worldbounds event
    
        // Store item type and size for collision detection
        container.itemType = 'ball';
        container.ballRadius = ballRadius;
    
        // Track the current ball
        this.currentBall = container;
    
        // Add the ball to the shotball array
        this.shotball.push(container);
    
        // Add collision with obstacles (same as spawnItem)
        this.obstacles.forEach(obstacle => {
            this.physics.add.collider(container, obstacle, this.hitObstacle, null, this);
        });
    
        // Add overlap with basket
        this.physics.add.overlap(container, this.basket, this.collectItem, null, this);
    }
    
    // Modify the collection logic to remove the current ball when it's collected
    collectItem(item, basket) {
        if (item.itemType === 'ball') {
             // Remove the ball from shotball array
            const index = this.shotball.indexOf(item);
            if (index > -1) {
                this.shotball.splice(index, 1);
            }
    
            // Destroy the ball
            item.destroy();
    
            // Clear the current ball reference
            this.currentBall = null;

            // delete the marked pegs
            this.obstacles.forEach(peg => {
                if (peg.markedForDeletion) {
                    peg.destroy(); // Remove the peg from the game
                }
            });

            // Reset peg deletion flags
            this.obstacles.forEach(peg => {
                peg.markedForDeletion = false;
            });
        }
    }

    update(time, delta) {
        if (this.isGameOver) return;

        const edgeThreshold = 200; // Distance from the wall where slowing starts
        const normalSpeed = 300;
        const slowSpeed = 5; // Speed the ball slows to
    
        // Calculate the distance to the closest wall
        const distanceToLeft = this.basket.x;
        const distanceToRight = this.game.config.width - this.basket.x;
        const minDistance = Math.min(distanceToLeft, distanceToRight);
    
        // Gradually adjust speed based on proximity to walls
        if (minDistance < edgeThreshold) {
            this.basketSpeed = Phaser.Math.Linear(slowSpeed, normalSpeed, minDistance / edgeThreshold);
        } else {
            this.basketSpeed = normalSpeed;
        }
    
        // Check if the basket is near the edge and reverse its direction
        if (this.basket.x <= this.basket.displayWidth / 2 || 
            this.basket.x >= this.game.config.width - this.basket.displayWidth / 2) {
            this.basketDirection *= -1;  // Reverse direction when hitting the wall
            this.basketSpeed = normalSpeed;  // Reset to normal speed when reversing
        }
    
        // Move the basket
        this.basket.x += this.basketSpeed * this.basketDirection * (delta / 1000);
        this.basket.body.position.x = this.basket.x - this.basket.width / 2;
    
        // Update basket sprite position
        if (this.basketSprite) {
            this.basketSprite.x = this.basket.x;
        }

        if (this.orangehit >= 10){
            this.mult = 2;
            this.multText.setText('x2');
        }
        if (this.orangehit >= 15){
            this.mult = 3;
            this.multText.setText('x3');
        }
        if (this.orangehit >= 19){
            this.mult = 5;
            this.multText.setText('x5');
        }
        if (this.orangehit >= 22){
            this.mult = 10;
            this.multText.setText('x10');
        }
        if (this.orangehit >= 25){
            this.mult = 10;
            this.multText.setText('FEVER');
        }
    
        // Check for items that have fallen off the bottom of the screen
        const bottomY = this.game.config.height + 30;
        for (let i = this.shotball.length - 1; i >= 0; i--) {
            const item = this.shotball[i];
            if (!item) continue;
    
            if (item.y > bottomY) {
                this.shotball.splice(i, 1);
                item.destroy();
                this.currentBall = null;
                this.lives--;
                this.livesText.setText('Lives: ' + this.lives);

                if (this.lives <= 0) {
                    this.gameOver();
                }

            // delete the marked pegs
            this.obstacles.forEach(peg => {
                if (peg.markedForDeletion) {
                    //this.score = tempscore * mult * peghits;
                    //tempscore = 0;
                    //peghits = 0;
                    peg.destroy(); // Remove the peg from the game
                }
            });

            // Reset peg deletion flags
            this.obstacles.forEach(peg => {
                peg.markedForDeletion = false;
            });
            }
        }
    }

    onWorldBoundsCollision(body, up, down, left, right) {

    }

    gameOver() {
        this.isGameOver = true;

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

        this.input.once('pointerdown', () => {
            this.score = 0;
            this.lives = 10;
            this.isGameOver = false;
            this.scene.restart();
        });
    }
}
