(() => {

  class CardsPage extends Page {
    constructor() {
      super('cards');
    }

    getImg(name) {
      const img = this.createElement('img', 'card');
      img.src = `${this.id}/dems/${name}.png`;
      return img;
    }

    getContainer() {
      if (!this.container) {
        this.container = this.createPageElement('div', 'container');

        for (let i = 1; i < 14; i++) {
          for (let s of ['s', 'c', 'h', 'd']) {
            this.container.appendChild(this.getImg(`${i}_${s}`));
          }
        }
        this.container.appendChild(this.getImg('back'));
        this.container.appendChild(this.getImg('joke'));

        this.size = this.createElement('div', 'size-button');
        this.size.innerText = "Zoom";
        this.container.appendChild(this.size);
      }

      return this.container;
    }

    onShow() {
      super.onShow();
      this.size.onclick = () => {
        this.container.classList.toggle('magnify');
      };
    }

    onHide() {
      super.onHide();
    }

  }

  rf.pageViewer.registerPage(new CardsPage());
})();
