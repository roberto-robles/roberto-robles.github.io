/* Minimal stand-in for the dashboard runtime, so the page runs as a static site. */
(function () {
  var sources = {}, calcs = {}, cache = {}, draws = {}, listeners = [];
  function ok(d) { return { status: 'ok', data: d, message: null, refreshing: false, truncated: false, meta: null }; }
  var dash = {
    colors: ['#2a6fdb', '#e07b39', '#2a9d8f', '#9b5de5', '#d64f79'],
    _setSources: function (s) { sources = s; cache = {}; },
    data: function (id) {
      if (sources[id]) { var r = ok(sources[id]); r.columns = sources[id].length ? Object.keys(sources[id][0]) : []; return r; }
      var c = calcs[id];
      if (c) {
        if (!(id in cache)) {
          var args = c.inputs.map(function (i) { var g = dash.data(i); return g.status === 'ok' ? g.data : []; });
          try { cache[id] = c.fn.apply(null, args); } catch (e) { console.error('calc ' + id, e); return { status: 'error', data: null, message: String(e) }; }
        }
        return ok(cache[id]);
      }
      return { status: 'missing', data: [] };
    },
    calc: function (id, def) { calcs[id] = def; delete cache[id]; },
    loader: function () {},
    draw: function (name, fn) {
      if (fn) draws[name] = fn;
      var f = draws[name]; if (!f) return;
      document.querySelectorAll('[data-draw="' + name + '"]').forEach(function (el) {
        try { f(el); } catch (e) { console.error('draw ' + name, e); }
      });
    },
    onData: function (fn) { listeners.push(fn); try { fn(); } catch (e) { console.error(e); } },
    setLink: function (name) { history.replaceState(null, '', '#' + name); },
    params: function () { return {}; }, setParams: function () {}, resetParams: function () {},
    refresh: function () {},
    _redrawAll: function () {
      Object.keys(draws).forEach(function (n) { dash.draw(n); });
      listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    }
  };
  window.dash = dash;
  var lastW = 0, t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var w = document.getElementById('dash-root').clientWidth;
      if (w !== lastW) { lastW = w; dash._redrawAll(); }
    }, 150);
  });
})();
