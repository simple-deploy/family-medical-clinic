/**
 * MJD Health - shared chat assistant + floating actions (all pages).
 * Depends on app.js for voice call (openCall / startCallVoice / etc.).
 */
(function () {
  'use strict';

  var BOOKING_URL = 'index.html#booking';

  var SERVICES = [
    { name: 'Antenatal Care', page: 'antenatal-care.html', kw: ['antenatal', 'pregnancy', 'prenatal', 'obstetric'] },
    { name: 'ECG', page: 'ecg.html', kw: ['ecg', 'ekg', 'heart rhythm', 'cardiac'] },
    { name: 'Emergency Medicine', page: 'emergency-medicine.html', kw: ['emergency', 'urgent', 'injury', 'accident'] },
    { name: 'Family Planning', page: 'family-planing.html', kw: ['family planning', 'contraception', 'birth control'] },
    { name: 'Immunisation', page: 'ammunisation.html', kw: ['immunis', 'vaccin', 'flu shot', 'injection', 'nip'] },
    { name: "Men's Health", page: 'mens-health.html', kw: ["men's health", 'prostate', 'male health'] },
    { name: 'Mental Health', page: 'mental-health.html', kw: ['mental', 'anxiety', 'depression', 'counsell'] },
    { name: 'Work Cover', page: 'work-cover.html', kw: ['work cover', 'workers comp', 'compensation', 'injury at work'] },
    { name: 'General practice & family medicine', page: 'about.html', kw: ['gp ', 'general practitioner', 'family doctor', 'check-up', 'check up'] }
  ];

  var DOCTORS = [
    { name: 'Dr. Samantha Evans', role: 'Head of Pediatrics', focus: 'Children and developmental care' },
    { name: 'Dr. Jonathan Miller', role: 'Family Medicine', focus: 'Family practice and preventative care' },
    { name: 'Dr. David Lee', role: 'Internal Medicine', focus: 'Chronic disease and complex care' },
    { name: 'Dr. Sarah Jenkins', role: "Women's Health", focus: 'Reproductive and gynaecological care' },
    { name: 'Elena Ramirez, NP', role: 'Lead Nurse Practitioner', focus: 'Triage and chronic care visits' },
    { name: 'Marcus Wright, RN', role: 'Diagnostic Lead', focus: 'On-site imaging and laboratory coordination' }
  ];

  var currentTab = 'general';

  function hasBookingSection() {
    return !!document.getElementById('booking');
  }

  function navigateToBooking() {
    if (typeof window.goPage === 'function' && hasBookingSection()) {
      window.goPage('booking');
    } else {
      window.location.href = BOOKING_URL;
    }
    window.closeChat();
  }

  function mountHTML() {
    if (document.getElementById('mjd-floating-root')) return;

    var wrap = document.createElement('div');
    wrap.id = 'mjd-floating-root';
    wrap.innerHTML =
      '<button type="button" class="wc-btn wc-chat" id="mjdWcChat" aria-label="Open chat">&#128172;</button>' +
      '<button type="button" class="wc-btn wc-call" id="cTog" onclick="openCall()" aria-label="Call assistant">&#128222;</button>' +
      '<div class="mod-overlay" id="vMod" role="dialog" aria-modal="true" aria-labelledby="vModTitle">' +
      '  <div class="call-box">' +
      '    <div class="call-ava">&#10010;</div>' +
      '    <h3 id="vModTitle">AI Receptionist</h3>' +
      '    <div class="c-stat" id="cStat">Ready to assist you 24/7.</div>' +
      '    <div class="call-box-actions">' +
      '      <button type="button" class="btn-forest btn-forest--sm" id="cStart" onclick="startCallVoice()">&#128222; Start Voice Call</button>' +
      '      <button type="button" class="btn-forest btn-forest--sm btn-forest--danger" id="cEnd" style="display:none" onclick="endCallVoice()">&#128683; End Call</button>' +
      '      <button type="button" class="btn-forest btn-forest--sm btn-forest--ghost" onclick="closeCall()">Close</button>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="chat-pnl" id="cPnl" aria-hidden="true">' +
      '  <div class="cp-head">' +
      '    <div>' +
      '      <div class="cp-title">Clinic Assistant</div>' +
      '      <div class="cp-sub">MJD Health - services, doctors &amp; bookings</div>' +
      '    </div>' +
      '    <button type="button" class="cp-close" id="mjdCpClose" aria-label="Close chat">&times;</button>' +
      '  </div>' +
      '  <div class="cp-tabs" role="tablist" aria-label="Chat topics">' +
      '    <button type="button" class="cp-tab is-active" data-mjd-tab="general" role="tab" aria-selected="true">General</button>' +
      '    <button type="button" class="cp-tab" data-mjd-tab="services" role="tab" aria-selected="false">Services</button>' +
      '    <button type="button" class="cp-tab" data-mjd-tab="doctors" role="tab" aria-selected="false">Doctors</button>' +
      '    <button type="button" class="cp-tab" data-mjd-tab="book" role="tab" aria-selected="false">Book</button>' +
      '  </div>' +
      '  <div class="cp-body" id="cBody"></div>' +
      '  <div class="cp-foot">' +
      '    <div class="cp-opts" id="cOpts"></div>' +
      '    <div class="cp-inp">' +
      '      <input type="text" id="cInp" placeholder="Ask about services, doctors, or booking..." autocomplete="off" />' +
      '      <button type="button" id="mjdSendChat" aria-label="Send">&#8594;</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(wrap);
    bindUI();
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function addCMsg(txt, type) {
    var b = getEl('cBody');
    if (!b) return;
    var d = document.createElement('div');
    d.className = 'c-msg ' + (type === 'usr' ? 'cm-usr' : 'cm-sys');
    d.textContent = txt;
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
  }

  function setCOpts(opts) {
    var c = getEl('cOpts');
    if (!c) return;
    c.innerHTML = '';
    opts.forEach(function (o) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = o.lbl;
      btn.addEventListener('click', function () {
        addCMsg(o.lbl, 'usr');
        o.cb();
      });
      c.appendChild(btn);
    });
  }

  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.cp-tab').forEach(function (btn) {
      var on = btn.getAttribute('data-mjd-tab') === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    seedTabIntro(tab);
  }

  function seedTabIntro(tab) {
    setCOpts([]);
    if (tab === 'general') {
      addCMsg(
        'Welcome to MJD Health Medical Clinics. I can explain our services, introduce our care team, or help you book online. What would you like to know?',
        'sys'
      );
      setCOpts([
        { lbl: 'Clinic hours', cb: function () { replyToUser('opening hours'); } },
        { lbl: 'Contact & location', cb: function () { replyToUser('phone address'); } },
        { lbl: 'Book an appointment', cb: function () { replyToUser('book appointment'); } }
      ]);
    } else if (tab === 'services') {
      addCMsg(
        'We offer comprehensive family medicine plus dedicated pages for antenatal care, ECG, emergency care, immunisation, mental health, work cover, and more. Ask about any service or tap a quick topic.',
        'sys'
      );
      setCOpts([
        { lbl: 'Immunisation & vaccines', cb: function () { replyToUser('immunisation'); } },
        { lbl: "Men's / Women's health", cb: function () { replyToUser('mens health'); } },
        { lbl: 'Mental health', cb: function () { replyToUser('mental health'); } },
        { lbl: 'View all service pages', cb: function () { window.location.href = 'index.html#services'; closeChat(); } }
      ]);
    } else if (tab === 'doctors') {
      addCMsg(
        "Our team includes GPs and focused roles in paediatrics, family medicine, internal medicine, and women's health, plus senior nursing staff. Ask about a doctor by name or role.",
        'sys'
      );
      setCOpts([
        { lbl: 'List all doctors', cb: function () { replyToUser('list doctors'); } },
        { lbl: 'Paediatrics', cb: function () { replyToUser('Dr Evans paediatric'); } },
        { lbl: 'Book with a provider', cb: function () { replyToUser('book appointment'); } }
      ]);
    } else if (tab === 'book') {
      addCMsg(
        "You can request an appointment through our secure online form. I'll open it for you, or you can go there when you're ready.",
        'sys'
      );
      setCOpts([
        { lbl: 'Open booking form', cb: navigateToBooking },
        { lbl: 'What to bring', cb: function () { replyToUser('what to bring appointment'); } }
      ]);
    }
  }

  function openChat() {
    var pnl = getEl('cPnl');
    if (!pnl) return;
    pnl.classList.add('open');
    pnl.setAttribute('aria-hidden', 'false');
    if (!getEl('cBody').dataset.seeded) {
      getEl('cBody').dataset.seeded = '1';
      setTab('general');
    }
    setTimeout(function () {
      var inp = getEl('cInp');
      if (inp) inp.focus();
    }, 200);
  }

  function closeChat() {
    var pnl = getEl('cPnl');
    if (!pnl) return;
    pnl.classList.remove('open');
    pnl.setAttribute('aria-hidden', 'true');
  }

  function sendChat() {
    var i = getEl('cInp');
    if (!i) return;
    var v = i.value.trim();
    if (!v) return;
    addCMsg(v, 'usr');
    i.value = '';
    setTimeout(function () {
      replyToUser(v);
    }, 350);
  }

  function matchService(t) {
    var lower = t.toLowerCase();
    for (var i = 0; i < SERVICES.length; i++) {
      var s = SERVICES[i];
      for (var k = 0; k < s.kw.length; k++) {
        if (lower.indexOf(s.kw[k]) !== -1) return s;
      }
    }
    return null;
  }

  function wantsBooking(t) {
    var lower = t.toLowerCase();
    if (/^(yes|ok|please|sure|go|take me there)$/i.test(lower.trim())) return true;
    if (/(book|schedule|make|request|reserve).{0,40}(appoint|visit|slot)/i.test(lower)) return true;
    if (/(appoint|visit).{0,20}(book|schedule|make|get)/i.test(lower)) return true;
    if (/\bonline booking\b|\bbook online\b|\bpatient portal\b/i.test(lower)) return true;
    return false;
  }

  function wantsDoctors(t) {
    return /\b(doctor|dr\.?|physician|provider|specialist|gp|nurse|team member)\b/i.test(t);
  }

  function formatDoctorsList() {
    var lines = DOCTORS.map(function (d) {
      return '\u2022 ' + d.name + ' - ' + (d.role || '') + (d.focus ? ' (' + d.focus + ')' : '');
    });
    return 'Here are some of our clinicians:\n\n' + lines.join('\n') + '\n\nYou can request a provider when you submit the booking form.';
  }

  function replyToUser(txt) {
    var t = txt.toLowerCase();
    setCOpts([]);

    if (wantsBooking(txt)) {
      addCMsg('Opening our secure booking form for you now.', 'sys');
      setTimeout(navigateToBooking, 500);
      return;
    }

    if (wantsDoctors(t) || /list doctors|who works|care team/i.test(t)) {
      addCMsg(formatDoctorsList(), 'sys');
      setCOpts([{ lbl: 'Book a visit', cb: navigateToBooking }]);
      return;
    }

    var svc = matchService(t);
    if (svc && !wantsDoctors(t)) {
      addCMsg(
        'We provide ' +
          svc.name +
          ". You'll find details on our dedicated page. I can open it or take you to booking when you're ready.",
        'sys'
      );
      setCOpts([
        { lbl: 'Open ' + svc.name + ' page', cb: function () { window.location.href = svc.page; closeChat(); } },
        { lbl: 'Book appointment', cb: navigateToBooking }
      ]);
      return;
    }

    if (/evans|paediatr|pediatr/i.test(t)) {
      addCMsg("Dr. Samantha Evans is our Head of Paediatrics, focused on children's health and development.", 'sys');
      setCOpts([{ lbl: 'Book appointment', cb: navigateToBooking }]);
      return;
    }
    if (/miller|family medicine|family practice/i.test(t)) {
      addCMsg('Dr. Jonathan Miller provides family medicine and preventative care for all ages.', 'sys');
      setCOpts([{ lbl: 'Book appointment', cb: navigateToBooking }]);
      return;
    }
    if (/\blee\b|internal medicine|chronic/i.test(t)) {
      addCMsg('Dr. David Lee focuses on internal medicine, including chronic disease management.', 'sys');
      setCOpts([{ lbl: 'Book appointment', cb: navigateToBooking }]);
      return;
    }
    if (/jenkins|women|ob|gyn|gynaec/i.test(t)) {
      addCMsg("Dr. Sarah Jenkins leads our women's health services, including reproductive care.", 'sys');
      setCOpts([{ lbl: 'Book appointment', cb: navigateToBooking }]);
      return;
    }

    if (/hour|open|close|when are you|schedule/i.test(t)) {
      addCMsg(
        'Typical hours: Monday-Friday 8:00am-6:00pm, Saturday 9:00am-2:00pm. Sunday we are closed for routine visits (on-call support may apply). Hours can vary - confirm on our Contact page or when you book.',
        'sys'
      );
      setCOpts([
        { lbl: 'Contact page', cb: function () { window.location.href = 'contact.html'; closeChat(); } },
        { lbl: 'Book appointment', cb: navigateToBooking }
      ]);
      return;
    }

    if (/phone|call|email|address|location|map|where/i.test(t)) {
      addCMsg(
        'Visit our Contact page for phone, email, and address. Main line example: (03) 1234 5678 - 100 Healthway Drive, Suite 200, MedCity 4211.',
        'sys'
      );
      setCOpts([
        { lbl: 'Open Contact', cb: function () { window.location.href = 'contact.html'; closeChat(); } },
        { lbl: 'Book appointment', cb: navigateToBooking }
      ]);
      return;
    }

    if (/fee|bill|cost|price|medicare/i.test(t)) {
      addCMsg('We are a mixed-billing practice. See our Fees & Billing page for the latest information.', 'sys');
      setCOpts([{ lbl: 'Fees & Billing', cb: function () { window.location.href = 'fees.html'; closeChat(); } }]);
      return;
    }

    if (/form|new patient|paperwork/i.test(t)) {
      addCMsg('New patients can complete forms before their visit. See Patient Forms on the website.', 'sys');
      setCOpts([{ lbl: 'Patient Forms', cb: function () { window.location.href = 'patient-forms.html'; closeChat(); } }]);
      return;
    }

    if (/what to bring|bring to|id card|insurance card|medications/i.test(t)) {
      addCMsg(
        'For your visit, bring photo ID, your Medicare or insurance details, a list of current medications and allergies, and any recent test results or referrals that apply.',
        'sys'
      );
      setCOpts([{ lbl: 'Open booking form', cb: navigateToBooking }]);
      return;
    }

    if (/career|job|hiring|work here/i.test(t)) {
      addCMsg('Interested in joining our team? Visit our Careers page for roles and how to apply.', 'sys');
      setCOpts([{ lbl: 'Careers', cb: function () { window.location.href = 'career.html'; closeChat(); } }]);
      return;
    }

    if (currentTab === 'book') {
      addCMsg('The fastest way to book is our online form. Tap below to continue.', 'sys');
      setCOpts([{ lbl: 'Open booking form', cb: navigateToBooking }]);
      return;
    }

    addCMsg(
      'I cover MJD Health services, our doctors, hours, and bookings. Try asking about a service (e.g. immunisation), a doctor\'s name, or say "book an appointment" to go to the booking page. You can also switch tabs above.',
      'sys'
    );
    setCOpts([
      { lbl: 'Book appointment', cb: navigateToBooking },
      { lbl: 'Service list', cb: function () { setTab('services'); } },
      { lbl: 'Doctors', cb: function () { setTab('doctors'); } }
    ]);
  }

  function bindUI() {
    document.getElementById('mjdWcChat').addEventListener('click', openChat);
    document.getElementById('mjdCpClose').addEventListener('click', closeChat);
    document.getElementById('mjdSendChat').addEventListener('click', sendChat);
    var inp = getEl('cInp');
    if (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendChat();
      });
    }

    document.querySelectorAll('.cp-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-mjd-tab');
        var body = getEl('cBody');
        if (body) body.innerHTML = '';
        if (body) body.dataset.seeded = '1';
        setTab(tab);
      });
    });
  }

  window.openChat = openChat;
  window.closeChat = closeChat;
  window.sendChat = sendChat;
  window.replyToUser = replyToUser;
  window.navigateToBooking = navigateToBooking;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHTML);
  } else {
    mountHTML();
  }
})();
