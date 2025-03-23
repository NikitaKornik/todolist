import React, { useCallback, useMemo } from "react";
import { createContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const ToDoContext = createContext(null);
export const FunctionToDoContext = createContext(null);
export const InputToDoContext = createContext(null);
export const ThemesToDoContext = createContext(null);
export const ProfileToDoContext = createContext(null);
export const ElementsToDoContext = createContext(null);

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
];

const profileData = [
  {
    name: "all",
    id: 0,
  },
  {
    name: "home",
    id: 1,
  },
  {
    name: "work",
    id: 2,
  },
  {
    name: "study",
    id: 3,
  },
];

function ToDoProvider({ children }) {
  const [input, setInput] = useState("");
  const [inputCache, setInputCache] = useState("");
  const [focus, setFocus] = useState("");
  const [popup, setPopup] = useState("");
  const [profile, setProfile] = useState(0);

  const [toDoItems, setToDoItems] = useState(() => {
    const savedItems = localStorage.getItem("toDoItems");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : 0
  );

  function getDate() {
    let date = new Date();
    date = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    return date;
  }
  const date = getDate();

  const addItem = useCallback(() => {
    if (focus === "") {
      if (input.trim()) {
        setToDoItems((prev) => [
          ...prev,
          {
            id: uuidv4(),
            text: input,
            favorite: false,
            checked: false,
            profile: profileData[profile].name,
            date: date,
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
  }, [focus, input, profile]);

  const deleteElement = useCallback(
    (idItem) => {
      setToDoItems((prev) => prev.filter((item) => item.id !== idItem));
      setTimeout(() => {
        setPopup("");
      }, 50);
      if (idItem === focus) {
        setFocus("");
        setInput(inputCache);
        setInputCache("");
      }
    },
    [focus, inputCache]
  );

  const editElement = useCallback(
    (idItem, text) => {
      console.log("input in edit:", input);
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
    [focus]
  );

  const onClickDelete = useCallback((item) => {
    setPopup(item.id);
  }, []);

  const onClickFavorite = useCallback((item) => {
    setToDoItems((prev) =>
      prev.map((elem) =>
        elem.id === item.id ? { ...elem, favorite: !elem.favorite } : elem
      )
    );
  }, []);

  const onClickCheckBox = useCallback((item) => {
    setToDoItems((prev) =>
      prev.map((elem) =>
        elem.id === item.id ? { ...elem, checked: !elem.checked } : elem
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      toDoItems,
      focus,
      popup,
      date,
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
    }),
    [setFocus, setPopup, setToDoItems, addItem, deleteElement]
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
      profileData,
      profile,
      setProfile,
    }),
    [profileData, profile]
  );

  const toDoElementContext = useMemo(() => ({
    editElement,
    cancel,
    onClickEdit,
    onClickDelete,
    onClickFavorite,
    onClickCheckBox,
  }));

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
