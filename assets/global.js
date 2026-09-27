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

  var saveBtn = document.getElementById('SaveProduct');
  if (saveBtn) {
    function setSaveState(saved) {
      saveBtn.classList.toggle('active', saved);
      saveBtn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      saveBtn.setAttribute('aria-label', saved ? 'Remove from saved' : 'Save product');
    }
    setSaveState(isSaved(saveBtn.dataset.handle));
    saveBtn.addEventListener('click', function () {
      var product = {
        handle: saveBtn.dataset.handle,
        title: saveBtn.dataset.title,
        image: saveBtn.dataset.image,
        price: saveBtn.dataset.price,
        url: saveBtn.dataset.url
      };
      setSaveState(toggleSaved(product));
    });
  }

  /* ── Saved products grid (Saved page) ── */
  var savedGrid = document.getElementById('SavedGrid');
  if (savedGrid) {
    var savedEmpty = document.getElementById('SavedEmpty');
    var savedItems = getSaved();

    if (savedItems.length === 0) {
      if (savedEmpty) savedEmpty.style.display = 'block';
    } else {
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
          btn.closest('.product-card').remove();
          if (getSaved().length === 0 && savedEmpty) savedEmpty.style.display = 'block';
        });
      });
    }
  }
});
