# Emotion Tree 🚀🌈

A demo (MVP) Android game, built with **React Native**, that teaches autistic
children about feelings using **real photos of real people**.

The child grows a purple, space-themed "rainbow tree", a path of 13 leaves
like Duolingo's, on 3 planets:

| Planet | Leaves |
| ------ | ------ |
| 🪐 Planet 1: Basic Feelings | 1 Happiness 😊 · 2 Sadness 😢 · 3 Anger 😠 · 4 Tiredness 😴 · 5 Annoyedness 😒 |
| 🌋 Planet 2: Big Feelings | 6 Jealousy 😣 · 7 Fear 😨 · 8 Overstimulation 🙉 |
| 🚀 Planet 3: Special Missions | 9 Unfamiliar Places 🗺️ · 10 Special Interests 🦕 · 11 Body Language 🙌 · 12 Sarcasm 😏 · 13 Bullies & Ableism 🛡️ |

Every leaf has two parts:

1. **Explanation**: what it is and how to tell, example photos of real
   people, how to help (or how to handle it), short **stories** about kids
   and space friends ("Dina really likes playing ball. Playing makes her
   happy!"), and a **speech balloon** asking the child "What makes YOU
   happy?".
2. **Quiz** (Kahoot style, 7–8 questions): a real photo **or a story card**
   about a real-life situation ("A kid is playing with a new toy. You want it
   too, and you feel bad inside."), a question, and 4 big coloured answers.
   A right answer turns **green** and shows "Well Done! You did Great!". A
   wrong answer turns **red** and shows "Oh no… Let's try this again later!".
   Then the next question comes.

> **Want to change texts, questions, levels, prices or the weekly homework?**
> See [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md). No coding needed.

When all the questions are answered, the leaf turns light purple, the path to
the next leaf turns rainbow-coloured, and the next leaf unlocks.

### Space candies 🍬, the Feelings Test 🧪, the Shop 🛍️ and weekly homework 📅

- **Space candies**: every right answer gives **1 🍬**, in a leaf or in a
  test. Finishing a leaf gives **+5**, finishing a test **+3**, a perfect test
  **+5 more**, and doing the weekly homework **+10**. The candy counter is on
  the home screen, the test and the shop.
- **Feelings Test** (home screen, opens after 2 finished leaves): 10
  questions **mixed** from everything the child has finished so far (Happy,
  Sad, Angry…), in a new order every time. The results show stars (⭐⭐⭐),
  the score, the candies, and each feeling ("2 of 2 ✓", or "Play this leaf
  again to practice 🍃"). Always kind words, also for a low score.
- **Space Shop** (🛍️ on the home toolbar): special things for **me** (cool
  shades, witch hat, guitar, super cape, pumpkin costume, rainbow wings,
  jetpack, **fire powers**) and for **my buddy** (shades, pumpkin hat, guitar,
  cape, bat wings, rainbow wings, fire powers). Each item is shown on the
  child's **own** avatar or buddy before buying. Bought items are worn
  straight away and can be put on and taken off any time (in the shop, or in
  My look / My buddy → Extras). Not enough candies? It says kindly how many
  more are needed.
- **Weekly homework** (like Duolingo's daily goal, but weekly): every week the
  child does a few **missions** (a mission = a finished leaf or a Feelings
  Test; 3 a week to start). The home screen shows this week's missions,
  the days played (M T W T F S S) and the **🔥 streak** (weeks in a row).
  The first time the app opens in a new week, a **weekly check-up** says how
  last week went and what this week's homework is. A missed week is "a new
  start", never a telling-off.
- **Weekly report** (home → For grown-ups → Weekly report): the last 8 weeks,
  test scores, candies, and where the grown-up picks the weekly homework (1,
  2, 3, 4, 5 or 7 missions). When Friends is on, the parent page shows the
  same weekly check-up.

Candies, shop items and the weekly homework are saved on the phone, per
child. "Start again" (new tree) keeps the candies and the shop items.

### My room, my avatar, my space buddy and Friends

Like an igloo in Club Penguin, every child has **their own room** on the
space station:

- **My look**: the child makes their own avatar: hair style and colour, skin
  colour (natural **and** fun colours like alien green or sky blue), clothes,
  and extras like **cat ears** and **glasses**. The avatar's **face shows how
  the child feels right now** (happy, sad, scared, too much…), and a thought
  bubble says it in words ("I feel calm").
- **My buddy**: the child designs a cartoon **space buddy**: a **cat**, a
  **dog** or a **green alien**, with a style, one of **17 colours** (red, blue,
  pink, yellow, lime, magenta… as well as natural ones), extras (space
  helmet, scarf…), a name, and **a face**: smile, big grin, silly, love, wow,
  sleepy, frown, grumpy, or **"Same as me"** (the buddy feels what the child
  feels).
- **Friends**: children chat with **friends** and with **their own grown-up**.
  - Turning it on: a grown-up types the account password and makes a
    4-number **grown-up PIN**. Friends is on **straight away** (the parent
    gets a short heads-up email with a "Not OK? Turn off Friends" link).
  - Adding a friend: type the friend's code (pick a space word, tap 4
    numbers). **Both grown-ups** must approve, and **then** the friend must say
    yes. Grown-ups approve **in the app** (👪 Grown-up corner + PIN), with no
    waiting for emails. (Approving from the email still works too.)
  - Talking: tap **ready-made words** or send a **feeling** (like Club
    Penguin's Safe Chat, good for children who find reading or typing hard).
    **Typing and voice messages are OFF** until the grown-ups turn them on
    (Grown-up corner or parent page), and they can turn them off again any
    time.
  - **No pictures** can ever be sent, only words, feelings, typed text and
    voice.
  - **Class groups** can only be made by **schools and kindergartens**, never
    by children or parents.
  - Parents can **only** read the chats their own child is in.

  Friends needs the small **Friends server** in the `server/` folder (see
  "Run the Friends server" in section 1, and section 7).

### Time with my space buddy 🐾

On the home screen, **"Time with Zib Jr."** (the buddy's name) opens time
with the space buddy, a friend to practise with:

- **💬 Talk**: the buddy says hi, notices feelings ("Oh no, you feel sad.
  Do you want to tell me why?"), listens **without judging**, comforts,
  asks the child questions ("What's your favourite food?") and coaches
  turn-taking ("Your turn! Ask me a question too."). It tells jokes (with a
  pause to guess) and fun facts about things the child loves, and suggests
  tips for tricky social moments. Children who don't type answer with big
  buttons. **Typing (open talk) is OFF until a grown-up turns it on.**
- **🗺️ Adventures**: short stories to practise what the leaves taught,
  e.g. *The Sad Little Robot* (noticing sadness, helping), *Meteor Mess*
  (calming down when angry, using words, forgiving), *The Rocket Show*
  (fear and "too much"), *New Kid on the Space Station* (new places, joining
  a game, body language, special interests, taking turns). Each opens after
  the leaves it practises. Good answers give 🍬, other answers get a kind
  "look again". Finishing one counts for the weekly homework.
- **🎲 Games**: *Guess my face*, *Kind or not kind?*, *Would you rather*
  (pick one, then practise asking back "What about you?"), and *What would
  you say?* (real-life moments).
- **💡 Help me with…**: 12 tricky moments ("I want to join a game", "I don't
  know what to say", "It's too loud", "Someone is mean to me", "Are they
  joking?"…) with simple steps, **things you can say**, and an adventure to
  practise in.

**The buddy is not an AI.** It runs only on the phone, never goes on the
internet, and only says sentences written in `src/data/buddy.json` (over
900 of them) or by the child's grown-up. So it can't say anything nobody
wrote, and it can't discuss complex topics ("That's a big question! A
grown-up is great at big questions."). It is honest that it is a pretend
buddy, and it encourages real friends and family.

**Privacy and safety**:

- What the child says to the buddy is **never saved and never sent**. The
  chat is forgotten when it closes.
- **Worrying messages** are the only exception: someone hurting the child,
  unsafe touching, wanting to hurt themselves, danger, a stranger online, a
  bad secret, bullying (the "safety" list in `buddy.json`). The buddy answers
  kindly and honestly ("I'm going to tell your grown-up and your teacher, so
  they can help you. You are not in trouble."). Then the app sends **that
  one message** to the app's own Friends server, where **only** the child's
  grown-up (Grown-up corner + parent page) and the teacher of the child's
  school group (school page) can read it. The emails they get only say
  "please log in", never the child's words. Nothing ever goes to an AI
  company or to anyone else.
- For milder worries (teasing, a bad secret, "nobody likes me") the buddy
  **asks first**: "Do you want me to tell your grown-up and your teacher?"
- Without Friends turned on there is no server to reach, so the buddy shows
  a big **"Show this to a grown-up"** card instead ("I need to talk to you
  about something important.").

**For grown-ups** (home → For grown-ups → **Buddy settings**, locked with
the account password): turn buddy time on or off, turn **open talk**
(typing) on or off, and **Teach my buddy**: the name the buddy uses for the
child, topics the child loves (animals, cars, space, dinosaurs, trains, the
ocean, each with fun facts), **your own topics and facts** (e.g. "Horses 🐴:
Horses can sleep standing up."), **comfort words** ("Mom loves you to the
moon and back 🌙"), things that help the child calm down, and friends' and
pets' names. All of this is saved only on the phone.

---

## 1. How to run the app

### What you need (one time only)

| Tool | Version | Where to get it |
| ---- | ------- | --------------- |
| **Node.js** | 22.11 or newer | https://nodejs.org (choose "LTS") |
| **JDK** | 17 (recommended) | https://www.azul.com/downloads/?package=jdk#zulu (Zulu 17) |
| **Android Studio** | latest | https://developer.android.com/studio |

React Native's official set-up guide has screenshots for every step:
https://reactnative.dev/docs/set-up-your-environment (choose your computer and
"Android").

In **Android Studio → Settings → Languages & Frameworks → Android SDK**:

- **SDK Platforms** tab: tick a recent Android version (e.g. Android 15, API 35)
  and its system image, for the emulator.
- **SDK Tools** tab: tick *Android SDK Build-Tools*, *Android SDK Command-line
  Tools* and *Android Emulator*.
- The project compiles against **Android SDK Platform 37** with
  **Build-Tools 37.0.0** (the React Native 0.87 defaults). If they are missing,
  Android Studio offers to install them during the first Gradle sync: click
  **Install** and accept the licences.

Set the `ANDROID_HOME` environment variable to your SDK folder:

- **Windows**: `%LOCALAPPDATA%\Android\Sdk` (Control Panel → User Accounts →
  *Change my environment variables*), and add
  `%LOCALAPPDATA%\Android\Sdk\platform-tools` to `Path`.
- **macOS**: add to `~/.zshrc`:
  ```sh
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
  ```

### Make an emulator (a pretend phone)

Android Studio → **Device Manager** → **Create Virtual Device** → pick any
phone (e.g. *Pixel 8*) → pick a system image (API 35 is fine) → **Finish** →
press ▶ to start it.

(A real Android phone also works: turn on *Developer options → USB debugging*
and plug it in.)

### Run it

Open a terminal **in this project folder** (the one with `package.json`):

```sh
npm install          # 1. download the libraries (first time only, ~2-5 min)
npm start            # 2. start Metro, the JavaScript server. Leave it running!
```

Open a **second** terminal in the same folder:

```sh
npm run android      # 3. build the app and open it on the emulator
```

The first build takes a few minutes. After that, every change you save in a
`.ts`/`.tsx` file appears on the phone straight away (press `r` in the Metro
terminal to reload by hand).

> **Windows (PowerShell):** if `npm` gives a "running scripts is disabled"
> error, type `npm.cmd` instead of `npm` (e.g. `npm.cmd install`,
> `npm.cmd run android`), or once run
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

> **After getting a new version of the project**, run `npm install` and
> `npm run android` again (not only `npm start`). Some versions add Android
> code (like the fast password check), which only gets onto the phone with a
> new build.

### Run the Friends server (for Friends and chats)

The lessons work without it. For **Friends**, start the server in a
**third** terminal:

```sh
cd server
npm start            # no "npm install" needed: it uses plain Node.js
```

You will see:

```
🚀 Emotion Tree server is running on http://localhost:8787
   Android emulators reach it at http://10.0.2.2:8787
📧 TEST MODE: emails are not sent. Open the test mailbox:
   http://localhost:8787/dev/mail
🏫 Add a test school here: http://localhost:8787/dev/admin
```

**Test mode (the normal way to test)**: **no real emails are sent**, so
nothing arrives in a real inbox (not for parents, not for schools). Every
email appears in the **test mailbox** instead: open
http://localhost:8787/dev/mail on your computer, open an email and click its
button to "be" the parent or the school. Nothing has to wait for emails
though: grown-ups approve in the app with their PIN, and test schools get
their log-in link right on the page (see below).

The app finds the server by itself on the emulator (`10.0.2.2` means "the
computer the emulator runs on"). For a **real phone** on the same Wi-Fi, put
your computer's address in `src/config.ts` (e.g. `http://192.168.1.23:8787`).

**Real emails**: see "Sending real emails" in section 7.

### Test Friends with two emulators (two children)

1. Android Studio → **Device Manager**: create a **second** virtual device
   and start both.
2. Keep `npm start` (Metro) and the server running.
3. `npm run android` installs the app on **every running emulator**. (Or in
   Android Studio pick each emulator at the top and press ▶ once for each.)
4. On emulator 1, make an account (e.g. `mia_star`, email
   `mia.parent@test.com`). On emulator 2, another (`leo_moon`,
   `leo.parent@test.com`).
5. On each: **Friends** → a grown-up types the account password and makes a
   4-number grown-up PIN (twice) → **Turn on Friends**. It is on straight
   away. (A "Friends is on" heads-up email appears in the test mailbox.)
6. Mia: **➕ Add a friend** → pick Leo's word → tap his 4 numbers → **Send**.
7. On **each** phone a yellow note says "Your grown-up has 1 thing to say yes
   or no to". Tap **👪 Grown-up corner** (bottom of Friends) → type the PIN
   → **Approve**.
8. Leo: the request appears → **Yes! 🤝**. Now they can chat.
9. To try typing and voice: **Grown-up corner** → Messages → **Turn on**
   (in a chat between friends, **both** grown-ups must turn it on).
10. Groups: open http://localhost:8787/dev/admin and add a test kindergarten.
    Click **Open the school page** (shown right there), make a group, and
    invite the children by their friend codes. Their grown-ups approve in
    the Grown-up corner.
11. The parent page (read chats, the weekly check-up…): **Grown-up corner →
    🌐 Open the parent page**.

Voice messages on an emulator: in the emulator's **⋮ Extended controls →
Microphone**, turn on *"Virtual microphone uses host audio input"*.

### Or run it from Android Studio

1. Run `npm install` and `npm start` as above (Metro must be running).
2. In Android Studio: **File → Open** → choose the **`android`** folder inside
   this project (not the project folder itself).
3. Wait for **Gradle sync** to finish (bottom bar). Install anything it asks for.
4. Pick your emulator at the top and press the green ▶ **Run** button.

### Other useful commands

```sh
npm test             # run the unit tests (game rules, data files, log-in, avatars, Friends,
                     # candies, the space buddy, adventures.json)
cd server && npm test   # run the server tests (approvals, chat rules, safety, groups,
                        # worry alerts, the buddy privacy check)
npm run typecheck    # check the TypeScript types
npm run lint         # check code style (add -- --fix to auto-format)
```

### If something goes wrong

| Problem | Fix |
| ------- | --- |
| `SDK location not found` | Set `ANDROID_HOME` (see above), or create `android/local.properties` with `sdk.dir=C:\\Users\\YOU\\AppData\\Local\\Android\\Sdk` (Windows) or `sdk.dir=/Users/YOU/Library/Android/sdk` (macOS). |
| Red screen "Unable to load script" | Metro is not running. Run `npm start`, then press `r`. On a real phone also run `adb reverse tcp:8081 tcp:8081`. |
| `Unsupported class file major version` / Gradle and Java errors | Use JDK 17: in Android Studio, **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** → choose 17. For `npm run android`, also set `JAVA_HOME` to that JDK 17 folder. |
| Photos show "The photo could not load" | The photos come from the internet. Check the emulator has internet (open Chrome in it). |
| Want to start again with no accounts | Uninstall the app from the emulator, or use **Start again** on the main screen to reset one child's tree. |
| Strange build errors after changing libraries | `cd android && ./gradlew clean` (Windows: `gradlew clean`), then `npm run android` again. |
| `'react-native' is not recognized` | The libraries are not installed yet: run `npm install` (Windows: `npm.cmd install`) in the project folder first. |
| A red screen about `.expo/.virtual-metro-entry` | That is a **different, older app** on the emulator (an Expo app). Open the **EmotionTree** app instead, or uninstall the old one. |
| Making an account or logging in takes long | Run `npm run android` again (a new build). The fast password check is Android code, so it needs one rebuild. (Without it, a slower JavaScript check is used.) |
| Friends: "Can't reach the Friends server" | Start it (`cd server` → `npm start`). On a real phone, set your computer's address in `src/config.ts` and make sure the phone is on the same Wi-Fi. |
| No emails arrive (parents or schools) | In test mode no real emails are sent: they are in the test mailbox (http://localhost:8787/dev/mail). You don't need them: grown-ups use the PIN in the app, schools use the link on `/dev/admin` or a school password. For real emails, see section 7. |
| Friends: "Waiting for your grown-up" (an older account) | Tap **Turn on Friends now**: type the password and make a grown-up PIN. |
| Forgot the grown-up PIN | In the Grown-up corner tap **📧 Email me the parent page** (test mode: in the test mailbox), and make a new PIN on the parent page. 5 wrong PINs = wait 5 minutes. |
| Friends: no Type or Voice buttons | They are off until the grown-ups turn them on (Grown-up corner or parent page). In a friend chat, **both** grown-ups must turn them on. |
| The 🧪 Feelings Test has a 🔒 | Finish 2 leaves first. The test mixes questions from the finished leaves. |
| A buddy adventure has a 🔒 | It opens after the leaves it practises (it says which one). |
| No ✏️ Type button in the buddy chat | Open talk is off until a grown-up turns it on: home → For grown-ups → **Buddy settings**. |
| The buddy doesn't understand something | Add the words to `src/data/buddy.json` (see CONTENT_GUIDE.md section 13). |
| Worry alerts don't reach the grown-up | They need Friends to be on (and the server running). Without Friends, the buddy shows the "Show this to a grown-up" card instead. |
| Voice: "The microphone is not allowed" | Allow it in the phone's **Settings → Apps → EmotionTree → Permissions**. On an emulator, also see the microphone tip above. |

---

## 2. How the app works

```
App opens
 └─ Someone logged in on this device?
     ├─ no  → LogIn Screen   (grown-up logs in, or makes an account)
     └─ yes → Main Screen    (my room: avatar + buddy + feeling bubble + 🍬 candies)
                │   (first time in a new week: the 📅 weekly check-up popup)
                ├─ "Let's Start" → Rainbow tree (MyTree.draw): 3 planets, 13 leaves
                │    └─ tap the glowing leaf → Level.play()
                │        ├─ Part 1: Explanation (what it is, photos, how to help,
                │        │          stories, "What makes YOU …?" balloon)
                │        ├─ Part 2: Quiz, one question at a time (photo or story card)
                │        │          +1 🍬 for every right answer
                │        └─ Done → Level.finish(): completed = TRUE, +5 🍬,
                │                  1 weekly mission, tree redraws, progress saved
                ├─ 🧪 Feelings Test → 10 mixed questions from the finished leaves
                │                    → stars, candies, 1 weekly mission
                ├─ 📅 This week     → missions done, days played, 🔥 streak
                ├─ 🪞 My look   → Avatar Studio (face/feeling, hair, colours, clothes, extras)
                ├─ 🐾 My buddy  → Buddy Studio (cat/dog/alien, face, style, colour, extras, name)
                ├─ 🛍️ Shop      → spend 🍬 on things for me / for my buddy
                ├─ 🐾 Time with Zib Jr. → space buddy: 💬 talk, 🗺️ adventures (+🍬, 1 weekly
                │                         mission), 🎲 games, 💡 help me with…
                ├─ For grown-ups → Weekly report (weeks, tests, set the weekly homework)
                │                → Buddy settings (password): buddy time, open talk,
                │                  Teach my buddy
                └─ 💬 Friends   → first time: a grown-up turns Friends on (password + PIN)
                     ├─ 👪 My grown-up  → chat with my own parent
                     ├─ friends          → player card → chat
                     ├─ ➕ Add a friend   → friend code → both grown-ups → the friend
                     ├─ 🏫 Class groups   → made by schools / kindergartens only
                     └─ 👪 Grown-up corner (PIN) → approve, typing/voice, parent page
```

- Each child (account) has their own tree. Progress is saved on the device, so
  the tree looks the same the next time the app opens.
- Only the **next** leaf and **finished** leaves can be tapped. Grey leaves
  are locked. The tree scrolls by itself to the glowing leaf.
- The main screen shows each planet with its leaves and a progress bar.
- The Android **back** button goes back one screen (level → tree → home,
  chat → friends → home, adventure → adventures → buddy → home).
- The avatar, buddy and feeling are saved on the phone, and (when Friends is
  on) sent to the server so friends see them.

### Friends: how it keeps children safe

| Rule | How |
| ---- | --- |
| A grown-up must turn on Friends | It needs the account password **and** a 4-number grown-up PIN that the grown-up makes. The parent also gets a heads-up email with a **"Not OK? Turn off Friends"** link. Turning Friends on again on another phone needs the same PIN. |
| The grown-up PIN | Kept on the server only as a scrambled hash (scrypt), never on the phone. After 5 wrong PINs, everyone has to wait 5 minutes. Each grown-up can only approve things about **their own** child. A forgotten PIN is changed on the parent page. |
| No strangers | No search and no lists of children. A friend can only be added with their **friend code**, which children share in real life. |
| Both parents + the friend | **Both** grown-ups must approve a friend request (in the app's Grown-up corner with their PIN, or with the button in the email). The other child only sees it after **both** approved, and then must say yes too. |
| No pictures, ever | The server only accepts 4 kinds of messages: ready-made phrase ids, feeling ids, typed text and voice. Anything else is refused ("No pictures"). Voice files are checked byte by byte: they must really be sound (MP4/AAC, WebM/Opus, Ogg), not a picture or video in disguise. |
| Typing and voice are off by default | Grown-ups turn them on or off any time (Grown-up corner or parent page). Between friends, **both** must allow it. If a grown-up turns typing or voice off, messages of that kind from others are hidden for their child (🔒). |
| Ready-made words always work | Children can always use phrases and feeling cards. That helps children who find reading or typing hard. |
| Safety filter on typed messages | Phone numbers, emails, links, addresses, other apps, "keep it a secret" and unkind words are stopped, with a kind explanation. Stopped messages are listed for the parent. |
| "🚩 Tell my grown-up" | On every message from another child. The parent gets an email and sees the message on the parent page. |
| Groups by schools only | Only schools and kindergartens (added by the app owner) can make groups and invite children. Each child's grown-up must approve. Children and parents **cannot** make groups. |
| Parents see only their own child | The parent page shows only chats their own child is in. Parents can read them, remove a friend, take the child out of a group, and chat with their child. Schools see only their own groups. |
| Parent page and school log-ins | Parents open the parent page from the Grown-up corner (PIN), or with an email link. Schools log in with their email and a school password, or an email link. Links are one-time and expire. |

### The space buddy: how it keeps children safe

| Rule | How |
| ---- | --- |
| Not an AI, no internet | The buddy's brain (`models/BuddyBrain.ts`) only looks for words and answers with sentences written in `buddy.json` or by the child's grown-up. It never goes online. A test checks that the buddy's code never talks to a server and that no AI library or AI web address is used anywhere. |
| Nothing is saved | The chat lives only in the screen's memory and is forgotten when it closes. (The buddy says so: "our chat floats away into space 🎈".) |
| Worrying messages: parent + teacher only | One message (its words and its kind) goes to the app's own server, readable only by the child's grown-up and the teacher of the child's school group. Emails say "please log in" without the child's words. Max 10 an hour. |
| Honest with the child | The buddy says when it will tell a grown-up, and asks first for milder worries. It says it is a pretend buddy, not a real person. |
| Open talk off by default | Children use big buttons until a grown-up turns typing on (Buddy settings, password). |
| Private info and unkind words | Phone numbers, emails and addresses get "That's private info! Keep it safe." Unkind words get a kind reply. |
| No complex topics | Big or grown-up questions get "That's a big question… ask a grown-up you trust." |
| Real friends first | The buddy encourages playing with real friends (by name, if the grown-up added them) and talking to family. |

### Designed for autistic children

- **Lexend** font: a free font made for easy reading. Big text, extra line
  spacing, short sentences in easy English.
- **Calm and predictable**: the stars never move or flash, the back button is
  always in the same place, and popups wait for the child to tap "Next".
- **Not only colour**: answers also have shapes (▲ ◆ ● ■), and right/wrong
  also show ✓ / ✗.
- **Big tap targets** (at least 64 px).
- **Screen-reader labels** on every button and photo.
- **Autism-affirming content**: special interests and stimming (like hand
  flapping) are presented as good and normal; eye contact is optional;
  "too much" (overstimulation) is explained without blame, with practical
  coping tools.

---

## 3. Project map

```
EmotionTree/
├── CONTENT_GUIDE.md            How to change texts, questions, levels, phrases, looks,
│                               the buddy's words and adventures
├── App.tsx                     Picks LogIn Screen or Main Screen
├── index.js                    Starts the app (React Native entry point)
├── package.json                Libraries + npm commands
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx     LogIn Screen: log in / make an account
│   │   ├── MainScreen.tsx      SETS UP the game (initQuestions, initExplanations,
│   │   │                       initSections, initLevels, initTree) and switches views
│   │   ├── HomeScreen.tsx      My room: avatar, buddy, feeling, candies, toolbar,
│   │   │                       Let's Start, Feelings Test, this week's homework
│   │   ├── AvatarStudio.tsx    "My look" (face, hair, colours, clothes, extras)
│   │   ├── BuddyStudio.tsx     "My space buddy" (kind, face, style, colour, extras, name)
│   │   ├── TreeScreen.tsx      Shows the rainbow tree (calls MyTree.draw)
│   │   ├── TestScreen.tsx      🧪 The Feelings Test (start → questions → results)
│   │   ├── ShopScreen.tsx      🛍️ The Space Shop (for me / for my buddy)
│   │   ├── WeeklyReport.tsx    For grown-ups: weeks, tests, set the weekly homework
│   │   ├── buddy/
│   │   │   ├── BuddyTime.tsx      🐾 Time with the buddy: talk, adventures, games, help
│   │   │   ├── BuddyTalk.tsx      The chat with the buddy (and the help tips)
│   │   │   ├── AdventurePlayer.tsx  Plays one adventure from adventures.json
│   │   │   ├── BuddyGames.tsx     Guess my face, Kind or not kind?, Would you rather…
│   │   │   └── BuddySettings.tsx  For grown-ups (password): buddy time, open talk,
│   │   │                          Teach my buddy
│   │   └── friends/
│   │       ├── FriendsSetup.tsx   First time: a grown-up turns on Friends
│   │       ├── GrownUpForm.tsx    Account password + making the grown-up PIN
│   │       ├── GrownUpScreen.tsx  👪 Grown-up corner (PIN): approve, settings, parent page
│   │       ├── FriendsScreen.tsx  Grown-up chat, friends, requests, groups, my code
│   │       ├── AddFriendModal.tsx Friend code: space word + number pad
│   │       ├── PlayerCard.tsx     A friend's card (avatar, buddy, feeling, Chat)
│   │       └── ChatScreen.tsx     Words, feelings, typing, voice, 🚩 report
│   ├── models/                 ← the classes from the brief
│   │   ├── Question.ts         Question(id, question, answers[], correct)
│   │   ├── Leaf.ts             Leaf(id, name, completed, isNext)
│   │   ├── Explanation.ts      Explanation(id, photos[], explanation, howToHelp)
│   │   ├── MyTree.tsx          MyTree(id, userId, leaves[]) + getTree() + draw()
│   │   ├── Level.tsx           Level(id, name, explanation, questions[], completed)
│   │   │                       + getters/setters + toLeaf() + play()
│   │   ├── User.ts             User(id, friends[], look, pet)
│   │   ├── Look.ts             Look(id, userId, isHuman, hair, skin, accessories[])
│   │   │                       + defineLook() for humans AND pets
│   │   ├── Pet.ts              The space buddy: name + Look (isHuman = false)
│   │   ├── Dec.ts              One choice (a hair style, a colour, cat ears, a shop item…)
│   │   ├── Rewards.ts          Candies, shop, weekly homework, streak, check-up, tests
│   │   ├── BuddyBrain.ts       The buddy's (scripted, not AI) brain for talking
│   │   ├── buddyWords.ts       Reads kids' words: patterns, spelling, safety checks
│   │   └── Adventure.ts        Adventure steps + the checker for adventures.json
│   ├── components/             Re-usable building blocks
│   │   ├── LevelPlayer.tsx     The screen behind Level.play() (explanation → quiz)
│   │   ├── QuizQuestion.tsx    One quiz question (used by leaves AND the test)
│   │   ├── rewards/CandyCounter.tsx   "🍬 42"
│   │   ├── rewards/WeeklyCard.tsx     This week's homework, days and 🔥 streak
│   │   ├── rewards/WeeklyCheckup.tsx  The weekly check-up and "Well done!" popups
│   │   ├── PinPad.tsx          The grown-up PIN number pad
│   │   ├── buddy/BuddyChatView.tsx    The buddy chat: face, bubbles, big answer buttons
│   │   ├── buddy/ShowGrownUpCard.tsx  "I need to talk to you about something important" card
│   │   ├── ExampleCard.tsx     One story in the lesson (character emoji + text)
│   │   ├── AskYouBalloon.tsx   "What makes YOU …?" speech balloon
│   │   ├── SceneCard.tsx       Story card for real-life quiz questions
│   │   ├── FeedbackPopup.tsx   "Well Done!" / "Oh no…" popup
│   │   ├── LeafButton.tsx      One round leaf on the path
│   │   ├── PathDots.tsx        Dots between leaves (rainbow when done)
│   │   ├── PhotoCard.tsx       A real photo + its "(see source)" link
│   │   ├── avatar/KidAvatar.tsx    Draws the child's avatar (face follows the feeling)
│   │   ├── avatar/BuddyAvatar.tsx  Draws the cartoon cat / dog / alien with its face
│   │   ├── avatar/extras.tsx       Shop drawings: fire, guitar, wings, sparks
│   │   ├── avatar/RoomScene.tsx    The room: window, floor, avatar, buddy, bubble
│   │   ├── FeelingPicker.tsx   "How do you feel right now?"
│   │   ├── RoundToolButton.tsx Round Club Penguin-style toolbar button (with badge)
│   │   ├── StudioTabs.tsx / OptionTile.tsx   Studio tabs and choice tiles
│   │   ├── TextEntryModal.tsx  Typing box at the top (keyboard never covers it)
│   │   ├── TopBar.tsx          Back button + title
│   │   ├── KidButton.tsx       Big purple button
│   │   ├── AppText.tsx         Text in the Lexend font
│   │   └── SpaceBackground.tsx Stars, planet and moon
│   ├── services/
│   │   ├── authService.ts      Protected log-in (hashing, checks, sessions)
│   │   ├── progressService.ts  Saves which leaves each child finished
│   │   ├── rewardsService.ts   Saves candies, shop items, weeks and tests
│   │   ├── testBuilder.ts      Mixes the Feelings Test questions
│   │   ├── buddyService.ts     Saves Buddy settings + Teach my buddy (on the phone only)
│   │   ├── worryAlerts.ts      The ONLY buddy thing that is sent: a worrying message,
│   │   │                       to the grown-up + teacher (via our own server)
│   │   ├── storage.ts          Saving on the device (AsyncStorage)
│   │   ├── photoLibrary.ts     Finds photos in photos.json by id
│   │   ├── profileService.ts   Saves the avatar, buddy and feeling on the device
│   │   ├── looksCatalog.ts     looks.json → Decs
│   │   ├── feelings.ts         feelings.json + phrases.json
│   │   ├── friendsService.ts   Everything the app asks the Friends server
│   │   ├── useFriendsOverview.ts  Checks for news every few seconds (red badge)
│   │   ├── friendCode.ts       Friend code words (⭐ STAR, 🌙 MOON…)
│   │   ├── voice.ts            Records and plays voice messages
│   │   └── api.ts              Talks to the server, easy-English errors
│   ├── config.ts               Where the app finds the Friends server
│   ├── data/                   ← all the content, easy to edit (see CONTENT_GUIDE.md)
│   │   ├── levels.json         The planets and 13 levels (name, emoji, order)
│   │   ├── explanations.json   Part 1 for each level (text, photos, stories, balloon)
│   │   ├── questions.json      Part 2 questions (photo or story + 4 answers)
│   │   ├── photos.json         The photo "database" (69 photos + source links)
│   │   ├── phrases.json        Ready-made chat phrases (Safe Chat)
│   │   ├── feelings.json       Feelings a child can share
│   │   ├── looks.json          Avatar + buddy choices + shop prices (also read by the server)
│   │   ├── rewards.json        Candies per answer, test settings, weekly homework
│   │   ├── buddy.json          Everything the buddy says: feelings, questions, jokes,
│   │   │                       facts, help tips, games, the safety list
│   │   └── adventures.json     The buddy adventures (copy one to write your own)
│   └── theme/theme.ts          All colours, fonts and sizes in one place
├── __tests__/                  Unit tests (npm test)
├── __mocks__/                  Stand-ins for phone-only libraries in the tests
├── server/                     The Friends server (plain Node.js, no installs)
│   ├── src/server.js           npm start
│   ├── src/app.js, http.js     Web server, security headers, uploads
│   ├── src/service.js          ALL the rules (approvals, chats, groups, worry alerts,
│   │                           who sees what)
│   ├── src/filter.js           Safety filter for typed messages and names
│   ├── src/routes/api.js       What the app can ask
│   ├── src/routes/parent.js    The parent page
│   ├── src/routes/school.js    The school / kindergarten page
│   ├── src/routes/dev.js       Test mailbox + test schools (test mode only)
│   ├── src/emails.js           The emails to parents and schools
│   ├── scripts/add-school.js   Add a real school (app owner only)
│   ├── test/                   Server tests (npm test)
│   └── data/                   The database + voice files (made when it runs)
└── android/                    The Android project (open THIS in Android Studio)
    ├── app/src/main/assets/fonts/   Lexend font files
    └── app/src/main/java/com/emotiontree/
        ├── MainApplication.kt          Adds the PasswordHasher package
        ├── PasswordHasherModule.kt     Fast password check (Android's own PBKDF2)
        └── PasswordHasherPackage.kt    Tells React Native about it
```

---

## 4. Changes to the brief's architecture (and why)

The classes and functions follow the brief. A few small things were added:

| Change | Why |
| ------ | --- |
| `Question` has a 5th field, `image` | Each question shows a photo from the database, so it needs the photo id. |
| `Leaf` has an optional `icon` and a `clickable` getter | `clickable` is `true` for completed leaves and the next leaf. The brief says only clickable leaves can be tapped. |
| `MyTree.getTree()` returns a **String** | The brief says `String getTree()`, a "toArray" written as text (good for `console.log`). `getLeaves()` returns the real array. |
| `MyTree.draw()` / `Level.play()` return screen elements | In React Native, "drawing" means returning what to show. `draw()` takes the function to call when a leaf is tapped. |
| `Level.finish()` was added | Called after the last question: sets `completed = TRUE`, updates the tree and redraws it (the brief's last step). |
| `Level.tsx` / `MyTree.tsx` end in `.tsx` | They return screen elements, which needs JSX. |
| `LevelPlayer` component | Holds the quiz screen for `Level.play()`, so the `Level` class stays short. |
| Photos live in `photos.json`; questions point to them by id | One "database" of photos, each with its source link, used by both explanations and questions. |
| Question 3 of levels 2-5 shows an earlier feeling | Practising old feelings again, like Duolingo reviews. |
| `Question` can have a `scene` (story card) instead of a photo | Real-life situations ("a kid is playing with a toy and I feel bad") are hard to show in one photo. |
| `Explanation` has optional `examples`, `askYou` and `howToHelpTitle` | Stories, the "What makes YOU …?" balloon, and headings like "How to handle fear". |
| `Level` / `Leaf` have an optional `section` (planet); `MyTree.getSections()` | Groups the levels into planets, like Duolingo units. |
| `MyTree.draw()` takes an optional second function | Tells the tree screen where the next leaf is, so it can scroll there. |
| `User` also has `username`, `feeling` and `friendCode` | The name friends see, how the child feels right now (the avatar's face), and the code friends use to add them. |
| `Look` also has `hairColor`, `outfit` (humans), `kind` and `mood` (pets) | For pets, `hair` is the buddy's style and `skin` is its colour, as the brief's fields; `kind` is cat/dog/alien and `mood` is the buddy's face. |
| `Look.defineLook(choices)` checks every choice against `looks.json` | A typo or an old choice can never break the drawing (the `safeHuman` / `safePet` versions fall back to the defaults). |
| `Pet` class (name + Look) | The brief's `Pet pet`. The buddy's look is a `Look` with `isHuman = false`, so `defineLook` works for both, as the brief asks. |
| `Dec` class | The brief uses `Dec` for hair, skin and accessories; each `Dec` is one choice from `looks.json` (id, name, emoji or colour). |
| The child's face = their shared feeling | One choice, shown on the avatar, in the thought bubble and to friends, so it is always the same. |
| Chats are "P2P" through a small server | Two phones cannot reach each other directly, and parents must approve, read and control everything. So messages go phone → server → phone (checked every few seconds). |
| `Level.play()` takes an optional 4th argument, `rewards` | So a leaf can give a candy for each right answer and a bonus at the end, without the `Level` class knowing about the shop. |
| `QuizQuestion` component (taken out of `LevelPlayer`) | The leaves and the Feelings Test show questions in exactly the same way. |
| `Rewards` model (plain functions, no class) | Candies, shop, weekly homework, streak and the check-up are rules about dates and numbers; plain functions are easy to test (`__tests__/rewards.test.ts`). |
| `Dec` has an optional `price`; `Look` has `mood` for pets | Shop items are ordinary extras with a price. The buddy's face is one more choice. |
| A small piece of Android code (`PasswordHasherModule.kt`) | The JavaScript engine on phones (Hermes) is slow at password hashing, so making an account took very long. Android's own PBKDF2 is many times faster, so it can also use more hashing rounds (safer). If it is missing, the app falls back to the JavaScript version. |
| Grown-up PIN instead of waiting for emails | Approving by email was too slow. Grown-ups now approve in the app with a PIN (checked by the server); emails are only a heads-up. |
| The space buddy talks with a scripted "brain" (`BuddyBrain`), not an AI | So it never sends what children say to an AI company, works without internet, and can only say sentences people wrote and checked. More lines can be added to `buddy.json` any time. |
| `Pet` is drawn with a `mood` override (`BuddyAvatar mood=…`) | The buddy's face reacts to what it says (sad, surprised, grinning) while it talks. |
| Adventures are data (`adventures.json`) with a checker | Grown-ups can write new adventures without code; `npm test` finds mistakes (missing steps, typos in ids, no good answer…). |

---

## 5. About the photos (please read)

The brief asks for **Shutterstock** photos. This demo uses real photographs
of real people from **Pexels** instead. **No photo is AI-generated.**

Why: Shutterstock photos need a **paid licence**, and the free previews have
a watermark and may not be used in an app. Pexels photos are free to use in
apps under the [Pexels License](https://www.pexels.com/license/). We still show
a "📷 Photo: Pexels (see source)" link under every photo, which opens the
photo's page.

### Switching to your Shutterstock photos

All photos are in **one file**, `src/data/photos.json`. For each photo you
license on Shutterstock:

1. Download the licensed image and put it online where the app can reach it
   (your website, Firebase Storage, S3, etc.).
2. In `photos.json`, change that photo's:
   - `uri` → your licensed image's URL
   - `source` → the Shutterstock page of the photo
   - `site` → `"Shutterstock"`
   - `description` → a short description (screen readers read it out)
3. Keep the same `id` (e.g. `"happy-1"`), and nothing else needs to change.
4. Run `npm test`. It checks that every photo still has a link and a source.

---

## 6. Changing the content

All texts, questions, stories, photos, levels and planets live in 4 JSON
files in `src/data/`. Chat phrases, feelings, looks, **shop prices**
(`looks.json`) and **candies / test / weekly homework numbers**
(`rewards.json`) are in 4 more. **No code changes are needed.** The
step-by-step guide, with copy-paste templates, is in
[`CONTENT_GUIDE.md`](CONTENT_GUIDE.md).

---

## 7. The Friends server

A small server in `server/`. Plain **Node.js 22+**, no packages to install,
and its data is one JSON file plus the voice files in `server/data/`. Good for
a prototype and for testing; see "Before a real launch" below.

Settings (environment variables):

| Setting | What it does | Default |
| --- | --- | --- |
| `PORT` | Port to listen on | `8787` |
| `PUBLIC_URL` | The server's address, used in email links | `http://localhost:8787` |
| `DATA_DIR` | Where the database and voice files are kept | `server/data` |
| `RESEND_API_KEY` | Turns on **real emails** (https://resend.com). Without it the server is in **test mode** (test mailbox at `/dev/mail`). | not set |
| `MAIL_FROM` | Sender of real emails, e.g. `Emotion Tree <hello@yourdomain.com>` (a domain you verified in Resend) | Resend's test sender |
| `ADMIN_KEY` | Secret for adding schools | `dev-admin-key` in test mode |

**What goes by email, and what doesn't.** Nothing in the app waits for an
email any more:

| What | How (no waiting) | Email |
| --- | --- | --- |
| Turning on Friends | Account password + grown-up PIN in the app | A heads-up to the parent, with "Not OK? Turn off Friends" |
| Approving friends and groups | 👪 Grown-up corner in the app (PIN) | Also sent, with Approve / Decline buttons (either works) |
| Typing / voice on or off | Grown-up corner (PIN) | – |
| Parent page | Grown-up corner → Open the parent page | "Email me the parent page" (for a forgotten PIN) |
| School log-in | Email + school password, or the link shown when the school is added | Log-in link (to set the first password) |
| "Tell my grown-up" 🚩 | Shown on the parent page | Sent to the parent |
| A worrying message to the space buddy | Grown-up corner + parent page; the school page for the child's school(s) | "Please check in with your child" to the parent and the school, **without** the child's words |

**Adding a school or kindergarten** (only the app owner can):

- **Test mode**: open http://localhost:8787/dev/admin, fill in the name and
  email, and click **Open the school page** on the next page.
- **Real server**:

  ```sh
  cd server
  ADMIN_KEY=your-secret npm run add-school -- --name "Sunflower Kindergarten" --email teacher@sunflower.org --kind kindergarten --server https://your-server.com
  ```

  It prints the school's log-in link (and emails it too). Give the link to
  the school.

On the school page the school sets a **password** (🔑 School password), so
from then on it opens `/school` (e.g. http://localhost:8787/school) and logs
in with its email and password. There
it can make groups, invite children by friend code, and write to the group.

**Sending real emails.** Without `RESEND_API_KEY` the server is in test mode
and **never sends real emails** (that is why no email arrives in a real
inbox). To send real emails:

1. Make a free account at https://resend.com and create an **API key**.
2. Start the server with it. Windows (PowerShell):
   ```powershell
   cd server
   $env:RESEND_API_KEY="re_xxxxxxxx"; npm.cmd start
   ```
   macOS / Linux: `RESEND_API_KEY=re_xxxxxxxx npm start`
3. With Resend's test sender, emails only go to **the email address of your
   own Resend account**. To email anyone else, verify your domain in Resend
   (Domains → Add domain) and set `MAIL_FROM`, e.g.
   `Emotion Tree <hello@yourdomain.com>`.
4. Set `PUBLIC_URL` to an address the parents' phones can open (not
   `localhost`), otherwise the links in the emails won't work for them.

Emails are sent in the background, so the app never waits for them. If
sending fails, the server prints "Email failed: …".

**Before a real launch** (children's data is protected by law, e.g. COPPA in
the USA and GDPR-K in Europe):

- Host the server online with **HTTPS** (e.g. Render, Railway, Fly.io or a
  small VPS), put its address in `src/config.ts`, and back up `server/data/`.
  (Release builds of the app only talk to `https://` addresses.)
- Move the data to a real database, and add privacy policy, parental consent
  records, data deletion on request, and how long chats are kept.
- Verify schools before adding them, and have a person who reads reports.
- **Space buddy worry alerts**: agree with schools who reads them and how
  fast (their safeguarding lead), decide how long they are kept, and have a
  child-safety expert review the buddy's safety list and replies in
  `buddy.json` (and add your country's children's helpline in
  `settings.helpline`). The buddy is a practice friend, not a counsellor or
  an emergency service, and worry alerts can be missed (no internet, Friends
  off, a misspelled word), so say this clearly to parents.
- Think about real-time updates (WebSockets) instead of checking every few
  seconds, and push notifications (also for worry alerts).

---

## 8. About the log-in system

- Accounts are kept **only on this device** (as the brief asks).
- Passwords are **never saved**. Only a salted **PBKDF2-SHA256** hash is saved.
  - On Android it is made by Android's own fast PBKDF2
    (`PasswordHasherModule.kt`, 50,000 rounds, done off the screen thread),
    so making an account or logging in takes well under a second.
  - If that Android code is missing (e.g. the app was not rebuilt), the app
    uses [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) in
    JavaScript (2,000 rounds, slower on phones).
  - Older accounts keep working: the app remembers how each password was
    hashed and checks it the same way.
- Log-in errors never say whether the username or the password was wrong.
- After 5 wrong passwords, that username has to wait 30 seconds.
- Rules: username 3-20 letters/numbers/`_`; a real-looking email; password 8+
  characters with letters **and** numbers.

- **Friends** uses the same username and password on the server (hashed with
  scrypt there; the parent's email must match). The phone keeps only a login
  token for the server. The grown-up PIN is hashed with scrypt on the server
  and is never saved on the phone.

**Before a real launch**: this is demo-level security. For real users, move
accounts to a server (e.g. Firebase Auth or Supabase), use encrypted storage on
the phone, and add parental consent and privacy steps (children's data is
protected by law, e.g. COPPA / GDPR-K).

---

## 9. What was tested

- **TypeScript**: the whole app type-checks against React Native 0.87.1 and
  React 19 types.
- **Unit tests** (`npm test`, 308 tests):
  - game rules (leaves, tree, planets, levels, quiz colours, story
    questions), every data file (all 96 questions, 13 lessons, 69 photos)
  - log-in (hashing with an official test vector, the fast Android hasher,
    wrong passwords, lock-out), saved progress
  - avatars and buddies (`Dec`, `Look.defineLook`, `Pet`, `User`, faces),
    friend codes, chat helpers
  - space candies, the shop, weekly homework, streaks, the check-up, tests
  - **the space buddy**: reading kids' words (spelling, stretched letters,
    small typos), every safety rule (worrying sentences ARE noticed, and
    ordinary ones like "the ball hit me" or "is this private" are NOT),
    "tell" vs "ask first", no server = the grown-up card, conversations
    (feelings, comfort words, jokes, facts, questions, "your turn"), ~80
    different sentences with and without typing that never show a
    `{placeholder}` or an empty bubble, every line and link in `buddy.json`,
    `adventures.json` has no mistakes (and the checker finds broken ones),
    and Teach my buddy (no links / phone numbers, typing off by default).
- **Server tests** (`cd server && npm test`, 61 tests): approvals, the
  grown-up PIN, chat rules, no pictures, the safety filter, groups, school
  passwords, the weekly check-up, and **worry alerts**: they reach only the
  parent and the child's school, emails never contain the child's words,
  other parents / schools / children can't see them, unknown kinds and too
  many are refused. A **privacy check** reads the app's code: the buddy's
  files never talk to a server or save the chat, only `worryAlerts.ts` sends
  (and only to `/api/buddy/alert`), and no AI library or AI web address is
  used anywhere.
- **End-to-end** in a simulated phone against the real server:
  - the whole game (all 13 levels, 104 checks), candies + test + shop +
    weekly homework (21 checks), Friends with two phones, the PIN, the parent
    page and a school (36 checks)
  - **the space buddy (44 checks)**: talk with buttons, jokes, feelings,
    locked adventures, all 4 games with candies, help tips, Buddy settings
    (wrong password refused, typing on, Teach my buddy: nickname, loves,
    own topic + fact, links refused, comfort words, friends, pets), open
    talk using what the grown-up taught, a worry without Friends (the card,
    nothing sent), all 4 adventures played to the end (candies + weekly
    mission), the Android back button, then with Friends + a school group:
    a worry reaching the parent (Grown-up corner, parent page) and the
    teacher (school page) with emails that don't contain the words, "ask
    first" with "Not now" (nothing sent) and "Yes" (sent), and turning
    buddy time off. No errors or warnings.

It was **not** built on a real Android device or emulator before delivery, so
the first `npm run android` on your computer is the first real build of this
version. If it shows an error, send me the message and I will fix it.
