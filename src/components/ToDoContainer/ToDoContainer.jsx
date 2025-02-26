import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import { ReactComponent as SvgAdd } from "../../image/add.svg";
import { ReactComponent as SvgCheck } from "../../image/check.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";

import s from "./ToDoContainer.module.scss";
import ToDoElement from "../ToDoElement/ToDoElement";
import Btn from "../UIkit/Btn/Btn";

const MotionSvgAdd = motion(SvgAdd);
const MotionSvgCheck = motion(SvgCheck);

const svgAnimation = {
  animate: { scale: 1 },
  initial: { scale: 0 },
  exit: { scale: 0 },
  transition: { duration: 0.1 },
};

export default function ToDoContainer() {
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState("");
  const [toDoItems, setToDoItems] = useState([]);

  function addItem() {
    if (focus === "") {
      if (input.trim()) {
        setToDoItems((prev) => [...prev, { id: uuidv4(), text: input }]);
      }
    } else {
      setToDoItems((prev) =>
        prev.map((item) =>
          item.id === focus ? { ...item, text: input } : item
        )
      );
    }
    setInput("");
    setFocus("");
  }

  function cancel() {
    setInput("");
    setFocus("");
  }

  function deleteElement(idItem) {
    setToDoItems((prev) => prev.filter((item) => item.id !== idItem));
    if (idItem === focus) {
      setFocus("");
      setInput("");
    }
  }

  function editElement(idItem, text) {
    setFocus(idItem);
    setInput(text);
  }

  return (
    <div className={s.root}>
      <div className={s.inputContainer}>
        <div className={s.input}>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            placeholder="Введите текст..."
          />
          <Btn
            className={s.svgAdd}
            variant={"primary"}
            onClick={addItem}
            disabled={!input}
          >
            <AnimatePresence mode="wait">
              {focus !== "" ? (
                <MotionSvgCheck key="check" {...svgAnimation} />
              ) : (
                <MotionSvgAdd key="add" {...svgAnimation} />
              )}
            </AnimatePresence>
          </Btn>
          <AnimatePresence>
            {focus !== "" && (
              <Btn
                svgRight={<SvgCancel />}
                className={s.svgCancel}
                variant={"danger"}
                onClick={cancel}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {toDoItems.map((item) => {
          return (
            <ToDoElement
              key={item.id}
              text={item.text}
              id={item.id}
              onClickDelete={() => deleteElement(item.id)}
              onClickEdit={() =>
                focus !== item.id ? editElement(item.id, item.text) : cancel()
              }
              svgAnimation={svgAnimation}
              focus={focus}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
