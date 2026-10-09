// AI-MasterPlan web server — hand-written Node using only built-in modules: http, fs, path, url, crypto.
// Hand-written Node server using only built-in modules: http, fs, path, url, crypto.
// Serves ./public + a small JSON API built from our own curriculum data.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const PORT = Number(process.env.PORT || 8082);
const ROOT = path.join(__dirname, 'public');

// ---- Our own curriculum data (hand-written, mirrors src/data/*) ----
const PRODUCT = { name: 'AI-MasterPlan', tagline: 'From zero coding to independent AI builder — learn by building.' };
const JOURNEY = ['Beginner','AI Fundamentals','Vibe Coding Basics','Build First Website','Build First Application','Connect APIs','Build AI Automation','Databases + Authentication','Build Full AI Application','Deployment','Independent System Builder'];
const SEED_LEVELS = [
  { id: 'L1', n: 1, title: 'Understanding AI & Vibe Coding', sum: 'AI, LLMs, prompts, app parts in plain words.', modules: [
    { id: 'L1M1', title: 'AI Foundations', lessons: [['L1M1L1','What is AI?',12],['L1M1L2','What is an LLM?',15],['L1M1L3','What is Vibe Coding?',15],['L1M1L4','AI vs Traditional Programming',14],['L1M1L5','Understanding Prompts',16]] },
    { id: 'L1M2', title: 'How Apps Work', lessons: [['L1M2L1','Understanding Context',14],['L1M2L2','Files and Folders',14],['L1M2L3','Basic Developer Terminology',12],['L1M2L4','Understanding an Application Architecture',18],['L1M2L5','First AI Coding Exercise',20]] } ] },
  { id: 'L2', n: 2, title: 'Setting Up Your Development Environment', sum: 'Editor, terminal, git, Node, run locally.', tools: ['ChatGPT','AI Coding Assistant','VS Code','GitHub','Git','Node.js','Terminal','Browser DevTools'], modules: [
    { id: 'L2M1', title: 'Install Your Toolkit', lessons: [['L2M1L1','Installing Required Tools',20],['L2M1L2','IDE / Code Editor Introduction',16],['L2M1L3','Git Basics',18],['L2M1L4','GitHub Account Setup',15],['L2M1L5','Node.js Installation',16]] },
    { id: 'L2M2', title: 'Run Your First Project', lessons: [['L2M2L1','Terminal Basics',15],['L2M2L2','Package Managers',14],['L2M2L3','Environment Variables',14],['L2M2L4','Project Folders',12],['L2M2L5','Running a Local Development Server',18]] } ] },
  { id: 'L3', n: 3, title: 'Build Your First Website', sum: 'Generate, style, navigate, debug, ship a site. PROJECT: Personal/Business Website.', project: 'P01', modules: [
    { id: 'L3M1', title: 'Web Basics with AI', lessons: [['L3M1L1','Generate Initial Project',20],['L3M1L2','HTML Concepts',18],['L3M1L3','CSS Concepts',20],['L3M1L4','JavaScript Concepts',20],['L3M1L5','Components',22]] },
    { id: 'L3M2', title: 'Ship a Complete Website', lessons: [['L3M2L1','Responsive Layouts',20],['L3M2L2','Navigation',16],['L3M2L3','Forms',20],['L3M2L4','Images and Assets',14],['L3M2L5','Debugging',18],['L3M2L6','Build a Complete Website',30]] } ] },
  { id: 'L4', n: 4, title: 'Build Your First Real Application', sum: 'Frontend, backend, APIs, JSON, REST, CRUD. PROJECT: Functional CRUD application.', project: 'P03', modules: [
    { id: 'L4M1', title: 'Client & Server', lessons: [['L4M1L1','Understand Frontend',16],['L4M1L2','Understand Backend',16],['L4M1L3','Understand Client/Server Communication',18],['L4M1L4','APIs',20],['L4M1L5','JSON',14],['L4M1L6','REST',16]] },
    { id: 'L4M2', title: 'CRUD in Practice', lessons: [['L4M2L1','Form Submission',22],['L4M2L2','Data Persistence',20],['L4M2L3','Error Handling + Functional CRUD Application',32]] } ] },
  { id: 'L5', n: 5, title: 'Databases & User Accounts', sum: 'Tables, queries, auth, sessions, env vars. PROJECT: Multi-user application.', project: 'P-multi', modules: [
    { id: 'L5M1', title: 'Data Basics', lessons: [['L5M1L1','Database Basics',16],['L5M1L2','Tables and Collections',18],['L5M1L3','Creating Records',18],['L5M1L4','Updating Records',16],['L5M1L5','Deleting Records',14],['L5M1L6','Querying Data',20]] },
    { id: 'L5M2', title: 'Accounts & Security', lessons: [['L5M2L1','Authentication',25],['L5M2L2','Authorization',20],['L5M2L3','User Sessions',18],['L5M2L4','User Profiles',18],['L5M2L5','Secure Environment Variables + Multi-User App',30]] } ] },
  { id: 'L6', n: 6, title: 'AI Integration', sum: 'LLM APIs, prompts, context, JSON, streaming, cost. PROJECT: AI-powered assistant.', project: 'P04', modules: [
    { id: 'L6M1', title: 'LLM APIs', lessons: [['L6M1L1','AI APIs',20],['L6M1L2','LLM API Concepts',18],['L6M1L3','System Prompts',20],['L6M1L4','User Prompts',18],['L6M1L5','Context Management',20]] },
    { id: 'L6M2', title: 'Production AI Features', lessons: [['L6M2L1','Structured Output',20],['L6M2L2','Tool and Function Calling',22],['L6M2L3','Streaming Responses',20],['L6M2L4','Error Handling',18],['L6M2L5','Usage and Cost Awareness + Assistant App',30]] } ] },
  { id: 'L7', n: 7, title: 'AI Automation', sum: 'Triggers, webhooks, schedules, approvals. PROJECT: Real-world AI automation.', project: 'P05', modules: [
    { id: 'L7M1', title: 'Automation Foundations', lessons: [['L7M1L1','Automation Fundamentals',20],['L7M1L2','Triggers',16],['L7M1L3','Actions',16],['L7M1L4','Webhooks',18],['L7M1L5','APIs for Automation',16],['L7M1L6','Scheduled Workflows',18]] },
    { id: 'L7M2', title: 'Real-World Automations', lessons: [['L7M2L1','Data Processing',18],['L7M2L2','Email Automation',20],['L7M2L3','CRM Automation',20],['L7M2L4','Social Automation',18],['L7M2L5','AI Decision Steps',22],['L7M2L6','Human Approval Workflows + Real Automation',30]] } ] },
  { id: 'L8', n: 8, title: 'AI Agents', sum: 'Tools, memory, planning, verification, multi-agent. PROJECT: Autonomous task agent.', project: 'P07', modules: [
    { id: 'L8M1', title: 'Agent Architecture', lessons: [['L8M1L1','What is an AI Agent?',20],['L8M1L2','Agent Architecture',20],['L8M1L3','Tools',20],['L8M1L4','Memory',18],['L8M1L5','Planning',20]] },
    { id: 'L8M2', title: 'Reliable Agents', lessons: [['L8M2L1','Execution',18],['L8M2L2','Verification',20],['L8M2L3','Multi-Step Tasks',22],['L8M2L4','Agent Safety and Permissions',22],['L8M2L5','Multi-Agent Workflows + Task Agent',32]] } ] },
  { id: 'L9', n: 9, title: 'Full AI System Development', sum: 'PRD to production SaaS. PROJECT: Production AI SaaS.', project: 'P09', modules: [
    { id: 'L9M1', title: 'Plan the System', lessons: [['L9M1L1','Product Requirements',22],['L9M1L2','System Architecture',22],['L9M1L3','Frontend Build',25],['L9M1L4','Backend Build',25],['L9M1L5','Database Build',22],['L9M1L6','Authentication Build',22],['L9M1L7','AI Integration Build',28]] },
    { id: 'L9M2', title: 'Build & Harden', lessons: [['L9M2L1','Agent Workflows',22],['L9M2L2','File Handling',20],['L9M2L3','Notifications',18],['L9M2L4','Logging',16],['L9M2L5','Error Handling',18],['L9M2L6','Testing',22],['L9M2L7','Security',22],['L9M2L8','Performance + SaaS Launch',30]] } ] },
  { id: 'L10', n: 10, title: 'Build Independently', sum: 'Fading hand-holding: plan, build, test, deploy solo. FINAL: own product.', project: 'P10', modules: [
    { id: 'L10M1', title: 'From Idea to Plan', lessons: [['L10M1L1','Turn an Idea into Requirements',25],['L10M1L2','Create PRD',22],['L10M1L3','Define Features',20],['L10M1L4','Design Architecture',22],['L10M1L5','Choose Technologies',18],['L10M1L6','Break Project into Tasks',20]] },
    { id: 'L10M2', title: 'Ship Your MVP', lessons: [['L10M2L1','Prompt AI Coding Agents Effectively',22],['L10M2L2','Review Generated Code',20],['L10M2L3','Debug Independently',25],['L10M2L4','Test Application',22],['L10M2L5','Deploy Application',25],['L10M2L6','Maintain Application',18],['L10M2L7','Improve + Present Your Product',35]] } ] },
];
const TOOLS = [
  ['ChatGPT','AI Assistants','Conversational AI for explanations and draft prompts.','freemium','💬','/icons/chatgpt.svg',
    'Ask anything in plain words and get explanations, examples and starter prompts.',
    'Create a free account at chat.openai.com — runs in the browser, nothing to install.',
    ['Open chat.openai.com and sign up with email, Google or Apple.', 'Paste a lesson prompt, press Enter, read the answer fully.', 'Compare the answer against the lesson objective before moving on.'],
    'https://chat.openai.com','https://chat.openai.com',['L1M1L1','L1M1L2','L1M1L5']],
  ['AI Coding Assistant','Coding Agents','Writes and edits code from plain-word prompts.','freemium','🤖','/icons/aicode.svg',
    'The core Vibe Coding engine: you describe, it writes the code, you review.',
    'Install an AI coding extension inside VS Code, then sign in.',
    ['Open VS Code → Extensions → install an AI coding assistant.', 'Sign in and open the lesson project folder.', 'Paste the lesson prompt and review every file it creates.'],
    'https://code.visualstudio.com','https://code.visualstudio.com',['L1M2L5','L2M1L1']],
  ['VS Code','IDEs','Free code editor with AI extensions.','free','📝','/icons/vscode.svg',
    'The home base where every project in this course gets built.',
    'Download the installer from code.visualstudio.com and accept the defaults.',
    ['Download the installer for your OS and accept the defaults.', 'Open the lesson project folder (not a single file).', 'Open the built-in terminal with View → Terminal.'],
    'https://code.visualstudio.com/docs/setup','https://code.visualstudio.com',['L2M1L1','L2M1L2']],
  ['Figma','Design Tools','Free design tool for page mockups and layouts.','freemium','🎨','/icons/figma.svg',
    'Sketch screens before coding so you rebuild less and finish faster.',
    'Create a free account at figma.com — it runs in the browser.',
    ['Sign up at figma.com on the free starter plan.', 'Make a phone-size frame (375×812) and block out 3 sections.', 'Share the link with your AI assistant as the design reference.'],
    'https://help.figma.com/hc/en-us/categories/360002051613','https://figma.com',['L3M2L1']],
  ['Supabase','Databases','Postgres + auth + storage with instant APIs.','freemium','🗄️','/icons/supabase.svg',
    'The backend for multi-user and AI apps: database, logins and file storage.',
    'Create a free project at supabase.com, then copy the URL + anon key into .env.',
    ['Create a free project at supabase.com and wait for provisioning.', 'Table Editor → New table (e.g. leads) with the lesson fields.', 'Copy the Project URL + anon key into .env — never commit the service key.'],
    'https://supabase.com/docs','https://supabase.com',['L5M1L1','L5M2L1']],
  ['n8n','Automation Platforms','Visual workflow builder: triggers → AI → actions.','freemium','🔗','/icons/n8n.svg',
    'Run Level 7 automations without writing servers: drag, connect, activate.',
    'Start an n8n Cloud trial, or self-host with npm i -g n8n.',
    ['Start n8n — the Cloud trial is fastest for beginners.', 'Build Webhook trigger → AI step → send/CRM action.', 'Activate, send a test event, then add the human-approval gate from L7.'],
    'https://docs.n8n.io','https://n8n.io',['L7M1L1','L7M2L6']],
  ['Node.js','APIs','Runs JavaScript and dev servers on your machine.','free','🟢','/icons/nodejs.svg',
    'Required to run lesson servers, tools and build scripts locally.',
    'Install the LTS build from nodejs.org, then verify with node --version.',
    ['Install the LTS build from nodejs.org for your OS.', 'Verify: node --version and npm --version both print numbers.', 'Run npm run dev in the lesson folder and open the printed URL.'],
    'https://nodejs.org/en/download','https://nodejs.org',['L2M1L5','L2M2L5']],
  ['GitHub','Git/GitHub','Hosts code with version history.','free','🐙','/icons/github.svg',
    'Backup for every project plus the portfolio employers actually open.',
    'Create an account at github.com, install git, set your name and email.',
    ['Sign up at github.com and verify your email.', 'Set git config user.name and user.email in the terminal.', 'Push the lesson repo: init → add → commit → push (see L2M1L4).'],
    'https://docs.github.com/get-started','https://github.com',['L2M1L4']],
  ['Git','Git/GitHub','Version control for every project.','free','🌿','/icons/git.svg',
    'Undo mistakes and track exactly what changed, file by file.',
    'Install from git-scm.com (or Xcode tools / Git for Windows).',
    ['Install git, then check git --version prints a number.', 'Practice status → add → commit → log in a scratch folder.', 'Learn undo: git restore for files, git revert for commits.'],
    'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git','https://git-scm.com',['L2M1L3']],
  ['Netlify','Hosting','Free static hosting with instant deploy previews.','freemium','🌐','/icons/netlify.svg',
    'Publish Level 3 websites to a real link in minutes, free.',
    'Sign up at netlify.com, then drag-and-drop the build folder.',
    ['Build the site (npm run build) and find the output folder.', 'Drag that folder onto Netlify Drop — or connect the GitHub repo.', 'Copy the live URL and test it on your phone.'],
    'https://docs.netlify.com','https://netlify.com',['L3M2L6']],
  ['Expo','Deployment','Builds phone apps for iOS + Android.','free','📱','/icons/expo.svg',
    'How this course itself ships to phones: one codebase, both stores.',
    'Install the CLI and scaffold with npx create-expo-app — see the docs.',
    ['Install the CLI and scaffold the lesson app.', 'Run npx expo start and scan the QR with Expo Go.', 'Ship with EAS build → store tracks (see L10M2L5).'],
    'https://docs.expo.dev','https://expo.dev',['L10M2L5']],
  ['Browser DevTools','Testing','Inspect and debug any web page.','free','🔍','/icons/devtools.svg',
    'See errors and fix layouts fast without guessing.',
    'Built into Chrome/Safari: press F12 (Mac: Cmd+Opt+I).',
    ['Open your page and press F12 (Mac: Cmd+Opt+I).', 'Console tab: read the first red error top to bottom.', 'Elements tab: click the page, tweak CSS live, copy the fix.'],
    'https://developer.chrome.com/docs/devtools','https://developer.chrome.com/docs/devtools',['L3M2L5']],
  ['Terminal','Productivity','Command line to run servers and git.','free','⌨️','/icons/terminal.svg',
    'The essential developer skill this course teaches gently, step by step.',
    'Already built into Mac, Windows and Linux — no install needed.',
    ['Open Terminal (Mac) or PowerShell/Terminal (Windows).', 'Practice: pwd → ls → cd into the lesson folder.', 'Run one safe command from the lesson, then echo hello.'],
    'https://support.apple.com/guide/terminal/welcome/mac','https://support.apple.com/guide/terminal/welcome/mac',['L2M2L1']],
];
// name, cat, what, price, icon, logo, why, install, setupSteps, setupUrl, website, related[]
function toolPayload() {
  const titles = {};
  try {
    getOrSeedCourse().levels.forEach((lv) => lv.modules.forEach((m) => m.lessons.forEach((l) => { titles[l.id] = l.title; })));
  } catch {}
  return TOOLS.map((t) => ({
    name: t[0], cat: t[1], what: t[2], price: t[3], icon: t[4], logo: t[5] || null,
    why: t[6] || '', install: t[7] || '', setupSteps: t[8] || [],
    setupUrl: t[9] || '', website: t[10] || '',
    related: (t[11] || []).filter((id) => titles[id]).map((id) => ({ id, title: titles[id] })),
  }));
}
const PROJECT_DETAIL = {
  P01: {
    requirements: ['3 pages: Home, About, Contact', 'Responsive on phone + desktop widths', 'Contact form validates + shows success', 'Your photo, bio and contact links included'],
    stack: ['HTML', 'CSS', 'JavaScript', 'VS Code', 'Netlify'],
    setup: ['Install VS Code, open a folder named personal-site.', 'Scaffold 3 HTML pages sharing one stylesheet + one script.', 'Run a local server (npx serve .) and open the URL.', 'Create assets/ with one photo + favicon.'],
    stages: ['Generate the 3-page skeleton with AI', 'Style hero, cards and footer mobile-first', 'Add navigation with active-page highlight', 'Add + validate the contact form', 'Debug at phone width, then publish'],
    prompts: ['GOAL: 3-page personal site (Home/About/Contact). CONTEXT: vanilla HTML/CSS/JS, one stylesheet. CONSTRAINTS: mobile-first, semantic tags. EXAMPLE: header/nav/main/footer per page.', 'GOAL: style system. CONTEXT: my unstyled pages. CONSTRAINTS: 2 fonts max, 3 colors. EXAMPLE: hero with headline + button.', 'GOAL: contact form. CONTEXT: no backend. CONSTRAINTS: validate email + message in-browser, success note. EXAMPLE: red hints, green confirm.'],
    testing: ['Phone + desktop widths: no sideways scroll', 'Submit form empty (errors) then valid (success)', 'Every nav link lands on the right page + highlight'],
    debugging: ['Blank page? DevTools Console → fix the first red error', 'Broken on phone? Toggle device toolbar, fix the breakpoint'],
    deployment: ['Drag the folder to Netlify Drop', 'Open the live URL on your phone, keep the link'],
    checklist: ['Responsive phone + desktop', 'Form validates + succeeds', 'Live URL posted in Showcase'],
  },
  P02: {
    requirements: ['Hero with headline + single CTA', 'Features section with 3 items', 'Signup form with success state', 'Mobile-first, fast load'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Figma', 'Netlify'],
    setup: ['Sketch hero + 3 features on paper or one Figma phone frame.', 'Scaffold the page from your sketch with AI.', 'Serve locally, keep a phone-width window open while styling.'],
    stages: ['Write copy: headline, subhead, CTA text', 'Build hero + features + signup sections', 'Wire signup validation + success', 'Polish spacing, images, speed'],
    prompts: ['GOAL: landing page for [product]. CONTEXT: single file + styles. CONSTRAINTS: one CTA, mobile-first. EXAMPLE: hero, 3 features, signup, footer.', 'GOAL: sharper headline. CONTEXT: current draft. CONSTRAINTS: 5 options, plain words. EXAMPLE: one promise + one button.', 'GOAL: signup validation. CONTEXT: no backend. CONSTRAINTS: email check, inline errors, success without reload.'],
    testing: ['Empty/invalid/valid signup → correct message each time', 'Phone + desktop visual pass, CTA visible without scroll', 'Images sized, no layout shift on load'],
    debugging: ['Weak CTA? Read headline aloud — one promise, one button', 'Shift on load? Set image dimensions + preload the font'],
    deployment: ['Publish via Netlify Drop or connected repo', 'Share live link + headline in Community for feedback'],
    checklist: ['One clear CTA above the fold', 'Clean mobile layout', 'Live URL + signup tested end to end'],
  },
  P03: {
    requirements: ['Create, read, update, delete items', 'Friendly error on every failure', 'Data survives refresh', 'Loading + empty states'],
    stack: ['JavaScript', 'Node.js', 'REST', 'JSON store', 'VS Code'],
    setup: ['Create crud-app, npm init -y, install minimal server deps.', 'Define the item shape {id, title, done} in one shared file.', 'Run API + client together, keep the Network tab open.'],
    stages: ['Design API: 4 routes + JSON shapes', 'Build list + create UI', 'Add edit + delete with confirm', 'Add errors, loading + empty states'],
    prompts: ['GOAL: REST API for items. CONTEXT: Node, JSON file store. CONSTRAINTS: GET/POST/PUT/DELETE, status codes. EXAMPLE: {id,title,done}.', 'GOAL: CRUD UI. CONTEXT: my API above. CONSTRAINTS: confirm before delete, optimistic list. EXAMPLE: add → appears instantly.', 'GOAL: resilient UI. CONTEXT: API can be down. CONSTRAINTS: friendly error card, retry button, skeleton rows.'],
    testing: ['Happy path: add → see → edit → delete → gone', 'Stop the API: friendly error, never blank page', 'Refresh mid-list: everything still there'],
    debugging: ['Network tab first: method, URL, status, body — in that order', 'Refresh wipes data? Save path disconnected — recheck write call'],
    deployment: ['Host API + static client (one service or split)', 'Smoke-test all 4 operations on the live URL'],
    checklist: ['CRUD works live', 'Errors friendly, never blank', 'Deployed + smoke-tested URL'],
  },
  P04: {
    requirements: ['Chat UI with history', 'LLM via server route, system + user prompts', 'Streaming token-by-token replies', 'Usage + cost caps with fallback'],
    stack: ['JavaScript', 'Node.js', 'LLM API', 'Supabase'],
    setup: ['Create LLM key, store ONLY server-side in .env.', 'Scaffold chat UI + POST /api/chat forwarding to the LLM.', 'Set caps: max tokens per reply + per day.'],
    stages: ['Write system prompt: role, rules, refusals', 'Wire /api/chat with history context', 'Add streaming render + typing dots', 'Add caps, error fallback, cost log'],
    prompts: ['GOAL: tutor system prompt. CONTEXT: beginners. CONSTRAINTS: short answers, one step at a time, refuse direct homework answers. EXAMPLE: hint, then check.', 'GOAL: better replies. CONTEXT: last 6 messages. CONSTRAINTS: stay in role, cite the step. EXAMPLE: good vs rambling reply.', 'GOAL: streaming + cap. CONTEXT: 200-token budget. CONSTRAINTS: render chunks, friendly “continued…” cutoff.'],
    testing: ['5 fixed questions → sane, on-role answers', 'Remove the key: fallback message, no crash', '20-turn chat: coherent, cap enforced'],
    debugging: ['Cost spike? Log prompt + tokens per reply, trim history', 'Garbled output? Enforce schema + retry once'],
    deployment: ['Host web + server route, env vars in host dashboard', 'Watch day-one token usage against the cap'],
    checklist: ['Streams smoothly', 'Key-off/limit handled gracefully', 'Cost cap tested + live'],
  },
  P05: {
    requirements: ['Event trigger from a real source', 'AI classify/score step', 'Notify + CRM/email action', 'Human approval before any send'],
    stack: ['Webhooks', 'n8n', 'LLM API', 'Supabase'],
    setup: ['Create an n8n workflow with a manual test trigger.', 'Connect one source: form webhook or test event sender.', 'Enable dry-run: log actions instead of sending.'],
    stages: ['Define trigger + event shape', 'Add AI classify + score', 'Add notify + CRM actions', 'Add approval gate, go live from dry-run'],
    prompts: ['GOAL: classify lead. CONTEXT: raw message. CONSTRAINTS: intent + score 0-1 + route reply/escalate/ignore. EXAMPLE: scored sample.', 'GOAL: welcome reply. CONTEXT: my voice, new lead. CONSTRAINTS: 3 sentences, opt-out line. EXAMPLE: warm + short.', 'GOAL: approval summary. CONTEXT: run result. CONSTRAINTS: what, why, confidence in 4 lines.'],
    testing: ['Dry-run: 10 events logged, zero sent', 'Approve → sent; reject → skipped + logged', 'Malformed event: skipped with reason, workflow stays green'],
    debugging: ['Failed run? Open run history, compare node input vs expected shape', 'Misroutes? Add 2 examples to the prompt, re-run eval set'],
    deployment: ['Activate n8n workflow or hosted route + scheduler', 'Go-live order: dry-run clean → approval tested → failure alerts on'],
    checklist: ['Approval blocks unapproved sends', 'CRM updated every run', 'Failure notifications wired'],
  },
  P06: {
    requirements: ['FAQ bot grounded in your docs', 'Human escalation with full context', 'Conversation log + review queue', 'Says “I don’t know” instead of inventing'],
    stack: ['LLM API', 'Supabase', 'JavaScript'],
    setup: ['Write 10 FAQs as plain Q/A documents (the knowledge base).', 'Scaffold chat UI + /api/support with retrieval over FAQs.', 'Create the review queue for flagged answers.'],
    stages: ['Build the 10-doc knowledge base', 'Wire grounded answers (docs only)', 'Add escalation with transcript', 'Review weekly, grow the KB'],
    prompts: ['GOAL: grounded answer. CONTEXT: retrieved docs below. CONSTRAINTS: answer ONLY from docs, else offer escalation. EXAMPLE: cited answer vs “I don’t know”.', 'GOAL: handoff summary. CONTEXT: full chat. CONSTRAINTS: issue, tried steps, sentiment in 5 lines.', 'GOAL: quality flag. CONTEXT: bot answer + docs. CONSTRAINTS: correct/partial/wrong + missing doc.'],
    testing: ['15 FAQ questions → grounded + correct; 5 off-topic → graceful “don’t know”', 'Escalation always carries transcript + summary', 'Spot-check 20 answers against docs, zero inventions'],
    debugging: ['Wrong answer? Check WHICH doc retrieved — fix the doc first', 'Hallucinations? Lower temperature, stricter “docs-only”, cite sources'],
    deployment: ['Host web + API; KB editable without redeploy', 'Put the weekly review on your calendar'],
    checklist: ['Escalates with context', 'Never invents policies', 'Review queue processed weekly'],
  },
  P07: {
    requirements: ['2+ tools with strict JSON schemas', 'Short-term notes + long-term facts', 'Plan → act → verify loop', 'Allowlist permissions + approvals'],
    stack: ['LLM API', 'Node.js', 'Agent runtime', 'Supabase'],
    setup: ['Define the goal + 2 tools (search, save) with JSON schemas.', 'Write the allowlist: exactly what the agent may call/send.', 'Seed one run log to observe plan → act → verify.'],
    stages: ['Add tools with schemas + dry-run', 'Add memory: notes + facts', 'Add plan + verify loop', 'Lock permissions, ship sandboxed'],
    prompts: ['GOAL: act in small steps. CONTEXT: goal + tools. CONSTRAINTS: one call per step, verify before next. EXAMPLE: planned 5-step run.', 'GOAL: verify a step. CONTEXT: step result. CONSTRAINTS: pass/fail + what is missing.', 'GOAL: run summary. CONTEXT: full log. CONSTRAINTS: steps done, facts learned, approvals needed.'],
    testing: ['5-step research task completes with checkpoints', 'Denied tool → stops + explains, never sneaks around', 'Resume from checkpoint 3 after forced stop'],
    debugging: ['Read the run log top-down: planner, tool args, verifier verdict', 'Looping? Cap at 8 steps, require new evidence per retry'],
    deployment: ['Sandboxed host, secrets server-side, approval for sends', 'Keep one run log per execution for audits'],
    checklist: ['Respects allowlist + approvals', 'Verifies before advancing', 'End-to-end task demoed'],
  },
  P08: {
    requirements: ['Expo app, 3+ screens', 'Email auth + profiles', 'Push for key events', 'Runs on a real phone'],
    stack: ['Expo', 'Supabase', 'LLM API'],
    setup: ['Scaffold with create-expo-app, open in Expo Go on your phone.', 'Create Supabase project, copy URL + anon key to .env.', 'Configure the EAS project id for store builds.'],
    stages: ['Build screens with loading/empty/error', 'Wire API + database with owner rules', 'Add auth + profiles', 'Add push + store-track build'],
    prompts: ['GOAL: Expo app. CONTEXT: Home/Detail/Settings. CONSTRAINTS: loading/empty/error states each screen. EXAMPLE: list screen fetch.', 'GOAL: auth + profiles. CONTEXT: Supabase. CONSTRAINTS: sign-up, verify, edit name/photo. EXAMPLE: session persist.', 'GOAL: push for [event]. CONTEXT: user toggle. CONSTRAINTS: permission prompt once, deep link.'],
    testing: ['Real phone, slow network, airplane-mode reopen', 'Sign-up → verify → profile → logout → session persists', 'Push arrives with the right deep link'],
    debugging: ['Weird Expo state? Re-run with --clear, read the stack top-down', 'Auth fails on device? Check .env, URL allowlist, clock skew'],
    deployment: ['EAS build → TestFlight internal + Play internal', 'Promote to production after device smoke test'],
    checklist: ['Runs from a store track', 'Auth + profiles persist', 'Push tested end to end'],
  },
  P09: {
    requirements: ['Auth + roles ready', 'Core workflow + one AI feature', 'Plans table for future billing', 'Launch hardening done'],
    stack: ['JavaScript', 'Node.js', 'Postgres', 'LLM API'],
    setup: ['Scaffold client, API, db from your PRD.', 'Create users + plans tables with owner RLS policies.', 'Add monitoring + error tracking before any users.'],
    stages: ['PRD → architecture → scaffold', 'Core workflow + AI feature with caps', 'Harden: tests, security, speed', 'Launch + monitor week one'],
    prompts: ['GOAL: SaaS scaffold. CONTEXT: PRD below. CONSTRAINTS: auth, db, one AI feature. EXAMPLE: route + table pairs.', 'GOAL: launch hardening. CONTEXT: my repo. CONSTRAINTS: tests, RLS, rate limits, backups with commands.', 'GOAL: pricing review. CONTEXT: my gate code. CONSTRAINTS: free vs pro paths, no leaks.'],
    testing: ['Sign-up → workflow → AI feature → billing gates', 'RLS denies cross-user reads, rate limit holds', 'Core routes p95 under 500ms'],
    debugging: ['Reproduce from the logged route + payload, fix, add regression test', 'Slow route? Log query times, add the missing index'],
    deployment: ['Prod host + CDN, env vars + backups verified', 'Week-one watch: errors, usage, costs daily'],
    checklist: ['Secure + monitored', 'Billing gates correct', 'Demo video recorded'],
  },
  P10: {
    requirements: ['One-page PRD you wrote', 'MVP slice with AI step', 'Deployed + demoed live', 'Docs a stranger can follow'],
    stack: ['Your choice', 'Justify each pick', 'Server-side AI keys'],
    setup: ['Write the one-page PRD: user, problem, MVP slice.', 'Create repo + hosting on day one.', 'List the 5 riskiest unknowns in order.'],
    stages: ['Idea → PRD → task slice', 'Build auth + core data', 'Add the AI step with caps', 'Test + deploy the slice', 'Demo, docs, next 3 steps'],
    prompts: ['GOAL: PRD critique. CONTEXT: my draft. CONSTRAINTS: cut to MVP, name the slice. EXAMPLE: tight vs bloated scope.', 'GOAL: architecture. CONTEXT: my PRD. CONSTRAINTS: client/API/db/AI, justify each tech.', 'GOAL: demo script. CONTEXT: my MVP. CONSTRAINTS: 3 minutes, live clicks, backup video.'],
    testing: ['Stranger test: can someone run it from your README?', 'Happy path + one failure path on the live URL', 'AI step capped, errors friendly'],
    debugging: ['Stuck over an hour? Shrink the slice, log the blocker, ask with context', 'Flaky demo? Record the backup video first, then go live'],
    deployment: ['Your launch: live URL + repo + docs', 'Present: problem, demo, what broke, what is next'],
    checklist: ['Live demo + recording', 'Docs + maintainable repo', 'Presented to at least one human'],
  },
};
function handholdingFor(level) {
  if (level <= 4) return 'Full guidance — every click shown';
  if (level <= 7) return 'Medium guidance — checklists + hints';
  if (level <= 9) return 'Low guidance — plan + review points';
  return 'Independent — you plan, AI critiques';
}
function projectDetail(id) {
  const row = PROJECTS.find((x) => x[0] === id);
  const d = PROJECT_DETAIL[id];
  if (!row || !d) return null;
  return { id: row[0], title: row[1], level: row[2], req: row[3], handholding: handholdingFor(row[2]), ...d };
}
const PROJECTS = [
  ['P01','Personal Website',3,'3 pages, responsive, contact form','Static site + components','HTML • CSS • JS','Install VS Code → scaffold → run dev → add assets','Generate → Style → Navigate → Debug → Publish','Static hosting','Responsive + form + live URL'],
  ['P02','Landing Page',3,'Hero, features, signup form','Single-page marketing site','HTML • CSS • JS','Sketch → scaffold from sketch → dev with phone view','Copy → Sections → Form → Polish','Static hosting','Clear CTA + mobile + tested signup'],
  ['P03','CRUD Application',4,'Create/read/update/delete + errors','Frontend + REST API (JSON)','JS • Node • REST','Define item shape → run API + client → open Network tab','API → UI → Forms → Errors','Web host','All CRUD works live'],
  ['P04','AI Chat Application',6,'Chat UI, LLM API, streaming','Chat client → server → LLM (keys server-side)','JS • LLM API','Key in server .env only → scaffold chat + /api/chat → set caps','Prompts → API → Streaming → Caps','Web host','Streams + handles errors + capped'],
  ['P05','Business Automation',7,'Trigger, AI step, notify + approval','Webhook → AI → CRM/email + approval gate','Webhooks • n8n • LLM','n8n workflow + test trigger → connect source → dry-run mode','Trigger → AI decision → Action → Approval','Automation platform','Approval gate + CRM + alerts'],
  ['P06','AI Customer Support System',7,'FAQ bot, escalation, logs','Chat → KB retriever → grounded answers → handoff','LLM API • DB','Write 10 FAQs → scaffold chat + /api/support → review queue','KB → Bot → Handoff','Web + API','Escalates with context, never invents'],
  ['P07','AI Agent',8,'Tools, memory, verify, permissions','Planner → allowlisted tools → verifier + memory','LLM API • Agent runtime','Define goal + 2 tools → allowlist → run log','Tools → Memory → Verify → Permissions','Sandboxed host','Allowlist + verify + end-to-end demo'],
  ['P08','Mobile Application',9,'Expo app, auth, push','Expo → API → Postgres + push','Expo • Supabase','create-expo-app → Expo Go → Supabase .env → EAS id','Screens → API → Auth → Store build','TestFlight + Play tracks','Runs on phone, auth + push tested'],
  ['P09','SaaS Application',9,'Auth, AI feature, launch checklist','Web → API → Postgres RLS → AI + jobs','JS • Node • Postgres','Scaffold from PRD → users+plans RLS → monitoring first','PRD → Build → Harden → Launch','Prod host + CDN','Secure + monitored + demo video'],
  ['P10',"Student's Own AI Product",10,'PRD, MVP, AI, deploy, demo','Student-designed, L9-hardened','Student choice','One-page PRD → MVP slice → repo + hosting','Idea → MVP → AI → Test → Deploy → Present','Student launch','Live demo + docs + maintainable'],
];

function planFor(idea) {
  const s = String(idea || 'My AI app idea').slice(0, 500);
  const lower = s.toLowerCase();
  const feats = ['User accounts', 'Core workflow', 'AI-assisted step', 'Notifications'];
  if (lower.includes('facebook')) feats.push('Auto-reply to inquiries', 'Lead capture + CRM save');
  if (lower.includes('lead')) feats.push('Lead scoring with AI', 'Human approval before sending');
  return {
    definition: s,
    features: feats,
    stack: ['Expo (mobile app)', 'Supabase (Postgres + auth + storage)', 'LLM API (server-side)'],
    architecture: lower.includes('facebook')
      ? 'Messenger webhook → API → AI reply + lead save (human approval for promos).'
      : 'Mobile app → secure API → Postgres; AI calls server-side only (keys never in client).',
    todos: ['Write 1-page PRD', 'Design 3 screens', 'Build auth', 'Build core CRUD', 'Add AI step', 'Test on device', 'Deploy'],
    deployment: 'EAS build → TestFlight/Play internal → production + monitoring',
  };
}

// ---- CMS Data Models (file-backed) ----
const CMS_DIR = path.join(__dirname, 'data', 'cms');
const COURSE_FILE = path.join(CMS_DIR, 'course.json');
const MEETINGS_FILE = path.join(CMS_DIR, 'meetings.json');
const ENROLLMENTS_FILE = path.join(CMS_DIR, 'enrollments.json');

function cmsMkdir() {
  try { fs.mkdirSync(CMS_DIR, { recursive: true }); } catch { /* read-only */ }
}

function loadCourse() {
  try { return JSON.parse(fs.readFileSync(COURSE_FILE, 'utf8')); } catch { return null; }
}
function saveCourse(c) {
  cmsMkdir();
  try { fs.writeFileSync(COURSE_FILE, JSON.stringify(c, null, 2)); } catch { /* read-only */ }
}

function loadMeetings() {
  try { return JSON.parse(fs.readFileSync(MEETINGS_FILE, 'utf8')); } catch { return []; }
}
function saveMeetings(m) {
  cmsMkdir();
  try { fs.writeFileSync(MEETINGS_FILE, JSON.stringify(m, null, 2)); } catch { /* read-only */ }
}

function loadEnrollments() {
  try { return JSON.parse(fs.readFileSync(ENROLLMENTS_FILE, 'utf8')); } catch { return {}; }
}
function saveEnrollments(e) {
  cmsMkdir();
  try { fs.writeFileSync(ENROLLMENTS_FILE, JSON.stringify(e, null, 2)); } catch { /* read-only */ }
}

// Seed default course from SEED_LEVELS if no file exists
function getOrSeedCourse() {
  let c = loadCourse();
  if (c) return c;
  c = {
    id: 'ai-masterplan',
    title: 'AI-MasterPlan',
    tagline: 'From zero coding to independent AI builder — learn by building.',
    levels: SEED_LEVELS.map(lv => ({
      id: lv.id,
      n: lv.n,
      title: lv.title,
      sum: lv.sum,
      tools: lv.tools || [],
      project: lv.project || null,
      modules: lv.modules.map(m => ({
        id: m.id,
        title: m.title,
        order: m.id,
        lessons: m.lessons.map(([id, title, min]) => ({
          id, title, minutes: min, order: id,
          status: 'published', // draft | published
          content: { // rich lesson content blocks
            blocks: [
              { type: 'text', content: `Lesson: ${title}\n\nAdd content using the lesson editor.` }
            ]
          }
        }))
      }))
    })),
    updatedAt: new Date().toISOString()
  };
  saveCourse(c);
  return c;
}

// Re-export LEVELS from course for API compatibility
function getLevelsFromCourse() {
  const c = getOrSeedCourse();
  return c.levels.map(lv => ({
    id: lv.id,
    n: lv.n,
    title: lv.title,
    sum: lv.sum,
    tools: lv.tools,
    project: lv.project,
    modules: lv.modules.map(m => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map(l => [l.id, l.title, l.minutes])
    }))
  }));
}

