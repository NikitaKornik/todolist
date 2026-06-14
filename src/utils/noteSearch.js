const FUZZY_MATCH_THRESHOLD = 0.38;

function normalizeSearchText(value) {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}

function getTrigrams(value) {
  const normalizedValue = normalizeSearchText(value);

  if (normalizedValue.length < 3) {
    return [normalizedValue].filter(Boolean);
  }

  const trigrams = [];

  for (let index = 0; index <= normalizedValue.length - 3; index += 1) {
    trigrams.push(normalizedValue.slice(index, index + 3));
  }

  return trigrams;
}

function getSimilarity(firstValue, secondValue) {
  const firstTrigrams = new Set(getTrigrams(firstValue));
  const secondTrigrams = new Set(getTrigrams(secondValue));

  if (firstTrigrams.size === 0 || secondTrigrams.size === 0) {
    return 0;
  }

  const intersectionSize = [...firstTrigrams].filter((trigram) =>
    secondTrigrams.has(trigram)
  ).length;
  const unionSize = new Set([...firstTrigrams, ...secondTrigrams]).size;

  return intersectionSize / unionSize;
}

function getWords(value) {
  return value.match(/[\p{L}\p{N}]+/gu) || [];
}

export function findNoteSearchMatch(text, query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return null;
  }

  const normalizedText = normalizeSearchText(text);

  if (normalizedText.includes(normalizedQuery)) {
    return {
      type: "exact",
      value: query.trim(),
    };
  }

  if (normalizedQuery.length < 3) {
    return null;
  }

  const bestMatch = getWords(text).reduce(
    (currentBestMatch, word) => {
      const similarity = getSimilarity(word, normalizedQuery);

      if (similarity > currentBestMatch.similarity) {
        return {
          word,
          similarity,
        };
      }

      return currentBestMatch;
    },
    { word: "", similarity: 0 }
  );

  if (bestMatch.similarity >= FUZZY_MATCH_THRESHOLD) {
    return {
      type: "fuzzy",
      value: bestMatch.word,
    };
  }

  return null;
}
