(() => {
  const NUMBER_OF_IMAGES = 4;

  class Die {
    constructor(sides) {
      this.sides = sides;
    }

    roll(count = 1) {
      let sum = 0;
      for (let i = 0; i < count; i++) {
        sum += Math.floor(Math.random() * this.sides) + 1;
      }
      return sum;
    }
  }

  class Half {
    constructor(prefix, element) {
      this.prefix = prefix;
      this.images = [];
      this.element = element;
      this.die = new Die(4);
      for (let i = 0; i < NUMBER_OF_IMAGES; i++) {
        const url = `${prefix}_0${i + 1}.png`;
        const img = document.createElement('img');
        img.src = url;
        this.images.push(img);
      }
    }

    start() {
      const millis = (this.die.roll(4) / 2) * 300;
      const index = Math.floor(Math.random() * this.images.length);
      this.timeout = setTimeout(() => {
        this.render(index);
      }, millis);
    }

    render(index) {
      this.start();
      const img = this.images[index];
      if (this.element.firstChild === img) {
        return;
      }
      if (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      this.element.appendChild(img);
    }

    stop() {
      clearTimeout(this.timeout);
    }
  }


  class HalfPage extends Page {
    constructor() {
      super('half');
    }

    getContainer() {
      if (!this.container) {
        this.left = new Half(`${this.id}/l`, this.createPageElement('div', 'left'));
        this.right = new Half(`${this.id}/r`, this.createPageElement('div', 'right'));
        this.container = this.createPageElement('div', 'container');
        this.container.appendChild(this.left.element);
        this.container.appendChild(this.right.element);
      }
      return this.container;
    }

    onShow() {
      const firstIndex = 2;
      super.onShow();
      this.left.render(firstIndex);
      this.right.render(firstIndex);
    }

    onHide() {
      super.onHide();
      this.left.stop();
      this.right.stop();
    }

  }

  rf.pageViewer.registerPage(new HalfPage());
})();
