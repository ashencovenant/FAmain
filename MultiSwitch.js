// MultiSwitch modified by Ashencovenant
// Original post by MadeInSevilla93

(function(){
  window.SZ_MS_VER = "MS-v0.7-experimental-fixed";

  var STORAGE_KEY = "skinz_multiswitch_v1";

  // ---- helpers storage ----
  function load(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch(e){ return []; }
  }
  function save(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  function esc(s){
    s = s || "";
    return s.replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c];
    });
  }
  function normNick(s){
    s = String(s || "");
    s = s.replace(/\u00a0/g, " ");
    s = s.replace(/bienvenido\/a\s*/i, "");
    s = s.replace(/\s+/g, " ").trim();
    return s.toLowerCase();
  }

  // -- find logout WITH key (no confirm) 
  function pickLogoutUrl(){
    var a = document.getElementById('logout');
    if (a && a.href && a.href.indexOf('logout=1') > -1 && a.href.indexOf('key=') > -1) return a.href;

    var links = document.getElementsByTagName('a');
    for (var i=0; i<links.length; i++){
      var h = links[i].href || '';
      if (h.indexOf('logout=1') > -1 && h.indexOf('key=') > -1) return h;
    }
    return "";
  }

  // -- get current user mejorado (FIX: captura nombre real)
  function getCurrentUser(){
    var img = document.querySelector('#fa_usermenu img');
    var avatar = img && img.src ? img.src : "";
    var nickText = "";

    // 1. Intentar obtener el nombre desde el texto del contenedor #fa_welcome
    var w = document.getElementById('fa_welcome');
    
    if (w) {
      // Intentamos buscar el nombre dentro de negritas (común en Foroactivo)
      var boldName = w.querySelector('strong, b');
      if (boldName) {
        nickText = boldName.textContent;
      } else {
        // Fallback: Limpiar el texto "Bienvenido/a" y comas
        nickText = w.textContent || "";
        nickText = nickText.replace(/Bienvenido\/a/i, "")
                           .replace(/,/g, "")
                           .trim();
      }
    }

    // 2. Si no hay texto o es "avatar", intentar con el ALT del icono de usuario
    if (!nickText || nickText.toLowerCase() === "avatar") {
      var nickAlt = img && img.getAttribute ? (img.getAttribute("alt") || "") : "";
      if (nickAlt && nickAlt.toLowerCase() !== "avatar") {
        nickText = nickAlt;
      }
    }

    // Limpieza final de caracteres y espacios
    nickText = String(nickText || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Si después de todo sigue siendo "avatar" o está vacío, no es un usuario válido
    if (!nickText || nickText.toLowerCase() === "avatar") return null;

    return { nick: nickText, avatar: avatar };
  }

  function isGuest(){
    return !getCurrentUser();
  }

  function isActiveAccount(nick){
    var cur = getCurrentUser();
    if (!cur || !cur.nick) return false;
    return normNick(cur.nick) === normNick(nick);
  }

  function currentIsSaved(list){
    var cur = getCurrentUser();
    if (!cur || !cur.nick) return false;
    var curNorm = normNick(cur.nick);
    for (var i=0; i<list.length; i++){
      if (normNick(list[i].nick) === curNorm) return true;
    }
    return false;
  }

  function deleteCurrentFromStorage(){
    var cur = getCurrentUser();
    if (!cur || !cur.nick) return false;
    var raw = load();
    var curNorm = normNick(cur.nick);

    for (var i=0; i<raw.length; i++){
      if (normNick(raw[i].nick) === curNorm){
        raw.splice(i, 1);
        save(raw);
        return true;
      }
    }
    return false;
  }

  // ---- prefill login 
  function prefillLogin(){
    var nick = sessionStorage.getItem("skinz_prefill_nick");
    if (!nick) return;

    var input =
      document.querySelector('input[name="username"]') ||
      document.querySelector('input#username') ||
      document.querySelector('input[name="login_username"]');

    if (input){
      input.value = nick;
      input.focus();
      sessionStorage.removeItem("skinz_prefill_nick");
    }
  }

  // ---- UI mount
  function ensureMarkup(){
    var wrap = document.getElementById('szSw');

    if (!wrap){
      wrap = document.createElement('div');
      wrap.id = 'szSw';
      wrap.innerHTML = defaultMarkup();
      document.body.appendChild(wrap);
      return wrap;
    }

    if (!wrap.firstElementChild){
      wrap.innerHTML = defaultMarkup();
    }

    if (!document.getElementById('szSwBtn')){
      var b = wrap.querySelector('button[data-role="toggle"], #szSwBtn');
      if (b && !b.id) b.id = 'szSwBtn';
      if (!b){
        var nb = document.createElement('button');
        nb.id = 'szSwBtn';
        nb.type = 'button';
        nb.title = 'Multicuentas';
        nb.innerHTML = '&#8644;';
        wrap.insertBefore(nb, wrap.firstChild);
      }
    }

    if (!document.getElementById('szSwPanel')){
      var p = document.createElement('div');
      p.id = 'szSwPanel';
      var btn = document.getElementById('szSwBtn');
      if (btn && btn.parentNode === wrap) btn.insertAdjacentElement('afterend', p);
      else wrap.appendChild(p);
      p.innerHTML = defaultPanelInner();
    } else {
      if (!document.getElementById('szSwList')){
        var body = document.getElementById('szSwBody') || document.getElementById('szSwPanel');
        var ul = document.createElement('ul');
        ul.id = 'szSwList';
        body.appendChild(ul);
      }
    }

    return wrap;
  }

  function defaultPanelInner(){
    return (
      '<div id="szSwHead">' +
        '<b>Multicuentas</b>' +
        '<div class="actions">' +
          '<button type="button" data-act="saveCurrent">Guardar cuenta</button>' +
          '<button type="button" data-act="deleteCurrent">Borrar cuenta</button>' +
          '<button type="button" data-act="close">Cerrar</button>' +
        '</div>' +
      '</div>' +
      '<div id="szSwBody">' +
        '<ul id="szSwList"></ul>' +
      '</div>'
    );
  }

  function defaultMarkup(){
    return (
      '<button id="szSwBtn" type="button" title="Multicuentas" data-role="toggle">&#8644;</button>' +
      '<div id="szSwPanel">' +
        defaultPanelInner() +
      '</div>'
    );
  }

  var wrap = ensureMarkup();
  var btn = document.getElementById('szSwBtn');
  var panel = document.getElementById('szSwPanel');
  var listEl = document.getElementById('szSwList');

  function findAction(act){
    return (wrap && wrap.querySelector) ? wrap.querySelector('[data-act="' + act + '"]') : null;
  }

  var saveBtn = findAction('saveCurrent') || document.getElementById('szSwSave');
  var delBtn  = findAction('deleteCurrent') || document.getElementById('szSwDel');

  if (isGuest()){
    if (saveBtn) saveBtn.style.display = "none";
    if (delBtn)  delBtn.style.display  = "none";
  } else {
    if (delBtn)  delBtn.style.display  = "none";
  }

  function render(){
    var guest = isGuest();
    var list = load();
    var savedNow = (!guest) && currentIsSaved(list);
    if (saveBtn) saveBtn.style.display = guest ? "none" : (savedNow ? "none" : "");
    if (delBtn)  delBtn.style.display  = guest ? "none" : (savedNow ? "" : "none");

    var activeIdx = -1;
    for (var ai = 0; ai < list.length; ai++){
      if (isActiveAccount(list[ai].nick)) { activeIdx = ai; break; }
    }

    var activeAcc = null;
    if (activeIdx > -1){
      activeAcc = list.splice(activeIdx, 1)[0];
    }

    list.sort(function(a, b){
      return String(a.nick || "").localeCompare(String(b.nick || ""), "es", { sensitivity: "base" });
    });

    if (activeAcc) list.unshift(activeAcc);

    listEl.innerHTML = "";

    if (!list.length){
      var li0 = document.createElement('li');
      li0.style.cursor = "default";
      li0.innerHTML =
        '<div class="meta">' +
          '<span class="nick">Sin cuentas guardadas</span>' +
          (guest
            ? '<span class="sub">Inicia sesión para guardar cuentas.</span>'
            : '<span class="sub">Pulsa “Guardar cuenta” para añadir la actual.</span>') +
        '</div>';
      listEl.appendChild(li0);
      return;
    }

    for (var i=0; i<list.length; i++){
      (function(acc){
        var li = document.createElement('li');
        var img = document.createElement('img');
        img.src = acc.avatar ? acc.avatar :
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23333'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%23fff'%3E%3F%3C/text%3E%3C/svg%3E";

        var meta = document.createElement('div');
        meta.className = "meta";

        if (isActiveAccount(acc.nick)){
          meta.innerHTML = '<span class="nick">' + esc(acc.nick) + '</span><span class="sub">Activa</span>';
          li.classList.add('szSw-active');
          li.style.cursor = "default";
        } else {
          meta.innerHTML = '<span class="nick">' + esc(acc.nick) + '</span><span class="sub">Cambiar cuenta</span>';
        }

        li.appendChild(img);
        li.appendChild(meta);

        li.onclick = function(){
          if (isActiveAccount(acc.nick)){
            wrap.className = wrap.className.replace("open","").trim();
            return;
          }
          sessionStorage.setItem("skinz_prefill_nick", acc.nick);
          var out = pickLogoutUrl();
          if (out) window.location.href = out;
          else window.location.href = "/login";
        };

        li.oncontextmenu = function(e){
          e.preventDefault();
          if (confirm("¿Eliminar esta cuenta?")){
            var raw = load();
            var targetNick = normNick(acc.nick);
            for (var k=0; k<raw.length; k++){
              if (normNick(raw[k].nick) === targetNick){
                raw.splice(k,1);
                break;
              }
            }
            save(raw);
            render();
          }
        };

        listEl.appendChild(li);
      })(list[i]);
    }
  }

  btn.onclick = function(e){
    if (e && e.stopPropagation) e.stopPropagation();
    var isOpen = (wrap.className.indexOf("open") > -1);
    if (isOpen) wrap.className = wrap.className.replace("open","").trim();
    else { render(); wrap.className = (wrap.className + " open").trim(); }
  };

  panel.onclick = function(e){
    if (e && e.stopPropagation) e.stopPropagation();
    var t = e.target || e.srcElement;
    if (!t || !t.getAttribute) return;
    var act = t.getAttribute("data-act");
    if (!act) return;

    if (act === "close"){
      wrap.className = wrap.className.replace("open","").trim();
      return;
    }

    if (act === "saveCurrent"){
      var cur = getCurrentUser();
      if (!cur){
        alert("No se pudo detectar el nombre de usuario o no has iniciado sesión.");
        return;
      }
      var list = load();
      var curNorm = normNick(cur.nick);
      for (var i=0; i<list.length; i++){
        if (normNick(list[i].nick) === curNorm){
          alert("Esa cuenta ya está guardada.");
          return;
        }
      }
      list.push(cur);
      save(list);
      render();
      return;
    }

    if (act === "deleteCurrent"){
      if (isGuest()) return;
      if (!confirm("¿Borrar la cuenta actual de la lista?")) return;
      deleteCurrentFromStorage();
      render();
      return;
    }
  };

  document.addEventListener("click", function(){
    wrap.className = wrap.className.replace("open","").trim();
  });

  render();
  prefillLogin();
})();
