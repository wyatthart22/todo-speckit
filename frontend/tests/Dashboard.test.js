/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { DOMWrapper, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import Utils from "../src/config/utils.js";
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

const groceries = { id: 1, name: "Groceries", userId: 1 };
const work = { id: 2, name: "Work", userId: 1 };
const personal = { id: 3, name: "Personal", userId: 1 };

let wrapper;

async function clickByText(label) {
  const button = [...document.querySelectorAll("button")].find((node) =>
    node.textContent.replace(/\s+/g, " ").includes(label)
  );

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  button.click();
  await flushPromises();
}

async function setVisibleInput(value) {
  const input = document.querySelector("input");

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
