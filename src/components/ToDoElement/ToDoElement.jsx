import React, { memo, useContext } from "react";
import { motion } from "framer-motion";
import cn from "classnames";
import Btn from "../UIkit/Btn/Btn";
import s from "./ToDoElement.module.scss";
import { ReactComponent as SvgDelete } from "../../image/delete.svg";
import { ReactComponent as SvgEdit } from "../../image/edit.svg";
import { ReactComponent as SvgCancel } from "../../image/cancel.svg";
import { ReactComponent as SvgHeart } from "../../image/heart.svg";
import { ReactComponent as SvgHeartFill } from "../../image/heartFill.svg";
import { ReactComponent as SvgCheckBoxActive } from "../../image/checkBoxActive.svg";
import { ReactComponent as SvgCheckBoxDisable } from "../../image/checkBoxDisable.svg";
import { InputToDoContext } from "../../context/ToDoProvider/ToDoProvider";

const ToDoElementAnimation = {
  animate: {
    height: "auto",
    minHeight: "24px",
    padding: "15px 0px 50px 0px",
    margin: "10px 0px",
  },
  initial: { height: 0, minHeight: 0, padding: 0, margin: 0 },
  exit: { height: 0, minHeight: 0, padding: 0, margin: 0 },
  transition: { duration: 0.2 },
};

const ToDoElement = memo(
  ({
    text,
    onClickEdit,
    onClickDelete,
    onClickFavorite,
    profile,
    favorite,
    id,
    focus,
    checked,
    onClickCheckBox,
    date,
  }) => {
    console.log("5) ToDoElement", id);
    return (
      <motion.div
        className={cn(s.root, {
          [s.focus]: focus !== id && focus !== "",
          [s.favorite]: favorite,
          [s.checked]: checked,
        })}
        id={id}
        {...ToDoElementAnimation}
      >
        <div className={s.text}>{text}</div>
        <div className={s.info}>
          <div className={s.profile}>{profile && `Профиль: ${profile}`}</div>
          <div className={s.date}>{date && `Дата: ${date}`}</div>
        </div>
        <div className={s.btnContainer}>
          <Btn
            variant={checked ? "checked" : "BGnone"}
            size={"size_svg"}
            svgRight={checked ? <SvgCheckBoxActive /> : <SvgCheckBoxDisable />}
            className={s.hover}
            onClick={onClickCheckBox}
          ></Btn>
          <Btn
            variant={favorite ? "favorite" : "BGnone"}
            size={"size_svg"}
            svgRight={favorite ? <SvgHeartFill /> : <SvgHeart />}
            className={s.hover}
            onClick={onClickFavorite}
          ></Btn>
          <Btn
            variant="BGnone"
            size={"size_svg"}
            className={s.hover}
            onClick={onClickEdit}
            svgRight={focus !== id ? <SvgEdit /> : <SvgCancel />}
          ></Btn>
          <Btn
            variant="danger"
            size={"size_svg"}
            svgRight={<SvgDelete />}
            className={s.hover}
            onClick={onClickDelete}
          ></Btn>
        </div>
      </motion.div>
    );
  }
);

export { ToDoElement };
