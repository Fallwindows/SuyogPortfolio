// The duel page only needs lesson ids and titles (for "Review the lesson" links), not the lessons themselves.
window.LESSONS = (window.CS_LESSONS || []).map((l) => ({ id: l.id, unit: l.unit, order: l.order, title: l.title }));
