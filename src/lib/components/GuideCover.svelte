<!--
  GuideCover

  The picture on a guide card. Draws a motif for the guide's topic so a reader
  can tell a theming guide from a testing guide before reading a word of it.

  Every motif is inline SVG on one 320x140 canvas. Colours come from two custom
  properties so the art follows the theme: `--accent` (the topic hue, set by the
  caller) and the neutral ink mixed from `--color-text` below. The theming motif
  is the deliberate exception — it draws a fixed light half and dark half,
  because that contrast IS the subject.
-->
<script lang="ts">
	import type { GuideTopicId } from '$lib/cms/guideVisuals';

	export let topic: GuideTopicId = 'general';
	/** An author-supplied image always wins over the generated motif. */
	export let image: string | null = null;
	export let alt = '';
</script>

<div class="cover" class:has-image={Boolean(image)}>
	{#if image}
		<img src={image} {alt} loading="lazy" />
	{:else}
		<svg viewBox="0 0 320 140" role="presentation" aria-hidden="true">
			{#if topic === 'command-palette'}
				<rect x="56" y="24" width="208" height="94" rx="14" class="panel" />
				<rect x="72" y="38" width="176" height="22" rx="7" fill="var(--accent)" opacity="0.16" />
				<circle cx="86" cy="49" r="5.5" fill="none" stroke="var(--accent)" stroke-width="2.5" />
				<line
					x1="90"
					y1="53"
					x2="94"
					y2="57"
					stroke="var(--accent)"
					stroke-width="2.5"
					stroke-linecap="round"
				/>
				<rect x="104" y="46" width="52" height="6" rx="3" fill="var(--accent)" opacity="0.5" />
				<rect x="72" y="68" width="176" height="16" rx="5" fill="var(--accent)" opacity="0.3" />
				<rect x="80" y="72" width="8" height="8" rx="2" fill="var(--accent)" />
				<rect x="96" y="73" width="86" height="6" rx="3" fill="var(--accent)" opacity="0.75" />
				<rect x="72" y="90" width="176" height="16" rx="5" class="row" />
				<rect x="80" y="94" width="8" height="8" rx="2" class="ink-soft" />
				<rect x="96" y="95" width="68" height="6" rx="3" class="line" />
			{:else if topic === 'keyboard'}
				<rect x="60" y="34" width="54" height="54" rx="12" class="panel" />
				<rect x="126" y="34" width="54" height="54" rx="12" class="panel" />
				<rect x="192" y="34" width="54" height="54" rx="12" fill="var(--accent)" />
				<path
					d="M75 68 L87 54 L99 68"
					fill="none"
					class="ink-stroke"
					stroke-width="5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<rect x="141" y="57" width="24" height="6" rx="3" class="ink-soft" />
				<path
					d="M231 50 v10 a4 4 0 0 1 -4 4 h-20"
					fill="none"
					stroke="var(--on-accent)"
					stroke-width="5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M214 57 L206 64 L214 71"
					fill="none"
					stroke="var(--on-accent)"
					stroke-width="5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<rect x="60" y="98" width="186" height="16" rx="7" class="panel" />
			{:else if topic === 'tokens'}
				{#each [0, 1, 2, 3, 4] as step}
					<rect
						x="62"
						y={24 + step * 20}
						width="62"
						height="16"
						rx="5"
						fill="var(--accent)"
						opacity={1 - step * 0.19}
					/>
					<rect
						x="138"
						y={28 + step * 20}
						width="10"
						height="7"
						rx="2"
						fill="var(--accent)"
						opacity="0.65"
					/>
					<rect x="154" y={28 + step * 20} width={92 - step * 13} height="7" rx="3" class="line" />
				{/each}
			{:else if topic === 'theming'}
				<rect x="56" y="26" width="104" height="88" rx="16" fill="#eef2f7" />
				<rect x="128" y="26" width="32" height="88" fill="#eef2f7" />
				<rect x="160" y="26" width="104" height="88" rx="16" fill="#101828" />
				<rect x="160" y="26" width="32" height="88" fill="#101828" />
				<circle cx="108" cy="70" r="17" fill="#f59e0b" />
				{#each [0, 45, 90, 135, 180, 225, 270, 315] as angle}
					<line
						x1={108 + 24 * Math.cos((angle * Math.PI) / 180)}
						y1={70 + 24 * Math.sin((angle * Math.PI) / 180)}
						x2={108 + 31 * Math.cos((angle * Math.PI) / 180)}
						y2={70 + 31 * Math.sin((angle * Math.PI) / 180)}
						stroke="#f59e0b"
						stroke-width="4"
						stroke-linecap="round"
					/>
				{/each}
				<circle cx="216" cy="70" r="20" fill="#e8edf7" />
				<circle cx="206" cy="62" r="17" fill="#101828" />
				<circle cx="240" cy="42" r="2.5" fill="#e8edf7" />
				<circle cx="250" cy="88" r="2" fill="#e8edf7" />
				<circle cx="228" cy="102" r="2.5" fill="#e8edf7" />
			{:else if topic === 'accessibility'}
				<rect
					x="104"
					y="30"
					width="112"
					height="80"
					rx="22"
					fill="none"
					stroke="var(--accent)"
					stroke-width="3"
					opacity="0.18"
				/>
				<rect
					x="114"
					y="38"
					width="92"
					height="64"
					rx="17"
					fill="none"
					stroke="var(--accent)"
					stroke-width="4"
					opacity="0.4"
				/>
				<rect
					x="124"
					y="46"
					width="72"
					height="48"
					rx="12"
					fill="none"
					stroke="var(--accent)"
					stroke-width="6"
				/>
				<rect x="136" y="56" width="48" height="28" rx="7" class="panel" />
				<rect x="146" y="66" width="28" height="8" rx="4" class="ink-soft" />
			{:else if topic === 'testing'}
				<rect x="72" y="24" width="176" height="22" rx="7" class="panel" />
				<path
					d="M88 35 l5 6 l11 -13"
					fill="none"
					stroke="var(--accent)"
					stroke-width="4.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<rect x="116" y="31" width="112" height="7" rx="3.5" class="line" />
				<rect x="72" y="54" width="176" height="22" rx="7" class="panel" />
				<path
					d="M88 65 l5 6 l11 -13"
					fill="none"
					stroke="var(--accent)"
					stroke-width="4.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<rect x="116" y="61" width="84" height="7" rx="3.5" class="line" />
				<rect x="72" y="84" width="176" height="22" rx="7" class="panel" />
				<path
					d="M87 89 l13 12 M100 89 l-13 12"
					fill="none"
					class="ink-stroke"
					stroke-width="4.5"
					stroke-linecap="round"
					opacity="0.55"
				/>
				<rect x="116" y="91" width="64" height="7" rx="3.5" class="line" />
				<rect x="72" y="116" width="176" height="8" rx="4" class="line" />
				<rect x="72" y="116" width="118" height="8" rx="4" fill="var(--accent)" />
			{:else if topic === 'checklist'}
				<rect x="94" y="22" width="132" height="106" rx="14" class="panel" />
				<rect x="136" y="12" width="48" height="20" rx="9" fill="var(--accent)" />
				{#each [0, 1, 2, 3] as row}
					<rect
						x="110"
						y={48 + row * 20}
						width="13"
						height="13"
						rx="4"
						fill={row < 3 ? 'var(--accent)' : 'none'}
						stroke="var(--accent)"
						stroke-width="2.5"
						opacity={row < 3 ? 1 : 0.5}
					/>
					{#if row < 3}
						<path
							d="M{113} {54 + row * 20} l3 3.5 l5 -6"
							fill="none"
							stroke="var(--on-accent)"
							stroke-width="2.6"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					{/if}
					<rect x="132" y={52 + row * 20} width={74 - row * 8} height="6" rx="3" class="line" />
				{/each}
			{:else if topic === 'security'}
				<path
					d="M160 20 L216 42 V76 C216 100 191 116 160 124 C129 116 104 100 104 76 V42 Z"
					fill="var(--accent)"
					opacity="0.16"
				/>
				<path
					d="M160 20 L216 42 V76 C216 100 191 116 160 124 C129 116 104 100 104 76 V42 Z"
					fill="none"
					stroke="var(--accent)"
					stroke-width="6"
					stroke-linejoin="round"
				/>
				<circle cx="160" cy="66" r="10" fill="var(--accent)" />
				<path d="M153 74 h14 l3 22 h-20 Z" fill="var(--accent)" />
			{:else if topic === 'performance'}
				<path
					d="M88 106 A72 72 0 0 1 232 106"
					fill="none"
					class="line-stroke"
					stroke-width="13"
					stroke-linecap="round"
				/>
				<path
					d="M88 106 A72 72 0 0 1 196 42"
					fill="none"
					stroke="var(--accent)"
					stroke-width="13"
					stroke-linecap="round"
				/>
				<line
					x1="160"
					y1="106"
					x2="185"
					y2="62"
					class="ink-stroke"
					stroke-width="7"
					stroke-linecap="round"
				/>
				<circle cx="160" cy="106" r="9" class="ink-fill" />
				<rect x="128" y="122" width="64" height="7" rx="3.5" class="line" />
			{:else if topic === 'data'}
				<rect x="60" y="24" width="200" height="92" rx="12" class="panel" />
				<path
					d="M60 36 a12 12 0 0 1 12 -12 h176 a12 12 0 0 1 12 12 v14 H60 Z"
					fill="var(--accent)"
					opacity="0.32"
				/>
				<path d="M232 32 l6 -8 l6 8 Z" fill="var(--accent)" />
				<path d="M232 42 l6 8 l6 -8 Z" fill="var(--accent)" opacity="0.35" />
				<rect x="74" y="34" width="40" height="6" rx="3" fill="var(--accent)" opacity="0.85" />
				<rect x="142" y="34" width="34" height="6" rx="3" fill="var(--accent)" opacity="0.85" />
				<line x1="128" y1="24" x2="128" y2="116" class="line-stroke" stroke-width="2" />
				<line x1="196" y1="24" x2="196" y2="116" class="line-stroke" stroke-width="2" />
				{#each [0, 1, 2] as row}
					<line
						x1="60"
						y1={72 + row * 22}
						x2="260"
						y2={72 + row * 22}
						class="line-stroke"
						stroke-width="2"
					/>
					<rect x="74" y={58 + row * 22} width="38" height="6" rx="3" class="line" />
					<rect x="142" y={58 + row * 22} width="30" height="6" rx="3" class="line" />
					<rect x="210" y={58 + row * 22} width="26" height="6" rx="3" class="line" />
				{/each}
			{:else if topic === 'forms'}
				<rect x="70" y="18" width="42" height="7" rx="3.5" class="line" />
				<rect x="70" y="30" width="180" height="28" rx="9" class="panel" />
				<rect x="84" y="40" width="76" height="7" rx="3.5" class="line" />
				<rect x="70" y="66" width="52" height="7" rx="3.5" fill="var(--accent)" opacity="0.7" />
				<rect
					x="70"
					y="78"
					width="180"
					height="28"
					rx="9"
					class="panel"
					stroke="var(--accent)"
					stroke-width="3"
				/>
				<line
					x1="86"
					y1="86"
					x2="86"
					y2="98"
					stroke="var(--accent)"
					stroke-width="3.5"
					stroke-linecap="round"
				/>
				<rect x="96" y="88" width="58" height="7" rx="3.5" class="line" />
				<rect x="180" y="110" width="70" height="20" rx="8" fill="var(--accent)" />
			{:else if topic === 'feedback'}
				<rect x="60" y="36" width="184" height="54" rx="14" class="panel" />
				<circle cx="88" cy="63" r="13" fill="var(--accent)" />
				<path
					d="M84 63 l3 4 l6 -8"
					fill="none"
					stroke="var(--on-accent)"
					stroke-width="2.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<rect x="112" y="52" width="104" height="8" rx="4" class="ink-soft" />
				<rect x="112" y="68" width="70" height="7" rx="3.5" class="line" />
				<path d="M76 90 l0 16 l18 -16 Z" class="panel-fill" />
				<circle cx="244" cy="40" r="17" fill="var(--accent)" />
				<rect x="236" y="36" width="16" height="7" rx="3.5" fill="var(--on-accent)" />
			{:else if topic === 'navigation'}
				<line
					x1="76"
					y1="64"
					x2="244"
					y2="64"
					class="line-stroke"
					stroke-width="4"
					stroke-linecap="round"
				/>
				<circle cx="76" cy="64" r="11" class="ink-soft" />
				<circle cx="160" cy="64" r="13" class="ink-soft" />
				<circle cx="244" cy="64" r="17" fill="var(--accent)" />
				<circle cx="244" cy="64" r="6" fill="var(--on-accent)" />
				<path
					d="M112 56 l9 8 l-9 8"
					fill="none"
					class="ink-stroke"
					stroke-width="4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<path
					d="M198 56 l9 8 l-9 8"
					fill="none"
					class="ink-stroke"
					stroke-width="4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<rect x="58" y="94" width="36" height="7" rx="3.5" class="line" />
				<rect x="140" y="94" width="40" height="7" rx="3.5" class="line" />
				<rect x="220" y="94" width="48" height="7" rx="3.5" fill="var(--accent)" opacity="0.8" />
			{:else if topic === 'layout'}
				<rect x="48" y="28" width="126" height="86" rx="10" class="panel" />
				<rect x="60" y="40" width="102" height="14" rx="5" class="ink-soft" />
				<rect x="60" y="62" width="46" height="40" rx="6" class="line" />
				<rect x="116" y="62" width="46" height="40" rx="6" class="line" />
				<rect x="186" y="40" width="58" height="74" rx="9" class="panel" />
				<rect x="196" y="50" width="38" height="10" rx="4" class="ink-soft" />
				<rect x="196" y="66" width="38" height="38" rx="6" class="line" />
				<rect
					x="254"
					y="56"
					width="34"
					height="58"
					rx="8"
					class="panel"
					stroke="var(--accent)"
					stroke-width="3"
				/>
				<rect x="262" y="64" width="18" height="8" rx="3" fill="var(--accent)" opacity="0.7" />
				<rect x="262" y="78" width="18" height="26" rx="5" fill="var(--accent)" opacity="0.28" />
			{:else if topic === 'deployment'}
				<g fill="var(--accent)" opacity="0.26">
					<circle cx="126" cy="76" r="26" />
					<circle cx="162" cy="66" r="33" />
					<circle cx="196" cy="80" r="22" />
					<rect x="126" y="80" width="70" height="22" rx="11" />
				</g>
				<line
					x1="161"
					y1="102"
					x2="161"
					y2="46"
					stroke="var(--accent)"
					stroke-width="9"
					stroke-linecap="round"
				/>
				<path
					d="M144 60 L161 42 L178 60"
					fill="none"
					stroke="var(--accent)"
					stroke-width="9"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<line
					x1="112"
					y1="122"
					x2="208"
					y2="122"
					class="line-stroke"
					stroke-width="3"
					stroke-linecap="round"
				/>
				<circle cx="112" cy="122" r="6" class="line" />
				<circle cx="160" cy="122" r="6" class="line" />
				<circle cx="208" cy="122" r="6" fill="var(--accent)" />
			{:else if topic === 'content'}
				<rect x="92" y="18" width="136" height="108" rx="13" class="panel" />
				<g stroke="var(--accent)" stroke-width="4.5" stroke-linecap="round">
					<line x1="115" y1="34" x2="111" y2="56" />
					<line x1="128" y1="34" x2="124" y2="56" />
					<line x1="106" y1="41" x2="132" y2="41" />
					<line x1="104" y1="49" x2="130" y2="49" />
				</g>
				<rect x="144" y="36" width="66" height="12" rx="6" fill="var(--accent)" opacity="0.45" />
				<rect x="110" y="70" width="100" height="7" rx="3.5" class="line" />
				<rect x="110" y="86" width="100" height="7" rx="3.5" class="line" />
				<rect x="110" y="102" width="62" height="7" rx="3.5" class="line" />
			{:else if topic === 'ai'}
				<g class="line-stroke" stroke-width="3.5" stroke-linecap="round">
					<line x1="160" y1="72" x2="102" y2="44" />
					<line x1="160" y1="72" x2="220" y2="46" />
					<line x1="160" y1="72" x2="110" y2="108" />
					<line x1="160" y1="72" x2="214" y2="106" />
				</g>
				<circle cx="102" cy="44" r="10" class="ink-soft" />
				<circle cx="220" cy="46" r="10" class="ink-soft" />
				<circle cx="110" cy="108" r="10" class="ink-soft" />
				<circle cx="214" cy="106" r="10" class="ink-soft" />
				<circle cx="160" cy="72" r="20" fill="var(--accent)" />
				<path
					d="M252 18 C255 30 258 33 270 36 C258 39 255 42 252 54 C249 42 246 39 234 36 C246 33 249 30 252 18 Z"
					fill="var(--accent)"
					opacity="0.75"
				/>
			{:else}
				<path
					d="M226 20 C239 47 239 47 266 60 C239 73 239 73 226 100 C213 73 213 73 186 60 C213 47 213 47 226 20 Z"
					fill="var(--accent)"
				/>
				<line
					x1="70"
					y1="116"
					x2="112"
					y2="98"
					stroke="var(--accent)"
					stroke-width="8"
					stroke-linecap="round"
					opacity="0.55"
				/>
				<line
					x1="112"
					y1="98"
					x2="150"
					y2="70"
					stroke="var(--accent)"
					stroke-width="8"
					stroke-linecap="round"
					opacity="0.8"
				/>
				<circle cx="70" cy="116" r="10" fill="var(--accent)" opacity="0.55" />
				<circle cx="112" cy="98" r="11" fill="var(--accent)" opacity="0.75" />
				<circle cx="150" cy="70" r="12" fill="var(--accent)" />
				<path
					d="M96 40 C98 49 100 51 109 53 C100 55 98 57 96 66 C94 57 92 55 83 53 C92 51 94 49 96 40 Z"
					fill="var(--accent)"
					opacity="0.6"
				/>
			{/if}
		</svg>
	{/if}
</div>

<style>
	.cover {
		position: relative;
		aspect-ratio: 320 / 140;
		overflow: hidden;
		display: block;
		/* The tinted field the motif sits on. */
		background:
			radial-gradient(
				circle at 72% 18%,
				color-mix(in srgb, var(--accent) 24%, transparent),
				transparent 62%
			),
			linear-gradient(
				150deg,
				color-mix(in srgb, var(--accent) 13%, var(--color-surface)) 0%,
				color-mix(in srgb, var(--accent) 4%, var(--color-background)) 100%
			);
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 22%, var(--color-border));
	}

	.cover.has-image {
		background: var(--color-surface);
	}

	.cover img,
	.cover svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.cover img {
		object-fit: cover;
	}

	/*
	  Neutral parts of every motif. Mixed from the text colour rather than
	  hard-coded, so the same drawing reads on a white page and a black one.
	*/
	svg {
		--cover-ink: color-mix(in srgb, var(--color-text) 58%, transparent);
		--cover-line: color-mix(in srgb, var(--color-text) 24%, transparent);
		--cover-panel: color-mix(in srgb, var(--color-text) 7%, transparent);
		--cover-panel-border: color-mix(in srgb, var(--color-text) 16%, transparent);
	}

	.panel {
		fill: var(--cover-panel);
		stroke: var(--cover-panel-border);
		stroke-width: 2;
	}

	.panel-fill {
		fill: var(--cover-panel);
	}

	.row {
		fill: var(--cover-panel);
	}

	.line {
		fill: var(--cover-line);
	}

	.line-stroke {
		stroke: var(--cover-line);
		fill: none;
	}

	.ink-soft {
		fill: var(--cover-ink);
		opacity: 0.55;
	}

	.ink-fill {
		fill: var(--cover-ink);
	}

	.ink-stroke {
		stroke: var(--cover-ink);
		fill: none;
	}
</style>
