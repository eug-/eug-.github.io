// Track away...
(() => {
  const tracker = [];
  tracker.push(['_setAccount', 'UA-20257270-2']);
  tracker.push(['_trackPageview']);
  const ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  const s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();


class Page {
  constructor(id) {
    this.id = id;
  }

  getContainer() {
    throw new Error('getContainer needs implementation.');
  }

  onHide() {}

  onShow(width, height) {}

  // Helpers
  createPageElement(type, className, parent) {
    return this.createElement(type, `${this.id}-${className}`, parent);
  }

  createElement(type, className, parent) {
    const element = document.createElement(type);
    element.className = className;
    if (parent) {
      parent.appendChild(element);
    }
    return element;
  }

  createButton(type, hint, parent) {
    const button = this.createPageElement('span', 'button rf-ui-button', parent);
    button.setAttribute('title', hint);
    const icon = this.createPageElement('i', 'icon material-icons', button);
    icon.innerText = type;
    return button;
  }
}


class PageViewer {
  constructor() {
    this.first = '';
    this.current = null;
    this.pages = [];
    this.headerTimeout = 0;
    this.resizeTimeout = 0;
    this.labelElement = document.getElementById('page-label');
    this.mainElement = document.getElementById('main');

    const back = document.getElementById('back');
    back.addEventListener('click', () => {
      this.setPageOffset(-1);
    });

    const forward = document.getElementById('forward');
    forward.addEventListener('click', () => {
      this.setPageOffset(1);
    });

    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.setPage(this.currentPage);
      }, 500);
    });
  }

  registerPage(page) {
    this.pages.push(page);
    if (!this.current && (!this.first || this.first == page.id)) {
      this.setPage(page);
    }
  }

  setPage(page) {
    if (!page) {
      return;
    }

    document.body.classList.toggle('small', window.innerWidth < 640);

    if (this.current) {
      this.current.onHide();
      document.body.classList.remove('p-' + this.current.id);
      clearTimeout(this.headerTimeout);
    }

    document.body.classList.add('p-' + page.id);
    this.labelElement.innerText = page.id;

    while (this.mainElement.firstChild) {
      this.mainElement.removeChild(this.mainElement.firstChild);
    }
    this.mainElement.appendChild(page.getContainer());
    page.onShow(this.mainElement.clientWidth, this.mainElement.clientHeight);

    if (page.hideHeader) {
      this.headerTimeout = setTimeout(function() {
        document.body.classList.add('hide-header');
      }, 1500);
    } else {
      document.body.classList.remove('hide-header');
    }
    this.current = page;
  }

  setPageOffset(offset) {
    if (!this.pages || !this.current) {
      return;
    }
    const pageCount = this.pages.length;
    let index = this.pages.indexOf(this.current);
    index += pageCount + offset;
    index %= pageCount;
    this.setPage(this.pages[index]);
  }
}


// Dragging mess
class DragRegistry {
  constructor() {
    this.registry = {};
    this.nextId = 0;
  }

  extractEventFromTouch(evt) {
    return {
      target: evt.target,
      currentTarget: evt.currentTarget,
      clientX: evt.touches[0].clientX,
      clientY: evt.touches[0].clientY,
      pageX: evt.touches[0].pageX,
      pageY: evt.touches[0].pageY
    };
  }

  onDragStart(dragId, evt) {
    const dragEntry = this.registry[dragId];
    if (!dragEntry) {
      return;
    }
    dragEntry.onStart && dragEntry.onStart(evt);
    const target = dragEntry.target;
    target.addEventListener('mousemove', dragEntry.onDragMove);
    target.addEventListener('touchmove', dragEntry.onTouchMove);
    target.addEventListener('mouseup', dragEntry.onDragEnd);
    target.addEventListener('mouseleave', dragEntry.onDragEnd);
    target.addEventListener('touchend', dragEntry.onTouchEnd);
    target.addEventListener('touchcancel', dragEntry.onTouchEnd);
    if (dragEntry.bounds) {
      dragEntry.bounds.addEventListener('mouseleave', dragEntry.onDragEnd);
    }
  }

  onTouchStart(dragId, evt) {
    evt.preventDefault();
    this.onDragStart(dragId, this.extractEventFromTouch(evt));
  }

  onDragMove(dragId, evt) {
    const dragEntry = this.registry[dragId];
    if (!dragEntry) {
      return;
    }
    dragEntry.onDrag && dragEntry.onDrag(evt);
  }

  onTouchMove(dragId, evt) {
    evt.preventDefault();
    this.onDragMove(dragId, this.extractEventFromTouch(evt));
  }

  onDragEnd(dragId, evt) {
    const dragEntry = this.registry[dragId];
    if (!dragEntry) {
      return;
    }
    dragEntry.onEnd && dragEntry.onEnd(evt);
    this.removeEndEvents(dragEntry);
  };

  onTouchEnd(dragId, evt) {
    evt.preventDefault();
    this.onDragEnd(dragId, evt);
  }

  removeEndEvents(dragEntry) {
    var target = dragEntry.target;
    target.removeEventListener('mousemove', dragEntry.onDragMove);
    target.removeEventListener('touchmove', dragEntry.onTouchMove);
    target.removeEventListener('mouseup', dragEntry.onDragEnd);
    target.removeEventListener('mouseleave', dragEntry.onDragEnd);
    target.removeEventListener('touchend', dragEntry.onTouchEnd);
    target.removeEventListener('touchcancel', dragEntry.onTouchEnd);
    if (dragEntry.bounds) {
      dragEntry.bounds.removeEventListener('mouseleave', dragEntry.onDragEnd);
    }
  }

  // Public
  add(target, bounds, onStart, onDrag, onEnd) {
    const dragId = this.nextDragId++;
    const dragEntry = {
      target,
      bounds,
      onStart,
      onDrag,
      onEnd,
      onDragStart: this.onDragStart.bind(this, dragId),
      onTouchStart: this.onTouchStart.bind(this, dragId),
      onDragMove: this.onDragMove.bind(this, dragId),
      onTouchMove: this.onTouchMove.bind(this, dragId),
      onDragEnd: this.onDragEnd.bind(this, dragId),
      onTouchEnd: this.onTouchEnd.bind(this, dragId)
    }
    this.registry[dragId] = dragEntry;
    target.addEventListener('mousedown', dragEntry.onDragStart);
    target.addEventListener('touchstart', dragEntry.onTouchStart);
    return dragId;
  }

  // Public
  remove(dragId) {
    const dragEntry = this.registry[dragId];
    if (!dragEntry) {
      return;
    }
    delete this.registry[dragId];
    const target = dragEntry.target;
    target.removeEventListener('mousedown', dragEntry.onDragStart);
    target.removeEventListener('touchstart', dragEntry.onTouchStart);
    this.removeEndEvents(dragEntry);
  }
}


const rf = {
  addSources: (sources) => {
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i].replace(/([^a-z])*/g, '');
      rf.loadCss(source + '/styles.css');

      const script = document.createElement('script');
      script.setAttribute('src', source + '/script.js');
      document.body.appendChild(script);
    }
  },

  loadCss: (source) => {
    const style = document.createElement('link');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('type', 'text/css');
    style.setAttribute('href', source);
    document.head.appendChild(style);
  },

  loadFontCss: (...fonts) => {
    rf.loadFontArrayCss(fonts);
  },

  loadFontArrayCss: (fonts) => {
    const fontString = fonts.join('|')
      .replace(/\s/g, '+');
    rf.loadCss(`https://fonts.googleapis.com/css?family=${fontString}`);
  },

  dragRegistry: new DragRegistry(),
  pageViewer: new PageViewer()
};
