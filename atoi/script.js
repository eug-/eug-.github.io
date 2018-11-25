/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
;
(function() {
  class Viz {
    constructor(context, canvas) {
      this.context = context;
      this.canvas = canvas;
    }

    load() {
      this.loader = new BufferLoader(
        this.context, ['atoi/sample4.mp3'], (buffer) => {
          this.showBuffer(buffer);
        });
      this.loader.load();
    }

    showBuffer(buffer) {
      const context = this.canvas.getContext('2d');
      const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const audioDataL = buffer[0].getChannelData(0);
      const audioDataR = buffer[0].getChannelData(1);

      const data = imageData.data;
      const audioToPixRatio = audioDataL.length / data.length;
      for (let i = 0; i < data.length; i += 4) {
        const audioIndex = Math.floor(i * audioToPixRatio);
        const l = Math.floor(((1 + audioDataL[audioIndex]) / 2) * 383);
        const r = Math.floor(((1 + audioDataR[audioIndex]) / 2) * 383);
        data[i + 1] = Math.min(l, 255);
        data[i + 0] = l == r ? 255 : 0;
        data[i + 2] = Math.min(r, 255);
        data[i + 3] = 100 + (Math.abs(audioDataL[audioIndex] + audioDataR[audioIndex]) * 200);
      }

      context.putImageData(imageData, 0, 0);
    }
  }

  function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
  }

  BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    const loader = this;

    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      loader.context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            alert('error decoding file data: ' + url);
            return;
          }
          loader.bufferList[index] = buffer;
          if (++loader.loadCount == loader.urlList.length)
            loader.onload(loader.bufferList);
        },
        function(error) {
          console.error('decodeAudioData error', error);
        }
      );
    }

    request.onerror = function() {
      alert('BufferLoader: XHR error');
    }

    request.send();
  };

  BufferLoader.prototype.load = function() {
    for (let i = 0; i < this.urlList.length; ++i)
      this.loadBuffer(this.urlList[i], i);
  };

  var ImageLoader = window.ImageLoader = function(
    selectElement,
    inputElement,
    dropElement,
    onLoadStart,
    onLoaded) {
    var loader = this;
    loader.onImageLoaded = onLoaded;
    loader.onLoadStart = onLoadStart;
    loader.canvas = document.createElement('canvas');
    loader.image = new Image();
    loader.image.addEventListener("load", loader.imageLoaded_.bind(this));

    selectElement.addEventListener("click", function(e) {
      inputElement.click();
      e.preventDefault();
    }, false);

    inputElement.addEventListener("change", function(e) {
      loader.loadImage(this.files);
    }, false);

    dropElement.addEventListener("dragenter", function(e) {
      if (e.preventDefault) e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      this.classList.add('hovering');
      return false;
    }, false);

    dropElement.addEventListener("dragleave", function(e) {
      if (e.preventDefault) e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      this.classList.remove('hovering');
      return false;
    }, false);

    dropElement.addEventListener("dragover", function(e) {
      if (e.preventDefault) e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      this.classList.add('hovering');
      return false;
    }, false);

    dropElement.addEventListener("drop", function(e) {
      if (e.preventDefault) e.preventDefault();
      this.classList.remove('hovering');
      loader.loadImage(e.dataTransfer.files);
      return false;
    }, false);
  };

  ImageLoader.prototype.imageLoaded_ = function(e) {
    this.canvas.width = this.image.width;
    this.canvas.height = this.image.height;
    var ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.image, 0, 0);
    this.imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas
      .height);
    this.onImageLoaded && this.onImageLoaded(this.image, this.imageData);
  }

  ImageLoader.prototype.loadImage = function(files) {
    this.image.file = files[0];
    if (this.onLoadStart) {
      this.onLoadStart(files[0]);
    }
    this.imageData = null;
    var reader = new FileReader();
    var image = this.image;
    reader.onload = function(e) {
      image.src = e.target.result;
    };
    reader.readAsDataURL(files[0]);
  }

  class AtoiPage extends Page {
    constructor() {
      super('atoi');
    }

    getContainer() {
      if (!this.container) {
        this.container = this.createPageElement('div', 'container');
        this.canvas = this.createPageElement('canvas', 'canvas', this.container);
        const aside = this.createPageElement('aside', 'directions', this.container);
        const title = this.createElement('h1', '', aside);
        title.innerText = 'audio to image';
        const directions = this.createElement('p', '', aside);
        directions.innerText = 'select an audio file to convert into an image.';
        const input = this.createElement('input', 'hidden', aside);
        input.setAttribute('type', 'file');
        this.container.addEventListener('click', () => {
          input.click();
        });
      }
      return this.container;
    }

    onShow(width, height) {
      this.canvas.width = Math.ceil(width);
      this.canvas.height = Math.ceil(height);
      this.context = new(window.AudioContext || window.webkitAudioContext);
      this.viz = new Viz(this.context, this.canvas);
      this.viz.load();
    }

    onHide() {
      this.context = null;
      this.viz = null;
    }
  }

  rf.pageViewer.registerPage(new AtoiPage());
})();
