;(function() {

  var OFFSET_HEIGHT = 50;
  var SCROLL_TIMEOUT = 15;
  var PREWARM = 1.5;
  var COLORS = {
    0: [88, 134, 38],
    1: [169, 207, 82],
    3: [274, 240, 103],
    7: [200, 252, 216],
    9: [4, 191, 186]
  };

  var count = 0;
  var offset = 1;
  var start = 25;
  var lastPrime = null;
  var timeout = null;

  var container = document.createElement('div');
  container.className = 'primes-container';

  var primeStyle = document.createElement('div');
  primeStyle.className = 'prime';
  container.appendChild(primeStyle);


  var fillPrimes = function () {
    offset += 2;
    if (!isPrime(offset)) {
      return fillPrimes();
    }
    addPrime(offset);
  };

  var isPrime = function (prime) {
    for (var i = 3; i < prime; i++) {
      if (prime % i == 0) {
        return false;
      }
    }
    return true;
  };

  var addPrime = function (prime) {
    lastPrime = document.createElement('div');
    lastPrime.className = 'prime';
    lastPrime.innerHTML = prime;
    count++;
    setBackgroundGradient(lastPrime, COLORS, prime);

    container.appendChild(lastPrime);
    lastPrime.style.top = ((count * OFFSET_HEIGHT) + (container.offsetHeight / 2)) + 'px';
    var x = (start + count * prime) % 100;
    if (x < 50) {
      lastPrime.style.left = (x + 2) + '%';
    } else {
      lastPrime.style.right = (100 - x + 2) + '%';
    }
    container.style.height = (count * OFFSET_HEIGHT + lastPrime.offsetHeight) + 'px';
  };

  var setBackgroundGradient = function(element, colors, prime) {
    var index = prime % 10;
    var color = colors[index] || colors[0];
    var muted = getMuted(color, prime, true);
    var border = rgbToString(muted);
    var width = 1;
    muted = getMuted(color, prime);
    element.style.textShadow =
        '-' + width + 'px -' + width + 'px ' + border +
        ',-' + width + 'px ' + width + 'px ' + border +
        ',' + width + 'px -' + width + 'px ' + border +
        ',' + width + 'px ' + width + 'px ' + border +
        ', -5px 0 ' + rgbToString(muted, 0.5) + ', 5px 0 ' + rgbToString(muted);
    element.style.color = rgbToString(color);
    if (index == 7 || index == 9) {
      element.classList.add('over');
    }
  };

  var getMuted = function(rgb, prime, dark) {
    rgb = rgb.slice();
    var brightness = [0, 1, 2];
    brightness.sort(function(a, b) {
      return rgb[a] - rgb[b];
    });
    rgb[brightness[0]] = rgb[brightness[0]] / (dark ? 2 : 1);
    rgb[brightness[1]] = (rgb[brightness[1]] + prime % 100) / (dark ? 2 : 1);
    rgb[brightness[2]] = (rgb[brightness[1]] + Math.floor(prime / 100) % 75) / (dark ? 3 : 1);
    rgb[3] = 0.6;
    return rgb;
  };

  var rgbToString = function(rgb, deviation) {
    var rgbString = getVariance(rgb[0], deviation) + ',' +
        getVariance(rgb[1], deviation) + ',' +
        getVariance(rgb[2], deviation);
    if (rgb.length > 3) {
      return 'rgba(' + rgbString + ',' + getVariance(rgb[3], 0.1, true) + ')';
    }
    return 'rgb(' + rgbString + ')';
  };

  var getVariance = function(color, deviation, decimal) {
    deviation = deviation || 0;
    var variant = Math.max(0, Math.min(255,
      color * (1 - (deviation / 2) + (Math.random() * deviation))));
    if (decimal) {
      return variant;
    }
    return Math.floor(variant);
  };

  var checkScrollOffset = function () {
    while (window.scrollY >= lastPrime.offsetTop - (window.outerHeight * PREWARM)) {
      fillPrimes();
    }
  };

  var scrollListener = function () {
    clearTimeout(timeout);
    timeout = setTimeout(checkScrollOffset, SCROLL_TIMEOUT);
  };

  rf.registerPage('primes', container, {
    onShow: function() {
      if (!lastPrime) {
        addPrime(2);
      }
      checkScrollOffset();
      window.addEventListener('scroll', scrollListener);
    },
    onHide: function() {
      window.removeEventListener('scroll', scrollListener);
    }
  });
})();
