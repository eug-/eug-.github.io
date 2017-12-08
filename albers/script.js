;(function() {

  var currentPlate = null;
  var plates = [
    'relativity'
  ];

  var board = document.createElement('div');
  var img = null;

  function initialize() {
    if (img) {
      return;
    }
    img = document.createElement('object');
    img.className = 'plate';
    board.className = 'board';
    board.appendChild(img);
    showPlate(plates[0]);
  }

  function showPlate(plateName) {
    if (plateName == currentPlate) {
      return;
    }
    currentPlate = plateName;
    img.addEventListener('load', function(){
      if (plateName != currentPlate) {
        return;
      }
      processPlate(img);
    });
    img.data='albers/svg/' + plateName + '.svg';
  }

  function processPlate(plate) {
    var movable = plate.contentDocument.getElementsByTagName('g');
    for (var i = 0; i < movable.length; i++) {
      movable[i].style.cursor = 'move';
      movable[i].addEventListener('mousedown', startDrag);
    }
    // TODO: This will need to change.
    var colors = plate.contentDocument.getElementsByTagName('rect');
  }

  function startDrag(evt) {
    console.log(evt.target);
  }

  rf.registerPage(
    'albers',
    board,
    function() {
      initialize();
    },
    function() {
    });
})();
