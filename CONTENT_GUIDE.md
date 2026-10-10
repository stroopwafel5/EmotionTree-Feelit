# Content Guide: changing texts, questions, levels, chat phrases, looks, the space buddy and adventures

**Short answer: no code changes are needed for content.**
Every text the child reads in a lesson or quiz lives in **4 files** in the
folder `src/data/`. You can change texts, add questions, add stories, add
photos, and even add whole new levels or planets just by editing those files.
The app picks up the changes by itself.

More files in the same folder:

- Friends: the ready-made chat phrases, the feelings a child can share, and
  the avatar / space buddy choices with the shop prices (sections 9-11)
- space candies, the Feelings Test and the weekly homework (section 12)
- **the space buddy**: everything it says (`buddy.json`, section 13) and its
  **adventures** (`adventures.json`, with a template, section 14)

---

## 1. Which file holds what

| What you see in the app | File | Field |
| --- | --- | --- |
| Level name and emoji on the leaf | `levels.json` | `name`, `icon` |
| Order of the levels on the tree | `levels.json` | order of the `levels` list |
| Planet headings ("🪐 Planet 1: Basic Feelings") | `levels.json` | `sections` |
| Lesson: "What is it? 🤔" box | `explanations.json` | `explanation` |
| Lesson: example photos | `explanations.json` | `photos` |
| Lesson: "How can we help? 🤝" box | `explanations.json` | `howToHelp` |
| Lesson: a different heading for that box (e.g. "How to handle fear 🛟") | `explanations.json` | `howToHelpTitle` |
| Lesson: "Stories 📖" (Dina, Jim, Zib…) | `explanations.json` | `examples` |
| Lesson: speech balloon ("What makes YOU happy?") | `explanations.json` | `askYou` |
| Quiz questions, answers, right answer | `questions.json` | one line per question |
| Quiz story cards ("A kid is playing with a toy…") | `questions.json` | `scene`, `sceneIcon` |
| Photos (the image and its "see source" link) | `photos.json` | one line per photo |
| Ready-made chat phrases ("Hi! 👋", "Want to play?") and their groups | `phrases.json` | `categories` |
| Feelings a child can share (thought bubble, avatar face, chat feeling cards) | `feelings.json` | `feelings` |
| Avatar choices: hair, hair colours, skin colours, clothes, extras | `looks.json` | `human` |
| Space buddy choices: kinds, styles, colours, faces, extras | `looks.json` | `pet` |
| What a brand-new child starts with | `looks.json` | `defaults` |
| Shop items and their prices | `looks.json` | `price` on an extra |
| Candies per right answer, test settings, weekly homework | `rewards.json` | `candies`, `test`, `weekly` |
| What the space buddy says and understands | `buddy.json` | see section 13 |
| Fun facts (animals, cars, space, dinosaurs, trains, the ocean) | `buddy.json` | `topics` |
| Jokes | `buddy.json` | `jokes` |
| "Help me with…" tips | `buddy.json` | `help` |
| Buddy games (faces, kind or not, would you rather, what would you say) | `buddy.json` | `games` |
| Worrying messages (what the buddy tells grown-ups about) | `buddy.json` | `safety` |
| Buddy adventures | `adventures.json` | `adventures` |

---

## 2. How to edit safely

