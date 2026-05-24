export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
};

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const CATEGORY_ICONS = {
  food: '🍔', transport: '🚗', accommodation: '🏨',
  entertainment: '🎬', shopping: '🛍️', utilities: '💡', other: '📌',
};

export const GROUP_CATEGORY_ICONS = {
  trip: '✈️', home: '🏠', food: '🍕', other: '👥',
};

export const ACTION_LABELS = {
  expense_added: 'added an expense',
  expense_edited: 'edited an expense',
  expense_deleted: 'deleted an expense',
  settlement_created: 'created a settlement',
  settlement_completed: 'completed a settlement',
  member_added: 'added a member',
  member_removed: 'removed a member',
  group_created: 'created the group',
};
