/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "../src/views/Login.vue";
import AuthServices from "../src/services/authServices.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

async function fillAndSubmit(wrapper, { username = "", password = "" } = {}) {
  const inputs = wrapper.findAll("input");
  await inputs[0].setValue(username);
  await inputs[1].setValue(password);
  await wrapper.find("form").trigger("submit.prevent");
  await flushPromises();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      AuthServices.loginUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: "Invalid username or password." },
        },
      });

      const { wrapper, router } = await mountWithPlugins(Login, {
        router: await createTestRouter("/login"),
      });

      await fillAndSubmit(wrapper, { username: "jdoe", password: "wrong-password" });

      expect(AuthServices.loginUser).toHaveBeenCalled();
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid username or password.");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);

      await fillAndSubmit(wrapper, { username: "", password: "password123" });

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);

      await fillAndSubmit(wrapper, { username: "jdoe", password: "" });

      expect(wrapper.text()).toContain("Password is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
