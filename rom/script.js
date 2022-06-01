(() => {
  const NUMERALS = {
    i: 1,
    v: 5,
    x: 10,
    l: 50,
    c: 100,
    d: 500,
    m: 1000,
  };

  const INTRO_WORDS = [
    'sixty five',
    'replicated',
    'roman numerals',
  ];

  // -------------- ROMAN NUMERALS DECODED ---------------

  // Folding from right to left,
  // lower leftward characters are subtracted,
  // others are added.

  // fromRoman :: String -> Int
  const fromRoman = s =>
    foldr(l => ([r, n]) => [
      l,
      l >= r ? (
        n + l
      ) : n - l
    ])([0, 0])(
      [...s].map(charVal)
    )[1];

  // charVal :: Char -> Maybe Int
  const charVal = (k) => {
    return NUMERALS[k.toLowerCase()] || 0;
  };
  // foldr :: (a -> b -> b) -> b -> [a] -> b
  const foldr = f =>
    // Note that that the Haskell signature of foldr
    // differs from that of foldl - the positions of
    // accumulator and current value are reversed.
    a => xs => [...xs].reduceRight(
      (a, x) => f(x)(a),
      a
    );


  class RomPage extends Page {
    constructor() {
      super('rom');
      this.onInput = () => {
        this.exit.textContent = this.parse(this.entry.value);
      }
    }

    getContainer() {
      if (!this.container) {
        this.container = this.createPageElement('div', 'container');
        this.entry = this.createElement('input', 'rom-input', this.container);
        this.exit = this.createElement('div', 'rom-output', this.container);
      }
      return this.container;
    }

    onShow() {
      super.onShow();
      this.entry.addEventListener('keyup', this.onInput);
      this.entry.value = INTRO_WORDS[Math.floor(Math.random() * INTRO_WORDS.length)];
      this.onInput();
      this.entry.focus();
    }

    onHide() {
      super.onHide();
      this.entry.removeEventListener('keyup', this.onInput);
    }


    parse(value) {
      const runs = [];
      let lastRun = '';
      let inNumerals = value[0].toLowerCase() in NUMERALS;
      for (let char of value) {
        const isNumeral = char.toLowerCase() in NUMERALS;
        if (isNumeral == inNumerals) {
          lastRun += char;
        } else {
          runs.push(inNumerals ? fromRoman(lastRun) : lastRun);
          lastRun = char;
          inNumerals = isNumeral;
        }
      }
      runs.push(inNumerals ? fromRoman(lastRun) : lastRun);
      return runs.join('');
    }

  }

  rf.pageViewer.registerPage(new RomPage());
})();
