;(function() {

  var rfc = {};
  rfc.canvas = function (width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width || 100;
    canvas.height = height || 100;

    // Accepts dropped images.
    canvas.addEventListener('dragover', function(evt) {
      evt.preventDefault();
    });
    canvas.addEventListener('drop', function(evt) {
      var image = evt.dataTransfer.files[0];
      if (image.type.indexOf('image') != -1) {
        var reader = new FileReader();
        reader.onload = function(readerEvt) {
          var img = document.createElement('img');
          img.onload = function(imageEvt) {
            canvas.dispatchEvent(
                new CustomEvent('imagedrop', {detail: imageEvt.target}));
          }
          img.src = readerEvt.target.result;
        };
        reader.readAsDataURL(image);
      }
      evt.preventDefault();
  });

    return canvas;
  };

  rfc.canvas.addImage = function (evt) {
    var img = evt.detail;
    this.getContext('2d').drawImage(img,
        0, 0, img.width, img.height,
        0, 0, this.width, this.height);
};

  rfc.canvas.filter = function (filter, pixels) {
    return filter.apply(null, Array.prototype.slice.call(arguments, 1));
  };


var it = {};

/**
 * Hacky dom setup stuff.
 * Run this to start.
 */
it.init = function (container, opts) {
  if (it.container == container &&
      it.environment && it.environment.hasOpts(opts)) {
    if (it.wasStarted) {
      it.start();
    }
    return;
  }
  it.container = container;
  it.restart(opts);
};

it.restart = function(opts) {
  it.stop();
  it.reset(opts);
  it.start();
};


it.start = function () {
  it.driver && it.driver.start();
};

it.stop = function () {
  it.driver && it.driver.stop();
};

it.started = function () {
  return it.driver && it.driver.started();
};

it.step = function () {
  it.driver && it.driver.step();
};

it.clearWalls = function () {
  it.driver && it.driver.clearWalls();
};

it.reset = function (opts) {
  var environment = new it.Environment(opts);
  var renderer = new it.Renderer(environment);

  it.environment = environment;
  if (it.driver && it.driver.renderer) {
    it.driver.renderer.destroy();
  }

  // Add canvas to the dom.
  renderer.attach();

  it.driver = new it.Driver(environment, renderer);
  function firstDrop(evt) {
    colorDrop(evt, true);
  }
  function colorDrop(evt, first) {
    //it.driver.colorDrop(
    it.driver.toggleWall(
      evt.clientX - environment._offsetLeft,
      evt.clientY - environment._offsetTop,
      first);
  }
  rf.registerDrag(renderer, null /* bounds */, firstDrop, colorDrop, function() {});

  renderer.addEventListener('imagedrop', function(evt) {
    var img = evt.detail;
    var canvas = document.createElement('canvas');
    canvas.width = environment.modelWidth;
    canvas.height = environment.modelHeight;
    canvas.getContext('2d').drawImage(img,
        0, 0, img.width, img.height,
        0, 0, canvas.width, canvas.height);
    it.driver.imageDrop(canvas);
  });

  if (environment.walls) {
    var wallStep = environment.modelWidth / environment.modelHeight;
    var wallX = 0;
    var lastX = Math.floor(-wallStep);
    for (var y = 0; y < environment.modelHeight; y++) {
      var x = Math.floor(wallX);
      for (var add = 0; add <= x - lastX; add++) {
        it.driver.createOrGetCell(x + add, y).isWall = true;
        it.driver.createOrGetCell(environment.modelWidth - x - add, y).isWall = true;
      }
      lastX = x;
      wallX += wallStep;
    }
  }
};

it.Environment = function (options) {
  // Environment defaults.
  // Delay between cycled in milliseconds.
  this.speed = 50;

  // In pixels.
  this.cellSize = 10;
  this.stageHeight = 400;
  this.stageWidth = 500;

  this.cellColorDepth = 256;
  this.startCount = 10;
  this.migrationChance = 0.02;
  this.copulationChance = 0.1;

  this.stepSize = 10000;
  this.colors = [];
  this.color_ = {r:0, g:0, b:0};

  // BAD! do gooder later.
  for (var i in options) {
    this[i] = options[i];
  }
  if (options._stageWidth) {
    this.stageWidth = options._stageWidth;
  }
  if (options._stageHeight) {
    this.stageHeight = options._stageHeight;
  }

  // Properties dependent on other properties.
  this.modelWidth = Math.floor(this.stageWidth / this.cellSize);
  this.modelHeight = Math.floor(this.stageHeight / this.cellSize);

  var seed = tinycolor.random().brighten(20).saturate(100);
  var colors = seed.analogous();
  colors[2].darken(20);
  colors[3].spin(90);
  colors[4].spin(-90).darken(20);
  for (var i = 0; i < colors.length; i++) {
    var rgb = colors[i].toRgb();
    rgb.r = Math.round((rgb.r / 256) * this.cellColorDepth);
    rgb.g = Math.round((rgb.g / 256) * this.cellColorDepth);
    rgb.b = Math.round((rgb.b/ 256) * this.cellColorDepth);
    this.colors.push(rgb);
  }

  this.step = Math.ceil((this.modelWidth * this.modelHeight) / this.stepSize);

  this.migrationDistance = Math.max(this.stageWidth, this.stageHeight);
  this.sprawlChance = (1 -this.copulationChance) / 4;
};

it.Environment.prototype.getRandomColor = function() {
  var color = this.colors[Math.floor(Math.random() * this.colors.length)];
  return color;
}

it.Environment.prototype.hasOpts = function(options) {
  for (var i in options) {
    if (i == '_stageWidth' && this.stageWidth != options[i]) {
      return false;
    } else if (i == '_stageHeight' && this.stageHeight != options[i]) {
      return false;
    } else if (this[i] != options[i]) {
      return false;
    }
  }
  return true;
}


it.Driver = function (environment, renderer) {
  this.env = environment;
  this.renderer = renderer;
  this.cells = {};
  this.stepOffset = 0;
  this.totalCells = this.env.modelWidth * this.env.modelHeight;

  for (var i = 0; i < this.env.startCount; i++) {
    var cell = new it.Cell();
    it.util.randomCell(cell, this.env);
    this.addCell_(cell);
  }
};

it.Driver.prototype.started = function () {
  return this.interval != null;
};

it.Driver.prototype.start = function () {
  var self = this;
  this.stop();
  this.interval = setInterval(function () {
      requestAnimationFrame(self.step.bind(self));
  }, this.env.speed);
};

it.Driver.prototype.stop = function () {
  if (this.interval != null) {
    clearInterval(this.interval);
    this.interval = null;
  }
};

it.Driver.prototype.colorDrop = function(x, y) {
  var cell = this.getCellAtStageLocation(x, y);
  it.util.randomCellAttributes(cell, this.env);
  this.renderer.render(cell);
};

it.Driver.prototype.toggleWall = function(x, y, first) {
  var cell = this.getCellAtStageLocation(x, y);
  if (first) {
    this.stickyWallState = !cell.isWall;
  }
  cell.isWall = this.stickyWallState;
  this.renderer.render(cell);
};

it.Driver.prototype.clearWalls = function() {
  for (var x = 0; x < this.env.modelWidth; x++) {
    for (var y = 0; y < this.env.modelHeight; y++) {
      var cell = this.getCell(x, y);
      if (cell) {
        cell.isWall = false;
      }
    }
  }
};

it.Driver.prototype.imageDrop = function(image) {
  var context = image.getContext('2d');
  for (var i = 0; i < this.env.modelWidth; i++) {
    for (var j = 0; j < this.env.modelHeight; j++) {
      var cell = this.createOrGetCell(i, j);
      cell.x = i;
      cell.y = j;
      var rgb = context.getImageData(i, j, 1, 1).data;
      cell.r = Math.floor(rgb[0] * (this.env.cellColorDepth / 256));
      cell.g = Math.floor(rgb[1] * (this.env.cellColorDepth / 256));
      cell.b = Math.floor(rgb[2] * (this.env.cellColorDepth / 256));
    }
  }
};

it.Driver.prototype.step = function () {
  // Clear the canvas to render step.
  // this.renderer.clear();

  var index;
  for (index = this.stepOffset; index < this.totalCells; index += this.env.step) {
    var cell = this.getCellAtIndex(index);
    if (!cell) {
      continue;
    }

    if (cell.isWall) {
      this.renderer.render(cell);
      continue;
    }

    var neighbor = this.getNeighbor(cell);
    if (neighbor.isWall) {
      continue;
    }

    cell.merge(neighbor);
    this.renderer.render(cell);
    this.renderer.render(neighbor);
  }
  this.stepOffset = (this.stepOffset + 1) % this.env.step;
};

it.Driver.prototype.getCell = function (x, y) {
  return this.cells[x + '_' + y];
};

it.Driver.prototype.getCellAtIndex = function(index) {
  var x = index % this.env.modelWidth;
  var y = Math.floor(index / this.env.modelWidth);
  return this.getCell(x, y);
};

it.Driver.prototype.removeCell = function (cell) {
  delete this.cells[cell.x + '_' + cell.y];
};

it.Driver.prototype.addCell_ = function (cell) {
  this.cells[cell.x + '_' + cell.y] = cell;
};

it.Driver.prototype.getCellAtStageLocation = function(stageX, stageY) {
  var x = Math.floor((stageX / this.env.stageWidth) * this.env.modelWidth);
  var y = Math.floor((stageY / this.env.stageHeight) * this.env.modelHeight);
  return this.createOrGetCell(x, y);
};

it.Driver.prototype.createOrGetCell = function(x, y) {
  var cell = this.getCell(x, y);
  if (!cell) {
    cell = new it.Cell();
    cell.x = x;
    cell.y = y;
    this.addCell_(cell);
  }
  return cell;
};

it.Driver.prototype.getNeighbor = function(cell) {
  var chance = Math.random();
  var dir = chance / this.env.sprawlChance;
  var mig = chance < this.env.migrationChance;
  var x = 0;
  var y = 0;

  if (mig) {
    x = Math.floor(((Math.random() * 2) - 1) * this.env.migrationDistance);
    y = Math.floor(((Math.random() * 2) - 1) * this.env.migrationDistance);
  } else {
    if (dir <= 1) {
      x = 1;
    } else if (dir <= 2) {
      x = -1;
    } else if (dir <= 3) {
      y = 1;
    } else if (dir <= 4) {
      y = -1;
    }
    x += cell.x;
    y += cell.y;
  }

  x = Math.min(this.env.modelWidth - 1, Math.max(0, x));
  y = Math.min(this.env.modelHeight - 1, Math.max(0, y));
  var cell = this.createOrGetCell(x, y);
  if (mig) {
    cell.weight = cell.weight / 4;
  }
  return cell;
};


it.Renderer = function (environment) {
  this.env = environment;
  var canvas = rfc.canvas(environment.stageWidth, environment.stageHeight);
  this.canvas = canvas;
  this.canvas.className = 'spread-canvas';
  this.ctx = canvas.getContext('2d');
};

it.Renderer.prototype.destroy = function() {
  it.container.removeChild(this.getDisplayElement());
};

it.Renderer.prototype.attach = function() {
  it.container.appendChild(this.getDisplayElement());
};

it.Renderer.prototype.addEventListener = function () {
  this.canvas.addEventListener.apply(this.canvas, arguments);
};

it.Renderer.prototype.removeEventListener = function () {
  this.canvas.removeEventListener.apply(this.canvas, arguments);
};

it.Renderer.prototype.getDisplayElement = function () {
  return this.canvas;
};

it.Renderer.prototype.clear = function () {
  this.ctx.fillStyle = "#fff";
  this.ctx.fillRect(0, 0, this.env.stageWidth, this.env.stageHeight);
};

it.Renderer.prototype.render = function (cell) {
  var rgb;
  if (cell.isWall || typeof cell.r == 'undefined') {
    rgb = 'rgb(255,254,253)';
  } else {
    rgb = this.getRGBString_(cell);
  }
  this.ctx.fillStyle = rgb;
  var x = this.env.cellSize * cell.x;
  var y = this.env.cellSize * cell.y;
  var w = this.env.cellSize;
  this.ctx.fillRect(x, y, w, w);
  if (cell.isWall) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + 1, y + 1);
    this.ctx.lineTo(x + w - 1, y + w - 1);
    this.ctx.moveTo(x + w - 1, y + 1);
    this.ctx.lineTo(x + 1, y + w - 1);
    this.ctx.stroke();
  }
};