// Initialize course on startup
const COURSE = getOrSeedCourse();

// Live LEVELS for API — refreshed from CMS store after every mutation
let LEVELS = getLevelsFromCourse();
function refreshLevels() {
  try {
    const fresh = getLevelsFromCourse();
    LEVELS.length = 0;
    fresh.forEach((x) => LEVELS.push(x));
  } catch { /* keep old */ }
}

const CHANNELS = ['Introductions', 'Beginner Help', 'Vibe Coding', 'AI Automation', 'AI Agents', 'Web Development', 'Mobile Development', 'Project Showcase', 'Weekly Meet Discussions'];
const COMMUNITY_FILE = () => path.join(__dirname, 'data', 'community.json');
const DATA_MKDIR = () => { try { fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true }); } catch { /* read-only */ } };
function community() {
  try {
    const d = JSON.parse(fs.readFileSync(COMMUNITY_FILE(), 'utf8'));
    if (Array.isArray(d) && d.length) return d;
  } catch { /* seed below */ }
  return [
    { id: 'c1', channel: 'Introductions', kind: 'general', author: 'Maya', body: 'Zero coding experience — excited to build my first site! @Leo study buddies?', likes: 12, reactions: { '♥': 12, '🎉': 4 }, comments: [{ author: 'Leo', body: 'Yes @Maya! L1 together.' }], reports: 0 },
    { id: 'c2', channel: 'Beginner Help', kind: 'help', author: 'Leo', body: 'Stuck on Node install — "command not found" on Mac? L2M1L1 step 3.', likes: 4, reactions: { '♥': 4 }, comments: [], reports: 0 },
    { id: 'c3', channel: 'Project Showcase', kind: 'showcase', author: 'Aya', body: 'Shipped my personal website (P01)! Link inside.', likes: 21, reactions: { '♥': 21, '🎉': 15 }, comments: [{ author: 'Maya', body: 'Congrats @Aya!' }], reports: 0 },
    { id: 'c4', channel: 'Project Showcase', kind: 'win', author: 'Leo', body: 'Milestone: finished Level 1 — 10/10 lessons!', likes: 9, reactions: { '🎉': 9 }, comments: [], reports: 0 },
    { id: 'c5', channel: 'Vibe Coding', kind: 'question', author: 'Sam', body: 'Does context mean pasting EVERY file, or just the one changing? L1M2L1', likes: 6, reactions: { '♥': 6 }, comments: [], reports: 0 },
  ];
}
function saveCommunity(all) {
  DATA_MKDIR();
  try { fs.writeFileSync(COMMUNITY_FILE(), JSON.stringify(all, null, 2)); } catch { /* read-only */ }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain' };

// ---- Secure auth store (file-backed; scrypt passwords, expiring sessions, lockout) ----
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return {}; }
}
function saveUsers(u) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2)); } catch { /* read-only env */ }
}
// Sessions: token -> {email, exp}. 30-day expiry, pruned on access.
const TOKENS = new Map();
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;
const norm = (e) => String(e || '').trim().toLowerCase();
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(norm(e));
function devHash(s) { let h = 0x811c9dc5; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return 'dev-' + h.toString(16).padStart(8, '0'); }
function six(from) { let h = 0; from = String(from); for (const c of from) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return String(100000 + (h % 900000)); }
const vcode = (email) => six('verify:' + norm(email));
const rcode = (email, nonce) => six('recover:' + norm(email) + ':' + nonce);
function pub(u) {
  return { email: u.email, name: u.name, avatarUrl: u.avatarUrl || null, experienceLevel: u.experienceLevel, learningGoals: u.learningGoals, currentLevel: u.currentLevel, enrollmentStatus: u.enrollmentStatus, emailVerified: u.emailVerified, provider: u.provider, role: u.role, createdAt: u.createdAt };
}
// scrypt password hashing (built-in crypto). Format: scrypt$saltHex$hashHex
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  return `scrypt$${salt}$${h}`;
}
function verifyPassword(stored, email, pw) {
  pw = String(pw || '');
  if (!stored) return false;
  if (String(stored).startsWith('scrypt$')) {
    try {
      const [, salt, want] = String(stored).split('$');
      const got = crypto.scryptSync(pw, salt, 32).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(got, 'hex'), Buffer.from(want, 'hex'));
    } catch { return false; }
  }
  // legacy dev-hash migration path
  return stored === devHash(norm(email) + ':' + pw);
}
function needsRehash(stored) { return !String(stored || '').startsWith('scrypt$'); }
function passwordPolicy(pw) {
  if (typeof pw !== 'string') return 'password: 8+ chars';
  if (pw.length < 8) return 'password: 8+ chars';
  if (pw.length > 128) return 'password: max 128 chars';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'password: include a letter and a number';
  return null;
}
function tokenFor(email) {
  const t = 'own-' + crypto.randomBytes(24).toString('hex');
  TOKENS.set(t, { email: norm(email), exp: Date.now() + SESSION_TTL_MS });
  return t;
}
// Login abuse: 5 fails in 10 min -> lock 15 min
const LOGIN_FAILS = new Map(); // email -> {fails, firstAt, lockedUntil}
function lockCheck(email) {
  const r = LOGIN_FAILS.get(norm(email));
  if (r && r.lockedUntil && Date.now() < r.lockedUntil) return Math.ceil((r.lockedUntil - Date.now()) / 1000);
  return 0;
}
function lockFail(email) {
  const k = norm(email), n = Date.now();
  let r = LOGIN_FAILS.get(k) || { fails: 0, firstAt: n, lockedUntil: 0 };
  if (n - r.firstAt > 10 * 60 * 1000) { r = { fails: 0, firstAt: n, lockedUntil: 0 }; }
  r.fails++;
  if (r.fails >= 5) { r.lockedUntil = n + 15 * 60 * 1000; r.fails = 0; }
  LOGIN_FAILS.set(k, r);
}
function lockReset(email) { LOGIN_FAILS.delete(norm(email)); }
function bearer(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/);
  return m ? m[1] : null;
}
function readJson(req, maxBytes) {
  const max = maxBytes || 1e6;
  return new Promise((resolve) => {
    let b = '';
    let tooLarge = false;
    req.on('data', (c) => {
      if (tooLarge) return; // drain without growing
      b += c;
      if (b.length > max) { tooLarge = true; b = ''; }
    });
    req.on('end', () => {
      if (tooLarge) { resolve({ __tooLarge: true }); return; }
      try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); }
    });
  });
}

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'X-Powered-By': 'AI-MasterPlan',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}
function sendJSON(res, code, obj) { return send(res, code, JSON.stringify(obj), MIME['.json']); }
function sendErr(res, code, error, extra) { return sendJSON(res, code, Object.assign({ ok: false, error }, extra || {})); }

