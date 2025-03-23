const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.2;
const balls = [];
const ballImage = new Image();
ballImage.src = "Ball.jpg";

const boxWidth = 960;
const boxHeight = 800;
const boxX = (canvas.width - boxWidth) / 2;
const boxY = (canvas.height - boxHeight) / 2;

const startX = canvas.width / 2;
const startY = 100;

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
    let angle = Math.atan2(event.clientY - startY, event.clientX - startX);
    
    // Ensure the ball doesn't fire upwards
    if (angle < -1.57079) {
        angle = 3.14159;
    }
    if (angle < 0) {
        angle = 0;
    }
    
    const speed = 8;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    balls.push(new Ball(startX, startY, velocityX, velocityY));
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the box
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Draw the starting point dot
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(startX, startY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    balls.forEach(ball => {
        ball.update();
        ball.draw();
    });
    requestAnimationFrame(animate);
}

animate();


animate();
