import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import Header from "../Header/Header";
import PopupDelete from "../PopupDelete/PopupDelete";
import ToDoElement from "../ToDoElement/ToDoElement";
import ToDoInput from "../ToDoInput/ToDoInput";

import s from "./ToDoContainer.module.scss";

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

const blockAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.2 },
};

const backGroundAnimation = {
  animate: { opacity: 1 },
  initial: { opacity: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export default function ToDoContainer({ theme, setTheme, themesData }) {
  const textareaRef = useRef(null);

  const [input, setInput] = useState("");
  const [inputCash, setInputCash] = useState("");
  const [focus, setFocus] = useState("");
  const [popup, setPopup] = useState("");
  const [profile, setProfile] = useState(0);
  const [textAreaHeight, setTextAreaHeight] = useState([]);

  const [toDoItems, setToDoItems] = useState(() => {
    const savedItems = localStorage.getItem("toDoItems");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  useEffect(() => {
    if (toDoItems.length > 0) {
      localStorage.setItem("toDoItems", JSON.stringify(toDoItems));
    } else {
      localStorage.removeItem("toDoItems");
    }
  }, [toDoItems]);

  useEffect(() => {
    const handleKeyDown = (key) => {
      if (key.key === "Escape") {
        if (popup) {
          setPopup("");
        }
        if (focus !== "") {
          cancel();
        }
      }
      if (key.key === "Enter" && !key.shiftKey) {
        if (popup) {
          deleteElement(popup);
        } else {
          key.preventDefault();
          addItem();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [popup, focus, input]);

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

  function getDate() {
    let date = new Date();
    date = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    return date;
  }
  const date = getDate();

  function cancel() {
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

  function onClickEdit(item) {
    focus !== item.id ? editElement(item.id, item.text) : cancel();
  }

  function onClickDelete(item) {
    setPopup(item.id);
  }

  const filteredToDo =
    profile === 0
      ? toDoItems
      : toDoItems.filter(
          (item) =>
            item.profile === profileData[profile].name || item.favorite === true
        );

  const renderToDo = filteredToDo
    .toReversed()
    .map((item) => (
      <ToDoElement
        key={item.id}
        text={item.text}
        id={item.id}
        profile={item.profile}
        blockAnimation={blockAnimation}
        focus={focus}
        favorite={item.favorite}
        checked={item.checked}
        date={item.date}
        onClickFavorite={() => onClickFavorite(item)}
        onClickCheckBox={() => onClickCheckBox(item)}
        onClickEdit={() => onClickEdit(item)}
        onClickDelete={() => onClickDelete(item)}
      />
    ));

  return (
    <div
      className={s.root}
      style={{
        paddingBottom: textAreaHeight <= 350 ? `${textAreaHeight}px` : "370px",
      }}
    >
      <Header
        profile={profile}
        setProfile={setProfile}
        count={renderToDo.length}
        profileData={profileData}
        theme={theme}
        setTheme={setTheme}
        themesData={themesData}
      />
      <AnimatePresence>
        {popup && (
          <PopupDelete
            deleteElement={deleteElement}
            popup={popup}
            setPopup={setPopup}
            blockAnimation={blockAnimation}
            backGroundAnimation={backGroundAnimation}
          />
        )}
      </AnimatePresence>
      <ToDoInput
        textareaRef={textareaRef}
        input={input}
        setInput={setInput}
        addItem={addItem}
        popup={popup}
        cancel={cancel}
        focus={focus}
        setTextAreaHeight={setTextAreaHeight}
      />
      <AnimatePresence>
        {renderToDo.length ? (
          renderToDo
        ) : (
          <motion.div className={s.emptyList} {...blockAnimation}>
            Ваш список пуст, пора что-то добавить!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
