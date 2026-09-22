# Ascend ko phone par lagana (bina cable, bina Android Studio)

Tareeqa: aap files GitHub par daalte hain, GitHub khud APK (app ki file) bana deta hai,
phir aap phone se us APK ko download karke install kar lete hain.

## Step 0 (optional): laptop par pehle try
`www` folder mein `index.html` par double-click karein, Chrome mein app khul jayegi.

## Step 1: GitHub account
https://github.com par Sign up karein (free).

## Step 2: Naya repository
1. Upar "+" > **New repository**.
2. Name: `ascend`. **Public** chunein (isme aap ka koi personal data nahi hota, wo sirf phone mein rehta hai).
3. **Create repository** dabayen.

## Step 3: Files upload
1. Naye repository ke page par **"uploading an existing file"** link dabayen.
2. Unzip kiye hue `ascend` folder ke **andar ki sab cheezein** khinch kar wahan chhod dein:
   `www`, `ci`, `.github`, `package.json`, `capacitor.config.json` wagera.
   (Folder khud nahi, uske andar ki cheezein.)
3. Neeche **Commit changes** dabayen.

Agar `.github` folder upload na ho (Mac par ye chhupa hota hai):
- Repository mein **Add file > Create new file** dabayen.
- Naam ki jagah likhein: `.github/workflows/build.yml`
- `build-workflow-copy.yml` ka poora text copy karke wahan paste karein, phir Commit.

## Step 4: App banne ka intezar
1. Repository mein **Actions** tab kholein.
2. Agar "enable workflows" ka button aaye to dabayen.
3. "Build APK" chalta dikhega (peela gol). Pehli baar 6 se 10 minute lagte hain.
4. Hara tick aa jaye to taiyar hai. Agar surkh X aaye to us par click karke error ka text ya screenshot mujhe bhej dein.

## Step 5: Phone par install
1. Phone mein Chrome kholein aur apne repository ka page kholein.
2. Dayen taraf **Releases** mein sab se nayi "Ascend build" dabayen.
3. **app-debug.apk** par tap karein, wo download hogi.
4. Download ke baad "Open" dabayen. Agar phone kahe "Install unknown apps", to **Allow from this source** on karein aur wapas aayein.
5. **Install** dabayen. Agar Play Protect kahe "unrecognised app", to **More details > Install anyway** dabayen.

## Step 6: Phone ki settings (reminders time par aane ke liye)
- App kholen, PIN banayein, notification ki ijazat mange to **Allow** karein.
- Settings > Apps > Ascend > Battery > **Unrestricted**.
- App ke andar Habits > Settings > **Send a test reminder** dabayen. 10 second baad notification aani chahiye.

## Baad mein tabdeeli
Jab main app mein kuch badlun, nayi files usi repository mein dobara upload karein (purani replace ho jayengi).
Naya release ban jayega, uski APK purani ke upar install karein. Aap ka data mehfooz rehta hai.

## Zaroori baatein
- Sara data sirf phone mein hota hai. Uninstall karne se pehle Habits > Settings se Backup text copy kar lein.
- Prayer times phone khud calculate karta hai. Pehle kuch din masjid ke time-table se milayein, farq ho to Prayers > "Adjust prayer times" mein minute barha ya ghata dein.
