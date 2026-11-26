/* Natural State Running Gear — global.js */
document.addEventListener('DOMContentLoaded', function () {

  /* ── Mobile drawer ── */
  var drawer = document.getElementById('MobileDrawer');
  document.getElementById('DrawerOpen')?.addEventListener('click', function () {
    drawer?.classList.add('open');
  });
  document.getElementById('DrawerClose')?.addEventListener('click', function () {
    drawer?.classList.remove('open');
  });
  drawer?.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { drawer.classList.remove('open'); });
  });

  /* ── Product gallery thumbs ── */
  document.querySelectorAll('.gallery__thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var src = thumb.dataset.src;
      var main = document.getElementById('GalleryMain');
      if (main && src) main.src = src;
      document.querySelectorAll('.gallery__thumb').forEach(function (t) { t.classList.remove('active'); });
      thumb.classList.add('active');
    });
  });

  /* ── Variant swatch → hidden select sync ── */
  var select = document.getElementById('VariantSelect');
  if (select) {
    document.querySelectorAll('.swatch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.swatches').querySelectorAll('.swatch').forEach(function (s) { s.classList.remove('active'); });
        btn.classList.add('active');
        syncVariant();
      });
    });

    function syncVariant() {
      var values = [];
      document.querySelectorAll('.swatches').forEach(function (group) {
        var active = group.querySelector('.swatch.active');
        if (active) values.push(active.dataset.value);
      });
      var label = values.join(' / ');
      var matched = Array.from(select.options).find(function (o) { return o.text.includes(label); });
      if (matched) {
        select.value = matched.value;
        var avail = !matched.disabled;
        var btn = document.getElementById('AddToCart');
        if (btn) {
          btn.disabled = !avail;
          btn.textContent = avail ? 'Add to Bag — ' + matched.dataset.price : 'Sold Out';
        }
        var saveBtn = document.getElementById('SaveProduct');
        if (saveBtn) saveBtn.dataset.price = matched.dataset.price;
      }
    }
  }

  /* ── Saved products (wishlist) ── */
  var SAVED_KEY = 'ns_saved_products';

  function getSaved() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function setSaved(items) {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function isSaved(handle) {
    return getSaved().some(function (p) { return p.handle === handle; });
  }

  function toggleSaved(product) {
    var items = getSaved();
    var idx = items.findIndex(function (p) { return p.handle === product.handle; });
    if (idx > -1) {
      items.splice(idx, 1);
    } else {
      items.push(product);
    }
    setSaved(items);
    updateSavedCount();
    return idx === -1;
  }

  function updateSavedCount() {
    var count = getSaved().length;
    document.querySelectorAll('.saved-count-badge').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    document.querySelectorAll('.saved-count-text').forEach(function (el) {
      el.textContent = count;
    });
  }

  updateSavedCount();

  /* ── Save hearts: product page + product cards ── */
  function refreshSaveButtons() {
    document.querySelectorAll('[data-save]').forEach(function (btn) {
      var saved = isSaved(btn.dataset.handle);
      var title = btn.dataset.title || 'product';
      btn.classList.toggle('active', saved);
      btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      btn.setAttribute('aria-label', (saved ? 'Remove from saved: ' : 'Save: ') + title);
    });
  }
  refreshSaveButtons();
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-save]');
    if (!btn) return;
    e.preventDefault();
    toggleSaved({
      handle: btn.dataset.handle,
      title: btn.dataset.title,
      image: btn.dataset.image,
      price: btn.dataset.price,
      url: btn.dataset.url
    });
    refreshSaveButtons();
  });

  /* ── Quick add to bag (product cards) ── */
  var ICON_PLUS = '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
  var ICON_CHECK = '<path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.hidden = count < 1;
    });
    document.querySelectorAll('[data-cart-count-text]').forEach(function (el) { el.textContent = count; });
    document.querySelectorAll('[data-cart-link]').forEach(function (a) {
      a.setAttribute('aria-label', 'Cart (' + count + ' items)');
    });
  }

  function closeQuickAdd(except) {
    document.querySelectorAll('.product-card.is-picking').forEach(function (card) {
      if (card === except) return;
      card.classList.remove('is-picking');
      var toggle = card.querySelector('[data-quick-add-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function quickAdd(trigger) {
    var card = trigger.closest('[data-product-card]');
    var wrap = trigger.closest('.quick-add');
    if (!card || !wrap || wrap.classList.contains('is-busy')) return;
    var main = wrap.querySelector('.quick-add__btn');
    var label = main.querySelector('.quick-add__label');
    var icon = main.querySelector('.quick-add__icon');
    var status = wrap.querySelector('[data-quick-add-status]');

    function reset(delay) {
      setTimeout(function () {
        main.disabled = false;
        wrap.classList.remove('is-busy');
        if (label) label.textContent = 'Quick add';
        if (icon) icon.innerHTML = ICON_PLUS;
      }, delay);
    }

    wrap.classList.add('is-busy');
    main.disabled = true;
    if (label) label.textContent = 'Adding…';

    fetch(wrap.dataset.addUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: [{ id: Number(trigger.dataset.variantId), quantity: 1 }] })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (r) {
        if (!r.ok) throw new Error((r.data && (r.data.description || r.data.message)) || 'Could not add to bag');
        return fetch(wrap.dataset.cartUrl, { headers: { 'Accept': 'application/json' } })
          .then(function (res) { return res.json(); });
      })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        closeQuickAdd();
        if (label) label.textContent = 'Added';
        if (icon) icon.innerHTML = ICON_CHECK;
        if (status) status.textContent = 'Added to bag';
        reset(2000);
      })
      .catch(function (err) {
        if (label) label.textContent = 'Try again';
        if (status) status.textContent = err.message;
        reset(3000);
      });
  }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-quick-add]');
    if (add) { e.preventDefault(); quickAdd(add); return; }

    var toggle = e.target.closest('[data-quick-add-toggle]');
    if (toggle) {
      var card = toggle.closest('[data-product-card]');
      var open = !card.classList.contains('is-picking');
      closeQuickAdd(card);
      card.classList.toggle('is-picking', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = card.querySelector('.quick-add__size:not(:disabled)');
        if (first) first.focus({ preventScroll: true });
      }
      return;
    }

    var close = e.target.closest('[data-quick-add-close]');
    if (close) {
      var c = close.closest('[data-product-card]');
      closeQuickAdd();
      var t = c && c.querySelector('[data-quick-add-toggle]');
      if (t) t.focus({ preventScroll: true });
      return;
    }

    if (!e.target.closest('.quick-add')) closeQuickAdd();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeQuickAdd();
  });

  /* ── Saved products drawer ── */
  var savedGrid = document.getElementById('SavedGrid');
  var savedEmpty = document.getElementById('SavedEmpty');

  function renderSavedGrid() {
    if (!savedGrid) return;
    savedGrid.innerHTML = '';
    var savedItems = getSaved();

    if (savedItems.length === 0) {
      if (savedEmpty) savedEmpty.style.display = 'block';
      return;
    }
    if (savedEmpty) savedEmpty.style.display = 'none';

    savedItems.forEach(function (p) {
      var card = document.createElement('a');
      card.href = p.url;
      card.className = 'product-card';

      var media = document.createElement('div');
      media.className = 'product-card__media';
      var img = document.createElement('img');
      img.className = 'img-primary';
      img.loading = 'lazy';
      img.src = p.image;
      img.alt = p.title;
      media.appendChild(img);
      card.appendChild(media);

      var title = document.createElement('p');
      title.className = 'product-card__title';
      title.textContent = p.title;
      card.appendChild(title);

      var price = document.createElement('p');
      price.className = 'product-card__price';
      price.textContent = p.price;
      card.appendChild(price);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'saved-remove';
      remove.dataset.handle = p.handle;
      remove.setAttribute('aria-label', 'Remove from saved');
      remove.textContent = 'Remove';
      card.appendChild(remove);

      savedGrid.appendChild(card);
    });

    savedGrid.querySelectorAll('.saved-remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setSaved(getSaved().filter(function (p) { return p.handle !== btn.dataset.handle; }));
        updateSavedCount();
        refreshSaveButtons();
        btn.closest('.product-card').remove();
        if (getSaved().length === 0 && savedEmpty) savedEmpty.style.display = 'block';
      });
    });
  }

  renderSavedGrid();

  var savedDrawer = document.getElementById('SavedDrawer');
  function openSavedDrawer() {
    renderSavedGrid();
    savedDrawer?.classList.add('open');
  }
  document.getElementById('SavedOpen')?.addEventListener('click', openSavedDrawer);
  document.getElementById('SavedOpenMobile')?.addEventListener('click', function () {
    drawer?.classList.remove('open');
    openSavedDrawer();
  });
  document.getElementById('SavedDrawerClose')?.addEventListener('click', function () {
    savedDrawer?.classList.remove('open');
  });

  /* ── Shipping destination: remember the choice and pre-fill the checkout country ── */
  var SHIP_KEY = 'ns_ship_to';
  var shipSelect = document.querySelector('[data-ship-to-select]');

  function applyShipTo(name) {
    document.querySelectorAll('form[action$="/cart"]').forEach(function (form) {
      if (!form.querySelector('[name="checkout"]')) return;
      var input = form.querySelector('input[name="checkout[shipping_address][country]"]');
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'checkout[shipping_address][country]';
        form.appendChild(input);
      }
      input.value = name;
    });
    document.querySelectorAll('[data-ship-to-label]').forEach(function (el) { el.textContent = name; });
    document.querySelectorAll('[data-ship-to-note]').forEach(function (el) { el.hidden = !name; });
  }

  if (shipSelect) {
    var storedShip = null;
    try { storedShip = localStorage.getItem(SHIP_KEY); } catch (e) {}
    if (storedShip) {
      var match = Array.from(shipSelect.options).find(function (o) { return o.value === storedShip; });
      if (match) shipSelect.value = storedShip;
    }
    var chosen = shipSelect.options[shipSelect.selectedIndex];
    if (chosen) applyShipTo(chosen.dataset.name || chosen.text);
    shipSelect.addEventListener('change', function () {
      var opt = shipSelect.options[shipSelect.selectedIndex];
      try { localStorage.setItem(SHIP_KEY, shipSelect.value); } catch (e) {}
      applyShipTo(opt.dataset.name || opt.text);
    });
  }

  /* ── Footer country selector: submit on change ── */
  document.querySelectorAll('[data-localization-select]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      var form = sel.closest('form');
      if (form) form.submit();
    });
  });

  /* ── Reviews: side panel ── */
  var reviewPanel = document.getElementById('ReviewPanel');
  var reviewLastFocus = null;

  function openReviewPanel() {
    if (!reviewPanel) return;
    reviewLastFocus = document.activeElement;
    reviewPanel.classList.add('is-open');
    reviewPanel.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
    setTimeout(function () {
      var first = reviewPanel.querySelector('input:not([type=hidden]), select, textarea') ||
                  reviewPanel.querySelector('[data-review-close]');
      if (first) first.focus({ preventScroll: true });
    }, 60);
  }

  function closeReviewPanel() {
    if (!reviewPanel) return;
    reviewPanel.classList.remove('is-open');
    reviewPanel.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    if (reviewLastFocus && reviewLastFocus.focus) reviewLastFocus.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-review-open]').forEach(function (btn) {
    btn.addEventListener('click', openReviewPanel);
  });
  document.querySelectorAll('[data-review-close]').forEach(function (el) {
    el.addEventListener('click', closeReviewPanel);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && reviewPanel && reviewPanel.classList.contains('is-open')) closeReviewPanel();
  });
  if (reviewPanel && reviewPanel.dataset.openOnLoad === 'true') openReviewPanel();

  /* ── Our mission: scroll rail controls ── */
  document.querySelectorAll('[data-rail-wrap]').forEach(function (wrap) {
    var rail = wrap.querySelector('[data-rail]');
    var prev = wrap.querySelector('[data-rail-prev]');
    var next = wrap.querySelector('[data-rail-next]');
    var bar = wrap.querySelector('[data-rail-progress]');
    if (!rail) return;

    function step() {
      var tile = rail.querySelector('li');
      return tile ? tile.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
    }
    function update() {
      var max = rail.scrollWidth - rail.clientWidth;
      var pos = max > 0 ? rail.scrollLeft / max : 1;
      if (bar) bar.style.width = Math.max(rail.clientWidth / rail.scrollWidth, pos) * 100 + '%';
      if (prev) prev.disabled = rail.scrollLeft <= 1;
      if (next) next.disabled = rail.scrollLeft >= max - 1;
    }
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ── Quality showcase: hotspots ── */
  document.querySelectorAll('[data-hotspots]').forEach(function (stage) {
    var spots = stage.querySelectorAll('.hotspot');
    function closeAll(except) {
      spots.forEach(function (s) {
        if (s === except) return;
        s.classList.remove('is-open');
        var d = s.querySelector('.hotspot__dot');
        if (d) d.setAttribute('aria-expanded', 'false');
      });
    }
    spots.forEach(function (spot) {
      var dot = spot.querySelector('.hotspot__dot');
      if (!dot) return;
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !spot.classList.contains('is-open');
        closeAll(spot);
        spot.classList.toggle('is-open', open);
        dot.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) { if (!stage.contains(e.target)) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  });

  /* ── Announcement marquee: constant speed in px/s whatever the screen or message length ── */
  document.querySelectorAll('[data-marquee-speed]').forEach(function (bar) {
    var speed = parseFloat(bar.getAttribute('data-marquee-speed')) || 22;
    var track = bar.querySelector('.announcement-bar__track');
    var group = bar.querySelector('.announcement-bar__group');
    if (!track || !group) return;
    function setSpeed() {
      var w = group.getBoundingClientRect().width;
      if (w) track.style.animationDuration = (w / speed) + 's';
    }
    setSpeed();
    window.addEventListener('resize', setSpeed);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setSpeed);
  });

  /* ── Hero background video: play/pause, and no autoplay for reduced motion ── */
  document.querySelectorAll('[data-hero-video]').forEach(function (video) {
    var btn = video.parentElement.querySelector('[data-hero-video-toggle]');
    function sync() {
      if (!btn) return;
      var paused = video.paused;
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.removeAttribute('autoplay');
      video.pause();
    }
    // Demo clips play one after another with a short fade between them
    var playlist = (video.getAttribute('data-playlist') || '').split(',').filter(Boolean);
    if (playlist.length > 1) {
      var clip = 0;
      video.style.transition = 'opacity 0.5s ease';
      video.addEventListener('ended', function () {
        clip = (clip + 1) % playlist.length;
        video.style.opacity = '0';
        setTimeout(function () {
          video.src = playlist[clip];
          var p = video.play(); if (p && p.catch) p.catch(function () {});
        }, 500);
      });
      video.addEventListener('playing', function () { video.style.opacity = '1'; });
    }
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    if (btn) btn.addEventListener('click', function () {
      if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else { video.pause(); }
    });
    sync();
  });

  /* ── Hero: background eases into a blur as the page scrolls ── */
  var heroReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.hero').forEach(function (hero) {
    var bg = hero.querySelector('.hero__bg');
    if (!bg || heroReduce) return;
    var MAX_BLUR = 20;      // px at full scroll
    var MAX_SCALE = 0.1;    // grows a little so blurred edges never show
    var current = 0, target = 0, raf = 0;

    function paint() {
      bg.style.setProperty('--hero-blur', (current * MAX_BLUR).toFixed(2) + 'px');
      bg.style.setProperty('--hero-scale', (1 + current * MAX_SCALE).toFixed(4));
    }
    function tick() {
      current += (target - current) * 0.1;    // easing factor: higher = quicker catch-up
      if (Math.abs(target - current) < 0.001) current = target;
      paint();
      raf = current === target ? 0 : requestAnimationFrame(tick);
    }
    function onScroll() {
      var range = hero.offsetHeight * 0.7;
      target = Math.min(Math.max(window.scrollY / range, 0), 1);
      if (!raf) raf = requestAnimationFrame(tick);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  });

  /* ── Mission story: pinned stage; backgrounds and words are scrubbed directly by scroll position ── */
  document.querySelectorAll('[data-story]').forEach(function (sec) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stateEls = sec.querySelectorAll('[data-story-state]');
    var dots = sec.querySelectorAll('[data-story-dot]');
    if (reduce || stateEls.length < 2) return;

    function clamp(v) { return Math.min(Math.max(v, 0), 1); }

    // Split each headline into word spans (kept in line order) so words can reveal one by one
    function splitWords(el) {
      var words = [], line = 0, frag = document.createDocumentFragment();
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'mstory__w';
            w.textContent = part;
            frag.appendChild(w);
            words.push({ el: w, line: line });
          });
        } else if (node.nodeName === 'BR') {
          frag.appendChild(node.cloneNode());
          line++;
        }
      });
      el.textContent = '';
      el.appendChild(frag);
      return words;
    }

    var STAGGER = 35;      // ms between words
    var BASE = 150;        // ms before the first word, so the background leads
    var states = Array.prototype.map.call(stateEls, function (el) {
      var text = el.querySelector('.mstory__text');
      var words = text ? splitWords(text) : [];
      var last = 0;                        // a short beat between lines of one headline
      words.forEach(function (w, k) { w.pos = k + w.line * 2; last = Math.max(last, w.pos); });
      // supporting text and the button follow the headline in the same sequence
      ['.mstory__body', '.mstory__cta'].forEach(function (sel) {
        var extra = el.querySelector(sel);
        if (extra) { last += 3; words.push({ el: extra, pos: last }); }
      });
      var label = el.querySelector('.mstory__label');
      if (label) { label.classList.add('mstory__r'); label.style.setProperty('--d', BASE + 'ms'); }
      // every item gets a fixed delay; the whole slide always plays out in full, whatever the scroll speed
      words.forEach(function (w) {
        w.el.classList.add('mstory__r');
        w.el.style.setProperty('--d', (BASE + w.pos * STAGGER) + 'ms');
      });
      return { el: el, img: el.querySelector('.mstory__img') };
    });

    sec.setAttribute('data-ready', '');
    var current = -2, ticking = false;

    function update() {
      ticking = false;
      var r = sec.getBoundingClientRect();
      var dist = r.height - window.innerHeight;
      var hold = (parseFloat(sec.getAttribute('data-hold')) || 0) / 100 * window.innerHeight;   // extra scroll spent on the last slide
      var travel = dist - hold;
      var p = travel > 0 ? clamp(-r.top / travel) : 0;
      var x = p * states.length;           // 0 .. n, one unit per slide
      var raw = x + 0.12;                  // a slide takes over slightly before its boundary
      var idx = Math.min(states.length - 1, Math.floor(raw));

      // the first slide's words start once the section scrolls into view
      if (r.top > window.innerHeight * 0.35) idx = -1;

      // hysteresis so hovering on a boundary doesn't flicker
      if (current >= 0 && idx !== current && idx >= 0 && Math.abs(raw - (current + 0.5)) < 0.5 + 0.04) idx = current;

      states.forEach(function (s, i) {
        if (s.img) s.img.style.transform = 'scale(' + (1.12 - 0.12 * clamp((x - i + 0.25) / 1.25)).toFixed(4) + ')';
      });

      if (idx === current) return;
      current = idx;
      stateEls.forEach(function (el, i) {
        el.classList.toggle('is-in', i <= Math.max(idx, 0));    // earlier slides stay underneath
        el.classList.toggle('is-active', i === idx);            // the slide whose words are showing
      });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === Math.max(idx, 0)); });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  });
});
