import React from "react";

import DropDownMenu from "../UIkit/DropDownMenu/DropDownMenu";

import s from "./Header.module.scss";

function Header({
  profile,
  setProfile,
  count,
  profileData,
  themesData,
  theme,
  setTheme,
}) {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <div className={s.leftItems}>
          <DropDownMenu
            data={profileData}
            item={profile}
            setItem={setProfile}
            editable
          />
          <DropDownMenu data={themesData} item={theme} setItem={setTheme} />
        </div>
        <div className={s.count}>Заметок: {count}</div>
      </div>
    </div>
  );
}

export default Header;