1. Open the project folder in **VS Code** (free: https://code.visualstudio.com)
   or Android Studio. Both colour JSON files and underline mistakes in red.
2. Change the text and **save**.
3. If the app is running (`npm start` + emulator), it reloads by itself.
   If not, press `r` in the Metro terminal.
4. Run **`npm test`**. It checks every question, lesson and photo, and tells
   you exactly which one has a problem (e.g. "question 97 is not valid").

### The 5 JSON rules

1. Text goes inside **"double quotes"**.
2. Items in a list are separated by **commas**, with **no comma after the last
   item**.
3. For speech inside a text, use **curly quotes “ ”** (copy them from here) or
   single quotes `'`. A plain `"` inside a text breaks the file.
4. `[ ]` is a list, `{ }` is one item. Keep them in pairs.
5. Emoji can be pasted straight in: 😊 🚀 🧸

---

## 3. Change a text

Find the text and type over it. For example, in `explanations.json`, level 1:

```json
"howToHelp": [
  "Smile back at them.",
  "Play with them and share the fun.",
  "You can say: “I am happy too!”"
],
```

Each line in the list is shown as its own short line in the app. Add a line
by adding `"…",` to the list (remember: no comma after the last line).

---

## 4. Add a question

Open `questions.json`. Questions are grouped by level, and the quiz shows them
**in the order of the file**. Copy one of these two templates and paste it
where you want it in the level's group.

**A photo question:**

```json
{"id": 97, "levelId": 1, "image": "happy-8", "question": "What is the kid feeling?", "answers": ["Happy", "Sad", "Tired", "Angry"], "correct": "Happy"},
```

**A story question (a real-life situation, no photo needed):**

```json
{"id": 98, "levelId": 6, "sceneIcon": "🧸", "scene": "A kid is playing with a new toy. You want it too, and you feel bad inside.", "question": "What are you feeling?", "answers": ["Jealous", "Happy", "Tired", "Scared"], "correct": "Jealous"},
```

Rules:

- **`id`**: a number no other question uses. The highest now is **96**, so
  use 97, 98, 99…
- **`levelId`**: which leaf (the `id` from `levels.json`, e.g. 6 = Jealousy).
- **`image`** (a photo id from `photos.json`) **or** **`scene`** (the story)
  **or both**. With both, the story shows small under the photo.
- **`sceneIcon`**: one emoji shown big on the story card (optional).
- **`answers`**: exactly **4**, all different.
- **`correct`**: copied **exactly** from one of the answers (same spaces,
  same quotes). Put the right answer in different places (1st, 2nd, 3rd,
  4th) so children can't guess by position.

Tip: questions and answers of more than about 45 and 26 letters get a
slightly smaller font, so everything still fits on the screen. Short is
best for the children anyway.

---

## 5. Add or change stories and the speech balloon

In `explanations.json`, each lesson has:

```json
"examples": [
  {"name": "Dina", "icon": "👧", "text": "Dina really likes playing ball ⚽. Playing makes her happy!"},
  {"name": "Jim", "icon": "👦", "text": "Jim likes eating cookies 🍪. Snacks make him happy."}
],
"askYou": "What makes YOU happy?"
```

- `name`: who the story is about. `icon`: the emoji used as their picture.
- Add as many stories as you like (2–3 is a good amount).
- `askYou` is the question in Zib's speech balloon. There is no right or wrong
  answer; the child thinks about it or talks with a grown-up.

**The cast** (so stories stay consistent):

| Character | Emoji |
| --- | --- |
| Zib the alien (also asks the balloon question) | 👽 |
| Robo the robot | 🤖 |
| Luna the space cat | 🐱 |
| Captain Kai | 🧑‍🚀 |
| Kids: Dina, Noa, Mia, Ava, Lily, Ella | 👧 |
| Kids: Jim, Leo, Ben, Sam, Max, Omar, Tom | 👦 |

---

## 6. Add a photo

1. Find a real photo on **Pexels** (free for apps) or use your licensed
   **Shutterstock** photo.
2. **Pexels**: open the photo's page. The number at the end of the link is
   the photo number, e.g. `https://www.pexels.com/photo/a-boy-playing-with-dinosaurs-7606011/`
   → **7606011**.
3. Add one line to `photos.json` (change the 3 places with the number, the
   page link, the id and the description):

```json
{"id": "happy-9", "uri": "https://images.pexels.com/photos/7606011/pexels-photo-7606011.jpeg?auto=compress&cs=tinysrgb&w=800", "source": "https://www.pexels.com/photo/a-boy-playing-with-dinosaurs-7606011/", "site": "Pexels", "description": "A boy plays with his toy dinosaurs."},
```

4. Use the new `id` (`"happy-9"`) in a question (`"image"`) or in a lesson
   (`"photos"`).

**Shutterstock**: put your licensed image somewhere online (your website,
Firebase Storage…), and use that address as `uri`, the Shutterstock page as
`source`, and `"Shutterstock"` as `site`.

The `description` is read out by screen readers, so describe what is in the
photo in easy English.

---

## 7. Add a whole new level

Three steps, three files. Example: a new level 14, "Excitement".

**Step 1: `levels.json`**, add to the `levels` list:

```json
{"id": 14, "name": "Excitement", "icon": "🤩", "section": 2}
```

`section` is the planet (1 = Basic Feelings, 2 = Big Feelings,
3 = Special Missions). The position in the list = the position on the tree.

**Step 2: `explanations.json`**, add a lesson with the **same id**:

```json
{
  "id": 14,
  "photos": ["happy-1", "happy-2"],
  "explanation": [
    "Excited is a big, bouncy happy feeling.",
    "We feel excited when something fun is coming soon.",
    "How can you tell?",
    "An excited person may jump, clap, or talk fast."
  ],
  "howToHelp": [
    "Share the fun with them!",
    "If they get too wild, help them take a slow breath."
  ],
  "examples": [
    {"name": "Ava", "icon": "👧", "text": "Ava is going to the zoo tomorrow 🦁. She is so excited she can't sit still!"}
  ],
  "askYou": "What makes YOU excited?"
}
```

**Step 3: `questions.json`**, add at least 4 questions with `"levelId": 14`.

That's it. The new leaf appears on the tree by itself. Run `npm test` to
check.

> ⚠️ **Never change the `id` of an existing level.** Each child's progress is
> saved by level id. You CAN change a level's name, emoji, lessons, questions
> and its position in the list.

---

## 8. Add or rename a planet

In `levels.json`, the `sections` list:

```json
{"id": 4, "title": "Planet 4: Friends", "icon": "🌟"}
```

Then give levels `"section": 4`. Planet headings and the progress cards on
the main screen update by themselves.

---

## 9. Chat phrases (`phrases.json`)

Like Club Penguin's Safe Chat: children tap a phrase instead of typing.
Phrases are **always allowed** (also when the parents turned typing off), so
keep them friendly and safe. The server only accepts phrase ids from this
file, so nothing else can be sent this way.

Add a phrase to a group:

```json
{"id": "love-space", "text": "I love space! 🚀"}
```

Add a whole new group (it becomes a new tab in the Words panel):

```json
{"id": "school", "name": "School", "icon": "🎒", "phrases": [
  {"id": "see-you-school", "text": "See you at school!"},
  {"id": "what-class", "text": "Which class are you in?"}
]}
```

Rules:

- Every `id` must be **unique** in the whole file (`npm test` checks).
- **Never change or delete an `id` that was already used.** Old messages
  point to it. To retire a phrase, change its text instead, or leave it.
- Restart the server after changing this file (`Ctrl+C`, then `npm start` in
  `server/`). The server reads the same file to know which phrases exist.

---

## 10. Feelings (`feelings.json`)

The feelings a child can share: on the thought bubble at home, as the
avatar's face, and as feeling cards in chats.

```json
{"id": "proud", "name": "Proud", "emoji": "🥳", "face": "excited"}
```

- `name` and `emoji` are what the child sees.
- `face` is which face the avatar drawing makes. Use one of: `happy`,
  `excited`, `calm`, `tired`, `sad`, `scared`, `angry`, `annoyed`, `jealous`,
  `overwhelmed`. (A brand-new face needs a drawing: a code change.)
- When the buddy's face is "Same as me", the buddy copies the feeling. A new
  feeling makes the buddy smile, unless a developer adds it to
  `MOOD_FOR_FEELING` in `src/components/avatar/BuddyAvatar.tsx`.
- Restart the server after changing this file.

---

## 11. Avatar and space buddy choices (`looks.json`)

Every choice is one line with an `id`, a `name` and an `icon` (emoji on the
button) or a `color`.

**New colours work straight away**: hair colours, skin colours, clothes
colours and buddy colours. Fun colours are welcome, and letting children be
creative is part of the fun:

```json
{"id": "funGold", "name": "Gold star", "color": "#FCD34D"}
```

(Colours are written as hex codes. Find one at https://htmlcolorcodes.com.)

**Buddy faces** are in `pet.moods`: `mirror` ("Same as me", copies the child's
feeling), `happy`, `grin`, `silly`, `love`, `surprised`, `sleepy`, `sad`,
`grumpy`. You can rename them or change their order. A new face needs a
drawing (code change).

**Shop items** are extras with a `price` (in space candies). Change the
price, or give another extra a price to sell it in the shop:

```json
{"id": "guitar", "name": "Guitar", "icon": "🎸", "price": 30}
```

**Buddy colours**: there are 17 (natural ones and fun ones like red, blue,
pink, lime, magenta). Add more like any colour above.

**New hair styles, extras, buddy kinds or styles** also need a drawing, so
ask a developer (see section 15).

`defaults` is what a brand-new child starts with. Every id there must exist
in the lists above.

- Never delete an `id` that children may already use. (The app falls back to
  the default look if it finds an unknown id, so nothing breaks, but that
  child's choice is lost.)
- Restart the server after changing this file.

---

## 12. Space candies, the Feelings Test and weekly homework (`rewards.json`)

```json
"candies": {"rightAnswer": 1, "finishLeaf": 5, "finishTest": 3, "perfectTest": 5, "finishAdventure": 5, "weeklyGoal": 10},
"test": {"questions": 10, "leavesNeeded": 2, "stars": [{"percent": 90, "stars": 3}, {"percent": 70, "stars": 2}, {"percent": 40, "stars": 1}]},
"weekly": {"defaultGoal": 3, "goalChoices": [1, 2, 3, 4, 5, 7], "weekStartsOn": "monday"}
```

- `candies`: how many 🍬 for a right answer (in leaves, tests, buddy games
  and adventures), finishing a leaf / test / adventure, a perfect test, and
  the weekly homework.
- `test`: questions per Feelings Test, leaves needed before it opens, and
  the stars (e.g. 90% or more = 3 stars).
- `weekly`: the weekly homework (missions per week) for new children, the
  choices grown-ups get in the Weekly report, and the first day of the week
  (`"monday"` or `"sunday"`). A mission = a finished leaf, a Feelings Test
  or a buddy adventure.

---

## 13. The space buddy's words (`buddy.json`)

The space buddy is **not an AI**. When the child types or taps something,
the buddy looks for **patterns** (words) in it, and answers with one of
**your sentences**. So: the more patterns and sentences, the cleverer it
seems, and it can never say something nobody wrote. Restart the app (press
`r` in Metro) after a change, and run `npm test`: it checks the whole file.

### Patterns: how the buddy recognises words

| Pattern | Matches |
| --- | --- |
| `"how are you"` | these words next to each other, anywhere ("hi, how are you today?") |
| `"play + game"` | both parts anywhere ("can we play a board game") |
| `"dino*"` | words that start with "dino" (dinosaur, dinos) |
| `"=hi"` | only when the whole message is "hi" |
| `"~good"` | (feelings only) only about the child: "I am good", "I feel good", or just "good" |

Capitals, punctuation and apostrophes don't matter ("I'm" = "im" = "i am").
Kid spellings are fixed by the `spelling` list (`"u": "you"`, `"idk": "i dont
know"`, add your own). Stretched words work ("sooo saaad"), and in words of 5+
letters one missing, extra or swapped letter is OK ("lonly", "tierd").
**Write patterns without apostrophes**: `dont`, `cant`, `i am`.

When several things match, the one with the **most matching words** wins.

### Placeholders in sentences

`{name}` the child (or the nickname from Teach my buddy) · `{buddy}` the
buddy's name · `{feeling}` · `{topic}` / `{topicIcon}` a topic the child loves
· `{friend}` · `{pet}` · `{calm}` · `{comfort}` · `{missionsLeft}` · `{match}`
(in question answers: the word the child said) · `{thing}` (topics).
A sentence with `{friend}`, `{pet}`, `{topic}`… is only used when the grown-up
added one, so always keep at least one sentence without them in each list.

**Buttons** ("chips") are written as text: `"Tell me a joke 😂"` (tapping it
"says" that). Add ` @games`, ` @adventures`, ` @help`, ` @help:joinGame`,
` @fact:dinosaurs` to open something: `"Let's play 🎲 @games"`.

### Add something the buddy understands (`intents`)

```json
{"id": "favouriteSport", "patterns": ["favourite sport", "do you like football", "do you like sports"],
 "replies": ["I love space-ball! ⚽ You kick it and it floats! What sport do you like?"], "expect": "tellMe"}
```

- `replies`: one is picked (the buddy doesn't repeat itself until all were used).
- Optional: `"mood"` (the buddy's face: happy, grin, silly, love, surprised,
  sleepy, sad, grumpy), `"expect"` (then listen to the answer of this
  question id), `"then": "ask"` (then ask the child a question), `"offer"`
  (then offer games / adventures / help / `help:<id>` / `fact:<topic>` /
  joke), `"chips"` (buttons), `"praise"` (sometimes said when the child did
  a good social thing).

### Add a question the buddy asks (`questions`)

```json
{"id": "favSport", "ask": ["What's your favourite sport? ⚽"], "remember": "your favourite sport",
 "chips": ["Football ⚽", "Swimming 🏊", "Dancing 💃"],
 "listen": [{"patterns": ["football", "soccer"], "replies": ["{match}! Goal! ⚽"]},
            {"patterns": ["swim*"], "replies": ["Splash! 🏊 Swimming is great!"]}],
 "otherwise": ["That sounds fun! 🏅"]}
```

The buddy never says an answer is wrong: if no `listen` matches, it says an
`otherwise` sentence. `chips` are answer buttons for children who don't type.
`"random": false` = only asked on purpose (from an intent's `expect`).

### Facts, jokes, tips and games

- **Facts** (`topics`): add a fact to a topic's `facts`, or a whole topic with
  `id`, `title`, `icon`, `words` (patterns) and `like` sentences. Keep facts
  short and **true**. (Grown-ups can also add their own topics in the app:
  Teach my buddy.)
- **Jokes**: `{"q": "What do you call…?", "a": "A …! 😄"}`.
- **Help me with…** (`help`): `title`, `icon`, `patterns`, `intro`, `steps`
  (3-5 short steps), `say` (things the child can say) and optional
  `practice` (an adventure id).
- **Games** (`games`): add rounds. `faces`: a buddy `mood`, the `answer`, 4
  `choices`, a `hint`. `kindOrNot`: `text`, `kind` (true/false), `why`.
  `wouldYouRather`: `a`, `b`, the buddy's pick and `why`. `whatWouldYouSay`:
  a `situation` and `options` with `kind` great / ok / unkind and a kind
  `reply` for each.

### Feelings (`feelings`)

Each feeling has `words` (patterns), `replies`, `ask` (the "why?" question,
when typing is on), `why` (after the child told why), `tips`, `mood` and
`hard` (a hard feeling: the buddy comforts, gives tips, and uses the
grown-up's comfort words).

### ⚠️ The safety list (`safety`): please change with care

These are the worrying messages the buddy tells the child's **grown-up and
teacher** about (only them, and only that one message). Each has:

- `id` and `title` (what grown-ups see, e.g. "Someone is hurting them"),
- `tell`: `"auto"` = the buddy tells the grown-up straight away (and says so
  to the child), `"ask"` = it asks the child first,
- `patterns` (no typo-guessing here, so add common misspellings yourself),
- `except` (optional): sentences that are NOT worrying ("ball hit me"),
- `replies`: calm, kind, "it's not your fault", "you're not in trouble".

The server reads this file too, so **restart the server** after a change.
Don't delete an `id` that was already used. Add your country's children's
helpline in `settings.helpline` (shown when a child asks "who can I talk
to?"). Have a child-safety expert look at this list before a real launch.

---

## 14. Adventures (`adventures.json`): the template

An adventure is a short story with steps. Copy this template into the
`adventures` list, change the texts, and run `npm test`: it tells you about
any mistake (a step that doesn't exist, no good answer, a typo in a
character…).

```json
{
  "id": "lost-kitten",
  "title": "The Lost Kitten",
  "icon": "🐱",
  "about": "A kitten is lost on the moon. Can you help?",
  "practices": [7],
  "needsLeaves": [7],
  "cast": {"kit": {"name": "Kit", "icon": "🐱"}},
  "steps": [
    {"id": "start", "scene": "🌙🐱", "mood": "surprised",
     "say": ["{name}, listen! Do you hear that?", "kit: Mew… mew… 😿"],
     "next": "feel"},

    {"id": "feel", "say": ["How do you think Kit feels?"],
     "choices": [
       {"text": "Scared 😨", "good": true, "reply": "Yes! Kit is shaking and hiding. 😨", "next": "say"},
       {"text": "Happy 😊", "reply": "Hmm, Kit is hiding and shaking. Look again! 👀"}
     ]},

    {"id": "say", "say": ["What could you say to Kit?"],
     "ideas": ["Don't worry, we will help you!", "Go away!"],
     "listen": [
       {"patterns": ["go away", "stupid"], "again": true, "reply": "Hmm, that might scare Kit more. 💜 What's a kind thing to say?"},
       {"patterns": ["help", "dont worry", "its ok"], "good": true, "reply": "So kind! Kit feels a bit safer. 💜"}
     ],
     "otherwise": "That's a kind idea! 🌟",
     "next": "you"},

    {"id": "you", "say": ["How do YOU feel when you help someone?"],
     "feelings": true,
     "feelingReplies": {"happy": "Me too! 😊", "*": "All feelings are OK! 💜"},
     "next": "end"},

    {"id": "end", "mood": "love",
     "say": ["kit: Purrr! Thank you! 🐱💜", "You helped Kit feel safe. Great job, {name}! 🌟"],
     "end": true}
  ]
}
```

**The step types**

| Step | Write | What the child does |
| --- | --- | --- |
| Talk | `say` + `next` (optional `nextLabel`: the button text, e.g. `"I breathed in 🌬️"`) | taps Next |
| Choice | `say` + `choices` | taps a button. `"good": true` goes on (and gives 🍬 on the first try); the others get their kind `reply` and the child tries again |
| Your words | `say` + `ideas` + `listen` + `otherwise` + `next` | taps an idea, or types (when a grown-up turned on typing). `"again": true` = gently ask for another idea |
| Feelings | `say` + `"feelings": true` + `feelingReplies` + `next` | picks a feeling card (`"*"` = any other feeling) |
| End | `say` + `"end": true` | +5 🍬 and one weekly mission |

**Good to know**

- `{name}` = the child, `{buddy}` = the buddy's name.
- A line that starts with a cast id and `:` (`"kit: Mew!"`) is said by that
  character (shown in a yellow bubble with its name and emoji).
- `scene`: a big emoji picture at the top of the step. `mood`: the buddy's
  face (happy, grin, silly, love, surprised, sleepy, sad, grumpy).
- `practices`: the leaves it practises (level ids from `levels.json`).
  `needsLeaves`: leaves to finish before it opens (`[]` = always open).
- Never call an answer "wrong": say what to look at, and let the child try
  again. Typed words are checked for worrying things first, like in the
  buddy chat.

---

## 15. What DOES need a code change


These are fixed texts and looks, not content. Each is one small edit:

| What | File |
| --- | --- |
| "Well Done! You did Great!" / "Oh no… Let's try this again later!" | `src/components/FeedbackPopup.tsx` (top of file) |
| Lesson headings: "What is it? 🤔", "Look at these photos 👀", "Stories 📖", button "I'm ready for the quiz! 🚀" | `src/components/LevelPlayer.tsx` |
| The balloon's "Zib asks you" and "Think about it, or tell a grown-up!" | `src/components/AskYouBalloon.tsx` |
| Main screen texts ("Hi, …!", "Let's Start") | `src/screens/MainScreen.tsx` |
| Log-in screen texts | `src/screens/LoginScreen.tsx` |
| Colours, font, text sizes | `src/theme/theme.ts` |
| Home screen ("Hi, …!", "Let's Start", the toolbar) | `src/screens/HomeScreen.tsx` |
| Avatar / buddy studio tabs and hints | `src/screens/AvatarStudio.tsx`, `src/screens/BuddyStudio.tsx` |
| Buddy name ideas ("Comet", "Nova"…) | `NAME_IDEAS` in `src/screens/BuddyStudio.tsx` |
| Friends and chat screens | `src/screens/friends/` |
| A new hair style, extra, buddy kind/style or face (needs a drawing) | `src/components/avatar/KidAvatar.tsx`, `BuddyAvatar.tsx` |
| Emails to parents and schools | `server/src/emails.js` |
| Words the safety filter stops in typed messages | `server/src/filter.js` |
| The buddy's screens (hub, chat, games, adventure player, Buddy settings) | `src/screens/buddy/` |
| A new kind of buddy game or adventure step | `src/screens/buddy/BuddyGames.tsx`, `src/models/Adventure.ts` |
| How the buddy matches words (the rules in section 13) | `src/models/buddyWords.ts`, `src/models/BuddyBrain.ts` |
| The emails about worrying messages | `server/src/emails.js` |
| New kinds of activities (videos for "how to help", drag-and-drop…) | new code |

---

## 16. If something goes wrong

| What you see | What it means | Fix |
| --- | --- | --- |
| Red screen with "JSON" or "Unexpected token" | A comma or quote is missing or extra | Check the line you just changed; VS Code underlines it in red |
| `npm test`: "the correct answer … is not one of its answers" | `correct` doesn't match an answer exactly | Copy-paste the answer into `correct` |
| `npm test`: "it needs an image or a scene" | The question has no photo and no story | Add `"image"` or `"scene"` |
| In the app: "Photo "…" is missing from photos.json" | A photo id has a typo | Use an id that exists in `photos.json` |
| `npm test`: a level "has no explanation" | A level has no lesson | Add a lesson with the same `id` to `explanations.json` |
| A photo shows "could not load" | No internet, or the photo link changed | Check the `uri` opens in your browser |
| A new chat phrase can't be sent ("Unknown phrase") | The server still has the old file | Restart the server |
| A new colour shows on the phone but friends see the default look | The server still has the old `looks.json` | Restart the server |
| `npm test`: "Adventure … goes to …, which does not exist" | A `next` has a typo | Use the exact `id` of a step |
| `npm test`: "at least one choice needs "good": true" | Every choice step needs a right answer | Add `"good": true` to one choice |
| The buddy doesn't react to a sentence | No pattern matches it | Add a pattern (section 13); remember: no apostrophes |
| A worry alert gives "Unknown kind of worry" | A new `safety` id, but the server has the old file | Restart the server |
