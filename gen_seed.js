// Learnova seed generator — 50 users, 50 courses, 20 lessons/course, 300+ rows per table
"use strict";
const fs = require("fs");
const out = [];
const w = (s) => out.push(s);

const PW = "$2b$12$QrkQuNKno8dx98EyUwMDe.lcEXGp0971Hhgyf2bVOhhBxGBL8qmbW";
const SQ = "What was the name of your first pet?";
const SAH = "$2b$12$mvSxmiayOpy6kiYilfWZFu2D8EFHnHoVgd5V2mtzDBqITl1wKT05i";

function sq(s) {
  return s.replace(/'/g, "''");
}
function pad(n) {
  return String(n).padStart(2, "0");
}
// safe day 1-28
function day(n) {
  return pad(((Math.abs(n) - 1) % 28) + 1);
}

w("BEGIN;");
w("TRUNCATE TABLE");
w("  quiz_attempt_answers,quiz_attempts,quiz_weak_areas,quiz_rewards,");
w("  quiz_options,quiz_questions,quizzes,");
w("  lesson_attachments,lesson_progress,enrollments,");
w("  purchases,reviews,lessons,courses,users");
w("RESTART IDENTITY CASCADE;");
w("");

// ── USERS ────────────────────────────────────────────────────
const LEARNER_IDS = Array.from({ length: 44 }, (_, i) => i + 7);
const INST_IDS = [2, 3, 4, 5, 6];
const NAMES = [
  "Aarav Singh",
  "Ananya Gupta",
  "Vivaan Reddy",
  "Ishaan Nair",
  "Diya Iyer",
  "Aryan Kapoor",
  "Saanvi Mishra",
  "Reyansh Jain",
  "Anika Sharma",
  "Kabir Verma",
  "Myra Patel",
  "Advait Joshi",
  "Kiara Singh",
  "Dhruv Gupta",
  "Navya Reddy",
  "Arnav Nair",
  "Pari Iyer",
  "Vihaan Kapoor",
  "Anvi Mishra",
  "Ayaan Jain",
  "Riya Sharma",
  "Sai Verma",
  "Tara Patel",
  "Yash Joshi",
  "Zara Singh",
  "Aditya Gupta",
  "Bhavya Reddy",
  "Chirag Nair",
  "Divya Iyer",
  "Eshan Kapoor",
  "Falak Mishra",
  "Gaurav Jain",
  "Harini Sharma",
  "Ishan Verma",
  "Jiya Patel",
  "Krish Joshi",
  "Lavanya Singh",
  "Manav Gupta",
  "Nisha Reddy",
  "Om Nair",
  "Pooja Iyer",
  "Qasim Kapoor",
  "Ritika Mishra",
  "Sahil Jain",
];
const INST_NAMES = [
  "Arjun Mehta",
  "Priya Sharma",
  "Rohit Verma",
  "Sneha Patel",
  "Karan Joshi",
];
const INST_EMAILS = [
  "arjun@learnova.com",
  "priya@learnova.com",
  "rohit@learnova.com",
  "sneha@learnova.com",
  "karan@learnova.com",
];

const uRows = [];
uRows.push(
  `(1,'Rakshil Admin','admin@learnova.com','${PW}','admin',0,'${SQ}','${SAH}','2024-08-01','2024-08-01')`,
);
for (let i = 0; i < 5; i++) {
  const d = `2024-08-0${3 + i * 2}`;
  uRows.push(
    `(${i + 2},'${INST_NAMES[i]}','${INST_EMAILS[i]}','${PW}','instructor',0,'${SQ}','${SAH}','${d}','${d}')`,
  );
}
for (let i = 0; i < 44; i++) {
  const d = `2024-08-${pad(14 + (i % 17))}`;
  uRows.push(
    `(${i + 7},'${NAMES[i]}','learner${i + 1}@gmail.com','${PW}','learner',0,'${SQ}','${SAH}','${d}','${d}')`,
  );
}
w("-- USERS (50)");
w(
  `INSERT INTO users(id,name,email,password_hash,role,total_points,security_question,security_answer_hash,created_at,updated_at) VALUES`,
);
w(uRows.join(",\n") + ";");
w("");

// ── COURSES (50) ─────────────────────────────────────────────
const TITLES = [
  "Python Basics for Beginners",
  "Web Development with HTML & CSS",
  "Data Science with Python",
  "Advanced Python & Algorithms",
  "JavaScript Fundamentals",
  "Python for Data Analysis",
  "REST API Development",
  "Git & GitHub Mastery",
  "Linux Command Line Basics",
  "Bash Scripting Essentials",
  "UI/UX Design Fundamentals",
  "Digital Marketing Masterclass",
  "Graphic Design with Canva",
  "Advanced UI/UX & Design Systems",
  "Content Writing & Copywriting",
  "Social Media Marketing",
  "Brand Identity Design",
  "Email Marketing Mastery",
  "SEO for Beginners",
  "Video Editing Basics",
  "React JS Complete Guide",
  "Node JS & Express Backend",
  "SQL Mastery for Developers",
  "Full Stack Web Development",
  "TypeScript for JavaScript Developers",
  "MongoDB for Developers",
  "GraphQL API Design",
  "Docker & Kubernetes Essentials",
  "Microservices Architecture",
  "Redis & Caching Strategies",
  "Machine Learning A to Z",
  "Excel for Beginners to Advanced",
  "Cloud Computing with AWS",
  "Deep Learning with TensorFlow",
  "Natural Language Processing",
  "Data Visualization with Power BI",
  "Statistics for Data Science",
  "Apache Spark Fundamentals",
  "Tableau for Business Analytics",
  "AI Ethics & Responsible ML",
  "Cybersecurity Fundamentals",
  "Blockchain & Web3 Development",
  "Ethical Hacking Basics",
  "Network Security Essentials",
  "Penetration Testing with Kali",
  "Smart Contract Development",
  "Cryptography Fundamentals",
  "Cloud Security on AWS",
  "Zero Trust Security Model",
  "DevSecOps Practices",
];
const SLUGS = TITLES.map((t) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, ""),
);
const IMGS = [
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
  "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
  "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800",
  "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
  "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800",
  "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800",
  "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
];
// payment: every 5th starting at id 3 → 3,8,13,18,23,28,33,38,43,48
// unpublished: ids 9,10,19,20,29,30,39,40,49,50
// invitation: ids 4,14,24,34,44
const PAY_IDS = new Set([3, 8, 13, 18, 23, 28, 33, 38, 43, 48]);
const UNPU_IDS = new Set([9, 10, 19, 20, 29, 30, 39, 40, 49, 50]);
const INV_IDS = new Set([4, 14, 24, 34, 44]);
const PRICES = {
  3: 999,
  8: 1499,
  13: 1999,
  18: 999,
  23: 1499,
  28: 999,
  33: 1999,
  38: 1499,
  43: 999,
  48: 1999,
};