// ---- API architecture: unified DB layer (file-backed, 22 entities) ----
const DB_DIR = path.join(__dirname, 'data', 'db');
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
function dbMkdir() { try { fs.mkdirSync(DB_DIR, { recursive: true }); fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {} }
function dbRead(table, def) {
  dbMkdir();
  try { const v = JSON.parse(fs.readFileSync(path.join(DB_DIR, table + '.json'), 'utf8')); return v == null ? def : v; }
  catch { return def; }
}
function dbWrite(table, data) {
  dbMkdir();
  try {
    const f = path.join(DB_DIR, table + '.json');
    const tmp = f + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, f);
  } catch {}
}
function uid(prefix) { return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36); }
function nowISO() { return new Date().toISOString(); }
function paginate(arr, u) {
  const lim = Math.max(1, Math.min(100, Number(u.searchParams.get('limit') || 50) || 50));
  const off = Math.max(0, Number(u.searchParams.get('offset') || 0) || 0);
  return { items: arr.slice(off, off + lim), total: arr.length, limit: lim, offset: off };
}

// ---- Authentication + Authorization (RBAC) ----
const ROLE_RANK = { student: 1, instructor: 2, author: 3, admin: 4 };
function authContext(req) {
  const tok = bearer(req);
  if (!tok) return { email: null, user: null, token: null };
  const sess = TOKENS.get(tok);
  if (!sess) return { email: null, user: null, token: tok };
  const email = typeof sess === 'string' ? sess : sess.email;
  const exp = typeof sess === 'object' ? sess.exp : 0;
  if (exp && Date.now() > exp) { TOKENS.delete(tok); return { email: null, user: null, token: tok, expired: true }; }
  const users = loadUsers();
  const user = users[email] || null;
  if (!user) return { email: null, user: null, token: tok };
  return { email, user, token: tok };
}
function needAuth(req, res) {
  const ctx = authContext(req);
  if (!ctx.user) { secLog('auth.required', req); sendErr(res, 401, ctx.expired ? 'session expired — sign in again' : 'auth required (Bearer token)'); return null; }
  return ctx;
}
function needRole(req, res, allowed) {
  const ctx = authContext(req);
  if (!ctx.user) { secLog('auth.required', req); sendErr(res, 401, 'auth required'); return null; }
  const role = ctx.user.role || 'student';
  if (!allowed.includes(role)) { secLog('auth.forbidden', req, { role, need: allowed.join('/') }); sendErr(res, 403, 'forbidden for role=' + role + ' (need ' + allowed.join('/') + ')'); return null; }
  return ctx;
}
// Strict guard for CMS writes (no demo bypass): instructor/author/admin
function guardCMS(req, res, allowed) {
  return needRole(req, res, allowed || ['instructor', 'author', 'admin']);
}
// Enrollment gate for premium content: active/completed enrollment or staff
function needEnrollment(req, res) {
  const ctx = needAuth(req, res); if (!ctx) return null;
  const role = ctx.user.role || 'student';
  if (['instructor', 'author', 'admin'].includes(role)) return ctx;
  const st = String(ctx.user.enrollmentStatus || '');
  if (st === 'active' || st === 'completed') return ctx;
  const enr = dbRead('enrollments', []).some((x) => x.email === ctx.email && (x.status === 'active' || x.status === 'completed'));
  if (enr) return ctx;
  secLog('premium.denied', req, { email: ctx.email });
  sendErr(res, 402, 'enrollment required (premium content)');
  return null;
}

// ---- Security infra: logging, rate limiting, validation, secrets ----
const LOG_DIR = path.join(__dirname, 'data', 'logs');
function secLog(event, req, extra) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const ip = (req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').toString().slice(0, 60);
    const ctxE = (() => { try { const t = bearer(req); const s = t && TOKENS.get(t); const em = typeof s === 'string' ? s : (s && s.email); return em || null; } catch { return null; } })();
    const line = JSON.stringify(Object.assign({ t: nowISO(), ev: event, ip, email: ctxE, path: String(req.url || '').slice(0, 200), method: req.method }, extra || {})) + '\n';
    fs.appendFileSync(path.join(LOG_DIR, 'security.log'), line);
  } catch {}
}
// Sliding-window rate limiter (in-memory). Buckets per key.
const RATE_BUCKETS = new Map();
function rateLimit(req, res, opts) {
  const o = Object.assign({ windowMs: 60000, max: 120, key: '' }, opts || {});
  const ip = (req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'local').toString().slice(0, 80);
  const k = o.key + '|' + ip;
  const n = Date.now();
  let b = RATE_BUCKETS.get(k);
  if (!b || n > b.reset) b = { count: 0, reset: n + o.windowMs };
  b.count++;
  RATE_BUCKETS.set(k, b);
  res.setHeader && 0; // noop (headers set in send())
  if (b.count > o.max) {
    secLog('rate.limited', req, { bucket: o.key });
    sendErr(res, 429, 'too many requests — slow down', { retryAfterSec: Math.ceil((b.reset - n) / 1000) });
    return false;
  }
  return true;
}
function clientIp(req) { return (req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').toString(); }
// Input validators
function vStr(v, max, field) {
  v = v == null ? '' : String(v);
  if (v.length > (max || 500)) return { err: (field || 'field') + ` too long (max ${max})` };
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v)) return { err: (field || 'field') + ' has invalid characters' };
  return { val: v };
}
function vUrl(u, field) {
  const s = String(u || '').trim();
  if (!s) return { val: '' };
  if (s.length > 2000) return { err: (field || 'url') + ' too long' };
  if (/^\s*javascript:/i.test(s) || /^\s*data:/i.test(s) && !/^data:image\//i.test(s)) return { err: (field || 'url') + ' blocked scheme' };
  try {
    const parsed = new URL(s);
    if (!['http:', 'https:'].includes(parsed.protocol)) return { err: (field || 'url') + ' must be http(s)' };
  } catch { return { err: (field || 'url') + ' invalid' }; }
  return { val: s };
}
function vEnum(v, list, field) {
  if (!list.includes(v)) return { err: (field || 'field') + ' must be one of ' + list.join('/') };
  return { val: v };
}
// Environment secret protection: MEDIA_SECRET from env or persisted random file (never logged)
function getMediaSecret() {
  if (process.env.MEDIA_SECRET && process.env.MEDIA_SECRET.length >= 16) return process.env.MEDIA_SECRET;
  try {
    const f = path.join(DATA_DIR, '.media_secret');
    let s = null;
    try { s = fs.readFileSync(f, 'utf8').trim(); } catch {}
    if (!s || s.length < 32) { s = crypto.randomBytes(32).toString('hex'); fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(f, s, { mode: 0o600 }); }
    return s;
  } catch { return 'fallback-dev-secret-change-me'; }
}
function signMedia(kind, id, exp) {
  const sec = getMediaSecret();
  const h = crypto.createHmac('sha256', sec).update(`${kind}:${id}:${exp}`).digest('hex');
  return h;
}
function verifyMedia(kind, id, exp, sig) {
  try {
    if (!exp || !sig) return false;
    if (Date.now() > Number(exp)) return false;
    const want = signMedia(kind, id, String(exp));
    return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(String(sig)));
  } catch { return false; }
}
function mediaGate(req, res, kind, id) {
  // Allow: valid signature OR Bearer session with enrollment/staff
  const exp = u_param(req, 'exp'), sig = u_param(req, 'sig');
  if (exp && sig && verifyMedia(kind, id, exp, sig)) return { via: 'sig' };
  const ctx = authContext(req);
  if (!ctx.user) { secLog('media.denied', req, { kind, id }); sendErr(res, 401, 'auth or signed URL required'); return null; }
  const role = ctx.user.role || 'student';
  if (['instructor', 'author', 'admin'].includes(role)) return ctx;
  const st = String(ctx.user.enrollmentStatus || '');
  const enr = st === 'active' || st === 'completed' || dbRead('enrollments', []).some((x) => x.email === ctx.email && (x.status === 'active' || x.status === 'completed'));
  if (!enr) { secLog('media.premium-denied', req, { kind, id }); sendErr(res, 402, 'enrollment required'); return null; }
  return ctx;
}
function u_param(req, k) {
  try { return new URL(req.url || '/', 'http://x').searchParams.get(k); } catch { return null; }
}
// Abuse: duplicate-post guard (same email+body within 60s)
const POST_SEEN = new Map();
function abuseDup(email, body) {
  const k = norm(email) + '|' + crypto.createHash('sha256').update(String(body)).digest('hex').slice(0, 16);
  const n = Date.now();
  const last = POST_SEEN.get(k) || 0;
  POST_SEEN.set(k, n);
  return (n - last) < 60000;
}
// Safe path join (prevent traversal)
function safeJoin(base, name) {
  const p = path.normalize(path.join(base, name));
  if (!p.startsWith(base)) return null;
  return p;
}
// File validation: whitelist + magic bytes
const FILE_ALLOW = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm',
  'application/pdf': '.pdf', 'text/plain': '.txt', 'text/markdown': '.md', 'application/json': '.json', 'application/zip': '.zip',
};
function fileCheck(mime, buf, name) {
  if (!FILE_ALLOW[mime]) return 'file type not allowed (' + mime + ')';
  if (name && /\.(exe|js|html?|svg|php|sh)$/i.test(name)) return 'file extension blocked';
  if (!buf || !buf.length) return 'empty file';
  const magic = buf.slice(0, 12);
  if (mime === 'image/png' && !(magic[0] === 0x89 && magic[1] === 0x50)) return 'png magic mismatch';
  if (mime === 'image/jpeg' && !(magic[0] === 0xFF && magic[1] === 0xD8)) return 'jpeg magic mismatch';
  if (mime === 'application/pdf' && magic.toString('utf8', 0, 4) !== '%PDF') return 'pdf magic mismatch';
  if (mime === 'application/zip' && !(magic[0] === 0x50 && magic[1] === 0x4B)) return 'zip magic mismatch';
  if (mime === 'video/mp4' && !magic.toString('utf8', 4, 8).includes('ftyp') && !magic.toString('utf8', 0, 8).includes('mp4')) {
    // allow ftyp variants; if missing, still allow small demo blobs containing ftyp anywhere in first 64B
    const head = buf.slice(0, 64).toString('binary');
    if (!head.includes('ftyp')) return 'mp4 magic mismatch';
  }
  return null;
}

// Seed static catalogs into DB tables (idempotent)
function seedTables() {
  dbMkdir();
  if (!dbRead('achievements', null)) {
    dbWrite('achievements', [
      { id: 'ach-first-lesson', code: 'first-lesson', title: 'First Lesson', desc: 'Complete 1 lesson', xp: 50, at: nowISO() },
      { id: 'ach-level-1', code: 'level-1-done', title: 'Level 1 Done', desc: 'Finish Level 1', xp: 500, at: nowISO() },
      { id: 'ach-builder', code: 'first-project', title: 'Builder', desc: 'Ship first project', xp: 200, at: nowISO() },
      { id: 'ach-streak-7', code: 'streak-7', title: '7-Day Streak', desc: 'Learn 7 days in a row', xp: 350, at: nowISO() },
    ]);
  }
  if (!dbRead('courses', null)) {
    const c = getOrSeedCourse();
    dbWrite('courses', [{ id: c.id, title: c.title, tagline: c.tagline, updatedAt: c.updatedAt || nowISO() }]);
  }
  // mirror course tree into levels/modules/lessons/resource tables if empty
  if (!dbRead('levels', null)) {
    const c = getOrSeedCourse();
    const levels = [], modules = [], lessons = [], resources = [];
    c.levels.forEach((lv) => {
      levels.push({ id: lv.id, courseId: c.id, n: lv.n, title: lv.title, sum: lv.sum || '', tools: lv.tools || [], project: lv.project || null, updatedAt: nowISO() });
      lv.modules.forEach((m, mi) => {
        modules.push({ id: m.id, levelId: lv.id, title: m.title, order: mi + 1, updatedAt: nowISO() });
        m.lessons.forEach((l, li) => {
          lessons.push({ id: l.id, moduleId: m.id, title: l.title, minutes: l.minutes, status: l.status || 'published', order: li + 1, updatedAt: nowISO() });
          (l.content && l.content.blocks || []).forEach((b, bi) => {
            resources.push({ id: l.id + '-r' + bi, lessonId: l.id, kind: b.type, payload: b, order: bi + 1, at: nowISO() });
          });
        });
      });
    });
    dbWrite('levels', levels); dbWrite('modules', modules); dbWrite('lessons', lessons); dbWrite('lesson_resources', resources);
  }
  ['profiles', 'enrollments', 'lesson_progress', 'module_progress', 'projects', 'project_tasks', 'quizzes', 'quiz_attempts', 'student_achievements', 'meeting_attendance', 'community_posts', 'comments', 'notifications', 'certificates', 'files', 'videos', 'push_subs'].forEach((t) => {
    if (dbRead(t, null) === null) dbWrite(t, []);
  });
}
function maybeAward(email, allProgress) {
  try {
    seedTables();
    const done = (allProgress || dbRead('lesson_progress', [])).filter((x) => x.email === norm(email) && x.completed).length;
    const have = new Set(dbRead('student_achievements', []).filter((x) => x.email === norm(email)).map((x) => x.achievementId));
    const give = [];
    if (done >= 1 && !have.has('ach-first-lesson')) give.push('ach-first-lesson');
    if (done >= 10 && !have.has('ach-level-1')) give.push('ach-level-1');
    if (!give.length) return;
    const sa = dbRead('student_achievements', []);
    give.forEach((id) => sa.unshift({ id: uid('sa'), email: norm(email), achievementId: id, at: nowISO() }));
    dbWrite('student_achievements', sa);
    const notifs = dbRead('notifications', []);
    give.forEach((id) => notifs.unshift({ id: uid('nt'), email: norm(email), kind: 'achievement', title: 'Achievement unlocked', body: id, read: false, at: nowISO() }));
    dbWrite('notifications', notifs);
  } catch {}
}

