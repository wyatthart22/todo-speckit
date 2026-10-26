/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 * Feature 5 — Todo Due Date
 * Spec: features/feature-5-todo-due-date.md
 */
import { DOMWrapper, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import TodoServices from "../src/services/todoServices.js";
import Utils from "../src/config/utils.js";
import { formatDueDate } from "../src/config/validation.js";
import router from "../src/router.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };
const work = { id: 2, name: "Work", userId: 1 };
const personal = { id: 3, name: "Personal", userId: 1 };

let wrapper;

function buttonLabel(node) {
  return node.textContent.replace(/\s+/g, " ").trim();
}

async function clickByText(label) {
  const buttons = [...document.querySelectorAll("button")];
  const button =
    buttons.find((node) => buttonLabel(node) === label) ||
    buttons.find((node) => buttonLabel(node).includes(label));

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  button.click();
  await flushPromises();
}

async function setVisibleInput(value) {
  const input = document.querySelector('input:not([type="checkbox"])');

  if (!input) {
    throw new Error("Input not found");
  }

  await new DOMWrapper(input).setValue(value);
  await flushPromises();
}

async function mountDashboard() {
  const mounted = await mountWithPlugins(Dashboard, { attachTo: document.body });
  wrapper = mounted.wrapper;
  await flushPromises();
  return mounted;
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
    Utils.setStore("user", {
      userId: 1,
      username: "jdoe",
      fName: "Jane",
      lName: "Doe",
      token: "session-token",
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [groceries] });
      ListServices.createList.mockResolvedValue({ data: groceries });

      await mountDashboard();
      await clickByText("+ New List");
      await setVisibleInput("Groceries");
      await clickByText("Create");

      expect(ListServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.text()).not.toContain("New list");
    });

    it("User creates a list with an empty name", async () => {
      await mountDashboard();
      await clickByText("+ New List");
      await setVisibleInput("   ");
      await clickByText("Create");

      expect(wrapper.text()).toContain("List name is required.");
      expect(ListServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal, work] });

      await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      await mountDashboard();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      ListServices.getLists.mockResolvedValue({ data: [groceries] });

      await mountDashboard();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [{ ...groceries, name: "Shopping" }] });
      ListServices.updateList.mockResolvedValue({
        data: { ...groceries, name: "Shopping" },
      });

      await mountDashboard();
      await wrapper.get('[aria-label="Edit list"]').trigger("click");
      await flushPromises();
      await setVisibleInput("Shopping");
      await clickByText("Save");

      expect(ListServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      ListServices.getLists.mockResolvedValueOnce({ data: [groceries] }).mockResolvedValueOnce({ data: [] });
      ListServices.deleteList.mockResolvedValue({ data: groceries });

      await mountDashboard();
      await wrapper.get('[aria-label="Delete list"]').trigger("click");
      await flushPromises();
      await clickByText("Delete");

      expect(ListServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
      expect(wrapper.text()).not.toContain("Delete Groceries?");
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("Unauthenticated user accesses the dashboard", async () => {
      localStorage.clear();
      await router.push({ name: "login" });
      await router.isReady();
      await router.push({ name: "home" });

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

const buyMilk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [groceries] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
    Utils.setStore("user", {
      userId: 1,
      username: "jdoe",
      fName: "Jane",
      lName: "Doe",
      token: "session-token",
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  async function openItems(listName) {
    await wrapper.get(`[aria-label="View items for ${listName}"]`).trigger("click");
    await flushPromises();
  }

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      TodoServices.getTodos.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [buyMilk] });
      TodoServices.createTodo.mockResolvedValue({ data: buyMilk });

      await mountDashboard();
      await openItems("Groceries");
      await clickByText("+ Add Item");
      await setVisibleInput("Buy milk");
      await clickByText("Add");

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(wrapper.text()).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      await mountDashboard();
      await openItems("Groceries");
      await clickByText("+ Add Item");
      await setVisibleInput("   ");
      await clickByText("Add");

      expect(wrapper.text()).toContain("Todo title is required.");
      expect(TodoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      await mountDashboard();

      expect(wrapper.text()).not.toContain("+ Add Item");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal] });

      await mountDashboard();
      await openItems("Personal");

      expect(wrapper.text()).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal, work] });
      TodoServices.getTodos.mockImplementation((listId) => {
        if (listId === 3) {
          return Promise.resolve({ data: [{ id: 11, listId: 3, title: "Call mom", completed: false }] });
        }

        if (listId === 2) {
          return Promise.resolve({
            data: [
              { id: 12, listId: 2, title: "Email client", completed: false },
              { id: 13, listId: 2, title: "Write report", completed: false },
            ],
          });
        }

        return Promise.resolve({ data: [] });
      });

      await mountDashboard();
      await openItems("Personal");
      expect(wrapper.text()).toContain("Call mom");
      expect(wrapper.text()).not.toContain("Email client");

      await clickByText("Close");
      await openItems("Work");

      expect(wrapper.text()).toContain("Email client");
      expect(wrapper.text()).toContain("Write report");
      expect(wrapper.text()).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, completed: true }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...buyMilk, completed: true } });

      await mountDashboard();
      await openItems("Groceries");
      await wrapper.get('input[type="checkbox"]').setValue(true);
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(wrapper.find(".text-decoration-line-through").exists()).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const completed = { ...buyMilk, completed: true };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [completed] })
        .mockResolvedValueOnce({ data: [buyMilk] });
      TodoServices.updateTodo.mockResolvedValue({ data: buyMilk });

      await mountDashboard();
      await openItems("Groceries");
      expect(wrapper.find(".text-decoration-line-through").exists()).toBe(true);

      await wrapper.get('input[type="checkbox"]').setValue(false);
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
      expect(wrapper.find(".text-decoration-line-through").exists()).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, title: "Buy oat milk" }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...buyMilk, title: "Buy oat milk" } });

      await mountDashboard();
      await openItems("Groceries");
      await wrapper.get('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();
      await setVisibleInput("Buy oat milk");
      await clickByText("Save");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(wrapper.text()).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      TodoServices.getTodos.mockResolvedValueOnce({ data: [buyMilk] }).mockResolvedValueOnce({ data: [] });
      TodoServices.deleteTodo.mockResolvedValue({ data: buyMilk });

      await mountDashboard();
      await openItems("Groceries");
      await wrapper.get('[aria-label="Delete todo"]').trigger("click");
      await flushPromises();
      await clickByText("Delete");

      expect(TodoServices.deleteTodo).toHaveBeenCalledWith(10);
      expect(wrapper.text()).toContain("No todos in this list yet.");
    });
  });
});

function localYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function setDateInput(value) {
  const input = document.querySelector('input[type="date"]');

  if (!input) {
    throw new Error("Date input not found");
  }

  await new DOMWrapper(input).setValue(value);
  await flushPromises();
}

describe("Feature 5 — Todo Due Date", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [groceries] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
    Utils.setStore("user", {
      userId: 1,
      username: "jdoe",
      fName: "Jane",
      lName: "Doe",
      token: "session-token",
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  async function openItems(listName) {
    await wrapper.get(`[aria-label="View items for ${listName}"]`).trigger("click");
    await flushPromises();
  }

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const created = { ...buyMilk, dueDate: "2026-07-15" };
      TodoServices.getTodos.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [created] });
      TodoServices.createTodo.mockResolvedValue({ data: created });

      await mountDashboard();
      await openItems("Groceries");
      await clickByText("+ Add Item");
      await setVisibleInput("Buy milk");
      await setDateInput("2026-07-15");
      await clickByText("Add");

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, {
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
      expect(wrapper.text()).toContain(formatDueDate("2026-07-15"));
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [{ ...buyMilk, dueDate: null }] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, dueDate: "2026-07-20" }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...buyMilk, dueDate: "2026-07-20" } });

      await mountDashboard();
      await openItems("Groceries");
      await wrapper.get('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();
      await setDateInput("2026-07-20");
      await clickByText("Save");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(wrapper.text()).toContain(formatDueDate("2026-07-20"));
    });

    it("User clears a due date when editing a todo", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [{ ...buyMilk, dueDate: "2026-07-20" }] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, dueDate: null }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...buyMilk, dueDate: null } });

      await mountDashboard();
      await openItems("Groceries");
      expect(wrapper.text()).toContain(formatDueDate("2026-07-20"));
      await wrapper.get('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();
      await setDateInput("");
      await clickByText("Save");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(wrapper.text()).not.toContain(formatDueDate("2026-07-20"));
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dueDate = localYmd(yesterday);

      TodoServices.getTodos.mockResolvedValue({
        data: [{ ...buyMilk, dueDate, completed: false }],
      });

      await mountDashboard();
      await openItems("Groceries");

      expect(wrapper.find(".todo-overdue").exists()).toBe(true);
      expect(wrapper.text()).toContain(formatDueDate(dueDate));
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dueDate = localYmd(yesterday);

      TodoServices.getTodos.mockResolvedValue({
        data: [{ ...buyMilk, dueDate, completed: true }],
      });

      await mountDashboard();
      await openItems("Groceries");

      expect(wrapper.find(".todo-overdue").exists()).toBe(false);
      expect(wrapper.text()).toContain(formatDueDate(dueDate));
    });
  });
});
