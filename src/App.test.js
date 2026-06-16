import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import path from "path";
import App from "./App";
import ToDoProvider from "./context/ToDoProvider/ToDoProvider";

jest.mock("./image/delete.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/alarm.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/calendar-day.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/clock.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/edit.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/cancel.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/heart.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/heartFill.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/settings.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/search.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/user.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/checkBoxActive.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/checkBoxDisable.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/check.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/add.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/align-justify.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/calendar-note.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/arrow-left.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/arrow-right.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/threeColumn.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/threeRow.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/chevronDown.svg", () => ({ ReactComponent: () => null }));
jest.mock("./image/chevronUp.svg", () => ({ ReactComponent: () => null }));

const TEST_ACCOUNT = {
  id: "test-user",
  username: "test",
  password: "password",
};

function accountStorageKey(key, accountId = TEST_ACCOUNT.id) {
  return `todo:user:${accountId}:${key}`;
}

function getAccountStorageValue(key, accountId = TEST_ACCOUNT.id) {
  return localStorage.getItem(accountStorageKey(key, accountId));
}

function getAccountJsonValue(key, accountId = TEST_ACCOUNT.id) {
  const value = getAccountStorageValue(key, accountId);
  return value ? JSON.parse(value) : null;
}

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
      div: React.forwardRef(
        (
          {
            children,
            layout,
            transition,
            variants,
            initial,
            animate,
            exit,
            custom,
            ...props
          },
          ref
        ) => (
        <div
          ref={ref}
          data-layout-transition={
            layout && transition?.layout ? JSON.stringify(transition.layout) : undefined
          }
          data-motion-animate={animate}
          data-motion-custom={custom}
          data-motion-exit={exit}
          data-motion-initial={initial}
          data-motion-variants={variants ? Object.keys(variants).join("|") : undefined}
          {...sanitizeMotionProps(props)}
        >
          {children}
        </div>
        )
      ),
      ul: React.forwardRef(({ children, ...props }, ref) => (
        <ul ref={ref} {...props}>
          {children}
        </ul>
      )),
    },
  };
});

function seedTestAccount() {
  localStorage.setItem("todoAccounts", JSON.stringify([TEST_ACCOUNT]));
  localStorage.setItem("todoCurrentAccountId", TEST_ACCOUNT.id);

  ["toDoItems", "Categories", "Profiles", "theme", "weekStart", "language"].forEach((key) => {
    const legacyValue = localStorage.getItem(key);

    if (legacyValue !== null) {
      localStorage.setItem(accountStorageKey(key), legacyValue);
    }
  });
}

function renderTodoApp({ authenticated = true } = {}) {
  if (authenticated) {
    seedTestAccount();
  }

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

function createPointerLikeEvent(type, options) {
  const event = new MouseEvent(type, options);
  Object.defineProperty(event, "pointerType", {
    value: options.pointerType,
  });
  return event;
}

function pointerReorderTodo(text, { startY = 50, moveY, commit = true }) {
  act(() => {
    screen.getByTestId(`todo-item-${text}`).dispatchEvent(
      createPointerLikeEvent("pointerdown", {
        bubbles: true,
        button: 0,
        cancelable: true,
        clientY: startY,
        pointerType: "mouse",
      })
    );
  });
  act(() => {
    window.dispatchEvent(
      createPointerLikeEvent("pointermove", {
        clientY: moveY,
        pointerType: "mouse",
      })
    );
  });

  if (commit) {
    act(() => {
      window.dispatchEvent(
        createPointerLikeEvent("pointerup", { pointerType: "mouse" })
      );
    });
  }
}

function mockCoarsePointer(matches = true) {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: query === "(pointer: coarse)" ? matches : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));

  return () => {
    window.matchMedia = originalMatchMedia;
  };
}

function mockSystemPreferences({ language = "ru-RU", colorScheme = "light" } = {}) {
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: language,
  });
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches:
      query === "(prefers-color-scheme: dark)"
        ? colorScheme === "dark"
        : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

function createTouchLikeEvent(type, { clientY, cancelable = true }) {
  const event = new Event(type, {
    bubbles: true,
    cancelable,
  });
  Object.defineProperty(event, "touches", {
    value: clientY === undefined ? [] : [{ clientY }],
  });
  Object.defineProperty(event, "changedTouches", {
    value: clientY === undefined ? [] : [{ clientY }],
  });
  return event;
}

function getDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDayLabel(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).replace(/\sг\.$/, "");
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = jest.fn();
  mockSystemPreferences();
});

test("shows the auth screen before signing in", () => {
  renderTodoApp({ authenticated: false });

  expect(screen.getByRole("heading", { name: "Вход в аккаунт" })).toBeInTheDocument();
  expect(screen.getByLabelText("Имя пользователя")).toBeInTheDocument();
  expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
  expect(screen.queryByText("Ваш список пуст, пора что-то добавить!")).not.toBeInTheDocument();
});

test("registers, signs out, and signs in again", () => {
  renderTodoApp({ authenticated: false });

  userEvent.type(screen.getByLabelText("Имя пользователя"), "alice");
  userEvent.type(screen.getByLabelText("Пароль"), "secret");
  userEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

  expect(screen.getByText("Ваш список пуст, пора что-то добавить!")).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: "Открыть меню аккаунта alice" }));
  expect(screen.getByLabelText("Аккаунт: alice")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));

  userEvent.type(screen.getByLabelText("Имя пользователя"), "alice");
  userEvent.type(screen.getByLabelText("Пароль"), "secret");
  userEvent.click(screen.getByRole("button", { name: "Войти" }));

  userEvent.click(screen.getByRole("button", { name: "Открыть меню аккаунта alice" }));
  expect(screen.getByLabelText("Аккаунт: alice")).toBeInTheDocument();
});

test("keeps notes isolated between local accounts", () => {
  renderTodoApp({ authenticated: false });

  userEvent.type(screen.getByLabelText("Имя пользователя"), "alice");
  userEvent.type(screen.getByLabelText("Пароль"), "secret");
  userEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));
  userEvent.type(screen.getByLabelText("Текст заметки"), "Заметка Алисы");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть меню аккаунта alice" }));
  userEvent.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));

  userEvent.type(screen.getByLabelText("Имя пользователя"), "bob");
  userEvent.type(screen.getByLabelText("Пароль"), "secret");
  userEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

  expect(screen.queryByTestId("todo-item-Заметка Алисы")).not.toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Открыть меню аккаунта bob" }));
  userEvent.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));
  userEvent.type(screen.getByLabelText("Имя пользователя"), "alice");
  userEvent.type(screen.getByLabelText("Пароль"), "secret");
  userEvent.click(screen.getByRole("button", { name: "Войти" }));

  expect(screen.getByTestId("todo-item-Заметка Алисы")).toBeInTheDocument();
});

