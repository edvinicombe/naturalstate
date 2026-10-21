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
});
