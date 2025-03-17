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
        count={toDoItems.length}
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
        {toDoItems.length ? (
          profile === 0 ? (
            toDoItems.map((item) => {
              return (
                <ToDoElement
                  key={item.id}
                  text={item.text}
                  id={item.id}
                  profile={item.profile}
                  onClickFavorite={() =>
                    setToDoItems((prev) =>
                      prev.map((elem) =>
                        elem.id === item.id
                          ? { ...elem, favorite: !elem.favorite }
                          : elem
                      )
                    )
                  }
                  onClickCheckBox={() =>
                    setToDoItems((prev) =>
                      prev.map((elem) =>
                        elem.id === item.id
                          ? { ...elem, checked: !elem.checked }
                          : elem
                      )
                    )
                  }
                  onClickEdit={() =>
                    focus !== item.id
                      ? editElement(item.id, item.text)
                      : cancel()
                  }
                  onClickDelete={() => {
                    setPopup(item.id);
                  }}
                  blockAnimation={blockAnimation}
                  focus={focus}
                  favorite={item.favorite}
                  checked={item.checked}
                />
              );
            })
          ) : (
            profile != 0 &&
            toDoItems
              .filter(
                (item) =>
                  item.profile === profileData[profile].name ||
                  item.favorite === true
              )
              .map((item) => {
                return (
                  <ToDoElement
                    key={item.id}
                    text={item.text}
                    id={item.id}
                    profile={item.profile}
                    onClickFavorite={() =>
                      setToDoItems((prev) =>
                        prev.map((elem) =>
                          elem.id === item.id
                            ? { ...elem, favorite: !elem.favorite }
                            : elem
                        )
                      )
                    }
                    onClickCheckBox={() =>
                      setToDoItems((prev) =>
                        prev.map((elem) =>
                          elem.id === item.id
                            ? { ...elem, checked: !elem.checked }
                            : elem
                        )
                      )
                    }
                    onClickEdit={() =>
                      focus !== item.id
                        ? editElement(item.id, item.text)
                        : cancel()
                    }
                    onClickDelete={() => {
                      setPopup(item.id);
                    }}
                    blockAnimation={blockAnimation}
                    focus={focus}
                    favorite={item.favorite}
                    checked={item.checked}
                  />
                );
              })
          )
        ) : (
          <motion.div className={s.emptyList} {...blockAnimation}>
            Ваш список пуст, пора что-то добавить!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