test("imports existing local data into the first registered account", () => {
  localStorage.setItem(
    "toDoItems",
    JSON.stringify([
      {
        id: "legacy-task",
        text: "Старая заметка",
        favorite: false,
        checked: false,
        category: "home",
        date: "today",
      },
    ])
  );
  localStorage.setItem("theme", "1");

  renderTodoApp({ authenticated: false });

  userEvent.type(screen.getByLabelText("Имя пользователя"), "alice");
  userEvent.type(screen.getByLabelText("Пароль"), "secret");
  userEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

  expect(screen.getByTestId("todo-item-Старая заметка")).toBeInTheDocument();
  const accountId = JSON.parse(localStorage.getItem("todoAccounts"))[0].id;
  expect(getAccountJsonValue("toDoItems", accountId)).toEqual([
    expect.objectContaining({ text: "Старая заметка" }),
  ]);
  expect(getAccountStorageValue("theme", accountId)).toBe("1");
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

test("scrolls to the top after creating a note", () => {
  window.scrollTo = jest.fn();
  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Вернуться наверх");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
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

test("adds deadlines and keeps them visible on task cards", () => {
  const today = getDateInputValue(new Date());
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Сегодняшняя задача");
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  fireEvent.change(screen.getByLabelText("Дедлайн"), {
    target: { value: today },
  });
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.type(input, "Задача без дедлайна");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByText("Дедлайн: Сегодня")).toBeInTheDocument();
  expect(screen.getByText("Сегодняшняя задача")).toBeInTheDocument();
  expect(screen.getByText("Задача без дедлайна")).toBeInTheDocument();
  expect(screen.getByText("Заметок: 2")).toBeInTheDocument();
});

test("shows deadline clear action as part of the selected deadline control", () => {
  const today = getDateInputValue(new Date());
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  fireEvent.change(screen.getByLabelText("Дедлайн"), {
    target: { value: today },
  });

  expect(screen.getByRole("button", { name: "Выбрать дедлайн" }))
    .toHaveTextContent("Сегодня");
  userEvent.click(screen.getByRole("button", { name: "Очистить дедлайн Сегодня" }));

  expect(screen.queryByRole("button", { name: "Очистить дедлайн Сегодня" }))
    .not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Выбрать дедлайн" }))
    .toHaveTextContent("Дедлайн");
});

test("adds deadline time and keeps the task in the selected calendar day", () => {
  const today = getDateInputValue(new Date());
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Созвон в обед");
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  fireEvent.change(screen.getByLabelText("Дедлайн"), {
    target: { value: today },
  });
  fireEvent.change(screen.getByLabelText("Время дедлайна"), {
    target: { value: "14:30" },
  });
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByText("Дедлайн: Сегодня, 14:30")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(
    screen.getByRole("button", { name: `Открыть день ${getCalendarDayLabel(today)}` })
  );

  const deadlineSection = screen.getByLabelText("Дедлайны выбранного дня");
  expect(within(deadlineSection).getByText("Созвон в обед")).toBeInTheDocument();
  expect(
    within(deadlineSection).getByText("Дедлайн: Сегодня, 14:30")
  ).toBeInTheDocument();
});

test("limits manual deadline date input to year 9999", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));

  const deadlineInput = screen.getByLabelText("Дедлайн");
  expect(deadlineInput).toHaveAttribute("max", "9999-12-31");

  fireEvent.change(deadlineInput, {
    target: { value: "10000-01-01" },
  });

  expect(deadlineInput).toHaveValue("9999-12-31");
});

test("sets a note deadline from the next clicked calendar day", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть день 18 июня 2026" }));

  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }));

  userEvent.type(screen.getByLabelText("Текст заметки"), "Задача с дедлайном из календаря");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByRole("heading", { name: "18 июня 2026" })).toBeInTheDocument();

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  expect(
    within(createdSection).getByText("Задача с дедлайном из календаря")
  ).toBeInTheDocument();
  expect(within(createdSection).getByText("Дедлайн: 20.06.2026")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Открыть день 20 июня 2026" }));

  const deadlineSection = screen.getByLabelText("Дедлайны выбранного дня");
  expect(
    within(deadlineSection).getByText("Задача с дедлайном из календаря")
  ).toBeInTheDocument();
});

test("shows manual deadline fields while picking a deadline from calendar", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));

  expect(screen.getByLabelText("Дедлайн")).toBeInTheDocument();
  expect(screen.getByLabelText("Время дедлайна")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" })
  ).toBeInTheDocument();
});

test("switches calendar month from the month picker", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать месяц июнь" }));

  expect(screen.getByRole("button", { name: "Установить месяц март" }))
    .toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Установить месяц март" }));

  expect(screen.getByRole("button", { name: "Выбрать месяц март" }))
    .toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Открыть день 1 марта 2026" }))
    .toBeInTheDocument();
});

test("switches calendar year from the year picker", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать год 2026" }));

  expect(screen.getByRole("button", { name: "Установить год 2027" }))
    .toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Установить год 2027" }));

  expect(screen.getByRole("button", { name: "Выбрать год 2027" }))
    .toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Открыть день 1 июня 2027" }))
    .toBeInTheDocument();
});

test("animates calendar month and picker transitions", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  const daysTransition = screen.getByTestId("calendar-transition-days");
  expect(daysTransition).toHaveAttribute(
    "data-motion-variants",
    "enter|center|exit"
  );
  expect(daysTransition).toHaveAttribute("data-motion-initial", "enter");
  expect(daysTransition).toHaveAttribute("data-motion-animate", "center");
  expect(daysTransition).toHaveAttribute("data-motion-exit", "exit");
  expect(daysTransition).toHaveAttribute("data-motion-custom", "0");

  userEvent.click(screen.getByRole("button", { name: "Следующий месяц" }));

  const nextMonthTransition = screen.getByTestId("calendar-transition-days");
  expect(nextMonthTransition).toHaveAttribute("data-motion-custom", "1");

  userEvent.click(screen.getByRole("button", { name: "Выбрать месяц июль" }));

  const monthsTransition = screen.getByTestId("calendar-transition-months");
  expect(monthsTransition).toHaveAttribute(
    "data-motion-variants",
    "enter|center|exit"
  );
});

test("marks today's calendar date with a dashed outline", () => {
  const calendarStyles = fs.readFileSync(
    path.join(__dirname, "components/CalendarView/CalendarView.module.scss"),
    "utf8"
  );

  expect(calendarStyles).toMatch(/\.today\s*{[^}]*outline:\s*1px dashed var\(--link\);/);
});

test("marks current month and year pickers with a dashed outline", () => {
  const currentDate = new Date();
  const currentMonth = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
  }).format(currentDate);
  const currentYear = currentDate.getFullYear();
  const calendarStyles = fs.readFileSync(
    path.join(__dirname, "components/CalendarView/CalendarView.module.scss"),
    "utf8"
  );

  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: `Выбрать месяц ${currentMonth}` }));

  expect(screen.getByRole("button", { name: `Установить месяц ${currentMonth}` }))
    .toHaveClass("todayPickerCell");

  userEvent.click(screen.getByRole("button", { name: `Выбрать год ${currentYear}` }));

  expect(screen.getByRole("button", { name: `Установить год ${currentYear}` }))
    .toHaveClass("todayPickerCell");
  expect(calendarStyles).toMatch(
    /\.todayPickerCell\s*{[^}]*outline:\s*1px dashed var\(--link\);/
  );
});