it.Renderer.prototype.getRGBString_ = function (cell) {
  var colors = '';
  colors += cell.r * (256 / this.env.cellColorDepth) + ',';
  colors += cell.g * (256 / this.env.cellColorDepth) + ',';
  colors += cell.b * (256 / this.env.cellColorDepth);
  return 'rgb(' + colors + ')';
};


it.Cell = function () {
  this.isWall = false;
  this.weight = 1;
};

it.Cell.prototype.merge = function(cell) {
  if (!cell || cell.isWall) {
    return;
  }
  if (this.r === undefined) {
    this.r = cell.r;
    this.g = cell.g;
    this.b = cell.b;
    return;
  }
  if (cell.r === undefined) {
    cell.r = this.r;
    cell.g = this.g;
    cell.b = this.b;
    return;
  }

  var weights = this.weight + cell.weight;
  for (var c in {r:'', g:'', b:''}) {
    var tOrig = this[c];
    var cOrig = cell[c];
    this[c] = it.Cell.mergeColor(tOrig, cOrig, 0.4);// this.weight / weights);
    cell[c] = it.Cell.mergeColor(tOrig, cOrig, cell.weight / weights);
  }

  if ( Math.abs(this.r - cell.r) < 2
    && Math.abs(this.g - cell.g) < 2
    && Math.abs(this.b - cell.b) < 2) {
    this.weight += 2;
    cell.weight += 2;
  } else {
    var diff = this.weight - cell.weight;
    if (diff < 0) {
      cell.weight -= diff;
    } else {
      this.weight -= diff;
    }
  }

  // cell.r = this.r = this.mergeColor(cell.r, this.r, 0.4 + (Math.random() * 0.2));
  // cell.g = this.g = this.mergeColor(cell.g, this.g, 0.4 + (Math.random() * 0.2));
  // cell.b = this.b = this.mergeColor(cell.b, this.b, 0.4 + (Math.random() * 0.2));
};

