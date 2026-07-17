(() => {
  'use strict';

  const pageLoadId = Math.random().toString(36).substring(2, 15);

  const SELECTORS = {
    messageInput: 'messageInput',
    sendButton: 'sendButton',
    searchBox: 'searchBox',
    attachButton: [
      '[data-testid="attach-menu-plus"]',
      '[aria-label="Attach"]',
      '[data-icon="attach-menu-plus"]',
      'span[data-icon="clip"]'
    ],
    chatList: [
      '[data-testid="chat-list"]',
      '[aria-label="Chat list"]',
      '#pane-side'
    ],
    fileInput: [
      'input[type="file"][accept*="image"]',
      'input[type="file"][accept*="video"]',
      'input[type="file"][accept*="document"]',
      'input[type="file"]'
    ],
    rateLimitWarning: [
      '[data-testid="rate-limit-warning"]'
    ],
    phoneNumberError: [
      '[data-testid="phone-number-error"]'
    ],
    chatHeader: [
      '[data-testid="conversation-header"]',
      '#main header'
    ],
    messageBubble: [
      '[data-testid="msg-container"]',
      '.message-in',
      '.message-out'
    ]
  };

  function findSearchBox() {

    const selectors = [
      '[data-testid="chat-list-search"]',
      'div[contenteditable="true"][data-tab="3"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'input[placeholder*="Search"]',
      'input[aria-label*="Search"]',
      'input[title*="Search"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    const inputs = document.querySelectorAll('input, div[contenteditable="true"]');
    for (const input of inputs) {
      const placeholder = input.getAttribute('placeholder') || '';
      const ariaLabel = input.getAttribute('aria-label') || '';
      const title = input.getAttribute('title') || '';
      if (placeholder.toLowerCase().includes('search') ||
          ariaLabel.toLowerCase().includes('search') ||
          title.toLowerCase().includes('search')) {
        return input;
      }
    }

    const textboxes = document.querySelectorAll('[role="textbox"]');
    if (textboxes.length > 0) {
      return textboxes[0];
    }
    return null;
  }

  function findMessageInput() {
    const selectors = [
      '[data-testid="conversation-compose-box-input"]',
      '[contenteditable="true"][data-tab="10"]',
      '[contenteditable="true"][data-tab="9"]',
      'div[contenteditable="true"][role="textbox"]',
      '#main footer div[contenteditable="true"]',
      '#main footer [role="textbox"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }

    const footer = document.querySelector('footer, #main footer');
    if (footer) {
      const textbox = footer.querySelector('[contenteditable="true"], [role="textbox"], input');
      if (textbox) return textbox;
    }
    return null;
  }

  function findSendButton() {
    const selectors = [
      '[data-testid="send"]',
      '[aria-label="Send"]',
      '[aria-label*="Send"]',
      '[data-icon="send"]',
      '[data-icon*="send"]',
      'button[data-testid="compose-btn-send"]',
      'span[data-icon="send"]',
      'span[data-icon*="send"]'
    ];
    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        if (isVisible(el)) return el;
      }
    }

    const footer = document.querySelector('footer, #main footer');
    if (footer) {
      const buttons = footer.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        if (isVisible(btn)) return btn;
      }
    }
    return null;
  }

  function findFileInputByMenu(sendAsDocument) {

    const photoIcons = [
      '[data-testid="attach-image"]',
      '[aria-label="Photos & Videos"]',
      'span[data-icon="attach-image"]',
      'span[data-icon*="image"]',
      '[aria-label*="Photos"]',
      '[aria-label*="Photo"]'
    ];

    const docIcons = [
      '[data-testid="attach-document"]',
      '[aria-label="Document"]',
      'span[data-icon="attach-document"]',
      'span[data-icon*="document"]',
      '[aria-label*="Document"]'
    ];

    const selectors = sendAsDocument ? docIcons : photoIcons;

    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {

          let input = el.querySelector('input[type="file"]');
          if (input) return input;

          let parent = el.closest('li, div[role="button"], [role="menuitem"]');
          if (parent) {
            input = parent.querySelector('input[type="file"]');
            if (input) return input;
          }
        }
      } catch (e) {}
    }
    return null;
  }

  function findFileInput(sendAsDocument) {

    const menuInput = findFileInputByMenu(sendAsDocument);
    if (menuInput) {
      console.log('[WA-Bulk Messagner] Selected input via menu wrapper');
      return menuInput;
    }

    const inputs = document.querySelectorAll('input[type="file"]');

    if (sendAsDocument) {

      for (const el of inputs) {
        const accept = el.getAttribute('accept') || '';
        if (accept === '*' || (!accept.includes('image/') && !accept.includes('video/'))) {
          return el;
        }
      }

      for (const el of inputs) {
        const accept = el.getAttribute('accept') || '';
        if (!accept.includes('image/png')) {
          return el;
        }
      }
    } else {

      for (const el of inputs) {
        const accept = el.getAttribute('accept') || '';
        if (accept.includes('video/')) {
          return el;
        }
      }

      for (const el of inputs) {
        const accept = el.getAttribute('accept') || '';
        if (accept.includes('image/*')) {
          return el;
        }
      }
    }

    for (const el of inputs) {
      const accept = el.getAttribute('accept') || '';
      if (!accept.includes('image/png') || accept.includes('image/*')) {
        return el;
      }
    }

    return inputs[0] || null;
  }

  async function waitForFileInput(sendAsDocument, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const el = findFileInput(sendAsDocument);
      if (el) return el;
      await sleep(100);
    }
    return null;
  }

  function findElement(selectors) {
    if (selectors === 'searchBox') return findSearchBox();
    if (selectors === 'messageInput') return findMessageInput();
    if (selectors === 'sendButton') return findSendButton();

    if (Array.isArray(selectors)) {
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            if ((el.tagName === 'INPUT' && el.type === 'file') || isVisible(el)) return el;
          }
        } catch (e) {}
      }
      return null;
    }
    return document.querySelector(selectors);
  }

  function findAllElements(selectors) {
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) return Array.from(elements).filter(isVisible);
      } catch (e) {}
    }
    return [];
  }

  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }

  function findElementByText(selector, text) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (el.textContent.includes(text) && isVisible(el)) {
          return el;
        }
      }
    } catch (e) {}
    return null;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForElement(selectors, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const el = findElement(selectors);
      if (el) return el;
      await sleep(100);
    }
    return null;
  }

  function randomDelay(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clickElement(element) {
    if (!element) return;
    try {
      const clickable = element.closest('button, [role="button"]') || element;
      clickable.focus();
      const events = ['mousedown', 'mouseup', 'click'];
      for (const type of events) {
        clickable.dispatchEvent(new MouseEvent(type, {
          view: window,
          bubbles: true,
          cancelable: true
        }));
      }
    } catch (e) {
      console.warn('clickElement failed, calling native click', e);
      try { element.click(); } catch (err) {}
    }
  }

  function typeText(element, text, options = {}) {
    const { humanTyping = true, minDelay = 50, maxDelay = 150 } = options;

    return new Promise((resolve) => {
      element.focus();

      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      sel.removeAllRanges();
      sel.addRange(range);

      try {
        document.execCommand('delete', false, null);
      } catch (e) {
        element.textContent = '';
      }

      if (!humanTyping) {
        range.selectNodeContents(element);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        let success = false;
        try {
          success = document.execCommand('insertText', false, text);
        } catch (e) {
          console.warn('execCommand failed', e);
        }

        if (!success || element.textContent !== text) {
          element.textContent = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        resolve();
        return;
      }

      let index = 0;
      const typeChar = () => {
        if (index < text.length) {
          const char = text[index];
          range.selectNodeContents(element);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);

          let success = false;
          try {
            success = document.execCommand('insertText', false, char);
          } catch (e) {}

          if (!success) {
            element.textContent = element.textContent + char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }

          index++;
          setTimeout(typeChar, randomDelay(minDelay, maxDelay));
        } else {
          resolve();
        }
      };
      typeChar();
    });
  }

  function dataURLtoFile(dataurl, filename, type) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  function showNotification(message, type = 'info') {
    const existing = document.querySelector('.masssender-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `masssender-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'masssender-slide-in 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  async function findAndActivateSearchBox() {

    const selectors = [
      '[data-testid="chat-list-search"]',
      'div[contenteditable="true"][data-tab="3"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'input[placeholder*="Search"]',
      'input[aria-label*="Search"]',
      'input[title*="Search"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        el.focus();
        clickElement(el);
        await sleep(300);
        return el;
      }
    }

    const containerSelectors = [
      '[data-testid="chat-list-search"]',
      'button[aria-label="Search or start new chat"]',
      'div[placeholder*="Search"]',
      '.lexical-rich-text-input',
      'div.x1hx0egp'
    ];
    for (const sel of containerSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        clickElement(el);
        await sleep(300);
        const editBox = document.querySelector('div[contenteditable="true"], [role="textbox"], input');
        if (editBox) return editBox;
      }
    }
    return null;
  }

  async function waitForWhatsAppReady(timeout = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const chatList = document.querySelector('[data-testid="chat-list"], #pane-side, div[aria-label="Chat list"]');
      const searchBox = document.querySelector('[data-testid="chat-list-search"], div[contenteditable="true"], [role="textbox"], input');
      const loadingScreen = document.querySelector('#startup, [data-testid="startup-progress"], ._1854n');

      if ((chatList || searchBox) && !loadingScreen) {
        return true;
      }
      await sleep(500);
    }
    return false;
  }

  async function searchAndOpenChat(phoneNumber) {
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const searchBox = await findAndActivateSearchBox();
    if (!searchBox) {
      throw new Error('Search box not found. Make sure you are logged in to WhatsApp Web.');
    }

    searchBox.focus();
    await sleep(300);

    searchBox.textContent = '';
    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(200);

    await typeText(searchBox, cleanPhone, { humanTyping: false });
    await sleep(1500);

    const chatList = await waitForElement(SELECTORS.chatList);
    if (!chatList) {
      throw new Error('Chat list not found');
    }

    const firstChat = chatList.querySelector('[role="row"], [data-testid="cell-frame-container"], ._ak8l');
    if (!firstChat) {
      throw new Error('No chat found for this number');
    }

    clickElement(firstChat);
    await sleep(1500);

    const messageInput = await waitForElement(SELECTORS.messageInput);
    if (!messageInput) {
      throw new Error('Chat opened but message input not found');
    }

    return true;
  }

  async function sendTextMessage(message, options = {}) {
    const { humanTyping = true } = options;

    const messageInput = await waitForElement(SELECTORS.messageInput);
    if (!messageInput) {
      throw new Error('Message input not found');
    }

    await typeText(messageInput, message, { humanTyping });
    await sleep(300);

    const sendButton = await waitForElement(SELECTORS.sendButton);
    if (!sendButton) {
      throw new Error('Send button not found');
    }

    clickElement(sendButton);
    await sleep(500);

    return true;
  }

  async function sendMediaMessage(media, options = {}) {
    const isImageOrVideo = media.type.startsWith('image/') || media.type.startsWith('video/');
    const sendAsDocument = options.sendAsDocument || !isImageOrVideo;

    if (isImageOrVideo) {
      try {
        console.log('[WA-Bulk Messagner] Attempting paste method for image/video...');
        chrome.runtime.sendMessage({
          type: 'addLog',
          data: { level: 'info', message: 'Attempting to send media using clipboard paste event...' }
        }).catch(() => {});

        const messageInput = await waitForElement(SELECTORS.messageInput, 5000);
        if (messageInput) {
          messageInput.focus();
          await sleep(200);

          const file = await dataURLtoFile(media.data, media.name, media.type);
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dataTransfer
          });

          messageInput.dispatchEvent(pasteEvent);
          await sleep(2500);

          const sendBtn = await waitForElement(SELECTORS.sendButton, 15000);
          if (sendBtn) {
            chrome.runtime.sendMessage({
              type: 'addLog',
              data: { level: 'info', message: 'Send button found on media preview screen. Clicking it...' }
            }).catch(() => {});
            clickElement(sendBtn);
            await sleep(2500);
            chrome.runtime.sendMessage({
              type: 'addLog',
              data: { level: 'info', message: 'Media successfully pasted and sent.' }
            }).catch(() => {});
            return true;
          } else {
            throw new Error('Send button not found on media preview screen');
          }
        } else {
          throw new Error('Message input not found');
        }
      } catch (e) {
        console.warn('[WA-Bulk Messagner] Paste method failed, falling back to attach menu:', e);
        chrome.runtime.sendMessage({
          type: 'addLog',
          data: { level: 'warning', message: `Paste method failed (${e.message}), falling back to attach menu...` }
        }).catch(() => {});
      }
    }

    try {
      const inputs = document.querySelectorAll('input[type="file"]');
      const inputsInfo = Array.from(inputs).map(i => `accept="${i.getAttribute('accept') || ''}"`).join(' | ');
      chrome.runtime.sendMessage({
        type: 'addLog',
        data: { level: 'info', message: `Available file inputs: ${inputsInfo}` }
      }).catch(() => {});
    } catch (e) {}

    const attachButton = await waitForElement(SELECTORS.attachButton);
    if (!attachButton) {
      throw new Error('Attach button not found');
    }

    clickElement(attachButton);
    await sleep(500);

    const fileInput = await waitForFileInput(sendAsDocument);
    if (!fileInput) {
      throw new Error('File input not found');
    }

    try {
      chrome.runtime.sendMessage({
        type: 'addLog',
        data: { level: 'info', message: `Selected input with accept="${fileInput.getAttribute('accept') || ''}"` }
      }).catch(() => {});
    } catch (e) {}

    const file = await dataURLtoFile(media.data, media.name, media.type);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(2500);

    const sendBtn = await waitForElement(SELECTORS.sendButton, 15000);
    if (!sendBtn) {
      throw new Error('Media send button not found on preview screen');
    }

    clickElement(sendBtn);
    await sleep(2500);

    return true;
  }

  async function closeChat() {
    try {
      const chatHeader = findElement(SELECTORS.chatHeader);
      if (chatHeader) {
        const closeBtn = chatHeader.querySelector('[data-testid="x"], [aria-label="Close"], [data-icon="x"]');
        if (closeBtn) {
          clickElement(closeBtn);
          await sleep(300);
        }
      }
    } catch (e) {}
  }

  function checkForErrors() {
    let rateLimit = findElement(SELECTORS.rateLimitWarning);
    if (!rateLimit) {
      rateLimit = findElementByText('div', 'temporarily blocked') || findElementByText('div', 'rate limit');
    }
    if (rateLimit) {
      throw new Error('Rate limit detected: ' + rateLimit.textContent.trim());
    }

    let phoneError = findElement(SELECTORS.phoneNumberError);
    if (!phoneError) {
      phoneError = findElementByText('div', 'Phone number shared via url is invalid');
    }
    if (phoneError) {
      throw new Error('Invalid phone number: ' + phoneError.textContent.trim());
    }

    return null;
  }

  async function executeSendMessageOnly(task) {
    const {
      message,
      mediaFiles = [],
      config = {}
    } = task;

    const {
      autoCloseChat = true,
      humanTyping = true,
      sendMediaFirst = true,
      sendAsDocument = true,
      repetitionCount = 1
    } = config;

    try {
      const ready = await waitForWhatsAppReady();
      if (!ready) {
        throw new Error('WhatsApp Web page is loading or not ready.');
      }

      let messageInput = null;
      const waitStartTime = Date.now();
      while (Date.now() - waitStartTime < 10000) {
        messageInput = findElement(SELECTORS.messageInput);
        if (messageInput) break;

        checkForErrors();
        await sleep(200);
      }

      if (!messageInput) {
        checkForErrors();
        throw new Error('Chat message input box not found. The number might not have a WhatsApp account.');
      }

      if (mediaFiles.length > 0 && sendMediaFirst) {
        for (const media of mediaFiles) {
          await sendMediaMessage(media, { sendAsDocument });
          await sleep(1000);
        }
      }

      for (let i = 0; i < repetitionCount; i++) {
        if (message && message.trim()) {
          await sendTextMessage(message, { humanTyping });
          await sleep(500);
        }
      }

      if (mediaFiles.length > 0 && !sendMediaFirst) {
        for (const media of mediaFiles) {
          await sendMediaMessage(media, { sendAsDocument });
          await sleep(1000);
        }
      }

      if (autoCloseChat) {
        await closeChat();
      }

      return { success: true };
    } catch (error) {
      if (autoCloseChat) {
        try { await closeChat(); } catch (e) {}
      }
      throw error;
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'sendMessageOnly':
        executeSendMessageOnly(message.data)
          .then(result => sendResponse({ success: true, ...result }))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;

      case 'keepAlive':
        sendResponse({ success: true });
        break;

      case 'ping':
        sendResponse({ pong: true, url: window.location.href });
        break;
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[WA-Bulk Messagner] Content script loaded');
    });
  } else {
    console.log('[WA-Bulk Messagner] Content script loaded');
  }
})();