const cRows = [];
for (let i = 0; i < 50; i++) {
  const id = i + 1,
    inst = INST_IDS[Math.floor(i / 10)],
    t = TITLES[i];
  const pub = !UNPU_IDS.has(id),
    vis = i % 7 === 0 ? "signed_in" : "everyone";
  const acc = PAY_IDS.has(id)
    ? "payment"
    : INV_IDS.has(id)
      ? "invitation"
      : "open";
  const price = PAY_IDS.has(id) ? PRICES[id] : "NULL";
  const dt = `2024-09-${day(i + 1)}`;
  const tags = `ARRAY['${t.toLowerCase().split(" ").slice(0, 3).join("','")}']`;
  cRows.push(
    `(${id},'${sq(t)}',${tags},'${SLUGS[i]}','${IMGS[i % 10]}','Learn ${sq(t)}.','A comprehensive course on ${sq(t)}.',${pub},'${vis}','${acc}',${price},${inst},${inst},'${dt}','${dt}')`,
  );
}
w("-- COURSES (50)");
w(
  `INSERT INTO courses(id,title,tags,website_slug,cover_image_url,short_description,description,is_published,visibility,access_rule,price,created_by,course_admin_id,created_at,updated_at) VALUES`,
);
w(cRows.join(",\n") + ";");
w("");

