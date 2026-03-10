# FHEVM Bootcamp — Demo Video Script (Detailed)

**Duration:** 5 minutes (300 seconds)
**Format:** Screen recording with voiceover (English)
**Tool:** OBS Studio / Loom / any screen recorder
**Resolution:** 1920x1080 recommended
**Tips:** Speak slowly and clearly. Pause 1-2 seconds between sections. Keep mouse movements smooth.

---

## SCENE 1: OPENING — Landing Page (0:00 – 0:40)

### Screen
Open browser at: `https://fhevm-bootcamp-demo.vercel.app`

### What to say (voiceover):
> "Hi, I'm presenting the FHEVM Bootcamp — a comprehensive 20-module curriculum for building confidential smart contracts with Zama's Fully Homomorphic Encryption Virtual Machine."

### What to do on screen:
1. **[0:00–0:05]** Show the landing page. Let the hero section be visible. Slowly scroll down.
2. **[0:05–0:15]** Point at the stats row — hover over each one:
   - Say: *"The bootcamp includes 20 modules, 38 smart contracts — all deployed on Ethereum Sepolia, 360 passing tests, 20 Marp slide decks, 215 interactive quiz questions, and approximately 63 hours of content."*
3. **[0:15–0:25]** Scroll down to the **"Learning Paths"** section. Hover over each card:
   - Say: *"We offer four learning paths: a standard 4-week cohort at 16 hours per week, an intensive 7-day format, a part-time 6-week path for working professionals, and a fully self-paced option."*
4. **[0:25–0:35]** Scroll down to the **"What's Included"** features grid:
   - Say: *"Each module comes with a lesson plan, slide deck, exercises with solutions, quiz questions, and instructor notes. Everything is supported by Docker for one-command setup."*
5. **[0:35–0:40]** Scroll back up to the hero. Pause.

---

## SCENE 2: INTERACTIVE DEMO — Encryption Flow (0:40 – 1:30)

### What to say:
> "Let me show you the interactive demo that walks students through the fhevmjs encryption pipeline."

### What to do on screen:
1. **[0:40–0:43]** Click the **"Try Interactive Demo"** button in the hero section. The modal opens.
2. **[0:43–0:50]** You're on the **"Encryption Flow"** tab. The first step "Initialize fhevmjs" is selected.
   - Say: *"This is a 6-step walkthrough of how client-side FHE encryption works. Step 1: the fhevmjs library loads a WASM module in the browser that handles all encryption — no server needed."*
   - Point at the syntax-highlighted code block.
3. **[0:50–0:58]** Click **Step 3** ("Add Values to Encrypt") in the sidebar.
   - Say: *"In step 3, you chain add methods to queue values for encryption. Each method maps to an fhEVM type — addUint64, addBool, addAddress."*
4. **[0:58–1:07]** Click **Step 4** ("Encrypt & Get Handles + Proof").
   - Say: *"Step 4 runs the actual FHE encryption in WASM. The output is a handle — a 32-byte reference to the ciphertext — and an inputProof that the contract verifies on-chain."*
   - Point at the green output box.
5. **[1:07–1:15]** Click **Step 5** ("Send to Contract").
   - Say: *"The handle and proof are sent as function parameters. On-chain, the contract calls FHE.fromExternal to convert the external handle into a usable encrypted value."*
6. **[1:15–1:22]** Switch to the **"Contract Demos"** tab.
   - Say: *"We also have three real-world contract interaction demos."*
7. **[1:22–1:28]** Click **"Sealed-Bid Auction"**.
   - Say: *"Here's a sealed-bid auction: bids are encrypted with FHE.gt and FHE.select — the highest bid is updated without ever revealing individual bid values."*
   - Scroll to show the Solidity code (syntax highlighted).
8. **[1:28–1:30]** Close the demo modal (click X or press ESC).

---

## SCENE 3: CODE PLAYGROUND — Monaco Editor (1:30 – 2:30)

### What to say:
> "Now let me show you the Code Playground — a VS Code-quality editor built right into the browser."

### What to do on screen:
1. **[1:30–1:33]** Click the **"Code Playground"** button in the hero section. The modal opens.
2. **[1:33–1:40]** The first exercise "Hello FHE" is selected. Point at the sidebar:
   - Say: *"Students get 18 hands-on exercises, each with difficulty indicators — green for beginner, yellow for intermediate, red for advanced. Progress is tracked with checkmarks."*
3. **[1:40–1:50]** Point at the editor area:
   - Say: *"This is a real Monaco Editor — the same engine that powers VS Code — with custom Solidity syntax highlighting. You can see keywords in purple, types in yellow, FHE calls in blue, strings in green, and comments in gray."*
   - Point at specific colored tokens in the code.
