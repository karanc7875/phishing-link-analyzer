const STORAGE_KEYS = {
  session: 'pla_demo_session',
  users: 'pla_demo_users',
  history: 'pla_demo_scan_history',
  preferences: 'pla_demo_preferences'
};

const trustedDomains = [
  'youtube.com',
  'google.com',
  'gmail.com',
  'microsoft.com',
  'outlook.com',
  'github.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'netflix.com',
  'amazon.com',
  'paypal.com',
  'dropbox.com',
  'apple.com',
  'office.com'
];

const demoStats = {
  total: 12486,
  safe: 9842,
  suspicious: 1875,
  highRisk: 769,
  today: 248,
  threats: 769
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function setMessage(element, text, type = 'error') {
  if (!element) return;
  element.textContent = text || '';
  element.classList.remove('success');
  if (type === 'success') {
    element.classList.add('success');
  }
}

function togglePasswordVisibility(button) {
  const input = button.closest('.password-field')?.querySelector('input');
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  button.textContent = isPassword ? 'Hide' : 'Show';
}

function calculatePasswordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, label: 'None', width: 0, color: '#ef4444' };

  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;

  if (score <= 25) return { score, label: 'Weak', width: 25, color: '#ef4444' };
  if (score <= 50) return { score, label: 'Fair', width: 50, color: '#f59e0b' };
  if (score <= 75) return { score, label: 'Good', width: 75, color: '#0ea5e9' };
  return { score, label: 'Strong', width: 100, color: '#16a34a' };
}

function updatePasswordStrength() {
  const passwordField = document.getElementById('password');
  const strengthBar = document.querySelector('.strength-fill');
  const strengthLabel = document.querySelector('.strength-label');
  if (!passwordField || !strengthBar || !strengthLabel) return;

  const result = calculatePasswordStrength(passwordField.value);
  strengthBar.style.width = `${result.width}%`;
  strengthBar.style.background = result.color;
  strengthLabel.textContent = result.label;
}

function loadCurrentUser() {
  const session = safeRead(STORAGE_KEYS.session, null);
  if (!session) return null;
  return session.user || null;
}

function getInitials(fullName) {
  const baseName = (fullName || 'User').trim();
  if (!baseName) return 'U';
  const parts = baseName.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0].toUpperCase()).join('').slice(0, 2) || 'U';
}

function syncUserNameDisplays(user) {
  const username = user && user.fullName ? user.fullName : 'User';
  const role = user && user.role ? user.role : 'Security Analyst';

  document.querySelectorAll('#topbarUserName, #profileName').forEach((element) => {
    if (element) {
      element.textContent = username;
    }
  });

  document.querySelectorAll('.profile-chip small').forEach((element) => {
    if (element) {
      element.textContent = role;
    }
  });

  document.querySelectorAll('.avatar').forEach((element) => {
    if (element) {
      element.textContent = getInitials(username);
    }
  });

  return username;
}

function getDefaultPreferences() {
  return {
    darkMode: false
  };
}

function applyTheme() {
  const preferences = safeRead(STORAGE_KEYS.preferences, getDefaultPreferences());
  document.body.classList.toggle('theme-dark', Boolean(preferences.darkMode));
}

function setSession(user) {
  safeWrite(STORAGE_KEYS.session, { user, loggedIn: true, timestamp: Date.now() });
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.session);
  window.location.href = 'index.html';
}

function ensureProtectedAccess() {
  const isAuthPage = ['/index.html', '/register.html'].some((page) => window.location.pathname.endsWith(page)) ||
    window.location.pathname.endsWith('/') ||
    window.location.pathname === '';

  const session = safeRead(STORAGE_KEYS.session, null);

  if (!isAuthPage && !session) {
    window.location.href = 'index.html';
    return;
  }

  if (isAuthPage && session) {
    window.location.href = 'dashboard.html';
  }
}

function attachPasswordToggles() {
  document.querySelectorAll('.eye-toggle').forEach((button) => {
    button.addEventListener('click', () => togglePasswordVisibility(button));
  });
}

