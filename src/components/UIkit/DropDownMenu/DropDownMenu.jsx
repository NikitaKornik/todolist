import React, { useEffect, useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Btn from "../Btn/Btn";
import s from "./DropDownMenu.module.scss";

import { ReactComponent as ChevronDown } from "../../../image/chevronDown.svg";
import { ReactComponent as ChevronUp } from "../../../image/chevronUp.svg";
import { FunctionToDoContext } from "../../../context/ToDoProvider/ToDoProvider";

const dropDownAnimation = {
  animate: { height: "auto" },
  initial: { height: 0 },
  exit: { height: 0 },
  transition: { duration: 0.2 },
};

function DropDownMenu({ data, item, setItem, editable = false }) {
  const [onen, setOpen] = useState(false);
  const [profileInput, setProfileInput] = useState("");
  const dropdownRef = useRef(null);

  const { setPopup } = useContext(FunctionToDoContext);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function addProfile() {
    setPopup({
      open: true,
      body: (
        <div className={s.popupAddProfile}>
          <h3 className={s.popupTitle}>Добавить элемент?</h3>
          <input
            className={s.popupInput}
            placeholder="Профиль"
            onChange={(e) => {
              setProfileInput(e.target.value);
            }}
          ></input>
          <div className={s.popupBtns}>
            <Btn
              variant="BGsecondary"
              onClick={() => {
                console.log(profileInput);
                setPopup("");
              }}
            >
              Добавить
            </Btn>
            <Btn
              variant="BGprimary"
              onClick={() => {
                setPopup("");
              }}
            >
              Отмена
            </Btn>
          </div>
        </div>
      ),
    });
  }

  return (
    <div className={s.root} ref={dropdownRef}>
      <Btn
        className={s.listItem}
        onClick={() => setOpen(!onen)}
        svgRight={
          onen ? <ChevronUp width={"15px"} /> : <ChevronDown width={"15px"} />
        }
      >
        {data[item].name}
      </Btn>
      <AnimatePresence>
        {onen && (
          <motion.ul className={s.dropdownMenu} {...dropDownAnimation}>
            {data.map((listItem) => {
              return (
                <li
                  key={listItem.id}
                  onClick={() => {
                    setItem(listItem.id);
                    setOpen(!onen);
                  }}
                >
                  {listItem.name}
                </li>
              );
            })}
            {editable && (
              <li className={s.editable} onClick={() => addProfile()}>
                Добавить +
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DropDownMenu;
