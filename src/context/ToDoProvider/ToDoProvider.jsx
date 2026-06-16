import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { getDateInputValue, parseInputDate } from "../../utils/calendar";

export const ToDoContext = createContext(null);
export const FunctionToDoContext = createContext(null);
export const InputToDoContext = createContext(null);
export const ThemesToDoContext = createContext(null);
export const CategoryToDoContext = createContext(null);
export const ElementsToDoContext = createContext(null);
export const SettingsToDoContext = createContext(null);
export const AuthToDoContext = createContext(null);

const CATEGORY_NAME_LIMIT = 32;
const ACCOUNTS_STORAGE_KEY = "todoAccounts";
const CURRENT_ACCOUNT_STORAGE_KEY = "todoCurrentAccountId";
const CATEGORIES_STORAGE_KEY = "Categories";
const LEGACY_CATEGORIES_STORAGE_KEY = "Profiles";
const LANGUAGE_LOCALES = {
  en: "en-US",
  ru: "ru-RU",
};

const themesData = [
  {
    class: "lightTheme",
    name: "light",
    id: 0,
  },
  {
    class: "darkTheme",
    name: "dark",
    id: 1,
  },
  {
    class: "blueTheme",
    name: "blue",
    id: 2,
  },
  {
    class: "blackTheme",
    name: "black",
    id: 3,
  },
];

const categoryData = [
  {
    name: "all",
    id: 0,
    createdAt: 0,
    deletable: false,
  },
];

function normalizeCategory(categoryItem, index) {
  return {
    id: categoryItem.id || `custom-${uuidv4()}`,
    name: categoryItem.name,
    createdAt: categoryItem.createdAt || Date.now() + index,
    deletable: true,
  };
}

function readJsonStorage(key, fallback) {
  const savedValue = localStorage.getItem(key);

  if (!savedValue) {
    return fallback;
  }

  try {
    return JSON.parse(savedValue);
  } catch {
    return fallback;
  }
}

function getAccountStorageKey(accountId, key) {
  return `todo:user:${accountId}:${key}`;
}

function readAccountJson(accountId, key, fallback) {
  if (!accountId) {
    return fallback;
  }

  return readJsonStorage(getAccountStorageKey(accountId, key), fallback);
}

function readAccountJsonWithLegacy(accountId, key, legacyKey, fallback) {
  if (!accountId) {
    return fallback;
  }

  const value = readAccountJson(accountId, key, null);

  if (value !== null) {
    return value;
  }

  return readAccountJson(accountId, legacyKey, fallback);
}

function readAccountString(accountId, key, fallback) {
  if (!accountId) {
    return fallback;
  }

  return localStorage.getItem(getAccountStorageKey(accountId, key)) || fallback;
}

function getPreferredLanguage() {
  const deviceLanguage = navigator.language || navigator.languages?.[0] || "";

  return deviceLanguage.toLowerCase().startsWith("ru") ? "ru" : "en";
}

