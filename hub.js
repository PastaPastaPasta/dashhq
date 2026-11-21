(function(){
  var root = document.documentElement;
  try {
    var oldTheme = localStorage.getItem('dashhq-theme');
    if(oldTheme === 'light' || oldTheme === 'dark') dashhq.theme.set(oldTheme);
    localStorage.removeItem('dashhq-theme');
  } catch(e) {}
  function paintChrome(){
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){
      meta.removeAttribute('media');
      meta.content = getComputedStyle(root).getPropertyValue('--dh-page').trim();
    });
  }
  document.addEventListener('dashhq-theme', paintChrome);
  paintChrome();
  var q = document.getElementById('q');
  if(!q) return;
  var qclear = document.getElementById('qclear');
  var qcount = document.getElementById('qcount');
  var results = document.getElementById('find-results');
  var countTimer;
  q.value = new URL(location.href).searchParams.get('q') || q.value;
  function termsFor(value){
    return value.toLowerCase().trim().split(/\s+/).filter(function(term){ return term && !/^(what|is|the|a|an|how|do|i|my|to|on|does|work|works)$/.test(term); });
  }
  function searchText(row){
    return (row.textContent + ' ' + row.id + ' ' + (row.dataset.search || '')).toLowerCase().replace(/\s+/g,' ');
  }
  function matches(text, terms){
    return terms.every(function(term){return text.includes(term);});
  }
  function bindFinder(run){
    function clearQ(){q.value='';run();q.focus();}
    q.addEventListener('input',run);
    qclear.addEventListener('click',clearQ);
    q.addEventListener('keydown',function(e){if(e.key==='Escape' && q.value){e.stopPropagation();clearQ();}});
    window.addEventListener('pageshow',run);
    root.classList.add('finder-on');
    run();
  }
  var directory = document.getElementById('directory');
  if(directory){
    var rows = Array.from(directory.querySelectorAll('.dgroup li')).map(function(row){return {row:row,text:searchText(row)};});
    var groups = Array.from(directory.querySelectorAll('.dgroup'));
    bindFinder(function(){
      var terms = termsFor(q.value);
      var count = 0;
      rows.forEach(function(item){item.row.hidden=!matches(item.text,terms);if(!item.row.hidden) count++;});
      groups.forEach(function(group){
        var visible = group.querySelectorAll('li:not([hidden])').length;
        group.hidden = !visible;
        group.querySelector('.group-count').textContent = visible;
        var chip = document.querySelector('.category-links a[href="#'+group.id+'"]');
        chip.hidden = !visible;
        var chipCount = chip.querySelector('b');
        if(chipCount) chipCount.textContent = visible;
      });
      qclear.hidden = !q.value;
      qcount.textContent = count ? count+' of '+rows.length+' resources' : 'No resources match. Clear the filter or try another search.';
      var url = new URL(location.href);
      if(q.value.trim()) url.searchParams.set('q',q.value);else url.searchParams.delete('q');
      if(url.href !== location.href) history.replaceState(null,'',url);
    });
    return;
  }
  var indexRows = Array.from(document.getElementById('directory-index').content.querySelectorAll('.dgroup li'));
  var rowById = new Map(indexRows.map(function(row){return [row.id,row];}));
  var eco = document.querySelector('figure.eco');
  var ecoCount = document.getElementById('eco-count');
  var chips = Array.from(eco.querySelectorAll('li[data-entry]')).map(function(chip){
    return {node:chip.querySelector('a.map-node'),entry:chip.dataset.entry,text:searchText(chip)+' '+searchText(rowById.get(chip.dataset.entry))};
  });
  var entries = indexRows.flatMap(function(row){
    return Array.from(row.querySelectorAll('.catalog-name > a')).map(function(link){
      return {title:link.textContent.replace('↗','').trim(), description:row.querySelector('.dd').textContent,
        href:linkHref(link), site:link.dataset.family, text:searchText(row), tier:row.closest('.dgroup').dataset.tier, mono:row.dataset.mono,
        links:Array.from(row.querySelectorAll('.dby a,.resource-links a')).map(function(extra){return {title:extra.textContent.trim(),href:linkHref(extra)};})};
    });
  });
  function linkHref(link){
    return link.dataset.family ? dashhq.href(link.dataset.family, link.dataset.path || '/', link.dataset.network ? {network:link.dataset.network} : undefined) : link.href;
  }
  var layers = {gov:['net','GV'], radar:['net','RA'], explorer:['platform','EX'], fees:['platform','FE'], pollr:['apps','PO'], arch:['platform','AR'], bridge:['platform','ST'], dapi:['platform','DA'], faucet:['platform','FA'], dashhq:['apps','ID']};
  function destination(title, product, path, description){
    return {title:title, href:dashhq.href(product,path), site:product, description:description, tier:layers[product][0], mono:layers[product][1]};
  }
  function run(){
    var raw = q.value.trim();
    var text = raw.toLowerCase();
    var terms = termsFor(raw);
    var chipCount = 0;
    chips.forEach(function(chip){
      var hit = terms.length > 0 && matches(chip.text,terms) && !(/^wallets?$/.test(text) && chip.entry === 'faucet');
      chip.node.classList.toggle('hit',hit);
      if(hit) chipCount++;
    });
    eco.classList.toggle('searching',!!raw);
    ecoCount.textContent = (raw ? chipCount+' of ' : '')+chips.length+' on the map';
    qclear.hidden = !raw;
    results.replaceChildren();
    var destinations = raw && terms.length ? entries.filter(function(item){return matches(item.text,terms);}).sort(function(a,b){
      return Number(b.title.toLowerCase() === text) - Number(a.title.toLowerCase() === text) || Number(matches(b.title.toLowerCase(),terms)) - Number(matches(a.title.toLowerCase(),terms));
    }) : [];
    if (/^wallets?$/.test(text)) destinations = destinations.filter(function(item){return item.site !== 'faucet';});
    if (/identity|identities|sign in|login|key|recovery phrase|passkey|wallet/.test(text)) destinations.unshift({title:'Your Dash identity', href:'/identity/',site:'dashhq',description:'Sign-ins, keys, and where each app keeps them.', tier:layers.dashhq[0], mono:layers.dashhq[1]});
    if (/platform|identity|identities|username|learn|beginner/.test(text)) destinations.unshift(destination('What is Platform?', 'arch', '/', 'A plain-language walkthrough of the data layer.'));
    if (/masternode|evonode|my node/.test(text)) destinations.unshift(destination('Find your masternode', 'radar', '/masternodes', 'Reachability, earnings and Platform health.'));
    if (/^[a-f0-9]{64}$/i.test(raw)) destinations.unshift(destination('Inspect this masternode', 'radar', '/mn/'+raw, 'Open the public ProTx record in Radar.'));
    else if (/^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/.test(raw)) destinations.unshift(destination('Find this IP', 'radar', '/masternodes?q='+encodeURIComponent(raw), 'Search Radar’s masternode list.'));
    else if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(raw)) destinations.unshift(destination('Look up this Platform ID', 'explorer', '/search?q='+encodeURIComponent(raw), 'Inspect an identity or contract in Radar Explorer.'));
    else if (/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])(?:\.dash)?$/i.test(raw)) {
      var name = text.endsWith('.dash') ? text : text+'.dash';
      var lookup = destination('Look up '+name+' in Radar Explorer', 'explorer', '/name/'+encodeURIComponent(name.slice(0,-5)), 'Check this Dash username on the selected network.');
      if(text.endsWith('.dash') || !destinations.some(function(item){return matches(item.title.toLowerCase(),terms);})) destinations.unshift(lookup);else destinations.push(lookup);
    }
    var tasks = [
      {terms:/treasury|budget|spending|funded/, title:'Treasury', product:'gov', path:'/', description:'See proposals, funding and treasury payments.'},
      {terms:/my masternode|my node|masternode vote|voting key/, title:'My masternodes', product:'gov', path:'/masternodes', description:'Review your masternodes’ governance votes.'},
      {terms:/fee|contract cost|estimate/, title:'Estimate contract fees', product:'fees', path:'/', description:'Estimate what registering a data contract costs.'},
      {terms:/name contest|contested|username vote/, title:'Name contests', product:'gov', path:'/names', description:'Inspect contested usernames and their votes.'},
      {terms:/pollr|polls?/, title:'Pollr', product:'pollr', path:'/', description:'Create a poll and collect answers on Testnet.'}
    ];
    tasks.filter(function(task){return task.terms.test(text);}).reverse().forEach(function(task){destinations.unshift(destination(task.title,task.product,task.path,task.description));});
    var seen = new Set();
    var unique = destinations.filter(function(item){
      var url = new URL(item.href,location.href);
      var key = url.origin+url.pathname.replace(/\/$/,'')+url.search+url.hash;
      if(seen.has(key)) return false;
      seen.add(key); return true;
    });
    unique.slice(0,8).forEach(function(item){
      var row = document.createElement('li');
      var link = document.createElement('a');
      link.href = item.href;
      var url = new URL(item.href,location.href);
      var external = !item.site && url.origin !== location.origin;
      var tile = document.createElement('span');tile.className='result-tile';tile.dataset.tier=item.tier;tile.textContent=item.mono;tile.setAttribute('aria-hidden','true');
      var title = document.createElement('span');title.className='result-title';title.textContent=item.title+(external?' ↗':' →');
      var site = document.createElement('span');site.className='result-site';site.textContent=item.site ? ({gov:'Governance',radar:'Radar',explorer:'Radar Explorer',fees:'Fee estimator',pollr:'Pollr',arch:'Architecture',bridge:'Bridge',dapi:'DAPI',faucet:'Faucet',dashhq:'dashhq'}[item.site] || item.site) : url.host;
      var description = document.createElement('span');description.className='result-description';description.textContent=item.description;
      link.append(tile,title,site,description);row.append(link);
      if(item.links && item.links.length){
        var extras = document.createElement('p');extras.className='resource-links dh-meta';
        item.links.forEach(function(extra){var a=document.createElement('a');a.href=extra.href;a.textContent=extra.title;extras.append(a);});
        row.append(extras);
      }
      results.append(row);
    });
    results.hidden = !raw || !unique.length;
    clearTimeout(countTimer);qcount.textContent='';
    if(raw) countTimer=setTimeout(function(){qcount.textContent=(unique.length ? unique.length+' destination'+(unique.length===1?'':'s')+(unique.length>8?'; showing the first 8':'') : 'No destinations match. Try “wallet” or “masternode”, or paste a public ID.')+(chipCount ? '; '+chipCount+' of '+chips.length+' on the map, highlighted' : '');},300);
  }
  q.addEventListener('keydown',function(e){
    if(e.key !== 'Enter' || e.isComposing || results.hidden) return;
    var first = results.querySelector('a');
    if(first){e.preventDefault();first.click();}
  });
  bindFinder(run);
})();
