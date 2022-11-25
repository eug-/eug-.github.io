(() => {

  const LETTER_MAP = {
    'b': 'bi',
    'd': 'di',
    'n': 'ni',
    'k': 'ki',
    'h': 'hi',
    'c': 'coq',
    'o': 'coq',
    'q': 'coq',
    't': 'it',
    'e': 'iefl',
    'f': 'iefl',
    'l': 'iefl',
    'r': 'irp',
    'p': 'irp',
    'j': 'ju',
    'u': 'ju',
  };


  const WORDS = [
    ['barely', 'barfly'],
    ['beetle', 'befile'],
    ['apple', 'april'],
    ['riffs', 'peels'],

    ['adrenaline', 'adrenalize'],
    ['animine', 'animize', 'azimine'],
    ['cap', 'car', 'oar'],
    ['cape', 'care'],
    ['berapt', 'bepart'],
    ['bones', 'boxes'],
    ['concepts', 'concerts'],
    ['our', 'cup'],
    ['easier', 'easter', 'faster'],
    ['ionic', 'tonic', 'tonto'],
    ['scar', 'soap', 'soar'],
    ['scur', 'sour', 'soup'],
  ];

  let intervalTimeoutId = 0;
  const fonts = ['News Cycle', 'Oswald' /*a1*/ ];

  class LswapPage extends Page {
    setWords(wordList) {
      if (!wordList || !wordList.length) {
        return;
      }

      this.word.innerHTML = '';
      for (let i = 0; i < wordList[0].length; i++) {
        const chars = [];
        let className = '';
        for (let word of wordList) {
          const char = word[i];
          if (char in LETTER_MAP) {
            className = LETTER_MAP[char];
          } else if (!className) {
            className = char;
          }
          chars.push(char);
        }
        this.addLetter(chars, className);
      }

      this.measureWord();
    }

    addLetter(chars, className) {
      const div = this.createPageElement('div', 'letter', this.word);
      for (let i = 0; i < chars.length; i++) {
        const span = this.createPageElement('span', `part i-${i} c-${chars[i]} g-${className}`, div);
        span.innerText = chars[i];
      }
    }

    measureWord() {
      window.requestAnimationFrame(() => {
        const letters = this.word.children;
        for (let i = 0; i < letters.length; i++) {
          const letter = letters[i];
          const chars = letter.children;
          let maxWidth = 0;
          let maxHeight = 0;
          for (let j = 0; j < chars.length; j++) {
            const span = chars[j];
            const clientRect = span.getBoundingClientRect();
            maxWidth = Math.max(clientRect.width, maxWidth);
            maxHeight = Math.max(clientRect.height, maxHeight);
            span.style.position = 'absolute';
          }
          letter.style.width = `${maxWidth}px`;
          letter.style.height = `${maxHeight}px`;
        }
        this.staticWord.innerHTML = this.word.innerHTML;
      });
    }

    constructor() {
      super('lswap');
    }

    getContainer() {
      if (!this.container) {
        this.container = this.createPageElement('div', 'container s-0');
        this.word = this.createPageElement('div', 'word', this.container);
        this.staticWord = this.createPageElement('div', 'static-word', this.container);
      }

      rf.loadFontArrayCss(fonts);
      return this.container;
    }

    onShow() {
      super.onShow();
      this.container.style.fontFamily = fonts[Math.floor(Math.random() * fonts.length)];

      const words = WORDS[Math.floor(Math.random() * WORDS.length)];
      this.setWords(words);

      let highlight = 0;
      intervalTimeoutId = setInterval(() => {
        this.container.classList.remove(`s-${highlight}`);
        highlight = (highlight + 1) % words.length;
        this.container.classList.add(`s-${highlight}`);
      }, 5000);
    }

    onHide() {
      super.onHide();
      clearInterval(intervalTimeoutId);
    }
  }

  rf.pageViewer.registerPage(new LswapPage());
})();
