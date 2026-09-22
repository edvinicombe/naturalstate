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
      }
    }
  }
});
