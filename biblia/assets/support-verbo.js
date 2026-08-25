(() => {
  'use strict';

  const PAYPAL_URL = 'https://paypal.me/VerboBiblia';
  const MOBILE_BREAKPOINT = 760;

  function addStyles() {
    if (document.getElementById('support-verbo-styles')) return;
    const style = document.createElement('style');
    style.id = 'support-verbo-styles';
    style.textContent = `
      .support-verbo {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: .5rem;
        min-height: 40px;
        padding: .46rem .78rem;
        border: 1px solid rgba(202, 157, 55, .62);
        border-radius: 999px;
        color: #fff8df;
        background: linear-gradient(135deg, rgba(154, 107, 24, .96), rgba(112, 72, 17, .96));
        box-shadow: 0 3px 14px rgba(46, 29, 5, .16);
        font-family: inherit;
        line-height: 1.15;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
      }
      .support-verbo:hover {
        border-color: #e3bf68;
        box-shadow: 0 5px 18px rgba(46, 29, 5, .24);
        transform: translateY(-1px);
      }
      .support-verbo:focus-visible {
        outline: 3px solid #f3cf72;
        outline-offset: 3px;
      }
      .support-verbo__icon { font-size: 1rem; line-height: 1; }
      .support-verbo__copy { display: grid; gap: .08rem; text-align: left; }
      .support-verbo__title { font-size: .82rem; font-weight: 700; }
      .support-verbo__subtitle { font-size: .64rem; color: rgba(255, 248, 223, .84); }
      .support-verbo__mobile-title { display: none; font-size: .78rem; font-weight: 700; }
      .support-verbo--home { min-height: 44px; padding: .48rem .9rem; margin-right: .65rem; }
      .support-verbo--quick-nav { min-height: 34px; padding: .38rem .72rem; }
      body.recursos-page .quick-nav .support-verbo--quick-nav {
        border-color: rgba(154, 107, 24, .72);
        color: #fff8df;
        background: linear-gradient(135deg, #9a6b18, #704811);
      }
      body.recursos-page .quick-nav .support-verbo--quick-nav:hover {
        border-color: #c99d37;
        color: #fffdf4;
        background: linear-gradient(135deg, #a9771d, #7a5014);
      }
      .support-verbo--rail {
        width: calc(100% - 8px);
        min-width: 40px;
        min-height: 54px;
        margin: 4px;
        padding: .42rem .2rem;
        border-radius: 10px;
        flex-direction: column;
        gap: .18rem;
        white-space: normal;
        overflow: hidden;
      }
      .support-verbo--rail .support-verbo__copy { display: block; width: 100%; text-align: center; }
      .support-verbo--rail .support-verbo__title { display: block; font-size: .54rem; line-height: 1.05; overflow-wrap: anywhere; }
      .support-verbo--rail .support-verbo__subtitle { display: none; }
      .support-verbo--projector { width: 100%; margin-top: .75rem; border-radius: 8px; }
      .support-verbo--church { margin-left: auto; margin-right: .5rem; }
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        .support-verbo--desktop-only { display: none !important; }
        .support-verbo--home {
          min-width: 44px;
          min-height: 44px;
          margin-right: .35rem;
          padding: .42rem .64rem;
        }
        .support-verbo--home .support-verbo__copy { display: none; }
        .support-verbo--home .support-verbo__mobile-title { display: inline; }
      }
      @media (max-width: 380px) {
        .support-verbo--home { padding-inline: .55rem; }
        .support-verbo--home .support-verbo__mobile-title { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .support-verbo { transition: none; }
        .support-verbo:hover { transform: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function create({ variant = 'compact', context = 'other' } = {}) {
    const isHome = variant === 'home';
    const link = document.createElement('a');
    link.className = `support-verbo support-verbo--${variant}${isHome ? '' : ' support-verbo--desktop-only'}`;
    link.href = PAYPAL_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.supportContext = context;
    link.dataset.i18nAttr = 'aria-label:support.aria,title:support.description';
    link.setAttribute('aria-label', 'Apoyar a Verbo mediante una ofrenda voluntaria');
    link.title = 'Tu ofrenda voluntaria ayuda a sostener Verbo y mantenerlo gratuito para todos.';
    link.innerHTML = `
      <span class="support-verbo__icon" aria-hidden="true">💛</span>
      <span class="support-verbo__copy">
        <span class="support-verbo__title" data-i18n="support.${isHome ? 'homeTitle' : 'compactTitle'}">${isHome ? 'Sé parte de Verbo' : 'Apoya Verbo'}</span>
        <span class="support-verbo__subtitle" data-i18n="support.${isHome ? 'homeSubtitle' : 'offering'}">${isHome ? 'Ofrenda voluntaria para sostener Verbo' : 'Ofrenda voluntaria'}</span>
      </span>
      ${isHome ? '<span class="support-verbo__mobile-title" data-i18n="support.mobileTitle">Apoyar</span>' : ''}
    `;
    return link;
  }

  function mount() {
    if (document.querySelector('.support-verbo')) return;
    addStyles();
    const context = document.body.dataset.supportVerboContext;
    let host;
    let link;

    if (context === 'home') {
      host = document.querySelector('header > div:last-child');
      link = create({ variant: 'home', context });
      host?.prepend(link);
    } else if (context === 'bible') {
      host = document.querySelector('.tab-rail');
      link = create({ variant: 'rail', context });
      host?.prepend(link);
    } else if (context === 'projector') {
      host = document.querySelector('#sidebar .brand');
      link = create({ variant: 'projector', context });
      host?.append(link);
    } else if (context === 'church') {
      host = document.querySelector('.static-page__header');
      link = create({ variant: 'church', context });
      host?.insertBefore(link, host.querySelector('.static-page__back'));
    } else {
      host = document.querySelector('.quick-nav');
      link = create({ variant: 'quick-nav', context: context || 'resources' });
      host?.append(link);
    }

    if (link && window.VerboI18n?.applyStatic) window.VerboI18n.applyStatic(link);
  }

  window.SupportVerboButton = { create, mount, url: PAYPAL_URL };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