function seedDemoUser() {
  const users = safeRead(STORAGE_KEYS.users, []);
  const hasDemoUser = users.some((user) => user.email.toLowerCase() === 'demo@phishinglinkanalyzer.com');
  if (!hasDemoUser) {
    users.push({
      fullName: 'Demo User',
      email: 'demo@phishinglinkanalyzer.com',
      createdAt: new Date().toISOString(),
      demoOnlyPassword: 'not-stored',
      demoAccount: true
    });
    safeWrite(STORAGE_KEYS.users, users);
  }
}

function initAuthPage() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  attachPasswordToggles();

  if (registerForm) {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (passwordInput) passwordInput.addEventListener('input', updatePasswordStrength);

    registerForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const formData = new FormData(registerForm);
      const fullName = (formData.get('fullName') || '').trim();
      const email = (formData.get('email') || '').trim().toLowerCase();
      const password = formData.get('password') || '';
      const confirmPassword = formData.get('confirmPassword') || '';
      const termsAccepted = formData.get('termsAccepted') === 'on';
      const messageElement = document.getElementById('registerMessage');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!fullName || !email || !password || !confirmPassword) {
        setMessage(messageElement, 'Please fill in all required fields.');
        return;
      }

      if (!emailRegex.test(email)) {
        setMessage(messageElement, 'Please enter a valid email address.');
        return;
      }

      const strength = calculatePasswordStrength(password);
      if (strength.score < 75) {
        setMessage(messageElement, 'Password is too weak. Use 8+ characters with upper-case, numbers, and a special character.');
        return;
      }

      if (password !== confirmPassword) {
        setMessage(messageElement, 'Passwords do not match.');
        return;
      }

      if (!termsAccepted) {
        setMessage(messageElement, 'You must accept the terms and conditions to continue.');
        return;
      }

      const users = safeRead(STORAGE_KEYS.users, []);
      const duplicateUser = users.some((user) => user.email.toLowerCase() === email);
      if (duplicateUser) {
        setMessage(messageElement, 'An account with this email already exists. Please log in instead.');
        return;
      }

      users.push({
        fullName,
        email,
        createdAt: new Date().toISOString(),
        demoOnlyPassword: 'not-stored',
        demoAccount: true
      });
      safeWrite(STORAGE_KEYS.users, users);

      setMessage(messageElement, 'Account created successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1100);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const email = (formData.get('email') || '').trim().toLowerCase();
      const password = formData.get('password') || '';
      const rememberMe = formData.get('rememberMe') === 'on';
      const messageElement = document.getElementById('loginMessage');

      if (!email || !password) {
        setMessage(messageElement, 'Email and password are required.');
        return;
      }

      const users = safeRead(STORAGE_KEYS.users, []);
      const existingUser = users.find((user) => user.email.toLowerCase() === email);

      if (!existingUser) {
        setMessage(messageElement, 'No account found for this email. Please register first.');
        return;
      }

      const demoSession = { user: { fullName: existingUser.fullName, email: existingUser.email }, rememberMe };
      setSession(demoSession.user);
      setMessage(messageElement, 'Demo login successful. Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    });
  }
}

function seedScanHistory() {
  const existing = safeRead(STORAGE_KEYS.history, []);
  if (existing.length > 0) return;

  const sampleResults = [
    {
      id: 'demo-1',
      url: 'https://secure-checkout.example.com/login',
      domain: 'secure-checkout.example.com',
      score: 18,
      riskLevel: 'safe',
      checkedAt: new Date(Date.now() - 86400000).toISOString(),
      summary: 'This URL appears legitimate and uses secure domain patterns.',
      reasons: ['HTTPS enabled', 'No suspicious keywords detected', 'Hostname matches a known secure service']
    },
    {
      id: 'demo-2',
      url: 'https://verify-payment-account-update.example.net',
      domain: 'verify-payment-account-update.example.net',
      score: 84,
      riskLevel: 'warning',
      checkedAt: new Date(Date.now() - 3600000).toISOString(),
      summary: 'The URL includes urgency and account-change language commonly used in phishing campaigns.',
      reasons: ['Contains urgency cues like verify and update', 'Mixed brand-like key phrases', 'Potentially disguised subdomain structure']
    },
    {
      id: 'demo-3',
      url: 'http://bank-login-portal-now.live',
      domain: 'bank-login-portal-now.live',
      score: 92,
      riskLevel: 'danger',
      checkedAt: new Date(Date.now() - 1800000).toISOString(),
      summary: 'This domain uses unencrypted HTTP, suspicious brand impersonation, and urgency tactics.',
      reasons: ['HTTP instead of HTTPS', 'Brand impersonation pattern', 'High-risk urgency plus login terminology']
    }
  ];

  safeWrite(STORAGE_KEYS.history, sampleResults);
}

