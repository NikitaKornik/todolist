import React from "react";
import { motion } from "framer-motion";
import Btn from "../UIkit/Btn/Btn";
import s from "./PopupDelete.module.scss";

function PopupDelete({
  deleteElement,
  popup,
  setPopup,
  blockAnimation,
  backGroundAnimation,
}) {
  return (
    <motion.div className={s.root} {...backGroundAnimation}>
      <motion.div className={s.container} {...blockAnimation}>
        <div className={s.text}>Вы точно хотите удалить этот элемент?</div>
        <div className={s.btnContainer}>
          <Btn
            variant="BGprimary"
            onClick={() => {
              setPopup("");
            }}
          >
            Отмена
          </Btn>
          <Btn variant="BGdanger" onClick={() => deleteElement(popup)}>
            Удалить
          </Btn>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PopupDelete;
