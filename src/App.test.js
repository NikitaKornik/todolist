import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import ToDoProvider from "./context/ToDoProvider/ToDoProvider";

jest.mock("./image/delete.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/edit.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/cancel.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/heart.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/heartFill.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/checkBoxActive.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/checkBoxDisable.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/check.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/add.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/threeColumn.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/threeRow.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/chevronDown.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/chevronUp.svg", () => ({ ReactComponent: () => null }));

jest.mock("react-markdown", () => {
  return function ReactMarkdownMock({ children, components = {} }) {
    const Paragraph = components.p || "p";
    return <Paragraph>{children}</Paragraph>;
  };
});

jest.mock("framer-motion", () => {
  const React = require("react");
  const sanitizeMotionProps = (props) =>
    Object.fromEntries(
      Object.entries(props).filter(
        ([key]) =>
          ![
            "layout",
            "whileDrag",
            "drag",
            "dragListener",
            "dragControls",
            "value",
            "as",
            "axis",
            "values",
            "onReorder",
            "whileHover",
            "whileTap",
          ].includes(key)
      )
    );

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      button: React.forwardRef(({ children, whileHover, whileTap, ...props }, ref) => (
        <button ref={ref} {...props}>
          {children}
        </button>
      )),
      div: React.forwardRef(({ children, layout, transition, ...props }, ref) => (
        <div
          ref={ref}
          data-layout-transition={
            layout && transition?.layout ? JSON.stringify(transition.layout) : undefined
          }
          {...sanitizeMotionProps(props)}
        >
          {children}
        </div>
      )),
      ul: React.forwardRef(({ children, ...props }, ref) => (
        <ul ref={ref} {...props}>
          {children}
        </ul>
      )),
    },
  };
});

function renderTodoApp() {
  return render(
    <ToDoProvider>
      <App />
    </ToDoProvider>
  );
}

function getRenderedTodoTexts() {
  return [...document.querySelectorAll('[data-testid^="todo-item-"]')].map(
    (item) => item.getAttribute("data-testid").replace("todo-item-", "")
  );
}

function mockTodoRects(texts) {
  texts.forEach((text, index) => {
    const top = index * 112;
    const item = screen.getByTestId(`todo-item-${text}`);

    item.getBoundingClientRect = jest.fn(() => ({
      top,
      bottom: top + 100,
      height: 100,
      left: 0,
      right: 700,
      width: 700,
      x: 0,
      y: top,
      toJSON: () => {},
    }));
  });
}

function pointerReorderTodo(text, { startY = 50, moveY, commit = true }) {
  fireEvent.mouseDown(screen.getByTestId(`todo-item-${text}`), {
    button: 0,
    clientY: startY,
  });
  act(() => {
    window.dispatchEvent(new MouseEvent("mousemove", { clientY: moveY }));
  });

  if (commit) {
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
  }
}

beforeEach(() => {
  localStorage.clear();
});

test("shows an empty list message before tasks are added", () => {
  renderTodoApp();

  expect(
    screen.getByText("Ваш список пуст, пора что-то добавить!")
  ).toBeInTheDocument();
  expect(screen.getByText("Заметок: 0")).toBeInTheDocument();
});

test("adds a task from the composer", () => {
  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Купить молоко");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByText("Купить молоко")).toBeInTheDocument();
  expect(screen.getByText("Заметок: 1")).toBeInTheDocument();
});

test("searches notes by text", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Купить молоко");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Прочитать книгу");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.type(screen.getByLabelText("Поиск заметок"), "молоко");

  expect(screen.getByText("Купить")).toBeInTheDocument();
  expect(screen.queryByText("Прочитать книгу")).not.toBeInTheDocument();
  expect(screen.getByText("молоко").tagName).toBe("MARK");
  expect(screen.getByText("Заметок: 1")).toBeInTheDocument();
});

test("finds notes with a fuzzy trigram search and highlights the matched word", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "уважаемые коллеги");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "другой текст");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.type(screen.getByLabelText("Поиск заметок"), "увожаемые");

  expect(screen.getByText("уважаемые").tagName).toBe("MARK");
  expect(screen.getByText("коллеги")).toBeInTheDocument();
  expect(screen.queryByText("другой текст")).not.toBeInTheDocument();
});

test("reorders notes downward across multiple positions in the full list", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(getRenderedTodoTexts()).toEqual(["Третья", "Вторая", "Первая"]);

  mockTodoRects(["Третья", "Вторая", "Первая"]);
  pointerReorderTodo("Третья", { moveY: 320 });

  expect(getRenderedTodoTexts()).toEqual(["Вторая", "Первая", "Третья"]);
  expect(JSON.parse(localStorage.getItem("toDoItems")).map((item) => item.text)).toEqual([
    "Третья",
    "Первая",
    "Вторая",
  ]);
});

