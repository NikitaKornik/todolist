import React from "react";
import { motion } from "framer-motion";
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

function PopupMenu({ children }) {
  // console.log("6) PopupMenu");
  // const { setPopup } = useContext(FunctionToDoContext);
  return (
    <motion.div className={s.root} {...backGroundAnimation}>
      <motion.div className={s.popup} {...blockAnimation}>
        <div className={s.container}>
          <div className={s.body}>{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PopupMenu;
