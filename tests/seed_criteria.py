#!/usr/bin/env python3
"""Seed zero-experience starter content for success-criteria anchor lessons.
Run: python3 tests/seed_criteria.py (server must be on :8082, admin exists).
Idempotent: overwrites content.blocks for listed lessons only."""
import json, urllib.request

BASE = "http://localhost:8082"

def login(email, pw):
    r = urllib.request.Request(BASE + "/api/auth/login",
        data=json.dumps({"email": email, "password": pw}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(r).read().decode())["token"]

def put(path, body, tok):
    r = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + tok}, method="PUT")
    return json.loads(urllib.request.urlopen(r).read().decode())

T = lambda c: {"type": "text", "content": c}
H = lambda c: {"type": "heading", "content": c}
P = lambda c: {"type": "prompt", "content": c}
C = lambda lang, c: {"type": "code", "language": lang, "content": c}
TERM = lambda c: {"type": "terminal", "content": c}
EX = lambda t, i, e: {"type": "exercise", "title": t, "instructions": i, "expected": e}
Q = lambda q, opts, ans: {"type": "quiz", "question": q, "options": opts, "answer": ans}

SEEDS = {
 # 1 software structure
 ("L1", "L1M2", "L1M2L4"): [H("Apps have 3 parts: what you see, the kitchen, the pantry"),
  T("Every app has the same skeleton.\n\n1. Frontend = what you see (buttons, text, pictures).\n2. Backend = the kitchen (does the work when you tap).\n3. Database = the pantry (remembers things).\n\nThey talk over a network: your tap travels frontend → backend → pantry and back."),
  P("GOAL: explain my app idea in 3 parts\nCONTEXT: total beginner, my idea is [describe it]\nCONSTRAINTS: plain words, no jargon\nEXAMPLE: 'Frontend shows a list, backend saves it, database remembers it'"),
  EX("Draw your app", "On paper, draw 3 boxes (see/kitchen/pantry) for an app you use daily. Label what each box does.", "3 labeled boxes"),
  Q("Where does tapping a button do its work?", ["Frontend", "Backend", "Database"], 1)],
 # 2 communicate with agent
 ("L1", "L1M1", "L1M1L3"): [H("Vibe Coding: you direct, the AI types"),
  T("Vibe Coding means describing what you want in plain words and letting an AI coding agent write the code.\n\nYour job: describe clearly, run it, check the result, ask for fixes.\nThe agent's job: type, remember syntax, repeat forever without getting tired."),
  P("GOAL: get the agent to build [one small thing]\nCONTEXT: I have never coded; my files are [list them]\nCONSTRAINTS: change as little as possible, explain each step\nEXAMPLE: 'Add a welcome message at the top of the page'"),
  EX("First direction", "Ask your agent for ONE tiny change. Run it. Report what you see.", "One visible change")],
 # 3 useful prompts
 ("L1", "L1M1", "L1M1L5"): [H("Good prompts have 4 parts"),
  T("GOAL: what done looks like.\nCONTEXT: your files, errors, what you tried.\nCONSTRAINTS: limits (small change, no new tools).\nEXAMPLE: paste what 'done' looks like.\n\nWeak: 'fix it'. Strong: GOAL + CONTEXT + CONSTRAINTS + EXAMPLE."),
  P("GOAL: [one sentence]\nCONTEXT: [file + what you did + exact error]\nCONSTRAINTS: [smallest change, explain why]\nEXAMPLE OF DONE: [paste]"),
  Q("Which is strongest?", ["fix it", "GOAL + CONTEXT + CONSTRAINTS + EXAMPLE"], 1)],
 # 4 run/modify project
 ("L2", "L2M2", "L2M2L5"): [H("Run it: terminal → folder → one command"),
  T("Running locally means starting the app on your own computer.\n\n1. Open the terminal.\n2. Move into the project folder.\n3. Run the start command.\n4. Open the address it prints (usually http://localhost:8082).\n\nTo modify: change one file, save, refresh."),
  TERM("cd my-project\nnode server.js"),
  P("GOAL: run this project and show me the address\nCONTEXT: I am in [folder], I see [files]\nCONSTRAINTS: tell me exactly what to type, nothing else\nEXAMPLE: 'type this, then open this link'"),
  EX("Run + change one word", "Start the server, open it, change one visible word, refresh.", "Changed word on screen")],
 # 5 files/structure
 ("L1", "L1M2", "L1M2L2"): [H("Files live in folders; names are addresses"),
  T("A project is a folder of files.\n\n- index.html = the page.\n- styles.css = how it looks.\n- app.js = what it does.\n- server.js = the kitchen.\n- data/ = the pantry.\n\nThe full name from the project root (like public/app.js) is the file's address. Share it when asking for help."),
  TERM("ls\nls public"),
  EX("Map your project", "List the top-level files and write one line for what each does.", "File list with purposes")],
 # 6 debug
 ("L3", "L3M2", "L3M2L5"): [H("Debug in 3 steps: message → compare → last step"),
  T("1. Read the EXACT message (copy it, don't summarize).\n2. Compare expected vs actual: what should you see vs what do you see?\n3. Re-run only the LAST step, then report what changed.\n\n90% of beginner bugs: wrong folder, server not running, or a typo in a name."),
  P("GOAL: fix this error\nCONTEXT: lesson [id], I did [steps], I expected [x] but saw [y], exact message: [paste]\nCONSTRAINTS: one fix at a time\nEXAMPLE: 'tell me which of the 3 steps failed'"),
  EX("Fix one bug solo", "Break something tiny on purpose, then debug it with the 3 steps.", "Written 3-step log")],
 # 7 APIs
 ("L4", "L4M1", "L4M1L4"): [H("APIs are menus for software"),
  T("An API is a menu: you order (request) and get a dish (JSON response).\n\nGET /api/tools = 'show me tools'. POST with JSON = 'take this order'.\nKeys stay on the server (in .env), never in the page. Open the browser Network tab to watch orders go out."),
  C("javascript", "const r = await fetch('/api/tools');\nconst tools = await r.json();\nconsole.log(tools.tools.length);"),
  P("GOAL: call [API name] and show [what]\nCONTEXT: my code is [paste], the docs say [paste]\nCONSTRAINTS: keep my key server-side\nEXAMPLE: 'fetch the list and print the first item'"),
  EX("Call one API", "Fetch /api/tools and print how many tools came back.", "Printed count")],
 # 8 databases
 ("L5", "L5M1", "L5M1L1"): [H("Databases remember rows"),
  T("A database is a pantry of tables. Each table holds rows (like spreadsheet rows).\n\nYou do 5 things: create, read, update, delete, query (find).\nCRUD = the first four. Start by reading one row before writing any."),
  C("javascript", "// read all students (admin)\nconst r = await fetch('/api/cms/students', { headers: { Authorization: 'Bearer ' + token } });"),
  EX("Read one row", "Fetch one record and write down its fields.", "One copied record")],
 # 9 auth
 ("L5", "L5M2", "L5M2L1"): [H("Authentication = who are you? Authorization = may you?"),
  T("Sign-in proves identity (email + password → session token).\nThe token rides in the Authorization header on every private request.\nRoles (student/instructor/author/admin) decide what each token may touch.\nPasswords are salted hashes — the server never stores the real one."),
  C("javascript", "await fetch('/api/lesson-progress', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },\n  body: JSON.stringify({ lessonId: 'L1M1L1', completed: true })\n});"),
  EX("Sign in with token", "Register, sign in, and call /api/me with your token.", "Your profile JSON")],
 # 10 integrate AI
 ("L6", "L6M1", "L6M1L1"): [H("AI APIs: your server asks the model, the page never holds the key"),
  T("The page sends your words to YOUR server. Your server adds the secret key and asks the AI model. The answer comes back through your server.\n\nKeys live in server .env only. Set spending caps. Stream long answers so the page feels alive."),
  P("GOAL: add an AI reply to [feature]\nCONTEXT: my server file is [paste], key is in .env\nCONSTRAINTS: key never in client code, cap length\nEXAMPLE: 'user asks X, assistant answers in 2 sentences'"),
  EX("First AI call", "Send one question through your server and print the answer.", "Printed AI answer")],
 # 11 automations
 ("L7", "L7M1", "L7M1L1"): [H("Automations: trigger → AI step → action (+ human approval)"),
  T("Every automation: something happens (trigger) → AI decides → something gets done (action).\nMoney moves only after a human approves.\nStart with a dry-run switch: log what WOULD happen before touching real data."),
  P("GOAL: automate [task]\nCONTEXT: trigger is [event], data looks like [paste]\nCONSTRAINTS: dry-run first, approval before sending\nEXAMPLE: 'new row → AI drafts reply → I approve → send'"),
  EX("Map one automation", "Write trigger → AI → action → approval for a chore you hate.", "4-step map")],
 # 12 agents
 ("L8", "L8M1", "L8M1L1"): [H("Agents: planner + allowlisted tools + verifier + memory"),
  T("An agent plans steps, uses ONLY approved tools, checks its own work (verifier), and remembers (memory).\nSafety first: allowlist 2 tools, run in a sandbox, log every step, require approval for anything irreversible."),
  P("GOAL: do [multi-step task]\nCONTEXT: allowed tools are [tool1, tool2], stop when [done looks like]\nCONSTRAINTS: use only allowlisted tools, show the plan first\nEXAMPLE: 'plan 3 steps, then run step 1'"),
  EX("Define 2 tools", "Write your agent's goal + exactly 2 tools + what DONE means.", "Goal + tools + done")],
 # 13a web
 ("L3", "L3M1", "L3M1L1"): [H("Websites: generate → style → navigate → debug → publish"),
  T("Describe the site in words, generate the first version, then style it, add pages/links, debug, and publish to a real link.\nKeep 3 pages max for your first site. Test on your phone before sharing."),
  P("GOAL: build a [3-page site about X]\nCONTEXT: beginner, pages are [list]\nCONSTRAINTS: responsive, one contact form, no new tools\nEXAMPLE: 'hero + features + contact, mobile-friendly'"),
  EX("Ship a page", "Generate one page, change the headline, publish the link.", "Live link")],
 # 13b mobile
 ("L9", "L9M1", "L9M1L3"): [H("Frontend + mobile: same API, two faces (web + Expo phone app)"),
  T("Your backend API serves BOTH faces.\n\n- Web face: HTML/CSS/JS pages.\n- Mobile face: Expo (runs on iOS + Android from one codebase). Screens call the SAME /api endpoints with the user's token.\n\nBuild web first, then add 3 Expo screens (list, detail, profile) + auth + push. Ship phones via EAS → TestFlight/Play internal."),
  TERM("npx create-expo-app my-app\ncd my-app\nnpx expo start"),
  P("GOAL: add a mobile screen for [feature]\nCONTEXT: API is [endpoint], token auth, Expo managed workflow\nCONSTRAINTS: reuse the same API, no keys in client\nEXAMPLE: 'list screen fetching /api/projects with token'"),
  EX("Plan 3 screens", "List your app's 3 screens and which API each calls.", "3 screens + APIs")],
 # 14 test
 ("L9", "L9M2", "L9M2L6"): [H("Test like a user, then like a machine"),
  T("1. Click through as a user (happy path + one mistake).\n2. Add automated checks: one per feature (200 OK? correct text?).\n3. Run the full suite before every deploy: `npm test`.\nGreen suite = permission to ship."),
  TERM("npm test"),
  EX("Write one test", "Add a check that your homepage returns 200 and your name appears.", "Passing test")],
 # 15 deploy
 ("L10", "L10M2", "L10M2L5"): [H("Deploy: test → internal → production + watch"),
  T("1. Full tests green.\n2. Backup data.\n3. Ship to an internal link, click everything.\n4. Ship production, then watch /api/health + /api/metrics for 15 minutes.\nKeep the last backup until the new version proves itself."),
  TERM("sh deploy/backup.sh\nsh deploy/healthcheck.sh"),
  EX("Deploy drill", "Backup, healthcheck, and write the 4 deploy steps for your app.", "4-step checklist")],
 # 16 idea to plan
 ("L10", "L10M1", "L10M1L1"): [H("Ideas become PRDs: problem → users → features → stack → tasks"),
  T("One page is enough:\nProblem (1 line) → Users → Must-have features (≤7) → Stack → Architecture (1 sketch) → Tasks in order → Deploy plan.\nThen paste it into the Project Planner to generate todos and track them."),
  P("GOAL: turn my idea into a 1-page PRD\nCONTEXT: idea is [one paragraph], users are [who]\nCONSTRAINTS: max 7 features, smallest stack that works\nEXAMPLE: 'problem, users, features, stack, tasks'"),
  EX("Write your PRD", "One page for YOUR idea, then generate its plan in the Planner.", "1-page PRD + todos")],
 # 17 MVP
 ("L10", "L10M2", "L10M2L7"): [H("MVP: smallest thing that proves it + demo day"),
  T("Cut everything except the ONE workflow that proves value.\nSlice: auth → core CRUD → one AI step → test → deploy → 3-minute demo (problem, live click-through, what's next).\nShip, watch real users, improve weekly."),
  P("GOAL: cut my PRD to an MVP slice\nCONTEXT: my PRD is [paste]\nCONSTRAINTS: 1 workflow, 2 weeks max, demoable link\nEXAMPLE: 'login → main action → done, live URL'"),
  EX("Demo yours", "Record a 3-minute demo: problem → live clicks → next step.", "Demo link")],
}

def main():
    tok = login("backend.admin@example.com", "password123")
    n = 0
    for (lv, m, les), blocks in SEEDS.items():
        r = put(f"/api/cms/level/{lv}/module/{m}/lesson/{les}", {"content": {"blocks": blocks}}, tok)
        assert r.get("ok"), (les, r)
        print(f"seeded {les}: {len(blocks)} blocks")
        n += 1
    print(f"DONE {n} lessons")

if __name__ == "__main__":
    main()
