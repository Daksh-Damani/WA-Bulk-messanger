(() => {
  'use strict';

  const state = {
    phoneNumbers: [],
    messageTemplate: '',
    mediaFiles: [],
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
    },
    isRunning: false,
    isPaused: false,
    stats: { sent: 0, failed: 0, pending: 0, current: null },
    logs: [],
    currentIndex: 0,
    sessionId: null,
    sessionData: null,
    consecutiveErrors: 0,
    welcomeShown: false
  };

  const elements = {};

  function initElements() {
    elements.phoneNumbers = document.getElementById('phoneNumbers');
    elements.messageContent = document.getElementById('messageContent');
    elements.repetitionCount = document.getElementById('repetitionCount');
    elements.minDelay = document.getElementById('minDelay');
    elements.maxDelay = document.getElementById('maxDelay');
    elements.batchSize = document.getElementById('batchSize');
    elements.batchDelay = document.getElementById('batchDelay');
    elements.validCount = document.getElementById('validCount');
    elements.invalidCount = document.getElementById('invalidCount');
    elements.messageCharCount = document.getElementById('messageCharCount');
    elements.mediaInput = document.getElementById('mediaInput');
    elements.dropZone = document.getElementById('dropZone');
    elements.mediaList = document.getElementById('mediaList');
    elements.mediaInfo = document.getElementById('mediaInfo');
    elements.sendMediaFirst = document.getElementById('sendMediaFirst');
    elements.compressMedia = document.getElementById('compressMedia');
    elements.sendAsDocument = document.getElementById('sendAsDocument');
    elements.skipFailed = document.getElementById('skipFailed');
    elements.autoCloseChat = document.getElementById('autoCloseChat');
    elements.randomizeOrder = document.getElementById('randomizeOrder');
    elements.humanTyping = document.getElementById('humanTyping');
    elements.avoidRateLimit = document.getElementById('avoidRateLimit');
    elements.pauseOnError = document.getElementById('pauseOnError');
    elements.keepAlive = document.getElementById('keepAlive');
    elements.autoCloseOnComplete = document.getElementById('autoCloseOnComplete');
    elements.saveSession = document.getElementById('saveSession');
    elements.userAgent = document.getElementById('userAgent');
    elements.validateBtn = document.getElementById('validateBtnMain');
    elements.startBtn = document.getElementById('startBtn');
    elements.pauseBtn = document.getElementById('pauseBtn');
    elements.resumeBtn = document.getElementById('resumeBtn');
    elements.stopBtn = document.getElementById('stopBtn');
    elements.progressSection = document.getElementById('progressSection');
    elements.progressBar = document.getElementById('progressBar');
    elements.progressStats = document.getElementById('progressStats');
    elements.sentCount = document.getElementById('sentCount');
    elements.failedCount = document.getElementById('failedCount');
    elements.pendingCount = document.getElementById('pendingCount');
    elements.currentNumber = document.getElementById('currentNumber');
    elements.statusIndicator = document.getElementById('statusIndicator');
    elements.statusText = document.getElementById('statusText');
    elements.logContainer = document.getElementById('logContainer');
    elements.logFilter = document.getElementById('logFilter');
    elements.clearLogsBtn = document.getElementById('clearLogsBtn');
    elements.tabBtns = document.querySelectorAll('.tab-btn');
    elements.tabPanes = document.querySelectorAll('.tab-pane');
    elements.previewModal = document.getElementById('previewModal');
    elements.closePreview = document.getElementById('closePreview');
    elements.previewHeader = document.getElementById('previewHeader');
    elements.previewBody = document.getElementById('previewBody');
    elements.previewMedia = document.getElementById('previewMedia');
    elements.loadMessageBtn = document.getElementById('loadMessageBtn');
    elements.clearMessageBtn = document.getElementById('clearMessageBtn');
    elements.previewMessageBtn = document.getElementById('previewMessageBtn');
    elements.saveConfigBtn = document.getElementById('saveConfigBtn');
    elements.loadConfigBtn = document.getElementById('loadConfigBtn');
    elements.loadConfigInput = document.getElementById('loadConfigInput');
    elements.exportLogBtn = document.getElementById('exportLogBtn');
    elements.exportCsvBtn = document.getElementById('exportCsvBtn');
    elements.clearAllBtn = document.getElementById('clearAllBtn');
    elements.presetBtns = document.querySelectorAll('.btn-preset');
    elements.welcomeScreen = document.getElementById('welcomeScreen');
    elements.mainContent = document.getElementById('mainContent');
    elements.welcomeStart = document.getElementById('welcomeStart');
    elements.welcomeTour = document.getElementById('welcomeTour');
    elements.csvFile = document.getElementById('csvFile');
    elements.loadCsvBtn = document.getElementById('loadCsvBtn');
    elements.clearNumbersBtn = document.getElementById('clearNumbersBtn');
  }

  function initEventListeners() {
    elements.phoneNumbers.addEventListener('input', updateNumberCount);
    elements.messageContent.addEventListener('input', updateMessagePreview);
    elements.repetitionCount.addEventListener('input', updateRepetitionCount);
    elements.minDelay.addEventListener('input', updateDelayConfig);
    elements.maxDelay.addEventListener('input', updateDelayConfig);
    elements.batchSize.addEventListener('input', updateBatchConfig);
    elements.batchDelay.addEventListener('input', updateBatchConfig);

    elements.mediaInput.addEventListener('change', handleMediaSelect);
    elements.loadCsvBtn.addEventListener('click', () => elements.csvFile.click());
    elements.csvFile.addEventListener('change', handleCsvLoad);
    elements.dropZone.addEventListener('click', () => elements.mediaInput.click());
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        elements.mediaInput.click();
      }
    });

    elements.sendMediaFirst.addEventListener('change', updateMediaConfig);
    elements.compressMedia.addEventListener('change', updateMediaConfig);
    elements.sendAsDocument.addEventListener('change', updateMediaConfig);

    elements.skipFailed.addEventListener('change', updateSendingConfig);
    elements.autoCloseChat.addEventListener('change', updateSendingConfig);
    elements.randomizeOrder.addEventListener('change', updateSendingConfig);
    elements.humanTyping.addEventListener('change', updateSendingConfig);
    elements.avoidRateLimit.addEventListener('change', updateSendingConfig);
    elements.pauseOnError.addEventListener('change', updateSendingConfig);
    elements.keepAlive.addEventListener('change', updateBrowserConfig);
    elements.autoCloseOnComplete.addEventListener('change', updateBrowserConfig);
    elements.saveSession.addEventListener('change', updateBrowserConfig);
    elements.userAgent.addEventListener('input', updateBrowserConfig);

    elements.validateBtn.addEventListener('click', validateNumbers);
    elements.clearNumbersBtn.addEventListener('click', clearNumbers);
    elements.startBtn.addEventListener('click', startSending);
    elements.pauseBtn.addEventListener('click', pauseSending);
    elements.resumeBtn.addEventListener('click', resumeSending);
    elements.stopBtn.addEventListener('click', stopSending);

    elements.logFilter.addEventListener('change', filterLogs);
    elements.clearLogsBtn.addEventListener('click', clearLogs);

    elements.loadMessageBtn.addEventListener('click', loadMessageTemplate);
    elements.clearMessageBtn.addEventListener('click', clearMessage);
    elements.previewMessageBtn.addEventListener('click', showPreview);
    elements.closePreview.addEventListener('click', closePreview);
    elements.previewModal.addEventListener('click', (e) => {
      if (e.target === elements.previewModal) closePreview();
    });

    elements.saveConfigBtn.addEventListener('click', saveConfiguration);
    elements.loadConfigBtn.addEventListener('click', () => {
      elements.loadConfigInput.click();
    });
    elements.loadConfigInput.addEventListener('change', loadConfiguration);
    elements.exportLogBtn.addEventListener('click', exportLogs);
    elements.exportCsvBtn.addEventListener('click', exportResultsCsv);
    elements.clearAllBtn.addEventListener('click', clearAllData);

    elements.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => applyDelayPreset(btn.dataset.preset));
    });

    elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (elements.welcomeStart) {
      elements.welcomeStart.addEventListener('click', () => {
        hideWelcomeScreen();
        loadSavedData();
      });
    }
    if (elements.welcomeTour) {
      elements.welcomeTour.addEventListener('click', () => {
        hideWelcomeScreen();
        startQuickTour();
      });
    }

    document.addEventListener('keydown', handleKeyboardShortcuts);
    chrome.runtime.onMessage.addListener(handleMessage);

    chrome.storage.local.get(['welcomeShown'], (result) => {
      state.welcomeShown = result.welcomeShown || false;
      if (!state.welcomeShown) {
        showWelcomeScreen();
      } else {
        hideWelcomeScreen();
        showMainContent();
        loadSavedData();
      }
    });

    chrome.runtime.sendMessage({ type: 'getConfig' }, (response) => {
      if (response && response.config) {
        state.config = { ...state.config, ...response.config };
        applyConfigToUI();
      }
    });

    checkForExistingSession();
  }

  function handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') closePreview();
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          saveConfiguration();
          break;
        case 'enter':
          e.preventDefault();
          if (!state.isRunning && !state.isPaused) startSending();
          break;
        case ' ':
          e.preventDefault();
          if (state.isRunning && !state.isPaused) pauseSending();
          else if (state.isPaused) resumeSending();
          break;
        case 'e':
          e.preventDefault();
          exportLogs();
          break;
      }
    }
    if (e.key === 'F1') {
      e.preventDefault();
      switchTab('settings');
    }
  }

  function showWelcomeScreen() {
    if (elements.welcomeScreen) {
      elements.welcomeScreen.style.display = 'flex';
    }
    if (elements.mainContent) {
      elements.mainContent.style.display = 'none';
    }
  }

  function hideWelcomeScreen() {
    if (elements.welcomeScreen) {
      elements.welcomeScreen.style.display = 'none';
    }
    state.welcomeShown = true;
    chrome.storage.local.set({ welcomeShown: true });
  }

  function showMainContent() {
    if (elements.mainContent) {
      elements.mainContent.style.display = 'block';
    }
  }

  function startQuickTour() {
    const steps = [
      { element: elements.phoneNumbers, title: 'Phone Numbers', text: 'Enter numbers one per line or comma-separated. Include country code (+1, +91, +44).', position: 'right' },
      { element: elements.messageContent, title: 'Message Template', text: 'Write your message. Use {{name}}, {{number}}, {{date}}, {{time}} for personalization.', position: 'right' },
      { element: elements.dropZone, title: 'Media Attachments', text: 'Drag & drop images, videos, PDFs, or documents. Max 10 files, 16MB each.', position: 'left' },
      { element: elements.minDelay, title: 'Delays', text: 'Set min/max delay between messages. Use presets for safe sending.', position: 'right' },
      { element: elements.startBtn, title: 'Start Sending', text: 'Click to begin. You can pause, resume, or stop anytime.', position: 'top' }
    ];

    let currentStep = 0;

    function showStep(step) {
      if (!step || !step.element) {
        endTour();
        return;
      }
      document.querySelectorAll('.tour-overlay, .tour-tooltip').forEach(el => el.remove());

      const overlay = document.createElement('div');
      overlay.className = 'tour-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9998;';
      document.body.appendChild(overlay);

      const tooltip = document.createElement('div');
      tooltip.className = 'tour-tooltip';
      tooltip.style.cssText = `
        position:fixed;z-index:9999;background:var(--bg-primary);border:1px solid var(--border-color);
        border-radius:var(--radius-md);padding:16px;max-width:280px;box-shadow:var(--shadow-lg);
        font-size:13px;color:var(--text-primary);
      `;

      const rect = step.element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top, left;
      if (step.position === 'right') {
        top = rect.top + rect.height / 2 - 60;
        left = rect.right + 12;
      } else if (step.position === 'left') {
        top = rect.top + rect.height / 2 - 60;
        left = rect.left - 300;
      } else {
        top = rect.top - 140;
        left = rect.left + rect.width / 2 - 140;
      }

      top = Math.max(10, Math.min(top, viewportHeight - 150));
      left = Math.max(10, Math.min(left, viewportWidth - 300));

      tooltip.style.top = top + 'px';
      tooltip.style.left = left + 'px';

      tooltip.innerHTML = `
        <div style="font-weight:700;margin-bottom:6px;font-size:14px;color:var(--accent-primary);">${step.title}</div>
        <div style="color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">${step.text}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          ${currentStep > 0 ? '<button class="btn btn-secondary btn-small" id="tourPrev">Back</button>' : ''}
          ${currentStep < steps.length - 1 ? '<button class="btn btn-primary btn-small" id="tourNext">Next</button>' : '<button class="btn btn-primary btn-small" id="tourDone">Done</button>'}
          <button class="btn btn-secondary btn-small" id="tourSkip">Skip</button>
        </div>
      `;

      document.body.appendChild(tooltip);

      step.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      step.element.style.boxShadow = '0 0 0 3px var(--accent-primary)';

      document.getElementById('tourNext')?.addEventListener('click', () => {
        step.element.style.boxShadow = '';
        currentStep++;
        showStep(steps[currentStep]);
      });
      document.getElementById('tourPrev')?.addEventListener('click', () => {
        step.element.style.boxShadow = '';
        currentStep--;
        showStep(steps[currentStep]);
      });
      document.getElementById('tourDone')?.addEventListener('click', () => {
        step.element.style.boxShadow = '';
        endTour();
      });
      document.getElementById('tourSkip')?.addEventListener('click', endTour);
      overlay.addEventListener('click', endTour);
    }

    function endTour() {
      document.querySelectorAll('.tour-overlay, .tour-tooltip').forEach(el => el.remove());
      document.querySelectorAll('[style*="box-shadow: 0 0 0 3px"]').forEach(el => el.style.boxShadow = '');
      loadSavedData();
    }

    showMainContent();
    showStep(0);
  }

  function loadSavedData() {
    chrome.storage.local.get(['phoneNumbersRaw', 'phoneNumbers', 'messageTemplate', 'mediaFiles', 'config', 'logs'], (result) => {
      if (result.phoneNumbersRaw !== undefined) {
        elements.phoneNumbers.value = result.phoneNumbersRaw;
        updateNumberCount();
      } else if (result.phoneNumbers && result.phoneNumbers.length > 0) {
        state.phoneNumbers = result.phoneNumbers;
        elements.phoneNumbers.value = result.phoneNumbers.join('\n');
        updateNumberCount();
      }
      if (result.messageTemplate) {
        state.messageTemplate = result.messageTemplate;
        elements.messageContent.value = result.messageTemplate;
        updateMessagePreview();
      }
      if (result.mediaFiles && result.mediaFiles.length > 0) {
        state.mediaFiles = result.mediaFiles;
        renderMediaList();
      }
      if (result.config) {
        state.config = { ...state.config, ...result.config };
        applyConfigToUI();
      }
      if (result.logs && result.logs.length > 0) {
        state.logs = result.logs;
        renderLogs();
      }
    });
  }

  function checkForExistingSession() {
    chrome.runtime.sendMessage({ type: 'getQueueStatus' }, (response) => {
      if (response && response.isProcessing) {
        state.isRunning = true;
        state.isPaused = response.isPaused;
        
        chrome.storage.local.get(['sessionData'], (result) => {
          if (result.sessionData) {
            const session = result.sessionData;
            state.sessionId = session.id;
            state.stats = {
              sent: session.sent || 0,
              failed: session.failed || 0,
              pending: session.queue ? session.queue.length : 0,
              current: null
            };
            state.currentIndex = session.sent || 0;
            state.messageTemplate = session.messageTemplate || '';
            state.mediaFiles = session.mediaFiles || [];
            state.config = { ...state.config, ...session.config };
            
            if (session.queue) {
              state.phoneNumbers = session.queue.map(t => t.phoneNumber);
              elements.phoneNumbers.value = state.phoneNumbers.join('\n');
            }
            
            elements.messageContent.value = state.messageTemplate;
            
            updateNumberCount();
            updateMessagePreview();
            renderMediaList();
            applyConfigToUI();
            
            updateUIForRunning(true);
            if (state.isPaused) {
              updateUIForPaused(true);
              setStatus('paused', 'Paused');
            } else {
              setStatus('sending', 'Sending...');
            }
            updateProgress({
              sent: state.stats.sent,
              failed: state.stats.failed,
              currentIndex: state.currentIndex
            });
          }
        });
      } else {
        chrome.storage.local.get(['sessionData'], (result) => {
          if (result.sessionData && result.sessionData.isActive) {
            state.sessionData = result.sessionData;
            showResumeSessionPrompt();
          }
        });
      }
    });
  }

  function showResumeSessionPrompt() {
    if (!state.sessionData) return;

    const session = state.sessionData;
    const pending = session.total - session.sent - session.failed;

    const promptHtml = `
      <div class="session-resume-prompt" style="
        position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);
        z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;
      ">
        <div style="background:var(--bg-primary);border-radius:var(--radius-lg);padding:24px;max-width:380px;width:100%;box-shadow:var(--shadow-lg);border:1px solid var(--border-color);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,var(--warning),var(--accent-secondary));border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2v20M17 12H7"></path></svg>
            </div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);">Resume Previous Session?</h3>
          </div>
          <p style="color:var(--text-secondary);margin-bottom:16px;font-size:13px;">You have an incomplete session with <strong>${pending}</strong> messages pending (${session.sent} sent, ${session.failed} failed).</p>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" id="resumeSessionBtn" style="flex:1;">Resume Session</button>
            <button class="btn btn-secondary" id="discardSessionBtn" style="flex:1;">Start Fresh</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', promptHtml);

    document.getElementById('resumeSessionBtn').addEventListener('click', () => {
      resumeSession();
      document.querySelector('.session-resume-prompt').remove();
    });

    document.getElementById('discardSessionBtn').addEventListener('click', () => {
      chrome.storage.local.remove('sessionData');
      document.querySelector('.session-resume-prompt').remove();
    });
  }

  function resumeSession() {
    if (!state.sessionData) return;

    const session = state.sessionData;
    const queue = session.queue || [];
    state.phoneNumbers = queue.map(t => t.phoneNumber);
    if (state.phoneNumbers.length === 0 && session.pendingNumbers) {
      state.phoneNumbers = session.pendingNumbers;
    }
    state.messageTemplate = session.messageTemplate;
    state.mediaFiles = session.mediaFiles || [];
    state.config = { ...state.config, ...session.config };
    state.stats = { sent: session.sent, failed: session.failed, pending: state.phoneNumbers.length, current: null };
    state.currentIndex = session.sent;
    state.isRunning = true;
    state.isPaused = false;

    elements.phoneNumbers.value = state.phoneNumbers.join('\n');
    elements.messageContent.value = state.messageTemplate;
    updateNumberCount();
    updateMessagePreview();
    renderMediaList();
    applyConfigToUI();

    updateUIForRunning(true);
    addLog({ level: 'info', message: `Resuming session: ${state.phoneNumbers.length} pending numbers` });

    let messages = [];
    if (session.queue && session.queue.length > 0) {
      messages = session.queue;
    } else {
      messages = state.phoneNumbers.map((phoneNumber, index) => ({
        phoneNumber,
        message: state.messageTemplate,
        mediaFiles: state.mediaFiles,
        delay: state.config.minDelay,
        randomizeDelay: true,
        minDelay: state.config.minDelay,
        maxDelay: state.config.maxDelay,
        index: state.currentIndex + index,
        total: session.total,
        config: {
          skipFailed: state.config.skipFailed,
          autoCloseChat: state.config.autoCloseChat,
          humanTyping: state.config.humanTyping,
          avoidRateLimit: state.config.avoidRateLimit,
          sendMediaFirst: state.config.sendMediaFirst,
          sendAsDocument: state.config.sendAsDocument,
          repetitionCount: state.config.repetitionCount,
          pauseOnError: state.config.pauseOnError
        }
      }));
    }

    try {
      chrome.runtime.sendMessage({
        type: 'sendMessage',
        data: {
          messages,
          sessionId: session.id,
          isResume: true,
          messageTemplate: session.messageTemplate,
          mediaFiles: session.mediaFiles,
          config: session.config,
          total: session.total
        }
      }, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          appendLogToStateAndUI({ level: 'error', message: `Communication error: ${err.message}` });
          updateUIForRunning(false);
        } else if (response && !response.success) {
          appendLogToStateAndUI({ level: 'error', message: `Resume failed: ${response.error || 'Unknown error'}` });
          updateUIForRunning(false);
        }
      });
    } catch (error) {
      appendLogToStateAndUI({ level: 'error', message: `Communication error: ${error.message}` });
      updateUIForRunning(false);
    }
  }

  function applyConfigToUI() {
    elements.minDelay.value = state.config.minDelay;
    elements.maxDelay.value = state.config.maxDelay;
    elements.batchSize.value = state.config.batchSize;
    elements.batchDelay.value = state.config.batchDelay;
    elements.repetitionCount.value = state.config.repetitionCount;

    elements.skipFailed.checked = state.config.skipFailed;
    elements.autoCloseChat.checked = state.config.autoCloseChat;
    elements.randomizeOrder.checked = state.config.randomizeOrder;
    elements.humanTyping.checked = state.config.humanTyping;
    elements.avoidRateLimit.checked = state.config.avoidRateLimit;
    elements.pauseOnError.checked = state.config.pauseOnError;
    elements.keepAlive.checked = state.config.keepAlive;
    elements.autoCloseOnComplete.checked = state.config.autoCloseOnComplete;
    elements.saveSession.checked = state.config.saveSession;
    elements.userAgent.value = state.config.userAgent || '';

    elements.sendMediaFirst.checked = state.config.sendMediaFirst;
    elements.compressMedia.checked = state.config.compressMedia;
    elements.sendAsDocument.checked = state.config.sendAsDocument;

    updateDelayConfig();
    updateBatchConfig();
  }

  function updateDelayConfig() {
    state.config.minDelay = parseInt(elements.minDelay.value) || 3000;
    state.config.maxDelay = parseInt(elements.maxDelay.value) || 8000;
    if (state.config.minDelay > state.config.maxDelay) {
      state.config.minDelay = state.config.maxDelay;
      elements.minDelay.value = state.config.minDelay;
    }
  }

  function updateBatchConfig() {
    state.config.batchSize = parseInt(elements.batchSize.value) || 10;
    state.config.batchDelay = parseInt(elements.batchDelay.value) || 30000;
  }

  function updateRepetitionCount() {
    state.config.repetitionCount = parseInt(elements.repetitionCount.value) || 1;
  }

  function updateMediaConfig() {
    state.config.sendMediaFirst = elements.sendMediaFirst.checked;
    state.config.compressMedia = elements.compressMedia.checked;
    state.config.sendAsDocument = elements.sendAsDocument.checked;
  }

  function updateSendingConfig() {
    state.config.skipFailed = elements.skipFailed.checked;
    state.config.autoCloseChat = elements.autoCloseChat.checked;
    state.config.randomizeOrder = elements.randomizeOrder.checked;
    state.config.humanTyping = elements.humanTyping.checked;
    state.config.avoidRateLimit = elements.avoidRateLimit.checked;
    state.config.pauseOnError = elements.pauseOnError.checked;
  }

  function updateBrowserConfig() {
    state.config.keepAlive = elements.keepAlive.checked;
    state.config.autoCloseOnComplete = elements.autoCloseOnComplete.checked;
    state.config.saveSession = elements.saveSession.checked;
    state.config.userAgent = elements.userAgent.value.trim();
  }

  function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'progress':
        updateProgress(message.data);
        break;
      case 'log':
        appendLogToStateAndUI(message.data);
        break;
      case 'complete':
        sendingComplete(message.data);
        break;
      case 'error':
        appendLogToStateAndUI({ level: 'error', message: message.data.message });
        break;
      case 'sessionUpdate':
        updateSession(message.data);
        break;
    }
  }

  function updateNumberCount() {
    const text = elements.phoneNumbers.value;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const valid = lines.filter(isValidPhoneNumber);
    state.phoneNumbers = valid;

    elements.validCount.textContent = `${valid.length} valid`;
    elements.invalidCount.textContent = `${lines.length - valid.length} invalid`;
    elements.invalidCount.style.color = lines.length - valid.length > 0 ? 'var(--danger)' : 'var(--text-muted)';

    chrome.storage.local.set({ phoneNumbersRaw: text, phoneNumbers: valid });
  }

  function isValidPhoneNumber(phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return /^\+?[1-9]\d{7,14}$/.test(cleaned);
  }

  function validateNumbers() {
    updateNumberCount();
    const invalid = elements.phoneNumbers.value.split('\n').map(l => l.trim()).filter(l => l).length - state.phoneNumbers.length;
    addLog({ level: 'success', message: `Validated: ${state.phoneNumbers.length} valid, ${invalid} invalid numbers` });
    showToast(`${state.phoneNumbers.length} valid numbers`, 'success');
  }

  function updateMessagePreview() {
    state.messageTemplate = elements.messageContent.value;
    elements.messageCharCount.textContent = `${state.messageTemplate.length} characters`;
    chrome.storage.local.set({ messageTemplate: state.messageTemplate });
  }

  function showPreview() {
    const previewLine = state.phoneNumbers[0] || '+1234567890';
    const [rawPhone, ...nameParts] = previewLine.split(',');
    const name = nameParts.join(',').trim() || 'John Doe';
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '') || '+1234567890';

    let preview = state.messageTemplate
      .replace(/\{\{name\}\}/gi, name)
      .replace(/\{\{number\}\}/gi, cleanPhone)
      .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString())
      .replace(/\{\{time\}\}/gi, new Date().toLocaleTimeString());

    elements.previewHeader.textContent = `Preview for: ${cleanPhone}`;
    elements.previewBody.innerHTML = escapeHtml(preview).replace(/\n/g, '<br>');

    if (state.mediaFiles.length > 0) {
      elements.previewMedia.innerHTML = state.mediaFiles.map(f => `
        <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-size:11px;color:var(--text-secondary);">
          ${getFileIcon(f.type)} ${escapeHtml(f.name)} (${formatFileSize(f.size)})
        </div>
      `).join('');
    } else {
      elements.previewMedia.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">No media attached</span>';
    }

    elements.previewModal.style.display = 'flex';
  }

  function closePreview() {
    elements.previewModal.style.display = 'none';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getFileIcon(type) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function handleMediaSelect(e) {
    if (state.isRunning) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (state.mediaFiles.length >= 10) break;
      if (file.size > 16 * 1024 * 1024 && !state.config.compressMedia) {
        addLog({ level: 'warning', message: `${file.name} is larger than 16MB. Enable auto-compress or send as document.` });
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        state.mediaFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result
        });
        renderMediaList();
      };
      reader.readAsDataURL(file);
    }
    elements.mediaInput.value = '';
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state.isRunning) return;
    elements.dropZone.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('drag-over');
    if (state.isRunning) return;
    const files = Array.from(e.dataTransfer.files);
    const fileInput = elements.mediaInput;
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    fileInput.files = dt.files;
    handleMediaSelect({ target: { files: dt.files } });
  }

  function renderMediaList() {
    elements.mediaList.innerHTML = state.mediaFiles.map((file, i) => `
      <div class="media-item" role="listitem">
        <span class="media-icon">${getFileIcon(file.type)}</span>
        <span class="media-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
        <span class="media-size">${formatFileSize(file.size)}</span>
        <button class="media-remove" data-index="${i}" aria-label="Remove ${escapeHtml(file.name)}">✕</button>
      </div>
    `).join('');

    elements.mediaList.querySelectorAll('.media-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        state.mediaFiles.splice(idx, 1);
        renderMediaList();
      });
    });

    if (state.mediaFiles.length > 0) {
      const totalSize = state.mediaFiles.reduce((sum, f) => sum + f.size, 0);
      elements.mediaInfo.textContent = `${state.mediaFiles.length} file(s), ${formatFileSize(totalSize)} total`;
      elements.mediaInfo.style.color = 'var(--text-secondary)';
    } else {
      elements.mediaInfo.textContent = 'No files selected. Max 10 files, 16MB each.';
      elements.mediaInfo.style.color = 'var(--text-muted)';
    }
  }

  function loadMessageTemplate() {
    const templates = [
      "Hello {{name}}, welcome to our service! 🎉",
      "Hi {{name}}, just wanted to let you know about our new offer. Check it out!",
      "Hey {{name}}, your order #{{number}} has been shipped. Track it here: [link]",
      "Good {{time}}, {{name}}! Reminder: your appointment is on {{date}}.",
      "Hello {{name}}, thank you for joining us! Here's a special gift: [link]"
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    elements.messageContent.value = template;
    state.messageTemplate = template;
    updateMessagePreview();
    addLog({ level: 'info', message: 'Template loaded' });
  }

  function clearMessage() {
    elements.messageContent.value = '';
    state.messageTemplate = '';
    updateMessagePreview();
  }

  function applyDelayPreset(preset) {
    const presets = {
      fast: { min: 1000, max: 3000 },
      normal: { min: 3000, max: 8000 },
      safe: { min: 5000, max: 15000 },
      stealth: { min: 10000, max: 30000 }
    };

    const p = presets[preset];
    if (p) {
      elements.minDelay.value = p.min;
      elements.maxDelay.value = p.max;
      updateDelayConfig();

      elements.presetBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.preset === preset));
      addLog({ level: 'info', message: `Applied ${preset} delay preset (${p.min}-${p.max}ms)` });
      showToast(`Applied ${preset} preset`, 'success');
    }
  }

  function switchTab(tabName) {
    elements.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    elements.tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === tabName + '-tab'));
  }

  function addLog(entry) {
    chrome.runtime.sendMessage({ type: 'addLog', data: entry });
  }

  function appendLogToStateAndUI(entry) {
    const logEntry = {
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      level: entry.level || 'info',
      message: entry.message
    };
    state.logs.unshift(logEntry);
    if (state.logs.length > 500) state.logs.pop();
    renderLogs();
  }

  function renderLogs() {
    const filter = elements.logFilter.value;
    const filtered = filter === 'all'
      ? state.logs
      : state.logs.filter(l => l.level === filter);

    elements.logContainer.innerHTML = filtered.map(log => {
      const timeObj = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      return `
        <div class="log-entry ${log.level}">
          <span class="log-time">${timeObj.toLocaleTimeString()}</span>
          <span class="log-level">${log.level.toUpperCase()}</span>
          <span class="log-message">${escapeHtml(log.message)}</span>
        </div>
      `;
    }).join('');
  }

  function filterLogs() {
    renderLogs();
  }

  function clearLogs() {
    chrome.runtime.sendMessage({ type: 'clearLogs' }, () => {
      state.logs = [];
      renderLogs();
    });
  }

  function updateProgress(data) {
    state.stats = { ...state.stats, ...data };
    state.currentIndex = data.currentIndex || 0;

    const total = state.stats.total || state.phoneNumbers.length;
    const sent = state.stats.sent || 0;
    const failed = state.stats.failed || 0;
    const pending = total - sent - failed;

    elements.progressSection.style.display = 'block';
    elements.progressBar.style.width = total > 0 ? ((sent + failed) / total * 100) + '%' : '0%';
    elements.progressStats.textContent = `${sent + failed} / ${total} processed`;
    elements.sentCount.textContent = `Sent: ${sent}`;
    elements.failedCount.textContent = `Failed: ${failed}`;
    elements.pendingCount.textContent = `Pending: ${pending}`;
    elements.currentNumber.textContent = `Current: ${data.currentNumber || '-'}`;

    if (data.currentNumber) {
      setStatus('sending', `Sending to ${data.currentNumber}...`);
    }
  }

  function setStatus(type, text) {
    elements.statusIndicator.className = 'status-indicator ' + type;
    elements.statusText.textContent = text;
  }

  function updateUIForRunning(running) {
    elements.startBtn.style.display = running ? 'none' : 'inline-flex';
    elements.pauseBtn.style.display = running && !state.isPaused ? 'inline-flex' : 'none';
    elements.resumeBtn.style.display = running && state.isPaused ? 'inline-flex' : 'none';
    elements.stopBtn.style.display = running ? 'inline-flex' : 'none';
    elements.validateBtn.style.display = running ? 'none' : 'inline-flex';
    elements.phoneNumbers.disabled = running;
    elements.messageContent.disabled = running;
    elements.mediaInput.disabled = running;
    elements.minDelay.disabled = running;
    elements.maxDelay.disabled = running;
  }

  function updateUIForPaused(paused) {
    elements.pauseBtn.style.display = paused ? 'none' : 'inline-flex';
    elements.resumeBtn.style.display = paused ? 'inline-flex' : 'none';
  }

  async function startSending() {
    if (state.isRunning) return;

    state.messageTemplate = elements.messageContent.value;

    if (state.phoneNumbers.length === 0) {
      addLog({ level: 'error', message: 'No phone numbers loaded' });
      showToast('No phone numbers loaded', 'error');
      elements.phoneNumbers.focus();
      return;
    }

    if (!state.messageTemplate.trim()) {
      addLog({ level: 'error', message: 'Message template is empty' });
      showToast('Message template is empty', 'error');
      elements.messageContent.focus();
      return;
    }

    if (state.config.minDelay < 1000 && !state.config.avoidRateLimit) {
      const confirm = window.confirm('Min delay is less than 1 second. This may trigger WhatsApp rate limits. Continue anyway?');
      if (!confirm) return;
    }

    let numbers = [...state.phoneNumbers];
    if (state.config.randomizeOrder) {
      numbers = shuffleArray(numbers);
    }

    state.isRunning = true;
    state.isPaused = false;
    state.stats = { sent: 0, failed: 0, pending: numbers.length, current: null };
    state.currentIndex = 0;
    state.consecutiveErrors = 0;
    state.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    updateUIForRunning(true);
    addLog({ level: 'success', message: `Starting to send to ${numbers.length} numbers` });
    setStatus('sending', 'Starting...');

    const messages = numbers.map((rawLine, index) => {
      const [rawPhone, ...nameParts] = rawLine.split(',');
      const name = nameParts.join(',').trim();
      const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

      let personalizedMessage = state.messageTemplate
        .replace(/\{\{name\}\}/gi, name || cleanPhone)
        .replace(/\{\{number\}\}/gi, cleanPhone)
        .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString())
        .replace(/\{\{time\}\}/gi, new Date().toLocaleTimeString());

      return {
        phoneNumber: cleanPhone,
        message: personalizedMessage,
        mediaFiles: state.mediaFiles,
        delay: state.config.minDelay,
        randomizeDelay: true,
        minDelay: state.config.minDelay,
        maxDelay: state.config.maxDelay,
        index: state.currentIndex + index,
        total: numbers.length,
        config: {
          skipFailed: state.config.skipFailed,
          autoCloseChat: state.config.autoCloseChat,
          humanTyping: state.config.humanTyping,
          avoidRateLimit: state.config.avoidRateLimit,
          sendMediaFirst: state.config.sendMediaFirst,
          sendAsDocument: state.config.sendAsDocument,
          repetitionCount: state.config.repetitionCount,
          pauseOnError: state.config.pauseOnError
        }
      };
    });

    try {
      chrome.runtime.sendMessage({
        type: 'sendMessage',
        data: {
          messages,
          sessionId: state.sessionId,
          messageTemplate: state.messageTemplate,
          mediaFiles: state.mediaFiles,
          config: state.config,
          total: numbers.length
        }
      }, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          appendLogToStateAndUI({ level: 'error', message: `Communication error: ${err.message}` });
          updateUIForRunning(false);
        } else if (response && !response.success) {
          appendLogToStateAndUI({ level: 'error', message: `Start failed: ${response.error || 'Unknown error'}` });
          updateUIForRunning(false);
        }
      });
    } catch (error) {
      appendLogToStateAndUI({ level: 'error', message: `Communication error: ${error.message}` });
      updateUIForRunning(false);
    }
  }

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pauseSending() {
    state.isPaused = true;
    chrome.runtime.sendMessage({ type: 'pauseSending' });
    updateUIForPaused(true);
    addLog({ level: 'warning', message: 'Sending paused by user' });
    setStatus('paused', 'Paused');
    showToast('Sending paused', 'warning');
  }

  function resumeSending() {
    state.isPaused = false;
    chrome.runtime.sendMessage({ type: 'resumeSending' });
    updateUIForPaused(false);
    addLog({ level: 'success', message: 'Sending resumed' });
    setStatus('sending', 'Resuming...');
    showToast('Sending resumed', 'success');
  }

  function stopSending() {
    state.isRunning = false;
    state.isPaused = false;
    chrome.runtime.sendMessage({ type: 'stopSending' });
    updateUIForRunning(false);
    addLog({ level: 'warning', message: 'Sending stopped by user' });
    setStatus('stopped', 'Stopped');
    showToast('Sending stopped', 'warning');
  }

  function sendingComplete(data) {
    state.isRunning = false;
    state.isPaused = false;
    updateUIForRunning(false);
    addLog({ level: 'success', message: `Completed: ${state.stats.sent} sent, ${state.stats.failed} failed` });
    setStatus('complete', `Done: ${state.stats.sent} sent, ${state.stats.failed} failed`);
    showToast(`Completed: ${state.stats.sent} sent, ${state.stats.failed} failed`, 'success');

    chrome.storage.local.remove('sessionData');

    if (state.config.autoCloseOnComplete) {
      setTimeout(() => window.close(), 3000);
    }
  }

  function updateSession(data) {
    if (data.sent !== undefined) state.stats.sent = data.sent;
    if (data.failed !== undefined) state.stats.failed = data.failed;
    if (data.pendingNumbers) {
      state.phoneNumbers = data.pendingNumbers;
    }
    if (data.isPaused !== undefined) {
      state.isPaused = data.isPaused;
      updateUIForPaused(state.isPaused);
      setStatus(state.isPaused ? 'paused' : 'sending', state.isPaused ? 'Paused' : 'Sending...');
    }
  }

  function saveConfiguration() {
    chrome.storage.local.set({ config: state.config }, () => {
      addLog({ level: 'success', message: 'Configuration saved' });
      showToast('Configuration saved', 'success');
    });
  }

  function loadConfiguration(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result);
        state.config = { ...state.config, ...config };
        applyConfigToUI();
        chrome.storage.local.set({ config: state.config });
        addLog({ level: 'success', message: 'Configuration loaded' });
        showToast('Configuration loaded', 'success');
      } catch (err) {
        addLog({ level: 'error', message: 'Failed to load configuration' });
        showToast('Failed to load configuration', 'error');
      }
    };
    reader.readAsText(file);
    elements.loadConfigInput.value = '';
  }

  function exportLogs() {
    const logsText = state.logs.map(l => `[${l.timestamp.toISOString()}] ${l.level.toUpperCase()}: ${l.message}`).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `massender-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addLog({ level: 'info', message: 'Logs exported' });
  }

  function exportResultsCsv() {
    if (state.stats.sent === 0 && state.stats.failed === 0) {
      showToast('No results to export', 'warning');
      return;
    }

    const csv = [
      ['Phone Number', 'Status', 'Timestamp', 'Error'].join(','),
      ...state.logs
        .filter(l => l.level === 'success' || l.level === 'error')
        .map(l => {
          const match = l.message.match(/(?:to|sent to|failed)[:\s]+(\+?\d+)/i);
          const number = match ? match[1] : '';
          const status = l.level === 'success' ? 'Sent' : 'Failed';
          const error = l.level === 'error' ? l.message.replace(/"/g, '""') : '';
          return [number, status, l.timestamp.toISOString(), error].map(v => `"${v}"`).join(',');
        })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `massender-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addLog({ level: 'info', message: 'Results exported to CSV' });
    showToast('Results exported', 'success');
  }

  function clearAllData() {
    if (!confirm('Clear all data? This will remove numbers, message, media, logs, and settings.')) return;

    state.phoneNumbers = [];
    state.messageTemplate = '';
    state.mediaFiles = [];
    state.stats = { sent: 0, failed: 0, pending: 0, current: null };
    state.logs = [];
    state.sessionData = null;

    elements.phoneNumbers.value = '';
    elements.messageContent.value = '';
    elements.repetitionCount.value = 1;
    elements.mediaInput.value = '';
    updateNumberCount();
    updateMessagePreview();
    renderMediaList();
    renderLogs();
    clearLogs();
    chrome.storage.local.clear();
    applyConfigToUI();

    addLog({ level: 'info', message: 'All data cleared' });
    showToast('All data cleared', 'success');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:10000;
      padding:12px 20px;border-radius:var(--radius-md);
      background:var(--bg-primary);border:1px solid var(--border-color);
      box-shadow:var(--shadow-lg);font-size:13px;font-weight:500;
      color:var(--text-primary);display:flex;align-items:center;gap:8px;
      animation:slideIn 0.3s ease;max-width:300px;
    `;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `<span style="color:${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--accent-secondary)'}">${icons[type]}</span>${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function handleCsvLoad(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const numbers = parseCSV(text);
        state.phoneNumbers = numbers;
        elements.phoneNumbers.value = numbers.join('\n');
        updateNumberCount();
        addLog({ level: 'success', message: `Loaded ${numbers.length} numbers from CSV` });
        showToast(`Loaded ${numbers.length} numbers`, 'success');
      } catch (err) {
        addLog({ level: 'error', message: 'Failed to parse CSV: ' + err.message });
        showToast('Failed to parse CSV', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function parseCSV(text) {
    const lines = text.split('\n');
    const numbers = [];
    for (const line of lines) {
      const cols = line.split(',');
      for (const col of cols) {
        const cleaned = col.trim().replace(/[^\d+]/g, '');
        if (cleaned && isValidPhoneNumber(cleaned)) {
          numbers.push(cleaned);
        }
      }
    }
    return [...new Set(numbers)];
  }

  function clearNumbers() {
    state.phoneNumbers = [];
    elements.phoneNumbers.value = '';
    updateNumberCount();
    addLog({ level: 'info', message: 'Phone numbers cleared' });
  }

  function validateAndStart() {
    validateNumbers();
    if (state.phoneNumbers.length === 0) {
      addLog({ level: 'error', message: 'No valid phone numbers to send to' });
      return;
    }
    if (!state.messageTemplate.trim()) {
      addLog({ level: 'error', message: 'Message template is empty' });
      return;
    }
    startSending();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initElements();
      initEventListeners();
    });
  } else {
    initElements();
    initEventListeners();
  }
})();