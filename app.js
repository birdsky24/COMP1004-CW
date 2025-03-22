const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.2;
const balls = [];
const ballImage = new Image();
ballImage.src = "Ball.jpg";

class Ball {
    constructor(x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.vx = velocityX;
        this.vy = velocityY;
        this.radius = 10;
    }

    update() {
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.drawImage(ballImage, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }
}

canvas.addEventListener("click", (event) => {
    const startX = canvas.width / 2;
    const startY = 50;
    const angle = Math.atan2(event.clientY - startY, event.clientX - startX);
    const speed = 5;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    balls.push(new Ball(startX, startY, velocityX, velocityY));
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    balls.forEach(ball => {
        ball.update();
        ball.draw();
    });
    requestAnimationFrame(animate);
}

animate();
