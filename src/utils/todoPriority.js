export function getToDoPriority(item) {
  if (item.favorite && !item.checked) {
    return 0;
  }

  if (!item.favorite && !item.checked) {
    return 1;
  }

  if (item.favorite && item.checked) {
    return 2;
  }

  return 3;
}

export function sortToDoByPriority(toDoEntries) {
  return toDoEntries
    .map((entry, index) => ({ entry, index }))
    .sort((first, second) => {
      const priorityDiff =
        getToDoPriority(first.entry.item) - getToDoPriority(second.entry.item);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return first.index - second.index;
    })
    .map(({ entry }) => entry);
}

export function sortItemsByPriority(items) {
  return sortToDoByPriority(items.map((item) => ({ item }))).map(({ item }) => item);
}
