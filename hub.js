
(function(){
  var r = document.documentElement;
  r.classList.add('js');
  try {
    var oldTheme = localStorage.getItem('dashhq-theme');
    if(oldTheme === 'light' || oldTheme === 'dark') dashhq.theme.set(oldTheme);
    localStorage.removeItem('dashhq-theme');
  } catch(e) {}
  function paintChrome(){
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){
      meta.removeAttribute('media');
      meta.content = getComputedStyle(r).getPropertyValue('--dh-page').trim();
    });
  }
  document.addEventListener('dashhq-theme', paintChrome);
  paintChrome();

  // Counts in the title block come from the page itself, so they cannot drift.
  var n = {card: document.querySelectorAll('.card').length, entry: document.querySelectorAll('.dgroup li').length};
  document.querySelectorAll('[data-count]').forEach(function(el){ el.textContent = n[el.dataset.count]; });

  // Jumping to a plate flashes its border so you can see where you landed.
  var amber = getComputedStyle(r).getPropertyValue('--amber').trim();
  function flash(id){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var el = document.getElementById(id);
    var plate = el && el.classList.contains('card') && el.querySelector('.plate');
    if(plate && plate.animate) plate.animate([{borderColor:amber},{borderColor:amber, offset:.5}], {duration:1400, easing:'ease-out'});
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if(a && a.getAttribute('href').length > 1) flash(a.getAttribute('href').slice(1));
  });

  // The map has one highlight layer. Routes drive it with numbers; the finder
  // drives it without. Both go through highlight(), so they cannot fight.
  var svg = document.querySelector('.hsvg');
  var chipbox = document.querySelector('.mapchips');
  var nodes = svg ? svg.querySelectorAll('.hnode') : [];
  var chips = chipbox ? chipbox.querySelectorAll('.chip') : [];
  var pinned = null, filtering = false;

  // Where the project a map link points at sits in ids, or -1.
  function stopOf(ids, a){ return ids ? ids.indexOf(a.getAttribute('href').slice(1)) : -1; }

  // A link to a card the finder has hidden goes nowhere, so take it out of the
  // tab order and out of the accessibility tree. tabindex has to come first:
  // aria-hidden on something still focusable is its own failure. `inert` would
  // be tidier but it is an HTML attribute, and half of these are SVG links.
  function hideLink(el, hide){
    if(hide){ el.setAttribute('tabindex', '-1'); el.setAttribute('aria-hidden', 'true'); }
    else { el.removeAttribute('aria-hidden'); el.removeAttribute('tabindex'); }
  }

  // ids: the projects to light up, or null for "all of them, undimmed".
  function highlight(ids, numbered){
    // filtering removes the cards the dimmed nodes point at, so take those
    // nodes out of the tab order too. A route preview leaves every card there.
    var gone = !!ids && !numbered;
    nodes.forEach(function(a){
      var i = stopOf(ids, a);
      a.classList.toggle('on', i > -1);
      a.querySelector('.hstep').textContent = (numbered && i > -1) ? i + 1 : '';
      hideLink(a, gone && i < 0);
    });
    chips.forEach(function(c){
      var i = stopOf(ids, c);
      c.classList.toggle('on', i > -1);
      if(numbered && i > -1) c.dataset.step = i + 1; else delete c.dataset.step;
      hideLink(c, gone && i < 0);
    });
    document.querySelectorAll('.chiprow').forEach(function(row){
      row.hidden = gone && !row.querySelector('.chip.on');
    });
    if(svg){ svg.classList.toggle('routing', !!ids); svg.classList.toggle('filtering', gone); }
    if(chipbox){ chipbox.classList.toggle('routing', !!ids); chipbox.classList.toggle('filtering', gone); }
  }

  // Routes: hover or focus previews one, the button pins it, which is the path
  // on touch screens.
  var list = document.querySelector('.routes');
  var routes = list ? list.querySelectorAll('.route') : [];
  function show(li){
    // Hiding the route list under the cursor makes the browser fire a late
    // mouseleave. Without this guard that stray event wipes the finder's
    // highlight a frame after the finder drew it.
    if(filtering) return;
    routes.forEach(function(o){
      o.classList.toggle('on', o === li);
      o.querySelector('.rname').setAttribute('aria-pressed', String(o === pinned));
    });
    highlight(li ? li.dataset.route.split(' ') : null, true);
  }
  function unpin(){ if(pinned){ pinned = null; show(null); } }
  if(list && svg){
    var lastPointer = 'mouse';
    list.addEventListener('pointerdown', function(e){ lastPointer = e.pointerType; });
    routes.forEach(function(li){
      li.addEventListener('mouseenter', function(){ show(li); });
      li.addEventListener('focusin', function(){ show(li); });
      li.querySelectorAll('.rstops a').forEach(function(a){ a.addEventListener('click', unpin); });
      li.querySelector('.rname').addEventListener('click', function(){
        pinned = pinned === li ? null : li;
        // a mouse still hovers the route after unpinning; a finger does not
        show(pinned || (lastPointer === 'mouse' ? li : null));
        if(!pinned && lastPointer !== 'mouse') this.blur();
      });
    });
    list.addEventListener('mouseleave', function(){ show(pinned); });
    list.addEventListener('focusout', function(e){ if(!list.contains(e.relatedTarget)) show(pinned); });
  }

  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') unpin(); });

  // The finder: one field over every plate and every directory entry.
  var q = document.getElementById('q');
  if(!q) return;
  var qclear = document.getElementById('qclear');
  var qcount = document.getElementById('qcount');
  var none = document.getElementById('noresult');
  var rhead = document.querySelector('.rhead');
  var mnav = document.querySelectorAll('.mnav a');
  var skip = document.querySelector('.skip');
  var countTimer;

  function index(els){
    return [].map.call(els, function(el){
      return {el: el, text: (el.textContent + ' ' + el.id).toLowerCase().replace(/\s+/g, ' ')};
    });
  }
  var cards = index(document.querySelectorAll('.card'));
  var entries = index(document.querySelectorAll('.dgroup li'));
  var groups = document.querySelectorAll('.dgroup');
  var allSections = document.querySelectorAll('.section');

  function matches(text, terms){
    for(var i = 0; i < terms.length; i++){ if(text.indexOf(terms[i]) < 0) return false; }
    return true;
  }

  // Hides the items that do not match and returns the ones that do.
  function filter(items, terms){
    return items.filter(function(it){
      var hit = matches(it.text, terms);
      it.el.hidden = !hit;
      return hit;
    });
  }

  function run(){
    var raw = q.value.trim().toLowerCase();
    var terms = raw ? raw.split(/\s+/) : [];
    qclear.hidden = !q.value;
    r.classList.toggle('finding', !!raw);

    var shown = filter(cards, terms);
    var shownEntries = filter(entries, terms);
    groups.forEach(function(g){ g.hidden = !g.querySelector('li:not([hidden])'); });
    var first = null;
    allSections.forEach(function(sec){
      sec.hidden = !sec.querySelector('.card:not([hidden]), .dgroup:not([hidden])');
      if(!sec.hidden && !first) first = sec;
    });
    // a jump link to a section that is filtered away does nothing, so take the
    // masthead links with it and send the skip link somewhere that still exists
    mnav.forEach(function(a){
      var target = document.getElementById(a.getAttribute('href').slice(1));
      a.hidden = !!(target && target.hidden);
    });
    if(skip) skip.setAttribute('href', '#' + (first ? first.id : 'noresult'));

    // The routes walk through plates, so they only make sense on the whole page.
    // Unpin before locking them out, or the route is left reading pressed when
    // it is not.
    filtering = false;
    if(raw) unpin();
    filtering = !!raw;
    if(list) list.hidden = !!raw;
    if(rhead) rhead.hidden = !!raw;

    highlight(raw ? shown.map(function(c){ return c.el.id; }) : null, false);
    none.hidden = !raw || shown.length > 0 || shownEntries.length > 0;
    // the count is a live region, so let typing settle before it is announced
    clearTimeout(countTimer);
    if(!raw) qcount.textContent = '';
    else countTimer = setTimeout(function(){
      qcount.textContent = shown.length + ' of ' + cards.length + ' projects, '
        + shownEntries.length + ' of ' + entries.length + ' directory entries';
    }, 300);
  }

  function clearQ(){ q.value = ''; run(); q.focus(); }

  q.addEventListener('input', run);
  qclear.addEventListener('click', clearQ);
  document.getElementById('noclear').addEventListener('click', clearQ);
  q.addEventListener('keydown', function(e){ if(e.key === 'Escape' && q.value){ e.stopPropagation(); clearQ(); } });
  // a reload, or a step back through history, can keep what was typed
  window.addEventListener('pageshow', run);
  r.classList.add('finder-on');
  run();
})();
