import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

export const ToDoContext = createContext(null);
export const FunctionToDoContext = createContext(null);
export const InputToDoContext = createContext(null);
export const ThemesToDoContext = createContext(null);
export const ProfileToDoContext = createContext(null);
export const ElementsToDoContext = createContext(null);

const PROFILE_NAME_LIMIT = 32;

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

const profileData = [
  {
    name: "all",
    id: 0,
    createdAt: 0,
    deletable: false,
  },
  {
    name: "home",
    id: 1,
    createdAt: 1,
    deletable: false,
  },
  {
    name: "work",
    id: 2,
    createdAt: 2,
    deletable: false,
  },
  {
    name: "study",
    id: 3,
    createdAt: 3,
    deletable: false,
  },
];

function normalizeProfile(profileItem, index) {
  return {
    id: profileItem.id || `custom-${uuidv4()}`,
    name: profileItem.name,
    createdAt: profileItem.createdAt || Date.now() + index,
    deletable: true,
  };
}

function ToDoProvider({ children }) {
  const [input, setInput] = useState("");
  const [inputCache, setInputCache] = useState("");
  const [focus, setFocus] = useState("");
  const [popup, setPopup] = useState(null);
  const [profile, setProfile] = useState(0);

  const [customProfiles, setCustomProfiles] = useState(() => {
    const savedProfiles = localStorage.getItem("Profiles");
    return savedProfiles ? JSON.parse(savedProfiles).map(normalizeProfile) : [];
  });

  const [toDoItems, setToDoItems] = useState(() => {
    const savedItems = localStorage.getItem("toDoItems");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [theme, setTheme] = useState(() => Number(localStorage.getItem("theme") || 0));
  const allProfiles = useMemo(
    () => [...profileData, ...customProfiles],
    [customProfiles]
  );

  function getDate() {
    let date = new Date();
    date = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    return date;
  }

  useEffect(() => {
    if (customProfiles.length > 0) {
      localStorage.setItem("Profiles", JSON.stringify(customProfiles));
    } else {
      localStorage.removeItem("Profiles");
    }
  }, [customProfiles]);

  const addProfile = useCallback(
    (profileName) => {
      const name = profileName.trim().slice(0, PROFILE_NAME_LIMIT);

      if (!name) {
        return false;
      }

      const existingProfile = allProfiles.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );

      if (existingProfile) {
        return false;
      }

      const newProfile = {
        name,
        id: `custom-${uuidv4()}`,
        createdAt: Date.now(),
        deletable: true,
      };

      setCustomProfiles((prev) => [...prev, newProfile]);
      setProfile(newProfile.id);
      return true;
    },
    [allProfiles]
  );

  const deleteProfile = useCallback(
    (profileId, options = {}) => {
      const profileToDelete = customProfiles.find((item) => item.id === profileId);

      if (!profileToDelete) {
        return;
      }

      const profileItems = toDoItems.filter(
        (item) => item.profile === profileToDelete.name
      );

      if (profileItems.length > 0 && !options.force) {
        setPopup({
          type: "deleteProfile",
          profileId,
          profileName: profileToDelete.name,
          notesCount: profileItems.length,
        });
        return;
      }

      setCustomProfiles((prev) => prev.filter((item) => item.id !== profileId));
      setToDoItems((prev) =>
        prev.filter((item) => item.profile !== profileToDelete.name)
      );
      setPopup(null);

      if (profile === profileId) {
        setProfile(0);
      }

      const focusedItem = toDoItems.find((item) => item.id === focus);

      if (focusedItem?.profile === profileToDelete.name) {
        setFocus("");
        setInput(inputCache);
        setInputCache("");
      }
    },
    [customProfiles, focus, inputCache, profile, toDoItems]
  );

  const addItem = useCallback(() => {
    if (focus === "") {
      if (input.trim()) {
        const selectedProfile =
          allProfiles.find((item) => item.id === profile) || profileData[0];

        setToDoItems((prev) => [
          ...prev,
          {
            id: uuidv4(),
            text: input,
            favorite: false,
            checked: false,
            profile: selectedProfile.name,
            date: getDate(),
          },
        ]);
      }
    } else {
      setToDoItems((prev) =>
        prev.map((item) =>
          item.id === focus ? { ...item, text: input } : item
        )
      );
    }
    setInput(inputCache);
    setInputCache("");
    setFocus("");
  }, [allProfiles, focus, input, inputCache, profile]);

  const deleteElement = useCallback(
    (idItem) => {
      setToDoItems((prev) => prev.filter((item) => item.id !== idItem));
      setPopup(null);
      if (idItem === focus) {
        setFocus("");
        setInput(inputCache);
        setInputCache("");
      }
    },
    [focus, inputCache]
  );

  const deleteCompletedItems = useCallback(() => {
    setToDoItems((prev) => {
      const focusedItem = prev.find((item) => item.id === focus);

      if (focusedItem?.checked) {
        setFocus("");
        setInput(inputCache);
        setInputCache("");
      }

      return prev.filter((item) => !item.checked);
    });
  }, [focus, inputCache]);

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
    (idItem, text) => {
      setFocus(idItem);
      setInputCache(input);
      setInput(text);
    },
    [input]
  );

  const cancel = useCallback(() => {
    setInput(inputCache);
    setInputCache("");
    setFocus("");
  }, [inputCache]);

  const onClickEdit = useCallback(
    (item) => {
      focus !== item.id ? editElement(item.id, item.text) : cancel();
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
    setToDoItems((prev) =>
      prev.map((elem) =>
        elem.id === idItem ? { ...elem, checked: !elem.checked } : elem
      )
    );
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
      reorderToDoItems,
      addProfile,
    }),
    [
      setFocus,
      setPopup,
      setToDoItems,
      addItem,
      deleteElement,
      deleteCompletedItems,
      reorderToDoItems,
      addProfile,
    ]
  );

  const inputContext = useMemo(
    () => ({
      input,
      setInput,
    }),
    [input]
  );

  const profileContext = useMemo(
    () => ({
      profileData: allProfiles,
      profile,
      deleteProfile,
      setProfile,
    }),
    [allProfiles, deleteProfile, profile]
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

  return (
    <ToDoContext.Provider value={value}>
      <FunctionToDoContext.Provider value={actions}>
        <InputToDoContext.Provider value={inputContext}>
          <ThemesToDoContext.Provider value={themesContext}>
            <ProfileToDoContext.Provider value={profileContext}>
              <ElementsToDoContext.Provider value={toDoElementContext}>
                {children}
              </ElementsToDoContext.Provider>
            </ProfileToDoContext.Provider>
          </ThemesToDoContext.Provider>
        </InputToDoContext.Provider>
      </FunctionToDoContext.Provider>
    </ToDoContext.Provider>
  );
}

export default ToDoProvider;
