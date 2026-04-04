import { expect, test } from '@playwright/test';

async function waitForAppHydration(page: Parameters<typeof test>[0]['page']) {
	await page.waitForFunction(
		() => document.documentElement.getAttribute('data-app-hydrated') === 'true',
		{ timeout: 15000 }
	);
}

test.describe('Homepage', () => {
	test('should load homepage successfully', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Guides/);
	});

	test('should navigate to sign in page via command palette', async ({ page }) => {
		await page.goto('/');
		await waitForAppHydration(page);

		// Open command palette
		const commandPaletteBtn = page.locator('button[aria-label="Open command palette"]');
		await commandPaletteBtn.click();

		// Wait for command palette dialog to appear
		const palette = page.getByRole('dialog', { name: /command palette/i });
		await expect(palette).toBeVisible();

		// Search for a stable built-in command
		const searchInput = palette.getByRole('textbox');
		await searchInput.fill('sign in');

		// Click on the built-in sign in command (scoped to palette)
		const signInCommand = palette.getByRole('button', { name: /sign in/i }).first();
		await expect(signInCommand).toBeVisible();
		await signInCommand.click();

		await expect(page).toHaveURL('/auth/login');
	});

	test('should open command palette with keyboard shortcut', async ({ page }) => {
		await page.goto('/');
		await waitForAppHydration(page);

		const commandPaletteBtn = page.locator('button[aria-label="Open command palette"]');
		await expect(commandPaletteBtn).toBeVisible();

		// Use Ctrl+K keyboard shortcut to open command palette
		await page.keyboard.press('Control+k');

		// Command palette should be visible
		const palette = page.getByRole('dialog', { name: /command palette/i });
		await expect(palette).toBeVisible();
	});
});

test.describe('Theme System', () => {
	test('should toggle theme', async ({ page }) => {
		await page.goto('/');
		await waitForAppHydration(page);

		// Wait for the initial theme to be available before toggling
		await page.waitForFunction(() => document.documentElement.hasAttribute('data-theme'), {
			timeout: 10000
		});

		// Find theme switcher button
		const themeSwitcher = page.locator('button[aria-label*="theme" i]').first();
		await expect(themeSwitcher).toBeVisible();

		const initialTheme = await page.locator('html').getAttribute('data-theme');
		await themeSwitcher.click();

		// Wait for theme to change with extended timeout
		await page.waitForFunction(
			(initial) => document.documentElement.getAttribute('data-theme') !== initial,
			initialTheme,
			{ timeout: 15000 }
		);

		const newTheme = await page.locator('html').getAttribute('data-theme');
		expect(['light', 'dark']).toContain(newTheme);
		expect(newTheme).not.toBe(initialTheme);
	});

	test('should persist theme preference', async ({ page, context }) => {
		await page.goto('/');
		await waitForAppHydration(page);

		// Wait for the initial theme to be available before toggling
		await page.waitForFunction(() => document.documentElement.hasAttribute('data-theme'), {
			timeout: 10000
		});

		const themeSwitcher = page.locator('button[aria-label*="theme" i]').first();
		await expect(themeSwitcher).toBeVisible();

		const initialTheme = await page.locator('html').getAttribute('data-theme');

		// Click the theme switcher
		await themeSwitcher.click();

		// Wait for theme to actually change with extended timeout
		// The store subscription and DOM update can take a moment
		await page.waitForFunction(
			(initial) => document.documentElement.getAttribute('data-theme') !== initial,
			initialTheme,
			{ timeout: 15000 }
		);

		const newTheme = await page.locator('html').getAttribute('data-theme');
		expect(['light', 'dark']).toContain(newTheme);
		expect(newTheme).not.toBe(initialTheme);

		// Verify localStorage was updated
		const storedTheme = await page.evaluate(() => localStorage.getItem('theme-preference'));
		expect(storedTheme).toBe(newTheme);

		// Reload page to verify persistence
		await page.reload();
		await waitForAppHydration(page);

		// Wait for hydration to re-apply the persisted theme
		await page.waitForFunction(() => document.documentElement.hasAttribute('data-theme'), {
			timeout: 10000
		});

		const persistedTheme = await page.locator('html').getAttribute('data-theme');
		expect(persistedTheme).toBe(newTheme);
	});
});

test.describe('Authentication', () => {
	test('should show login page', async ({ page }) => {
		await page.goto('/auth/login');
		await expect(page.locator('h1')).toContainText(/welcome back/i);
	});

	test('should navigate to signup from login', async ({ page }) => {
		await page.goto('/auth/login');
		await page.click('a[href="/auth/signup"]');
		await expect(page).toHaveURL('/auth/signup');
	});

	test('should validate email format', async ({ page }) => {
		await page.goto('/auth/login');

		const emailInput = page.locator('input[type="email"]');
		const submitButton = page.locator('button[type="submit"]');

		await emailInput.fill('invalid-email');
		await submitButton.click();

		// Check for HTML5 validation state
		const validationMessage = await emailInput.evaluate(
			(el: HTMLInputElement) => el.validationMessage
		);
		expect(validationMessage).toBeTruthy();
	});
});

