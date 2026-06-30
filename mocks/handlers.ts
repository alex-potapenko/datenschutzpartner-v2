import { http, HttpResponse } from 'msw';
import type { Contact, ContactCreate } from '@/api/contacts';
import { createCollection } from './db';

/**
 * Mock API — this is the draft API contract the prototype designs.
 * Keep handlers in sync with the zod schemas in api/. At handover the
 * backend implements this contract and these handlers are deleted.
 *
 * Data is stored via createCollection, so edits survive page reloads in
 * the browser (localStorage) but reset between tests (in-memory in node).
 */
const contacts = createCollection<Contact>('contacts', [
  { id: '1', name: 'Anna Keller', email: 'anna.keller@example.ch', company: 'Helvetia AG' },
  { id: '2', name: 'Luca Bernasconi', email: 'luca.bernasconi@example.ch', company: 'Ticino SA' },
]);

export const handlers = [
  http.get('/api/contacts', () => HttpResponse.json(contacts.all())),

  http.post('/api/contacts', async ({ request }) => {
    const input = (await request.json()) as ContactCreate;
    return HttpResponse.json(contacts.create(input), { status: 201 });
  }),

  http.delete('/api/contacts/:id', ({ params }) => {
    const removed = contacts.remove(String(params.id));
    return new HttpResponse(null, { status: removed ? 204 : 404 });
  }),
];
