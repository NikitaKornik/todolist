import { useEffect, useState } from "react";
import s from "./App.module.scss";
import ToDoContainer from "./components/ToDoContainer/ToDoContainer";

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

  useEffect(() => {
    document.documentElement.className = "";
    document.documentElement.classList.toggle(themesData[theme].class);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className={s.root}>
      <ToDoContainer
        theme={theme}
        setTheme={setTheme}
        themesData={themesData}
      />
    </div>
  );
}

export default App;
