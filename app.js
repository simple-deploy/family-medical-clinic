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
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.innerHTML = isOpen ? '&times;' : '&#9776;';
    document.body.style.overflow = isOpen && window.innerWidth <= 1024 ? 'hidden' : '';
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
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
      const dropdown = trigger.parentElement;
      dropdown.classList.toggle('open');
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      nav.classList.remove('nav-open');
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
  const bdate = document.getElementById('bdate').value;
  const bfn = document.getElementById('bfn').value;
  if (!bdate || !bfn) {
    alert("Please provide at least your First Name and Preferred Date.");
    return;
  }
  btn.textContent = 'Processing...';
  btn.disabled = true;
  setTimeout(() => {
    btn.style.display = 'none';
    document.getElementById('bsuccess').style.display = 'block';
  }, 1000);
}

// ----- RETELL AI VOICE RECEPTIONIST -----
const RETELL_API_KEY = 'key_ebb0f9da83e57670c30b472996ff'; 
const RETELL_AGENT_ID = 'agent_29b9312d01d1d6d58d9a3cdc8d'; 

let retellClient = null;
let callActive = false;

function openCall() {
  document.getElementById('vMod').classList.add('open');
  setCStat('Ready to assist you 24/7.', '');
  document.getElementById('cStart').style.display = 'inline-block';
  document.getElementById('cEnd').style.display = 'none';
  document.getElementById('cTog').classList.remove('calling');
}

function closeCall() {
  if (callActive) endCallVoice();
  document.getElementById('vMod').classList.remove('open');
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
  document.getElementById('cTog').classList.remove('calling');
}

// ----- TEXT CHATBOT -----
function openChat() {
  const pnl = document.getElementById('cPnl');
  pnl.classList.add('open');
  if(!document.getElementById('cBody').innerHTML) {
    addCMsg("Hello! I'm your MJD Health digital assistant. How can I help you?", 'sys');
    setCOpts([
      { lbl: 'Book Appointment', cb: () => replyToUser('book') },
      { lbl: 'Services', cb: () => replyToUser('serv') }
    ]);
  }
}

function closeChat() { document.getElementById('cPnl').classList.remove('open'); }

function addCMsg(txt, type) {
  const b = document.getElementById('cBody');
  const d = document.createElement('div');
  d.className = 'c-msg ' + (type === 'usr' ? 'cm-usr' : 'cm-sys');
  d.innerText = txt;
  b.appendChild(d);
  b.scrollTop = b.scrollHeight;
}

function setCOpts(opts) {
  const c = document.getElementById('cOpts');
  c.innerHTML = '';
  opts.forEach(o => {
    const btn = document.createElement('button');
    btn.innerText = o.lbl;
    btn.onclick = () => { addCMsg(o.lbl, 'usr'); o.cb(); };
    c.appendChild(btn);
  });
}

function sendChat() {
  const i = document.getElementById('cInp');
  const v = i.value.trim();
  if(v) {
    addCMsg(v, 'usr');
    i.value = '';
    setTimeout(() => replyToUser(v), 400);
  }
}

function replyToUser(txt) {
  const t = txt.toLowerCase();
  setCOpts([]);
  
  if (t.includes('book') || t.includes('appoint')) {
    addCMsg("I can help with that. Would you like to use our secure online booking portal?", 'sys');
    setCOpts([{ lbl: 'Go to Portal', cb: () => { goPage('booking'); closeChat(); } }]);
  } else if (t.includes('serv') || t.includes('treatment')) {
    addCMsg("We offer Pediatrics, Adult Care, Chronic Disease Management, and more. Would you like to see the full list?", 'sys');
    setCOpts([{ lbl: 'View Services', cb: () => { goPage('services'); closeChat(); } }]);
  } else {
    addCMsg("I'm equipped to help with basic scheduling and info. Feel free to use the phone icon to speak with our AI Voice Receptionist for deeper detail!", 'sys');
  }
}
