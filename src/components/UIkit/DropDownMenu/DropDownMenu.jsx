import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Btn from "../Btn/Btn";
import s from "./DropDownMenu.module.scss";

import { ReactComponent as ChevronDown } from "../../../image/chevronDown.svg";
import { ReactComponent as ChevronUp } from "../../../image/chevronUp.svg";

const dropDownAnimation = {
  animate: { height: "auto" },
  initial: { height: 0 },
  exit: { height: 0 },
  transition: { duration: 0.2 },
};

function DropDownMenu({ data, item, setItem, editable = false }) {
  const [onen, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
            {editable && <li className={s.editable}>Добавить +</li>}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DropDownMenu;