// ---- Analytics helpers (pure, from file-backed DB) ----
const SKILL_BY_LEVEL = { L1: 'AI Basics', L2: 'Dev Environment', L3: 'Websites', L4: 'Apps & APIs', L5: 'Databases & Auth', L6: 'AI Integration', L7: 'Automation', L8: 'AI Agents', L9: 'Full SaaS', L10: 'Independence', L11: 'Custom' };
function analyticsCourse() {
  const c = getOrSeedCourse();
  const order = [];
  const minutes = {};
  const moduleOf = {};
  const levelOf = {};
  const modules = [];
  c.levels.forEach((lv) => {
    lv.modules.forEach((m) => {
      modules.push({ id: m.id, levelId: lv.id, title: m.title, lessonIds: m.lessons.map((l) => l.id) });
      m.lessons.forEach((l) => { order.push(l.id); minutes[l.id] = l.minutes || 0; moduleOf[l.id] = m.id; levelOf[l.id] = lv.id; });
    });
  });
  return { course: c, order, minutes, moduleOf, levelOf, modules, total: order.length };
}
// ---- Production: monitoring counters + error reporting ----
const METRICS = { startedAt: Date.now(), requests: 0, errors4xx: 0, errors5xx: 0, byRoute: {}, totalMs: 0 };
function metricsRecord(req, code, ms) {
  try {
    METRICS.requests++;
    METRICS.totalMs += ms;
    if (code >= 400 && code < 500) METRICS.errors4xx++;
    if (code >= 500) METRICS.errors5xx++;
    const u2 = new URL(req.url || '/', 'http://x');
    const fam = u2.pathname.split('/').slice(0, 3).join('/') || '/';
    const e = METRICS.byRoute[fam] || (METRICS.byRoute[fam] = { n: 0, ms: 0 });
    e.n++; e.ms += ms;
  } catch {}
}
function errLog(errObj) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(path.join(LOG_DIR, 'errors.log'), JSON.stringify(Object.assign({ t: nowISO() }, errObj)) + '\n');
  } catch {}
}
function analyticsActivity(email) {
  // all activity timestamps for retention/streak (lesson_progress + quiz + posts + comments + projects)
  const e = norm(email);
  const out = [];
  dbRead('lesson_progress', []).forEach((x) => { if (x.email === e && (x.completedAt || x.updatedAt)) out.push(x.completedAt || x.updatedAt); });
  dbRead('quiz_attempts', []).forEach((x) => { if (x.email === e && x.at) out.push(x.at); });
  dbRead('community_posts', []).forEach((x) => { if ((x.email || '') === e && x.at) out.push(x.at); });
  dbRead('comments', []).forEach((x) => { if ((x.email || '') === e && x.at) out.push(x.at); });
  dbRead('projects', []).forEach((x) => { if (x.email === e && (x.updatedAt || x.createdAt)) out.push(x.updatedAt || x.createdAt); });
  return out;
}
function streakFromDates(isoArr) {
  const days = new Set((isoArr || []).map((d) => String(d).slice(0, 10)));
  let n = 0;
  const c = new Date();
  if (!days.has(c.toISOString().slice(0, 10))) c.setDate(c.getDate() - 1);
  while (days.has(c.toISOString().slice(0, 10)) && n < 365) { n++; c.setDate(c.getDate() - 1); }
  return n;
}
function computeAdmin(days) {
  seedTables();
  const users = loadUsers();
  const emails = Object.keys(users);
  const registered = emails.length;
  const winMs = Math.max(1, Math.min(90, Number(days) || 30)) * 864e5;
  const since = Date.now() - winMs;
  const lp = dbRead('lesson_progress', []);
  const qa = dbRead('quiz_attempts', []);
  const activeSet = new Set();
  lp.forEach((x) => { if (x.completed && Date.parse(x.updatedAt || x.completedAt || 0) >= since) activeSet.add(x.email); });
  qa.forEach((x) => { if (Date.parse(x.at || 0) >= since) activeSet.add(x.email); });
  const enrolledSet = new Set();
  emails.forEach((em) => { const s = String(users[em].enrollmentStatus || ''); if (s === 'active' || s === 'completed') enrolledSet.add(em); });
  dbRead('enrollments', []).forEach((x) => { if (x.status === 'active' || x.status === 'completed') enrolledSet.add(x.email); });
  const enrolled = enrolledSet.size;
  const denomEmails = enrolled ? [...enrolledSet] : emails;
  const { order, minutes, modules, total } = analyticsCourse();
  const doneByEmail = {};
  denomEmails.forEach((em) => { doneByEmail[em] = new Set(lp.filter((x) => x.email === em && x.completed).map((x) => x.lessonId)); });
  const pcts = denomEmails.map((em) => (total ? (doneByEmail[em].size / total) * 100 : 0));
  const avgCompletion = pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : 0;
  const courseDone = denomEmails.filter((em) => doneByEmail[em].size >= total && total > 0).length;
  const courseCompletion = denomEmails.length ? Math.round((courseDone / denomEmails.length) * 1000) / 10 : 0;
  const moduleCompletion = modules.map((m) => {
    const need = m.lessonIds.length || 1;
    let done = 0;
    denomEmails.forEach((em) => { const s = doneByEmail[em]; if (m.lessonIds.every((id) => s.has(id))) done++; });
    return { moduleId: m.id, levelId: m.levelId, title: m.title, lessons: need, completed: done, pct: denomEmails.length ? Math.round((done / denomEmails.length) * 1000) / 10 : 0 };
  });
  const avgModule = moduleCompletion.length ? Math.round((moduleCompletion.reduce((a, m) => a + m.pct, 0) / moduleCompletion.length) * 10) / 10 : 0;
  // retention D7/D30
  const now = Date.now();
  const cohort7 = emails.filter((em) => now - Date.parse(users[em].createdAt || now) >= 7 * 864e5);
  const cohort30 = emails.filter((em) => now - Date.parse(users[em].createdAt || now) >= 30 * 864e5);
  const retained = (cohort, d) => {
    if (!cohort.length) return { pct: null, n: 0, retained: 0 };
    let r = 0;
    cohort.forEach((em) => {
      const created = Date.parse(users[em].createdAt || 0);
      const acts = analyticsActivity(em).map((t) => Date.parse(t)).filter((t) => t >= created + d * 864e5);
      if (acts.length) r++;
    });
    return { pct: Math.round((r / cohort.length) * 1000) / 10, n: cohort.length, retained: r };
  };
  // most watched / drop-off
  const compCount = {};
  order.forEach((id) => { compCount[id] = 0; });
  lp.forEach((x) => { if (x.completed && compCount[x.lessonId] !== undefined) compCount[x.lessonId]++; });
  const titleOf = {};
  getOrSeedCourse().levels.forEach((lv) => lv.modules.forEach((m) => m.lessons.forEach((l) => { titleOf[l.id] = l.title; })));
  const mostWatched = [...order].sort((a, b) => compCount[b] - compCount[a]).slice(0, 10).map((id) => ({ lessonId: id, title: titleOf[id] || id, completions: compCount[id] }));
  const leastWatched = [...order].sort((a, b) => compCount[a] - compCount[b]).slice(0, 10).map((id) => ({ lessonId: id, title: titleOf[id] || id, completions: compCount[id] }));
  const drops = [];
  for (let i = 1; i < order.length; i++) {
    const prev = compCount[order[i - 1]], cur = compCount[order[i]];
    drops.push({ from: order[i - 1], to: order[i], fromTitle: titleOf[order[i - 1]] || order[i - 1], toTitle: titleOf[order[i]] || order[i], drop: prev - cur, prev, cur });
  }
  drops.sort((a, b) => b.drop - a.drop);
  // projects
  const projs = dbRead('projects', []);
  const tasks = dbRead('project_tasks', []);
  const tasksByProj = {};
  tasks.forEach((t) => { (tasksByProj[t.projectId] = tasksByProj[t.projectId] || []).push(t); });
  const projDone = projs.filter((pr) => pr.status === 'completed' || ((tasksByProj[pr.id] || []).length > 0 && (tasksByProj[pr.id] || []).every((t) => t.done))).length;
  // meetings
  const meetings = loadMeetings();
  const att = dbRead('meeting_attendance', []);
  const legacyAtt = {};
  meetings.forEach((m) => { (m.attendees || []).forEach((a) => { const em = typeof a === 'string' ? a : a.email; if (em) legacyAtt[m.id + '|' + norm(em)] = true; }); });
  const perMeeting = meetings.map((m) => {
    const set = new Set();
    att.forEach((x) => { if (x.meetingId === m.id && x.present !== false) set.add(x.email); });
    Object.keys(legacyAtt).forEach((k) => { const [mid, em] = k.split('|'); if (mid === m.id) set.add(em); });
    const invited = enrolled || registered || 1;
    return { meetingId: m.id, title: m.title, startsAt: m.startsAt, present: set.size, invited, rate: Math.round((set.size / invited) * 1000) / 10 };
  });
  const avgAttend = perMeeting.length ? Math.round((perMeeting.reduce((a, m) => a + m.rate, 0) / perMeeting.length) * 10) / 10 : 0;
  return {
    registered, active: activeSet.size, activeWindowDays: Math.max(1, Math.min(90, Number(days) || 30)), enrolled,
    course: { total, completed: courseDone, pct: courseCompletion },
    modules: { avgPct: avgModule, breakdown: moduleCompletion },
    avgLessonCompletionPct: avgCompletion,
    retention: { d7: retained(cohort7, 7), d30: retained(cohort30, 30) },
    mostWatched, dropOff: { least: leastWatched, biggestDrops: drops.slice(0, 5) },
    projects: { total: projs.length, completed: projDone, pct: projs.length ? Math.round((projDone / projs.length) * 1000) / 10 : 0, tasksDone: tasks.filter((t) => t.done).length, tasksTotal: tasks.length },
    meetings: { avgRatePct: avgAttend, perMeeting },
  };
}
function computeStudent(email) {
  seedTables();
  const em = norm(email);
  const users = loadUsers();
  const u = users[em];
  if (!u) return null;
  const { order, minutes, levelOf, total } = analyticsCourse();
  const lp = dbRead('lesson_progress', []).filter((x) => x.email === em && x.completed);
  const doneSet = new Set(lp.map((x) => x.lessonId));
  const done = lp.length;
  const mins = [...doneSet].reduce((a, id) => a + (minutes[id] || 0), 0);
  const dates = lp.map((x) => x.completedAt || x.updatedAt).filter(Boolean);
  const streak = streakFromDates(dates);
  const activity = {};
  dates.forEach((d) => { const day = String(d).slice(0, 10); activity[day] = (activity[day] || 0) + 1; });
  const projs = dbRead('projects', []).filter((x) => x.email === em);
  const allTasks = dbRead('project_tasks', []);
  const tasks = allTasks.filter((t) => projs.some((pr) => pr.id === t.projectId));
  const projCompleted = (pr) => pr.status === 'completed' || (allTasks.filter((t) => t.projectId === pr.id).length > 0 && allTasks.filter((t) => t.projectId === pr.id).every((t) => t.done));
  const byLevel = {};
  order.forEach((id) => { const lv = levelOf[id] || 'L?'; (byLevel[lv] = byLevel[lv] || { total: 0, done: 0 }).total++; if (doneSet.has(id)) byLevel[lv].done++; });
  const skills = Object.entries(byLevel).map(([lv, v]) => ({ level: lv, skill: SKILL_BY_LEVEL[lv] || lv, done: v.done, total: v.total, pct: v.total ? Math.round((v.done / v.total) * 1000) / 10 : 0, acquired: v.done >= v.total && v.total > 0 }));
  return {
    email: em, name: u.name, role: u.role, enrollmentStatus: u.enrollmentStatus,
    learningHours: Math.round((mins / 60) * 100) / 100, learningMinutes: mins,
    completedLessons: done, totalLessons: total, pct: total ? Math.round((done / total) * 1000) / 10 : 0,
    currentStreakDays: streak,
    projects: { built: projs.length, completed: projs.filter(projCompleted).length, tasksDone: tasks.filter((t) => t.done).length, tasksTotal: tasks.length },
    skills,
    activity,
    recent: lp.slice(0, 5).map((x) => ({ lessonId: x.lessonId, completedAt: x.completedAt || x.updatedAt })),
  };
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || '/', 'http://x');
  const p = u.pathname;
  const t0 = Date.now();
  // production monitoring: record code + latency on every response
  const _wh = res.writeHead.bind(res);
  let _code = 200;
  res.writeHead = (code, ...rest) => { _code = code; return _wh(code, ...rest); };
  res.on('finish', () => metricsRecord(req, _code, Date.now() - t0));

  // ---- API ----
  if (p === '/favicon.ico') { res.writeHead(204); return res.end(); }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' });
    return res.end();
  }
  // ===== SECURITY: rate limiting (per-bucket) =====
  if (p.startsWith('/api/auth/') && !rateLimit(req, res, { key: 'auth', max: 20, windowMs: 60000 })) return;
  if (p.startsWith('/api/ai/') && !rateLimit(req, res, { key: 'ai', max: 30, windowMs: 60000 })) return;
  if ((p === '/api/community' && req.method === 'POST') || p.startsWith('/api/community-posts') || p.startsWith('/api/comments')) {
    if (!rateLimit(req, res, { key: 'community', max: 20, windowMs: 60000 })) return;
  }
  if (p.startsWith('/api/files') || p.startsWith('/api/videos') || p.startsWith('/api/media/')) {
    if (!rateLimit(req, res, { key: 'media', max: 30, windowMs: 60000 })) return;
  }
  if (p.startsWith('/api/') && !rateLimit(req, res, { key: 'api', max: 300, windowMs: 60000 })) return;
  // ===== BACKEND v1: architecture manifest =====
  if (p === '/api/arch' && req.method === 'GET') {
    return sendJSON(res, 200, { ok: true, program: 'ai-masterplan', port: PORT, version: 'v1',
      architecture: { style: 'Node built-ins only (http/fs/path/url)', db: 'file-backed JSON in data/db/*.json + legacy compat files', auth: 'Bearer token (own-*) + demo providers', storage: 'data/uploads/* with Range streaming for video' },
      groups: ['auth', 'cms-course', 'progress', 'projects', 'community', 'meetings', 'ai', 'files', 'notify', 'certs'],
      entities: ['users', 'profiles', 'courses', 'levels', 'modules', 'lessons', 'lesson_resources', 'enrollments', 'lesson_progress', 'module_progress', 'projects', 'project_tasks', 'quizzes', 'quiz_attempts', 'achievements', 'student_achievements', 'meetings', 'meeting_attendance', 'community_posts', 'comments', 'notifications', 'certificates'],
      routes: ['/api/health', '/api/metrics', '/api/errors', '/api/arch', '/api/auth/*', '/api/profiles', '/api/courses', '/api/levels', '/api/modules', '/api/lessons', '/api/lesson-resources', '/api/enrollments', '/api/lesson-progress', '/api/module-progress', '/api/progress', '/api/analytics/admin', '/api/analytics/student', '/api/user-projects', '/api/project-tasks', '/api/projects/:id', '/api/project-stage', '/api/quizzes', '/api/quiz-attempts', '/api/achievements', '/api/student-achievements', '/api/meeting-attendance', '/api/community-posts', '/api/comments', '/api/notifications', '/api/notify/*', '/api/files', '/api/videos', '/api/certificates', '/api/challenges/run', '/api/certificates/claim', '/api/sample-road', '/api/ai/*'] });
  }
  // ===== Auth extensions =====
  if (p === '/api/auth/logout' && req.method === 'POST') {
    const t = bearer(req); if (t) TOKENS.delete(t);
    return sendJSON(res, 200, { ok: true });
  }
  if (p === '/api/auth/sessions' && req.method === 'GET') {
    const ctx = needAuth(req, res); if (!ctx) return;
    const mine = [];
    TOKENS.forEach((sess, tk) => {
      const em = typeof sess === 'string' ? sess : sess.email;
      if (em === ctx.email) mine.push({ token: String(tk).slice(0, 12) + '…', email: em });
    });
    return sendJSON(res, 200, { ok: true, sessions: mine });
  }
  // ===== Profiles =====
  if (p === '/api/profiles' && req.method === 'GET') {
    const ctx = needRole(req, res, ['admin', 'author', 'instructor']); if (!ctx) return;
    seedTables(); const all = dbRead('profiles', []);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/profiles' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('profiles', []);
      const i = all.findIndex((x) => x.email === ctx.email);
      const rec = { email: ctx.email, bio: String(b.bio || '').slice(0, 500), avatarUrl: b.avatarUrl || null, goals: Array.isArray(b.goals) ? b.goals.slice(0, 8) : [], updatedAt: nowISO() };
      if (i >= 0) all[i] = Object.assign(all[i], rec); else all.push(Object.assign({ id: uid('prof'), createdAt: nowISO() }, rec));
      dbWrite('profiles', all);
      return sendJSON(res, 200, { ok: true, profile: all.find((x) => x.email === ctx.email) });
    });
  }
  if (p.match(/^\/api\/profiles\/[^/]+$/) && req.method === 'GET') {
    seedTables(); const email = norm(decodeURIComponent(p.split('/api/profiles/')[1]));
    const pr = dbRead('profiles', []).find((x) => x.email === email);
    if (!pr) return sendErr(res, 404, 'profile not found');
    return sendJSON(res, 200, { ok: true, profile: pr });
  }
  // ===== Courses (DB collection, seeded from CMS course) =====
  if (p === '/api/courses' && req.method === 'GET') {
    seedTables(); const all = dbRead('courses', []);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/courses' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('courses', []);
      if (!b.title) return sendErr(res, 400, 'title required');
      const rec = { id: uid('course'), title: String(b.title).slice(0, 120), tagline: String(b.tagline || '').slice(0, 300), createdBy: ctx.email, createdAt: nowISO(), updatedAt: nowISO() };
      all.push(rec); dbWrite('courses', all);
      return sendJSON(res, 200, { ok: true, course: rec });
    });
  }
  if (p.match(/^\/api\/courses\/[^/]+$/) && req.method === 'PUT') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      const id = decodeURIComponent(p.split('/api/courses/')[1]);
      const all = dbRead('courses', []); const i = all.findIndex((x) => x.id === id);
      if (i < 0) return sendErr(res, 404, 'course not found');
      if (b.title) all[i].title = String(b.title).slice(0, 120);
      if (b.tagline !== undefined) all[i].tagline = String(b.tagline).slice(0, 300);
      all[i].updatedAt = nowISO(); dbWrite('courses', all);
      return sendJSON(res, 200, { ok: true, course: all[i] });
    });
  }
  if (p.match(/^\/api\/courses\/[^/]+$/) && req.method === 'DELETE') {
    const ctx = needRole(req, res, ['admin']); if (!ctx) return;
    const id = decodeURIComponent(p.split('/api/courses/')[1]);
    dbWrite('courses', dbRead('courses', []).filter((x) => x.id !== id));
    return sendJSON(res, 200, { ok: true });
  }
  // ===== Levels / Modules / Lessons (DB tables) =====
  if (p === '/api/levels' && req.method === 'GET') {
    seedTables(); let all = dbRead('levels', []);
    const courseId = u.searchParams.get('courseId'); if (courseId) all = all.filter((x) => x.courseId === courseId);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/levels' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('levels', []);
      if (!b.title || !b.courseId) return sendErr(res, 400, 'title + courseId required');
      const rec = { id: uid('lv'), courseId: b.courseId, n: all.filter((x) => x.courseId === b.courseId).length + 1, title: String(b.title).slice(0, 120), sum: String(b.sum || '').slice(0, 500), updatedAt: nowISO() };
      all.push(rec); dbWrite('levels', all);
      return sendJSON(res, 200, { ok: true, level: rec });
    });
  }
  if (p === '/api/modules' && req.method === 'GET') {
    seedTables(); let all = dbRead('modules', []);
    const levelId = u.searchParams.get('levelId'); if (levelId) all = all.filter((x) => x.levelId === levelId);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/modules' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('modules', []);
      if (!b.title || !b.levelId) return sendErr(res, 400, 'title + levelId required');
      const rec = { id: uid('mod'), levelId: b.levelId, title: String(b.title).slice(0, 120), order: all.filter((x) => x.levelId === b.levelId).length + 1, updatedAt: nowISO() };
      all.push(rec); dbWrite('modules', all);
      return sendJSON(res, 200, { ok: true, module: rec });
    });
  }
  if (p === '/api/lessons' && req.method === 'GET') {
    seedTables(); let all = dbRead('lessons', []);
    const moduleId = u.searchParams.get('moduleId'); if (moduleId) all = all.filter((x) => x.moduleId === moduleId);
    const status = u.searchParams.get('status'); if (status) all = all.filter((x) => x.status === status);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/lessons' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('lessons', []);
      if (!b.title || !b.moduleId) return sendErr(res, 400, 'title + moduleId required');
      const rec = { id: uid('les'), moduleId: b.moduleId, title: String(b.title).slice(0, 160), minutes: Number(b.minutes) || 15, status: b.status === 'published' ? 'published' : 'draft', order: all.filter((x) => x.moduleId === b.moduleId).length + 1, updatedAt: nowISO() };
      all.push(rec); dbWrite('lessons', all);
      return sendJSON(res, 200, { ok: true, lesson: rec });
    });
  }
  if (p.match(/^\/api\/lessons\/[^/]+$/) && req.method === 'PUT') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      const id = decodeURIComponent(p.split('/api/lessons/')[1]);
      const all = dbRead('lessons', []); const i = all.findIndex((x) => x.id === id);
      if (i < 0) return sendErr(res, 404, 'lesson not found');
      ['title', 'minutes', 'status', 'order', 'moduleId'].forEach((k) => { if (b[k] !== undefined) all[i][k] = b[k]; });
      all[i].updatedAt = nowISO(); dbWrite('lessons', all);
      return sendJSON(res, 200, { ok: true, lesson: all[i] });
    });
  }
  // ===== Lesson resources (premium: enrollment required) =====
  if (p === '/api/lesson-resources' && req.method === 'GET') {
    if (!needEnrollment(req, res)) return;
    seedTables(); let all = dbRead('lesson_resources', []);
    const lessonId = u.searchParams.get('lessonId'); if (lessonId) all = all.filter((x) => x.lessonId === lessonId);
    const kind = u.searchParams.get('kind'); if (kind) all = all.filter((x) => x.kind === kind);
    all.sort((a, b) => (a.order || 0) - (b.order || 0));
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/lesson-resources' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('lesson_resources', []);
      if (!b.lessonId || !b.kind) return sendErr(res, 400, 'lessonId + kind required (text|heading|video|image|code|terminal|prompt|download|link|quiz|exercise)');
      const rec = { id: uid('res'), lessonId: b.lessonId, kind: b.kind, payload: b.payload || {}, order: all.filter((x) => x.lessonId === b.lessonId).length + 1, at: nowISO() };
      all.push(rec); dbWrite('lesson_resources', all);
      return sendJSON(res, 200, { ok: true, resource: rec });
    });
  }
  if (p.match(/^\/api\/lesson-resources\/[^/]+$/) && req.method === 'DELETE') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    const id = decodeURIComponent(p.split('/api/lesson-resources/')[1]);
    dbWrite('lesson_resources', dbRead('lesson_resources', []).filter((x) => x.id !== id));
    return sendJSON(res, 200, { ok: true });
  }
  // ===== Enrollments =====
  if (p === '/api/enrollments' && req.method === 'GET') {
    const ctx = needRole(req, res, ['admin', 'author', 'instructor']); if (!ctx) return;
    seedTables(); let all = dbRead('enrollments', []);
    const email = u.searchParams.get('email'); if (email) all = all.filter((x) => x.email === norm(email));
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/enrollments' && req.method === 'POST') {
    const ctx = needRole(req, res, ['admin', 'author']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('enrollments', []);
      if (!emailOk(b.email)) return sendErr(res, 400, 'valid email required');
      const rec = { id: uid('enr'), email: norm(b.email), productId: b.productId || 'lifetime', status: ['pending', 'active', 'completed', 'suspended'].includes(b.status) ? b.status : 'active', enrolledAt: nowISO(), updatedAt: nowISO() };
      all.unshift(rec); dbWrite('enrollments', all);
      return sendJSON(res, 200, { ok: true, enrollment: rec });
    });
  }
  // ===== Progress APIs =====
  if (p === '/api/lesson-progress' && req.method === 'GET') {
    seedTables(); const email = norm(u.searchParams.get('email') || '');
    let all = dbRead('lesson_progress', []);
    if (email) all = all.filter((x) => x.email === email);
    const lessonId = u.searchParams.get('lessonId'); if (lessonId) all = all.filter((x) => x.lessonId === lessonId);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/lesson-progress' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('lesson_progress', []);
      const email = b.email && ctx.user.role !== 'student' ? norm(b.email) : ctx.email;
      if (!b.lessonId) return sendErr(res, 400, 'lessonId required');
      const i = all.findIndex((x) => x.email === email && x.lessonId === b.lessonId);
      const rec = { id: i >= 0 ? all[i].id : uid('lp'), email, lessonId: b.lessonId, completed: !!b.completed, score: b.score != null ? Number(b.score) : null, completedAt: b.completed ? nowISO() : null, updatedAt: nowISO() };
      if (i >= 0) all[i] = rec; else all.unshift(rec);
      dbWrite('lesson_progress', all);
      maybeAward(ctx.email || email, all);
      return sendJSON(res, 200, { ok: true, progress: rec });
    });
  }
  if (p === '/api/module-progress' && req.method === 'GET') {
    seedTables(); const email = norm(u.searchParams.get('email') || '');
    let all = dbRead('module_progress', []);
    if (email) all = all.filter((x) => x.email === email);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/module-progress' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('module_progress', []);
      const email = b.email && ctx.user.role !== 'student' ? norm(b.email) : ctx.email;
      if (!b.moduleId) return sendErr(res, 400, 'moduleId required');
      const i = all.findIndex((x) => x.email === email && x.moduleId === b.moduleId);
      const rec = { id: i >= 0 ? all[i].id : uid('mp'), email, moduleId: b.moduleId, completed: !!b.completed, pct: Math.max(0, Math.min(100, Number(b.pct) || 0)), updatedAt: nowISO() };
      if (i >= 0) all[i] = rec; else all.unshift(rec);
      dbWrite('module_progress', all);
      return sendJSON(res, 200, { ok: true, progress: rec });
    });
  }
  if (p === '/api/progress' && req.method === 'GET') {
    seedTables(); const email = norm(u.searchParams.get('email') || '');
    if (!email) return sendErr(res, 400, 'email required');
    const lp = dbRead('lesson_progress', []).filter((x) => x.email === email && x.completed);
    const lessons = dbRead('lessons', []);
    const total = lessons.length || 111;
    return sendJSON(res, 200, { ok: true, email, done: lp.length, total, pct: Math.round((lp.length / total) * 100), xp: lp.length * 50 });
  }
  // ===== Analytics APIs =====
  if (p === '/api/analytics/admin' && req.method === 'GET') {
    if (!rateLimit(req, res, { key: 'analytics', max: 30, windowMs: 60000 })) return;
    if (!needRole(req, res, ['instructor', 'author', 'admin'])) return;
    const days = Math.max(1, Math.min(90, Number(u.searchParams.get('days') || 30) || 30));
    try {
      const a = computeAdmin(days);
      return sendJSON(res, 200, Object.assign({ ok: true, windowDays: days, at: nowISO() }, a));
    } catch (e) { secLog('analytics.admin-fail', req); return sendErr(res, 500, 'analytics failed'); }
  }
  if (p === '/api/analytics/student' && req.method === 'GET') {
    if (!rateLimit(req, res, { key: 'analytics', max: 60, windowMs: 60000 })) return;
    const ctx = needAuth(req, res); if (!ctx) return;
    const q = u.searchParams.get('email');
    const target = q ? norm(q) : ctx.email;
    if (q && target !== ctx.email && (ctx.user.role || 'student') === 'student') { secLog('auth.forbidden', req); return sendErr(res, 403, 'students can only view own analytics'); }
    const s = computeStudent(target);
    if (!s) return sendErr(res, 404, 'student not found');
    return sendJSON(res, 200, Object.assign({ ok: true, at: nowISO() }, s));
  }
  // ===== Project APIs (user projects + tasks) =====
  if (p === '/api/user-projects' && req.method === 'GET') {
    seedTables(); let all = dbRead('projects', []);
    const email = u.searchParams.get('email'); if (email) all = all.filter((x) => x.email === norm(email));
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/user-projects' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('projects', []);
      if (!b.title && !b.idea) return sendErr(res, 400, 'title or idea required');
      const rec = { id: uid('proj'), email: ctx.email, title: String(b.title || b.idea || 'Untitled').slice(0, 160), idea: String(b.idea || '').slice(0, 1000), status: 'active', createdAt: nowISO(), updatedAt: nowISO() };
      all.unshift(rec); dbWrite('projects', all);
      return sendJSON(res, 200, { ok: true, project: rec });
    });
  }
  if (p.match(/^\/api\/user-projects\/[^/]+$/) && req.method === 'PUT') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const id = decodeURIComponent(p.split('/api/user-projects/')[1]);
      const all = dbRead('projects', []); const i = all.findIndex((x) => x.id === id);
      if (i < 0) return sendErr(res, 404, 'project not found');
      if (all[i].email !== ctx.email && ctx.user.role === 'student') return sendErr(res, 403, 'not your project');
      ['title', 'idea', 'status'].forEach((k) => { if (b[k] !== undefined) all[i][k] = String(b[k]).slice(0, 1000); });
      all[i].updatedAt = nowISO(); dbWrite('projects', all);
      return sendJSON(res, 200, { ok: true, project: all[i] });
    });
  }
  if (p.match(/^\/api\/user-projects\/[^/]+$/) && req.method === 'DELETE') {
    const ctx = needAuth(req, res); if (!ctx) return;
    const id = decodeURIComponent(p.split('/api/user-projects/')[1]);
    const all = dbRead('projects', []); const rec = all.find((x) => x.id === id);
    if (!rec) return sendErr(res, 404, 'project not found');
    if (rec.email !== ctx.email && ctx.user.role === 'student') return sendErr(res, 403, 'not your project');
    dbWrite('projects', all.filter((x) => x.id !== id));
    dbWrite('project_tasks', dbRead('project_tasks', []).filter((x) => x.projectId !== id));
    return sendJSON(res, 200, { ok: true });
  }
  if (p === '/api/project-tasks' && req.method === 'GET') {
    seedTables(); let all = dbRead('project_tasks', []);
    const projectId = u.searchParams.get('projectId'); if (projectId) all = all.filter((x) => x.projectId === projectId);
    all.sort((a, b) => (a.order || 0) - (b.order || 0));
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/project-tasks' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('project_tasks', []);
      if (!b.projectId || !b.title) return sendErr(res, 400, 'projectId + title required');
      const rec = { id: uid('task'), projectId: b.projectId, title: String(b.title).slice(0, 200), done: !!b.done, order: all.filter((x) => x.projectId === b.projectId).length + 1, createdAt: nowISO(), updatedAt: nowISO() };
      all.push(rec); dbWrite('project_tasks', all);
      return sendJSON(res, 200, { ok: true, task: rec });
    });
  }
  if (p.match(/^\/api\/project-tasks\/[^/]+$/) && req.method === 'PUT') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const id = decodeURIComponent(p.split('/api/project-tasks/')[1]);
      const all = dbRead('project_tasks', []); const i = all.findIndex((x) => x.id === id);
      if (i < 0) return sendErr(res, 404, 'task not found');
      if (b.title !== undefined) all[i].title = String(b.title).slice(0, 200);
      if (b.done !== undefined) all[i].done = !!b.done;
      if (b.order !== undefined) all[i].order = Number(b.order) || 0;
      all[i].updatedAt = nowISO(); dbWrite('project_tasks', all);
      return sendJSON(res, 200, { ok: true, task: all[i] });
    });
  }
  // ===== Quizzes + attempts =====
  if (p === '/api/quizzes' && req.method === 'GET') {
    seedTables(); let all = dbRead('quizzes', []);
    const lessonId = u.searchParams.get('lessonId'); if (lessonId) all = all.filter((x) => x.lessonId === lessonId);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/quizzes' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin', 'instructor']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('quizzes', []);
      if (!b.question) return sendErr(res, 400, 'question required');
      const rec = { id: uid('quiz'), lessonId: b.lessonId || null, question: String(b.question).slice(0, 500), options: Array.isArray(b.options) ? b.options.slice(0, 6).map(String) : [], answer: Number(b.answer) || 0, createdBy: ctx.email, at: nowISO() };
      all.unshift(rec); dbWrite('quizzes', all);
      return sendJSON(res, 200, { ok: true, quiz: rec });
    });
  }
  if (p === '/api/quiz-attempts' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables();
      const q = dbRead('quizzes', []).find((x) => x.id === b.quizId);
      if (!q) return sendErr(res, 404, 'quiz not found');
      const correct = Number(b.selected) === Number(q.answer);
      const rec = { id: uid('qa'), email: ctx.email, quizId: q.id, selected: Number(b.selected), correct, at: nowISO() };
      const all = dbRead('quiz_attempts', []); all.unshift(rec); dbWrite('quiz_attempts', all);
      if (correct) {
        const lp = dbRead('lesson_progress', []);
        if (q.lessonId && !lp.some((x) => x.email === ctx.email && x.lessonId === q.lessonId && x.completed)) {
          lp.unshift({ id: uid('lp'), email: ctx.email, lessonId: q.lessonId, completed: true, score: 100, completedAt: nowISO(), updatedAt: nowISO() });
          dbWrite('lesson_progress', lp);
        }
      }
      return sendJSON(res, 200, { ok: true, attempt: rec });
    });
  }
  if (p === '/api/quiz-attempts' && req.method === 'GET') {
    const ctx = needAuth(req, res); if (!ctx) return;
    seedTables(); let all = dbRead('quiz_attempts', []);
    if (ctx.user.role === 'student') all = all.filter((x) => x.email === ctx.email);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  // ===== Achievements =====
  if (p === '/api/achievements' && req.method === 'GET') {
    seedTables(); return sendJSON(res, 200, { ok: true, items: dbRead('achievements', []), total: dbRead('achievements', []).length });
  }
  if (p === '/api/student-achievements' && req.method === 'GET') {
    seedTables(); const email = norm(u.searchParams.get('email') || '');
    let all = dbRead('student_achievements', []);
    if (email) all = all.filter((x) => x.email === email);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  // ===== Meeting attendance (separate entity) =====
  if (p === '/api/meeting-attendance' && req.method === 'GET') {
    seedTables(); let all = dbRead('meeting_attendance', []);
    const meetingId = u.searchParams.get('meetingId'); if (meetingId) all = all.filter((x) => x.meetingId === meetingId);
    const email = u.searchParams.get('email'); if (email) all = all.filter((x) => x.email === norm(email));
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/meeting-attendance' && req.method === 'POST') {
    const ctx = needRole(req, res, ['instructor', 'author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables(); const all = dbRead('meeting_attendance', []);
      if (!b.meetingId || !emailOk(b.email)) return sendErr(res, 400, 'meetingId + valid email required');
      if (all.some((x) => x.meetingId === b.meetingId && x.email === norm(b.email))) return sendJSON(res, 200, { ok: true, deduped: true });
      const rec = { id: uid('att'), meetingId: b.meetingId, email: norm(b.email), present: b.present !== false, markedBy: ctx.email, markedAt: nowISO() };
      all.unshift(rec); dbWrite('meeting_attendance', all);
      return sendJSON(res, 200, { ok: true, attendance: rec });
    });
  }
  // ===== Community posts + comments (formal entities, sync legacy) =====
  if (p === '/api/community-posts' && req.method === 'GET') {
    seedTables();
    let all = dbRead('community_posts', []);
    if (!all.length) { const leg = community(); all = leg.map((x) => ({ id: x.id, channel: x.channel, kind: x.kind, author: x.author, body: x.body, likes: x.likes || 0, reports: x.reports || 0, at: nowISO() })); dbWrite('community_posts', all); }
    const channel = u.searchParams.get('channel'); if (channel) all = all.filter((x) => x.channel === channel);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/community-posts' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables();
      if (!String(b.body || '').trim()) return sendErr(res, 400, 'body required');
      const rec = { id: uid('post'), channel: b.channel || 'Introductions', kind: b.kind || 'question', author: ctx.user.name || ctx.email, email: ctx.email, body: String(b.body).slice(0, 1000), likes: 0, reports: 0, at: nowISO() };
      const all = dbRead('community_posts', []); all.unshift(rec); dbWrite('community_posts', all);
      const leg = community(); leg.unshift({ id: rec.id, channel: rec.channel, kind: rec.kind, author: rec.author, body: rec.body, likes: 0, reactions: {}, comments: [], reports: 0 });
      saveCommunity(leg);
      return sendJSON(res, 200, { ok: true, post: rec });
    });
  }
  if (p === '/api/comments' && req.method === 'GET') {
    seedTables(); let all = dbRead('comments', []);
    const postId = u.searchParams.get('postId'); if (postId) all = all.filter((x) => x.postId === postId);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/comments' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables();
      if (!b.postId || !String(b.body || '').trim()) return sendErr(res, 400, 'postId + body required');
      const rec = { id: uid('cmt'), postId: b.postId, author: ctx.user.name || ctx.email, email: ctx.email, body: String(b.body).slice(0, 500), at: nowISO() };
      const all = dbRead('comments', []); all.unshift(rec); dbWrite('comments', all);
      return sendJSON(res, 200, { ok: true, comment: rec });
    });
  }
  // ===== Notifications + Push service =====
  if (p === '/api/notifications' && req.method === 'GET') {
    const ctx = needAuth(req, res); if (!ctx) return;
    seedTables(); let all = dbRead('notifications', []);
    if (ctx.user.role === 'student') all = all.filter((x) => x.email === ctx.email || x.email === 'all');
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/notify/subscribe' && req.method === 'POST') {
    return readJson(req).then((b) => {
      seedTables();
      if (!emailOk(b.email)) return sendErr(res, 400, 'valid email required');
      const all = dbRead('push_subs', []);
      const rec = { id: uid('push'), email: norm(b.email), endpoint: String(b.endpoint || 'inapp').slice(0, 300), at: nowISO() };
      all.unshift(rec); dbWrite('push_subs', all);
      return sendJSON(res, 200, { ok: true, subscription: rec });
    });
  }
  if (p === '/api/notify/inbox' && req.method === 'GET') {
    seedTables(); const email = norm(u.searchParams.get('email') || '');
    if (!email) return sendErr(res, 400, 'email required');
    const all = dbRead('notifications', []).filter((x) => x.email === email || x.email === 'all');
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg, unread: all.filter((x) => !x.read).length });
  }
  if (p === '/api/notify/send' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin', 'instructor']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables();
      if (!b.title || !b.body) return sendErr(res, 400, 'title + body required');
      const targets = b.email ? [norm(b.email)] : dbRead('push_subs', []).map((x) => x.email);
      const all = dbRead('notifications', []);
      const recs = (b.email ? [norm(b.email)] : ['all']).map((em) => ({ id: uid('nt'), email: em, kind: b.kind || 'announcement', title: String(b.title).slice(0, 160), body: String(b.body).slice(0, 1000), read: false, sentBy: ctx.email, at: nowISO(), deliveredTo: targets.length }));
      recs.forEach((r) => all.unshift(r)); dbWrite('notifications', all);
      return sendJSON(res, 200, { ok: true, sent: recs.length, deliveredTo: targets.length });
    });
  }
  if (p === '/api/notify/read' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const all = dbRead('notifications', []);
      const rec = all.find((x) => x.id === b.id && (x.email === ctx.email || x.email === 'all' || ctx.user.role !== 'student'));
      if (!rec) return sendErr(res, 404, 'notification not found');
      rec.read = true; dbWrite('notifications', all);
      return sendJSON(res, 200, { ok: true });
    });
  }
  // ===== Secure File storage (validated, logged, signed access for downloads) =====
  if (p === '/api/files' && req.method === 'GET') {
    const ctx = needAuth(req, res); if (!ctx) return;
    seedTables(); let all = dbRead('files', []);
    if (ctx.user.role === 'student') all = all.filter((x) => x.email === ctx.email || x.public);
    const pg = paginate(all.map((x) => ({ id: x.id, name: x.name, mime: x.mime, size: x.size, email: x.email, public: !!x.public, at: x.at })), u);
    return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/files' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req, 12 * 1024 * 1024).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'file body too large (max ~8MB file)');
      seedTables();
      const nm = vStr(b.name, 100, 'name'); if (!b.name || !b.dataBase64) return sendErr(res, 400, 'name + dataBase64 required');
      if (nm.err) return sendErr(res, 400, nm.err);
      const mime = String(b.mime || 'application/octet-stream').slice(0, 80);
      let buf; try { buf = Buffer.from(b.dataBase64, 'base64'); } catch { return sendErr(res, 400, 'bad base64'); }
      if (!buf.length || buf.length > 8 * 1024 * 1024) return sendErr(res, 400, 'file empty or >8MB');
      const ferr = fileCheck(mime, buf, nm.val);
      if (ferr) { secLog('file.rejected', req, { reason: ferr }); return sendErr(res, 400, ferr); }
      const id = uid('file');
      const safe = nm.val.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fname = id + '-' + safe;
      const fp = safeJoin(UPLOAD_DIR, fname);
      if (!fp) return sendErr(res, 400, 'bad filename');
      try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); fs.writeFileSync(fp, buf); } catch { return sendErr(res, 500, 'store failed'); }
      const rec = { id, name: safe, mime, size: buf.length, path: fname, email: ctx.email, public: !!b.public, at: nowISO() };
      const all = dbRead('files', []); all.unshift(rec); dbWrite('files', all);
      secLog('file.upload', req, { id, size: buf.length });
      return sendJSON(res, 200, { ok: true, file: { id: rec.id, name: rec.name, mime: rec.mime, size: rec.size, url: '/api/files/' + rec.id } });
    });
  }
  if (p.match(/^\/api\/files\/[^/]+$/) && req.method === 'GET') {
    seedTables(); const id = decodeURIComponent(p.split('/api/files/')[1]).split('?')[0];
    const rec = dbRead('files', []).find((x) => x.id === id);
    if (!rec) return sendErr(res, 404, 'file not found');
    if (!mediaGate(req, res, 'file', id)) return;
    const fp = safeJoin(UPLOAD_DIR, rec.path);
    if (!fp) return sendErr(res, 403, 'forbidden');
    try {
      const st = fs.statSync(fp);
      res.writeHead(200, { 'Content-Type': rec.mime, 'Content-Length': st.size, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'private, max-age=60', 'X-Content-Type-Options': 'nosniff' });
      fs.createReadStream(fp).pipe(res); return;
    } catch { return sendErr(res, 404, 'file missing'); }
  }
  if (p.match(/^\/api\/files\/[^/]+$/) && req.method === 'DELETE') {
    const ctx = needAuth(req, res); if (!ctx) return;
    const id = decodeURIComponent(p.split('/api/files/')[1]);
    const all = dbRead('files', []); const rec = all.find((x) => x.id === id);
    if (!rec) return sendErr(res, 404, 'file not found');
    if (rec.email !== ctx.email && (ctx.user.role || 'student') === 'student') return sendErr(res, 403, 'not yours');
    if ((ctx.user.role || 'student') === 'student' && rec.email !== ctx.email) { secLog('auth.forbidden', req); return sendErr(res, 403, 'forbidden'); }
    const fp = safeJoin(UPLOAD_DIR, rec.path);
    try { if (fp) fs.unlinkSync(fp); } catch {}
    dbWrite('files', all.filter((x) => x.id !== id));
    secLog('file.delete', req, { id });
    return sendJSON(res, 200, { ok: true });
  }
  // ===== Secure Video storage / streaming (signed + Range, no unrestricted URLs) =====
  if (p === '/api/videos' && req.method === 'GET') {
    if (!needEnrollment(req, res)) return;
    seedTables(); const all = dbRead('videos', []);
    const pg = paginate(all.map((x) => ({ id: x.id, name: x.name, mime: x.mime, size: x.size, at: x.at })), u);
    return sendJSON(res, 200, { ok: true, ...pg, note: 'use POST /api/media/sign for temporary playback URLs' });
  }
  if (p === '/api/videos' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin', 'instructor']); if (!ctx) return;
    return readJson(req, 70 * 1024 * 1024).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'video body too large (max ~50MB video)');
      seedTables();
      const nm = vStr(b.name, 100, 'name'); if (!b.name || !b.dataBase64) return sendErr(res, 400, 'name + dataBase64 required');
      if (nm.err) return sendErr(res, 400, nm.err);
      const mime = String(b.mime || 'video/mp4').slice(0, 80);
      if (!['video/mp4', 'video/webm'].includes(mime)) return sendErr(res, 400, 'video must be video/mp4 or video/webm');
      let buf; try { buf = Buffer.from(b.dataBase64, 'base64'); } catch { return sendErr(res, 400, 'bad base64'); }
      if (!buf.length || buf.length > 50 * 1024 * 1024) return sendErr(res, 400, 'video empty or >50MB (demo cap)');
      const ferr = fileCheck(mime, buf, nm.val);
      if (ferr) { secLog('video.rejected', req, { reason: ferr }); return sendErr(res, 400, ferr); }
      const id = uid('vid');
      const safe = nm.val.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fname = id + '-' + safe;
      const fp = safeJoin(UPLOAD_DIR, fname);
      if (!fp) return sendErr(res, 400, 'bad filename');
      try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); fs.writeFileSync(fp, buf); } catch { return sendErr(res, 500, 'store failed'); }
      const rec = { id, name: safe, mime, size: buf.length, path: fname, email: ctx.email, at: nowISO() };
      const all = dbRead('videos', []); all.unshift(rec); dbWrite('videos', all);
      secLog('video.upload', req, { id, size: buf.length });
      return sendJSON(res, 200, { ok: true, video: { id: rec.id, name: rec.name, mime: rec.mime, size: rec.size } });
    });
  }
  if (p.match(/^\/api\/videos\/[^/]+$/) && req.method === 'GET') {
    seedTables(); const id = decodeURIComponent(p.split('/api/videos/')[1]).split('?')[0];
    const rec = dbRead('videos', []).find((x) => x.id === id);
    if (!rec) { res.writeHead(404); return res.end('not found'); }
    if (!mediaGate(req, res, 'video', id)) return;
    const fp = safeJoin(UPLOAD_DIR, rec.path);
    if (!fp) { res.writeHead(403); return res.end('forbidden'); }
    try {
      const st = fs.statSync(fp);
      const range = req.headers.range;
      if (range) {
        const m = range.match(/bytes=(\d*)-(\d*)/);
        let start = m && m[1] ? Number(m[1]) : 0;
        let end = m && m[2] ? Number(m[2]) : Math.min(st.size - 1, start + 1024 * 1024);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) { res.writeHead(416); return res.end('bad range'); }
        start = Math.max(0, start); end = Math.min(st.size - 1, end);
        res.writeHead(206, { 'Content-Type': rec.mime, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'private, max-age=60' });
        fs.createReadStream(fp, { start, end }).pipe(res); return;
      }
      res.writeHead(200, { 'Content-Type': rec.mime, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'private, max-age=60' });
      fs.createReadStream(fp).pipe(res); return;
    } catch { res.writeHead(404); return res.end('missing'); }
  }
  // ===== Signed/temporary media access =====
  if (p === '/api/media/sign' && req.method === 'POST') {
    const ctx = needEnrollment(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const kind = String(b.kind || '');
      const id = String(b.id || '');
      if (!['file', 'video'].includes(kind) || !id) return sendErr(res, 400, 'kind(file|video) + id required');
      const table = kind === 'file' ? 'files' : 'videos';
      const rec = dbRead(table, []).find((x) => x.id === id);
      if (!rec) return sendErr(res, 404, kind + ' not found');
      const ttl = Math.max(60, Math.min(3600, Number(b.ttlSec) || 900));
      const exp = String(Date.now() + ttl * 1000);
      const sig = signMedia(kind, id, exp);
      const url = `/api/${kind === 'file' ? 'files' : 'videos'}/${encodeURIComponent(id)}?exp=${exp}&sig=${sig}`;
      secLog('media.sign', req, { kind, id, ttl });
      return sendJSON(res, 200, { ok: true, url, exp: Number(exp), ttlSec: ttl });
    });
  }
  // ===== Certificates (persisted) =====
  if (p === '/api/certificates' && req.method === 'GET') {
    seedTables(); const email = norm(u.searchParams.get('email') || '');
    let all = dbRead('certificates', []);
    if (email) all = all.filter((x) => x.email === email);
    const pg = paginate(all, u); return sendJSON(res, 200, { ok: true, ...pg });
  }
  if (p === '/api/certificates' && req.method === 'POST') {
    const ctx = needRole(req, res, ['author', 'admin']); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables();
      if (!emailOk(b.email) || !b.refId) return sendErr(res, 400, 'email + refId required');
      const all = dbRead('certificates', []);
      const hash = (s) => { let h = 0; s = String(s); for (const ch of s) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0; return 'AMP-' + h.toString(16).toUpperCase().padStart(8, '0'); };
      const certId = hash(norm(b.email) + '#' + b.refId);
      const rec = { id: uid('cert'), email: norm(b.email), kind: b.kind || 'module', refId: b.refId, certId, url: 'https://verify.aimasterplan.app/c/' + certId, issuedBy: ctx.email, at: nowISO() };
      all.unshift(rec); dbWrite('certificates', all);
      return sendJSON(res, 200, { ok: true, certificate: rec });
    });
  }
  // ===== AI APIs =====
  if (p === '/api/ai/chat' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const q = String(b.message || b.q || '').slice(0, 1000);
      if (!q) return sendErr(res, 400, 'message required');
      const ql = q.toLowerCase();
      let a = 'Tell me: (1) lesson, (2) what you did, (3) expected vs saw. Hints first, never ahead.';
      if (/error|not working|different/.test(ql)) a = 'Debug in 3 steps: (1) exact message, (2) compare with expected, (3) re-run last step only.';
      else if (/prompt/.test(ql)) a = 'Strong prompt: GOAL + CONTEXT + CONSTRAINTS + EXAMPLE of DONE. Paste yours.';
      else if (/code/.test(ql)) a = 'Paste code + expected vs actual. I explain line-by-line.';
      else if (/explain|simply/.test(ql)) a = 'Simple version: frontend = menu/table (what you see), backend = kitchen (does the work), database = pantry (stores).';
      return sendJSON(res, 200, { ok: true, answer: a, model: 'local-rules-v1', usage: { chars: q.length } });
    });
  }
  if (p === '/api/ai/explain' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const topic = String(b.topic || '').slice(0, 200);
      if (!topic) return sendErr(res, 400, 'topic required');
      return sendJSON(res, 200, { ok: true, topic, explanation: `ELI5 ${topic}: start with WHY (plain words), then one tiny example, then try it yourself.`, steps: ['Why it matters', 'Tiny example', 'Try + verify'] });
    });
  }
  if (p === '/api/ai/prompt-help' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const goal = String(b.goal || '').slice(0, 300);
      if (!goal) return sendErr(res, 400, 'goal required');
      return sendJSON(res, 200, { ok: true, improved: `GOAL: ${goal}\nCONTEXT: [paste file + error]\nCONSTRAINTS: [smallest change, no new deps]\nEXAMPLE OF DONE: [paste expected output]`, tips: ['One goal per prompt', 'Paste context', 'State constraints'] });
    });
  }
  if (p === '/api/ai/health' && req.method === 'GET') {
    return sendJSON(res, 200, { ok: true, provider: 'local-rules-v1', models: ['local-rules-v1'], queue: 0 });
  }
  // ===== freeCodeCamp-style challenge runner (sandboxed JS, no I/O) =====
  if (p === '/api/challenges/run' && req.method === 'POST') {
    if (!rateLimit(req, res, { key: 'run', max: 30, windowMs: 60000 })) return;
    // Landing demo may run anonymously (tiny snippets); authed users get full limits.
    const anon = !authContext(req).user;
    if (anon && !rateLimit(req, res, { key: 'run-anon', max: 10, windowMs: 60000 })) return;
    return readJson(req).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
      const code = String(b.code || '');
      if (!code.trim()) return sendErr(res, 400, 'code required');
      if (code.length > (anon ? 500 : 20000)) return sendErr(res, anon ? 401 : 400, anon ? 'sign in to run longer code' : 'code too long (max 20k chars)');
      // optional checks: [{contains:'...'}] — all must appear in output or code
      const checks = Array.isArray(b.checks) ? b.checks.slice(0, 10) : [];
      const lines = [];
      const sandbox = {
        console: { log: (...a) => { if (lines.length < 50) lines.push(a.map((x) => { try { return typeof x === 'string' ? x : JSON.stringify(x); } catch { return String(x); } }).join(' ').slice(0, 500)); } },
        Math, JSON, Number, String, Boolean, Array, Object, Date: undefined, setTimeout: undefined, setInterval: undefined,
      };
      let error = null;
      try {
        vm.runInNewContext(`'use strict';\n${code}`, sandbox, { timeout: 1000 });
      } catch (e) { error = String((e && e.message) || e).slice(0, 300); }
      const output = lines.join('\n').slice(0, 2000);
      const results = checks.map((c) => {
        const needle = String((c && c.contains) || '');
        const pass = needle ? (output.includes(needle) || code.includes(needle)) : true;
        return { contains: needle.slice(0, 120), pass };
      });
      const passed = !error && results.every((r) => r.pass);
      secLog('challenge.run', req, { passed: !!passed });
      return sendJSON(res, 200, { ok: true, passed, output, error, checks: results });
    });
  }
  // ===== Certificate claim (gated: finish required lessons first) =====
  if (p === '/api/certificates/claim' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      seedTables();
      const kind = String(b.kind || 'module');
      const refId = String(b.refId || '');
      if (!['module', 'final'].includes(kind) || !refId) return sendErr(res, 400, 'kind(module|final) + refId required');
      const c = getOrSeedCourse();
      let need = [];
      if (kind === 'module') {
        for (const lv of c.levels) for (const m of lv.modules) if (m.id === refId) need = m.lessons.map((l) => l.id);
        if (!need.length) return sendErr(res, 404, 'module not found');
      } else {
        need = c.levels.flatMap((lv) => lv.modules.flatMap((m) => m.lessons.map((l) => l.id)));
      }
      const done = new Set(dbRead('lesson_progress', []).filter((x) => x.email === ctx.email && x.completed).map((x) => x.lessonId));
      const missing = need.filter((id) => !done.has(id));
      if (missing.length) return sendJSON(res, 402, { ok: false, error: 'finish required lessons first', missing: missing.slice(0, 20), missingCount: missing.length, total: need.length });
      const all = dbRead('certificates', []);
      const hash = (s) => { let hh = 0; s = String(s); for (const ch of s) hh = (Math.imul(hh, 31) + ch.charCodeAt(0)) >>> 0; return 'AMP-' + hh.toString(16).toUpperCase().padStart(8, '0'); };
      const certId = hash(ctx.email + '#' + refId);
      let rec = all.find((x) => x.email === ctx.email && x.refId === refId);
      if (!rec) {
        rec = { id: uid('cert'), email: ctx.email, kind, refId, certId, url: 'https://verify.aimasterplan.app/c/' + certId, issuedBy: 'claim', at: nowISO() };
        all.unshift(rec); dbWrite('certificates', all);
      }
      secLog('cert.claim', req, { kind, refId });
      return sendJSON(res, 200, { ok: true, certificate: rec });
    });
  }
  if (p === '/api/health') return send(res, 200, JSON.stringify({ ok: true, program: 'ai-masterplan', port: PORT, uptimeSec: Math.floor((Date.now() - METRICS.startedAt) / 1000) }), MIME['.json']);
  // ===== Production: monitoring + error reporting =====
  if (p === '/api/metrics' && req.method === 'GET') {
    if (!needRole(req, res, ['admin', 'author'])) return;
    const mem = process.memoryUsage();
    return sendJSON(res, 200, { ok: true, uptimeSec: Math.floor((Date.now() - METRICS.startedAt) / 1000),
      requests: METRICS.requests, errors4xx: METRICS.errors4xx, errors5xx: METRICS.errors5xx,
      avgMs: METRICS.requests ? Math.round((METRICS.totalMs / METRICS.requests) * 10) / 10 : 0,
      byRoute: METRICS.byRoute, mem: { rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal }, at: nowISO() });
  }
  if (p === '/api/errors' && req.method === 'POST') {
    if (!rateLimit(req, res, { key: 'errors', max: 30, windowMs: 60000 })) return;
    return readJson(req).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
      const mv = vStr(b.message || '', 500, 'message');
      if (mv.err || !mv.val) return sendErr(res, 400, mv.err || 'message required');
      const entry = { message: mv.val, stack: vStr(b.stack || '', 2000, 'stack').val || '', url: vStr(b.url || '', 500, 'url').val || '', ua: String(req.headers['user-agent'] || '').slice(0, 200) };
      errLog(entry);
      secLog('client.error', req, { message: mv.val.slice(0, 120) });
      return sendJSON(res, 200, { ok: true });
    });
  }
  if (p === '/api/errors' && req.method === 'GET') {
    if (!needRole(req, res, ['admin', 'author'])) return;
    try {
      const lines = fs.readFileSync(path.join(LOG_DIR, 'errors.log'), 'utf8').trim().split('\n').filter(Boolean).slice(-50).map((l) => JSON.parse(l));
      return sendJSON(res, 200, { ok: true, items: lines.reverse(), total: lines.length });
    } catch { return sendJSON(res, 200, { ok: true, items: [], total: 0 }); }
  }
  if (p === '/api/overview') { const total = LEVELS.reduce((n, lv) => n + lv.modules.reduce((a, m) => a + m.lessons.length, 0), 0); return send(res, 200, JSON.stringify({ product: PRODUCT, journey: JOURNEY, levels: LEVELS.length, lessons: total, tools: TOOLS.length, projects: PROJECTS.length }), MIME['.json']); }
  if (p === '/api/curriculum') return send(res, 200, JSON.stringify({ levels: LEVELS }), MIME['.json']);
  // ===== Student lesson viewer (open: published lessons readable without account;
  // drafts stay staff-only; internal video/file URLs are signed per-request) =====
  if (p.match(/^\/api\/curriculum\/lesson\/[^/]+$/) && req.method === 'GET') {
    if (!rateLimit(req, res, { key: 'curriculum', max: 120, windowMs: 60000 })) return;
    const ctx = authContext(req);
    const id = decodeURIComponent(p.split('/api/curriculum/lesson/')[1]);
    const c = getOrSeedCourse();
    let found = null, foundLv = null, foundM = null;
    for (const lv of c.levels) for (const m of lv.modules) for (const l of m.lessons) {
      if (l.id === id) { found = l; foundLv = lv; foundM = m; }
    }
    if (!found) return sendErr(res, 404, 'lesson not found');
    if ((found.status || 'published') !== 'published' && !['instructor', 'author', 'admin'].includes((ctx.user || {}).role || 'student')) {
      return sendErr(res, ctx.user ? 403 : 401, ctx.user ? 'lesson is draft' : 'auth required (Bearer token)');
    }
    const blocks = (found.content && found.content.blocks || []).map((b) => {
      const nb = Object.assign({}, b);
      // sign internal media URLs so students can play/download without extra calls
      ['url'].forEach((k) => {
        const v = nb[k];
        if (typeof v === 'string' && v.startsWith('/api/')) {
          const mm = v.match(/^\/(api\/(files|videos))\/([^/?]+)/);
          if (mm) {
            const kind = mm[2] === 'files' ? 'file' : 'video';
            const fid = mm[3];
            const exp = String(Date.now() + 15 * 60 * 1000);
            nb[k] = `/${mm[1]}/${encodeURIComponent(fid)}?exp=${exp}&sig=${signMedia(kind, fid, exp)}`;
          }
        }
      });
      return nb;
    });
    const lp = ctx.email ? dbRead('lesson_progress', []).find((x) => x.email === ctx.email && x.lessonId === id && x.completed) : null;
    return sendJSON(res, 200, { ok: true, lesson: { id: found.id, title: found.title, minutes: found.minutes, status: found.status || 'published', levelId: foundLv.id, levelTitle: foundLv.title, moduleId: foundM.id, moduleTitle: foundM.title, blocks, completed: !!lp } });
  }
  if (p === '/api/tools') return send(res, 200, JSON.stringify({ tools: toolPayload(), categories: 12 }), MIME['.json']);
  if (p === '/api/projects') return send(res, 200, JSON.stringify({ projects: PROJECTS.map((x) => ({ id: x[0], title: x[1], level: x[2], req: x[3], arch: x[4], stack: x[5], setup: x[6], stages: x[7], deploy: x[8], done: x[9] })) }), MIME['.json']);
  // Guided workspace detail (public): full build content per catalog project
  if (p.match(/^\/api\/projects\/([^/]+)$/) && req.method === 'GET') {
    const id = decodeURIComponent(p.split('/api/projects/')[1]).toUpperCase();
    const d = projectDetail(id);
    if (!d) return sendErr(res, 404, 'project not found');
    return sendJSON(res, 200, { ok: true, project: d });
  }
  // Guided workspace stage progress (per-user, catalog stages only)
  if (p === '/api/project-stage' && req.method === 'GET') {
    const ctx = needAuth(req, res); if (!ctx) return;
    const catalogId = String(u.searchParams.get('catalogId') || '').toUpperCase();
    const d = projectDetail(catalogId);
    if (!d) return sendErr(res, 404, 'project not found');
    const rows = dbRead('catalog_progress', []).filter((x) => x.email === ctx.email && x.catalogId === catalogId && x.done);
    return sendJSON(res, 200, { ok: true, catalogId, done: rows.map((x) => x.stage), total: d.stages.length });
  }
  if (p === '/api/project-stage' && req.method === 'POST') {
    const ctx = needAuth(req, res); if (!ctx) return;
    return readJson(req).then((b) => {
      const catalogId = String(b.catalogId || '').toUpperCase();
      const d = projectDetail(catalogId);
      if (!d) return sendErr(res, 404, 'project not found');
      const stage = String(b.stage || '');
      if (!d.stages.includes(stage)) return sendErr(res, 400, 'unknown stage for ' + catalogId);
      const all = dbRead('catalog_progress', []);
      const i = all.findIndex((x) => x.email === ctx.email && x.catalogId === catalogId && x.stage === stage);
      if (b.done) {
        if (i < 0) all.unshift({ email: ctx.email, catalogId, stage, done: true, updatedAt: nowISO() });
        else all[i].updatedAt = nowISO();
      } else if (i >= 0) all.splice(i, 1);
      dbWrite('catalog_progress', all);
      const done = all.filter((x) => x.email === ctx.email && x.catalogId === catalogId).map((x) => x.stage);
      return sendJSON(res, 200, { ok: true, catalogId, done, total: d.stages.length });
    });
  }
  if (p === '/api/plan') return send(res, 200, JSON.stringify(planFor(u.searchParams.get('idea'))), MIME['.json']);
  // ===== Sample roadmap: a curated 7-day starter path (original demo content) =====
  if (p === '/api/sample-road' && req.method === 'GET') {
    return sendJSON(res, 200, { ok: true, title: 'Sample: your first 7 days', note: 'A taster path. The full roadmap has 10 levels and 111 lessons.',
      days: [
        { day: 1, theme: 'Meet your AI pair-programmer', items: [
          { lessonId: 'L1M1L1', title: 'What is AI?', minutes: 12, why: 'Learn what the machine is actually doing.' },
          { lessonId: 'L1M1L3', title: 'Directing AI with words', minutes: 15, why: 'Give your first instruction and see code appear.' } ] },
        { day: 2, theme: 'Speak so the AI understands', items: [
          { lessonId: 'L1M1L5', title: 'The 4-part prompt', minutes: 16, why: 'A reusable recipe for getting good output.' },
          { lessonId: 'L1M2L2', title: 'Files have addresses', minutes: 14, why: 'Point the AI at the right file every time.' } ] },
        { day: 3, theme: 'Run something real', items: [
          { lessonId: 'L2M2L5', title: 'Start a local server', minutes: 18, why: 'See your project alive in the browser.' } ] },
        { day: 4, theme: 'How apps fit together', items: [
          { lessonId: 'L1M2L4', title: 'See, kitchen, pantry', minutes: 18, why: 'The mental model behind every app you will build.' } ] },
        { day: 5, theme: 'Talk to other software', items: [
          { lessonId: 'L4M1L4', title: 'Order from the menu (APIs)', minutes: 20, why: 'Fetch live data with one snippet.' } ] },
        { day: 6, theme: 'Fix it yourself', items: [
          { lessonId: 'L3M2L5', title: 'The 3-step debug', minutes: 18, why: 'A method that solves most beginner bugs.' } ] },
        { day: 7, theme: 'Dream in plans', items: [
          { lessonId: 'L10M1L1', title: 'Idea → one-page plan', minutes: 25, why: 'Turn your own idea into buildable tasks.' } ] },
      ] });
  }
  if (p === '/api/cms') {
    if (!needRole(req, res, ['instructor', 'author', 'admin'])) return;
    let reports = [];
    try {
      const all = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'community.json'), 'utf8'));
      reports = all.filter((x) => (x.reports || 0) > 0).map((x) => ({ id: x.id, author: x.author, reports: x.reports }));
    } catch { /* none */ }
    let purchases = 0;
    try { purchases = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'purchases.json'), 'utf8')).length; } catch { /* none */ }
    const lessons = LEVELS.reduce((n, lv) => n + lv.modules.reduce((a, m) => a + m.lessons.length, 0), 0);
    const c = getOrSeedCourse();
    return send(res, 200, JSON.stringify({
      dashboard: { levels: LEVELS.length, lessons, tools: TOOLS.length, projects: PROJECTS.length, purchases, pendingReports: reports.length },
      moderation: reports,
      course: { id: c.id, title: c.title, tagline: c.tagline, levels: c.levels.map(lv => ({ id: lv.id, n: lv.n, title: lv.title, sum: lv.sum, modules: lv.modules.map(m => ({ id: m.id, title: m.title, lessons: m.lessons.map(l => ({ id: l.id, title: l.title, minutes: l.minutes, status: l.status })) })) })) },
    }), MIME['.json']);
  }

  // ---- CMS API: Course/Level/Module/Lesson CRUD ----
  // SECURITY: central RBAC for CMS. Reads of full content require enrollment; writes + PII require staff.
  if (p === '/api/cms' && req.method === 'GET') {
    if (!needRole(req, res, ['instructor', 'author', 'admin'])) return;
  }
  if (p === '/api/cms/course' && req.method === 'GET') {
    if (!needEnrollment(req, res)) return;
    const c = getOrSeedCourse();
    return send(res, 200, JSON.stringify({ ok: true, course: c }), MIME['.json']);
  }
  if (p.startsWith('/api/cms/') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    // All CMS mutations require staff role (RBAC). No demo bypass.
    if (!guardCMS(req, res, ['instructor', 'author', 'admin'])) return;
    // fall through to specific handlers below (they re-check via guard where needed)
  }
  if ((p.startsWith('/api/cms/students') || p.startsWith('/api/cms/moderation') || p.startsWith('/api/cms/meetings')) && req.method === 'GET') {
    if (!needRole(req, res, ['instructor', 'author', 'admin'])) return;
  }
  if (p === '/api/cms/course' && req.method === 'PUT') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      if (b.title) c.title = b.title;
      if (b.tagline) c.tagline = b.tagline;
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      // Refresh LEVELS for other APIs
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true, course: c }), MIME['.json']);
    });
  }

  // Level CRUD
  if (p === '/api/cms/level' && req.method === 'POST') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const n = c.levels.length + 1;
      const newLevel = {
        id: `L${n}`, n, title: b.title || `Level ${n}`, sum: b.sum || '',
        tools: b.tools || [], project: b.project || null, modules: [], updatedAt: new Date().toISOString()
      };
      c.levels.push(newLevel);
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true, level: newLevel }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/level\/[^/]+$/) && req.method === 'PUT') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const levelId = decodeURIComponent(p.split('/api/cms/level/')[1]);
      const lv = c.levels.find(x => x.id === levelId);
      if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
      if (b.title) lv.title = b.title;
      if (b.sum) lv.sum = b.sum;
      if (b.tools) lv.tools = b.tools;
      if (b.project) lv.project = b.project;
      lv.updatedAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true, level: lv }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/level\/[^/]+$/) && req.method === 'DELETE') {
    const c = getOrSeedCourse();
    const levelId = decodeURIComponent(p.split('/api/cms/level/')[1].split('/')[0]);
    const idx = c.levels.findIndex(x => x.id === levelId);
    if (idx === -1) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
    c.levels.splice(idx, 1);
    c.levels.forEach((lv, i) => { lv.n = i + 1; });
    c.updatedAt = new Date().toISOString();
    saveCourse(c);
    refreshLevels();
    return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
  }

  // Module CRUD
  if (p.match(/^\/api\/cms\/level\/[^/]+\/module$/) && req.method === 'POST') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const levelId = decodeURIComponent(p.split('/api/cms/level/')[1].split('/module')[0]);
      const lv = c.levels.find(x => x.id === levelId);
      if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
      const moduleNum = lv.modules.length + 1;
      const newModule = {
        id: `${levelId}M${moduleNum}`, title: b.title || `Module ${moduleNum}`, order: moduleNum,
        lessons: [], updatedAt: new Date().toISOString()
      };
      lv.modules.push(newModule);
      lv.updatedAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true, module: newModule }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/level\/[^/]+\/module\/[^/]+$/) && req.method === 'PUT') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const parts = p.split('/');
      const levelId = parts[4], moduleId = parts[6];
      const lv = c.levels.find(x => x.id === levelId);
      if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
      const m = lv.modules.find(x => x.id === moduleId);
      if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Module not found' }), MIME['.json']);
      if (b.title) m.title = b.title;
      if (b.order !== undefined) m.order = b.order;
      m.updatedAt = new Date().toISOString();
      lv.updatedAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true, module: m }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/level\/[^/]+\/module\/[^/]+$/) && req.method === 'DELETE') {
    const c = getOrSeedCourse();
    const parts = p.split('/');
    const levelId = parts[4], moduleId = parts[6];
    const lv = c.levels.find(x => x.id === levelId);
    if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
    const idx = lv.modules.findIndex(x => x.id === moduleId);
    if (idx === -1) return send(res, 404, JSON.stringify({ ok: false, error: 'Module not found' }), MIME['.json']);
    lv.modules.splice(idx, 1);
    lv.modules.forEach((m, i) => { m.order = i + 1; });
    lv.updatedAt = new Date().toISOString();
    c.updatedAt = new Date().toISOString();
    saveCourse(c);
    refreshLevels();
    return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
  }

  // Lesson CRUD
  if (p.match(/^\/api\/cms\/level\/[^/]+\/module\/[^/]+\/lesson$/) && req.method === 'POST') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const parts = p.split('/');
      const levelId = parts[4], moduleId = parts[6];
      const lv = c.levels.find(x => x.id === levelId);
      if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
      const m = lv.modules.find(x => x.id === moduleId);
      if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Module not found' }), MIME['.json']);
      let lessonNum = m.lessons.length + 1;
      let newId = `${moduleId}L${lessonNum}`;
      while (m.lessons.some((x) => x.id === newId)) { lessonNum++; newId = `${moduleId}L${lessonNum}`; }
      const newLesson = {
        id: newId, title: b.title || `Lesson ${lessonNum}`, minutes: b.minutes || 15, order: lessonNum,
        status: 'draft', content: { blocks: [{ type: 'text', content: '' }] }, updatedAt: new Date().toISOString()
      };
      m.lessons.push(newLesson);
      m.updatedAt = new Date().toISOString();
      lv.updatedAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true, lesson: newLesson }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/level\/[^/]+\/module\/[^/]+\/lesson\/[^/]+$/) && req.method === 'PUT') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const parts = p.split('/');
      const levelId = parts[4], moduleId = parts[6], lessonId = parts[8];
      const lv = c.levels.find(x => x.id === levelId);
      if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
      const m = lv.modules.find(x => x.id === moduleId);
      if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Module not found' }), MIME['.json']);
      const l = m.lessons.find(x => x.id === lessonId);
      if (!l) return send(res, 404, JSON.stringify({ ok: false, error: 'Lesson not found' }), MIME['.json']);
      if (b.title) l.title = b.title;
      if (b.minutes !== undefined) l.minutes = b.minutes;
      if (b.order !== undefined) l.order = b.order;
      if (b.status) l.status = b.status;
      if (b.content) l.content = b.content;
      l.updatedAt = new Date().toISOString();
      m.updatedAt = new Date().toISOString();
      lv.updatedAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true, lesson: l }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/level\/[^/]+\/module\/[^/]+\/lesson\/[^/]+$/) && req.method === 'DELETE') {
    const c = getOrSeedCourse();
    const parts = p.split('/');
    const levelId = parts[4], moduleId = parts[6], lessonId = parts[8];
    const lv = c.levels.find(x => x.id === levelId);
    if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
    const m = lv.modules.find(x => x.id === moduleId);
    if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Module not found' }), MIME['.json']);
    const idx = m.lessons.findIndex(x => x.id === lessonId);
    if (idx === -1) return send(res, 404, JSON.stringify({ ok: false, error: 'Lesson not found' }), MIME['.json']);
    m.lessons.splice(idx, 1);
    m.lessons.forEach((l, i) => { l.order = i + 1; });
    m.updatedAt = new Date().toISOString();
    lv.updatedAt = new Date().toISOString();
    c.updatedAt = new Date().toISOString();
    saveCourse(c);
    refreshLevels();
    return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
  }

  // Reorder: level, module, lesson — stable IDs, only n/order change
  if (p === '/api/cms/reorder' && req.method === 'POST') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const { type, levelId, moduleId, order } = b; // order = array of ids in new order
      if (!Array.isArray(order) || !order.length) return send(res, 400, JSON.stringify({ ok: false, error: 'order must be non-empty array' }), MIME['.json']);
      if (type === 'level') {
        const ids = new Set(c.levels.map((x) => x.id));
        if (order.length !== c.levels.length || !order.every((id) => ids.has(id))) return send(res, 400, JSON.stringify({ ok: false, error: 'order must contain all level ids exactly once' }), MIME['.json']);
        const map = new Map(c.levels.map((x) => [x.id, x]));
        c.levels = order.map((id) => map.get(id));
        c.levels.forEach((lv, i) => { lv.n = i + 1; });
      } else if (type === 'module' && levelId) {
        const lv = c.levels.find(x => x.id === levelId);
        if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
        const ids = new Set(lv.modules.map((x) => x.id));
        if (order.length !== lv.modules.length || !order.every((id) => ids.has(id))) return send(res, 400, JSON.stringify({ ok: false, error: 'order must contain all module ids exactly once' }), MIME['.json']);
        const map = new Map(lv.modules.map((x) => [x.id, x]));
        lv.modules = order.map((id) => map.get(id));
        lv.modules.forEach((m, i) => { m.order = i + 1; });
      } else if (type === 'lesson' && levelId && moduleId) {
        const lv = c.levels.find(x => x.id === levelId);
        if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
        const m = lv.modules.find(x => x.id === moduleId);
        if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Module not found' }), MIME['.json']);
        const ids = new Set(m.lessons.map((x) => x.id));
        if (order.length !== m.lessons.length || !order.every((id) => ids.has(id))) return send(res, 400, JSON.stringify({ ok: false, error: 'order must contain all lesson ids exactly once' }), MIME['.json']);
        const map = new Map(m.lessons.map((x) => [x.id, x]));
        m.lessons = order.map((id) => map.get(id));
        m.lessons.forEach((l, i) => { l.order = i + 1; });
      } else {
        return send(res, 400, JSON.stringify({ ok: false, error: 'invalid reorder type' }), MIME['.json']);
      }
      c.updatedAt = new Date().toISOString();
      saveCourse(c);
      refreshLevels();
      return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
    });
  }

  // Draft/Publish lesson
  if (p.match(/^\/api\/cms\/level\/[^/]+\/module\/[^/]+\/lesson\/[^/]+\/status$/) && req.method === 'PUT') {
    return readJson(req).then((b) => {
      const c = getOrSeedCourse();
      const parts = p.split('/');
      const levelId = parts[4], moduleId = parts[6], lessonId = parts[8];
      const lv = c.levels.find(x => x.id === levelId);
      if (!lv) return send(res, 404, JSON.stringify({ ok: false, error: 'Level not found' }), MIME['.json']);
      const m = lv.modules.find(x => x.id === moduleId);
      if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Module not found' }), MIME['.json']);
      const l = m.lessons.find(x => x.id === lessonId);
      if (!l) return send(res, 404, JSON.stringify({ ok: false, error: 'Lesson not found' }), MIME['.json']);
      if (b.status && ['draft', 'published'].includes(b.status)) {
        l.status = b.status;
        l.updatedAt = new Date().toISOString();
        c.updatedAt = new Date().toISOString();
        saveCourse(c);
        refreshLevels();
        return send(res, 200, JSON.stringify({ ok: true, lesson: l }), MIME['.json']);
      }
      return send(res, 400, JSON.stringify({ ok: false, error: 'Invalid status' }), MIME['.json']);
    });
  }

  // ---- CMS API: Meetings ----
  if (p === '/api/cms/meetings' && req.method === 'GET') {
    return send(res, 200, JSON.stringify({ ok: true, meetings: loadMeetings() }), MIME['.json']);
  }
  if (p === '/api/cms/meetings' && req.method === 'POST') {
    return readJson(req).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
      const tV = vStr(b.title || 'New Meeting', 120, 'title'); if (tV.err) return sendErr(res, 400, tV.err);
      const dV = vStr(b.description || '', 1000, 'description'); if (dV.err) return sendErr(res, 400, dV.err);
      if (b.url) { const uV = vUrl(b.url, 'url'); if (uV.err) return sendErr(res, 400, uV.err); }
      if (b.recordingUrl) { const rV = vUrl(b.recordingUrl, 'recording'); if (rV.err) return sendErr(res, 400, rV.err); }
      if (b.recurring && !['none', 'weekly', 'biweekly', 'monthly'].includes(b.recurring)) return sendErr(res, 400, 'bad recurring');
      const dur = Math.max(15, Math.min(480, Number(b.duration) || 60));
      const meetings = loadMeetings();
      const m = {
        id: 'meet-' + Date.now(),
        title: tV.val,
        description: dV.val,
        startsAt: b.startsAt || new Date(Date.now() + 864e5).toISOString(),
        duration: dur,
        url: b.url ? String(b.url).slice(0, 500) : '',
        recurring: b.recurring || 'none',
        recurringUntil: b.recurringUntil || null,
        recordingUrl: b.recordingUrl ? String(b.recordingUrl).slice(0, 500) : '',
        recordingUploadedAt: null,
        announcements: [],
        attendees: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      meetings.unshift(m);
      saveMeetings(meetings);
      secLog('meeting.create', req, { id: m.id });
      return send(res, 200, JSON.stringify({ ok: true, meeting: m }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/meetings\/[^/]+$/) && req.method === 'PUT') {
    return readJson(req).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
      const meetings = loadMeetings();
      const id = p.split('/api/cms/meetings/')[1];
      const idx = meetings.findIndex(x => x.id === id);
      if (idx === -1) return send(res, 404, JSON.stringify({ ok: false, error: 'Meeting not found' }), MIME['.json']);
      const m = meetings[idx];
      if (b.title !== undefined) { const v = vStr(b.title, 120, 'title'); if (v.err) return sendErr(res, 400, v.err); m.title = v.val; }
      if (b.description !== undefined) { const v = vStr(b.description, 1000, 'description'); if (v.err) return sendErr(res, 400, v.err); m.description = v.val; }
      if (b.url !== undefined) { if (b.url) { const v = vUrl(b.url, 'url'); if (v.err) return sendErr(res, 400, v.err); m.url = v.val.slice(0, 500); } else m.url = ''; }
      if (b.recordingUrl !== undefined) { if (b.recordingUrl) { const v = vUrl(b.recordingUrl, 'recording'); if (v.err) return sendErr(res, 400, v.err); m.recordingUrl = v.val.slice(0, 500); } else m.recordingUrl = ''; }
      if (b.startsAt !== undefined) m.startsAt = String(b.startsAt).slice(0, 40);
      if (b.duration !== undefined) m.duration = Math.max(15, Math.min(480, Number(b.duration) || 60));
      if (b.recurring !== undefined) {
        if (!['none', 'weekly', 'biweekly', 'monthly'].includes(b.recurring)) return sendErr(res, 400, 'bad recurring');
        m.recurring = b.recurring;
      }
      if (b.recurringUntil !== undefined) m.recurringUntil = b.recurringUntil;
      if (b.recordingUrl && !m.recordingUploadedAt) m.recordingUploadedAt = new Date().toISOString();
      m.updatedAt = new Date().toISOString();
      saveMeetings(meetings);
      secLog('meeting.update', req, { id });
      return send(res, 200, JSON.stringify({ ok: true, meeting: m }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/meetings\/[^/]+$/) && req.method === 'DELETE') {
    const meetings = loadMeetings();
    const id = p.split('/api/cms/meetings/')[1];
    const idx = meetings.findIndex(x => x.id === id);
    if (idx === -1) return send(res, 404, JSON.stringify({ ok: false, error: 'Meeting not found' }), MIME['.json']);
    meetings.splice(idx, 1);
    saveMeetings(meetings);
    return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
  }
  if (p.match(/^\/api\/cms\/meetings\/[^/]+\/announce$/) && req.method === 'POST') {
    return readJson(req).then((b) => {
      const meetings = loadMeetings();
      const id = p.split('/api/cms/meetings/')[1].split('/announce')[0];
      const m = meetings.find(x => x.id === id);
      if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Meeting not found' }), MIME['.json']);
      const ann = { id: 'ann-' + Date.now(), message: b.message, sentAt: new Date().toISOString(), sentBy: b.sentBy || 'Author' };
      m.announcements = m.announcements || [];
      m.announcements.unshift(ann);
      m.updatedAt = new Date().toISOString();
      saveMeetings(meetings);
      return send(res, 200, JSON.stringify({ ok: true, announcement: ann }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/meetings\/[^/]+\/attend$/) && req.method === 'POST') {
    return readJson(req).then((b) => {
      const meetings = loadMeetings();
      const id = decodeURIComponent(p.split('/api/cms/meetings/')[1].split('/attend')[0]);
      const m = meetings.find(x => x.id === id);
      if (!m) return send(res, 404, JSON.stringify({ ok: false, error: 'Meeting not found' }), MIME['.json']);
      const email = norm(b.email);
      if (!emailOk(email)) return send(res, 400, JSON.stringify({ ok: false, error: 'invalid email' }), MIME['.json']);
      m.attendees = m.attendees || [];
      if (!m.attendees.some((a) => (a.email || a) === email)) {
        m.attendees.push({ email, markedAt: new Date().toISOString(), present: b.present !== false });
      }
      m.updatedAt = new Date().toISOString();
      saveMeetings(meetings);
      return send(res, 200, JSON.stringify({ ok: true, meeting: m }), MIME['.json']);
    });
  }

  // ---- CMS API: Students ----
  if (p === '/api/cms/students' && req.method === 'GET') {
    const users = loadUsers();
    const enrollments = loadEnrollments();
    const students = Object.entries(users).map(([email, u]) => {
      const enr = enrollments[email] || { status: 'none', productId: null, enrolledAt: null, progress: {} };
      return { email, name: u.name, role: u.role, enrollmentStatus: u.enrollmentStatus, emailVerified: u.emailVerified, currentLevel: u.currentLevel, learningGoals: u.learningGoals, createdAt: u.createdAt, enrollment: enr };
    });
    return send(res, 200, JSON.stringify({ ok: true, students }), MIME['.json']);
  }
  if (p.match(/^\/api\/cms\/students\/[^/]+$/) && req.method === 'GET') {
    const email = norm(decodeURIComponent(p.split('/api/cms/students/')[1]));
    const users = loadUsers();
    const u = users[email];
    if (!u) return send(res, 404, JSON.stringify({ ok: false, error: 'Student not found' }), MIME['.json']);
    const enrollments = loadEnrollments();
    const enr = enrollments[email] || { status: 'none', productId: null, enrolledAt: null, progress: {} };
    const c = getOrSeedCourse();
    const totalLessons = c.levels.reduce((n, lv) => n + lv.modules.reduce((a, m) => a + m.lessons.length, 0), 0);
    const doneCount = Object.values(enr.progress || {}).filter((x) => x && x.completed).length;
    const meetings = loadMeetings();
    const attendance = meetings.map((mt) => ({ meetingId: mt.id, title: mt.title, startsAt: mt.startsAt, present: (mt.attendees || []).some((a) => (a.email || a) === email) }));
    let purchases = [];
    try { purchases = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'purchases.json'), 'utf8')).filter((x) => x.email === email); } catch { /* none */ }
    return send(res, 200, JSON.stringify({ ok: true, student: { email, name: u.name, role: u.role, enrollmentStatus: u.enrollmentStatus, emailVerified: u.emailVerified, currentLevel: u.currentLevel, learningGoals: u.learningGoals, createdAt: u.createdAt, enrollment: enr, progress: enr.progress || {}, stats: { totalLessons, doneCount, pct: totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0 }, attendance, purchases } }), MIME['.json']);
  }
  if (p.match(/^\/api\/cms\/students\/[^/]+$/) && req.method === 'PUT') {
    return readJson(req).then((b) => {
      const email = norm(decodeURIComponent(p.split('/api/cms/students/')[1]));
      const users = loadUsers();
      const u = users[email];
      if (!u) return send(res, 404, JSON.stringify({ ok: false, error: 'Student not found' }), MIME['.json']);
      if (b.enrollmentStatus && ['pending', 'active', 'completed', 'suspended'].includes(b.enrollmentStatus)) u.enrollmentStatus = b.enrollmentStatus;
      if (b.currentLevel !== undefined && Number.isFinite(+b.currentLevel)) u.currentLevel = Math.max(1, Math.min(10, Math.round(+b.currentLevel)));
      if (b.role && ['student', 'instructor', 'author', 'admin'].includes(b.role)) u.role = b.role;
      if (b.name) u.name = String(b.name).slice(0, 60);
      saveUsers(users);
      const enrollments = loadEnrollments();
      if (!enrollments[email]) enrollments[email] = { status: u.enrollmentStatus, productId: null, enrolledAt: new Date().toISOString(), progress: {} };
      if (b.enrollmentStatus) enrollments[email].status = b.enrollmentStatus;
      saveEnrollments(enrollments);
      return send(res, 200, JSON.stringify({ ok: true, user: pub(u) }), MIME['.json']);
    });
  }
  if (p.match(/^\/api\/cms\/students\/[^/]+\/progress$/) && req.method === 'PUT') {
    return readJson(req).then((b) => {
      const email = norm(decodeURIComponent(p.split('/api/cms/students/')[1].split('/progress')[0]));
      const enrollments = loadEnrollments();
      if (!enrollments[email]) enrollments[email] = { status: 'active', productId: 'lifetime', enrolledAt: new Date().toISOString(), progress: {} };
      if (b.lessonId && b.completed !== undefined) {
        enrollments[email].progress[b.lessonId] = { completed: b.completed, completedAt: b.completed ? new Date().toISOString() : null, score: b.score || null };
      }
      saveEnrollments(enrollments);
      return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
    });
  }

  // ---- CMS API: Community Moderation ----
  if (p === '/api/cms/moderation' && req.method === 'GET') {
    const all = community();
    const reported = all.filter(x => (x.reports || 0) > 0);
    return send(res, 200, JSON.stringify({ ok: true, reports: reported }), MIME['.json']);
  }
  if (p.match(/^\/api\/cms\/moderation\/[^/]+\/dismiss$/) && req.method === 'POST') {
    const all = community();
    const id = p.split('/api/cms/moderation/')[1].split('/dismiss')[0];
    const post = all.find(x => x.id === id);
    if (!post) return send(res, 404, JSON.stringify({ ok: false }), MIME['.json']);
    post.reports = 0;
    saveCommunity(all);
    return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
  }
  if (p.match(/^\/api\/cms\/moderation\/[^/]+\/remove$/) && req.method === 'POST') {
    let all = community();
    const id = p.split('/api/cms/moderation/')[1].split('/remove')[0];
    all = all.filter(x => x.id !== id);
    saveCommunity(all);
    return send(res, 200, JSON.stringify({ ok: true }), MIME['.json']);
  }
  if (p === '/api/cms/announcement' && req.method === 'POST') {
    return readJson(req).then((b) => {
      const all = community();
      const ann = { id: 'ann-' + Date.now(), channel: 'Announcements', kind: 'announcement', author: b.author || 'Author', body: b.body || '', likes: 0, reactions: {}, comments: [], reports: 0, pinned: true, createdAt: new Date().toISOString() };
      if (!CHANNELS.includes('Announcements')) CHANNELS.push('Announcements');
      all.unshift(ann);
      saveCommunity(all);
      return send(res, 200, JSON.stringify({ ok: true, announcement: ann }), MIME['.json']);
    });
  }

  if (p === '/api/notify') {
    return send(res, 200, JSON.stringify({ triggers: [
      { label: 'New module', hint: 'A new module lands in your path.' },
      { label: 'New lesson', hint: 'A fresh walkthrough is ready.' },
      { label: 'Continue learning', hint: 'Daily nudge with your next lesson.' },
      { label: 'Weekly Meet & Greet', hint: '24h before the session.' },
      { label: 'Meeting starting soon', hint: '1h before the session.' },
      { label: 'Instructor announcement', hint: 'Tips + course news.' },
      { label: 'Comment / reply', hint: 'Someone answered you.' },
      { label: 'Achievement unlocked', hint: 'The moment a badge is earned.' },
      { label: 'Project milestone', hint: 'Stage and project completions.' },
    ] }), MIME['.json']);
  }
  // --- enrollment commerce: products, quotes, purchases, history, invoices ---
  const PRODUCTS = [
    { id: 'free-audit', title: 'Free Audit', kind: 'free', price: 0 },
    { id: 'lifetime', title: 'Lifetime Access', kind: 'once', price: 14900 },
    { id: 'monthly', title: 'Monthly Plan', kind: 'sub', price: 1900 },
  ];
  const COUPONS = { WELCOME20: 20, BUILDER50: 50, SCHOLAR100: 100 };
  const money = (c) => '$' + (c / 100).toFixed(2);
  const quoteFor = (pid, code, story) => {
    const pr = PRODUCTS.find((x) => x.id === pid);
    if (!pr) return { ok: false, error: 'unknown plan' };
    if (pr.kind === 'free') return { ok: true, quote: { subtotal: 0, discount: 0, total: 0, free: true } };
    let pct = 0;
    if (String(code || '').trim()) {
      const c = String(code).trim().toUpperCase();
      if (!COUPONS[c]) return { ok: false, error: 'bad code (try WELCOME20)' };
      if (c === 'SCHOLAR100' && String(story || '').trim().length < 20) return { ok: false, error: 'SCHOLAR100 needs your story (20+ chars)' };
      pct = COUPONS[c];
    }
    const d = Math.round((pr.price * pct) / 100);
    return { ok: true, quote: { subtotal: pr.price, discount: d, total: pr.price - d, coupon: code ? String(code).trim().toUpperCase() : undefined, free: pr.price - d === 0 } };
  };
  if (p === '/api/products') return send(res, 200, JSON.stringify({ products: PRODUCTS, coupons: Object.keys(COUPONS) }), MIME['.json']);
  if (p === '/api/enroll/quote' && req.method === 'POST') {
    return readJson(req).then((b) => send(res, 200, JSON.stringify(quoteFor(b.productId, b.coupon, b.story)), MIME['.json']));
  }
  if (p === '/api/enroll/purchase' && req.method === 'POST') {
    return readJson(req).then((b) => {
      const email = String(b.email || '').toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return send(res, 400, JSON.stringify({ ok: false, error: 'invalid email' }), MIME['.json']);
      const q = quoteFor(b.productId, b.coupon, b.story);
      if (!q.ok) return send(res, 400, JSON.stringify(q), MIME['.json']);
      const at = new Date().toISOString();
      let h = 0;
      for (const c of email + b.productId + at) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
      const inv = { id: 'INV-' + h.toString(16).toUpperCase().padStart(8, '0'), email, productId: b.productId, ...q.quote, at };
      DATA_MKDIR();
      const F = path.join(__dirname, 'data', 'purchases.json');
      let all = [];
      try { all = JSON.parse(fs.readFileSync(F, 'utf8')); } catch { /* fresh */ }
      all.unshift(inv);
      try { fs.writeFileSync(F, JSON.stringify(all, null, 2)); } catch { /* read-only */ }
      return send(res, 200, JSON.stringify({ ok: true, invoice: inv, receipt: `AI-MasterPlan receipt\nInvoice ${inv.id}\n${email} • ${b.productId}\n${money(inv.subtotal)} - ${money(inv.discount)} = ${money(inv.total)}` }), MIME['.json']);
    });
  }
  if (p === '/api/billing' && req.method === 'GET') {
    const email = String(u.searchParams.get('email') || '').toLowerCase();
    let all = [];
    try { all = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'purchases.json'), 'utf8')); } catch { /* none */ }
    return send(res, 200, JSON.stringify({ purchases: all.filter((x) => !email || x.email === email) }), MIME['.json']);
  }
  if (p === '/api/cert') {
    const email = String(u.searchParams.get('email') || 'student').toLowerCase();
    const hash = (s) => { let h = 0; s = String(s); for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return 'AMP-' + h.toString(16).toUpperCase().padStart(8, '0'); };
    const date = new Date().toISOString().slice(0, 10);
    const mods = LEVELS.flatMap((lv) => lv.modules.map((m) => {
      const id = hash(email + '#' + m.id + '#AI-MasterPlan');
      return { moduleId: m.id, title: m.title, certId: id, url: 'https://verify.aimasterplan.app/c/' + id };
    }));
    const fin = hash(email + '-AI-MasterPlan');
    return send(res, 200, JSON.stringify({
      ok: true, student: email, program: 'Independent AI System Builder (AI-MasterPlan)', date,
      signature: 'The AI-MasterPlan Author, Course Author & Vibe Coding Coach',
      final: { certId: fin, url: 'https://verify.aimasterplan.app/c/' + fin },
      modules: mods,
    }), MIME['.json']);
  }
  if (p === '/api/community' && req.method === 'GET') {
    return send(res, 200, JSON.stringify({ channels: CHANNELS, posts: community() }), MIME['.json']);
  }
  if (p === '/api/community' && req.method === 'POST') {
    return readJson(req).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
      const ctx = authContext(req);
      const bodyV = vStr(b.body || '', 500, 'body');
      if (bodyV.err || !bodyV.val.trim()) return sendErr(res, 400, bodyV.err || 'empty');
      const chV = vStr(b.channel || 'Introductions', 40, 'channel');
      const kindV = vStr(b.kind || 'question', 20, 'kind');
      if (!CHANNELS.includes(chV.val) && chV.val !== 'Announcements') return sendErr(res, 400, 'unknown channel');
      if (!['question', 'showcase', 'win', 'help', 'general', 'announcement'].includes(kindV.val)) return sendErr(res, 400, 'bad kind');
      const author = ctx.user ? (ctx.user.name || ctx.email) : vStr(b.author || 'Anonymous', 40, 'author').val;
      const dupKey = (ctx.email || clientIp(req)) + '';
      if (abuseDup(dupKey, bodyV.val)) { secLog('abuse.dup-post', req); return sendErr(res, 429, 'duplicate post — wait a minute'); }
      const all = community();
      const post = { id: 'u-' + Date.now(), channel: chV.val, kind: kindV.val, author: String(author).slice(0, 40), body: bodyV.val, likes: 0, reactions: {}, comments: [], reports: 0 };
      all.unshift(post);
      saveCommunity(all);
      secLog('community.post', req);
      return sendJSON(res, 200, { ok: true, post });
    });
  }
  if ((p === '/api/community/react' || p === '/api/community/comment' || p === '/api/community/report') && req.method === 'POST') {
    return readJson(req).then((b) => {
      if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
      const all = community();
      const post = all.find((x) => x.id === b.id);
      if (!post) return sendErr(res, 404, 'not found');
      if (p.endsWith('/react')) {
        const e = String(b.emoji || '♥').slice(0, 8);
        if (!['♥', '🎉', '👍', '💬'].includes(e)) return sendErr(res, 400, 'bad emoji');
        post.reactions[e] = (post.reactions[e] || 0) + 1;
        if (e === '♥') post.likes++;
      }
      if (p.endsWith('/comment') && String(b.body || '').trim()) {
        const bv = vStr(b.body, 300, 'comment');
        if (bv.err) return sendErr(res, 400, bv.err);
        const ctx = authContext(req);
        const author = ctx.user ? (ctx.user.name || ctx.email) : vStr(b.author || 'Anonymous', 40, 'author').val;
        post.comments.push({ author: String(author).slice(0, 40), body: bv.val });
      }
      if (p.endsWith('/report')) { post.reports = (post.reports || 0) + 1; secLog('community.report', req, { id: post.id }); }
      saveCommunity(all);
      return sendJSON(res, 200, { ok: true, post });
    });
  }
  if (p === '/api/meet') {
    const start = new Date(Date.now() + 3 * 864e5).toISOString();
    return send(res, 200, JSON.stringify({
      ok: true,
      session: { id: 'meet-weekly', title: 'Weekly Meet & Greet with the Author', startsAt: start, url: 'https://meet.aimasterplan.app/weekly', recurring: 'weekly', enrolled: 'all enrolled students' },
      author: { name: 'The AI-MasterPlan Author', role: 'Course author & Vibe Coding coach' },
      format: ['Welcome / community updates (8m)', 'Student Q&A (15m)', 'Project troubleshooting (12m)', 'Student project showcase (10m)', 'New AI / Vibe Coding tips (5m)', 'Open discussion (5m)', "What's coming next (5m)"],
      archive: [
        { id: 'meet-2026-w40', title: 'Week 40 — First websites go live', recording: 'https://cdn.aimasterplan.app/recordings/meet-2026-w40.mp4' },
        { id: 'meet-2026-w39', title: 'Week 39 — Terminal without fear', recording: 'https://cdn.aimasterplan.app/recordings/meet-2026-w39.mp4' },
        { id: 'meet-2026-w38', title: 'Week 38 — Prompts that build', recording: 'https://cdn.aimasterplan.app/recordings/meet-2026-w38.mp4' },
      ],
    }), MIME['.json']);
  }
  if (p === '/api/ask') {
    const q = String(u.searchParams.get('q') || '');
    const lid = String(u.searchParams.get('lesson') || '');
    const proj = String(u.searchParams.get('project') || '');
    const ql = q.toLowerCase();
    const findL = (id) => { for (const lv of LEVELS) for (const m of lv.modules) for (const L of m.lessons) if (L[0] === id) return { id: L[0], title: L[1] }; return null; };
    const les = findL(lid);
    const pj = PROJECTS.find((x) => x[0] === proj);
    const tail = pj ? ` Your project ${pj[0]} (${pj[1]}) uses this next.` : '';
    let a;
    if (/error|not working|different/.test(ql)) a = `Debug in 3 steps: (1) exact message, (2) compare with "What should I see?"${les ? ` in ${les.id}` : ''}, (3) re-run the last step only. Which step are you on?`;
    else if (/next/.test(ql)) a = les ? `Next: finish "${les.id} — ${les.title}", then continue the module in order.${tail}` : 'Next: continue your first incomplete lesson. Small wins compound.';
    else if (/check|followed|correctly|did i do/.test(ql)) a = les ? `Verify ${les.id} together: (1) objective done — ${les.title}, (2) ran the step command, (3) screen matches expected. Which fails?` : 'Tell me the lesson ID + which checklist item fails.';
    else if (/explain|simply/.test(ql)) a = 'Simple version: frontend = menu/table (what you see), backend = kitchen (does the work), database = pantry (stores). Which part feels fuzzy?';
    else if (/prompt/.test(ql)) a = 'Strong prompt: GOAL + CONTEXT + CONSTRAINTS + EXAMPLE of DONE. Paste yours.';
    else if (/code/.test(ql)) a = 'Paste code + expected vs actual. I explain line-by-line.';
    else a = 'Tell me: (1) lesson, (2) what you did, (3) expected vs saw. Hints first, never ahead.';
    return send(res, 200, JSON.stringify({ ok: true, answer: a, lesson: les, skill: 'beginner' }), MIME['.json']);
  }
  if (p === '/api/onboard') {
    const coded = ['never', 'little', 'yes'].includes(String(u.searchParams.get('coded'))) ? String(u.searchParams.get('coded')) : 'never';
    const ai = ['never', 'chat', 'agent'].includes(String(u.searchParams.get('ai'))) ? String(u.searchParams.get('ai')) : 'never';
    const goal = ['website', 'mobile', 'automation', 'agent', 'business', 'saas', 'personal'].includes(String(u.searchParams.get('goal'))) ? String(u.searchParams.get('goal')) : 'website';
    const GMAP = { website: ['L3M1L1', 'P01', 'Personal Website'], personal: ['L3M1L1', 'P01', 'Personal Website'], mobile: ['L4M1L1', 'P08', 'Mobile Application'], automation: ['L7M1L1', 'P05', 'Business Automation'], business: ['L7M1L1', 'P05', 'Business Automation'], agent: ['L8M1L1', 'P07', 'AI Agent'], saas: ['L9M1L1', 'P09', 'SaaS Application'] };
    const g = GMAP[goal];
    const fast = coded === 'yes' && ai === 'agent';
    return send(res, 200, JSON.stringify({
      ok: true, answers: { coded, aiTools: ai, goal },
      headline: fast ? `Fast-track: Level 1 basics → ${g[2]}` : `Start at Level 1 — your ${g[2].toLowerCase()} comes at ${g[0].slice(0, 2)}`,
      startLessonId: fast ? g[0] : 'L1M1L1', fastTrack: fast,
      focusProjectId: g[1], focusProjectTitle: g[2],
      firstWeek: fast
        ? [`Day 1–2: skim L1+L2 setup.`, `Day 3–5: enter at ${g[0]}, build first slice of ${g[1]}.`, 'Day 6–7: test + post screenshot.']
        : ['Day 1–2: L1M1 — what AI is + first AI page.', 'Day 3–4: L1M2+L2M1 — how apps work, install tools.', 'Day 5–7: L2M2 — run first project locally.'],
      explainers: 8,
    }), MIME['.json']);
  }

  // ---- Secure auth API (scrypt, lockout, expiry; no secret leakage) ----
  if (p.startsWith('/api/auth/') || p === '/api/me') {
    if (req.method === 'GET' && p === '/api/me') {
      const ctx = authContext(req);
      if (!ctx.user) return sendErr(res, 401, 'not signed in');
      return sendJSON(res, 200, { ok: true, user: pub(ctx.user) });
    }
    if (req.method === 'PUT' && p === '/api/me') {
      return readJson(req).then((b) => {
        if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
        const ctx = authContext(req);
        if (!ctx.user) return sendErr(res, 401, 'not signed in');
        const users = loadUsers();
        const usr = users[ctx.email];
        if (typeof b.name === 'string' && b.name.trim()) usr.name = vStr(b.name.trim(), 60, 'name').val || usr.name;
        if (typeof b.avatarUrl === 'string') {
          const vv = b.avatarUrl.trim() ? vUrl(b.avatarUrl.trim(), 'avatar') : { val: null };
          if (vv.err) return sendErr(res, 400, vv.err);
          usr.avatarUrl = vv.val || null;
        }
        if (['none', 'beginner', 'intermediate'].includes(b.experienceLevel)) usr.experienceLevel = b.experienceLevel;
        if (Array.isArray(b.learningGoals)) usr.learningGoals = b.learningGoals.map(String).map((x) => x.slice(0, 60)).slice(0, 8);
        if (Number.isFinite(+b.currentLevel)) usr.currentLevel = Math.max(1, Math.min(10, Math.round(+b.currentLevel)));
        // RBAC: enrollmentStatus change requires staff; role change requires admin (no demo switcher)
        if (b.enrollmentStatus !== undefined) {
          if (!['pending', 'active', 'completed', 'suspended'].includes(b.enrollmentStatus)) return sendErr(res, 400, 'bad enrollmentStatus');
          if (!['instructor', 'author', 'admin'].includes(usr.role || 'student')) return sendErr(res, 403, 'only staff can change enrollment');
          usr.enrollmentStatus = b.enrollmentStatus;
        }
        if (b.role !== undefined) {
          if ((ctx.user.role || 'student') !== 'admin') { secLog('auth.role-escalation-blocked', req); return sendErr(res, 403, 'only admin can change roles'); }
          if (!['student', 'instructor', 'author', 'admin'].includes(b.role)) return sendErr(res, 400, 'bad role');
          usr.role = b.role;
        }
        saveUsers(users);
        secLog('profile.update', req);
        return sendJSON(res, 200, { ok: true, user: pub(usr) });
      });
    }
    if (req.method === 'POST') {
      return readJson(req).then((b) => {
        if (b && b.__tooLarge) return sendErr(res, 413, 'body too large');
        const users = loadUsers();
        const action = p.slice('/api/auth/'.length);
        if (action === 'register') {
          const em = norm(b.email);
          if (!emailOk(em)) return sendErr(res, 400, 'invalid email');
          const pwErr = passwordPolicy(b.password);
          if (pwErr) return sendErr(res, 400, pwErr);
          if (users[em]) return sendErr(res, 409, 'email exists — sign in');
          const nm = vStr(b.name || em.split('@')[0], 60, 'name');
          users[em] = { email: em, name: nm.val, passHash: hashPassword(b.password), provider: 'password', emailVerified: false, avatarUrl: null, experienceLevel: 'none', learningGoals: [], currentLevel: 1, enrollmentStatus: 'pending', role: 'student', createdAt: nowISO(), recoveryNonce: null, recoveryExp: 0, fails: 0 };
          saveUsers(users);
          secLog('auth.register', req, { email: em });
          return sendJSON(res, 200, { ok: true, token: tokenFor(em), user: pub(users[em]), verificationCode: vcode(em) });
        }
        if (action === 'login') {
          const em = norm(b.email);
          const wait = lockCheck(em);
          if (wait > 0) { secLog('auth.locked', req, { email: em }); return sendErr(res, 429, 'account locked — try again in ' + wait + 's'); }
          const usr = users[em];
          const ok = usr && (usr.provider !== 'password' ? false : verifyPassword(usr.passHash, em, b.password));
          if (!ok) {
            lockFail(em);
            secLog('auth.fail', req, { email: em });
            return sendErr(res, 401, 'wrong email or password');
          }
          lockReset(em);
          if (needsRehash(usr.passHash)) { usr.passHash = hashPassword(String(b.password)); saveUsers(users); }
          secLog('auth.login', req, { email: em });
          return sendJSON(res, 200, { ok: true, token: tokenFor(em), user: pub(usr) });
        }
        if (action === 'google' || action === 'apple') {
          const em = norm(b.email);
          if (!emailOk(em)) return sendErr(res, 400, 'provider email missing');
          if (!users[em]) {
            const nm = vStr(b.name || em.split('@')[0], 60, 'name');
            let av = null;
            if (b.avatarUrl) { const vv = vUrl(b.avatarUrl, 'avatar'); if (!vv.err) av = vv.val; }
            users[em] = { email: em, name: nm.val, passHash: null, provider: action, emailVerified: true, avatarUrl: av, experienceLevel: 'none', learningGoals: [], currentLevel: 1, enrollmentStatus: 'active', role: 'student', createdAt: nowISO(), recoveryNonce: null, recoveryExp: 0 };
          } else {
            users[em].emailVerified = true;
            if (users[em].enrollmentStatus === 'pending') users[em].enrollmentStatus = 'active';
            if (b.name) users[em].name = vStr(b.name, 60, 'name').val || users[em].name;
          }
          saveUsers(users);
          secLog('auth.provider', req, { email: em, provider: action });
          return sendJSON(res, 200, { ok: true, token: tokenFor(em), user: pub(users[em]) });
        }
        if (action === 'verify') {
          const em = norm(b.email);
          const usr = users[em];
          if (!usr) return sendErr(res, 404, 'no account');
          if (String(b.code || '').trim() !== vcode(em)) { secLog('auth.verify-fail', req, { email: em }); return sendErr(res, 400, 'wrong code'); }
          usr.emailVerified = true;
          if (usr.enrollmentStatus === 'pending') usr.enrollmentStatus = 'active';
          saveUsers(users);
          return sendJSON(res, 200, { ok: true, user: pub(usr) });
        }
        if (action === 'recover') {
          const em = norm(b.email);
          if (!emailOk(em)) return sendErr(res, 400, 'invalid email');
          const usr = users[em];
          const nonce = nowISO() + '-' + crypto.randomBytes(8).toString('hex');
          if (usr) { usr.recoveryNonce = nonce; usr.recoveryExp = Date.now() + 15 * 60 * 1000; saveUsers(users); }
          secLog('auth.recover', req, { email: em });
          // Demo returns code; prod would email. Never log the code itself.
          return sendJSON(res, 200, { ok: true, recoveryCode: rcode(em, usr ? nonce : 'unknown') });
        }
        if (action === 'reset') {
          const em = norm(b.email);
          const usr = users[em];
          if (!usr || !usr.recoveryNonce) return sendErr(res, 400, 'request a code first');
          if (usr.recoveryExp && Date.now() > usr.recoveryExp) { usr.recoveryNonce = null; saveUsers(users); return sendErr(res, 400, 'code expired — request again'); }
          if (String(b.code || '').trim() !== rcode(em, usr.recoveryNonce)) { secLog('auth.reset-fail', req, { email: em }); return sendErr(res, 400, 'wrong code'); }
          const pwErr = passwordPolicy(b.newPassword);
          if (pwErr) return sendErr(res, 400, pwErr);
          usr.passHash = hashPassword(b.newPassword);
          usr.provider = 'password';
          usr.recoveryNonce = null; usr.recoveryExp = 0;
          saveUsers(users);
          // revoke all sessions for this user
          TOKENS.forEach((v, k) => { const em2 = typeof v === 'string' ? v : v.email; if (em2 === em) TOKENS.delete(k); });
          secLog('auth.reset', req, { email: em });
          return sendJSON(res, 200, { ok: true });
        }
        return sendErr(res, 404, 'unknown auth action');
      });
    }
    return sendErr(res, 405, 'method not allowed');
  }

  // ---- Unknown API → JSON 404 (never SPA fallback) ----
  if (p.startsWith('/api/')) return sendErr(res, 404, 'unknown api route: ' + p.slice(0, 80));

  // ---- Static (CDN-friendly: immutable when ?v= present, no-store for HTML) ----
  let file = p === '/' ? '/index.html' : p;
  const full = path.normalize(path.join(ROOT, file));
  if (!full.startsWith(ROOT)) return send(res, 403, 'forbidden');
  const immutable = u.searchParams.has('v') && /\.(css|js|png|ico)$/.test(full);
  fs.readFile(full, (err, data) => {
    if (!err && immutable) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
      return res.end(data);
    }
    if (err) {
      // SPA fallback: unknown paths serve index (our own router handles #/ routes client-side)
      if (!path.extname(full)) {
        fs.readFile(path.join(ROOT, 'index.html'), (e2, d2) => {
          if (e2) return send(res, 404, 'not found');
          return send(res, 200, d2, MIME['.html']);
        });
        return;
      }
      return send(res, 404, 'not found');
    }
    return send(res, 200, data, MIME[path.extname(full)] || 'application/octet-stream');
  });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`AI-MasterPlan serving on http://localhost:${PORT} (pid ${process.pid})`));
  // production: graceful shutdown on SIGTERM/SIGINT
  const shut = (sig) => { console.log(`received ${sig}, closing…`); server.close(() => { console.log('closed'); process.exit(0); }); setTimeout(() => process.exit(0), 5000).unref(); };
  process.on('SIGTERM', () => shut('SIGTERM'));
  process.on('SIGINT', () => shut('SIGINT'));
}
module.exports = { server, PORT, norm, emailOk, devHash, six, vcode, rcode, pub, hashPassword, verifyPassword, passwordPolicy, paginate, fileCheck, vStr, vUrl, vEnum, signMedia, verifyMedia, streakFromDates, computeAdmin, computeStudent, METRICS, PRODUCT, JOURNEY };
