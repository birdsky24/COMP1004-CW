export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.score = 0;
        this.isGameOver = false;
        this.scoreText = null;
        this.basket = null;
        this.basketSpeed = 500;
        this.obstacles = [];
        this.lives = 3;
        this.livesText = null;
        this.basketSprite = null;
    }

    create() {
        this.cameras.main.setBackgroundColor(0x1a237e);

        this.physics.world.setBounds(0, 0, this.game.config.width, this.game.config.height);
        this.physics.world.gravity.y = 250;
        this.physics.world.setBoundsCollision(true, true, false, false);

        this.createObstacles();
        this.createBasket();

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        });

        this.livesText = this.add.text(16, 50, 'Lives: 3', {
            fontFamily: 'Arial Black', fontSize: 18, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
        });
    }

    createObstacles() {
        const pegRadius = 8;
        const pegColor = 0xFFD700;
        const startX = 80;
        const startY = 170;
        const cols = 12;
        const rows = 8;
        const xSpacing = (this.game.config.width - 160) / cols;
        const ySpacing = 60;

        for (let row = 0; row < rows; row++) {
            const offsetX = (row % 2 === 0) ? 0 : xSpacing / 2;
            for (let col = 0; col < cols; col++) {
                const x = startX + offsetX + col * xSpacing;
                const y = startY + row * ySpacing;

                const peg = this.add.circle(x, y, pegRadius, pegColor);
                this.physics.add.existing(peg, true);
                peg.body.setCircle(pegRadius + 2);

                this.obstacles.push(peg);
            }
        }
    }

    createBasket() {
        const basketY = this.game.config.height - 10;

        this.basketSprite = this.add.graphics();
        this.basketSprite.x = this.game.config.width / 2;
        this.basketSprite.y = basketY;
        this.basketSprite.fillStyle(0xD2691E, 1);
        this.basketSprite.fillRect(-60, -15, 120, 30);
        this.basketSprite.fillStyle(0x8B4513, 1);
        this.basketSprite.fillRect(-60, -15, 10, 30);
        this.basketSprite.fillRect(50, -15, 10, 30);
        this.basketSprite.lineStyle(2, 0x654321, 1);
        this.basketSprite.strokeRect(-60, -15, 120, 30);
        this.basketSprite.lineStyle(3, 0x654321, 1);
        this.basketSprite.strokeRect(-60, -15, 120, 5);

        this.basket = this.physics.add.existing(
            this.add.rectangle(
                this.game.config.width / 2,
                basketY,
                125,
                40,
                0x000000
            ),
            true
        );
        this.basket.setAlpha(0);
    }

    update() {
        if (this.isGameOver) return;

        // Basket movement will go here
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
            this.scene.restart();
        });
    }
}
