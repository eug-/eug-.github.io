(() => {
  const OFFSET_HEIGHT = 50;
  const SCROLL_TIMEOUT = 15;
  const PREWARM = 1.5;
  const COLORS = {
    0: [88, 134, 38],
    1: [169, 207, 82],
    3: [274, 240, 103],
    7: [200, 252, 216],
    9: [4, 191, 186]
  };

  class PrimesPage extends Page {
    constructor() {
      super('primes');

      this.count = 0;
      this.offset = 1;
      this.start = 25;
      this.lastPrime = null;
      this.timeout = null;
      this.scrollListener = () => {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          this.checkScrollOffset();
        }, SCROLL_TIMEOUT);
      }
    }

    getContainer() {
      if (!this.container) {
        this.container = this.createPageElement('div', 'container');
        this.primeStyle = this.createElement('div', 'prime', this.container);
      }
      return this.container;
    }

    onShow() {
      super.onShow();
      if (!this.lastPrime) {
        this.addPrime(2);
      }
      this.checkScrollOffset();
      window.addEventListener('scroll', this.scrollListener);
    }

    onHide() {
      super.onHide();
      window.removeEventListener('scroll', this.scrollListener);
    }

    checkScrollOffset() {
      while (window.scrollY >= this.lastPrime.offsetTop - (window.outerHeight * PREWARM)) {
        this.fillPrimes();
      }
    }

    fillPrimes() {
      this.offset += 2;
      if (!this.isPrime(this.offset)) {
        this.fillPrimes();
        return;
      }
      this.addPrime(this.offset);
    }

    isPrime(prime) {
      for (let i = 3; i < prime; i++) {
        if (prime % i == 0) {
          return false;
        }
      }
      return true;
    }

    addPrime(prime) {
      this.count++;
      this.lastPrime = this.createElement('div', 'prime');
      this.lastPrime.innerText = prime;

      const offset = (this.count * OFFSET_HEIGHT) + (this.container.offsetHeight / 2);
      this.lastPrime.style.top = `${offset}px`;
      this.setBackgroundGradient(this.lastPrime, COLORS, prime);

      const x = (this.start + this.count * prime) % 100;
      if (x < 50) {
        this.lastPrime.style.left = (x + 2) + '%';
      } else {
        this.lastPrime.style.right = (100 - x + 2) + '%';
      }

      this.container.appendChild(this.lastPrime);
      const maxHeight = this.count * OFFSET_HEIGHT + this.lastPrime.offsetHeight;
      this.container.style.height = `${maxHeight}px`;
    };

    setBackgroundGradient(element, colors, prime) {
      const index = prime % 10;
      const color = colors[index] || colors[0];
      const border = this.rgbToString(this.getMuted(color, prime, true));
      const muted = this.getMuted(color, prime);
      const width = 1;
      element.style.textShadow =
        '-' + width + 'px -' + width + 'px ' + border +
        ',-' + width + 'px ' + width + 'px ' + border +
        ',' + width + 'px -' + width + 'px ' + border +
        ',' + width + 'px ' + width + 'px ' + border +
        ', -5px 0 ' + this.rgbToString(muted, 0.5) +
        ', 5px 0 ' + this.rgbToString(muted);
      element.style.color = this.rgbToString(color);
      if (index == 7 || index == 9) {
        element.classList.add('over');
      }
    }

    getMuted(rgb, prime, dark) {
      rgb = rgb.slice();
      const brightness = [0, 1, 2];
      brightness.sort(function(a, b) {
        return rgb[a] - rgb[b];
      });
      rgb[brightness[0]] = rgb[brightness[0]] / (dark ? 2 : 1);
      rgb[brightness[1]] = (rgb[brightness[1]] + prime % 100) / (dark ? 2 : 1);
      rgb[brightness[2]] = (rgb[brightness[1]] + Math.floor(prime / 100) % 75) / (dark ? 3 : 1);
      rgb[3] = 0.6;
      return rgb;
    }

    rgbToString(rgb, deviation) {
      const rgbString = this.getVariance(rgb[0], deviation) + ',' +
        this.getVariance(rgb[1], deviation) + ',' +
        this.getVariance(rgb[2], deviation);
      if (rgb.length > 3) {
        return `rgba(${rgbString}, ${this.getVariance(rgb[3], 0.1, true)})`;
      }
      return `rgb(${rgbString})`;
    }

    getVariance(color, deviation, decimal) {
      deviation = deviation || 0;
      const variant = Math.max(0, Math.min(255,
        color * (1 - (deviation / 2) + (Math.random() * deviation))));
      if (decimal) {
        return variant;
      }
      return Math.floor(variant);
    }
  }

  rf.pageViewer.registerPage(new PrimesPage());
})();
