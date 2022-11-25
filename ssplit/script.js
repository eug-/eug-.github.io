(() => {

  class Node {
    constructor(value) {
      this.value = value;
      this.word;
      this.children = {};
    }

    has(value) {
      return value in this.children;
    }

    get(value) {
      return this.children[value];
    }

    isValidEnd() {
      return this.word;
    }
  }

  class Trie {
    constructor() {
      this.root = new Node('');
    }

    addWord(word, original) {
      let node = this.root;
      for (const letter of word) {
        if (!node.has(letter)) {
          node.children[letter] = new Node(letter);
        }
        node = node.children[letter];
      }
      node.word = original || word;
    }
  }

  class SsplitPage extends Page {
    constructor() {
      super('ssplit');
      this.trie = new Trie();
      this.dictionary = {};

      this.onInput = () => {
        this.showMatches(this.input.value.toLowerCase());
      };
    }

    getContainer() {
      if (!this.container) {
        this.loadWords();
        this.container = this.createPageElement('div', 'container');
        this.input = this.createPageElement('input', 'input');
        this.output = this.createPageElement('div', 'output');
        this.container.appendChild(this.input);
        this.container.appendChild(this.output);
      }
      return this.container;
    }

    onShow() {
      super.onShow();
      this.input.addEventListener('input', this.onInput);
    }

    onHide() {
      super.onHide();
      this.input.removeEventListener('input', this.onInput);
    }

    showMatches(query) {
      this.output.innerHTML = this.getMatches(query)
        .join('<br/>\n');
    }

    getMatches(query) {
      const string = query.replace(/(\s|[^a-z])*/g, '');
      let matchIndex = 0;
      const possibleMatches = {
        [matchIndex++]: {
          node: this.trie.root,
          words: [],
          string: '',
        }
      };
      for (const letter of string) {
        for (const index in possibleMatches) {
          const match = possibleMatches[index];
          const nextNode = match.node.get(letter);
          if (!nextNode) {
            delete possibleMatches[index];
            continue;
          }

          match.string += letter;

          if (nextNode.isValidEnd()) {
            const words = match.words.slice();
            words.push(match.string);
            possibleMatches[matchIndex++] = {
              node: this.trie.root,
              words: words,
              string: '',
            };
          }

          match.node = nextNode;
        }
      }
      const matches = [];
      for (const index in possibleMatches) {
        const string = possibleMatches[index].string;
        const words = possibleMatches[index].words;
        if (string == '' && words.length > 0 && words.join(' ') != query) {
          matches.push(this.makePhrase(words));
        }
      }
      return matches;
    }

    makePhrase(words) {
      const elements = [];
      for (const word of words) {
        const entry = this.dictionary[word] || this.dictionary[word.substring(0, word.length - 1)];
        let definition = '';
        if (entry && entry.definitions && entry.definitions.length > 0) {
          definition = entry.definitions.map(
              (def, index) => `${index + 1}. ${def.definition}`)
            .join('\n\n');
        }
        elements.push(`<span title="${definition}">${word}</span>`);
      }
      return elements.join(' ');
    }

    loadWords() {
      fetch('dictionary.json')
        .then((response) => {
          return response.json();
        })
        .then((dictionary) => {
          this.dictionary = dictionary;
        })
        .then(() => {
          fetch('words.json')
            .then((response) => {
              // json() returns a promise
              return response.json();
            })
            .then((words) => {
              for (const word of words) {
                if (word in this.dictionary) {
                  this.trie.addWord(word);
                }
                if (this.canAdjective(word)) {
                  this.trie.addWord(word + 'y', word);
                }
              }

              // // TEMP:
              for (const phrase of demo) {
                const matches = this.getMatches(phrase.toLowerCase());
                if (matches.length) {
                  this.output.innerHTML += `<h2>${phrase}</h2> ${matches.join('<br/>')}`;
                }
              }
            });
        });
    }

    canAdjective(word) {
      const entry = this.dictionary[word];
      if (!entry) {
        return false;
      }
      for (const def of entry.definitions) {
        if (def.part_of_speech == 'noun') {
          return true;
        }
      }
      return false;
    }

  }

  rf.pageViewer.registerPage(new SsplitPage());

  const demo = ["Love For All Hatred For None",
    "Change the world by being yourself",
    "Every moment is a fresh beginning",
    "Never regret anything that made you smile",
    "Die with memories not dreams",
    "Aspire to inspire before we expire",
    "Everything you can imagine is real",
    "Simplicity is the ultimate sophistication",
    "Whatever you do do it well",
    "What we think we become",
    "All limitations are self-imposed",
    "Tough times never last but tough people do",
    "Problems are not stop signs they are guidelines",
    "One day the people that do not even believe in you will tell everyone how they met you",
    "If I am gonna tell a real story I am gonna start with my name",
    "If you tell the truth you do not have to remember anything",
    "Have enough courage to start and enough heart to finish",
    "Hate comes from intimidation love comes from appreciation",
    "I could agree with you but then we would both be wrong",
    "Oh the things you can find if you do not stay behind",
    "Determine your priorities and focus on them",
    "Be so good they cannot ignore you",
    "Dream as if you will live forever live as if you will die today",
    "Yesterday you said tomorrow Just do it",
    "I do not need it to be easy I need it to be worth it",
    "Never let your emotions overpower your intelligence",
    "Nothing lasts forever but at least we got these memories",
    "do not you know your imperfections is a blessing?",
    "Reality is wrong dreams are for real",
    "To live will be an awfully big adventure",
    "Try to be a rainbow in someone's cloud",
    "There is no substitute for hard work",
    "What consumes your mind controls your life- Unknown",
    "Strive for greatness",
    "Wanting to be someone else is a waste of who you are",
    "And still I rise",
    "The time is always right to do what is right",
    "Let the beauty of what you love be what you do",
    "May your choices reflect your hopes not your fears",
    "A happy soul is the best shield for a cruel world",
    "White is not always light and black is not always dark",
    "Life becomes easier when you learn to accept the apology you never got",
    "Happiness depends upon ourselves",
    "Turn your wounds into wisdom",
    "Change the game do not let the game change you",
    "It hurt because it mattered",
    "If the world was blind how many people would you impress?",
    "I will remember and recover not forgive and forget",
    "The meaning of life is to give life meaning",
    "The true meaning of life is to plant trees under whose shade you do not expect to sit",
    "When words fail music speaks",
    "Embrace the glorious mess that you are",
    "Normality is a paved road: it is comfortable to walk but no flowers grow",
    "I have nothing to lose but something to gain"
  ];
})();
