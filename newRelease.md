# New Releases

How to make a new release (notes for Adam in case I forget).

- On GitHub, may want to make an issue about what is prompting the changes
- Make changes to the code
- Build with `npm run dev`
- Test by copying `main.js` into my vault plugins and restart Obsidian. Try it out. Make it work.
- Update the version #
  - Update `manifest.json` with new version #
  - Update `versions.json` with new version #
  - Update `package.json` with new version #
- Build again with `npm run dev`
- Commit and Push changes to GitHub
- Close the issue in GitHub
- On GitHub, go to Releases and click "Draft a new release"
  - Put the version # in as the "Choose tag"
  - Upload `main.js`, `manifest.json` and `styles.css` to the release.
- Release it