function getRiskInfo(url) {
  const cleaned = (url || '').trim();

  if (!cleaned) {
    return {
      score: 0,
      riskLevel: 'danger',
      summary: 'Please enter a valid website URL to analyze.',
      reasons: ['The URL is empty.'],
      recommendation: 'Add a full URL beginning with https:// or http:// before scanning.'
    };
  }

  let normalizedUrl = cleaned;
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let hostname = '';
  try {
    hostname = new URL(normalizedUrl).hostname.toLowerCase();
  } catch (error) {
    return {
      score: 0,
      riskLevel: 'danger',
      summary: 'The URL format is invalid.',
      reasons: ['The website URL could not be parsed correctly.'],
      recommendation: 'Use a full URL such as https://example.com before scanning.'
    };
  }

  const hostWithoutWww = hostname.replace(/^www\./, '');
  const isTrustedDomain = trustedDomains.some((domain) => hostWithoutWww === domain || hostWithoutWww.endsWith(`.${domain}`));
  const reasons = [];
  let score = 8;

  if (!/^https?:\/\//i.test(cleaned)) {
    reasons.push('The input was missing a protocol, so the app normalized it for a demo check.');
  }

  if (cleaned.toLowerCase().includes('http://')) {
    score += 28;
    reasons.push('The URL uses HTTP instead of HTTPS.');
  }

  if (isTrustedDomain) {
    score = 6;
    reasons.push('The domain matches a commonly trusted public website.');
    return {
      score,
      riskLevel: 'safe',
      summary: 'This website appears to be a normal public website and does not show phishing indicators in the demo scanner.',
      reasons: reasons.length ? reasons.slice(0, 3) : ['No suspicious pattern was detected.'],
      recommendation: 'This is a safe demo result. A live Google Safe Browsing API would be used in production to check real-time reputational data.'
    };
  }

  if (/(login|verify|secure|update|account|payment|confirm|alert)/i.test(cleaned)) {
    score += 22;
    reasons.push('The URL includes urgency or account-related keywords commonly used in phishing pages.');
  }

  if (/(paypal|bank|amazon|apple|netflix|microsoft|dropbox|google|office365)/i.test(cleaned)) {
    score += 16;
    reasons.push('The URL includes brand-like wording that could be used to impersonate a trusted service.');
  }

  if (/(%3d|%2f|%20|bit\.ly|shorturl|click|secure\w*\.|verify\w*\.)/i.test(cleaned)) {
    score += 18;
    reasons.push('The URL contains redirect or encoding patterns that may hide the real destination.');
  }

  if (cleaned.length > 80) {
    score += 12;
    reasons.push('The URL is unusually long and may be attempting to hide suspicious content.');
  }

  if (/\.(ru|tk|ga|cf|xyz|ml|top|club|online)/i.test(hostname)) {
    score += 18;
    reasons.push('The domain extension is often used in suspicious or low-trust sites.');
  }

  if (score < 30) {
    return {
      score: Math.min(28, score),
      riskLevel: 'safe',
      summary: 'This URL looks normal and does not show strong phishing indicators in the demo model.',
      reasons: reasons.length ? reasons.slice(0, 3) : ['No obvious phishing markers were identified.'],
      recommendation: 'Continue browsing carefully and verify the destination in the browser address bar.'
    };
  }

  if (score < 60) {
    return {
      score: Math.min(58, score),
      riskLevel: 'warning',
      summary: 'This URL may be suspicious because it has one or more warning signals typically associated with phishing attempts.',
      reasons: reasons.length ? reasons.slice(0, 4) : ['The link contains mixed security signals.'],
      recommendation: 'Do not enter sensitive credentials and confirm the site through a trusted source.'
    };
  }

  return {
    score: Math.min(96, score),
    riskLevel: 'danger',
    summary: 'This URL appears highly risky and is likely designed to impersonate a trusted service or steal login credentials.',
    reasons: reasons.length ? reasons.slice(0, 5) : ['The URL shows several aggressive phishing indicators.'],
    recommendation: 'Avoid opening this page and report it if it appears in a suspicious email or message.'
  };
}

