import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Footer from './Footer.svelte';

describe('Footer', () => {
	it('should render the footer element', () => {
		render(Footer);
		const footer = document.querySelector('footer');
		expect(footer).toBeInTheDocument();
	});

	it('should display the Guides brand', () => {
		render(Footer);
		expect(screen.getByText('Guides')).toBeInTheDocument();
	});

	it('should display the tagline', () => {
		render(Footer);
		expect(screen.getByText(/collaborative section-based guides/i)).toBeInTheDocument();
	});

	it('should have resources links section', () => {
		render(Footer);
		expect(screen.getByRole('heading', { name: /resources/i })).toBeInTheDocument();
	});

	it('should have legal links section', () => {
		render(Footer);
		expect(screen.getByRole('heading', { name: /legal/i })).toBeInTheDocument();
	});

	// The footer no longer duplicates the header nav. The brand logo still links
	// home; Home/Chat/Sign In/Sign Up are reachable from the header alone.
	it('does not repeat the site navigation in the footer', () => {
		render(Footer);
		expect(screen.queryByRole('heading', { name: /navigation/i })).toBeNull();
		for (const name of [/^home$/i, /^chat$/i, /sign in/i, /sign up/i]) {
			expect(screen.queryByRole('link', { name })).toBeNull();
		}
	});

	it('does not advertise the admin CMS in the public footer', () => {
		render(Footer);
		expect(screen.queryByRole('link', { name: /admin cms/i })).toBeNull();
	});

	it('should contain user interface section link', () => {
		render(Footer);
		const sectionLink = screen.getByRole('link', { name: /user interface/i });
		expect(sectionLink).toHaveAttribute('href', '/user-interface');
	});

	it('should contain GitHub link in resources', () => {
		render(Footer);
		const githubLinks = screen.getAllByRole('link', { name: /github/i });
		// At least one should be the text link in resources
		const resourcesLink = githubLinks.find((link) =>
			link.textContent?.toLowerCase().includes('github')
		);
		expect(resourcesLink).toHaveAttribute('href', 'https://github.com/starspacegroup/Guides');
	});

	it('should contain privacy policy link', () => {
		render(Footer);
		const privacyLink = screen.getByRole('link', { name: /privacy/i });
		expect(privacyLink).toHaveAttribute('href', '/privacy');
	});

	it('should contain terms of service link', () => {
		render(Footer);
		const termsLink = screen.getByRole('link', { name: /terms/i });
		expect(termsLink).toHaveAttribute('href', '/terms');
	});

	it('should display copyright with current year', () => {
		render(Footer);
		const currentYear = new Date().getFullYear();
		expect(screen.getByText(new RegExp(`© ${currentYear}`, 'i'))).toBeInTheDocument();
	});

	it('should display created by *Space link', () => {
		render(Footer);
		const spaceLink = screen.getByRole('link', { name: /\*space/i });
		expect(spaceLink).toHaveAttribute('href', 'https://starspace.group');
		expect(spaceLink).toHaveAttribute('target', '_blank');
		expect(spaceLink).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('should have proper accessibility structure with navigation landmark', () => {
		render(Footer);
		const nav = document.querySelector('footer nav');
		expect(nav).toBeInTheDocument();
		expect(nav).toHaveAttribute('aria-label', 'Footer navigation');
	});

	it('should have GitHub external link open in new tab', () => {
		render(Footer);
		const githubLinks = screen.getAllByRole('link', { name: /github/i });
		const resourcesLink = githubLinks.find((link) =>
			link.textContent?.toLowerCase().includes('github')
		);
		expect(resourcesLink).toHaveAttribute('target', '_blank');
		expect(resourcesLink).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('should render Cloudflare badge', () => {
		render(Footer);
		expect(screen.getByText('Powered by Cloudflare')).toBeInTheDocument();
	});
});