4. **[1:50–2:00]** Now **TYPE in the editor** — fill in TODO 1:
   - Click inside the `setSecret` function body (line with `// YOUR CODE HERE`)
   - Delete `// YOUR CODE HERE`
   - Type: `_secret = FHE.asEuint32(value);`
   - Press Enter
   - Type: `FHE.allowThis(_secret);`
   - Say while typing: *"Let me fill in the first TODO. We encrypt a plaintext value using FHE.asEuint32, then grant the contract access with FHE.allowThis."*
5. **[2:00–2:05]** Point at the info bar — show "Edited" badge appeared, "3 TODOs" counter.
   - Say: *"The editor tracks your changes. You can see the Edited badge and the remaining TODO count."*
6. **[2:05–2:10]** Click **"Show Hints"** button (if visible under the info bar):
   - Say: *"Students can progressively reveal hints before seeing the full solution."*
   - Click "Reveal next hint" once.
7. **[2:10–2:17]** Click the **"Compare"** button in the header:
   - Say: *"The Compare view shows a side-by-side diff — your code on the left, the reference solution on the right. This is how students self-assess."*
   - Point at the diff highlights.
8. **[2:17–2:22]** Click **"Solution"** button:
   - Say: *"Or they can view the full solution directly. The editor becomes read-only in solution mode."*
9. **[2:22–2:27]** Click **"Mark Done"** button:
   - Say: *"Students mark exercises as complete. Progress is saved to localStorage — it survives page refreshes."*
   - Point at the checkmark and progress bar in the sidebar.
10. **[2:27–2:30]** Close the playground (ESC or X).

---

## SCENE 4: LESSON WALKTHROUGH — Module 08 (2:30 – 3:45)

### What to say:
> "Now let's walk through a sample lesson. I'll open Module 8: Conditional Logic."

### What to do on screen:
1. **[2:30–2:35]** Scroll down to the curriculum section on the landing page. Find **Week 2 — Core Patterns**.
2. **[2:35–2:38]** Click the **"Lesson"** button on **Module 08: Conditional Logic**.
3. **[2:38–2:50]** The LessonViewer modal opens on the **"Lesson"** tab. Scroll through:
   - Say: *"Each module has a detailed lesson with learning objectives, prerequisites, and estimated duration. Module 8 covers the critical concept that you cannot branch on encrypted data — instead, you use FHE.select for conditional logic."*
   - Scroll past some content — show markdown rendering with code blocks.
4. **[2:50–2:58]** Click the **"Exercise"** tab:
   - Say: *"The exercise tab shows the hands-on coding challenge. Students fill in TODO sections and can reference the lesson material as they work."*
   - Show the exercise content.
5. **[2:58–3:10]** Click the **"Slides"** tab:
   - Say: *"Every module also has a full Marp slide deck embedded right here. Let me navigate through a few slides."*
   - **Press the right arrow key 3-4 times** to advance slides.
   - Say: *"The slides include animations, diagrams, and speaker notes for instructors."*
   - Click **"Open in full screen"** (the external link icon) briefly, then come back.
6. **[3:10–3:15]** Click the **right arrow** navigation button at the bottom to go to **Module 09**.
   - Say: *"You can navigate between modules with the arrow buttons. Here's Module 9: On-Chain Randomness."*
7. **[3:15–3:18]** Close the lesson viewer.

### Quiz Demo:
8. **[3:18–3:22]** Scroll down to **Quick Links** section and click **"Interactive Quiz"**.
   - The quiz opens in a new tab.
9. **[3:22–3:35]** In the quiz:
   - Select **Module 08** from the dropdown.
   - Say: *"The quiz has 215 questions across all 20 modules. Let me show Module 8."*
   - Answer 2-3 questions quickly (click correct answers).
   - Say: *"Scores persist in localStorage. Students can retake quizzes and see their best score."*
   - Point at the progress bar and score display.
10. **[3:35–3:40]** Close the quiz tab.

### On-Chain Contracts:
11. **[3:40–3:45]** Back on the main page, scroll down to **"35 Deployed Contracts"** section.
    - Click **"Show all 35 contracts"**.
    - Click any contract address link — it opens Etherscan.
    - Say: *"All contracts are verified and deployed on Ethereum Sepolia. Students can interact with them directly."*
    - Close Etherscan tab.

---

## SCENE 5: TERMINAL — Tests & Compilation (3:45 – 4:20)

### What to say:
> "Let me switch to the terminal to show the development environment."

### What to do on screen:
1. **[3:45–3:50]** Switch to your terminal (VS Code terminal or command prompt). Make sure you're in the project directory.
   - Run: `cd Desktop/Zama/fhevm-bootcamp` (if not already there)
