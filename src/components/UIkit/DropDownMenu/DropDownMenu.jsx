import React, { useEffect, useMemo, useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Btn from "../Btn/Btn";
import s from "./DropDownMenu.module.scss";

import { ReactComponent as ChevronDown } from "../../../image/chevronDown.svg";
import { ReactComponent as ChevronUp } from "../../../image/chevronUp.svg";
import {
  FunctionToDoContext,
  ProfileToDoContext,
} from "../../../context/ToDoProvider/ToDoProvider";

const dropDownAnimation = {
  animate: { height: "auto" },
  initial: { height: 0 },
  exit: { height: 0 },
  transition: { duration: 0.2 },
};

function DropDownMenu({ data, item, setItem, editable = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("createdAt");
  const dropdownRef = useRef(null);
  const selectedItem = data.find((listItem) => listItem.id === item) || data[0];

  const { setPopup } = useContext(FunctionToDoContext);
  const { deleteProfile } = useContext(ProfileToDoContext);

  const visibleItems = useMemo(() => {
    const baseItems = data.filter((listItem) =>
      listItem.name.toLowerCase().includes(search.trim().toLowerCase())
    );
    const defaultItems = baseItems.filter((listItem) => !listItem.deletable);
    const customItems = baseItems.filter((listItem) => listItem.deletable);
    const sortedCustomItems = [...customItems].sort((first, second) => {
      if (sortMode === "name") {
        return first.name.localeCompare(second.name);
      }

      return (second.createdAt || 0) - (first.createdAt || 0);
    });

    return editable ? [...defaultItems, ...sortedCustomItems] : baseItems;
  }, [data, editable, search, sortMode]);

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
      type: "addProfile",
      initialName: search.trim(),
    });
    setOpen(false);
  }

  return (
    <div className={s.root} ref={dropdownRef}>
      <Btn
        className={s.listItem}
        ariaLabel={`Открыть список: ${selectedItem.name}`}
        onClick={() => setOpen((prev) => !prev)}
        svgRight={
          open ? <ChevronUp width={"15px"} /> : <ChevronDown width={"15px"} />
        }
      >
        {selectedItem.name}
      </Btn>
      <AnimatePresence>
        {open && (
          <motion.ul className={s.dropdownMenu} {...dropDownAnimation}>
            {editable && (
              <li className={s.filterTools} role="presentation">
                <input
                  aria-label="Поиск фильтров"
                  className={s.searchInput}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  placeholder="Поиск"
                />
                <button
                  aria-label={
                    sortMode === "createdAt"
                      ? "Сортировать фильтры по имени"
                      : "Сортировать фильтры по времени создания"
                  }
                  className={s.sortButton}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSortMode((prev) =>
                      prev === "createdAt" ? "name" : "createdAt"
                    );
                  }}
                >
                  {sortMode === "createdAt" ? "по дате" : "по имени"}
                </button>
              </li>
            )}
            {visibleItems.map((listItem) => {
              return (
                <li
                  key={listItem.id}
                  className={s.dropdownItem}
                  onClick={() => {
                    setItem(listItem.id);
                    setOpen(false);
                  }}
                >
                  <span className={s.itemName}>{listItem.name}</span>
                  {editable && listItem.deletable && (
                    <button
                      aria-label={`Удалить фильтр ${listItem.name}`}
                      className={s.deleteItem}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteProfile(listItem.id);
                      }}
                    >
                    </button>
                  )}
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
