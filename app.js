// ----- SHARED LAYOUT BOOTSTRAP -----
function loadSharedLayoutCss() {
  if (document.querySelector('link[data-shared-layout="true"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'shared-layout.css';
  link.setAttribute('data-shared-layout', 'true');
  document.head.appendChild(link);
}

function setupMobileMenu() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  let menuBtn = nav.querySelector('.menu-toggle');
  if (!menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.className = 'menu-toggle';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'Open menu');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '&#9776;';
    nav.insertBefore(menuBtn, nav.querySelector('.nav-menu'));
  }

  const navMenu = nav.querySelector('.nav-menu');
  if (!navMenu) return;

  menuBtn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav-open');
    if (!isOpen) {
      navMenu.querySelectorAll('li.dropdown').forEach((d) => d.classList.remove('open'));
    }
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.innerHTML = isOpen ? '&times;' : '&#9776;';
    document.body.style.overflow = isOpen && window.innerWidth <= 1024 ? 'hidden' : '';
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        const li = link.closest('li.dropdown');
        if (li && link === li.querySelector(':scope > a')) {
          return;
        }
      }
      nav.classList.remove('nav-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '&#9776;';
      document.body.style.overflow = '';
    });
  });

  navMenu.querySelectorAll('.dropdown > a').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (window.innerWidth > 1024) return;
      event.preventDefault();
      event.stopPropagation();
      const dropdown = trigger.parentElement;
      const wasOpen = dropdown.classList.contains('open');
      navMenu.querySelectorAll('li.dropdown').forEach((d) => d.classList.remove('open'));
      if (!wasOpen) dropdown.classList.add('open');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      nav.classList.remove('nav-open');
      navMenu.querySelectorAll('li.dropdown').forEach((d) => d.classList.remove('open'));
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '&#9776;';
      document.body.style.overflow = '';
    }
  });
}

loadSharedLayoutCss();

// ----- NAVIGATION & ROUTING SPA -----
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if(target) target.classList.add('active');
  
  document.querySelectorAll('.nv-lnk').forEach(l => l.classList.remove('act'));
  const link = document.querySelector(`.nv-lnk[data-tg="${id}"]`);
  if(link) link.classList.add('act');
  
  window.scrollTo(0,0);
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if(window.scrollY > 10) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});


// Setup min date for booking & parse hash on load
window.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();

  const dInp = document.getElementById('bdate');
  if (dInp) {
    const today = new Date().toISOString().split('T')[0];
    dInp.setAttribute('min', today);
  }
  
  const hash = window.location.hash;
  if(hash && hash.length > 1){
    const h = hash.substring(1);
    if(document.getElementById(h)){
        goPage(h);
    }
  }
});

// Handle hash changes for navigation
window.addEventListener('hashchange', () => {
  const hash = window.location.hash;
  if(hash && hash.length > 1){
    const h = hash.substring(1);
    if(document.getElementById(h)){
        goPage(h);
    }
  }
});


// Services Tab Switching
document.querySelectorAll('.st-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.st-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    
    document.querySelectorAll('.serv-view').forEach(v => v.classList.remove('act'));
    const targetId = btn.getAttribute('data-sv');
    document.getElementById(targetId).classList.add('act');
  });
});

