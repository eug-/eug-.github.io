;
(function() {
  const SIZE_TABLE = {
    3: 1,
    4: 1,
    5: .6,
    6: .52,
    7: .45,
    8: .4,
  };

  function drawPolygon(x, y, size, context, sides, frame, rotation) {
    const degs = 180 - (((sides - 2) * 180) / sides);
    const angle = (Math.PI / 180) * degs;
    const side = size * SIZE_TABLE[sides];
    let dx = (size - side) / 2;
    let dy = (size) / 2;
    let lastAngle = 0;
    context.save();
    context.translate(x + size / 2, y + size / 2);
    context.rotate((sides % 2 ? 1 : -1) * rotation / 100);
    // context.strokeRect(-size / 2, -size / 2, size, size);
    context.beginPath();
    context.moveTo(dx, dy);
    for (let i = 0; i < sides; i++) {
      dx -= Math.cos(lastAngle) * side;
      dy += Math.sin(lastAngle) * side;
      lastAngle -= angle;
      context.lineTo(dx, dy);
    }
    context.stroke();
    context.beginPath();
    context.ellipse(0, 0, 1 + rotation / 100, 1, 0, 0, Math.PI * 2);
    context.fillStyle = '#900';
    context.fill();
    context.restore();
  }

  class Plygn extends Page {
    constructor() {
      super('plygn');
      this.timeout = 0;
      this.fps = 60;
      this.stop = true;
      this.lastTimestamp;
      this.emptyFrame = 0;
      this.sides = 6;

      this.step = (timestamp) => {
        clearTimeout(this.timeout);
        if (this.stop) {
          return;
        }

        this.draw(timestamp, timestamp - this.lastTimestamp);
        this.lastTimestamp = timestamp;

        this.timeout = setTimeout(() => {
          window.requestAnimationFrame(this.step);
        }, 1000 / this.fps);
      };
    }

    draw(timestamp, delta) {
      if (this.emptyFrame == 0) {
        this.sides = Math.floor((Math.random() * 4)) + 5;
      }
      if (this.emptyFrame % 3 == 1) {
        this.context.clearRect(0, 0, this.width, this.height);
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.cols; col++) {
            drawPolygon(col * this.elSize, row * this.elSize, this.elSize, this.context, this.sides, this.emptyFrame, Math.max(1, delta + row * 50 + col * 10));
          }
        }
      }
      this.emptyFrame = (this.emptyFrame + 1) % 53;
    }

    getContainer() {
      if (!this.container) {
        this.container = this.createPageElement('div', 'container');
        this.canvas = this.createPageElement('canvas', 'canvas', this.container);
        this.context = this.canvas.getContext('2d');
      }
      return this.container;
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.elSize = Math.min(this.width, this.height) / 8;
      this.rows = Math.ceil(this.height / this.elSize);
      this.cols = Math.ceil(this.width / this.elSize);
    }

    onShow() {
      this.stop = false;
      this.lastTimestamp = (new Date())
        .getTime();
      window.requestAnimationFrame(this.step);
      this.resize();
    }

    onHide() {
      this.stop = true;
    }
  }

  rf.pageViewer.registerPage(new Plygn());

})();