test("uses full calendar day stat labels until the layout is narrow", () => {
  const calendarStyles = fs.readFileSync(
    path.join(__dirname, "components/CalendarView/CalendarView.module.scss"),
    "utf8"
  );

  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Подписи календаря");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  expect(screen.getByText("1 добавлено")).toHaveClass("statFull");
  expect(screen.getByText("1 доб.")).toHaveClass("statShort");
  expect(calendarStyles).toMatch(/\.statFull\s*{\s*display:\s*inline;/);
  expect(calendarStyles).toMatch(/\.statShort\s*{\s*display:\s*none;/);
  expect(calendarStyles).toMatch(/\.statFull\s*{\s*display:\s*none;/);
  expect(calendarStyles).toMatch(/\.statShort\s*{\s*display:\s*inline;/);
});

test("uses tighter calendar spacing on phones", () => {
  const calendarStyles = fs.readFileSync(
    path.join(__dirname, "components/CalendarView/CalendarView.module.scss"),
    "utf8"
  );

  expect(calendarStyles).toMatch(
    /@media \(max-width:\s*520px\)[\s\S]*\.calendarPanel,\s*\.dayPanel\s*{[\s\S]*padding:\s*8px;/
  );
  expect(calendarStyles).toMatch(
    /@media \(max-width:\s*520px\)[\s\S]*\.weekDays,\s*\.monthGrid\s*{[\s\S]*gap:\s*4px;/
  );
  expect(calendarStyles).toMatch(
    /@media \(max-width:\s*520px\)[\s\S]*\.dayCell\s*{[\s\S]*min-height:\s*60px;/
  );
});

test("centers calendar title between arrow controls on phones", () => {
  const calendarCode = fs.readFileSync(
    path.join(__dirname, "components/CalendarView/CalendarView.jsx"),
    "utf8"
  );
  const calendarStyles = fs.readFileSync(
    path.join(__dirname, "components/CalendarView/CalendarView.module.scss"),
    "utf8"
  );

  expect(calendarCode).toMatch(/SvgArrowLeft/);
  expect(calendarCode).toMatch(/SvgArrowRight/);
  expect(calendarStyles).toMatch(
    /@media \(max-width:\s*520px\)[\s\S]*\.calendarHeader\s*{[\s\S]*grid-template-columns:\s*36px minmax\(0,\s*1fr\) 36px;/
  );
  expect(calendarStyles).toMatch(
    /@media \(max-width:\s*520px\)[\s\S]*\.calendarTitle\s*{[\s\S]*justify-self:\s*center;/
  );
});

test("opens settings and saves theme, week start, and language", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть настройки" }));

  expect(
    screen.getByRole("heading", { name: "Настройки" })
  ).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Выбрать тему dark" }));
  userEvent.click(
    screen.getByRole("button", { name: "Начинать неделю с воскресенья" })
  );
  userEvent.click(screen.getByRole("button", { name: "Выбрать английский язык" }));

  expect(getAccountStorageValue("theme")).toBe("1");
  expect(getAccountStorageValue("weekStart")).toBe("sunday");
  expect(getAccountStorageValue("language")).toBe("en");
});

test("uses device language and color scheme for a new account", () => {
  mockSystemPreferences({ language: "en-US", colorScheme: "dark" });
  renderTodoApp({ authenticated: false });

  userEvent.type(screen.getByLabelText("Username"), "system");
  userEvent.type(screen.getByLabelText("Password"), "secret");
  userEvent.click(screen.getByRole("button", { name: "Create account" }));

  expect(screen.getByText("Your list is empty. Time to add something!"))
    .toBeInTheDocument();
  expect(screen.getByText("Notes: 0")).toBeInTheDocument();
  expect(document.documentElement).toHaveClass("darkTheme");

  const accounts = JSON.parse(localStorage.getItem("todoAccounts"));
  expect(localStorage.getItem(accountStorageKey("language", accounts[0].id)))
    .toBe("en");
  expect(localStorage.getItem(accountStorageKey("theme", accounts[0].id)))
    .toBe("1");
});

test("switches interface text to English from settings", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть настройки" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать английский язык" }));

  expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open notes list" })).toHaveTextContent(
    "List"
  );
  expect(screen.getByLabelText("Search notes")).toBeInTheDocument();
  expect(screen.getByText("Notes: 0")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Go back" }));

  expect(
    screen.getByText("Your list is empty. Time to add something!")
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add note" })).toHaveTextContent("Add");
});

test("toggles settings back to the previous view", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть настройки" }));
  expect(screen.getByRole("heading", { name: "Настройки" })).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Вернуться назад" }));
  expect(screen.getByText("Ваш список пуст, пора что-то добавить!")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть настройки" }));
  expect(screen.getByRole("heading", { name: "Настройки" })).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Вернуться назад" }));
  expect(screen.getByLabelText("Дни недели")).toBeInTheDocument();
});

test("uses selected week start in calendar", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть настройки" }));
  userEvent.click(
    screen.getByRole("button", { name: "Начинать неделю с воскресенья" })
  );
  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  const weekDays = [...screen.getByLabelText("Дни недели").children].map(
    (item) => item.textContent
  );

  expect(weekDays).toEqual(["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]);
  expect(screen.getByRole("button", { name: "Открыть день 31 мая 2026" }))
    .toBeInTheDocument();
});

test("keeps the selected calendar deadline highlighted until the note is added", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }));

  expect(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }))
    .toHaveClass("selectedDeadlineDay");
  expect(screen.getByLabelText("Дедлайн")).toHaveValue("2026-06-20");

  userEvent.type(screen.getByLabelText("Текст заметки"), "Красная дата дедлайна");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByRole("button", { name: "Выбрать дедлайн" })).toHaveTextContent(
    "Дедлайн"
  );
  expect(screen.getByRole("button", { name: "Открыть день 20 июня 2026" }))
    .not.toHaveClass("selectedDeadlineDay");
  expect(
    screen.queryByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" })
  ).not.toBeInTheDocument();
});

test("stops calendar deadline picking after adding a note with Enter", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }));
  userEvent.type(screen.getByLabelText("Текст заметки"), "Дедлайн через Enter");

  fireEvent.keyDown(window, { key: "Enter" });

  expect(screen.getByRole("button", { name: "Выбрать дедлайн" })).toHaveTextContent(
    "Дедлайн"
  );
  expect(screen.getByRole("button", { name: "Открыть день 20 июня 2026" }))
    .not.toHaveClass("selectedDeadlineDay");
  expect(
    screen.queryByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" })
  ).not.toBeInTheDocument();
});

test("keeps calendar deadline picking when Enter is pressed with empty input", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }));
  const deadlineButtonText = screen.getByRole("button", {
    name: "Выбрать дедлайн",
  }).textContent;

  fireEvent.keyDown(window, { key: "Enter" });

  expect(screen.getByLabelText("Дедлайн")).toHaveValue("2026-06-20");
  expect(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }))
    .toHaveClass("selectedDeadlineDay");
  expect(screen.getByRole("button", { name: "Выбрать дедлайн" })).toHaveTextContent(
    deadlineButtonText
  );
});

test("continues deadline picking after opening deadline in list and switching to calendar", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  expect(screen.getByRole("button", { name: "Выбрать дедлайн" })).toHaveTextContent(
    "Выберите дату"
  );

  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }));
  userEvent.type(screen.getByLabelText("Текст заметки"), "Дедлайн после перехода");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByText("Дедлайн: 20.06.2026")).toBeInTheDocument();
});

test("shows notes created on a selected day and deadlines in calendar view", () => {
  const today = getDateInputValue(new Date());
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Создано сегодня");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.type(input, "Дедлайн сегодня");
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  fireEvent.change(screen.getByLabelText("Дедлайн"), {
    target: { value: today },
  });
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(
    screen.getByRole("button", { name: `Открыть день ${getCalendarDayLabel(today)}` })
  );

  expect(
    screen.getByRole("heading", { name: getCalendarDayLabel(today) })
  ).toBeInTheDocument();

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  expect(within(createdSection).getByText("Создано сегодня")).toBeInTheDocument();
  expect(within(createdSection).getByText("Дедлайн сегодня")).toBeInTheDocument();

  const deadlineSection = screen.getByLabelText("Дедлайны выбранного дня");
  expect(within(deadlineSection).getByText("Дедлайн сегодня")).toBeInTheDocument();
  expect(within(deadlineSection).queryByText("Создано сегодня")).not.toBeInTheDocument();
});

