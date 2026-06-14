import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
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

const ToDoElementAnimation = {
  animate: {
    height: "auto",
    marginBottom: 12,
  },
  initial: { height: 0, marginBottom: 0 },
  exit: { height: 0, marginBottom: 0 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

const ToDoElementLayoutTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightString(value, searchMatch) {
  if (!searchMatch?.value) {
    return value;
  }

  const regexp = new RegExp(`(${escapeRegExp(searchMatch.value)})`, "gi");
  const parts = value.split(regexp);

  if (parts.length === 1) {
    return value;
  }

  return parts.map((part, index) =>
    part.toLowerCase() === searchMatch.value.toLowerCase() ? (
      <mark className={s.searchHighlight} key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function highlightChildren(children, searchMatch) {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return highlightString(child, searchMatch);
    }

    return child;
  });
}

function getReactMarkdownComponents(searchMatch) {
  return {
    p: ({ node, children, ...props }) => (
      <p className={s.todoText} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </p>
    ),
    h1: ({ node, children, ...props }) => (
      <h1 className={s.todoTitle} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </h1>
    ),
    a: ({ node, children, ...props }) => (
      <a className={s.todoLink} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </a>
    ),
    img: ({ node, ...props }) => (
      <img alt="" className={s.todoImg} {...props} style={{ margin: 0 }} />
    ),
    blockquote: ({ node, children, ...props }) => (
      <blockquote className={s.todoBlockquote} {...props} style={{ margin: 0 }}>
        {highlightChildren(children, searchMatch)}
      </blockquote>
    ),
  };
}

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
    searchMatch,
    draggable,
    isDragging,
    onPointerDown,
  }) => {
    const animationProps = draggable ? {} : ToDoElementAnimation;

    return (
      <motion.div
        layout
        transition={{ layout: ToDoElementLayoutTransition }}
        className={cn(s.root, {
          [s.focus]: focus !== id && focus !== "",
          [s.favorite]: favorite,
          [s.checked]: checked,
          [s.draggable]: draggable,
          [s.dragging]: isDragging,
        })}
        data-drag-enabled={draggable}
        data-drag-id={id}
        id={id}
        onPointerDown={(event) => onPointerDown?.(id, event)}
        onMouseDown={(event) => onPointerDown?.(id, event)}
        data-testid={`todo-item-${text}`}
        {...animationProps}
      >
        <div className={s.card}>
          <div className={s.text}>
            <ReactMarkdown components={getReactMarkdownComponents(searchMatch)}>
              {text}
            </ReactMarkdown>
          </div>
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
              ariaLabel={checked ? "Снять отметку" : "Отметить выполненным"}
              onClick={() => onClickCheckBox(id)}
            ></Btn>
            <Btn
              variant={favorite ? "favorite" : "BGnone"}
              size={"size_svg"}
              svgRight={favorite ? <SvgHeartFill /> : <SvgHeart />}
              className={s.hover}
              ariaLabel={favorite ? "Убрать из избранного" : "Добавить в избранное"}
              onClick={() => onClickFavorite(id)}
            ></Btn>
            <Btn
              variant="BGnone"
              size={"size_svg"}
              className={s.hover}
              ariaLabel={focus !== id ? "Редактировать" : "Закрыть редактирование"}
              onClick={() => onClickEdit(id, text)}
              svgRight={focus !== id ? <SvgEdit /> : <SvgCancel />}
            ></Btn>
            <Btn
              variant="danger"
              size={"size_svg"}
              svgRight={<SvgDelete />}
              className={s.hover}
              ariaLabel="Удалить"
              onClick={() => onClickDelete(id)}
            ></Btn>
          </div>
        </div>
      </motion.div>
    );
  }
);

export { ToDoElement };