// Booking Submission
function submitBooking(btn) {
  const bfn = document.getElementById('bfn').value.trim();
  const bln = document.getElementById('bln').value.trim();
  const bem = document.getElementById('bem').value.trim();
  const bph = document.getElementById('bph').value.trim();
  const bdate = document.getElementById('bdate').value;
  const bprov = document.querySelector('select').value;
  const breason = document.getElementById('breason').value.trim();

  // Validate required fields
  const req = ['bfn', 'bln', 'bem', 'bph', 'bdate'];
  let ok = true;
  req.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      if (el) el.style.borderColor = '#dc2626';
      ok = false;
    } else {
      el.style.borderColor = '';
    }
  });

  if (!ok) {
    alert('Please fill in all required fields (First Name, Last Name, Email, Phone, Date).');
    return;
  }

  btn.textContent = 'Processing...';
  btn.disabled = true;

  const payload = {
    firstname: bfn,
    lastname: bln,
    email: bem,
    phone: bph,
    provider: bprov,
    date: bdate,
    reason: breason
  };

  // Google Apps Script URL
  const scriptURL = 'https://script.google.com/macros/s/AKfycbxAjEBDnp1sgg1uatd1qU3eyozjM493psMNhaUvpOEfG6zZqYaxf2S6YNJize9A9VM3bA/exec';

  fetch(scriptURL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  })
    .then(r => {
      btn.style.display = 'none';
      document.getElementById('bsuccess').style.display = 'block';
      document.getElementById('bsuccess').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
    .catch(e => {
      console.error(e);
      btn.textContent = 'Confirm Request';
      btn.disabled = false;
      alert('Oops! There was a problem. Please check your connection or try again.');
    });
}

// ----- RETELL AI VOICE RECEPTIONIST -----
const RETELL_API_KEY = 'key_ebb0f9da83e57670c30b472996ff'; 
const RETELL_AGENT_ID = 'agent_29b9312d01d1d6d58d9a3cdc8d'; 

let retellClient = null;
let callActive = false;

function openCall() {
  const vMod = document.getElementById('vMod');
  if (!vMod) return;
  vMod.classList.add('open');
  setCStat('Ready to assist you 24/7.', '');
  const cStart = document.getElementById('cStart');
  const cEnd = document.getElementById('cEnd');
  const cTog = document.getElementById('cTog');
  if (cStart) cStart.style.display = 'inline-block';
  if (cEnd) cEnd.style.display = 'none';
  if (cTog) cTog.classList.remove('calling');
}

function closeCall() {
  if (callActive) endCallVoice();
  const vMod = document.getElementById('vMod');
  if (vMod) vMod.classList.remove('open');
}

function setCStat(text, type) {
  const el = document.getElementById('cStat');
  if (el) {
    el.textContent = text;
    el.style.color = type === 'live' ? '#10b981' : type === 'err' ? '#ef4444' : type === 'conn' ? '#d97706' : 'var(--text-muted)';
  }
}

async function startCallVoice() {
  const startBtn = document.getElementById('cStart');
  const endBtn = document.getElementById('cEnd');
  const togBtn = document.getElementById('cTog');

  if (location.protocol === 'file:') {
    setCStat('⚠️ Please serve this file via HTTP (e.g. Live Server) for mic access.', 'err');
    return;
  }

  setCStat('Connecting...', 'conn');
  startBtn.disabled = true;

  try {
    const res = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RETELL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agent_id: RETELL_AGENT_ID })
    });
    const data = await res.json();

    if (!data.access_token) {
      setCStat('❌ Failed to get access token.', 'err');
      startBtn.disabled = false;
      return;
    }

    if (!window.RetellWebClient) {
      setCStat('❌ API Load Error. Please refresh.', 'err');
      startBtn.disabled = false;
      return;
    }

    retellClient = new window.RetellWebClient();

    retellClient.on('call_started', () => {
      callActive = true;
      setCStat('🟢 Live. Speak naturally.', 'live');
      startBtn.style.display = 'none';
      endBtn.style.display = 'inline-block';
      if (togBtn) togBtn.classList.add('calling');
    });

    retellClient.on('call_ended', () => {
      callActive = false;
      setCStat('Call ended. Thank you.', '');
      startBtn.style.display = 'inline-block';
      startBtn.disabled = false;
      endBtn.style.display = 'none';
      if (togBtn) togBtn.classList.remove('calling');
      retellClient = null;
    });

    retellClient.on('error', (err) => {
      setCStat('❌ Connection lost.', 'err');
      callActive = false;
      startBtn.style.display = 'inline-block';
      startBtn.disabled = false;
      endBtn.style.display = 'none';
      if (togBtn) togBtn.classList.remove('calling');
    });

    await retellClient.startCall({ accessToken: data.access_token });

  } catch (err) {
    setCStat('❌ Microphone or Network Error.', 'err');
    startBtn.disabled = false;
  }
}

function endCallVoice() {
  if (retellClient) { retellClient.stopCall(); retellClient = null; }
  callActive = false;
  const cTog = document.getElementById('cTog');
  if (cTog) cTog.classList.remove('calling');
}

// Text chat UI + logic lives in chat-widget.js (loaded after this file).