// ── LESSONS (1000 — 20/course) ───────────────────────────────
// positions: video=0,2,4,6,8,10,12,14,16  doc=1,3,18  image=5,7  quiz=9,11,13,15,17,19
const QUIZ_POS = [9, 11, 13, 15, 17, 19];
const YT = [
  "https://www.youtube.com/watch?v=rfscVS0vtbw",
  "https://www.youtube.com/watch?v=qz0aGYrrlhU",
  "https://www.youtube.com/watch?v=ua-CiDNNj30",
  "https://www.youtube.com/watch?v=MYAEv3JoenI",
  "https://www.youtube.com/watch?v=1Rs2ND1ryYc",
  "https://www.youtube.com/watch?v=SRec90j6lTY",
  "https://www.youtube.com/watch?v=bixR-KIJKYM",
  "https://www.youtube.com/watch?v=_2LLXnUdUIc",
  "https://www.youtube.com/watch?v=Yi-A20x2dcA",
  "https://www.youtube.com/watch?v=vmEHCJofslg",
];

function ltype(p) {
  return [1, 3, 18].includes(p)
    ? "document"
    : [5, 7].includes(p)
      ? "image"
      : QUIZ_POS.includes(p)
        ? "quiz"
        : "video";
}
function ltitle(t, p) {
  const k = t.split(" ").slice(0, 2).join(" ");
  const T = [
    `Introduction to ${k}`,
    `${k} Setup Guide`,
    `Core Concepts of ${k}`,
    `${k} Reference Sheet`,
    `Working with ${k}`,
    `${k} Cheat Sheet`,
    `Advanced ${k} Techniques`,
    `${k} Visual Guide`,
    `${k} Deep Dive`,
    `${k} Quiz 1`,
    `${k} in Practice`,
    `${k} Quiz 2`,
    `Building with ${k}`,
    `${k} Quiz 3`,
    `${k} Best Practices`,
    `${k} Quiz 4`,
    `Real-world ${k} Projects`,
    `${k} Quiz 5`,
    `${k} Summary & Review`,
    `${k} Final Quiz`,
  ];
  return T[p] || `${k} Lesson ${p + 1}`;
}

const lRows = [];
for (let c = 1; c <= 50; c++) {
  for (let p = 0; p < 20; p++) {
    const id = (c - 1) * 20 + p + 1,
      tp = ltype(p);
    const title = sq(ltitle(TITLES[c - 1], p));
    const desc = sq(`Lesson ${p + 1} of ${TITLES[c - 1]}`);
    const vurl = tp === "video" ? `'${YT[(c + p) % YT.length]}'` : "NULL";
    const dur = tp === "video" ? 600 + ((c * p * 37) % 3000) : "NULL";
    const furl =
      tp === "document"
        ? "'/uploads/sample.pdf'"
        : tp === "image"
          ? "'/uploads/sample.jpg'"
          : "NULL";
    const dl = tp === "document" ? "TRUE" : "FALSE";
    const dt = `2024-10-${day(p + 1)}`;
    lRows.push(
      `(${id},${c},'${title}','${tp}','${desc}',${vurl},${dur},${furl},${dl},${p},'${dt}','${dt}')`,
    );
  }
}
w("-- LESSONS (1000)");
w(
  `INSERT INTO lessons(id,course_id,title,type,description,video_url,duration_seconds,file_url,allow_download,position,created_at,updated_at) VALUES`,
);
w(lRows.join(",\n") + ";");
w("");

// ── LESSON ATTACHMENTS (500 — 10/course: 5 video lessons × 2) ──
const ATTACH_POS = [0, 2, 4, 6, 8];
const aRows = [];
let aId = 1;
for (let c = 1; c <= 50; c++) {
  for (const vp of ATTACH_POS) {
    const lid = (c - 1) * 20 + vp + 1,
      dt = `2024-10-${day(vp + 1)}`;
    aRows.push(
      `(${aId++},${lid},'link','Reference Documentation','https://docs.example.com/${SLUGS[c - 1]}','${dt}')`,
    );
    aRows.push(
      `(${aId++},${lid},'file','Course Slides','/uploads/slides.pdf','${dt}')`,
    );
  }
}
w("-- LESSON ATTACHMENTS (500)");
w(
  `INSERT INTO lesson_attachments(id,lesson_id,type,label,url,created_at) VALUES`,
);
w(aRows.join(",\n") + ";");
w("");

