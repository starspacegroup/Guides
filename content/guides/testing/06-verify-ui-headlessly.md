---
title: Verify UI Headlessly, in Both Themes and Two Widths
excerpt: Check a screen with a headless browser that takes screenshots at phone and desktop width in light and dark, and collects every console error on the way.
difficulty: intermediate
tags: Testing, Playwright, Responsive, Theming
---

## Rule

A UI change is verified by a script: headless browser, throwaway data, four screenshots for each screen (390px and 1440px wide, light and dark), and a list of page errors that must be empty.

## Why

"It looks fine on my screen" covers one width and one theme. The faults that reach users are in the other three combinations: text that overflows at phone width, a border that vanishes in dark mode, a dialog that cannot be closed on a small screen.

A script also keeps the check off the developer's own display. A coding agent that opens a visible browser window to check its work takes focus from the person at the keyboard. Headless runs need no window at all.

## Must

- Launch the browser headless.
- Use a temporary data directory, and never the real one.
- Capture each main screen at 390 and 1440 pixels wide, in each theme.
- Collect `pageerror` and console errors, and fail on any.
- Give the app deterministic content for the run, such as a `?demo` mode or seeded data.
- Look at the screenshots. A script that saves images nobody opens is not a check.

## Pattern

```ts
import { chromium } from 'playwright';

const errors: string[] = [];
const browser = await chromium.launch({
	headless: true,
	args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--mute-audio']
});

for (const width of [390, 1440]) {
	for (const colorScheme of ['light', 'dark'] as const) {
		const context = await browser.newContext({
			viewport: { width, height: width === 390 ? 844 : 900 },
			colorScheme
		});
		const page = await context.newPage();
		page.on('pageerror', (error) => errors.push(`${width}/${colorScheme}: ${error.message}`));
		page.on('console', (message) => {
			if (message.type() === 'error') errors.push(`${width}/${colorScheme}: ${message.text()}`);
		});

		await page.goto(`${BASE_URL}/?demo`);
		await page.screenshot({ path: `shots/home-${width}-${colorScheme}.png`, fullPage: true });
		await context.close();
	}
}

await browser.close();
if (errors.length) throw new Error(errors.join('; '));
```

The fake media flags let a page that asks for a microphone or camera run with no prompt and no real device.

## Should

- If the app picks its theme from a `data-theme` attribute and not from the system setting, set the attribute in the script. `colorScheme` alone will not switch it.
- Draw mockups at the same four sizes before you build, and compare the screenshots with them.
- Assert a few facts in code as well: no horizontal scroll at 390px, and the main heading is visible.
- Keep the script in the repository, with a `shots` command.
- For visuals that need a real GPU, run with the GPU on and say so. Software rendering can differ.

## Gotchas

- A full-page screenshot hides sticky-header and viewport-height faults. Take one viewport-sized shot too.
- Fonts that load late change the layout after the screenshot. Wait for `document.fonts.ready`.
- Animations make screenshots differ from run to run. Turn on reduced motion in the context.
- A `?demo` mode reached through a public tunnel shows sample data to the world. Gate it to dev builds.

## Validation checklist

- The script produces four images for each screen and exits non-zero on any page error.
- No image shows horizontal overflow at 390px.
- Text and borders are visible in both themes.
- No browser window appeared while the script ran.
