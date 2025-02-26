import s from "./App.module.scss";
import Btn from "./components/UIkit/Btn/Btn";

import { ReactComponent as Heart } from "./image/heart.svg";

function App() {
  return (
    <div className={s.root}>
      <Btn variant={"primary"} svgLeft={<Heart />}>
        Btn
      </Btn>
      <Btn variant={"primary"} disabled={true}>
        Btn-big-text
      </Btn>
      <Btn variant={"primary"} svgLeft={<Heart />}></Btn>
    </div>
  );
}

export default App;
