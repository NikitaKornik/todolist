import React, { memo, useContext } from "react";
import DropDownMenu from "../UIkit/DropDownMenu/DropDownMenu";
import {
  ProfileToDoContext,
  ThemesToDoContext,
} from "../../context/ToDoProvider/ToDoProvider";
import s from "./Header.module.scss";

const Header = memo(({ count }) => {
  console.log("3) Header");
  const { setTheme, theme, themesData } = useContext(ThemesToDoContext);
  const { profileData, profile, setProfile } = useContext(ProfileToDoContext);

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
});

export { Header };
