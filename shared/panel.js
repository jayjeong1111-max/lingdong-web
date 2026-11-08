// Tiny parameter panel shared by all three pages.
// makePanel({ title, groups:[{ name, hint?, when?, items:[{ key, label, type, ... }] }], values, onChange, actions })
//   item types: range {min,max,step,fmt?} · select {options:[[value,label]...]} · check · color · text
(function () {
  const css = `
  .pp-toggle{position:fixed;top:14px;right:14px;z-index:1001;font:13px/1 "Noto Serif KR",serif;background:rgba(246,241,223,.92);
    color:#2a2622;border:1px solid #2a2622;padding:8px 12px;cursor:pointer;transition:background .2s,color .2s,transform .15s}
  .pp-toggle:hover{background:#2a2622;color:#f6f1df}.pp-toggle:active{transform:scale(.97)}
  .pp{position:fixed;top:0;right:0;bottom:0;z-index:1000;width:min(330px,100vw);background:rgba(246,241,223,.96);
    backdrop-filter:blur(6px);border-left:1px solid #d9cdb6;padding:58px 18px 24px;overflow-y:auto;
    font:13px/1.5 "Noto Serif KR",serif;color:#2a2622;transform:translateX(100%);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
  .pp.open{transform:none}
  .pp h3{font-size:15px;font-weight:500;margin:0 0 14px}
  .pp fieldset{border:0;border-top:1px solid #d9cdb6;margin:0 0 6px;padding:12px 0 6px}
  .pp legend{font-size:12px;letter-spacing:.08em;color:#a8321e;padding-right:8px}
  .pp .hint{font-size:11.5px;color:#7a6f62;margin:-2px 0 8px}
  .pp label{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;margin:7px 0}
  .pp label.full{grid-template-columns:1fr}
  .pp output{font-variant-numeric:tabular-nums;color:#7a6f62;font-size:12px;min-width:3em;text-align:right}
  .pp input[type=range]{grid-column:1/-1;width:100%;accent-color:#a8321e;margin:0}
  .pp select,.pp input[type=text]{font:inherit;font-size:12.5px;background:#fffaf0;border:1px solid #cdbfa6;padding:4px 6px;color:#2a2622;max-width:160px}
  .pp input[type=color]{width:42px;height:24px;border:1px solid #cdbfa6;background:none;padding:0}
  .pp input[type=checkbox]{accent-color:#a8321e;width:16px;height:16px}
  .pp .acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;position:sticky;bottom:-24px;background:rgba(246,241,223,.96);padding:10px 0 14px}
  .pp .acts button{font:inherit;font-size:12.5px;background:#fffaf0;border:1px solid #2a2622;color:#2a2622;padding:7px 10px;cursor:pointer}
  .pp .acts button.primary{background:#2a2622;color:#f6f1df}
  .pp .acts button:hover{background:#a8321e;border-color:#a8321e;color:#fff}
  .pp .busy{font-size:12px;color:#a8321e;min-height:1.4em;margin-top:4px}
  .pp .credit{font-size:11px;color:#7a6f62;margin-top:16px;line-height:1.6}
  .pp .credit a{color:inherit}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  window.makePanel = function (cfg) {
    const values = Object.assign({}, cfg.values);
    const btn = document.createElement('button');
    btn.className = 'pp-toggle'; btn.textContent = '⚙ 파라미터';
    const el = document.createElement('aside'); el.className = 'pp';
    el.innerHTML = `<h3>${cfg.title || '파라미터'}</h3>`;
    document.body.append(el, btn);
    btn.onclick = () => { el.classList.toggle('open'); btn.textContent = el.classList.contains('open') ? '✕ 닫기' : '⚙ 파라미터'; };

    const inputs = {}, sets = [];
    for (const g of cfg.groups) {
      const fs = document.createElement('fieldset');
      fs.innerHTML = `<legend>${g.name}</legend>` + (g.hint ? `<div class="hint">${g.hint}</div>` : '');
      for (const it of g.items) {
        const lab = document.createElement('label');
        const v = values[it.key];
        let inp, out;
        if (it.type === 'range') {
          lab.innerHTML = `<span>${it.label}</span><output></output>`;
          inp = document.createElement('input'); inp.type = 'range';
          Object.assign(inp, { min: it.min, max: it.max, step: it.step || 'any' });
          out = lab.querySelector('output');
        } else if (it.type === 'select') {
          lab.innerHTML = `<span>${it.label}</span>`;
          inp = document.createElement('select');
          for (const [ov, ol] of it.options) { const o = document.createElement('option'); o.value = ov; o.textContent = ol; inp.appendChild(o); }
        } else if (it.type === 'check') {
          lab.innerHTML = `<span>${it.label}</span>`;
          inp = document.createElement('input'); inp.type = 'checkbox';
        } else {
          lab.innerHTML = `<span>${it.label}</span>`;
          inp = document.createElement('input'); inp.type = it.type === 'color' ? 'color' : 'text';
        }
        lab.appendChild(inp);
        const show = (val) => {
          if (it.type === 'check') inp.checked = !!val; else inp.value = val;
          if (out) out.textContent = it.fmt ? it.fmt(+val) : String(+(+val).toFixed(it.step >= 1 ? 0 : 3));
        };
        show(v);
        const read = () => it.type === 'check' ? inp.checked : it.type === 'range' ? +inp.value : it.type === 'select' && it.numeric ? +inp.value : inp.value;
        inp.addEventListener(it.type === 'range' || it.type === 'text' ? 'input' : 'change', () => {
          values[it.key] = read(); show(values[it.key]); refreshWhen();
          cfg.onChange && cfg.onChange(it.key, values[it.key], values, false);
        });
        if (it.type === 'range') inp.addEventListener('change', () => cfg.onChange && cfg.onChange(it.key, values[it.key], values, true));
        inputs[it.key] = { show, it };
        fs.appendChild(lab);
      }
      el.appendChild(fs);
      sets.push([fs, g.when]);
    }
    const refreshWhen = () => sets.forEach(([fs, w]) => { fs.style.display = !w || w(values) ? '' : 'none'; });
    refreshWhen();

    const busy = document.createElement('div'); busy.className = 'busy';
    const acts = document.createElement('div'); acts.className = 'acts';
    for (const a of cfg.actions || []) {
      const b = document.createElement('button'); b.textContent = a.label; if (a.primary) b.className = 'primary';
      b.onclick = () => a.onClick(values); acts.appendChild(b);
    }
    el.append(acts, busy);
    if (cfg.credit) { const c = document.createElement('div'); c.className = 'credit'; c.innerHTML = cfg.credit; el.appendChild(c); }

    return {
      values, el,
      set(key, val) { values[key] = val; inputs[key] && inputs[key].show(val); refreshWhen(); },
      setAll(obj) { for (const k in obj) this.set(k, obj[k]); },
      busy(msg) { busy.textContent = msg || ''; },
    };
  };

  // helpers to keep parameters in the URL (?k=v&...) so a reload or a shared link keeps them
  window.readQuery = function (defaults) {
    const q = new URLSearchParams(location.search), out = Object.assign({}, defaults);
    for (const k in defaults) if (q.has(k)) {
      const d = defaults[k], s = q.get(k);
      out[k] = typeof d === 'number' ? (isFinite(+s) ? +s : d) : typeof d === 'boolean' ? s === '1' : s;
    }
    return out;
  };
  window.writeQuery = function (values, defaults, reload) {
    const q = new URLSearchParams(location.search);
    for (const k in values) {
      const v = values[k];
      if (defaults && k in defaults && v === defaults[k] && k !== 'seed') q.delete(k);
      else q.set(k, typeof v === 'boolean' ? (v ? '1' : '0') : v);
    }
    const url = location.pathname + '?' + q.toString();
    if (reload) location.href = url; else history.replaceState(null, '', url);
  };
})();
