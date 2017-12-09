;(function() {

  var currentPlate = null;
  var plates = [
    'relativity'
  ];

  var board = document.createElement('div');
  var plate = null;
  var img = null;
  var currentDrag = null;
  var dragPosition = [0,0];
  var startPosition = [0,0];
  var scale = 1;

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

  function processPlate(img) {
    var content = img.contentDocument;
    plate = content.firstChild;
    requestAnimationFrame(function() {
      // Wait for content to be laid out..
      scale = plate.viewBox.baseVal.height / (1.0 * plate.height.baseVal.value);
    });

    var movable = content.getElementsByTagName('g');
    for (var i = 0; i < movable.length; i++) {
      movable[i].style.cursor = 'move';
      movable[i].addEventListener('mousedown', startDrag);
    }
    // TODO: This will need to change.
    var colors = content.getElementsByTagName('rect');
  }

  function startDrag(evt) {
    endDrag();
    currentDrag = evt.currentTarget;
    var transform = currentDrag.style.transform.match('(-?[\\d\\.]+)px,\\s*(-?[\\d\\.]+)px') || [0,0,0];
    dragPosition = [Number(transform[1]), Number(transform[2])];
    startPosition = [evt.pageX, evt.pageY];
    currentDrag.addEventListener('mousemove', drag);
    currentDrag.addEventListener('mouseup', endDrag);
    currentDrag.addEventListener('mouseleave', endDrag);
    plate.addEventListener('mouseleave', endDrag);
  }

  function drag(evt) {
    console.log('dp', dragPosition);
    console.log('pos', evt.pageX - startPosition[0], evt.pageY - startPosition[1]);
    var x = dragPosition[0] + scale * (evt.pageX - startPosition[0]);
    var y = dragPosition[1] + scale * (evt.pageY - startPosition[1]);
    currentDrag.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  }

  function endDrag() {
    if (!currentDrag) {
      return;
    }
    currentDrag.removeEventListener('mousemove', drag);
    currentDrag.removeEventListener('mouseup', endDrag);
    currentDrag.removeEventListener('mouseleave', endDrag);
    plate.removeEventListener('mouseleave', endDrag);
    currentDrag = null;
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
