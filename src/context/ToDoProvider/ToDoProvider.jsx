import React from "react";
import { createContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const FunctionContext = createContext(null);

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
  const [inputCash, setInputCash] = useState("");
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

  function addItem() {
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
    setInput(inputCash);
    setInputCash("");
    setFocus("");
  }

  function deleteElement(idItem) {
    setToDoItems((prev) => prev.filter((item) => item.id !== idItem));
    setTimeout(() => {
      setPopup("");
    }, 50);
    if (idItem === focus) {
      setFocus("");
      setInput(inputCash);
      setInputCash("");
    }
  }

  function editElement(idItem, text) {
    setFocus(idItem);
    setInputCash(input);
    setInput(text);
  }

  function cancel() {
    setInput(inputCash);
    setInputCash("");
    setFocus("");
  }

  function onClickEdit(item) {
    focus !== item.id ? editElement(item.id, item.text) : cancel();
  }

  function onClickDelete(item) {
    setPopup(item.id);
  }

  function onClickFavorite(item) {
    setToDoItems((prev) =>
      prev.map((elem) =>
        elem.id === item.id ? { ...elem, favorite: !elem.favorite } : elem
      )
    );
  }

  function onClickCheckBox(item) {
    setToDoItems((prev) =>
      prev.map((elem) =>
        elem.id === item.id ? { ...elem, checked: !elem.checked } : elem
      )
    );
  }

  return (
    <FunctionContext.Provider
      value={{
        profileData,
        date,
        input,
        setInput,
        inputCash,
        setInputCash,
        focus,
        setFocus,
        popup,
        setPopup,
        profile,
        setProfile,
        toDoItems,
        setToDoItems,
        addItem,
        deleteElement,
        editElement,
        cancel,
        onClickEdit,
        onClickDelete,
        onClickFavorite,
        onClickCheckBox,
        themesData,
        theme,
        setTheme,
      }}
    >
      {children}
    </FunctionContext.Provider>
  );
}

export default ToDoProvider;