it.Cell.mergeColor = function (val1, val2, ratio) {
  return Math.round((val1 * ratio) + (val2 * (1 - ratio)));
};


it.util = {};

it.util.randomCellAttributes = function (cell, env) {
  var color = env.getRandomColor();
  cell.r = color.r;
  cell.g = color.g;
  cell.b = color.b;
  if (env.colors.indexOf) {
    cell.weight = 2 + env.colors.indexOf(color);
  }
};

it.util.randomCell = function (cell, env) {
  it.util.randomCellAttributes(cell, env);
  cell.x = Math.floor(Math.random() * (env.modelWidth - 1));
  cell.y = Math.floor(Math.random() * (env.modelHeight - 1));
};


// Initialize
var controls = document.createElement('div');
controls.className = 'spread-controls';

var wrapper = document.createElement('div');
wrapper.className = 'spread-wrapper';

var container = document.createElement('div');
container.className = 'spread-container';

wrapper.appendChild(controls);
container.appendChild(wrapper);
var frame = {
  container: container,
  controls: controls,
  wrapper: wrapper
};

function createBasicControls() {
  if (frame.wrapper.children.length > 1) {
    return;
  }

  var restartButton = document.createElement('span');
  restartButton.className = 'spread-button';
  restartButton.title = 'Restart';
  restartButton.innerHTML = '<i class="material-icons">autorenew</i>';
  restartButton.addEventListener('click', function() {
    var restart = it.started();
    it.stop();
    it.reset(frame.opts);
    if (restart) {
      it.start();
    }
  });

  var startToggle = document.createElement('span');
  startToggle.className = 'toggle spread-button';
  startToggle.values = ['<i class="material-icons">pause</i>', '<i class="material-icons">play_arrow</i>'];
  startToggle.value = 0;
  startToggle.innerHTML = startToggle.values[startToggle.value];
  startToggle.title = 'Pause simulation';
  startToggle.setLabel = function (value) {
    this.innerHTML = this.values[value];
  };
  startToggle.addEventListener('click', function(evt) {
    var toggle = evt.currentTarget;
    toggle.value = it.started();
    if (toggle.value == 0) {
      it.start();
      toggle.title = 'Pause simulation';
    } else {
      it.stop();
      toggle.title = 'Start simulation';
    }
    toggle.setLabel(toggle.value + 0);
  });

  var stepButton = document.createElement('span');
  stepButton.className = 'spread-button';
  stepButton.title = 'Step forward';
  stepButton.innerHTML = '<i class="material-icons">arrow_forward</i>';
  stepButton.addEventListener('click', function(evt) {
    it.stop();
    it.step();
    startToggle.setLabel(1);
  });

  var clearWallsButton = document.createElement('span');
  clearWallsButton.className = 'spread-button';
  clearWallsButton.title = 'Clear boundary borders';
  clearWallsButton.innerHTML = '<i class="material-icons">border_clear</i>';
  clearWallsButton.addEventListener('click', function() {
    it.clearWalls();
  });

  wrapper.appendChild(restartButton);
  wrapper.appendChild(startToggle);
  wrapper.appendChild(stepButton);
  wrapper.appendChild(clearWallsButton);
}

