
export const parseMentions = (content) => {
  if (!content) return [];
  const mentionRegex = /@(\w+)/g;
  const matches = content.matchAll(mentionRegex);
  const usernames = new Set();
  for (const match of matches) {
    usernames.add(match[1]);
  }
  return Array.from(usernames);
};