test("highlights calendar days and note text when calendar search finds matches", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть день 18 июня 2026" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн" }));
  userEvent.click(screen.getByRole("button", { name: "Выбрать дедлайн: 20 июня 2026" }));
  userEvent.type(screen.getByLabelText("Текст заметки"), "уважаемые календарные планы");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.type(screen.getByLabelText("Поиск заметок"), "увожаемые");

  expect(screen.getByRole("button", { name: "Открыть день 18 июня 2026" }))
    .toHaveClass("searchMatchDay");
  expect(screen.getByRole("button", { name: "Открыть день 20 июня 2026" }))
    .toHaveClass("searchMatchDay");

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  expect(within(createdSection).getByText("уважаемые").tagName).toBe("MARK");
});

test("adds a new note to the selected calendar day", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть день 18 июня 2026" }));

  userEvent.type(screen.getByLabelText("Текст заметки"), "План на 18 июня");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByRole("heading", { name: "18 июня 2026" })).toBeInTheDocument();

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  expect(within(createdSection).getByText("План на 18 июня")).toBeInTheDocument();
  expect(within(createdSection).getByText(/Дата: 18\.06\.2026/)).toBeInTheDocument();
});

test("keeps favorite notes first in calendar day sections", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Обычная календарная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Избранная календарная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.click(
    within(screen.getByTestId("todo-item-Избранная календарная")).getByRole(
      "button",
      { name: "Добавить в избранное" }
    )
  );

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  const renderedItems = [...createdSection.querySelectorAll('[data-testid^="todo-item-"]')]
    .map((item) => item.getAttribute("data-testid").replace("todo-item-", ""));

  expect(renderedItems).toEqual([
    "Избранная календарная",
    "Обычная календарная",
  ]);
});

test("orders calendar day sections by active and completed priority", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Активное избранное в календаре");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Активная обычная в календаре");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Выполненное избранное в календаре");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Выполненная обычная в календаре");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  const activeFavorite = screen.getByTestId(
    "todo-item-Активное избранное в календаре"
  );
  const completedFavorite = screen.getByTestId(
    "todo-item-Выполненное избранное в календаре"
  );
  const completedRegular = screen.getByTestId(
    "todo-item-Выполненная обычная в календаре"
  );

  userEvent.click(
    within(activeFavorite).getByRole("button", { name: "Добавить в избранное" })
  );
  userEvent.click(
    within(completedFavorite).getByRole("button", { name: "Добавить в избранное" })
  );
  userEvent.click(
    within(completedFavorite).getByRole("button", { name: "Отметить выполненным" })
  );
  userEvent.click(
    within(completedRegular).getByRole("button", { name: "Отметить выполненным" })
  );

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  const renderedItems = [...createdSection.querySelectorAll('[data-testid^="todo-item-"]')]
    .map((item) => item.getAttribute("data-testid").replace("todo-item-", ""));

  expect(renderedItems).toEqual([
    "Активное избранное в календаре",
    "Активная обычная в календаре",
    "Выполненное избранное в календаре",
    "Выполненная обычная в календаре",
  ]);
});

test("reorders notes inside the selected calendar day", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первый календарный drag");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Второй календарный drag");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третий календарный drag");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects([
    "Первый календарный drag",
    "Второй календарный drag",
    "Третий календарный drag",
  ]);
  pointerReorderTodo("Первый календарный drag", { moveY: 340 });

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  const renderedItems = [...createdSection.querySelectorAll('[data-testid^="todo-item-"]')]
    .map((item) => item.getAttribute("data-testid").replace("todo-item-", ""));

  expect(renderedItems).toEqual([
    "Второй календарный drag",
    "Третий календарный drag",
    "Первый календарный drag",
  ]);
});

test("does not reorder calendar notes from a mobile scroll gesture", () => {
  const restoreMatchMedia = mockCoarsePointer(true);
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первый календарный scroll");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Второй календарный scroll");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третий календарный scroll");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects([
    "Первый календарный scroll",
    "Второй календарный scroll",
    "Третий календарный scroll",
  ]);

  const pointerDown = createPointerLikeEvent("pointerdown", {
    bubbles: true,
    button: -1,
    cancelable: true,
    clientY: 50,
    pointerType: "touch",
  });
  screen.getByTestId("todo-item-Первый календарный scroll").dispatchEvent(pointerDown);

  act(() => {
    window.dispatchEvent(
      createPointerLikeEvent("pointermove", {
        clientY: 130,
        pointerType: "touch",
      })
    );
    window.dispatchEvent(
      createPointerLikeEvent("pointerup", { pointerType: "touch" })
    );
  });

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  const renderedItems = [...createdSection.querySelectorAll('[data-testid^="todo-item-"]')]
    .map((item) => item.getAttribute("data-testid").replace("todo-item-", ""));

  expect(renderedItems).toEqual([
    "Первый календарный scroll",
    "Второй календарный scroll",
    "Третий календарный scroll",
  ]);
  restoreMatchMedia();
});

test("starts calendar reordering after long press with native touch events", () => {
  const restoreMatchMedia = mockCoarsePointer(true);
  jest.useFakeTimers();
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первый календарный touch");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Второй календарный touch");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третий календарный touch");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects([
    "Первый календарный touch",
    "Второй календарный touch",
    "Третий календарный touch",
  ]);

  const item = screen.getByTestId("todo-item-Первый календарный touch");
  item.dispatchEvent(
    createPointerLikeEvent("pointerdown", {
      bubbles: true,
      button: -1,
      cancelable: true,
      clientY: 50,
      pointerType: "touch",
    })
  );
  item.dispatchEvent(createTouchLikeEvent("touchstart", { clientY: 50 }));

  act(() => {
    jest.advanceTimersByTime(500);
  });
  act(() => {
    window.dispatchEvent(createTouchLikeEvent("touchmove", { clientY: 340 }));
    window.dispatchEvent(createTouchLikeEvent("touchend", {}));
  });

  const createdSection = screen.getByLabelText("Заметки, добавленные в выбранный день");
  const renderedItems = [...createdSection.querySelectorAll('[data-testid^="todo-item-"]')]
    .map((item) => item.getAttribute("data-testid").replace("todo-item-", ""));

  expect(renderedItems).toEqual([
    "Второй календарный touch",
    "Третий календарный touch",
    "Первый календарный touch",
  ]);
  restoreMatchMedia();
  jest.useRealTimers();
});

