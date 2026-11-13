---
title: Small Local Models Inside a Feature
excerpt: A small local model is cheap and private, and it loses count and copies its input. Gate when it runs, keep batches small, and check its output in code.
difficulty: intermediate
tags: AI, Local Models, Reliability
---

## Rule

A local model call is guarded by a cheap check before it runs and by validation after it returns. It never runs on a timer with nothing to do.

## Why

A feature translated song lyrics with a small model on the user's machine. Three lessons came from running it.

- It was called every seven seconds for a whole morning, in an empty room, because nothing checked whether there was anything new to translate.
- Given 40 lines, it returned 39. Every translation after the gap sat beside the wrong original. A missing translation is a blank. An off-by-one is a wrong answer on every line.
- Given a chorus that repeated, it copied the input line back as the "translation".

## Must

- Run a cheap check first. If the text is already in the target language, or nothing has changed, do not call the model.
- Trigger on an event, such as new content. Do not trigger on a clock.
- Send small batches. Twenty lines for each request was the limit that held for a model of about three billion parameters.
- Number the lines in the request, and require the same numbers back. Reject a response whose count differs.
- Send each distinct line once, and map the result back to the repeats in code.
- Reject an echo. If more than half of the output is the same as the input, treat the call as failed.
- Keep the user's data on the machine. A feature that is sold as local must not fall back to a cloud API without saying so.

## Pattern

```ts
const BATCH = 20;

async function translateLines(lines: string[]): Promise<Map<string, string>> {
	const distinct = [...new Set(lines.filter((line) => line.trim()))];
	const result = new Map<string, string>();

	for (let start = 0; start < distinct.length; start += BATCH) {
		const batch = distinct.slice(start, start + BATCH);
		const prompt = batch
			.map((line, index) => `${index + 1}. ${line}`)
			.join(String.fromCharCode(10));
		const output = parseNumbered(await callLocalModel(prompt));

		if (output.length !== batch.length) continue; // lost count: skip, do not misalign
		const echoed = output.filter((text, index) => text === batch[index]).length;
		if (echoed > batch.length / 2) continue; // copied the input back

		batch.forEach((line, index) => result.set(line, output[index]));
	}
	return result;
}
```

A skipped batch leaves blanks. That is the honest result.

## Should

- Cache results by content hash, so the same text is never translated twice.
- Check what loading a model pushes out of memory. A larger model can unload one that another feature needs.
- Set a timeout on each call, and stop after a few failures in a row.
- Write a test for each prompt sentence that prevents a known failure. Two sentences in one prompt were holding up the whole feature, and they looked like clutter to anyone tidying it.
- Measure on your own data before you change models. A public leaderboard order did not survive the developer's own audio.

## Gotchas

- Some models put the answer in a reasoning field and leave the content empty. Check where the text is.
- A model that is listed is not always callable. Probe it after any catalogue change.
- Strip thinking blocks before you parse the output.
- Private content, such as mail bodies, must not go to a third-party endpoint because it was the fallback.

## Validation checklist

- With no new content, the model is not called for an hour.
- A response with a missing line leaves that batch blank, and other batches stay aligned.
- A response that echoes the input is discarded.
- With the network off, the feature still works.
