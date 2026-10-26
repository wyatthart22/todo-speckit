/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { DOMWrapper, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import MenuBar from "../src/components/MenuBar.vue";
import AuthServices from "../src/services/authServices.js";
import UserServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
    loginUser: vi.fn(),
    registerUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const sessionUser = {
  userId: 1,
  username: "jdoe",
  email: "jdoe@example.com",
  fName: "Jane",
  lName: "Doe",
  token: "session-token",
  role: "worker",
};

const profile = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
};

let wrapper;
let router;

function buttonLabel(node) {
  return node.textContent.replace(/\s+/g, " ").trim();
}

async function clickByText(label) {
  const buttons = [...document.querySelectorAll("button"), ...document.querySelectorAll("[role='listitem']")];
  const button =
    buttons.find((node) => buttonLabel(node) === label) ||
    buttons.find((node) => buttonLabel(node).includes(label));

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  button.click();
  await flushPromises();
}

async function openProfile() {
  await wrapper.get('[aria-label="Open profile"]').trigger("click");
  await flushPromises();
}

async function openEditDialog() {
  await openProfile();
  await clickByText("Edit Profile");
}

function textInputs() {
  return [...document.querySelectorAll('input:not([type="checkbox"])')];
}

async function setInputAt(index, value) {
  const input = textInputs()[index];

  if (!input) {
    throw new Error(`Input ${index} not found`);
  }

  await new DOMWrapper(input).setValue(value);
  await flushPromises();
}

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

async function mountMenuBar() {
  router = await createTestRouter("/");
  const mounted = await mountWithPlugins(MenuBarHost, {
    attachTo: document.body,
    router,
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return mounted;
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Utils.setStore("user", sessionUser);
    UserServices.getUser.mockResolvedValue({ data: profile });
    UserServices.updateUser.mockResolvedValue({
      data: { ...profile, fName: "Janet" },
    });
    AuthServices.logoutUser.mockResolvedValue({});
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      await mountMenuBar();
      await openProfile();

      expect(wrapper.text()).toContain("Jane Doe");
      expect(wrapper.text()).toContain("jdoe");
      expect(wrapper.text()).toContain("jdoe@example.com");
      expect(wrapper.text()).toContain("Edit Profile");
      expect(wrapper.text()).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      await mountMenuBar();
      await openEditDialog();

      expect(wrapper.text()).toContain("Edit Profile");
      expect(textInputs()[0].value).toBe("Jane");
      expect(textInputs()[1].value).toBe("Doe");
      expect(textInputs()[2].value).toBe("jdoe@example.com");
      expect(textInputs()[3].value).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const before = Utils.getStore("user");

      await mountMenuBar();
      await openEditDialog();
      await setInputAt(0, "Janet");
      await clickByText("Cancel");

      expect(UserServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toEqual(before);
      expect(wrapper.text()).not.toContain("First name");
    });

    it("User saves profile changes", async () => {
      UserServices.updateUser.mockResolvedValue({
        data: {
          ...profile,
          fName: "Janet",
          lName: "Doer",
          email: "janet@example.com",
          username: "janet",
        },
      });

      await mountMenuBar();
      await openEditDialog();
      await setInputAt(0, "Janet");
      await setInputAt(1, "Doer");
      await setInputAt(2, "janet@example.com");
      await setInputAt(3, "janet");
      await clickByText("Save");

      expect(UserServices.updateUser).toHaveBeenCalledWith(1, {
        fName: "Janet",
        lName: "Doer",
        email: "janet@example.com",
        username: "janet",
      });
      expect(wrapper.text()).not.toContain("First name");
      expect(Utils.getStore("user")).toMatchObject({
        fName: "Janet",
        lName: "Doer",
        email: "janet@example.com",
        username: "janet",
        token: "session-token",
      });

      await openProfile();
      expect(wrapper.text()).toContain("Janet Doer");
      expect(wrapper.text()).toContain("janet");
      expect(wrapper.text()).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      await mountMenuBar();
      await openEditDialog();
      await setInputAt(2, "notanemail");
      await clickByText("Save");

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      await mountMenuBar();
      await openEditDialog();
      await setInputAt(4, "password123");
      await setInputAt(5, "password456");
      await clickByText("Save");

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      await mountMenuBar();
      await openEditDialog();
      await setInputAt(4, "short");
      await setInputAt(5, "short");
      await clickByText("Save");

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      UserServices.updateUser.mockRejectedValue({
        response: { status: 400, data: { message: "Username is already taken." } },
      });

      await mountMenuBar();
      await openEditDialog();
      await clickByText("Save");

      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Username is already taken.");
      expect(wrapper.text()).toContain("First name");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      await mountMenuBar();
      await openProfile();
      await clickByText("Log out");
      await flushPromises();

      expect(AuthServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      await mountMenuBar();

      expect(wrapper.text()).not.toContain("Sign out");
    });
  });
});