// ── QUIZZES (300 — 6/course) ─────────────────────────────────
const qzRows = [];
for (let c = 1; c <= 50; c++) {
  for (let q = 0; q < 6; q++) {
    const qid = (c - 1) * 6 + q + 1,
      lid = (c - 1) * 20 + QUIZ_POS[q] + 1;
    const title = sq(`${TITLES[c - 1]} — Quiz ${q + 1}`);
    const dt = `2024-10-${pad(15 + q)}`;
    qzRows.push(`(${qid},${c},${lid},'${title}','${dt}')`);
  }
}
w("-- QUIZZES (300)");
w(`INSERT INTO quizzes(id,course_id,lesson_id,title,created_at) VALUES`);
w(qzRows.join(",\n") + ";");
w("");

// ── QUIZ QUESTIONS (900 — 3/quiz) ────────────────────────────
const QTEXTS = [
  [
    "What is the primary purpose of this topic?",
    "Which best describes the concept?",
    "What is the correct syntax?",
  ],
  [
    "How does this feature improve performance?",
    "Which method is most appropriate?",
    "What does this keyword do?",
  ],
  [
    "What is the output of this code?",
    "Which statement is TRUE?",
    "What is the best practice?",
  ],
  [
    "Which tool is used for this task?",
    "What does this acronym stand for?",
    "Which approach is most efficient?",
  ],
  [
    "What is the default value here?",
    "Which is NOT a valid option?",
    "What happens when this condition is met?",
  ],
  [
    "How do you initialize this?",
    "Which command performs this action?",
    "What is the time complexity?",
  ],
];
const qqRows = [];
for (let qid = 1; qid <= 300; qid++) {
  const set = QTEXTS[(qid - 1) % QTEXTS.length];
  for (let qi = 0; qi < 3; qi++)
    qqRows.push(`(${(qid - 1) * 3 + qi + 1},${qid},'${sq(set[qi])}',${qi})`);
}
w("-- QUIZ QUESTIONS (900)");
w(`INSERT INTO quiz_questions(id,quiz_id,question_text,position) VALUES`);
w(qqRows.join(",\n") + ";");
w("");

// ── QUIZ OPTIONS (3600 — 4/question) ─────────────────────────
const OSETS = [
  [
    "To define a variable",
    "To execute a loop",
    "To declare a function",
    "To import a module",
  ],
  [
    "Reduces memory usage",
    "Increases execution speed",
    "Simplifies syntax",
    "Enables parallelism",
  ],
  ["print()", "console.log()", "echo()", "write()"],
  [
    "By caching results",
    "By using indexes",
    "By reducing I/O",
    "By compressing data",
  ],
  ["map()", "filter()", "reduce()", "forEach()"],
  ["var", "let", "const", "function"],
  ["42", "undefined", "null", "NaN"],
  ["Always true", "Depends on context", "Never true", "Throws an error"],
  [
    "Use try-catch",
    "Use a global variable",
    "Use a static method",
    "Use a callback",
  ],
  ["webpack", "babel", "eslint", "prettier"],
  [
    "Application Programming Interface",
    "Automated Process Integration",
    "Advanced Protocol Interface",
    "Application Process Index",
  ],
  ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
];
const opRows = [];
for (let qqid = 1; qqid <= 900; qqid++) {
  const set = OSETS[(qqid - 1) % OSETS.length];
  const ci = (qqid - 1) % 4;
  for (let oi = 0; oi < 4; oi++)
    opRows.push(
      `(${(qqid - 1) * 4 + oi + 1},${qqid},'${sq(set[oi])}',${oi === ci})`,
    );
}
w("-- QUIZ OPTIONS (3600)");
w(`INSERT INTO quiz_options(id,question_id,option_text,is_correct) VALUES`);
w(opRows.join(",\n") + ";");
w("");

// ── QUIZ REWARDS (1200 — 4/quiz) ─────────────────────────────
const rwRows = [];
for (let qid = 1; qid <= 300; qid++) {
  const b = (qid - 1) * 4;
  rwRows.push(
    `(${b + 1},${qid},1,10),(${b + 2},${qid},2,7),(${b + 3},${qid},3,4),(${b + 4},${qid},0,2)`,
  );
}
w("-- QUIZ REWARDS (1200)");
w(`INSERT INTO quiz_rewards(id,quiz_id,attempt_number,points) VALUES`);
w(rwRows.join(",\n") + ";");
w("");

