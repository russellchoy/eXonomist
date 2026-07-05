# Leaderboard setup (Google Sheet backend)

The leaderboards (all-time **Timed** by points, and the **Daily Challenge** by
time) are stored in a Google Sheet, exposed to the app by a small Apps Script web
app. The Next.js app talks to it through `/api/leaderboard`, which reads the
web-app URL from the `SHEET_WEBAPP_URL` env var. **Until that var is set the app
still runs** — the leaderboard pages just show "not set up yet."

## 1. Create the sheet

1. New Google Sheet (any name, e.g. "eXonomist leaderboard").
2. Create **two tabs named exactly** `timed` and `daily` (rename the default
   tab, add one more).
3. Put header rows in row 1:
   - `timed`  → `A1: name`  `B1: points`  `C1: at`
   - `daily`  → `A1: date`  `B1: name`  `C1: seconds`  `D1: at`

## 2. Add the Apps Script

**Extensions → Apps Script**, delete the stub, paste this, and **Save**:

```javascript
// eXonomist leaderboard backend.
// Tabs required: "timed" (name, points, at) and "daily" (date, name, seconds, at).

function doGet(e) {
  var board = e.parameter.board === 'daily' ? 'daily' : 'timed';
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(board);
  var out = [];
  if (sheet) {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) { // skip header
      var r = rows[i];
      if (board === 'timed') {
        if (r[0] === '' && r[1] === '') continue;
        out.push({ name: String(r[0]), points: Number(r[1]) || 0, at: Number(r[2]) || 0 });
      } else {
        var date = String(r[0]);
        if (e.parameter.date && date !== e.parameter.date) continue;
        if (r[1] === '') continue;
        out.push({ date: date, name: String(r[1]), seconds: Number(r[2]) || 0, at: Number(r[3]) || 0 });
      }
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = Date.now();
  var name = String(body.name || 'Anonymous').slice(0, 24);

  if (body.board === 'timed') {
    ss.getSheetByName('timed').appendRow([name, Number(body.points) || 0, now]);
  } else if (body.board === 'daily') {
    var d = ss.getSheetByName('daily');
    var date = String(body.date);
    // First attempt only: ignore a repeat submission for the same name + date.
    var rows = d.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === date && String(rows[i][1]) === name) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, duplicate: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    d.appendRow([date, name, Number(body.seconds) || 0, now]);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Deploy as a web app

1. **Deploy → New deployment**. Select type **Web app**.
2. **Execute as:** Me. **Who has access:** Anyone.
3. **Deploy**, authorise when prompted, and **copy the Web app URL**
   (looks like `https://script.google.com/macros/s/AKfy.../exec`).

> When you change the script later, use **Manage deployments → Edit → Deploy**
> (a "New deployment" mints a new URL).

## 4. Point the app at it

Set the env var to that URL:

- **Local:** add to `.env.local` (git-ignored):
  ```
  SHEET_WEBAPP_URL=https://script.google.com/macros/s/AKfy.../exec
  ```
- **Vercel:** Project → Settings → Environment Variables → add `SHEET_WEBAPP_URL`
  (Production + Preview), then redeploy.

That's it — `/leaderboard`, the Timed results screen, and the Daily Challenge
will start reading/writing the sheet.

## Notes / limitations

- **Names aren't verified** (no accounts) — anyone can type any name. This is
  surfaced in the UI. The server caps names at 24 chars and strips control
  characters; `/api/leaderboard` validates numbers/date format before writing.
- **Daily is one attempt per name per day**, enforced both client-side
  (localStorage lock) and server-side (the `doPost` duplicate check).
- Apps Script has generous but finite daily quotas — fine for a class game.
