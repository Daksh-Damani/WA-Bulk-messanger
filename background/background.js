chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      config: {
        minDelay: 3000,
        maxDelay: 8000,
        batchSize: 10,
        batchDelay: 30000,
        skipFailed: true,
        autoCloseChat: true,
        randomizeOrder: true,
        humanTyping: true,
        avoidRateLimit: true,
        pauseOnError: true,
        keepAlive: true,
        autoCloseOnComplete: true,
        saveSession: true,
        sendMediaFirst: true,
        compressMedia: false,
        sendAsDocument: false,
        userAgent: '',
        repetitionCount: 1
      }
    });

    chrome.tabs.create({
      url: chrome.runtime.getURL('popup/popup.html')
    });
  } else if (details.reason === 'update') {
    chrome.storage.local.get('config', (result) => {
      const config = result.config || {};
      if (config.sendAsDocument === true) {
        config.sendAsDocument = false;
        chrome.storage.local.set({ config });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'getConfig':
      chrome.storage.local.get('config', (result) => {
        sendResponse({ config: result.config || {} });
      });
      return true;

    case 'saveConfig':
      chrome.storage.local.set({ config: message.config }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'saveSession':
      saveSession(message.data);
      sendResponse({ success: true });
      return true;

    case 'getSession':
      chrome.storage.local.get('sessionData', (result) => {
        sendResponse({ session: result.sessionData || null });
      });
      return true;

    case 'clearSession':
      chrome.storage.local.remove('sessionData', () => {
        sendResponse({ success: true });
      });
      return true;

    case 'sendMessage':
      handleSendMessage(message.data, sender.tab ? sender.tab.id : null)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'pauseSending':
      isPaused = true;
      sendResponse({ success: true });
      return true;

    case 'resumeSending':
      isPaused = false;
      if (!isProcessing && messageQueue.length > 0) {
        processQueue();
      }
      sendResponse({ success: true });
      return true;

    case 'stopSending':
      messageQueue = [];
      isProcessing = false;
      isPaused = false;
      clearSession();
      sendResponse({ success: true });
      return true;

    case 'getQueueStatus':
      sendResponse({
        isProcessing: isProcessing,
        queueLength: messageQueue.length,
        isPaused: isPaused
      });
      return true;

    case 'clearQueue':
      messageQueue = [];
      sendResponse({ success: true });
      return true;

    case 'addLog':
      broadcastToPopups({ type: 'log', data: message.data });
      sendResponse({ success: true });
      return true;

    case 'clearLogs':
      chrome.storage.local.set({ logs: [] }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'log':
      broadcastToPopups({ type: 'log', data: message.data });
      break;

    case 'progress':
      broadcastToPopups({ type: 'progress', data: message.data });
      break;

    case 'complete':
      broadcastToPopups({ type: 'complete', data: message.data });
      break;

    case 'error':
      broadcastToPopups({ type: 'error', data: message.data });
      break;
  }
});

let messageQueue = [];
let isProcessing = false;
let isPaused = false;
let currentTabId = null;
let currentSessionId = null;
let sessionData = null;
let sentCount = 0;
let failedCount = 0;
let consecutiveErrors = 0;

async function handleSendMessage(data, tabId) {
  if (!tabId) {
    let tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*', lastFocusedWindow: true });
    let activeTab = tabs.find(t => t.active) || tabs[0];

    if (!activeTab) {
      const allTabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*', discarded: false });
      if (allTabs && allTabs.length > 0) {
        activeTab = allTabs.find(t => t.active) || allTabs[0];
      }
    }

    if (activeTab) {
      tabId = activeTab.id;
    } else {
      throw new Error('WhatsApp Web tab not found. Please open and login to web.whatsapp.com');
    }
  }

  currentTabId = tabId;
  currentSessionId = data.sessionId || generateSessionId();

  if (data.isResume && sessionData) {
    messageQueue = data.messages;
    sentCount = sessionData.sent || 0;
    failedCount = sessionData.failed || 0;
    consecutiveErrors = 0;
  } else {
    sentCount = 0;
    failedCount = 0;
    consecutiveErrors = 0;
    messageQueue = data.messages.map((msg, index) => ({
      ...msg,
      index: index,
      sessionId: currentSessionId,
      delay: data.delay || 3000,
      randomizeDelay: data.randomizeDelay !== false,
      minDelay: data.minDelay || 3000,
      maxDelay: data.maxDelay || 8000
    }));
  }

  sessionData = {
    id: currentSessionId,
    total: data.total || (messageQueue.length + sentCount),
    sent: sentCount,
    failed: failedCount,
    queue: messageQueue,
    messageTemplate: data.messageTemplate || '',
    mediaFiles: data.mediaFiles || [],
    config: data.config || {},
    saveSession: data.saveSession !== false,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    isActive: true
  };
  await chrome.storage.local.set({ sessionData });

  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue() {
  isProcessing = true;

  if (sessionData && sessionData.saveSession) {
    await saveSessionProgress();
  }

  while (messageQueue.length > 0) {
    if (isPaused) {
      await waitForResume();
      if (!isProcessing) break;
    }

    const task = messageQueue.shift();

    try {
      await verifyContentScriptActive(currentTabId);

      let oldPageLoadId = null;
      try {
        const oldRes = await sendMessageWithTimeout(currentTabId, { type: 'ping' }, 1000);
        if (oldRes && oldRes.pong) {
          oldPageLoadId = oldRes.pageLoadId;
        }
      } catch (e) {

      }

      let cleanPhone = task.phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }
      await chrome.tabs.update(currentTabId, { url: `https://web.whatsapp.com/send?phone=${cleanPhone}` });

      let ready = false;
      const startTime = Date.now();
      while (Date.now() - startTime < 20000) {
        try {
          const res = await sendMessageWithTimeout(currentTabId, { type: 'ping' }, 1000);
          if (res && res.pong) {
            if (res.pageLoadId !== oldPageLoadId || (res.url && res.url.includes(cleanPhone))) {
              ready = true;
              break;
            }
          }
        } catch (e) {

        }
        await sleep(1000);
      }

      if (!ready) {
        throw new Error('WhatsApp Web page transition timed out.');
      }

      const response = await sendMessageWithTimeout(currentTabId, {
        type: 'sendMessageOnly',
        data: task
      }, 40000);

      if (response && response.success) {
        sentCount++;
        consecutiveErrors = 0;

        broadcastToPopups({
          type: 'log',
          data: { level: 'success', message: `Successfully sent to ${task.phoneNumber}` }
        });

        broadcastToPopups({
          type: 'progress',
          data: {
            sent: sentCount,
            failed: failedCount,
            total: task.total,
            currentNumber: task.phoneNumber,
            currentIndex: task.index
          }
        });

        if (sessionData && sessionData.saveSession) {
          sessionData.sent = sentCount;
          sessionData.queue = messageQueue;
          await saveSessionProgress();
        }
      } else {
        const errorMsg = (response && response.error) ? response.error : 'Unknown content script failure';
        throw new Error(errorMsg);
      }

      if (messageQueue.length > 0) {
        const delay = calculateDelay(task);
        await sleep(delay);
      }
    } catch (error) {
      failedCount++;
      consecutiveErrors++;

      broadcastToPopups({
        type: 'log',
        data: { level: 'error', message: `Failed to send to ${task.phoneNumber}: ${error.message}` }
      });

      broadcastToPopups({
        type: 'progress',
        data: {
          sent: sentCount,
          failed: failedCount,
          total: task.total,
          currentNumber: task.phoneNumber,
          currentIndex: task.index
        }
      });

      if (sessionData && sessionData.saveSession) {
        sessionData.failed = failedCount;
        sessionData.queue = messageQueue;
        await saveSessionProgress();
      }

      if (task.config && task.config.pauseOnError && consecutiveErrors >= 3) {
        isPaused = true;
        broadcastToPopups({
          type: 'log',
          data: { level: 'warning', message: 'Sending paused automatically due to 3 consecutive errors.' }
        });
        broadcastToPopups({ type: 'sessionUpdate', data: { isPaused: true } });
      }

      if (messageQueue.length > 0 && !isPaused) {
        const delay = calculateDelay(task);
        await sleep(delay);
      }
    }
  }

  isProcessing = false;
  if (!isPaused) {
    broadcastToPopups({ type: 'complete' });

    if (sessionData && sessionData.saveSession) {
      await clearSession();
    }
  }
}

function calculateDelay(task) {
  if (!task.randomizeDelay) return task.delay;

  const min = task.minDelay;
  const max = task.maxDelay;
  return Math.random() * (max - min) + min;
}

async function waitForResume() {
  return new Promise(resolve => {
    const check = setInterval(() => {
      if (!isPaused) {
        clearInterval(check);
        resolve();
      }
    }, 500);
  });
}

async function saveSessionProgress() {
  if (!sessionData) return;

  sessionData.lastUpdated = Date.now();
  sessionData.queue = messageQueue;
  await chrome.storage.local.set({ sessionData });
}

async function saveSession(data) {
  sessionData = {
    id: data.sessionId || generateSessionId(),
    total: data.total,
    sent: data.sent || 0,
    failed: data.failed || 0,
    queue: data.queue || [],
    messageTemplate: data.messageTemplate,
    mediaFiles: data.mediaFiles || [],
    config: data.config || {},
    saveSession: data.saveSession !== false,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    isActive: true
  };

  await chrome.storage.local.set({ sessionData });
}

async function clearSession() {
  sessionData = null;
  await chrome.storage.local.remove('sessionData');
}

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function broadcastToPopups(message) {
  if (message.type === 'log') {
    const logEntry = {
      timestamp: message.data.timestamp || new Date().toISOString(),
      level: message.data.level || 'info',
      message: message.data.message
    };
    chrome.storage.local.get({ logs: [] }, (result) => {
      const logs = result.logs || [];
      logs.unshift(logEntry);
      if (logs.length > 500) logs.pop();
      chrome.storage.local.set({ logs }, () => {
        chrome.runtime.sendMessage({ type: 'log', data: logEntry }).catch(() => {});
      });
    });
  } else {
    chrome.runtime.sendMessage(message).catch(() => {});
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.status === 'complete') {
    if (tab.url && tab.url.includes('web.whatsapp.com')) {
      setTimeout(() => {
        if (!isProcessing && messageQueue.length > 0) {
          processQueue();
        }
      }, 2000);
    }
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url && tabs[0].url.includes('web.whatsapp.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'keepAlive' }).catch(() => {});
      }
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
});

chrome.runtime.onSuspend.addListener(() => {
  chrome.alarms.clear('keepAlive');
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onDisconnect.addListener(() => {});
  }
});

function sendMessageWithTimeout(tabId, message, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => {
      timer = null;
      reject(new Error('Timeout waiting for response from WhatsApp Web tab.'));
    }, timeout);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (timer) {
        clearTimeout(timer);
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
        } else {
          resolve(response);
        }
      }
    });
  });
}

async function verifyContentScriptActive(tabId) {
  try {
    const response = await sendMessageWithTimeout(tabId, { type: 'ping' }, 2000);
    if (response && response.pong) {
      return true;
    }
  } catch (e) {
    console.warn('Ping failed', e);
  }
  throw new Error('Extension is not active on this tab. Please reload the WhatsApp Web tab to activate it.');
}
