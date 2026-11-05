
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
  var directoryEntries = document.getElementById('directory-index')?.content.querySelectorAll('.dgroup li') || [];
  var n = {card: document.querySelectorAll('.card').length, entry: directoryEntries.length};
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

  var svg = document.querySelector('.hsvg');
  var chipbox = document.querySelector('.mapchips');
  var nodes = svg ? svg.querySelectorAll('.hnode') : [];
  var chips = chipbox ? chipbox.querySelectorAll('.chip') : [];
  var pinned = null;

  // Where the project a map link points at sits in ids, or -1.
  function stopOf(ids, a){ return ids ? ids.indexOf((a.dataset.project || a.getAttribute('href').slice(1))) : -1; }

  // ids: the projects to light up, or null for "all of them, undimmed".
  function highlight(ids){
    nodes.forEach(function(a){
      var i = stopOf(ids, a);
      a.classList.toggle('on', i > -1);
      a.querySelector('.hstep').textContent = (i > -1) ? i + 1 : '';
    });
    chips.forEach(function(c){
      var i = stopOf(ids, c);
      c.classList.toggle('on', i > -1);
      if(i > -1) c.dataset.step = i + 1; else delete c.dataset.step;
    });
    if(svg) svg.classList.toggle('routing', !!ids);
    if(chipbox) chipbox.classList.toggle('routing', !!ids);
  }

  // Routes: hover or focus previews one, the button pins it, which is the path
  // on touch screens.
  var list = document.querySelector('.routes');
  var routes = list ? list.querySelectorAll('.route') : [];
  function show(li){
    routes.forEach(function(o){
      o.classList.toggle('on', o === li);
      o.querySelector('.rname').setAttribute('aria-pressed', String(o === pinned));
    });
    highlight(li ? li.dataset.route.split(' ') : null);
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

  // Search destinations without hiding the catalogue or its navigation.
  var q = document.getElementById('q');
  if(!q) return;
  var qclear = document.getElementById('qclear');
  var qcount = document.getElementById('qcount');
  var none = document.getElementById('noresult');
  var countTimer;

  function index(els){
    return [].map.call(els, function(el){
      return {el: el, text: (el.textContent + ' ' + el.id).toLowerCase().replace(/\s+/g, ' ')};
    });
  }
  var cards = index(document.querySelectorAll('.card'));
  var entries = index(directoryEntries);
  entries.forEach(function(item) { item.el.querySelectorAll("[data-family]").forEach(function(link) { link.href = dashhq.href(link.dataset.family, link.dataset.path || "/"); }); });

  function matches(text, terms){
    for(var i = 0; i < terms.length; i++){ if(text.indexOf(terms[i]) < 0) return false; }
    return true;
  }

  function run(){
    var raw = q.value.trim();
    var text = raw.toLowerCase();
    var terms = text.split(/\s+/).filter(function(term){ return !/^(what|is|the|a|an|how|do|i|my|to|on|does|work|works)$/.test(term); });
    qclear.hidden = !raw;
    var results = document.getElementById('find-results');
    results.replaceChildren();
    var destinations = raw ? cards.concat(entries).filter(function(it){ return matches(it.text, terms); }).map(function(it){
      var a = it.el.querySelector('.cname a, a');
      var title = a.textContent.trim();
      return {title:title, href:a.href, score:title.toLowerCase() === text ? 100 : a.dataset.family ? 10 : 0};
    }).sort(function(a,b){ return b.score - a.score; }) : [];
    if (/platform|identity|identities|username|learn|beginner/.test(text)) destinations.unshift({title:'What is Platform? A plain-language walkthrough', href:dashhq.href('arch', '/')});
    if (/masternode|evonode|my node/.test(text)) destinations.unshift({title:'Find your masternode in Radar', href:dashhq.href('radar', '/masternodes')});
    if (/^[a-f0-9]{64}$/i.test(raw)) destinations.unshift({title:'Inspect this masternode in Radar', href:dashhq.href('radar', '/mn/' + raw)});
    else if (/^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/.test(raw)) destinations.unshift({title:'Find this IP in Radar', href:dashhq.href('radar', '/masternodes?q=' + encodeURIComponent(raw))});
    else if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(raw)) destinations.unshift({title:'Look up this Platform ID in Explorer', href:dashhq.href('explorer', '/search/?q=' + encodeURIComponent(raw))});
    else if (/^[a-z0-9-]+\.dash$/i.test(raw)) destinations.unshift({title:'Check ' + raw + ' in Explorer', href:dashhq.href('explorer', '/dpns/?name=' + encodeURIComponent(raw))});
    var unique = destinations.filter(function(item, index, all){ return all.findIndex(function(other){return other.href === item.href;}) === index; });
    unique.slice(0,8).forEach(function(item){
      var row = document.createElement('li');
      var link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.title + ' →';
      row.append(link); results.append(row);
    });
    results.hidden = !raw || !unique.length;
    none.hidden = !raw || unique.length > 0;
    clearTimeout(countTimer);
    qcount.textContent = '';
    if(raw) countTimer = setTimeout(function(){ qcount.textContent = unique.length + ' destinations' + (unique.length > 8 ? '; showing the first 8' : ''); }, 300);
  }
  function revealHash(){
    var target = document.getElementById(location.hash.slice(1));
    var fold = target && target.closest('details');
    while(fold){ fold.open = true; fold = fold.parentElement.closest("details"); }
  }
  addEventListener('hashchange', revealHash);
  document.addEventListener('click', function(event){
    var a = event.target.closest('a[href^="#"]');
    if(!a) return;
    var target = document.getElementById(a.hash.slice(1));
    var fold = target && target.closest('details');
    while(fold){ fold.open = true; fold = fold.parentElement.closest("details"); }
  });
  revealHash();

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
