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
  var none = document.getElementById('noresult');
  var results = document.getElementById('find-results');
  var countTimer;
  var entries = Array.from(document.getElementById('directory-index').content.querySelectorAll('.dgroup li')).flatMap(function(row){
    return Array.from(row.querySelectorAll('a')).map(function(link){
      return {title:link.textContent.replace('↗','').trim(), description:row.querySelector('.dd').textContent,
        href:link.dataset.family ? dashhq.href(link.dataset.family, link.dataset.path || '/', link.dataset.network ? {network:link.dataset.network} : undefined) : link.href,
        site:link.dataset.family, text:(row.textContent + ' ' + row.id + ' ' + (row.dataset.search || '')).toLowerCase().replace(/\s+/g,' ')};
    });
  });
  function destination(title, product, path, description){
    return {title:title, href:dashhq.href(product,path), site:product, description:description};
  }
  function run(){
    var raw = q.value.trim();
    var text = raw.toLowerCase();
    var terms = text.split(/\s+/).filter(function(term){ return !/^(what|is|the|a|an|how|do|i|my|to|on|does|work|works)$/.test(term); });
    qclear.hidden = !raw;
    results.replaceChildren();
    var destinations = raw && terms.length ? entries.filter(function(item){return terms.every(function(term){return item.text.includes(term);});}).sort(function(a,b){
      return Number(b.title.toLowerCase() === text) - Number(a.title.toLowerCase() === text);
    }) : [];
    if (/identity|identities|sign in|login|key|recovery phrase|passkey|wallet/.test(text)) destinations.unshift({title:'Your Dash identity', href:'/identity/',site:'dashhq',description:'Sign-ins, keys, and where each app keeps them.'});
    if (/platform|identity|identities|username|learn|beginner/.test(text)) destinations.unshift(destination('What is Platform?', 'arch', '/', 'A plain-language walkthrough of the data layer.'));
    if (/masternode|evonode|my node/.test(text)) destinations.unshift(destination('Find your masternode', 'radar', '/masternodes', 'Reachability, earnings and Platform health.'));
    if (/^[a-f0-9]{64}$/i.test(raw)) destinations.unshift(destination('Inspect this masternode', 'radar', '/mn/'+raw, 'Open the public ProTx record in Radar.'));
    else if (/^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/.test(raw)) destinations.unshift(destination('Find this IP', 'radar', '/masternodes?q='+encodeURIComponent(raw), 'Search Radar’s masternode list.'));
    else if (/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(raw)) destinations.unshift(destination('Look up this Platform ID', 'explorer', '/search/?q='+encodeURIComponent(raw), 'Inspect an identity or contract in Explorer.'));
    else if (/^[a-z0-9-]+\.dash$/i.test(raw)) destinations.unshift(destination('Check '+raw, 'explorer', '/dpns/?name='+encodeURIComponent(raw), 'Look up the registered Dash username.'));
    var tasks = [
      {terms:/treasury|budget|spending|funded/, title:'Treasury', product:'gov', path:'/treasury', description:'See proposals, funding and treasury payments.'},
      {terms:/my masternode|my node|masternode vote|voting key/, title:'My masternodes', product:'gov', path:'/masternodes', description:'Review your masternodes’ governance votes.'},
      {terms:/fee|contract cost|estimate/, title:'Estimate contract fees', product:'explorer', path:'/tools/fees/', description:'Estimate registration and operating costs in Explorer.'},
      {terms:/name contest|contested|username vote/, title:'Name contests', product:'gov', path:'/names', description:'Inspect contested usernames and their votes.'},
      {terms:/pollr|polls?/, title:'Polls in Governance', product:'gov', path:'/polls', description:'Read and answer community polls.'}
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
      var title = document.createElement('span');title.className='result-title';title.textContent=item.title+(external?' ↗':' →');
      var site = document.createElement('span');site.className='result-site';site.textContent=item.site ? ({gov:'Governance',radar:'Radar',explorer:'Explorer',arch:'Architecture',bridge:'Bridge',dapi:'DAPI',faucet:'Faucet',dashhq:'dashhq'}[item.site] || item.site) : url.host;
      var description = document.createElement('span');description.className='result-description';description.textContent=item.description;
      link.append(title,site,description);row.append(link);results.append(row);
    });
    results.hidden = !raw || !unique.length;
    none.hidden = !raw || unique.length > 0;
    clearTimeout(countTimer);qcount.textContent='';
    if(raw) countTimer=setTimeout(function(){qcount.textContent=unique.length+' destination'+(unique.length===1?'':'s')+(unique.length>8?'; showing the first 8':'');},300);
  }
  function clearQ(){q.value='';run();q.focus();}
  q.addEventListener('input',run);
  qclear.addEventListener('click',clearQ);
  document.getElementById('noclear').addEventListener('click',clearQ);
  q.addEventListener('keydown',function(e){if(e.key==='Escape' && q.value){e.stopPropagation();clearQ();}});
  window.addEventListener('pageshow',run);
  root.classList.add('finder-on');
  run();
})();