2. **[3:50–3:58]** Run: `npx hardhat compile`
   - Say: *"All 38 contracts compile cleanly with Hardhat and the fhEVM plugin."*
   - Wait for output: "Compiled 38 Solidity files successfully"
3. **[3:58–4:10]** Run: `npx hardhat test`
   - Say: *"And our full test suite — 360 tests covering every contract, every FHE operation, every edge case — all passing."*
   - Wait for the green "360 passing" output. Let it be visible for 2-3 seconds.
4. **[4:10–4:15]** Quickly open a contract file to show code quality:
   - In VS Code, open `contracts/CrossContractDemo.sol`
   - Say: *"Here's our cross-contract composability demo — one contract stores encrypted data and grants ACL access to another contract. This is a key pattern for building modular FHE applications."*
5. **[4:15–4:20]** Open `curriculum/HOMEWORK.md` briefly:
   - Say: *"Each week has a homework assignment with detailed specifications and grading rubrics — from a simple encrypted calculator in Week 1 to a full Confidential DAO capstone in Week 4."*
   - Scroll to show the rubric table briefly.

---

## SCENE 6: CLOSING — Summary (4:20 – 5:00)

### What to say:
> "Let me wrap up with a quick summary of everything included."

### What to do on screen:
1. **[4:20–4:25]** Switch back to the browser. Show the landing page one more time.
2. **[4:25–4:55]** Slowly scroll through the page while summarizing:
   - Say: *"To summarize — this bootcamp provides:
     - A complete 20-module, 4-week curriculum going from Solidity basics to advanced FHE DeFi.
     - 38 smart contracts, all deployed and verified on Ethereum Sepolia.
     - 360 tests with full coverage.
     - An interactive learning platform with a lesson viewer, embedded slides, and code exercises.
     - A Code Playground with a real VS Code editor, Solidity syntax highlighting, side-by-side diff comparison, and progress tracking.
     - An interactive demo that walks through the entire fhevmjs encryption pipeline.
     - 215 quiz questions with persistent scoring.
     - 20 Marp slide decks with animations and speaker notes.
     - Instructor Guide, 4 learning paths, Docker support, and comprehensive supplementary resources including a cheatsheet, gas guide, security checklist, and an FHE pattern decision tree.
     - Everything is open source on GitHub."*
3. **[4:55–5:00]** End on the hero section with the title visible.
   - Say: *"Thank you for watching. This is the FHEVM Bootcamp — the most comprehensive fhEVM educational resource available. I'm excited to contribute this to the Zama ecosystem."*

---

## RECORDING CHECKLIST

Before recording:
- [ ] Close all unrelated browser tabs
- [ ] Set browser zoom to 100% (Ctrl+0)
- [ ] Use a clean browser window (no bookmarks bar clutter)
- [ ] Set terminal font size to 16+ so text is readable
- [ ] Test microphone audio levels
- [ ] Close notifications (Windows Focus Assist / Do Not Disturb)
- [ ] Have the Vercel URL open and loaded
- [ ] Have VS Code open with the project
- [ ] Have terminal ready in the project directory
- [ ] Run `npx hardhat compile` once BEFORE recording so it uses cache (faster)
- [ ] Practice the script once without recording

After recording:
- [ ] Watch the full recording to check audio quality
- [ ] Verify total duration is under 5 minutes
- [ ] Trim any dead air or mistakes
- [ ] Export as MP4 (H.264)

## KEY PHRASES TO EMPHASIZE

These are the "wow factor" phrases that judges listen for:

1. **"38 contracts, ALL deployed on Ethereum Sepolia"** — proves it's not just theory
2. **"360 passing tests"** — shows production quality
3. **"VS Code-quality editor in the browser"** — Monaco Editor is impressive
4. **"Side-by-side diff comparison"** — unique educational feature
5. **"fhevmjs encryption pipeline walkthrough"** — shows deep framework understanding
6. **"FHE.select — no branching on encrypted data"** — proves you understand the core paradigm
7. **"Cross-contract FHE composability"** — advanced topic, shows depth
8. **"From encrypted calculator to Confidential DAO capstone"** — shows progression
9. **"Everything persists in localStorage"** — shows UX polish
10. **"Open source on GitHub"** — community contribution mindset

## WHAT NOT TO DO

- Don't rush. 5 minutes is enough time if you stay focused.
- Don't show the GitHub repo page — stay on the Vercel app and terminal.
- Don't apologize for anything ("sorry this is a bit rough" etc.)
- Don't explain what FHE is in detail — the judges already know.
- Don't spend more than 10 seconds on any single contract's code.
- Don't read code line-by-line — summarize what it does.
- Don't forget to show the Code Playground typing — it's the most visual moment.