test("updates note order while the pointer moves and commits it on release", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(getRenderedTodoTexts()).toEqual(["Третья", "Вторая", "Первая"]);

  mockTodoRects(["Третья", "Вторая", "Первая"]);
  pointerReorderTodo("Третья", { moveY: 200, commit: false });

  expect(getRenderedTodoTexts()).toEqual(["Вторая", "Третья", "Первая"]);
  expect(JSON.parse(localStorage.getItem("toDoItems")).map((item) => item.text)).toEqual([
    "Первая",
    "Вторая",
    "Третья",
  ]);

  act(() => {
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  expect(JSON.parse(localStorage.getItem("toDoItems")).map((item) => item.text)).toEqual([
    "Первая",
    "Третья",
    "Вторая",
  ]);
});

test("marks notes as pointer draggable without framer drag scale props", () => {
  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByTestId("todo-item-Первая")).toHaveAttribute("data-drag-enabled", "true");
  expect(screen.getByTestId("todo-item-Первая")).not.toHaveAttribute("data-while-drag");
});

test("uses a short layout animation for draggable note movement", () => {
  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByTestId("todo-item-Первая")).toHaveAttribute(
    "data-layout-transition",
    JSON.stringify({ duration: 0.2, ease: [0.22, 1, 0.36, 1] })
  );
});

test("disables note dragging while search is active", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.type(screen.getByLabelText("Поиск заметок"), "первая");

  expect(screen.getByTestId("todo-item-Первая")).toHaveAttribute("data-drag-enabled", "false");
});

test("reorders notes inside the selected category", () => {
  localStorage.setItem(
    "toDoItems",
    JSON.stringify([
      {
        id: "home-first",
        text: "Дом первая",
        favorite: false,
        checked: false,
        profile: "home",
        date: "today",
      },
      {
        id: "work-task",
        text: "Работа",
        favorite: false,
        checked: false,
        profile: "work",
        date: "today",
      },
      {
        id: "home-second",
        text: "Дом вторая",
        favorite: false,
        checked: false,
        profile: "home",
        date: "today",
      },
    ])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.click(screen.getByText("home"));

  expect(getRenderedTodoTexts()).toEqual(["Дом вторая", "Дом первая"]);
  expect(screen.getByTestId("todo-item-Дом первая")).toHaveAttribute(
    "data-drag-enabled",
    "true"
  );

  mockTodoRects(["Дом вторая", "Дом первая"]);
  pointerReorderTodo("Дом вторая", { moveY: 180 });

  expect(getRenderedTodoTexts()).toEqual(["Дом первая", "Дом вторая"]);
  expect(JSON.parse(localStorage.getItem("toDoItems")).map((item) => item.text)).toEqual([
    "Дом вторая",
    "Работа",
    "Дом первая",
  ]);
});

test("canceling edit restores the previous draft", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Черновик");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Новая заметка");

  const task = screen.getByTestId("todo-item-Черновик");
  userEvent.click(within(task).getByRole("button", { name: "Редактировать" }));
  expect(input).toHaveValue("Черновик");

  userEvent.click(screen.getByRole("button", { name: "Отменить редактирование" }));

  expect(input).toHaveValue("Новая заметка");
});

test("deletes a task after confirmation", () => {
  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Удалить меня");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  const task = screen.getByTestId("todo-item-Удалить меня");
  userEvent.click(within(task).getByRole("button", { name: "Удалить" }));
  userEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));

  expect(screen.queryByText("Удалить меня")).not.toBeInTheDocument();
  expect(screen.getByText("Заметок: 0")).toBeInTheDocument();
});

test("deletes a task with Enter while the confirmation popup is open", () => {
  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Удалить через Enter");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  const task = screen.getByTestId("todo-item-Удалить через Enter");
  userEvent.click(within(task).getByRole("button", { name: "Удалить" }));
  userEvent.keyboard("{Enter}");

  expect(screen.queryByText("Удалить через Enter")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Вы точно хотите удалить этот элемент?")
  ).not.toBeInTheDocument();
  expect(screen.getByText("Заметок: 0")).toBeInTheDocument();
});

test("deletes completed tasks from the header action", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Готовая задача");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Активная задача");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  const completedTask = screen.getByTestId("todo-item-Готовая задача");
  userEvent.click(
    within(completedTask).getByRole("button", { name: "Отметить выполненным" })
  );
  userEvent.click(screen.getByRole("button", { name: "Удалить выполненные" }));

  expect(screen.queryByText("Готовая задача")).not.toBeInTheDocument();
  expect(screen.getByText("Активная задача")).toBeInTheDocument();
  expect(screen.getByText("Заметок: 1")).toBeInTheDocument();
});

test("adds a custom profile from the profile filter", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.click(screen.getByText("Добавить +"));
  userEvent.type(screen.getByLabelText("Название профиля"), "errands");
  userEvent.click(screen.getByRole("button", { name: "Добавить профиль" }));

  expect(screen.getByRole("button", { name: "Открыть список: errands" })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("Profiles"))).toEqual([
    expect.objectContaining({ name: "errands" }),
  ]);

  userEvent.type(screen.getByLabelText("Текст заметки"), "Задача в новом профиле");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByText("Профиль: errands")).toBeInTheDocument();
});