function showControls() {
  if (!frame.controls.children.length) {
    // Controls.
    var hideButton = document.createElement('span');
    hideButton.className = 'spread-button';
    hideButton.innerHTML = '<i class="material-icons">close</i>';
    hideButton.addEventListener('click', function(evt) {
      controls.style.display = 'none';
      evt.stopPropagation();
    });

    controls.appendChild(hideButton);

    for (var i in frame.opts) {
      if (i[0] == '_') {
        // Skip hidden elements.
        continue;
      }
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.name = i;
      input.value = frame.opts[i];
      input.addEventListener('change', function(evt) {
        var target = evt.currentTarget;
        if (target.name == 'cellColorDepth') {
          if (target.value >= 256) {
            target.value = 256;
          } else {
            for (var j = 2; j < 256; j = j * 2) {
              if (target.value < j) {
                target.value = j;
                break;
              }
            }
          }
        }
        frame.opts[target.name] = target.value;
      });

      label.innerHTML = i;
      label.appendChild(input);
      controls.appendChild(label);
    }
  }
  // controls.style.display = 'block';
};

rf.registerPage(
  'spread',
  frame.container,
  function() {
    createBasicControls();
    frame.controls.innerHTML = '';

    var CELL_SIZE = 8;
    var parent = frame.container.parentElement;
    var width = Math.floor((parent.offsetWidth - CELL_SIZE) / CELL_SIZE) * CELL_SIZE;
    var height = Math.floor((parent.offsetHeight - CELL_SIZE) / CELL_SIZE) * CELL_SIZE;
    height -= wrapper.offsetHeight;
    var marginLeft = (parent.offsetWidth - width) / 2;
    var marginTop = (parent.offsetHeight - wrapper.offsetHeight - height) / 2;
    frame.container.style =
        'margin-left:' + marginLeft + 'px;'+
        'margin-top:' + marginTop + 'px;' +
        'height:' + height + 'px;' +
        'width:' + width + 'px';
    var offsetLeft = 0;
    var offsetTop = 0;
    var offsetElement = frame.container;
    while(offsetElement) {
      offsetLeft += offsetElement.offsetLeft;
      offsetTop += offsetElement.offsetTop;
      offsetElement = offsetElement.offsetParent;
    }
    frame.opts = {
      cellColorDepth: 32,
      cellSize: CELL_SIZE,
      copulationChance: 0.1,
      migrationChance: 0.000001,
      speed: 10,
      startCount: 8,
      stepSize: 500,
      walls: true,
      _stageWidth: width,
      _stageHeight: height,
      _offsetLeft: offsetLeft,
      _offsetTop: offsetTop
    };
    it.init(frame.container, frame.opts);
  },
  function() {
    it.wasStarted = it.started();
    it.stop();
  });
})();
