import React, { useContext, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { FunctionContext } from "../../context/ToDoProvider/ToDoProvider";
import Btn from "../UIkit/Btn/Btn";
import s from "./ToDoInput.module.scss";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgCheck } from "../../image/check.svg";
import { ReactComponent as SvgAdd } from "../../image/add.svg";

function ToDoInput({ textareaRef, setTextAreaHeight }) {
  console.log("input");
  const { input, setInput, focus, popup, addItem, cancel } =
    useContext(FunctionContext);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    setTextAreaHeight(textarea.scrollHeight + 50);
  };

  useEffect(() => {
    resizeTextarea();
  }, [input]);
  return (
    <div className={s.inputContainer}>
      <div className={s.input}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          rows={1}
          placeholder="Введите текст..."
        />
        <Btn
          className={s.svgAdd}
          variant={"BGprimary"}
          onClick={addItem}
          disabled={!input}
          svgRight={focus !== "" ? <SvgCheck /> : <SvgAdd />}
        ></Btn>
        <AnimatePresence>
          {focus !== "" && popup !== true && (
            <Btn
              svgRight={<SvgCancel />}
              className={s.svgCancel}
              variant={"BGdanger"}
              onClick={cancel}
            ></Btn>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ToDoInput;