test("prefills the add profile popup from the filter search", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), "errands");
  userEvent.click(screen.getByText("Добавить +"));

  expect(screen.getByLabelText("Название профиля")).toHaveValue("errands");
});

test("limits custom profile names to 32 characters", () => {
  const longProfileName = "abcdefghijklmnopqrstuvwxyz1234567890";
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), longProfileName);
  userEvent.click(screen.getByText("Добавить +"));

  expect(screen.getByLabelText("Название профиля")).toHaveValue(
    longProfileName.slice(0, 32)
  );
  expect(screen.getByText("32/32")).toBeInTheDocument();
});

test("does not allow adding a duplicate profile name", () => {
  localStorage.setItem(
    "Profiles",
    JSON.stringify([{ id: "custom-errands", name: "errands", createdAt: 20 }])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), " Errands ");
  userEvent.click(screen.getByText("Добавить +"));

  expect(screen.getByText("Такая категория уже существует")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Добавить профиль" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Открыть список: all" })).toBeInTheDocument();
});

test("deletes a custom profile from the profile filter", () => {
  localStorage.setItem(
    "Profiles",
    JSON.stringify([{ id: "custom-errands", name: "errands", createdAt: 20 }])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  expect(screen.getByText("errands")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Удалить фильтр errands" }));

  expect(screen.queryByText("errands")).not.toBeInTheDocument();
  expect(localStorage.getItem("Profiles")).toBeNull();
});

test("deletes an empty custom profile without confirmation", () => {
  localStorage.setItem(
    "Profiles",
    JSON.stringify([{ id: "custom-empty", name: "empty", createdAt: 20 }])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.click(screen.getByRole("button", { name: "Удалить фильтр empty" }));

  expect(screen.queryByText("В категории есть заметки")).not.toBeInTheDocument();
  expect(screen.queryByText("empty")).not.toBeInTheDocument();
  expect(localStorage.getItem("Profiles")).toBeNull();
});

test("warns before deleting a profile with tasks and removes its tasks after confirmation", () => {
  localStorage.setItem(
    "Profiles",
    JSON.stringify([{ id: "custom-errands", name: "errands", createdAt: 20 }])
  );
  localStorage.setItem(
    "toDoItems",
    JSON.stringify([
      {
        id: "task-errands",
        text: "Купить кофе",
        favorite: false,
        checked: false,
        profile: "errands",
        date: "today",
      },
      {
        id: "task-home",
        text: "Полить цветы",
        favorite: false,
        checked: false,
        profile: "home",
        date: "today",
      },
    ])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.click(screen.getByRole("button", { name: "Удалить фильтр errands" }));

  expect(screen.getByText("В категории есть заметки")).toBeInTheDocument();
  expect(screen.getByText("Купить кофе")).toBeInTheDocument();
  expect(screen.getByText("Полить цветы")).toBeInTheDocument();

  userEvent.click(
    screen.getByRole("button", { name: "Подтвердить удаление категории" })
  );

  expect(screen.queryByText("Купить кофе")).not.toBeInTheDocument();
  expect(screen.getByText("Полить цветы")).toBeInTheDocument();
  expect(screen.queryByText("errands")).not.toBeInTheDocument();
  expect(screen.getByText("Заметок: 1")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("toDoItems"))).toEqual([
    expect.objectContaining({ text: "Полить цветы", profile: "home" }),
  ]);
  expect(localStorage.getItem("Profiles")).toBeNull();
});

test("searches custom profile filters by name", () => {
  localStorage.setItem(
    "Profiles",
    JSON.stringify([
      { id: "custom-errands", name: "errands", createdAt: 20 },
      { id: "custom-reading", name: "reading", createdAt: 30 },
    ])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), "read");

  expect(screen.getByText("reading")).toBeInTheDocument();
  expect(screen.queryByText("errands")).not.toBeInTheDocument();
});

test("sorts custom profile filters by name", () => {
  localStorage.setItem(
    "Profiles",
    JSON.stringify([
      { id: "custom-zeta", name: "zeta", createdAt: 30 },
      { id: "custom-alpha", name: "alpha", createdAt: 10 },
    ])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  const listBeforeSort = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(listBeforeSort.map((item) => item.textContent)).toEqual([
    "all",
    "home",
    "work",
    "study",
    "zeta",
    "alpha",
    "Добавить +",
  ]);

  userEvent.click(screen.getByRole("button", { name: "Сортировать фильтры по имени" }));

  const listAfterSort = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(listAfterSort.map((item) => item.textContent)).toEqual([
    "all",
    "home",
    "work",
    "study",
    "alpha",
    "zeta",
    "Добавить +",
  ]);
});
