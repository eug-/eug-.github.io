class AlbersPage extends Page {
  constructor() {
    super('albers');
    this.hideHeader = true;
    this.currentPlate = null;
    this.plates = [new AlbersPlate('relativity')];
  }

  getContainer() {
    if (!this.board) {
      this.board = this.createPageElement('div', 'board');
      this.img = this.createPageElement('object', 'plate', this.board);
    }
    return this.board;
  }

  onShow() {
    super.onShow();
    this.showPlate(this.plates[0]);
  }

  showPlate(plate) {
    if (this.currentPlate === plate) {
      return;
    }
    if (this.currentPlate) {
      this.currentPlate.stop();
    }
    plate.load(this.img);
    this.currentPlate = plate;
  }
}

class AlbersPlate {
  constructor(name) {
    this.name = name;
    this.currentDrag = null;
    this.dragRegisters = [];
    this.dragPosition = [0, 0];
    this.scale = 1;
    this.startPosition = [0, 0];
    this.onLoaded = () => {
      this.processPlate();
    };
  }

  load(imageElement) {
    this.image = imageElement;
    imageElement.addEventListener('load', this.onLoaded);
    imageElement.data = 'albers/svg/' + this.name + '.svg'
  }

  stop() {
    if (this.image) {
      this.image.removeEventListener('load', this.onLoaded);
      this.image = null;
    }
    while (this.dragRegisters.length > 0) {
      rf.dragRegistry.remove(this.dragRegisters.pop());
    }
    this.endDrag();
  }

  processPlate() {
    if (!this.image) {
      return;
    }
    const content = this.image.contentDocument;
    const plate = content.firstChild;
    const link = content.createElementNS("http://www.w3.org/1999/xhtml", "link");
    link.setAttribute("href", "styles.css");
    link.setAttribute("type", "text/css");
    link.setAttribute("rel", "stylesheet");
    plate.appendChild(link);
    requestAnimationFrame(() => {
      // Wait for content to be laid out..
      this.scale = plate.viewBox.baseVal.height / (1.0 * plate.height.baseVal.value);
    });
    const movable = content.getElementsByTagName('g');
    for (var i = 0; i < movable.length; i++) {
      rf.dragRegistry.add(movable[i], plate, this.startDrag.bind(this), this.drag.bind(this), this.endDrag.bind(this));
    }
  }

  startDrag(evt) {
    this.endDrag();
    this.currentDrag = evt.currentTarget;
    const transform = this.currentDrag.style.transform.match('(-?[\\d\\.]+)px,\\s*(-?[\\d\\.]+)px') || [0, 0, 0];
    this.dragPosition = [Number(transform[1]), Number(transform[2])];
    this.startPosition = [evt.pageX, evt.pageY];
  }

  drag(evt) {
    const x = this.dragPosition[0] + this.scale * (evt.pageX - this.startPosition[0]);
    const y = this.dragPosition[1] + this.scale * (evt.pageY - this.startPosition[1]);
    this.currentDrag.style.transform = `translate(${x}px, ${y}px)`;
  }

  endDrag() {
    if (!this.currentDrag) {
      return;
    }
    this.currentDrag = null;
  }
}

rf.pageViewer.registerPage(new AlbersPage());
