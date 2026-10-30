// ===========================================
// Export Routes — iCalendar (.ics) & PDF Brief
// ===========================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import { eventService } from '../services/eventService.js';
import { planningService } from '../services/planningService.js';
import { parseResourceId } from '../utils/resourceId.js';
import { requireEventOwnership } from '../middleware/eventOwnership.js';
import { ownerId } from '../middleware/auth.js';
import { notFound } from '../middleware/errorHandler.js';

const router = Router();
router.use('/events/:eventId', requireEventOwnership);

/**
 * Formats a Date object into iCalendar UTC timestamp format: YYYYMMDDTHHMMSSZ
 */
function toIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into iCalendar DATE or DATETIME format.
 */
function toIcsDate(dateStr: string): string {
  const clean = dateStr.slice(0, 10).replace(/-/g, '');
  return clean;
}

/**
 * Sanitizes a string for iCalendar text values (escapes commas, semicolons, backslashes).
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant iCalendar string for all timeline items and the main event.
 */
function buildIcsCalendar(
  event: { id: string; title: string; description: string | null; date: string | null; location: string | null },
  timelineItems: Array<{ id: string; title: string; description: string | null; due_date: string | null; status: string }>,
): string {
  const stamp = toIcsTimestamp(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventCraft AI//Planning Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(event.title)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  // Main Event day item
  if (event.date) {
    const dt = toIcsDate(event.date);
    lines.push(
      'BEGIN:VEVENT',
      `UID:main-event-${event.id}@eventcraft.ai`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:🎉 ${escapeIcsText(event.title)} (Event Day)`,
      `DESCRIPTION:${escapeIcsText(event.description ?? 'Event day scheduled via EventCraft AI')}`,
      ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
      'STATUS:CONFIRMED',
      'END:VEVENT',
    );
  }

  // Milestones & tasks
  for (const item of timelineItems) {
    const dueDate = item.due_date ? toIcsDate(item.due_date) : (event.date ? toIcsDate(event.date) : toIcsDate(new Date().toISOString()));
    const statusMap: Record<string, string> = {
      completed: 'COMPLETED',
      in_progress: 'IN-PROCESS',
      pending: 'NEEDS-ACTION',
    };
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.id}@eventcraft.ai`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dueDate}`,
      `SUMMARY:${escapeIcsText(item.title)}`,
      `DESCRIPTION:${escapeIcsText(item.description ?? 'Milestone planned in EventCraft AI')}`,
      `STATUS:${statusMap[item.status] ?? 'NEEDS-ACTION'}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Escapes characters for PDF literal strings.
 */
function escapePdfText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generates a valid minimal PDF 1.4 document containing the event summary, budget table, and milestones.
 */
function buildPdfDocument(data: {
  eventTitle: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  currency: string;
  totalBudget: string;
  budgetItems: Array<{ category: string; name: string; estimated: string; actual: string }>;
  milestones: Array<{ title: string; due: string; status: string }>;
  vendors: Array<{ category: string; name: string; status: string }>;
}): Buffer {
  // Construct content stream with PDF text commands
  const contentLines: string[] = [
    'BT',
    '/F1 20 Tf',
    '50 740 Td',
    `(${escapePdfText(`EventCraft AI — ${data.eventTitle}`)}) Tj`,
    '/F1 10 Tf',
    '0 -24 Td',
    `(${escapePdfText(`Type: ${data.eventType.toUpperCase()}   |   Date: ${data.eventDate}   |   Attendees: ${data.guestCount}   |   Currency: ${data.currency}`)}) Tj`,
    '0 -16 Td',
    `(${escapePdfText(`Total Target Budget: ${data.totalBudget} ${data.currency}   |   Generated: ${new Date().toLocaleDateString()}`)}) Tj`,
    '0 -30 Td',
    '/F1 14 Tf',
    '(1. Budget & Expense Allocation) Tj',
    '/F1 10 Tf',
    '0 -18 Td',
    '(Category                  Item Name                     Estimated         Actual) Tj',
    '0 -12 Td',
    '(--------------------------------------------------------------------------------) Tj',
  ];

  // Add top budget items
  for (const item of data.budgetItems.slice(0, 15)) {
    const cat = item.category.padEnd(25).slice(0, 25);
    const nm = item.name.padEnd(30).slice(0, 30);
    const est = item.estimated.padStart(12);
    const act = item.actual.padStart(12);
    contentLines.push('0 -14 Td');
    contentLines.push(`(${escapePdfText(`${cat} ${nm} ${est} ${act}`)}) Tj`);
  }

  // Add timeline section
  contentLines.push('0 -26 Td');
  contentLines.push('/F1 14 Tf');
  contentLines.push('(2. Key Milestones & Timeline) Tj');
  contentLines.push('/F1 10 Tf');
  contentLines.push('0 -18 Td');
  contentLines.push('(Due Date       Status        Milestone Title) Tj');
  contentLines.push('0 -12 Td');
  contentLines.push('(--------------------------------------------------------------------------------) Tj');

  for (const m of data.milestones.slice(0, 12)) {
    const due = m.due.padEnd(14).slice(0, 14);
    const stat = m.status.toUpperCase().padEnd(13).slice(0, 13);
    const title = m.title.slice(0, 50);
    contentLines.push('0 -14 Td');
    contentLines.push(`(${escapePdfText(`${due} ${stat} ${title}`)}) Tj`);
  }

  // Add vendor section
  contentLines.push('0 -26 Td');
  contentLines.push('/F1 14 Tf');
  contentLines.push('(3. Vendor Checklist) Tj');
  contentLines.push('/F1 10 Tf');
  contentLines.push('0 -18 Td');
  contentLines.push('(Category                  Vendor Name                   Status) Tj');
  contentLines.push('0 -12 Td');
  contentLines.push('(--------------------------------------------------------------------------------) Tj');

  for (const v of data.vendors.slice(0, 10)) {
    const cat = v.category.padEnd(25).slice(0, 25);
    const nm = v.name.padEnd(30).slice(0, 30);
    const stat = v.status.toUpperCase();
    contentLines.push('0 -14 Td');
    contentLines.push(`(${escapePdfText(`${cat} ${nm} ${stat}`)}) Tj`);
  }

  contentLines.push('ET');

  const streamContent = contentLines.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  // Build standard PDF 1.4 structure
  const objects = [
    // Obj 1: Catalog
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    // Obj 2: Pages
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    // Obj 3: Page
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    // Obj 4: Font Helvetica
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    // Obj 5: Stream
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  const header = '%PDF-1.4\n';
  const offset = header.length;
  const xrefEntries: string[] = ['0000000000 65535 f \n'];

  let body = '';
  for (const obj of objects) {
    const objOffset = offset + Buffer.byteLength(body, 'utf-8');
    xrefEntries.push(`${String(objOffset).padStart(10, '0')} 00000 n \n`);
    body += obj;
  }

  const startXref = offset + Buffer.byteLength(body, 'utf-8');
  const xref = `xref\n0 ${objects.length + 1}\n${xrefEntries.join('')}`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(header + body + xref + trailer, 'utf-8');
}

/**
 * GET /api/events/:eventId/export/ics — Download RFC 5545 iCalendar schedule
 */
router.get('/events/:eventId/export/ics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseResourceId(String(req.params['eventId']));
    const event = await eventService.getById(eventId, ownerId(req));
    if (!event) throw notFound('Event', eventId);

    const timelineItems = await planningService.listTimelineItems(eventId);
    const icsContent = buildIcsCalendar(event, timelineItems);

    const safeTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="eventcraft-${safeTitle}.ics"`);
    res.status(200).send(icsContent);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/events/:eventId/export/pdf — Download PDF executive planning brief
 */
router.get('/events/:eventId/export/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = parseResourceId(String(req.params['eventId']));
    const event = await eventService.getById(eventId, ownerId(req));
    if (!event) throw notFound('Event', eventId);

    const [budgetItems, timelineItems, vendors] = await Promise.all([
      planningService.listBudgetItems(eventId),
      planningService.listTimelineItems(eventId),
      planningService.listVendors(eventId),
    ]);

    const pdfBuffer = buildPdfDocument({
      eventTitle: event.title,
      eventType: event.type,
      eventDate: event.date ? new Date(event.date).toLocaleDateString() : 'TBD',
      guestCount: event.guest_count ? String(event.guest_count) : 'N/A',
      currency: event.currency ?? 'USD',
      totalBudget: event.budget_amount ? event.budget_amount.toLocaleString() : '0',
      budgetItems: budgetItems.map((item) => ({
        category: item.category,
        name: item.name,
        estimated: `$${item.estimated_cost.toFixed(2)}`,
        actual: item.actual_cost != null ? `$${item.actual_cost.toFixed(2)}` : '-',
      })),
      milestones: timelineItems.map((item) => ({
        title: item.title,
        due: item.due_date ? item.due_date.slice(0, 10) : 'TBD',
        status: item.status,
      })),
      vendors: vendors.map((vendor) => ({
        category: vendor.category,
        name: vendor.name,
        status: vendor.status.replace('_', ' '),
      })),
    });

    const safeTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="eventcraft-${safeTitle}-brief.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
