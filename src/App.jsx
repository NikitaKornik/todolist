import { useEffect, useState } from "react";
import s from "./App.module.scss";
import ToDoContainer from "./components/ToDoContainer/ToDoContainer";
import PopupMenu from "./components/PopupMenu/PopupMenu";
import { AnimatePresence } from "framer-motion";
import Btn from "./components/UIkit/Btn/Btn";

const themesData = [
  {
    class: s.lightTheme,
    name: "light",
    id: 0,
  },
  {
    class: s.darkTheme,
    name: "dark",
    id: 1,
  },
  {
    class: s.blueTheme,
    name: "blue",
    id: 2,
  },
];

function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : 0
  );
  const [popup, setPopup] = useState("");

  useEffect(() => {
    document.documentElement.className = "";
    document.documentElement.classList.toggle(themesData[theme].class);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={s.root}>
      <AnimatePresence>
        {popup && (
          <PopupMenu
            title={"Вы точно хотите удалить этот элемент?"}
            desc={"Удалив элемент, вы больше не можете его восстановить!"}
            popup={popup}
            setPopup={setPopup}
            closeBtn={true}
          >
            <Btn variant="BGdanger">Удалить</Btn>
          </PopupMenu>
        )}
      </AnimatePresence>
      <ToDoContainer
        theme={theme}
        setTheme={setTheme}
        themesData={themesData}
        popup={popup}
        setPopup={setPopup}
      />
    </div>
  );
}

export default App;
