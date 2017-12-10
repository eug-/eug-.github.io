var rf = {};
;(function() {
  rf.global = window;

  rf.analytics = {};
  rf.analytics.addScript = function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  };
  rf.analytics.init = function() {
    var tracker = rf.global._gaq = [];
    tracker.push(['_setAccount', 'UA-20257270-2']);
    tracker.push(['_trackPageview']);
    rf.analytics.addScript();
  };

  // Kick off.
  rf.analytics.init();

  var pages = {};
  var pageIds = [];
  var currentPage = null;

  rf.setSources = function(sources) {
    for (var i = 0; i < sources.length; i++) {
      var source = sources[i].replace(/([^a-z])*/g, '');
      rf.appendCss(source + '/styles.css');

      var script = document.createElement('script');
      script.setAttribute('src', source + '/script.js');
      document.body.appendChild(script);
    }
  };

  rf.addFonts = function() {
    var fontString = arguments.join('|').replace(' ', '+');
    rf.appendCss('http://fonts.googleapis.com/css?family=' + fontList);
  }

  rf.appendCss = function(source) {
      var style = document.createElement('link');
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('type', 'text/css');
      style.setAttribute('href', source);
      document.head.appendChild(style);
  }

  rf.registerPage = function(id, view, opts) {
    pageIds.push(id);
    pages[id] = {
      view: view,
      onShow: opts.onShow,
      onHide: opts.onHide,
      hideHeader: opts.hideHeader
    };

    if (!currentPage) {
      setPage(id);
    }
  };

  function setPage(id) {
    document.body.classList.toggle('small', window.innerWidth < 640);

    var label = document.getElementById('page-label');
    var main = document.getElementById('main');
    var page = pages[id];

    if (currentPage) {
      pages[currentPage].onHide && pages[currentPage].onHide();
      document.body.classList.remove('p-' + currentPage);
      clearTimeout(pages[currentPage].pending);
    }

    document.body.classList.add('p-' + id);
    label.innerHTML = id;

    while (main.firstChild) {
      main.removeChild(main.firstChild);
    }
    main.appendChild(page.view);
    setTimeout(page.onShow, 50);

    document.body.classList.remove('hide-header');
    if (page.hideHeader) {
      page.pending = setTimeout(function() {
        document.body.classList.add('hide-header');
      }, 1500);
    }
    currentPage = id;
  }

  function setPageOffset(offset) {
    if (!pages || !currentPage) {
      return;
    }
    var index = pageIds.indexOf(currentPage);
    index += pageIds.length + offset;
    index %= pageIds.length;
    setPage(pageIds[index]);
  };

  var back = document.getElementById('back');
  var forward = document.getElementById('forward');
  back.addEventListener('click', function() {
    setPageOffset(-1);
  });
  forward.addEventListener('click', function() {
    setPageOffset(1);
  });

  var resizeTimeout;
  function onresize () {
    if (currentPage) {
      setPage(currentPage);
    }
  };
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onresize, 500);
  });



  /// DRAGGING MESS ///
  function extractEventFromTouch(evt) {
    return fakeEvent = {
      target: evt.target,
      currentTarget: evt.currentTarget,
      clientX: evt.touches[0].clientX,
      clientY: evt.touches[0].clientY,
      pageX: evt.touches[0].pageX,
      pageY: evt.touches[0].pageY
    };
  }

  function onDragStart(dragId, evt) {
    var dragEntry = dragRegistry[dragId];
    if (!dragEntry) {
      return;
    }
    dragEntry.onStart && dragEntry.onStart(evt);
    var target = dragEntry.target;
    target.addEventListener('mousemove', dragEntry.onDragMove);
    target.addEventListener('touchmove', dragEntry.onTouchMove);
    target.addEventListener('mouseup', dragEntry.onDragEnd);
    target.addEventListener('mouseleave', dragEntry.onDragEnd);
    target.addEventListener('touchend', dragEntry.onTouchEnd);
    target.addEventListener('touchcancel', dragEntry.onTouchEnd);
    if (dragEntry.bounds) {
      dragEntry.bounds.addEventListener('mouseleave', dragEntry.onDragEnd);
    }
  };

  function onTouchStart(dragId, evt) {
    evt.preventDefault();
    onDragStart(dragId, extractEventFromTouch(evt));
  }

  function onDragMove(dragId, evt) {
    var dragEntry = dragRegistry[dragId];
    if (!dragEntry) {
      return;
    }
    dragEntry.onDrag && dragEntry.onDrag(evt);
  };

  function onTouchMove(dragId, evt) {
    evt.preventDefault();
    onDragMove(dragId, extractEventFromTouch(evt));
  }

  function onDragEnd(dragId, evt) {
    var dragEntry = dragRegistry[dragId];
    if (!dragEntry) {
      return;
    }
    dragEntry.onEnd && dragEntry.onEnd(evt);
    removeEndEvents(dragEntry);
  };

  function onTouchEnd(dragId, evt) {
    evt.preventDefault();
    onDragEnd(dragId, evt);
  }

  function removeEndEvents(dragEntry) {
    var target = dragEntry.target;
    target.removeEventListener('mousemove', dragEntry.onDragMove);
    target.removeEventListener('touchmove', dragEntry.onTouchMove);
    target.removeEventListener('mouseup', dragEntry.onDragEnd);
    target.removeEventListener('mouseleave', dragEntry.onDragEnd);
    target.removeEventListener('touchend', dragEntry.onTouchEnd);
    target.removeEventListener('touchcancel', dragEntry.onTouchEnd);
    if (dragEntry.bounds) {
      dragEntry.bounds.removeEventListener('mouseleave', dragEntry.onDragEnd);
    }
  }

  var dragRegistry = {};
  var nextDragId = 0;

  rf.registerDrag = function(target, bounds, onStart, onDrag, onEnd) {
    var dragId = nextDragId++;
    var dragEntry = {
      target: target,
      bounds: bounds,
      onStart: onStart,
      onDrag: onDrag,
      onEnd: onEnd,
      onDragStart: onDragStart.bind(window, dragId),
      onTouchStart: onTouchStart.bind(window, dragId),
      onDragMove: onDragMove.bind(window, dragId),
      onTouchMove: onTouchMove.bind(window, dragId),
      onDragEnd: onDragEnd.bind(window, dragId),
      onTouchEnd: onTouchEnd.bind(window, dragId)
    }
    dragRegistry[dragId] = dragEntry;
    target.addEventListener('mousedown', dragEntry.onDragStart);
    target.addEventListener('touchstart', dragEntry.onTouchStart);
    return dragId;
  };

  rf.unregisterDrag = function(dragId) {
    var dragEntry = dragRegistry[dragId];
    if (!dragEntry) {
      return;
    }
    delete dragRegistry[dragId];
    var target = dragEntry.target;
    target.removeEventListener('mousedown', dragEntry.onDragStart);
    target.removeEventListener('touchstart', dragEntry.onTouchStart);
    removeEndEvents(dragEntry);
  };

})();
