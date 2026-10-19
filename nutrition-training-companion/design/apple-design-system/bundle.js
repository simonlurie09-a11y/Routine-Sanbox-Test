/* @ds-bundle: {"format":4,"namespace":"AppleDS","components":[{"name":"ThemedText"},{"name":"Icon"},{"name":"Avatar"},{"name":"Button"},{"name":"Chip"},{"name":"Input"},{"name":"OtpInput"},{"name":"Card"},{"name":"StatGauge"},{"name":"StatusBadge"},{"name":"RatingStars"},{"name":"EmptyState"},{"name":"Toast"},{"name":"Alert"},{"name":"Sheet"},{"name":"AppHeader"},{"name":"TabBar"},{"name":"NotificationBell"}]} */
/* Apple Design System — hand-written from references/components.md of
   rukkiecodes/claude-apple-design-system @ a7dc950 (MIT). Every size, radius, weight and
   colour below is a token; nothing here declares a value of its own. No shadows anywhere. */
(function () {
  'use strict';

  var React = window.React;
  var h = React.createElement;

  /* ---------------------------------------------------------------- helpers */

  var WEIGHT = { regular: 400, semiBold: 600, bold: 700 };
  var SIZES = [
    'heroDisplay',
    'title1',
    'title2',
    'title3',
    'headline',
    'body',
    'callout',
    'caption',
    'micro'
  ];

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i]) out.push(arguments[i]);
    }
    return out.join(' ');
  }

  function token(name) {
    return name ? 'var(--' + name + ')' : undefined;
  }

  /* ------------------------------------------------------------- ThemedText */
  /* The only text primitive: size comes from a type-style class, weight from the
     ladder (400 / 600 / 700 — never 500), colour from a token. */

  function ThemedText(props) {
    var p = props || {};
    var size = SIZES.indexOf(p.size) === -1 ? 'body' : p.size;
    var font = WEIGHT[p.font] ? p.font : 'regular';
    var style = { fontWeight: WEIGHT[font], color: token(p.color || 'ink') };
    if (p.opacity != null) style.opacity = p.opacity;
    if (p.align) style.textAlign = p.align;
    if (p.tabular) style.fontVariantNumeric = 'tabular-nums';
    if (p.style) {
      for (var k in p.style) style[k] = p.style[k];
    }
    return h(
      p.as || 'span',
      { className: cx('ads-text', size, p.className), style: style },
      p.children
    );
  }

  /* -------------------------------------------------------------------- Icon */
  /* The source names every icon as an SF Symbol string and renders it through one
     component. SF Symbols are Apple's and are not in the repository, so these are plain
     geometric stand-ins drawn from the radius-free primitives — see the Icon README. */

  var GLYPH = {
    'chevron.left': ['M15 5l-7 7 7 7'],
    'chevron.right': ['M9 5l7 7-7 7'],
    'chevron.down': ['M5 9l7 7 7-7'],
    magnifyingglass: ['M16.5 16.5L21 21', 'M11 17a6 6 0 100-12 6 6 0 000 12z'],
    envelope: ['M3.5 6.5h17v11h-17z', 'M4 7.5l8 5.5 8-5.5'],
    bell: ['M6.5 16.5V11a5.5 5.5 0 1111 0v5.5l1.5 2h-14z', 'M10 20.5a2.2 2.2 0 004 0'],
    gearshape: [
      'M12 15a3 3 0 100-6 3 3 0 000 6z',
      'M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18'
    ],
    star: ['M12 4.5l2.3 4.9 5.2.7-3.8 3.6 1 5.2-4.7-2.6-4.7 2.6 1-5.2L4.5 10.1l5.2-.7z'],
    house: ['M4 11l8-6 8 6v8.5h-5.5V14h-5v5.5H4z'],
    checkmark: ['M5 12.5l4.5 4.5L19 7.5'],
    plus: ['M12 5v14M5 12h14'],
    xmark: ['M6 6l12 12M18 6L6 18'],
    paperclip: ['M15.5 7.5l-6.2 6.2a2.6 2.6 0 103.7 3.7l6.2-6.2a4.5 4.5 0 10-6.4-6.4L6 11.3'],
    ellipsis: ['M6.5 12h.01M12 12h.01M17.5 12h.01'],
    'line.3.horizontal.decrease': ['M4 7h16M7 12h10M10 17h4']
  };

  var FILLED = {
    'star.fill': 'star',
    'checkmark.seal.fill': 'seal',
    'circle.fill': 'circle'
  };

  function Icon(props) {
    var p = props || {};
    var size = p.size || 20;
    var common = {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.6,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
      focusable: 'false',
      style: { color: token(p.color), flex: 'none', display: 'block' },
      className: p.className
    };

    if (p.name === 'star.fill') {
      return h(
        'svg',
        common,
        h('path', { d: GLYPH.star[0], fill: 'currentColor', stroke: 'none' })
      );
    }
    if (p.name === 'checkmark.seal.fill') {
      return h(
        'svg',
        common,
        h('circle', { cx: 12, cy: 12, r: 9, fill: 'currentColor', stroke: 'none' }),
        h('path', { d: 'M8 12.3l2.7 2.7L16 9.6', stroke: token('canvas'), strokeWidth: 2 })
      );
    }
    if (p.name === 'circle.fill') {
      return h('svg', common, h('circle', { cx: 12, cy: 12, r: 5, fill: 'currentColor', stroke: 'none' }));
    }

    var paths = GLYPH[p.name];
    if (!paths) {
      /* No glyph mapped: an outlined slot, never a guessed symbol. */
      return h(
        'svg',
        common,
        h('rect', { x: 4, y: 4, width: 16, height: 16, rx: 5 }),
        h('path', { d: 'M12 12h.01' })
      );
    }
    return h(
      'svg',
      common,
      paths.map(function (d, i) {
        return h('path', { key: i, d: d });
      })
    );
  }

  /* ------------------------------------------------------------------ Avatar */

  function Avatar(props) {
    var p = props || {};
    var size = p.size || 48;
    var initial = (p.name || '').trim().charAt(0).toUpperCase();
    return h(
      'span',
      {
        className: cx('ads-avatar', p.className),
        style: { width: size, height: size, fontSize: Math.round(size * 0.4) }
      },
      p.src
        ? h('img', { src: p.src, alt: p.alt || p.name || '' })
        : h(
            ThemedText,
            { font: 'semiBold', color: 'inkMuted48', style: { fontSize: 'inherit' } },
            initial || null
          )
    );
  }

  /* ------------------------------------------------------------------ Button */
  /* Pill CTA. The pill radius carries the emphasis, so the label stays at body/400. */

  var BUTTON_VARIANTS = ['primary', 'outline', 'ghost', 'danger'];

  function Button(props) {
    var p = props || {};
    var variant = BUTTON_VARIANTS.indexOf(p.variant) === -1 ? 'primary' : p.variant;
    var blocked = p.disabled || p.loading;
    return h(
      'button',
      {
        type: p.type || 'button',
        className: cx('ads-btn', 'ads-btn--' + variant, p.fullWidth && 'ads-btn--full', p.className),
        'aria-disabled': blocked ? 'true' : undefined,
        'aria-busy': p.loading ? 'true' : undefined,
        onClick: blocked ? undefined : p.onPress || p.onClick
      },
      p.loading
        ? h('span', { className: 'ads-spinner', role: 'status', 'aria-label': 'Loading' })
        : [
            p.leftIcon ? h(Icon, { key: 'l', name: p.leftIcon, size: 18 }) : null,
            h(
              ThemedText,
              { key: 't', size: 'body', style: { color: 'inherit' } },
              p.label || p.children
            ),
            p.rightIcon ? h(Icon, { key: 'r', name: p.rightIcon, size: 18 }) : null
          ]
    );
  }

  /* -------------------------------------------------------------------- Chip */

  function Chip(props) {
    var p = props || {};
    var filter = p.variant === 'filter';
    var el = filter || p.onPress ? 'button' : 'span';
    return h(
      el,
      {
        type: el === 'button' ? 'button' : undefined,
        className: cx(
          'ads-chip',
          filter && 'ads-chip--filter',
          p.active && 'ads-chip--active',
          p.className
        ),
        'aria-pressed': filter ? !!p.active : undefined,
        onClick: p.onPress || p.onClick
      },
      p.icon ? h(Icon, { name: p.icon, size: 14 }) : null,
      h(ThemedText, { size: 'caption', style: { color: 'inherit' } }, p.label || p.children)
    );
  }

  /* ------------------------------------------------------------------- Input */

  function Input(props) {
    var p = props || {};
    var state = React.useState(false);
    var focused = state[0];
    var setFocused = state[1];
    var id = React.useMemo(
      function () {
        return p.id || 'ads-input-' + Math.random().toString(36).slice(2, 8);
      },
      [p.id]
    );

    return h(
      'label',
      { className: cx('ads-field', p.className), htmlFor: id },
      p.label
        ? h(ThemedText, { size: 'callout', font: 'semiBold', color: 'ink', as: 'span' }, p.label)
        : null,
      h(
        'span',
        {
          className: cx(
            'ads-field__box',
            p.pill && 'ads-field__box--pill',
            p.error && 'ads-field__box--error',
            !p.error && focused && 'ads-field__box--focused'
          )
        },
        p.leftIcon ? h(Icon, { name: p.leftIcon, size: 18, color: 'inkMuted48' }) : null,
        h('input', {
          id: id,
          className: 'ads-field__input body',
          type: p.type || 'text',
          value: p.value,
          defaultValue: p.defaultValue,
          placeholder: p.placeholder,
          inputMode: p.inputMode,
          autoComplete: p.autoComplete,
          disabled: p.disabled,
          'aria-invalid': p.error ? 'true' : undefined,
          onChange: p.onChange,
          onFocus: function () {
            setFocused(true);
          },
          onBlur: function () {
            setFocused(false);
          }
        }),
        p.rightIcon ? h(Icon, { name: p.rightIcon, size: 18, color: 'inkMuted48' }) : null
      ),
      p.error
        ? h(ThemedText, { size: 'caption', color: 'danger', as: 'span' }, p.error)
        : p.hint
        ? h(ThemedText, { size: 'caption', color: 'inkMuted48', as: 'span' }, p.hint)
        : null
    );
  }

  /* ---------------------------------------------------------------- OtpInput */

  function OtpInput(props) {
    var p = props || {};
    var length = p.length || 6;
    var inner = React.useState('');
    var value = p.value != null ? p.value : inner[0];
    var setValue = inner[1];
    var focusState = React.useState(false);
    var focused = focusState[0];
    var setFocused = focusState[1];

    function onChange(e) {
      var next = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, length);
      if (p.value == null) setValue(next);
      if (p.onChange) p.onChange(next);
      if (next.length === length && p.onComplete) p.onComplete(next);
    }

    var boxes = [];
    for (var i = 0; i < length; i++) {
      boxes.push(
        h(
          'span',
          {
            key: i,
            className: cx(
              'ads-otp__box',
              focused && i === Math.min(value.length, length - 1) && 'ads-otp__box--active'
            )
          },
          h(
            ThemedText,
            { size: 'title3', font: 'semiBold', color: 'ink' },
            value.charAt(i) || null
          )
        )
      );
    }

    return h(
      'span',
      {
        className: cx(
          'ads-otp',
          p.error && 'ads-otp--error',
          p.error && 'ads-otp--shake',
          p.className
        )
      },
      boxes,
      h('input', {
        className: 'ads-otp__catch',
        type: 'text',
        inputMode: 'numeric',
        autoComplete: 'one-time-code',
        'aria-label': p.label || 'Verification code',
        value: value,
        onChange: onChange,
        onFocus: function () {
          setFocused(true);
        },
        onBlur: function () {
          setFocused(false);
        }
      })
    );
  }

  /* -------------------------------------------------------------------- Card */

  function Card(props) {
    var p = props || {};
    var pressable = !!(p.onPress || p.onClick);
    return h(
      pressable ? 'button' : 'div',
      {
        type: pressable ? 'button' : undefined,
        className: cx(
          'ads-card',
          p.selected && 'ads-card--selected',
          pressable && 'ads-card--pressable',
          p.className
        ),
        'aria-pressed': pressable && p.selected != null ? !!p.selected : undefined,
        onClick: p.onPress || p.onClick
      },
      p.children
    );
  }

  function CardFooter(props) {
    var p = props || {};
    return h('div', { className: cx('ads-card__footer', p.className) }, p.children);
  }

  function GroupedRows(props) {
    var p = props || {};
    var rows = p.rows || [];
    return h(
      'div',
      { className: cx('ads-group', p.className), role: p.role || 'group' },
      rows.map(function (row, i) {
        var pressable = !!row.onPress;
        return h(
          pressable ? 'button' : 'div',
          {
            key: row.key || i,
            type: pressable ? 'button' : undefined,
            className: cx('ads-group__row', pressable && 'ads-group__row--pressable'),
            onClick: row.onPress
          },
          row.icon ? h(Icon, { name: row.icon, size: 20, color: row.iconColor || 'ink' }) : null,
          h(
            ThemedText,
            { size: 'body', color: row.color || 'ink', style: { flex: 1 } },
            row.label
          ),
          row.right || null
        );
      })
    );
  }

  /* --------------------------------------------------------------- StatGauge */

  function StatGauge(props) {
    var p = props || {};
    var pct = Math.max(0, Math.min(1, p.pct == null ? 0 : p.pct));
    return h(
      'div',
      { className: cx('ads-gauge', p.className) },
      h(ThemedText, { size: 'headline', font: 'semiBold', color: 'ink' }, p.value),
      h(ThemedText, { size: 'caption', color: 'inkMuted48' }, p.label),
      h(
        'div',
        {
          className: 'ads-gauge__track',
          role: 'progressbar',
          'aria-valuenow': Math.round(pct * 100),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-label': p.label
        },
        h('div', {
          className: cx('ads-gauge__fill', p.color === 'success' && 'ads-gauge__fill--success'),
          style: { width: pct * 100 + '%' }
        })
      )
    );
  }

  /* ------------------------------------------------------------- StatusBadge */
  /* The palettes are the source's single source of truth for state colouring: a held or
     open state is a filled primary badge; every terminal or neutral state is a parchment
     badge with a semantic foreground. Every badge carries its label word. */

  var PROJECT_STATUS_PALETTE = {
    open: { bg: 'primary', fg: 'onPrimary', label: 'Open' },
    in_progress: { bg: 'canvasParchment', fg: 'primary', label: 'In progress' },
    under_review: { bg: 'canvasParchment', fg: 'warning', label: 'Under review' },
    completed: { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Completed' },
    disputed: { bg: 'canvasParchment', fg: 'danger', label: 'Disputed' },
    cancelled: { bg: 'canvasParchment', fg: 'inkMuted48', label: 'Cancelled' }
  };

  var ESCROW_STATUS_PALETTE = {
    pending: { bg: 'canvasParchment', fg: 'warning', label: 'Awaiting payment' },
    held: { bg: 'primary', fg: 'onPrimary', label: 'Held' },
    released: { bg: 'canvasParchment', fg: 'primary', label: 'Released' },
    refunded: { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Refunded' },
    disputed: { bg: 'canvasParchment', fg: 'danger', label: 'Disputed' }
  };

  var SKILL_LEVEL_PALETTE = {
    beginner: { bg: 'canvasParchment', fg: 'inkMuted80', label: 'Beginner' },
    intermediate: { bg: 'canvasParchment', fg: 'primary', label: 'Intermediate' },
    advanced: { bg: 'primary', fg: 'onPrimary', label: 'Advanced' },
    expert: { bg: 'primary', fg: 'onPrimary', label: 'Expert' }
  };

  var PALETTES = {
    project: PROJECT_STATUS_PALETTE,
    escrow: ESCROW_STATUS_PALETTE,
    skill: SKILL_LEVEL_PALETTE
  };

  function StatusBadge(props) {
    var p = props || {};
    var palette = typeof p.palette === 'object' ? p.palette : PALETTES[p.palette || 'project'];
    var entry = (palette && palette[p.status]) || {
      bg: 'canvasParchment',
      fg: 'inkMuted80',
      label: p.label || p.status
    };
    return h(
      'span',
      {
        className: cx('ads-badge', p.className),
        style: { background: token(entry.bg), color: token(entry.fg) }
      },
      h(ThemedText, { size: 'caption', style: { color: 'inherit' } }, p.label || entry.label)
    );
  }

  /* ------------------------------------------------------------- RatingStars */

  var STAR_SIZES = { sm: 14, md: 20, lg: 28 };

  function RatingStars(props) {
    var p = props || {};
    var max = p.max || 5;
    var size = STAR_SIZES[p.size] || STAR_SIZES.md;
    var value = p.value || 0;
    var stars = [];
    for (var i = 1; i <= max; i++) {
      var filled = i <= Math.round(value);
      var interactive = !!p.onRate;
      stars.push(
        h(
          interactive ? 'button' : 'span',
          {
            key: i,
            type: interactive ? 'button' : undefined,
            className: cx(
              'ads-star',
              filled && 'ads-star--filled',
              interactive && 'ads-star--interactive'
            ),
            'aria-label': interactive ? i + ' of ' + max : undefined,
            onClick: interactive
              ? (function (n) {
                  return function () {
                    p.onRate(n);
                  };
                })(i)
              : undefined
          },
          h(Icon, { name: filled ? 'star.fill' : 'star', size: size })
        )
      );
    }
    return h(
      'span',
      {
        className: cx('ads-stars', p.className),
        role: p.onRate ? 'group' : 'img',
        'aria-label': p.onRate ? p.label || 'Rate' : value + ' out of ' + max
      },
      stars
    );
  }

  /* -------------------------------------------------------------- EmptyState */

  function EmptyState(props) {
    var p = props || {};
    return h(
      'div',
      { className: cx('ads-empty', p.className) },
      p.icon ? h(Icon, { name: p.icon, size: 44, color: 'inkMuted48' }) : null,
      h(ThemedText, { size: 'title3', font: 'semiBold', color: 'ink' }, p.title),
      p.body
        ? h(
            ThemedText,
            { size: 'body', color: 'inkMuted48', className: 'ads-empty__body' },
            p.body
          )
        : null,
      p.action
        ? h('div', { className: 'ads-empty__cta' }, p.action)
        : p.actionLabel
        ? h(
            'div',
            { className: 'ads-empty__cta' },
            h(Button, { label: p.actionLabel, onPress: p.onAction })
          )
        : null
    );
  }

  /* ------------------------------------------------------------------- Toast */

  function Toast(props) {
    var p = props || {};
    var variant = p.variant === 'error' || p.variant === 'success' ? p.variant : 'info';
    return h(
      'div',
      {
        className: cx('ads-toast', 'ads-toast--' + variant, p.className),
        role: variant === 'error' ? 'alert' : 'status',
        onClick: p.onDismiss
      },
      h(ThemedText, { size: 'callout', style: { color: 'inherit' } }, p.message || p.children)
    );
  }

  /* ------------------------------------------------------------------- Alert */

  function Alert(props) {
    var p = props || {};
    var buttons = p.buttons && p.buttons.length ? p.buttons : [{ label: 'OK' }];
    var sideBySide = buttons.length === 2;
    return h(
      'div',
      { className: cx('ads-scrim', 'ads-scrim--center', p.className) },
      h(
        'div',
        { className: 'ads-alert', role: 'alertdialog', 'aria-label': p.title },
        h(
          'div',
          { className: 'ads-alert__body' },
          h(ThemedText, { size: 'headline', font: 'semiBold', color: 'ink' }, p.title),
          p.message
            ? h(ThemedText, { size: 'callout', color: 'inkMuted80' }, p.message)
            : null
        ),
        h(
          'div',
          {
            className: cx('ads-alert__actions', !sideBySide && 'ads-alert__actions--stack')
          },
          buttons.map(function (b, i) {
            return h(
              'button',
              {
                key: b.label || i,
                type: 'button',
                className: cx(
                  'ads-alert__btn',
                  b.style === 'destructive' && 'ads-alert__btn--destructive'
                ),
                onClick: b.onPress
              },
              h(
                ThemedText,
                {
                  size: 'body',
                  font: b.style === 'cancel' ? 'semiBold' : 'regular',
                  style: { color: 'inherit' }
                },
                b.label
              )
            );
          })
        )
      )
    );
  }

  /* ------------------------------------------------------------------- Sheet */

  function Sheet(props) {
    var p = props || {};
    var options = p.options || [];
    return h(
      'div',
      { className: cx('ads-sheet-wrap', p.className) },
      h(
        'div',
        { className: 'ads-sheet', role: 'menu', 'aria-label': p.title || 'Options' },
        p.title || p.message
          ? h(
              'div',
              { className: 'ads-sheet__header' },
              h(
                ThemedText,
                { size: 'caption', color: 'inkMuted48' },
                p.title || p.message
              )
            )
          : null,
        options.map(function (o, i) {
          return h(
            'button',
            {
              key: o.label || i,
              type: 'button',
              role: 'menuitem',
              className: cx(
                'ads-sheet__row',
                o.style === 'destructive' && 'ads-sheet__row--destructive'
              ),
              onClick: o.onPress
            },
            h(ThemedText, { size: 'body', style: { color: 'inherit' } }, o.label)
          );
        })
      ),
      h(
        'div',
        { className: 'ads-sheet' },
        h(
          'button',
          { type: 'button', className: 'ads-sheet__row', onClick: p.onCancel },
          h(
            ThemedText,
            { size: 'body', font: 'semiBold', style: { color: 'inherit' } },
            p.cancelLabel || 'Cancel'
          )
        )
      )
    );
  }

  /* --------------------------------------------------------------- AppHeader */
  /* The collapsing large title: a 44px pinned bar, the title at the top of the content,
     and the inline title fading in between 12px and 44px of scroll. */

  var BAR_HEIGHT = 44;
  var COLLAPSE_DISTANCE = 44;
  var FADE_START = 12;

  function AppHeader(props) {
    var p = props || {};
    var st = React.useState(0);
    var scrollY = st[0];
    var setScrollY = st[1];
    var collapsed = scrollY >= FADE_START;
    var progress = Math.max(
      0,
      Math.min(1, (scrollY - FADE_START) / (COLLAPSE_DISTANCE - FADE_START))
    );

    return h(
      'div',
      { className: cx('ads-header', p.className) },
      h(
        'div',
        { className: cx('ads-header__bar', collapsed && 'ads-header__bar--pinned') },
        p.showBack === false
          ? p.left || null
          : h(
              'button',
              {
                type: 'button',
                className: 'ads-header__back',
                'aria-label': 'Back',
                onClick: p.onBack
              },
              h(Icon, { name: 'chevron.left', size: 26 })
            ),
        h(
          'div',
          { className: 'ads-header__inline', style: { opacity: progress } },
          h(ThemedText, { size: 'body', font: 'semiBold', color: 'ink' }, p.title)
        ),
        p.right ? h('div', { className: 'ads-header__actions' }, p.right) : null
      ),
      h(
        'div',
        {
          className: 'ads-header__scroll',
          onScroll: function (e) {
            setScrollY(e.currentTarget.scrollTop);
          }
        },
        h(
          'div',
          { className: 'ads-header__title' },
          h(ThemedText, { size: 'title2', font: 'bold', color: 'ink', as: 'h1' }, p.title),
          p.subtitle
            ? h(ThemedText, { size: 'body', color: 'inkMuted48', as: 'p' }, p.subtitle)
            : null
        ),
        h(
          'div',
          {
            className: cx('ads-header__content', p.flush && 'ads-header__content--flush')
          },
          p.children
        )
      )
    );
  }

  /* ------------------------------------------------------------------ TabBar */

  function TabBar(props) {
    var p = props || {};
    var tabs = p.tabs || [];
    return h(
      'nav',
      { className: cx('ads-tabbar', p.className), 'aria-label': p.label || 'Tabs' },
      tabs.map(function (t) {
        var active = t.key === p.active;
        return h(
          'button',
          {
            key: t.key,
            type: 'button',
            className: cx('ads-tab', active && 'ads-tab--active'),
            'aria-current': active ? 'page' : undefined,
            onClick: function () {
              if (p.onChange) p.onChange(t.key);
            }
          },
          h(Icon, { name: t.icon, size: 22 }),
          h(ThemedText, { size: 'micro', style: { color: 'inherit' } }, t.label)
        );
      })
    );
  }

  /* -------------------------------------------------------- NotificationBell */

  function NotificationBell(props) {
    var p = props || {};
    var count = p.count || 0;
    var shown = count > 99 ? '99+' : String(count);
    return h(
      'button',
      {
        type: 'button',
        className: cx('ads-bell', p.className),
        'aria-label': count ? count + ' unread notifications' : 'Notifications',
        onClick: p.onPress || p.onClick
      },
      h(Icon, { name: 'bell', size: 22 }),
      count > 0
        ? h(
            'span',
            { className: 'ads-bell__badge' },
            h(ThemedText, { size: 'micro', style: { color: 'inherit' } }, shown)
          )
        : null
    );
  }

  /* ----------------------------------------------------------------- exports */

  window.AppleDS = {
    ThemedText: ThemedText,
    Icon: Icon,
    Avatar: Avatar,
    Button: Button,
    Chip: Chip,
    Input: Input,
    OtpInput: OtpInput,
    Card: Card,
    CardFooter: CardFooter,
    GroupedRows: GroupedRows,
    StatGauge: StatGauge,
    StatusBadge: StatusBadge,
    RatingStars: RatingStars,
    EmptyState: EmptyState,
    Toast: Toast,
    Alert: Alert,
    Sheet: Sheet,
    AppHeader: AppHeader,
    TabBar: TabBar,
    NotificationBell: NotificationBell,
    PROJECT_STATUS_PALETTE: PROJECT_STATUS_PALETTE,
    ESCROW_STATUS_PALETTE: ESCROW_STATUS_PALETTE,
    SKILL_LEVEL_PALETTE: SKILL_LEVEL_PALETTE
  };
})();