function getPreferredTheme() {
  if (typeof window.matchMedia !== "function") {
    return 0;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? 1 : 0;
}

function writeAccountValue(accountId, key, value) {
  if (!accountId) {
    return;
  }

  localStorage.setItem(getAccountStorageKey(accountId, key), value);
}

function removeAccountValue(accountId, key) {
  if (!accountId) {
    return;
  }

  localStorage.removeItem(getAccountStorageKey(accountId, key));
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function normalizeToDoItem(item) {
  if (!item || item.category || !item.profile) {
    return item;
  }

  const { profile, ...rest } = item;

  return {
    ...rest,
    category: profile,
  };
}

function migrateLegacyStorageToAccount(accountId) {
  ["toDoItems", CATEGORIES_STORAGE_KEY, "theme", "weekStart", "language"].forEach((key) => {
    const legacyValue = localStorage.getItem(key);
    const accountKey = getAccountStorageKey(accountId, key);

    if (legacyValue !== null && localStorage.getItem(accountKey) === null) {
      localStorage.setItem(accountKey, legacyValue);
    }
  });

  const legacyCategories = localStorage.getItem(LEGACY_CATEGORIES_STORAGE_KEY);
  const categoriesKey = getAccountStorageKey(accountId, CATEGORIES_STORAGE_KEY);

  if (legacyCategories !== null && localStorage.getItem(categoriesKey) === null) {
    localStorage.setItem(categoriesKey, legacyCategories);
  }
}

function ToDoProvider({ children }) {
  const [accounts, setAccounts] = useState(() =>
    readJsonStorage(ACCOUNTS_STORAGE_KEY, [])
  );
  const [currentAccountId, setCurrentAccountId] = useState(
    () => localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY) || ""
  );
  const [input, setInput] = useState("");
  const [inputCache, setInputCache] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deadlineCache, setDeadlineCache] = useState("");
  const [focus, setFocus] = useState("");
  const [popup, setPopup] = useState(null);
  const [category, setCategory] = useState(0);
  const [draftCategory, setDraftCategory] = useState(0);
  const [draftCategoryCache, setDraftCategoryCache] = useState(0);
  const [weekStart, setWeekStart] = useState(
    () => readAccountString(localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY), "weekStart", "monday")
  );
  const [language, setLanguage] = useState(
    () => readAccountString(
      localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY),
      "language",
      getPreferredLanguage()
    )
  );

  const [customCategories, setCustomCategories] = useState(() => {
    const accountId = localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY);
    return readAccountJsonWithLegacy(
      accountId,
      CATEGORIES_STORAGE_KEY,
      LEGACY_CATEGORIES_STORAGE_KEY,
      []
    ).map(normalizeCategory);
  });

  const [toDoItems, setToDoItems] = useState(() => {
    const accountId = localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY);
    return readAccountJson(accountId, "toDoItems", []).map(normalizeToDoItem);
  });

  const [theme, setTheme] = useState(() =>
    Number(readAccountString(
      localStorage.getItem(CURRENT_ACCOUNT_STORAGE_KEY),
      "theme",
      String(getPreferredTheme())
    ))
  );
  const allCategories = useMemo(
    () => [...categoryData, ...customCategories],
    [customCategories]
  );
  const currentAccount = useMemo(
    () => accounts.find((account) => account.id === currentAccountId) || null,
    [accounts, currentAccountId]
  );

  const getDate = useCallback((createdAt) => {
    const time = new Date().toLocaleTimeString();
    const locale = LANGUAGE_LOCALES[language] || LANGUAGE_LOCALES.ru;

    if (createdAt) {
      const createdAtDate = parseInputDate(createdAt);

      if (createdAtDate) {
        return `${createdAtDate.toLocaleDateString(locale)} ${time}`;
      }
    }

    return `${new Date().toLocaleDateString(locale)} ${time}`;
  }, [language]);

  const loadAccountData = useCallback((accountId) => {
    setInput("");
    setInputCache("");
    setDeadline("");
    setDeadlineCache("");
    setFocus("");
    setPopup(null);
    setCategory(0);
    setDraftCategory(0);
    setDraftCategoryCache(0);
    setCustomCategories(
      readAccountJsonWithLegacy(
        accountId,
        CATEGORIES_STORAGE_KEY,
        LEGACY_CATEGORIES_STORAGE_KEY,
        []
      ).map(normalizeCategory)
    );
    setToDoItems(readAccountJson(accountId, "toDoItems", []).map(normalizeToDoItem));
    setTheme(Number(readAccountString(accountId, "theme", String(getPreferredTheme()))));
    setWeekStart(readAccountString(accountId, "weekStart", "monday"));
    setLanguage(readAccountString(accountId, "language", getPreferredLanguage()));
  }, []);

  const switchAccount = useCallback(
    (accountId) => {
      loadAccountData(accountId);
      setCurrentAccountId(accountId);
      localStorage.setItem(CURRENT_ACCOUNT_STORAGE_KEY, accountId);
    },
    [loadAccountData]
  );

  const signIn = useCallback(
    ({ username, password }) => {
      const normalizedUsername = normalizeUsername(username);
      const account = accounts.find(
        (item) => normalizeUsername(item.username) === normalizedUsername
      );

      if (!account || account.password !== password) {
        return false;
      }

      switchAccount(account.id);
      return true;
    },
    [accounts, switchAccount]
  );

  const register = useCallback(
    ({ username, password }) => {
      const nextUsername = username.trim();
      const normalizedUsername = normalizeUsername(nextUsername);

      if (!nextUsername || !password) {
        return false;
      }

      const isDuplicate = accounts.some(
        (item) => normalizeUsername(item.username) === normalizedUsername
      );

      if (isDuplicate) {
        return false;
      }

      const newAccount = {
        id: uuidv4(),
        username: nextUsername,
        password,
      };

      const nextAccounts = [...accounts, newAccount];
      setAccounts(nextAccounts);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(nextAccounts));
      if (accounts.length === 0) {
        migrateLegacyStorageToAccount(newAccount.id);
      }
      switchAccount(newAccount.id);
      return true;
    },
    [accounts, switchAccount]
  );

  const signOut = useCallback(() => {
    setInput("");
    setInputCache("");
    setDeadline("");
    setDeadlineCache("");
    setFocus("");
    setPopup(null);
    setCategory(0);
    setDraftCategory(0);
    setDraftCategoryCache(0);
    setCustomCategories([]);
    setToDoItems([]);
    setTheme(getPreferredTheme());
    setWeekStart("monday");
    setLanguage(getPreferredLanguage());
    setCurrentAccountId("");
    localStorage.removeItem(CURRENT_ACCOUNT_STORAGE_KEY);
  }, []);

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (!currentAccountId) {
      return;
    }

    if (toDoItems.length > 0) {
      writeAccountValue(currentAccountId, "toDoItems", JSON.stringify(toDoItems));
    } else {
      removeAccountValue(currentAccountId, "toDoItems");
    }
  }, [currentAccountId, toDoItems]);

  useEffect(() => {
    writeAccountValue(currentAccountId, "theme", String(theme));
  }, [currentAccountId, theme]);

  useEffect(() => {
    if (!currentAccountId) {
      return;
    }

    if (customCategories.length > 0) {
      writeAccountValue(currentAccountId, CATEGORIES_STORAGE_KEY, JSON.stringify(customCategories));
    } else {
      removeAccountValue(currentAccountId, CATEGORIES_STORAGE_KEY);
    }
    removeAccountValue(currentAccountId, LEGACY_CATEGORIES_STORAGE_KEY);
  }, [currentAccountId, customCategories]);

  useEffect(() => {
    writeAccountValue(currentAccountId, "weekStart", weekStart);
  }, [currentAccountId, weekStart]);

  useEffect(() => {
    writeAccountValue(currentAccountId, "language", language);
  }, [currentAccountId, language]);

  const addCategory = useCallback(
    (categoryName, options = {}) => {
      const name = categoryName.trim().slice(0, CATEGORY_NAME_LIMIT);

      if (!name) {
        return false;
      }

      const existingCategory = allCategories.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );

      if (existingCategory) {
        return false;
      }

      const newCategory = {
        name,
        id: `custom-${uuidv4()}`,
        createdAt: Date.now(),
        deletable: true,
      };

      setCustomCategories((prev) => [...prev, newCategory]);
      if (options.select === "draft") {
        setDraftCategory(newCategory.id);
      } else {
        setCategory(newCategory.id);
      }
      return newCategory.id;
    },
    [allCategories]
  );

  const deleteCategory = useCallback(
    (categoryId, options = {}) => {
      const categoryToDelete = customCategories.find((item) => item.id === categoryId);

      if (!categoryToDelete) {
        return;
      }

      const categoryItems = toDoItems.filter(
        (item) => item.category === categoryToDelete.name
      );

      if (categoryItems.length > 0 && !options.force) {
        setPopup({
          type: "deleteCategory",
          categoryId,
          categoryName: categoryToDelete.name,
          notesCount: categoryItems.length,
        });
        return;
      }

      setCustomCategories((prev) => prev.filter((item) => item.id !== categoryId));
      setToDoItems((prev) =>
        prev.filter((item) => item.category !== categoryToDelete.name)
      );
      setPopup(null);

      if (category === categoryId) {
        setCategory(0);
      }

      const focusedItem = toDoItems.find((item) => item.id === focus);

      if (focusedItem?.category === categoryToDelete.name) {
        setFocus("");
        setInput(inputCache);
        setInputCache("");
        setDeadline(deadlineCache);
        setDeadlineCache("");
        setDraftCategory(draftCategoryCache);
        setDraftCategoryCache(0);
      }
    },
    [
      customCategories,
      deadlineCache,
      draftCategoryCache,
      focus,
      inputCache,
      category,
      toDoItems,
    ]
  );

  const addItem = useCallback((options = {}) => {
    if (focus === "" && !input.trim()) {
      return false;
    }

    if (focus === "") {
      const selectedCategory =
        allCategories.find((item) => item.id === category) || categoryData[0];
      const createdAt = options.createdAt || getDateInputValue(new Date());

      setToDoItems((prev) => [
        ...prev,
        {
          id: uuidv4(),
          text: input,
          favorite: false,
          checked: false,
          category: selectedCategory.name,
          deadline,
          createdAt,
          date: getDate(createdAt),
        },
      ]);
    } else {
      const selectedDraftCategory =
        allCategories.find((item) => item.id === draftCategory) ||
        allCategories.find((item) => item.id === category) ||
        categoryData[0];

      setToDoItems((prev) =>
        prev.map((item) =>
          item.id === focus
            ? {
                ...item,
                text: input,
                deadline,
                category: selectedDraftCategory.name,
              }
            : item
        )
      );
    }
    setInput(inputCache);
    setInputCache("");
    setDeadline(deadlineCache);
    setDeadlineCache("");
    setDraftCategory(draftCategoryCache);
    setDraftCategoryCache(0);
    setFocus("");
    return true;
  }, [
    allCategories,
    deadline,
    deadlineCache,
    draftCategory,
    draftCategoryCache,
    focus,
    input,
    inputCache,
    category,
    getDate,
  ]);

  const deleteElement = useCallback(
    (idItem) => {
      setToDoItems((prev) => prev.filter((item) => item.id !== idItem));
      setPopup(null);
      if (idItem === focus) {
        setFocus("");
        setInput(inputCache);
        setInputCache("");
        setDeadline(deadlineCache);
        setDeadlineCache("");
        setDraftCategory(draftCategoryCache);
        setDraftCategoryCache(0);
      }
    },
    [deadlineCache, draftCategoryCache, focus, inputCache]
  );

  const deleteCompletedItems = useCallback((options = {}) => {
    const itemIds = options.itemIds ? new Set(options.itemIds) : null;

    setToDoItems((prev) => {
      const focusedItem = prev.find((item) => item.id === focus);
      const shouldDeleteItem = (item) =>
        item.checked && (!itemIds || itemIds.has(item.id));

      if (focusedItem && shouldDeleteItem(focusedItem)) {
        setFocus("");
        setInput(inputCache);
        setInputCache("");
        setDeadline(deadlineCache);
        setDeadlineCache("");
        setDraftCategory(draftCategoryCache);
        setDraftCategoryCache(0);
      }

      return prev.filter((item) => !shouldDeleteItem(item));
    });
    setPopup(null);
  }, [deadlineCache, draftCategoryCache, focus, inputCache]);

  const requestDeleteCompletedItems = useCallback((options = {}) => {
    const itemIds = options.itemIds ? new Set(options.itemIds) : null;
    const completedCount = toDoItems.filter(
      (item) => item.checked && (!itemIds || itemIds.has(item.id))
    ).length;

    if (completedCount === 0) {
      return;
    }

    setPopup({
      type: "deleteCompleted",
      count: completedCount,
      dateTitle: options.dateTitle,
      itemIds: options.itemIds,
    });
  }, [toDoItems]);

  const reorderToDoItems = useCallback((visibleOrderedIds) => {
    setToDoItems((prev) => {
      if (!visibleOrderedIds.length) {
        return prev;
      }

      const itemsById = new Map(prev.map((item) => [item.id, item]));
      const orderedItems = [...visibleOrderedIds]
        .reverse()
        .map((id) => itemsById.get(id))
        .filter(Boolean);

      if (orderedItems.length !== visibleOrderedIds.length) {
        return prev;
      }

      if (orderedItems.length === prev.length) {
        return orderedItems;
      }

      const orderedQueue = [...orderedItems];
      const visibleIdSet = new Set(visibleOrderedIds);

      return prev.map((item) =>
        visibleIdSet.has(item.id) ? orderedQueue.shift() : item
      );
    });
  }, []);

  const editElement = useCallback(
    (idItem, text, itemDeadline = "", itemCategory = "") => {
      const selectedDraftCategory =
        allCategories.find((item) => item.name === itemCategory)?.id ?? 0;

      setFocus(idItem);
      setInputCache(input);
      setDeadlineCache(deadline);
      setDraftCategoryCache(draftCategory);
      setInput(text);
      setDeadline(itemDeadline || "");
      setDraftCategory(selectedDraftCategory);
    },
    [allCategories, deadline, draftCategory, input]
  );

  const cancel = useCallback(() => {
    setInput(inputCache);
    setInputCache("");
    setDeadline(deadlineCache);
    setDeadlineCache("");
    setDraftCategory(draftCategoryCache);
    setDraftCategoryCache(0);
    setFocus("");
  }, [deadlineCache, draftCategoryCache, inputCache]);

  const onClickEdit = useCallback(
    (item) => {
      focus !== item.id
        ? editElement(item.id, item.text, item.deadline, item.category)
        : cancel();
    },
    [focus, editElement, cancel]
  );

  const onClickDelete = useCallback((item) => {
    setPopup(item);
  }, []);

  const onClickFavorite = useCallback((idItem) => {
    setToDoItems((prev) =>
      prev.map((elem) =>
        elem.id === idItem ? { ...elem, favorite: !elem.favorite } : elem
      )
    );
  }, []);

  const onClickCheckBox = useCallback((idItem) => {
    setToDoItems((prev) => {
      const targetItem = prev.find((item) => item.id === idItem);

      if (!targetItem) {
        return prev;
      }

      const updatedItem = {
        ...targetItem,
        checked: !targetItem.checked,
      };

      if (!updatedItem.checked) {
        return prev.map((item) => (item.id === idItem ? updatedItem : item));
      }

      return [...prev.filter((item) => item.id !== idItem), updatedItem];
    });
  }, []);

  const value = useMemo(
    () => ({
      toDoItems,
      focus,
      popup,
    }),
    [toDoItems, focus, popup]
  );

  const themesContext = useMemo(
    () => ({
      themesData,
      theme,
      setTheme,
    }),
    [theme]
  );

  const actions = useMemo(
    () => ({
      setFocus,
      setPopup,
      setToDoItems,
      addItem,
      deleteElement,
      deleteCompletedItems,
      requestDeleteCompletedItems,
      reorderToDoItems,
      addCategory,
    }),
    [
      setFocus,
      setPopup,
      setToDoItems,
      addItem,
      deleteElement,
      deleteCompletedItems,
      requestDeleteCompletedItems,
      reorderToDoItems,
      addCategory,
    ]
  );

  const inputContext = useMemo(
    () => ({
      input,
      setInput,
      deadline,
      setDeadline,
      draftCategory,
      setDraftCategory,
    }),
    [deadline, draftCategory, input]
  );

  const categoryContext = useMemo(
    () => ({
      categoryData: allCategories,
      category,
      deleteCategory,
      setCategory,
    }),
    [allCategories, deleteCategory, category]
  );

  const toDoElementContext = useMemo(
    () => ({
      editElement,
      cancel,
      onClickEdit,
      onClickDelete,
      onClickFavorite,
      onClickCheckBox,
    }),
    [
      editElement,
      cancel,
      onClickEdit,
      onClickDelete,
      onClickFavorite,
      onClickCheckBox,
    ]
  );

  const settingsContext = useMemo(
    () => ({
      language,
      setLanguage,
      weekStart,
      setWeekStart,
    }),
    [language, weekStart]
  );

  const authContext = useMemo(
    () => ({
      accounts,
      currentAccount,
      register,
      signIn,
      signOut,
    }),
    [accounts, currentAccount, register, signIn, signOut]
  );

  return (
    <AuthToDoContext.Provider value={authContext}>
      <ToDoContext.Provider value={value}>
        <FunctionToDoContext.Provider value={actions}>
          <InputToDoContext.Provider value={inputContext}>
            <ThemesToDoContext.Provider value={themesContext}>
              <CategoryToDoContext.Provider value={categoryContext}>
                <SettingsToDoContext.Provider value={settingsContext}>
                  <ElementsToDoContext.Provider value={toDoElementContext}>
                    {children}
                  </ElementsToDoContext.Provider>
                </SettingsToDoContext.Provider>
              </CategoryToDoContext.Provider>
            </ThemesToDoContext.Provider>
          </InputToDoContext.Provider>
        </FunctionToDoContext.Provider>
      </ToDoContext.Provider>
    </AuthToDoContext.Provider>
  );
}

export default ToDoProvider;
