import React from "react";
import { motion } from "framer-motion";

import Btn from "../UIkit/Btn/Btn";

import s from "./PopupMenu.module.scss";

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

function PopupMenu({
  deleteElement,
  popup,
  setPopup,
  title,
  desc,
  closeBtn,
  children,
}) {
  return (
    <motion.div className={s.root} {...backGroundAnimation}>
      <motion.div className={s.container} {...blockAnimation}>
        {title && <h3 className={s.title}>{title}</h3>}
        {desc && <div className={s.desc}>{desc}</div>}
        <div className={s.btnContainer}>
          {closeBtn && (
            <Btn
              variant="BGprimary"
              onClick={() => {
                setPopup("");
              }}
            >
              Отмена
            </Btn>
          )}
          {children}
          {/* <Btn variant="BGdanger" onClick={() => deleteElement(popup)}>
            Удалить
          </Btn> */}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PopupMenu;
