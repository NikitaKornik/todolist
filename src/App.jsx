import s from "./App.module.scss";
import ToDoContainer from "./components/ToDoContainer/ToDoContainer";

function App() {
  return (
    <div className={s.root}>
      <ToDoContainer />
    </div>
  );
}

export default App;
