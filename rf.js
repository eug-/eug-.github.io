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

  rf.registerPage = function(id, view, onShow, onHide) {
    pageIds.push(id);
    pages[id] = {
      view: view,
      onShow: onShow,
      onHide: onHide
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
      pages[currentPage].onHide();
      document.body.classList.remove('p-' + currentPage);
    }

    document.body.classList.add('p-' + id);
    label.innerHTML = id;

    while (main.firstChild) {
      main.removeChild(main.firstChild);
    }
    main.appendChild(page.view);
    setTimeout(page.onShow, 50);

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
})();
