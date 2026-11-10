# obu-site

The obu-app.com website, served by GitHub Pages from `main` (root).

| Path | What it is |
|---|---|
| `/` (`index.html`) | Holding page until the landing page (Site board export) goes live |
| `/demo/` | iPhone home-screen demo of the App v3 design (design only, no real blocking) |

## Update the demo
1. Export the App v3 board from the design canvas as HTML.
2. Replace `demo/app.html` with it and push. `demo/index.html` finds the phone screen inside the export and fills the screen with it.

## Domain
`CNAME` = obu-app.com. DNS is at Squarespace: 4 A records to GitHub Pages + `www` CNAME to `obu-app.github.io`. Email (Google Workspace MX) is separate and untouched.