function addScanResult(url) {
  const result = getRiskInfo(url);
  const history = safeRead(STORAGE_KEYS.history, []);
  const entry = {
    id: `scan-${Date.now()}`,
    url,
    domain: new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
    score: result.score,
    riskLevel: result.riskLevel,
    checkedAt: new Date().toISOString(),
    summary: result.summary,
    reasons: result.reasons,
    recommendation: result.recommendation
  };

  history.unshift(entry);
  safeWrite(STORAGE_KEYS.history, history.slice(0, 12));
  return entry;
}

function renderDashboardStats() {
  const elements = document.querySelectorAll('[data-stat]');
  elements.forEach((element) => {
    const key = element.dataset.stat;
    const value = demoStats[key];
    if (value !== undefined && element.dataset.value !== 'dynamic') {
      element.textContent = formatNumber(value);
    }
  });
}

function renderHistoryList() {
  const list = document.getElementById('scanHistoryList');
  if (!list) return;
  const history = safeRead(STORAGE_KEYS.history, []);

  if (!history.length) {
    list.innerHTML = '<div class="empty-state">No scan results yet. Run a quick URL check to get started.</div>';
    return;
  }

  list.innerHTML = history
    .map((item) => {
      const date = new Date(item.checkedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const riskClass = item.riskLevel === 'danger' ? 'danger' : item.riskLevel === 'warning' ? 'warning' : 'safe';
      return `
        <div class="history-item">
          <div>
            <strong>${item.domain}</strong>
            <small>${date}</small>
            <div style="margin-top: 8px;"><a href="result.html?id=${item.id}">View details</a></div>
          </div>
          <div>
            <span class="risk-chip ${riskClass}">${item.riskLevel}</span>
            <div style="margin-top: 8px; font-weight: 700; text-align: right;">${item.score}/100</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderResultPage() {
  const resultCard = document.getElementById('resultViewer');
  if (!resultCard) return;

  const query = new URLSearchParams(window.location.search);
  const selectedId = query.get('id');
  const history = safeRead(STORAGE_KEYS.history, []);
  const result = history.find((item) => item.id === selectedId) || history[0] || {
    id: 'demo-result',
    url: 'https://example.com',
    domain: 'example.com',
    score: 28,
    riskLevel: 'safe',
    checkedAt: new Date().toISOString(),
    summary: 'This sample result shows how the dashboard explains analysis outcomes.',
    reasons: ['Sample data used for demonstration.', 'No suspicious patterns detected in this mock result.'],
    recommendation: 'Use this framework to view detailed phishing analysis once the backend is connected.'
  };

  const riskTone = result.riskLevel === 'danger' ? 'danger' : result.riskLevel === 'warning' ? 'warning' : 'safe';
  const angle = Math.max(0, Math.min(360, (result.score / 100) * 360));
  const date = new Date(result.checkedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  resultCard.innerHTML = `
    <div class="score-card card">
      <div class="score-ring" style="background: conic-gradient(${riskTone === 'danger' ? '#ef4444' : riskTone === 'warning' ? '#f59e0b' : '#16a34a'} 0deg ${angle}deg, #e2e8f0 ${angle}deg 360deg);">
        <div class="score-value">
          <strong>${result.score}</strong>
          <small>/100</small>
        </div>
      </div>
      <div class="result-summary">
        <span class="risk-chip ${riskTone}">${result.riskLevel}</span>
        <h3>${result.domain}</h3>
        <p>${result.summary}</p>
        <div class="meta-badges">
          <span class="meta-badge">Checked: ${date}</span>
          <span class="meta-badge">URL: ${result.url}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Detection Summary</h3>
      </div>
      <div class="card-body">
        <ul class="detail-list">
          ${result.reasons.map((reason) => `<li>${reason}</li>`).join('')}
          <li>${result.recommendation}</li>
        </ul>
      </div>
    </div>
  `;
}

function renderProfilePage() {
  const currentUser = loadCurrentUser();
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const settingsForm = document.getElementById('profileSettingsForm');
  const displayNameField = document.getElementById('displayName');
  const roleField = document.getElementById('role');
  const saveButton = document.getElementById('saveProfileButton');

  if (!currentUser) return;

  const safeName = currentUser.fullName || 'Demo User';
  if (profileName) profileName.textContent = safeName;
  if (profileEmail) profileEmail.textContent = currentUser.email;
  if (displayNameField) displayNameField.value = safeName;
  if (roleField) roleField.value = currentUser.role || 'Security Analyst';
  syncUserNameDisplays(currentUser);

  const preferences = safeRead(STORAGE_KEYS.preferences, getDefaultPreferences());

  if (settingsForm) {
    const toggles = settingsForm.querySelectorAll('.toggle');
    toggles.forEach((toggle) => {
      const key = toggle.dataset.setting;
      const isActive = Boolean(preferences[key]);
      toggle.classList.toggle('active', isActive);

      toggle.addEventListener('click', function () {
        const nextValue = !toggle.classList.contains('active');
        toggle.classList.toggle('active', nextValue);
        preferences[key] = nextValue;
        safeWrite(STORAGE_KEYS.preferences, preferences);
        applyTheme();
      });
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', function () {
      const updatedName = (displayNameField ? displayNameField.value.trim() : '').replace(/\s+/g, ' ');
      const updatedRole = (roleField ? roleField.value.trim() : '').replace(/\s+/g, ' ');
      const session = safeRead(STORAGE_KEYS.session, { user: {} });
      const users = safeRead(STORAGE_KEYS.users, []);
      const userIndex = users.findIndex((user) => user.email && user.email.toLowerCase() === currentUser.email.toLowerCase());

      if (!updatedName) {
        setMessage(document.getElementById('profileMessage'), 'Display name cannot be empty.');
        return;
      }

      session.user = {
        ...session.user,
        fullName: updatedName,
        email: currentUser.email,
        role: updatedRole || 'Security Analyst'
      };

      if (userIndex >= 0) {
        users[userIndex].fullName = updatedName;
        users[userIndex].role = updatedRole || 'Security Analyst';
        safeWrite(STORAGE_KEYS.users, users);
      }

      safeWrite(STORAGE_KEYS.session, session);
      profileName.textContent = updatedName;
      syncUserNameDisplays(session.user);
      setMessage(document.getElementById('profileMessage'), 'Profile updated successfully.', 'success');
    });
  }
}

function initSidebar() {
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach((item) => {
    const href = item.getAttribute('href');
    if (href === currentPath) {
      item.classList.add('active');
    }
  });

  const logoutButton = document.querySelector('.logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', logoutUser);
  }

  const user = loadCurrentUser();
  const topName = document.getElementById('topbarUserName');
  if (user) {
    if (topName) topName.textContent = user.fullName || 'User';
    syncUserNameDisplays(user);
  }
}

function initScanForm() {
  const scanForm = document.getElementById('scanForm');
  if (!scanForm) return;

  scanForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const input = document.getElementById('scanUrl');
    const url = input ? input.value.trim() : '';
    if (!url) {
      input.focus();
      return;
    }

    const button = scanForm.querySelector('button');
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Analyzing...';

    setTimeout(() => {
      const result = addScanResult(url);
      button.disabled = false;
      button.textContent = original;
      window.location.href = `result.html?id=${result.id}`;
    }, 800);
  });

  const quickForm = document.getElementById('quickScanForm');
  if (quickForm) {
    quickForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const input = document.getElementById('quickUrl');
      const url = input ? input.value.trim() : '';
      if (!url) {
        input.focus();
        return;
      }
      const result = addScanResult(url);
      window.location.href = `result.html?id=${result.id}`;
    });
  }
}

function initChartIfPresent() {
  const chartCanvas = document.getElementById('threatChart');
  if (!chartCanvas || typeof Chart === 'undefined') {
    return;
  }

  new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Safe', 'Suspicious', 'High Risk'],
      datasets: [{
        data: [demoStats.safe, demoStats.suspicious, demoStats.highRisk],
        backgroundColor: ['#16a34a', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        cutout: '68%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 9,
            color: '#475569',
            padding: 18
          }
        }
      }
    }
  });
}

function initPage() {
  applyTheme();
  seedDemoUser();
  ensureProtectedAccess();
  seedScanHistory();
  renderDashboardStats();
  renderHistoryList();
  renderResultPage();
  renderProfilePage();
  initSidebar();
  initScanForm();
  initChartIfPresent();
  initAuthPage();
}

document.addEventListener('DOMContentLoaded', initPage);
