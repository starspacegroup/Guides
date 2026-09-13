import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { chatHistoryStore, currentConversation, currentMessages } from '$lib/stores/chatHistory';

describe('chat history missing-record behavior', () => {
	it('returns empty derived state for a selected missing conversation', () => {
		chatHistoryStore.initializeForUser('edge-user');
		chatHistoryStore.clearAll();
		chatHistoryStore.selectConversation('missing');
		expect(chatHistoryStore.getCurrentMessages()).toEqual([]);
		expect(chatHistoryStore.getCurrentConversation()).toBeNull();
		expect(get(currentConversation)).toBeNull();
		expect(get(currentMessages)).toEqual([]);
	});

	it('leaves unrelated conversations and messages unchanged', () => {
		chatHistoryStore.clearAll();
		const conversation = chatHistoryStore.createConversation('Named');
		const message = chatHistoryStore.addMessage(conversation.id, {
			role: 'assistant',
			content: 'first'
		});
		chatHistoryStore.updateMessage('other', message.id, 'ignored');
		chatHistoryStore.updateMessage(conversation.id, 'other', 'ignored');
		chatHistoryStore.updateMessage(conversation.id, message.id, 'updated');
		chatHistoryStore.renameConversation('other', 'Ignored');
		expect(chatHistoryStore.getCurrentMessages()[0].content).toBe('updated');
	});

	it('selects the next conversation after deleting the current one', () => {
		chatHistoryStore.clearAll();
		const first = chatHistoryStore.createConversation('First');
		const second = chatHistoryStore.createConversation('Second');
		chatHistoryStore.deleteConversation(second.id);
		expect(chatHistoryStore.getCurrentConversation()?.id).toBe(first.id);
	});
});
