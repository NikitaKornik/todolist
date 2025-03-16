import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Btn from "../UIkit/Btn/Btn";

import { ReactComponent as ChevronDown } from "../../image/chevronDown.svg";
import { ReactComponent as ChevronUp } from "../../image/chevronUp.svg";

import s from "./Header.module.scss";

const dropDownAnimation = {
  animate: { height: "auto" },
  initial: { height: 0 },
  exit: { height: 0 },
  transition: { duration: 0.2 },
};

function Header({ profile, setProfile, count, profileData }) {
  const [openProfiles, setOpenProfiles] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenProfiles(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div className={s.root}>
      <div className={s.container}>
        <ul className={s.HeaderListItems}>
          <li className={s.profile} ref={dropdownRef}>
            <Btn
              className={s.ListItem}
              onClick={() => setOpenProfiles(!openProfiles)}
              svgRight={
                openProfiles ? (
                  <ChevronUp width={"15px"} />
                ) : (
                  <ChevronDown width={"15px"} />
                )
              }
            >
              {profileData[profile].name}
            </Btn>
            <AnimatePresence>
              {openProfiles && (
                <motion.ul className={s.dropdownMenu} {...dropDownAnimation}>
                  {profileData.map((listItem) => {
                    return (
                      <li
                        key={listItem.id}
                        onClick={() => {
                          setProfile(listItem.id);
                          setOpenProfiles(!openProfiles);
                        }}
                      >
                        {listItem.name}
                      </li>
                    );
                  })}
                  <li>Добавить +</li>
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        </ul>
        <div className={s.count}>Заметок: {count}</div>
      </div>
    </div>
  );
}

export default Header;
