// ==UserScript==
// @name         iCloud Hide My Email 调试采集器
// @namespace    https://github.com/yxand/youxiang
// @version      0.3.1
// @description  串行完成 iCloud Hide My Email 创建流程，并在成功页提取邮箱后上报 Vercel 接口
// @match        *://*.icloud.com/*
// @match        *://*.icloud.com.cn/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      *
// ==/UserScript==

(function () {
  'use strict';
  const isTopWindow = window.top === window.self;

  const CONFIG = {
    // 流程开关
    autoClickTile: true,
    autoClickAddButton: true,
    autoFillLabelAndCreate: true,
    // 新建地址标签默认值
    defaultNewAddressLabel: 'lgp',
    // 入库接口配置
    enableVercelUpload: true,
    vercelApiUrl: '',
    vercelBearerToken: '',
    // 调试日志
    verbose: true,
  };
  const RUN_FLAG_KEY = '__hme_run_flag_v1__';

  const state = {
    isRunning: false,
    isTicking: false,
    tileClicked: false,
    addClicked: false,
    labelFilled: false,
    createClicked: false,
    successHandled: false,
    hasLoggedWaiting: false,
    lastStepLogAt: 0,
  };

  log('脚本已注入，当前地址：', window.location.href);

  function log(...args) {
    if (CONFIG.verbose) {
      console.log('[HME]', ...args);
    }
  }

  function warn(...args) {
    console.warn('[HME]', ...args);
  }

  function resetFlowState() {
    state.tileClicked = false;
    state.addClicked = false;
    state.labelFilled = false;
    state.createClicked = false;
    state.successHandled = false;
    state.hasLoggedWaiting = false;
    state.lastStepLogAt = 0;
  }

  function readRunFlag() {
    try {
      return window.sessionStorage.getItem(RUN_FLAG_KEY) === '1';
    } catch {
      return false;
    }
  }

  function writeRunFlag(value) {
    try {
      if (value) {
        window.sessionStorage.setItem(RUN_FLAG_KEY, '1');
      } else {
        window.sessionStorage.removeItem(RUN_FLAG_KEY);
      }
    } catch {
      // 忽略存储异常
    }
  }

  function showToast(message, isError = false) {
    const old = document.getElementById('__hme_toast__');
    if (old) {
      old.remove();
    }

    const toast = document.createElement('div');
    toast.id = '__hme_toast__';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '999999';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '14px';
    toast.style.color = '#fff';
    toast.style.background = isError ? '#cc2f2f' : '#2e7d32';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  async function copyToClipboard(text) {
    const safeText = String(text ?? '');
    if (!safeText) {
      return false;
    }

    // 先尝试把焦点切回文档，避免 "Document is not focused"。
    try {
      window.focus();
    } catch {
      // 忽略
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(safeText);
        return true;
      }
    } catch (error) {
      warn('Clipboard API 第一次复制失败，尝试重试：', error);
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        await navigator.clipboard.writeText(safeText);
        return true;
      } catch (retryError) {
        warn('Clipboard API 重试失败，尝试 GM_setClipboard：', retryError);
      }
    }

    try {
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(safeText, 'text');
        return true;
      }
    } catch (error) {
      warn('GM_setClipboard 复制失败，尝试 execCommand 回退：', error);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = safeText;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok;
    } catch (error) {
      warn('回退复制方案失败：', error);
      return false;
    }
  }

  function getHideMyEmailModalCandidates() {
    return Array.from(
      document.querySelectorAll('div.modal-dialog[role="dialog"][aria-label="Hide My Email"]')
    );
  }

  function isElementVisible(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    return element.getClientRects().length > 0;
  }

  function findHideMyEmailModal(predicate) {
    const candidates = getHideMyEmailModalCandidates();
    if (candidates.length === 0) {
      return null;
    }

    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      const modal = candidates[i];
      if (!isElementVisible(modal)) {
        continue;
      }
      if (!predicate || predicate(modal)) {
        return modal;
      }
    }

    if (predicate) {
      for (let i = candidates.length - 1; i >= 0; i -= 1) {
        const modal = candidates[i];
        if (predicate(modal)) {
          return modal;
        }
      }
      return null;
    }

    return candidates[candidates.length - 1];
  }

  function findHideMyEmailTileButton() {
    return document.querySelector(
      'article[aria-label="Hide My Email"] button[aria-haspopup="dialog"]'
    );
  }

  function tryClickTile() {
    const button = findHideMyEmailTileButton();
    if (!button) return false;
    if (CONFIG.autoClickTile && !state.tileClicked) {
      state.tileClicked = true;
      button.click();
      log('已自动点击 Hide My Email 卡片按钮。');
    }
    return true;
  }

  function findAddButtonInModal() {
    const modal = findHideMyEmailModal((node) =>
      Boolean(node.querySelector('div.IconButton.AddButton button[type="button"]'))
    );
    if (!modal) return null;

    // 主定位：按你给出的父级结构
    const primary = modal.querySelector('div.IconButton.AddButton button[type="button"]');
    if (primary) {
      return primary;
    }

    // 兜底：在当前可见弹层里，找文本为空的图标按钮中最像“加号”的按钮
    const candidates = Array.from(
      modal.querySelectorAll('button.button.button-icon-only.button-rounded-rectangle[type="button"]')
    );
    return candidates[candidates.length - 1] || null;
  }

  function tryClickAdd() {
    const addButton = findAddButtonInModal();
    if (!addButton) return false;
    if (CONFIG.autoClickAddButton && !state.addClicked) {
      state.addClicked = true;
      addButton.click();
      log('已自动点击 Add 按钮。');
    }
    return true;
  }

  function findCreateNewAddressPanel() {
    const modal = findHideMyEmailModal((node) => Boolean(node.querySelector('div.Panel.AddEmailPage')));
    if (!modal) return null;

    const panel = modal.querySelector('div.Panel.AddEmailPage');
    if (!panel) return null;

    const title = panel.querySelector('h1.Typography.PanelTitle-title.modal-title.Typography-h1');
    if (!title || title.textContent?.trim() !== 'Create New Address') return null;

    return panel;
  }

  function setNativeInputValue(input, value) {
    const prototype = Object.getPrototypeOf(input);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && typeof descriptor.set === 'function') {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
  }

  function tryFillLabelAndClickCreate() {
    const panel = findCreateNewAddressPanel();
    if (!panel) return false;

    const labelInput = panel.querySelector(
      'div.form-textbox input.form-textbox-input[name="hme-label"][type="text"]'
    );
    if (!labelInput) return false;

    if (CONFIG.autoFillLabelAndCreate && !state.labelFilled) {
      setNativeInputValue(labelInput, CONFIG.defaultNewAddressLabel);
      labelInput.dispatchEvent(new Event('input', { bubbles: true }));
      labelInput.dispatchEvent(new Event('change', { bubbles: true }));
      labelInput.dispatchEvent(new Event('blur', { bubbles: true }));
      state.labelFilled = true;
      log(`已填写标签输入框：${CONFIG.defaultNewAddressLabel}`);
    }

    const modal = findHideMyEmailModal((node) => Boolean(node.querySelector('div.modal-button-bar')));
    if (!modal) return true;

    const buttons = modal.querySelectorAll(
      'div.modal-button-bar button.button.button-rounded-rectangle[type="button"]'
    );
    const createButton = Array.from(buttons).find(
      (button) => (button.textContent || '').trim() === 'Create email address'
    );
    if (!createButton) return true;

    if (createButton.disabled) {
      return true;
    }

    if (!state.createClicked) {
      state.createClicked = true;
      createButton.click();
      log('已自动点击 Create email address 按钮。');
    }
    return true;
  }

  function findSuccessPageData() {
    const modal = findHideMyEmailModal((node) => Boolean(node.querySelector('div.EmailDetailPage')));
    if (!modal) return null;

    const detailPage = modal.querySelector('div.EmailDetailPage div.Panel.EmailDetail');
    if (!detailPage) return null;

    const subtitle = detailPage.querySelector(
      'div.Typography.PanelTitle-title2.modal-subtitle.Typography-semibold'
    );
    if (!subtitle || subtitle.textContent?.trim() !== 'From Settings') return null;

    const hmeField = detailPage.querySelector('div.LabeledField.EmailDetail-hmeField');
    if (!hmeField) return null;

    const emailValue = hmeField.querySelector('p.Typography.LabeledField-value.Typography-body1');
    if (!emailValue) return null;

    const labelTitle = detailPage.querySelector(
      'h1.Typography.PanelTitle-title.modal-title.Typography-h1'
    );
    const forwardField = detailPage.querySelector('div.LabeledField.EmailDetail-forwardToField');
    const forwardValue = forwardField?.querySelector(
      'p.Typography.LabeledField-value.Typography-body1'
    );

    const email = (emailValue.textContent || '').trim();
    if (!email) return null;

    return {
      email,
      label: (labelTitle?.textContent || '').trim(),
      forwardTo: (forwardValue?.textContent || '').trim(),
    };
  }

  async function uploadToVercel(payload) {
    if (!CONFIG.enableVercelUpload) {
      return { ok: false, reason: 'upload-disabled' };
    }

    if (!CONFIG.vercelApiUrl) {
      warn('未配置 vercelApiUrl，跳过上报。');
      return { ok: false, reason: 'missing-api-url' };
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    if (CONFIG.vercelBearerToken) {
      headers.Authorization = `Bearer ${CONFIG.vercelBearerToken}`;
    }

    try {
      const response = await fetch(CONFIG.vercelApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`上报失败，状态码：${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      return { ok: true, data };
    } catch (fetchError) {
      warn('fetch 上报失败，尝试 GM_xmlhttpRequest 回退：', fetchError);

      if (typeof GM_xmlhttpRequest !== 'function') {
        throw fetchError;
      }

      const data = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url: CONFIG.vercelApiUrl,
          headers,
          data: JSON.stringify(payload),
          onload: (response) => {
            if (response.status < 200 || response.status >= 300) {
              reject(new Error(`上报失败，状态码：${response.status}`));
              return;
            }

            try {
              resolve(response.responseText ? JSON.parse(response.responseText) : {});
            } catch {
              resolve({});
            }
          },
          onerror: () => {
            reject(new Error('GM_xmlhttpRequest 网络错误'));
          },
          ontimeout: () => {
            reject(new Error('GM_xmlhttpRequest 请求超时'));
          },
        });
      });

      return { ok: true, data };
    }
  }

  async function tryHandleSuccessPage() {
    if (state.successHandled) return false;

    const data = findSuccessPageData();
    if (!data) return false;

    state.successHandled = true;
    log('已提取成功页邮箱：', data.email);

    try {
      const uploadResult = await uploadToVercel({
        email: data.email,
        label: data.label,
        forwardTo: data.forwardTo,
        source: 'icloud-hme-userscript',
        capturedAt: new Date().toISOString(),
        pageUrl: window.location.href,
      });

      if (!uploadResult.ok) {
        state.successHandled = false;
        return true;
      }

      const copied = await copyToClipboard(data.email);
      if (copied) {
        showToast(`入库成功，邮箱已复制：${data.email}`);
      } else {
        showToast(`入库成功，但复制失败：${data.email}`, true);
      }
      log('入库成功：', uploadResult.data || {});
      setRunning(false);
    } catch (error) {
      state.successHandled = false;
      warn('成功页处理失败：', error);
      showToast('入库失败，请查看控制台日志', true);
      setRunning(false);
    }

    return true;
  }

  function createFloatingStartButton() {
    const existingButtons = document.querySelectorAll('#__hme_start_btn__');
    if (existingButtons.length > 1) {
      // 清理重复按钮，仅保留最后一个。
      for (let i = 0; i < existingButtons.length - 1; i += 1) {
        existingButtons[i].remove();
      }
    }

    const existing = document.getElementById('__hme_start_btn__');
    if (existing) {
      return existing;
    }

    const button = document.createElement('button');
    button.id = '__hme_start_btn__';
    button.type = 'button';
    button.textContent = '开始创建并入库';
    button.style.position = 'fixed';
    button.style.right = '20px';
    button.style.bottom = '20px';
    button.style.zIndex = '999999';
    button.style.padding = '10px 14px';
    button.style.borderRadius = '10px';
    button.style.border = 'none';
    button.style.background = '#0b84ff';
    button.style.color = '#fff';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 6px 18px rgba(0,0,0,0.22)';
    button.addEventListener('click', () => {
      if (state.isRunning) {
        return;
      }
      resetFlowState();
      setRunning(true);
      showToast('已启动自动流程');
      void tick();
    });
    document.body.appendChild(button);
    return button;
  }

  function updateStartButton() {
    const button = createFloatingStartButton();
    if (state.isRunning) {
      button.textContent = '流程执行中...';
      button.style.background = '#6b7280';
      button.style.cursor = 'not-allowed';
    } else {
      button.textContent = '开始创建并入库';
      button.style.background = '#0b84ff';
      button.style.cursor = 'pointer';
    }
  }

  function setRunning(value) {
    state.isRunning = value;
    writeRunFlag(value);
    if (isTopWindow) {
      updateStartButton();
    }
  }

  function syncRunningStateFromStorage() {
    const flag = readRunFlag();
    if (state.isRunning !== flag) {
      state.isRunning = flag;
      if (isTopWindow) {
        updateStartButton();
      }
      log(`运行状态已同步：${flag ? "执行中" : "待机"}`);
    }
  }

  function logStepSnapshot() {
    const now = Date.now();
    if (now - state.lastStepLogAt < 2500) {
      return;
    }
    state.lastStepLogAt = now;

    const hasTileButton = Boolean(findHideMyEmailTileButton());
    const hasAddButton = Boolean(findAddButtonInModal());
    const hasCreatePanel = Boolean(findCreateNewAddressPanel());
    const hasSuccessPage = Boolean(findSuccessPageData());
    log(
      `步骤快照 url=${window.location.href} tile=${hasTileButton} add=${hasAddButton} create=${hasCreatePanel} success=${hasSuccessPage}`
    );
  }

  async function tick() {
    if (!state.isRunning || state.isTicking) {
      return;
    }
    state.isTicking = true;
    try {
      logStepSnapshot();
      const hasTile = tryClickTile();
      const hasAdd = tryClickAdd();
      const hasCreatePage = tryFillLabelAndClickCreate();
      await tryHandleSuccessPage();

      if (!hasTile && !hasAdd && !hasCreatePage && !state.hasLoggedWaiting) {
        state.hasLoggedWaiting = true;
        log('流程已启动，等待页面进入可操作状态...');
      } else if (hasTile || hasAdd || hasCreatePage) {
        state.hasLoggedWaiting = false;
      }
    } finally {
      state.isTicking = false;
    }
  }

  if (isTopWindow) {
    createFloatingStartButton();
    updateStartButton();
  }

  // 点击开始后若发生页面跳转（同域），在新页面自动续跑。
  if (readRunFlag()) {
    setRunning(true);
    log('检测到续跑标记，自动恢复流程。');
    void tick();
  }

  const observer = new MutationObserver(() => {
    void tick();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  // 兜底轮询：避免页面切换未触发可观察变更导致流程停住。
  window.setInterval(() => {
    syncRunningStateFromStorage();
    void tick();
  }, 800);
})();
