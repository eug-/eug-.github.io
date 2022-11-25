import json

IMAP = ['it', 'iefl', 'irp', 'bi', 'di', 'ni', 'ki', 'hi']
LETTER_MAP = {
  'b': 'bi',
  'd': 'di',
  'n': 'ni',
  'k': 'ki',
  'h': 'hi',
  'c': 'coq',
  'o': 'coq',
  'q': 'coq',
  # 'i': handled in second pass
  't': 'it',
  'e': 'iefl',
  'f': 'iefl',
  'l': 'iefl',
  'r': 'irp',
  'p': 'irp',
  'j': 'ju',
  'u': 'ju',
}
master_list = []
visited = {}

class TrieNode:
  def __init__(self, value):
    self.children = {}
    self.words = {}
    self.value = value
    self.id = None
    self.seen = False
    self.diff = -1

  def addPack(self, word):
    global master_list

    if len(word) < 1:
      return

    if len(self.words) > 0 and not self.seen:
      master_list.append(self)
      self.seen = True

    self.words[word] = True

  def addClones(self, root):
    for word in root.words:
      self.addPack(word)
    # print 'cloning', self.value, root.words.keys()
    for child in root.children:
      self.getOrCreateChild(child).addClones(root.children[child])

  def addChar(self, char):
    global LETTER_MAP
    global IMAP
    if char in LETTER_MAP:
      char = LETTER_MAP[char]

    return [self.getOrCreateChild(char)]

  def getId(self):
    if self.id is None:
      self.id = ''.join(self.words)
    return self.id

  def getOrCreateChild(self, char):
    if char in self.children:
      return self.children[char]

    newChild = TrieNode(char)
    self.addChild(newChild)
    return newChild

  def addChild(self, node):
    if node.value in self.children:
      raise 'Node already exists'
    self.children[node.value] = node;


class Trie:
  def __init__(self):
    self.root = TrieNode(None)

  def addWord(self, word):
    # print 'adding ' + word
    self.addLetters(0, word, self.root)

  def addLetters(self, index, word, root):
    if index >= len(word):
      # print 'packing ' + word
      root.addPack(word)
      return

    char = word[index]

    children = root.addChar(char)
    # print 'on char ', char
    for child in children:
      # print 'adding child ', index, child.value
      self.addLetters(index + 1, word, child)

  def reduce(self, root):
    if 'i' in root.children:
      children = filter(lambda x: x in IMAP, root.children.keys())
      if len(children) > 0:
        i = root.children.pop('i')
        for child in children:
          root.children[child].addClones(i)

    for child in root.children:
      self.reduce(root.children[child])


trie = Trie()
with open('words.json', 'r') as data:
  print 'constructing tree'
  words = json.loads(data.read())
  for word in words.keys():
    trie.addWord(word)

print 'reducing tree'
trie.reduce(trie.root)

print 'creating list'
word_list = []
for trie in master_list:
  if trie.getId() in visited:
    continue
  visited[trie.getId()] = True
  word_list.append(trie.words.keys())

with open('groups.json', 'w') as data:
  data.write(json.dumps(word_list))
"""
  class LswapPage extends Page {
    constructor() {
      super('lswap');
    }

    getContainer() {
      if (!this.container) {
        this.container = this.createPageElement('ul', 'container');
      }
      return this.container;
    }

    onShow() {
      super.onShow();
      if (!this.trie) {
        this.trie = new Trie();
        fetch('lswap/words.json')
          .then(response => response.json())
          .then((words) => {
            for (const word of Object.keys(words)) {
              this.trie.addWord(word);
            }
            packList.sort((a, b) => b.getDiff() - a.getDiff());
            for (const node of packList) {
              if (node.visited) {
                continue;
              }
              node.visited = true;
              for (const word of node.words) {
                const li = this.createPageElement('li', `word-${node.diff}`, this.container);
                li.innerText = word;
              }
              this.createPageElement('br', 'break', this.container);
            }
          });
      }
    }

    onHide() {
      super.onHide();
    }
  }

  rf.pageViewer.registerPage(new LswapPage());
})();
"""