// ── PURCHASES (500) ──────────────────────────────────────────
// 10 payment courses × 50 unique learner purchases = 500
// Each payment course gets all 44 learners + 6 repeats avoided by using unique uid per course
const PAY_ARR = [3, 8, 13, 18, 23, 28, 33, 38, 43, 48];
const purchasedSet = new Set();
const prRows = [];
let prId = 1;
for (const cid of PAY_ARR) {
  const price = PRICES[cid];
  // 50 unique learners per course — cycle through 44, wrap with offset per course
  const offset = PAY_ARR.indexOf(cid) * 3;
  for (let i = 0; i < 50; i++) {
    const uid = LEARNER_IDS[(i + offset) % LEARNER_IDS.length];
    const key = `${uid}-${cid}`;
    if (purchasedSet.has(key)) continue; // skip true duplicates
    purchasedSet.add(key);
    prRows.push(`(${prId++},${uid},${cid},${price},'2024-10-${day(i + 1)}')`);
  }
}
w("-- PURCHASES (" + prRows.length + ")");
w(
  `INSERT INTO purchases(id,user_id,course_id,amount_paid,purchased_at) VALUES`,
);
w(prRows.join(",\n") + ";");
w("");

// ── ENROLLMENTS (500) ────────────────────────────────────────
const PUB_IDS = Array.from({ length: 50 }, (_, i) => i + 1).filter(
  (id) => !UNPU_IDS.has(id),
); // 40 published
const enrolledSet = new Set();
const enRows = [];
let enId = 1;
// status distribution: 100 yet_to_start, 200 in_progress, 200 completed
const STATUS_POOL = [];
for (let i = 0; i < 50; i++) STATUS_POOL.push("yet_to_start");
for (let i = 0; i < 150; i++) STATUS_POOL.push("in_progress");
for (let i = 0; i < 300; i++) STATUS_POOL.push("completed");

for (let li = 0; li < LEARNER_IDS.length && enId <= 500; li++) {
  const uid = LEARNER_IDS[li];
  for (let ci = 0; ci < PUB_IDS.length && enId <= 500; ci++) {
    const cid = PUB_IDS[(li * 7 + ci) % PUB_IDS.length];
    const key = `${uid}-${cid}`;
    if (enrolledSet.has(key)) continue;
    if (PAY_IDS.has(cid) && !purchasedSet.has(key)) continue;
    enrolledSet.add(key);
    const status = STATUS_POOL[enId - 1] || "in_progress";
    const eDay = day(li * 3 + ci + 20);
    const sDay = day(li * 3 + ci + 22);
    const cDay = day(li + ci + 1);
    const startAt = status !== "yet_to_start" ? `'2024-10-${sDay}'` : "NULL";
    const compAt = status === "completed" ? `'2024-11-${cDay}'` : "NULL";
    enRows.push(
      `(${enId++},${uid},${cid},'${status}','2024-10-${eDay}',${startAt},${compAt})`,
    );
  }
}
w("-- ENROLLMENTS (" + enRows.length + ")");
w(
  `INSERT INTO enrollments(id,user_id,course_id,status,enrolled_at,started_at,completed_at) VALUES`,
);
w(enRows.join(",\n") + ";");
w("");

// parse enrollment status
const completedEnrolls = [],
  inProgressEnrolls = [];