test("deletes completed tasks only for the selected calendar day after confirmation", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть календарь" }));
  userEvent.click(screen.getByRole("button", { name: "Открыть день 18 июня 2026" }));

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Готово на 18 июня");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Активно на 18 июня");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.click(
    within(screen.getByTestId("todo-item-Готово на 18 июня")).getByRole(
      "button",
      { name: "Отметить выполненным" }
    )
  );

  userEvent.click(screen.getByRole("button", { name: "Открыть день 20 июня 2026" }));
  userEvent.type(input, "Готово на 20 июня");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.click(
    within(screen.getByTestId("todo-item-Готово на 20 июня")).getByRole(
      "button",
      { name: "Отметить выполненным" }
    )
  );

  userEvent.click(screen.getByRole("button", { name: "Открыть день 18 июня 2026" }));
  userEvent.click(
    screen.getByRole("button", {
      name: "Удалить выполненные за 18 июня 2026",
    })
  );

  expect(screen.getByText("Удалить выполненные за 18 июня 2026?")).toBeInTheDocument();
  expect(screen.getByText("Будет удалено: 1. Это действие нельзя отменить."))
    .toBeInTheDocument();

  userEvent.click(
    screen.getByRole("button", { name: "Подтвердить удаление выполненных" })
  );

  expect(screen.queryByText("Готово на 18 июня")).not.toBeInTheDocument();
  expect(screen.getByText("Активно на 18 июня")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Открыть день 20 июня 2026" }));
  expect(screen.getByText("Готово на 20 июня")).toBeInTheDocument();
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
  expect(getAccountJsonValue("toDoItems").map((item) => item.text)).toEqual([
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
  expect(getAccountJsonValue("toDoItems").map((item) => item.text)).toEqual([
    "Первая",
    "Вторая",
    "Третья",
  ]);

  act(() => {
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  expect(getAccountJsonValue("toDoItems").map((item) => item.text)).toEqual([
    "Первая",
    "Третья",
    "Вторая",
  ]);
});

test("does not start reordering from a mobile scroll gesture", () => {
  const restoreMatchMedia = mockCoarsePointer(true);
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects(["Третья", "Вторая", "Первая"]);

  const pointerDown = createPointerLikeEvent("pointerdown", {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientY: 50,
    pointerType: "touch",
  });
  screen.getByTestId("todo-item-Третья").dispatchEvent(pointerDown);
  expect(pointerDown.defaultPrevented).toBe(false);

  act(() => {
    window.dispatchEvent(
      createPointerLikeEvent("pointermove", {
        clientY: 130,
        pointerType: "touch",
      })
    );
    window.dispatchEvent(
      createPointerLikeEvent("pointerup", { pointerType: "touch" })
    );
  });

  expect(getRenderedTodoTexts()).toEqual(["Третья", "Вторая", "Первая"]);
  expect(getAccountJsonValue("toDoItems").map((item) => item.text)).toEqual([
    "Первая",
    "Вторая",
    "Третья",
  ]);
  restoreMatchMedia();
});

test("ignores mouse fallback events on touch devices", () => {
  const restoreMatchMedia = mockCoarsePointer(true);
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects(["Третья", "Вторая", "Первая"]);

  const mouseDown = new MouseEvent("mousedown", {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientY: 50,
  });
  screen.getByTestId("todo-item-Третья").dispatchEvent(mouseDown);
  expect(mouseDown.defaultPrevented).toBe(false);

  act(() => {
    window.dispatchEvent(new MouseEvent("mousemove", { clientY: 130 }));
    window.dispatchEvent(new MouseEvent("mouseup"));
  });

  expect(getRenderedTodoTexts()).toEqual(["Третья", "Вторая", "Первая"]);
  expect(getAccountJsonValue("toDoItems").map((item) => item.text)).toEqual([
    "Первая",
    "Вторая",
    "Третья",
  ]);
  restoreMatchMedia();
});

test("starts reordering after long press on touch devices", () => {
  const restoreMatchMedia = mockCoarsePointer(true);
  jest.useFakeTimers();
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects(["Третья", "Вторая", "Первая"]);

  screen.getByTestId("todo-item-Третья").dispatchEvent(
    createPointerLikeEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      button: -1,
      clientY: 50,
      pointerType: "touch",
    })
  );

  act(() => {
    jest.advanceTimersByTime(500);
  });
  act(() => {
    window.dispatchEvent(
      createPointerLikeEvent("pointermove", {
        clientY: 320,
        pointerType: "touch",
      })
    );
    window.dispatchEvent(
      createPointerLikeEvent("pointerup", { pointerType: "touch" })
    );
  });

  expect(getRenderedTodoTexts()).toEqual(["Вторая", "Первая", "Третья"]);
  restoreMatchMedia();
  jest.useRealTimers();
});

test("starts reordering after long press with native touch events", () => {
  const restoreMatchMedia = mockCoarsePointer(true);
  jest.useFakeTimers();
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects(["Третья", "Вторая", "Первая"]);

  screen
    .getByTestId("todo-item-Третья")
    .dispatchEvent(createTouchLikeEvent("touchstart", { clientY: 50 }));

  act(() => {
    jest.advanceTimersByTime(500);
  });
  act(() => {
    window.dispatchEvent(createTouchLikeEvent("touchmove", { clientY: 320 }));
    window.dispatchEvent(createTouchLikeEvent("touchend", {}));
  });

  expect(getRenderedTodoTexts()).toEqual(["Вторая", "Первая", "Третья"]);
  restoreMatchMedia();
  jest.useRealTimers();
});

test("starts list reordering when mobile pointerdown is followed by touchstart", () => {
  const restoreMatchMedia = mockCoarsePointer(true);
  jest.useFakeTimers();
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  mockTodoRects(["Третья", "Вторая", "Первая"]);

  const item = screen.getByTestId("todo-item-Третья");
  item.dispatchEvent(
    createPointerLikeEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      button: -1,
      clientY: 50,
      pointerType: "touch",
    })
  );
  item.dispatchEvent(createTouchLikeEvent("touchstart", { clientY: 50 }));

  act(() => {
    jest.advanceTimersByTime(500);
  });
  act(() => {
    window.dispatchEvent(createTouchLikeEvent("touchmove", { clientY: 320 }));
    window.dispatchEvent(createTouchLikeEvent("touchend", {}));
  });

  expect(getRenderedTodoTexts()).toEqual(["Вторая", "Первая", "Третья"]);
  restoreMatchMedia();
  jest.useRealTimers();
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
    "Categories",
    JSON.stringify([
      { id: "custom-home", name: "home", createdAt: 10 },
      { id: "custom-work", name: "work", createdAt: 20 },
    ])
  );
  localStorage.setItem(
    "toDoItems",
    JSON.stringify([
      {
        id: "home-first",
        text: "Дом первая",
        favorite: false,
        checked: false,
        category: "home",
        date: "today",
      },
      {
        id: "work-task",
        text: "Работа",
        favorite: false,
        checked: false,
        category: "work",
        date: "today",
      },
      {
        id: "home-second",
        text: "Дом вторая",
        favorite: false,
        checked: false,
        category: "home",
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
  expect(getAccountJsonValue("toDoItems").map((item) => item.text)).toEqual([
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

test("edits a note category from the composer", () => {
  localStorage.setItem(
    "Categories",
    JSON.stringify([{ id: "custom-work", name: "work", createdAt: 20 }])
  );
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Заметка для категории");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.click(
    within(screen.getByTestId("todo-item-Заметка для категории")).getByRole(
      "button",
      { name: "Редактировать" }
    )
  );

  userEvent.click(screen.getByRole("button", { name: "Выбрать категорию заметки" }));
  userEvent.click(screen.getByText("work"));
  userEvent.click(screen.getByRole("button", { name: "Сохранить заметку" }));

  expect(screen.getByText("Категория: work")).toBeInTheDocument();
  expect(getAccountJsonValue("toDoItems")).toEqual([
    expect.objectContaining({
      text: "Заметка для категории",
      category: "work",
    }),
  ]);
});

test("uses the edited note category as the composer category draft", () => {
  localStorage.setItem(
    "Categories",
    JSON.stringify([{ id: "custom-home", name: "home", createdAt: 10 }])
  );
  localStorage.setItem(
    "toDoItems",
    JSON.stringify([
      {
        id: "task-home",
        text: "Домашняя заметка",
        favorite: false,
        checked: false,
        category: "home",
        date: "today",
      },
    ])
  );
  renderTodoApp();

  userEvent.click(
    within(screen.getByTestId("todo-item-Домашняя заметка")).getByRole(
      "button",
      { name: "Редактировать" }
    )
  );

  expect(screen.getByRole("button", { name: "Выбрать категорию заметки" }))
    .toHaveTextContent("home");
});

test("selects a newly added category in the composer category draft", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Заметка для новой категории");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.click(
    within(screen.getByTestId("todo-item-Заметка для новой категории")).getByRole(
      "button",
      { name: "Редактировать" }
    )
  );
  userEvent.click(screen.getByRole("button", { name: "Выбрать категорию заметки" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), "later");
  userEvent.click(screen.getByText("Добавить +"));
  userEvent.click(screen.getByRole("button", { name: "Добавить категорию" }));

  expect(screen.getByRole("button", { name: "Выбрать категорию заметки" }))
    .toHaveTextContent("later");
});

test("shows clear composer action labels for add, save, and cancel", () => {
  renderTodoApp();

  expect(screen.getByRole("button", { name: "Добавить заметку" }))
    .toHaveTextContent("Добавить");

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Заметка для кнопок");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  userEvent.click(
    within(screen.getByTestId("todo-item-Заметка для кнопок")).getByRole(
      "button",
      { name: "Редактировать" }
    )
  );

  expect(screen.getByRole("button", { name: "Отменить редактирование" }))
    .toHaveTextContent("Отмена");
  expect(screen.getByRole("button", { name: "Сохранить заметку" }))
    .toHaveTextContent("Сохранить");
});

test("keeps composer actions neutral and wraps them on mobile", () => {
  const inputStyles = fs.readFileSync(
    path.join(__dirname, "components/ToDoInput/ToDoInput.module.scss"),
    "utf8"
  );

  expect(inputStyles).toMatch(/\.submitAction\s*{[^}]*background-color:\s*#fff\s*!important;/);
  expect(inputStyles).not.toMatch(/\.submitAction\s*{[^}]*background-color:\s*var\(--link\)\s*!important/);
  expect(inputStyles).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.submitAction\s*{[^}]*width:\s*38px;/);
  expect(inputStyles).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.submitAction span\s*{[^}]*display:\s*none;/);
  expect(inputStyles).not.toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.actions\s*{[^}]*width:\s*100%;/);
});

test("shows an alarm icon in the deadline button", () => {
  const inputCode = fs.readFileSync(
    path.join(__dirname, "components/ToDoInput/ToDoInput.jsx"),
    "utf8"
  );
  const inputStyles = fs.readFileSync(
    path.join(__dirname, "components/ToDoInput/ToDoInput.module.scss"),
    "utf8"
  );

  expect(inputCode).toMatch(/SvgAlarm/);
  expect(inputCode).toMatch(/className={s\.deadlineIcon}/);
  expect(inputCode).toMatch(/className={s\.clearDeadlineButton}/);
  expect(inputStyles).toMatch(/\.deadlineButton\s*{[\s\S]*display:\s*inline-flex;/);
  expect(inputStyles).toMatch(/\.deadlineGroup\s*{[\s\S]*display:\s*inline-flex;/);
  expect(inputStyles).toMatch(/\.deadlineGroup[\s\S]*\.clearDeadlineButton\s*{[\s\S]*border-left:\s*1px solid var\(--theme-30\);/);
  expect(inputStyles).toMatch(/\.deadlineIcon\s*{[\s\S]*width:\s*15px;/);
});

test("uses custom date and time icons in the deadline picker", () => {
  const inputCode = fs.readFileSync(
    path.join(__dirname, "components/ToDoInput/ToDoInput.jsx"),
    "utf8"
  );
  const inputStyles = fs.readFileSync(
    path.join(__dirname, "components/ToDoInput/ToDoInput.module.scss"),
    "utf8"
  );

  expect(inputCode).toMatch(/SvgCalendarDay/);
  expect(inputCode).toMatch(/SvgClock/);
  expect(inputCode).toMatch(/t\("deadline\.date"\)/);
  expect(inputCode).toMatch(/t\("deadline\.time"\)/);
  expect(inputStyles).toMatch(/\.deadlineFieldIcon\s*{[\s\S]*color:\s*var\(--text\);/);
  expect(inputStyles).toMatch(/\.deadlineFieldControl\s*{[\s\S]*gap:\s*6px;/);
  expect(inputStyles).toMatch(/\.deadlineDateControl input\s*{[^}]*width:\s*80px;/);
  expect(inputStyles).toMatch(/\.deadlineTimeControl input\s*{[^}]*width:\s*40px;/);
  expect(inputStyles).toMatch(/::-webkit-calendar-picker-indicator\s*{[\s\S]*display:\s*none;/);
});

test("adds fade gradients before fixed header and composer", () => {
  const headerStyles = fs.readFileSync(
    path.join(__dirname, "components/Header/Header.module.scss"),
    "utf8"
  );
  const inputStyles = fs.readFileSync(
    path.join(__dirname, "components/ToDoInput/ToDoInput.module.scss"),
    "utf8"
  );

  expect(headerStyles).toMatch(/\.root\s*{[\s\S]*&::before\s*{[\s\S]*linear-gradient\(\s*to bottom/);
  expect(headerStyles).toMatch(/&::before\s*{[\s\S]*pointer-events:\s*none;/);
  expect(inputStyles).toMatch(/\.inputContainer\s*{[\s\S]*&::before\s*{[\s\S]*linear-gradient\(\s*to top/);
  expect(inputStyles).toMatch(/&::before\s*{[\s\S]*pointer-events:\s*none;/);
});

test("uses measured offsets for fixed header and composer spacing", () => {
  const containerCode = fs.readFileSync(
    path.join(__dirname, "components/ToDoContainer/ToDoContainer.jsx"),
    "utf8"
  );
  const headerCode = fs.readFileSync(
    path.join(__dirname, "components/Header/Header.jsx"),
    "utf8"
  );
  const inputCode = fs.readFileSync(
    path.join(__dirname, "components/ToDoInput/ToDoInput.jsx"),
    "utf8"
  );
  const containerStyles = fs.readFileSync(
    path.join(__dirname, "components/ToDoContainer/ToDoContainer.module.scss"),
    "utf8"
  );

  expect(headerCode).toMatch(/onHeightChange\?\.\(Math\.ceil/);
  expect(headerCode).toMatch(/headerGap\s*=\s*window\.innerWidth\s*<=\s*900\s*\?\s*10\s*:\s*12/);
  expect(containerCode).toMatch(/marginTop:\s*headerOffset/);
  expect(containerStyles).toMatch(/@media \(max-width:\s*900px\)[\s\S]*margin-top:\s*112px;/);
  expect(inputCode).toMatch(/function getComposerReserve/);
  expect(inputCode).not.toMatch(/offsetHeight\s*\+\s*24/);
});

test("styles dropdown trigger as a compact header control", () => {
  const dropdownStyles = fs.readFileSync(
    path.join(__dirname, "components/UIkit/DropDownMenu/DropDownMenu.module.scss"),
    "utf8"
  );

  expect(dropdownStyles).toMatch(/\.listItem\s*{[\s\S]*min-height:\s*36px;/);
  expect(dropdownStyles).toMatch(/\.listItem\s*{[\s\S]*&::before\s*{/);
  expect(dropdownStyles).toMatch(/\.listItem\s*{[\s\S]*justify-content:\s*space-between;/);
  expect(dropdownStyles).toMatch(/& > div\s*{[\s\S]*width:\s*24px;/);
  expect(dropdownStyles).toMatch(/@media \(max-width:\s*560px\)[\s\S]*min-height:\s*36px;/);
});

test("shows search icons inside note and filter searches", () => {
  const headerCode = fs.readFileSync(
    path.join(__dirname, "components/Header/Header.jsx"),
    "utf8"
  );
  const headerStyles = fs.readFileSync(
    path.join(__dirname, "components/Header/Header.module.scss"),
    "utf8"
  );
  const dropdownCode = fs.readFileSync(
    path.join(__dirname, "components/UIkit/DropDownMenu/DropDownMenu.jsx"),
    "utf8"
  );
  const dropdownStyles = fs.readFileSync(
    path.join(__dirname, "components/UIkit/DropDownMenu/DropDownMenu.module.scss"),
    "utf8"
  );

  expect(headerCode).toMatch(/SvgSearch/);
  expect(headerCode).toMatch(/className={s\.searchControl}/);
  expect(dropdownCode).toMatch(/SvgSearch/);
  expect(dropdownCode).toMatch(/className={s\.searchControl}/);
  expect(headerStyles).toMatch(/\.searchControl\s*{[\s\S]*& svg\s*{/);
  expect(dropdownStyles).toMatch(/\.searchControl\s*{[\s\S]*& svg\s*{/);
});

test("keeps header controls in two ordered rows", () => {
  const headerCode = fs.readFileSync(
    path.join(__dirname, "components/Header/Header.jsx"),
    "utf8"
  );
  const headerStyles = fs.readFileSync(
    path.join(__dirname, "components/Header/Header.module.scss"),
    "utf8"
  );

  expect(headerCode).toMatch(
    /s\.topControls[\s\S]*<DropDownMenu[\s\S]*s\.searchControl[\s\S]*s\.accountMenu/
  );
  expect(headerCode).toMatch(
    /s\.bottomControls[\s\S]*SegmentedControl[\s\S]*s\.count[\s\S]*s\.actionControls[\s\S]*s\.completedBtn[\s\S]*SvgThree[\s\S]*SvgSettings/
  );
  expect(headerStyles).toMatch(/\.headerGrid\s*{[\s\S]*flex-direction:\s*column;/);
  expect(headerStyles).toMatch(/\.topControls\s*{[\s\S]*display:\s*grid;/);
  expect(headerStyles).toMatch(/\.topControls\s*{[\s\S]*grid-template-columns:\s*minmax\(128px,\s*1fr\)\s*minmax\(180px,\s*420px\)\s*minmax\(128px,\s*1fr\);/);
  expect(headerStyles).toMatch(/@media \(max-width:\s*520px\)[\s\S]*grid-template-columns:\s*auto minmax\(128px,\s*1fr\) auto;/);
  expect(headerStyles).toMatch(/\.completedBtn\s*{[\s\S]*border-color:\s*var\(--theme-30\)\s*!important;/);
  expect(headerStyles).toMatch(/\.count\s*{[\s\S]*justify-self:\s*center;/);
  expect(headerStyles).toMatch(/\.searchControl\s*{[\s\S]*justify-self:\s*center;/);
  expect(headerStyles).toMatch(/@media \(max-width:\s*520px\)[\s\S]*\.bottomControls\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto;/);
  expect(headerStyles).toMatch(/@media \(max-width:\s*520px\)[\s\S]*\.count\s*{[\s\S]*justify-self:\s*start;/);
  expect(headerStyles).toMatch(/@media \(max-width:\s*520px\)[\s\S]*\.countFull\s*{[\s\S]*display:\s*inline;/);
  expect(headerStyles).toMatch(/@media \(max-width:\s*520px\)[\s\S]*\.actionControls\s*{[\s\S]*justify-self:\s*end;/);
  expect(headerStyles).toMatch(/\.count\s*{[^}]*color:\s*var\(--theme-10\);/);
  expect(headerStyles).not.toMatch(/\.count\s*{[^}]*border:/);
  expect(headerStyles).not.toMatch(/\.count\s*{[^}]*background-color:/);
});

test("shows icons in the list and calendar switch", () => {
  const headerCode = fs.readFileSync(
    path.join(__dirname, "components/Header/Header.jsx"),
    "utf8"
  );
  const segmentedCode = fs.readFileSync(
    path.join(__dirname, "components/UIkit/SegmentedControl/SegmentedControl.jsx"),
    "utf8"
  );
  const segmentedStyles = fs.readFileSync(
    path.join(__dirname, "components/UIkit/SegmentedControl/SegmentedControl.module.scss"),
    "utf8"
  );

  expect(headerCode).toMatch(/SvgAlignJustify/);
  expect(headerCode).toMatch(/SvgCalendarNote/);
  expect(headerCode).toMatch(/icon:\s*<SvgAlignJustify \/>/);
  expect(headerCode).toMatch(/icon:\s*<SvgCalendarNote \/>/);
  expect(segmentedCode).toMatch(/option\.icon/);
  expect(segmentedStyles).toMatch(/\.icon\s*{[\s\S]*width:\s*16px;/);
});

test("uses neutral popup action button styling", () => {
  const appStyles = fs.readFileSync(path.join(__dirname, "App.module.scss"), "utf8");

  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Попап с кнопками");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.click(
    within(screen.getByTestId("todo-item-Попап с кнопками")).getByRole("button", {
      name: "Удалить",
    })
  );

  expect(screen.getByRole("button", { name: "Подтвердить удаление" }))
    .toHaveClass("popupDangerAction");
  expect(screen.getByRole("button", { name: "Отменить удаление" }))
    .toHaveClass("popupSecondaryAction");
  expect(appStyles).toMatch(/\.popupDangerAction\s*{[^}]*background-color:\s*var\(--theme-40\)\s*!important;/);
  expect(appStyles).toMatch(/\.popupSecondaryAction\s*{[^}]*background-color:\s*var\(--theme-40\)\s*!important;/);
  expect(appStyles).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.popupBtns\s*{[^}]*align-items:\s*stretch;/);
}
);

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

test("warns before deleting completed tasks from the header action", () => {
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

  expect(screen.getByText("Удалить выполненные задачи?")).toBeInTheDocument();
  expect(screen.getByText(/Будет удалено:/)).toHaveTextContent("Будет удалено: 1");
  expect(screen.getByText("Готовая задача")).toBeInTheDocument();

  userEvent.click(
    screen.getByRole("button", { name: "Подтвердить удаление выполненных" })
  );

  expect(screen.queryByText("Готовая задача")).not.toBeInTheDocument();
  expect(screen.getByText("Активная задача")).toBeInTheDocument();
  expect(screen.getByText("Заметок: 1")).toBeInTheDocument();
});

test("deletes completed tasks with Enter while the confirmation popup is open", () => {
  renderTodoApp();

  userEvent.type(screen.getByLabelText("Текст заметки"), "Готовая задача");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  const completedTask = screen.getByTestId("todo-item-Готовая задача");
  userEvent.click(
    within(completedTask).getByRole("button", { name: "Отметить выполненным" })
  );
  userEvent.click(screen.getByRole("button", { name: "Удалить выполненные" }));
  userEvent.keyboard("{Enter}");

  expect(screen.queryByText("Готовая задача")).not.toBeInTheDocument();
  expect(screen.queryByText("Удалить выполненные задачи?")).not.toBeInTheDocument();
  expect(screen.getByText("Заметок: 0")).toBeInTheDocument();
});

test("moves a completed task to the bottom", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Первая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Вторая");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Третья");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(getRenderedTodoTexts()).toEqual(["Третья", "Вторая", "Первая"]);

  const firstTask = screen.getByTestId("todo-item-Первая");
  userEvent.click(
    within(firstTask).getByRole("button", { name: "Отметить выполненным" })
  );

  expect(getRenderedTodoTexts()).toEqual(["Третья", "Вторая", "Первая"]);
  expect(getAccountJsonValue("toDoItems").map((item) => item.text)).toEqual([
    "Вторая",
    "Третья",
    "Первая",
  ]);
});

test("keeps favorite tasks above completed non-favorite tasks", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Обычная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Избранная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Выполненная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  const favoriteTask = screen.getByTestId("todo-item-Избранная");
  userEvent.click(
    within(favoriteTask).getByRole("button", { name: "Добавить в избранное" })
  );

  const completedTask = screen.getByTestId("todo-item-Выполненная");
  userEvent.click(
    within(completedTask).getByRole("button", { name: "Отметить выполненным" })
  );

  expect(getRenderedTodoTexts()).toEqual([
    "Избранная",
    "Обычная",
    "Выполненная",
  ]);
});

test("keeps completed favorite tasks below active tasks and above completed regular tasks", () => {
  renderTodoApp();

  const input = screen.getByLabelText("Текст заметки");
  userEvent.type(input, "Избранная выполненная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Избранная обычная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Обычная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));
  userEvent.type(input, "Обычная выполненная");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  const completedFavoriteTask = screen.getByTestId(
    "todo-item-Избранная выполненная"
  );
  userEvent.click(
    within(completedFavoriteTask).getByRole("button", {
      name: "Добавить в избранное",
    })
  );
  userEvent.click(
    within(completedFavoriteTask).getByRole("button", {
      name: "Отметить выполненным",
    })
  );

  const activeFavoriteTask = screen.getByTestId("todo-item-Избранная обычная");
  userEvent.click(
    within(activeFavoriteTask).getByRole("button", {
      name: "Добавить в избранное",
    })
  );

  const completedRegularTask = screen.getByTestId("todo-item-Обычная выполненная");
  userEvent.click(
    within(completedRegularTask).getByRole("button", {
      name: "Отметить выполненным",
    })
  );

  expect(getRenderedTodoTexts()).toEqual([
    "Избранная обычная",
    "Обычная",
    "Избранная выполненная",
    "Обычная выполненная",
  ]);
});

test("adds a custom category from the category filter", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.click(screen.getByText("Добавить +"));
  userEvent.type(screen.getByLabelText("Название категории"), "errands");
  userEvent.click(screen.getByRole("button", { name: "Добавить категорию" }));

  expect(screen.getByRole("button", { name: "Открыть список: errands" })).toBeInTheDocument();
  expect(getAccountJsonValue("Categories")).toEqual([
    expect.objectContaining({ name: "errands" }),
  ]);

  userEvent.type(screen.getByLabelText("Текст заметки"), "Задача в новой категории");
  userEvent.click(screen.getByRole("button", { name: "Добавить заметку" }));

  expect(screen.getByText("Категория: errands")).toBeInTheDocument();
});

test("migrates legacy profile storage to categories", async () => {
  localStorage.setItem(
    "Profiles",
    JSON.stringify([{ id: "custom-errands", name: "errands", createdAt: 20 }])
  );
  localStorage.setItem(
    "toDoItems",
    JSON.stringify([
      {
        id: "task-errands",
        text: "Старая заметка",
        favorite: false,
        checked: false,
        profile: "errands",
        date: "today",
      },
    ])
  );

  renderTodoApp();

  expect(screen.getByText("Категория: errands")).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  expect(screen.getByText("errands")).toBeInTheDocument();

  await waitFor(() => {
    expect(getAccountStorageValue("Profiles")).toBeNull();
    expect(getAccountJsonValue("Categories")).toEqual([
      expect.objectContaining({ name: "errands" }),
    ]);
    expect(getAccountJsonValue("toDoItems")[0]).toMatchObject({
      text: "Старая заметка",
      category: "errands",
    });
    expect(getAccountJsonValue("toDoItems")[0]).not.toHaveProperty("profile");
  });
});

test("shows only all as the built-in category", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  const categoryItems = within(screen.getByRole("list")).getAllByRole("listitem");

  expect(categoryItems.map((item) => item.textContent)).toEqual([
    "all",
    "Добавить +",
  ]);
});

test("prefills the add category popup from the filter search", () => {
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), "errands");
  userEvent.click(screen.getByText("Добавить +"));

  expect(screen.getByLabelText("Название категории")).toHaveValue("errands");
});

test("limits custom category names to 32 characters", () => {
  const longCategoryName = "abcdefghijklmnopqrstuvwxyz1234567890";
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), longCategoryName);
  userEvent.click(screen.getByText("Добавить +"));

  expect(screen.getByLabelText("Название категории")).toHaveValue(
    longCategoryName.slice(0, 32)
  );
  expect(screen.getByText("32/32")).toBeInTheDocument();
});

test("does not allow adding a duplicate category name", () => {
  localStorage.setItem(
    "Categories",
    JSON.stringify([{ id: "custom-errands", name: "errands", createdAt: 20 }])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.type(screen.getByLabelText("Поиск фильтров"), " Errands ");
  userEvent.click(screen.getByText("Добавить +"));

  expect(screen.getByText("Такая категория уже существует")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Добавить категорию" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Открыть список: all" })).toBeInTheDocument();
});

test("deletes a custom category from the category filter", () => {
  localStorage.setItem(
    "Categories",
    JSON.stringify([{ id: "custom-errands", name: "errands", createdAt: 20 }])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  expect(screen.getByText("errands")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "Удалить фильтр errands" }));

  expect(screen.queryByText("errands")).not.toBeInTheDocument();
  expect(getAccountStorageValue("Categories")).toBeNull();
});

test("deletes an empty custom category without confirmation", () => {
  localStorage.setItem(
    "Categories",
    JSON.stringify([{ id: "custom-empty", name: "empty", createdAt: 20 }])
  );
  renderTodoApp();

  userEvent.click(screen.getByRole("button", { name: "Открыть список: all" }));
  userEvent.click(screen.getByRole("button", { name: "Удалить фильтр empty" }));

  expect(screen.queryByText("В категории есть заметки")).not.toBeInTheDocument();
  expect(screen.queryByText("empty")).not.toBeInTheDocument();
  expect(getAccountStorageValue("Categories")).toBeNull();
});

test("warns before deleting a category with tasks and removes its tasks after confirmation", () => {
  localStorage.setItem(
    "Categories",
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
        category: "errands",
        date: "today",
      },
      {
        id: "task-home",
        text: "Полить цветы",
        favorite: false,
        checked: false,
        category: "home",
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
  expect(getAccountJsonValue("toDoItems")).toEqual([
    expect.objectContaining({ text: "Полить цветы", category: "home" }),
  ]);
  expect(getAccountStorageValue("Categories")).toBeNull();
});

test("searches custom category filters by name", () => {
  localStorage.setItem(
    "Categories",
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

test("sorts custom category filters by name", () => {
  localStorage.setItem(
    "Categories",
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
    "zeta",
    "alpha",
    "Добавить +",
  ]);

  userEvent.click(screen.getByRole("button", { name: "Сортировать фильтры по имени" }));

  const listAfterSort = within(screen.getByRole("list")).getAllByRole("listitem");
  expect(listAfterSort.map((item) => item.textContent)).toEqual([
    "all",
    "alpha",
    "zeta",
    "Добавить +",
  ]);
});
