export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.isGameOver = false;
        this.isGameWon = false;
        this.score = 0;
        this.shots = 10;
        this.pegsDestroyedThisShot = 0; // Track pegs destroyed per shot
        this.bucket = null;
        this.scoreText = null;
        this.bucketSpeed = 300;
        this.bucketDirection = 1;
        this.obstacles = [];
        this.shotsText = null;
        this.bucketSprite = null;
        this.shotball = [];
        this.currentBall = null;
        this.orangehit = 0;
        this.tempScore = 0;
        this.soundEffects = {
            peghitAudio : null,
            gainshotAudio : null,
            missAudio : null
        };
    }

    create() {
        // Set background
        this.cameras.main.setBackgroundcolour(0xeb3474); // Pink

        // Set up physics
        this.physics.world.setBounds(0, 0, this.game.config.width, this.game.config.height);
        this.physics.world.gravity.y = 250;

        // Configure physics world bounds to have callbacks
        this.physics.world.setBoundsCollision(true, true, true, false); // Left, Right, Top, Bottom

        // Create obstacles (pegs)
        this.createObstacles();

        // Create the player's bucket
        this.createbucket();

        // Create score display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontFamily: 'Arial Black', fontSize: 24, colour: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });

        // Create shots display
        this.shotsText = this.add.text(16, 50, 'shots: 10', {
            fontFamily: 'Arial Black', fontSize: 18, colour: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        });

        this.multText = this.add.text(16, 84, 'x1', {
            fontFamily: 'Arial Black', fontSize: 18, colour: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        });

        // Listen for mouse click to fire the ball
        this.input.on('pointerdown', this.fireBall, this);

        // Tutorial text
        const tutorialText = this.add.text(this.game.config.width / 2, 650, 'Hit all Orange Pegs', {
            fontFamily: 'Arial Black', fontSize: 18, colour: '#ffffff',
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

        this.soundEffects.peghitAudio = this.sound.add('peghitAudio');
        this.soundEffects.gainshotAudio = this.sound.add('gainshotAudio');
        this.soundEffects.missAudio = this.sound.add('missAudio');
    }

    createObstacles() {
        const pegRadius = 8;
        const pegcolour = '0x1B398F'; // blue colour
        const orangecolour = '0xE45837'; // Orange colour
        const purplecolour = '0xB714AB'; // Purple colour
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

    // Create the obstacles
    for (let row = 0; row < rows; row++) {
        const offsetX = (row % 2 === 0) ? 0 : xSpacing / 2;
        for (let col = 0; col < cols; col++) {
            const x = startX + offsetX + col * xSpacing;
            const y = startY + row * ySpacing;

            // Check if the current peg should be orange or purple
            const index = allPegs.findIndex(peg => peg.x === x && peg.y === y);
            let colour = pegcolour; // Default to blue

            if (orangePegs.has(index)) {
                colour = orangecolour;
            } else if (index === purplePegIndex) {
                colour = purplecolour;
            }

            const peg = this.add.circle(x, y, pegRadius, colour);

            // Store the colour on the peg
            peg.originalcolour = colour;

            this.physics.add.existing(peg, true);
            peg.body.setCircle(pegRadius + 2);

            this.obstacles.push(peg);
        }
    }
}

    createbucket() {
        const bucketY = this.game.config.height - 10; // Position at the very bottom

        // Multiplied all the numbers by 1.5
        // Create a graphics object for the bucket visual
        this.bucketSprite = this.add.graphics();
        this.bucketSprite.x = this.game.config.width / 2;
        this.bucketSprite.y = bucketY;

        // Main bucket body
        this.bucketSprite.fillStyle(0xD2691E, 1); // Lighter brown
        this.bucketSprite.fillRect(-90, -23, 180, 45);

        // bucket sides (raised)
        this.bucketSprite.fillStyle(0x8B4513, 1); // Darker brown
        this.bucketSprite.fillRect(-90, -23, 15, 45); // Left side
        this.bucketSprite.fillRect(75, -23, 15, 45);  // Right side

        // bucket detail lines
        this.bucketSprite.lineStyle(2, 0x654321, 1);
        this.bucketSprite.strokeRect(-90, -23, 180, 45);

        // bucket rim
        this.bucketSprite.lineStyle(3, 0x654321, 1);
        this.bucketSprite.strokeRect(-90, -23, 180, 8);

        // Now create the physics body at the same position - make it match the visual size
        this.bucket = this.physics.add.existing(
            this.add.rectangle(
                this.game.config.width / 2,
                bucketY,
                188, // Width matches the bucket visual width
                60,  // Height matches the bucket visual height
                0x000000
            ),
            true  // isStatic = true
        );

        // Make the physics body invisible
        this.bucket.setAlpha(0);

        // Initialize the target position
        this.targetbucketX = this.game.config.width / 2;
    }

    getRandomBluePeg() {
        const bluePegs = this.obstacles.filter(peg => 
            peg.active && // Is not destroyed
            !peg.markedForDeletion && // Not marked for deletion
            peg.originalcolour === '0x1B398F' // Is blue
        );
        return bluePegs.length > 0 ? Phaser.Utils.Array.GetRandom(bluePegs) : null;
    }

    getPurplePeg() {
        return this.obstacles.find(peg => 
            peg.active && // Is not destroyed
            !peg.markedForDeletion && // Not marked for deletion
            peg.originalcolour === '0xB714AB' // Is purple
        );
    }

    updatePurplePeg() {
        // Find current purple peg
        const oldPurplePeg = this.getPurplePeg();
        
        // Find a random blue peg that's not marked for deletion
        const newBluePeg = this.getRandomBluePeg();
        
        if (oldPurplePeg) {
            // Change old purple peg back to blue
            oldPurplePeg.setFillStyle(0x1B398F);
            oldPurplePeg.originalcolour = '0x1B398F';
        }
        
        if (newBluePeg) {
            // Change new blue peg to purple
            newBluePeg.setFillStyle(0xB714AB);
            newBluePeg.originalcolour = '0xB714AB';
        }
    }

    hitObstacle(ball, obstacle) {
        // Check if the obstacle (peg) is already marked for deletion
        if (!obstacle.markedForDeletion) {
            // Mark the peg for deletion
            obstacle.markedForDeletion = true;
            this.pegsDestroyedThisShot++;
            this.soundEffects.peghitAudio.play();
    
            let scoreToAdd = 0; // Score to add based on peg colour
            // Check peg colour and change it based on colour
            if (obstacle.originalcolour === '0xE45837') { // Orange peg
                obstacle.setFillStyle(0xFEA350);
                this.orangehit += 1;
                scoreToAdd = 100;
                this.scoreText.setText('Score: ' + this.score);
            } else if (obstacle.originalcolour === '0xB714AB') { // Purple peg
                obstacle.setFillStyle(0xDF74DC);
                scoreToAdd = 500;
                this.scoreText.setText('Score: ' + this.score);
            } else {
                obstacle.setFillStyle(0x91E1FA); // Blue peg
                scoreToAdd = 10;
                this.scoreText.setText('Score: ' + this.score);
            }
                
            let mult = 1; // Multiplication used in calculations
            if (this.orangehit >= 10){
            mult = 2;
            this.multText.setText('x2');
            }
            if (this.orangehit >= 15){
            mult = 3;
            this.multText.setText('x3');
            }
            if (this.orangehit >= 19){
            mult = 5;
            this.multText.setText('x5');
            }
            if (this.orangehit >= 22){
            mult = 10;
            this.multText.setText('x10');
            }
            if (this.orangehit >= 25){
            mult = 10;
            this.multText.setText('FEVER');
        }
    
            scoreToAdd *= mult;
                this.tempScore += scoreToAdd;

            // Check if all orange pegs are cleared
        const allOrangePegsCleared = !this.obstacles.some(peg => 
            peg.originalcolour === '0xE45837' && !peg.markedForDeletion
        );
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
    
        // Create the ball as a container
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
    
        // Add collision with obstacles
        this.obstacles.forEach(obstacle => {
            this.physics.add.collider(container, obstacle, this.hitObstacle, null, this);
        });
    
        // Add overlap with bucket
        this.physics.add.overlap(container, this.bucket, this.collectItem, null, this);

        this.shots--;
        this.shotsText.setText('shots: ' + this.shots);
    }
    
    // Remove the current ball when it's collected
    collectItem(item, bucket) {
        if (item.itemType === 'ball') {
             // Remove the ball from shotball array
            const index = this.shotball.indexOf(item);
            if (index > -1) {
                this.shotball.splice(index, 1);
            }
    
            // Destroy the ball
            item.destroy();
    
            // Clear the current ball
            this.currentBall = null;

            this.soundEffects.gainshotAudio.play();
            this.shots++;
            this.shotsText.setText('shots: ' + this.shots);
            const shotGainText = this.add.text(
                this.bucket.x,
                this.bucket.y - 30,
                '+1 shot',
                {
                    fontFamily: 'Arial Black',
                    fontSize: 24,
                    colour: '#00FF00',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5);
            this.tweens.add({
                targets: shotGainText,
                y: shotGainText.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => shotGainText.destroy()
            });

            // delete the marked pegs
            this.obstacles.forEach(peg => {
                if (peg.markedForDeletion) {
                    peg.destroy(); // Remove the peg from the game
                }
            });

            // Calculate and add the final score
            if (this.pegsDestroyedThisShot > 0) {
                const finalScore = this.tempScore * this.pegsDestroyedThisShot;
                if (finalScore >= 25000){
                    this.soundEffects.gainshotAudio.play();
                    this.shots++;
                    this.shotsText.setText('shots: ' + this.shots);
                    const shotGainText = this.add.text(
                        this.bucket.x,
                        this.bucket.y - 30,
                        '+2 shots',
                        {
                            fontFamily: 'Arial Black',
                            fontSize: 24,
                            colour: '#00FF00',
                            stroke: '#000000',
                            strokeThickness: 4
                        }
                    ).setOrigin(0.5);
                    this.tweens.add({
                        targets: shotGainText,
                        y: shotGainText.y - 50,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => shotGainText.destroy()
                    });
                }
                this.score += finalScore;
                this.scoreText.setText('Score: ' + this.score);
                
                // Show score popup
                this.showScorePopup(finalScore, this.bucket.x, this.bucket.y - 50);
            }

            // Reset temp score and counter
            this.tempScore = 0;
            this.pegsDestroyedThisShot = 0;
            
            // Reset peg deletion flags
            this.obstacles.forEach(peg => {
                peg.markedForDeletion = false;
            });

            // Update purple peg after shot is processed
            this.updatePurplePeg();

            if (this.orangehit === 25) {
                this.gameWin();
            }
        }
    }

    update(time, delta) {
        if (this.isGameOver) return;

        const edgeThreshold = 200; // Distance from the wall where slowing starts
        const normalSpeed = 300;
        const slowSpeed = 5; // Speed the ball slows to
    
        // Calculate the distance to the closest wall
        const distanceToLeft = this.bucket.x;
        const distanceToRight = this.game.config.width - this.bucket.x;
        const minDistance = Math.min(distanceToLeft, distanceToRight);
    
        // Gradually adjust speed based on proximity to walls
        if (minDistance < edgeThreshold) {
            this.bucketSpeed = Phaser.Math.Linear(slowSpeed, normalSpeed, minDistance / edgeThreshold);
        } else {
            this.bucketSpeed = normalSpeed;
        }
    
        // Check if the bucket is near the edge and reverse its direction
        if (this.bucket.x <= this.bucket.displayWidth / 2 || 
            this.bucket.x >= this.game.config.width - this.bucket.displayWidth / 2) {
            this.bucketDirection *= -1;  // Reverse direction when hitting the wall
            this.bucketSpeed = normalSpeed;  // Reset to normal speed when reversing
        }
    
        // Move the bucket
        this.bucket.x += this.bucketSpeed * this.bucketDirection * (delta / 1000);
        this.bucket.body.position.x = this.bucket.x - this.bucket.width / 2;
    
        // Update bucket sprite position
        if (this.bucketSprite) {
            this.bucketSprite.x = this.bucket.x;
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

            // delete the marked pegs
            this.obstacles.forEach(peg => {
                if (peg.markedForDeletion) {
                    peg.destroy(); // Remove the peg from the game
                }
            });

            // Calculate and add the final score
            if (this.pegsDestroyedThisShot > 0) {
                const finalScore = this.tempScore * this.pegsDestroyedThisShot;
                if (finalScore >= 25000){
                    this.soundEffects.gainshotAudio.play();
                    this.shots++;
                    this.shotsText.setText('shots: ' + this.shots);

                    const shotGainText = this.add.text(
                        this.bucket.x,
                        this.bucket.y - 30,
                        '+1 shot',
                        {
                            fontFamily: 'Arial Black',
                            fontSize: 24,
                            colour: '#00FF00',
                            stroke: '#000000',
                            strokeThickness: 4
                        }
                    ).setOrigin(0.5);
                    
                    this.tweens.add({
                        targets: shotGainText,
                        y: shotGainText.y - 50,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => shotGainText.destroy()
                    });
                }
                this.score += finalScore;
                this.scoreText.setText('Score: ' + this.score);
                
                // Show score popup
                this.showScorePopup(finalScore, this.bucket.x, this.bucket.y - 50);

                if (this.shots === 0) {
                    this.gameOver();
                }
            }

            if (this.pegsDestroyedThisShot === 0) {
                if (Math.random() > 0.5) { // 50% chance to gain a shot
                    this.soundEffects.gainshotAudio.play();
                    this.shots++;
                    this.shotsText.setText('shots: ' + this.shots);
                    
                    // Add vfx for gaining a shot
                    const shotGainText = this.add.text(
                        this.bucket.x,
                        this.bucket.y - 30,
                        '+1 shot',
                        {
                            fontFamily: 'Arial Black',
                            fontSize: 24,
                            colour: '#00FF00',
                            stroke: '#000000',
                            strokeThickness: 4
                        }
                    ).setOrigin(0.5);
                    
                    this.tweens.add({
                        targets: shotGainText,
                        y: shotGainText.y - 50,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => shotGainText.destroy()
                    });
                } else (
                    this.soundEffects.missAudio.play()
                )
                if (this.shots === 0) {
                    this.gameOver();
                }
            }

            // Reset temp score and counter
            this.tempScore = 0;
            this.pegsDestroyedThisShot = 0;

            // Reset peg deletion flags
            this.obstacles.forEach(peg => {
                peg.markedForDeletion = false;
            });

            // Update purple peg after shot is processed
            this.updatePurplePeg();
            }

            if (this.orangehit === 25) {
                this.gameWin();
            }
        }
    }

    showScorePopup(score, x, y) {
        const popup = this.add.text(x, y, '+' + score, {
            fontFamily: 'Arial Black',
            fontSize: 24,
            colour: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Animate the popup
        this.tweens.add({
            targets: popup,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => popup.destroy()
        });
    }

    onWorldBoundsCollision(body, up, down, left, right) {

    }

    gameOver() {
        this.isGameOver = true;
    
        // Clear any existing balls
        this.shotball.forEach(ball => ball.destroy());
        this.shotball = [];
        this.currentBall = null;
    
        const gameOverText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            'GAME OVER\n\nClick to restart',
            {
                fontFamily: 'Arial Black',
                fontSize: 40,
                colour: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }
        ).setOrigin(0.5);
    
        this.input.once('pointerdown', () => {
            // Reset all game state variables
            this.score = 0;
            this.shots = 10;
            this.orangehit = 0;
            this.tempScore = 0;
            this.pegsDestroyedThisShot = 0;
            this.isGameOver = false;
            this.isGameWon = false;
            
            // Reset UI
            this.scoreText.setText('Score: 0');
            this.shotsText.setText('shots: 10');
            this.multText.setText('x1');
            
            // Restart the scene
            this.scene.restart();
        });
    }

    gameWin() {
        this.isGameWon = true;

        this.shotball.forEach(ball => ball.destroy());
        this.shotball = [];
        this.currentBall = null;

        const gameWinText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            'GAME WIN\n\nClick to restart',
            {
                fontFamily: 'Arial Black',
                fontSize: 40,
                colour: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }
        ).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.score = 0;
            this.shots = 10;
            this.orangehit = 0;
            this.tempScore = 0;
            this.pegsDestroyedThisShot = 0;
            this.isGameWon = false;
            this.isGameOver = false;

            this.scoreText.setText('Score: 0');
            this.shotsText.setText('shots: 10');
            this.multText.setText('x1');

            this.scene.restart();
        });
    }
}