enRows.forEach((r) => {
  const m = r.match(/^\((\d+),(\d+),(\d+),'(\w+)'/);
  if (!m) return;
  const [, eid, uid, cid, status] = m;
  if (status === "completed") completedEnrolls.push({ uid: +uid, cid: +cid });
  else if (status === "in_progress")
    inProgressEnrolls.push({ uid: +uid, cid: +cid });
});

// ── LESSON PROGRESS (500) ────────────────────────────────────
// in_progress: 3 rows (pos 0 completed, pos 1 completed, pos 2 in_progress)
// completed: up to 20 rows all completed
const lpSet = new Set(); // "uid-lid"
const lpRows = [];
let lpId = 1;

// completed enrollments FIRST — all 20 lessons each (quiz lessons at pos 9,11,13,15,17,19 must be covered)
// cap at 3000 rows so quiz attempts can be generated
for (const { uid, cid } of completedEnrolls) {
  const base = (cid - 1) * 20;
  for (let p = 0; p < 20; p++) {
    const lid = base + p + 1,
      key = `${uid}-${lid}`;
    if (lpSet.has(key)) continue;
    lpSet.add(key);
    const ts = 300 + ((uid * cid * (p + 1)) % 2700);
    lpRows.push(
      `(${lpId++},${uid},${lid},${cid},'completed',${ts},'2024-11-${day(uid + cid + p)}')`,
    );
  }
}

// in_progress — 3 rows each
for (const { uid, cid } of inProgressEnrolls) {
  const base = (cid - 1) * 20;
  for (let p = 0; p < 3; p++) {
    const lid = base + p + 1,
      key = `${uid}-${lid}`;
    if (lpSet.has(key)) continue;
    lpSet.add(key);
    const st = p < 2 ? "completed" : "in_progress";
    const ts = 300 + ((uid * cid * (p + 1)) % 2700);
    const cat = st === "completed" ? `'2024-11-${day(uid + cid + p)}'` : "NULL";
    lpRows.push(`(${lpId++},${uid},${lid},${cid},'${st}',${ts},${cat})`);
  }
}

w("-- LESSON PROGRESS (" + lpRows.length + ")");
w(
  `INSERT INTO lesson_progress(id,user_id,lesson_id,course_id,status,time_spent_seconds,completed_at) VALUES`,
);
w(lpRows.join(",\n") + ";");
w("");

// build completed LP set for quiz gating
const compLPSet = new Set();
lpRows.forEach((r) => {
  const m = r.match(/^\((\d+),(\d+),(\d+),(\d+),'completed'/);
  if (m) compLPSet.add(`${m[2]}-${m[3]}`);
});

// ── QUIZ ATTEMPTS (500) ──────────────────────────────────────
// Generate ALL attempts unbounded across 3 passes, then slice to 500
// This ensures multi-attempts exist so weak_areas can be populated
const attTracker = {}; // "uid-qid" -> count
const qaRowsAll = [];
let qaIdAll = 1;

// completed enrollments always have all lessons done — no LP check needed
for (let pass = 1; pass <= 3; pass++) {
  for (const { uid, cid } of completedEnrolls) {
    for (let qi = 0; qi < 6; qi++) {
      const qid = (cid - 1) * 6 + qi + 1;
      const key = `${uid}-${qid}`;
      const prev = attTracker[key] || 0;
      if (prev !== pass - 1) continue; // only add this pass's attempt
      const maxAtt = (uid + qid) % 3 === 0 ? 3 : (uid + qid) % 2 === 0 ? 2 : 1;
      if (pass > maxAtt) continue;
      attTracker[key] = pass;
      const pts = pass === 1 ? 10 : pass === 2 ? 7 : 4;
      qaRowsAll.push(
        `(${qaIdAll++},${uid},${qid},${pass},${pts},'2024-11-${day(uid + qid + pass)}')`,
      );
    }
  }
}

// Slice to 500 ensuring multi-attempt pairs are included
// Group rows by uid-qid key, keeping all attempts per pair
const pairMap = {};
for (const r of qaRowsAll) {
  const m = r.match(/^\(\d+,(\d+),(\d+),(\d+)/);
  if (!m) continue;
  const key = `${m[1]}-${m[2]}`;
  if (!pairMap[key]) pairMap[key] = [];
  pairMap[key].push(r);
}
// Sort pairs: multi-attempt pairs first, then single
const sortedPairs = Object.values(pairMap).sort((a, b) => b.length - a.length);
// Fill up to 500 rows, keeping complete pairs together
const qaRowsMerged = [];
for (const pair of sortedPairs) {
  if (qaRowsMerged.length + pair.length > 500) {
    // Add remaining singles if space
    if (pair.length === 1 && qaRowsMerged.length < 500)
      qaRowsMerged.push(pair[0]);
    continue;
  }
  for (const r of pair) qaRowsMerged.push(r);
}
// Re-number IDs sequentially
const qaRows = qaRowsMerged.map((r, i) => r.replace(/^\(\d+,/, `(${i + 1},`));

w("-- QUIZ ATTEMPTS (" + qaRows.length + ")");
if (qaRows.length > 0) {
  w(
    `INSERT INTO quiz_attempts(id,user_id,quiz_id,attempt_number,points_earned,completed_at) VALUES`,
  );
  w(qaRows.join(",\n") + ";");
}
w("");

// ── QUIZ ATTEMPT ANSWERS (500) ───────────────────────────────
const aaSet = new Set();
const aaRows = [];
let aaId = 1;

for (let ai = 0; ai < qaRows.length && aaId <= 500; ai++) {
  const m = qaRows[ai].match(/^\((\d+),\d+,(\d+),(\d+)/);
  if (!m) continue;
  const [, attemptId, qid, att] = m.map(Number);
  for (let qi = 0; qi < 3 && aaId <= 500; qi++) {
    const qqid = (qid - 1) * 3 + qi + 1;
    const aKey = `${attemptId}-${qqid}`;
    if (aaSet.has(aKey)) continue;
    aaSet.add(aKey);
    const ci = (qqid - 1) % 4;
    const chosen =
      att === 1 ? (qi < 2 ? ci : (ci + 1) % 4) : qi === 0 ? ci : (ci + 1) % 4;
    aaRows.push(
      `(${aaId++},${attemptId},${qqid},${(qqid - 1) * 4 + chosen + 1})`,
    );
  }
}

w("-- QUIZ ATTEMPT ANSWERS (" + aaRows.length + ")");
if (aaRows.length > 0) {
  w(
    `INSERT INTO quiz_attempt_answers(id,attempt_id,question_id,selected_option_id) VALUES`,
  );
  w(aaRows.join(",\n") + ";");
}
w("");

// ── QUIZ WEAK AREAS (up to 500) ──────────────────────────────
const waMap = {};
qaRows.forEach((r) => {
  const m = r.match(/^\((\d+),(\d+),(\d+),(\d+),(\d+),'2024-11-(\d+)'/);
  if (!m) return;
  const [, id, uid, qid, att, pts, d] = m.map(Number);
  const cid = Math.ceil(qid / 6);
  const key = `${uid}-${qid}`;
  if (!waMap[key]) waMap[key] = { uid, qid, cid, total: 0, sum: 0, lastDay: 0 };
  waMap[key].total++;
  waMap[key].sum += att === 1 ? 67 : 33;
  waMap[key].lastDay = Math.max(waMap[key].lastDay, d);
});

const waRows = [];
let waId = 1;
// multi-attempt first
for (const { uid, qid, cid, total, sum, lastDay } of Object.values(waMap)) {
  if (waId > 500) break;
  if (total < 2) continue;
  waRows.push(
    `(${waId++},${uid},${qid},${cid},${total},${(sum / total).toFixed(2)},'2024-11-${pad(lastDay)}',TRUE)`,
  );
}
// single-attempt low scorers
for (const { uid, qid, cid, total, sum, lastDay } of Object.values(waMap)) {
  if (waId > 500) break;
  if (total >= 2) continue;
  const avg = sum / total;
  if (avg >= 60) continue;
  waRows.push(
    `(${waId++},${uid},${qid},${cid},${total},${avg.toFixed(2)},'2024-11-${pad(lastDay)}',FALSE)`,
  );
}

w("-- QUIZ WEAK AREAS (" + waRows.length + ")");
if (waRows.length > 0) {
  w(
    `INSERT INTO quiz_weak_areas(id,user_id,quiz_id,course_id,total_attempts,avg_score_pct,last_attempted,is_weak) VALUES`,
  );
  w(waRows.join(",\n") + ";");
}
w("");

// ── REVIEWS (500) ────────────────────────────────────────────
const RTEXTS = [
  "Really enjoyed the hands-on examples. The quiz was challenging but fair.",
  "Excellent course structure. Each lesson builds perfectly on the previous one.",
  "The best course I have found on this topic. Highly recommend to anyone.",
  "Incredibly well-paced. Complex concepts explained in a simple way.",
  "Transformed how I approach this subject. The examples are absolutely gold.",
  "Great course with solid coverage. Would love more advanced content.",
  "Comprehensive overview. The practical exercises make the theory stick.",
  "Good pacing and clear explanations. A few more exercises would make it perfect.",
  "Very thorough coverage. The section on advanced topics was particularly useful.",
  "Solid course. Would love a follow-up on related topics.",
  "Decent course but some sections feel rushed. Still learned the basics.",
  "Good content but the video quality varies. Overall worth it for beginners.",
  "Average course. Some concepts are explained too quickly.",
  "Decent introduction. Some topics are introduced without enough explanation.",
  "The course moves too fast for complete beginners. Needs more exercises.",
  "Disappointing. Expected much more depth for an advanced course.",
  "Too basic for anyone with prior experience. Needs a significant update.",
  "The course lacks depth. Missing some important modern techniques.",
  "Too surface-level for anyone serious about this topic. Needs updating.",
  "The course content is too generic. No platform-specific strategies.",
];
const RRATINGS = [5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 5, 4, 3, 2, 4];

const rvSet = new Set();
const rvRows = [];
let rvId = 1;
for (const { uid, cid } of [...inProgressEnrolls, ...completedEnrolls]) {
  if (rvId > 500) break;
  const key = `${uid}-${cid}`;
  if (rvSet.has(key)) continue;
  rvSet.add(key);
  const ri = (uid + cid) % RTEXTS.length;
  rvRows.push(
    `(${rvId++},${uid},${cid},${RRATINGS[ri]},'${sq(RTEXTS[ri])}','2024-11-${day(uid + cid)}')`,
  );
}

w("-- REVIEWS (" + rvRows.length + ")");
if (rvRows.length > 0) {
  w(
    `INSERT INTO reviews(id,user_id,course_id,rating,review_text,created_at) VALUES`,
  );
  w(rvRows.join(",\n") + ";");
}
w("");

// ── SEQUENCE RESETS ──────────────────────────────────────────
const seqs = [
  "users",
  "courses",
  "lessons",
  "lesson_attachments",
  "quizzes",
  "quiz_questions",
  "quiz_options",
  "quiz_rewards",
  "purchases",
  "enrollments",
  "lesson_progress",
  "quiz_attempts",
  "quiz_attempt_answers",
  "quiz_weak_areas",
  "reviews",
];
for (const t of seqs)
  w(`SELECT setval('${t}_id_seq',(SELECT MAX(id) FROM ${t}));`);
w("");
w("COMMIT;");
w("");
w(`SELECT 'Seed complete!' AS result,`);
w(`  (SELECT COUNT(*) FROM users)                AS users,`);
w(`  (SELECT COUNT(*) FROM courses)              AS courses,`);
w(`  (SELECT COUNT(*) FROM lessons)              AS lessons,`);
w(`  (SELECT COUNT(*) FROM lesson_attachments)   AS attachments,`);
w(`  (SELECT COUNT(*) FROM quizzes)              AS quizzes,`);
w(`  (SELECT COUNT(*) FROM quiz_questions)       AS questions,`);
w(`  (SELECT COUNT(*) FROM quiz_options)         AS options,`);
w(`  (SELECT COUNT(*) FROM quiz_rewards)         AS rewards,`);
w(`  (SELECT COUNT(*) FROM purchases)            AS purchases,`);
w(`  (SELECT COUNT(*) FROM enrollments)          AS enrollments,`);
w(`  (SELECT COUNT(*) FROM lesson_progress)      AS lesson_progress,`);
w(`  (SELECT COUNT(*) FROM quiz_attempts)        AS quiz_attempts,`);
w(`  (SELECT COUNT(*) FROM quiz_attempt_answers) AS answers,`);
w(`  (SELECT COUNT(*) FROM quiz_weak_areas)      AS weak_areas,`);
w(`  (SELECT COUNT(*) FROM reviews)              AS reviews;`);

fs.writeFileSync("seed_demo.sql", out.join("\n"));
console.log("Written seed_demo.sql");
console.log(
  "Enrollments:",
  enRows.length,
  "LP:",
  lpRows.length,
  "QA:",
  qaRows.length,
  "AA:",
  aaRows.length,
  "WA:",
  waRows.length,
  "RV:",
  rvRows.length,
);
