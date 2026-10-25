import { createRouter, createWebHistory } from "vue-router";
import Utils from "./config/utils.js";

const publicPages = new Set(["login", "register"]);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("./views/Home.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("./views/Login.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("./views/Register.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

router.beforeEach((to) => {
  const user = Utils.getStore("user");

  if (!user && !publicPages.has(to.name)) {
    return { name: "login" };
  }

  if (user && publicPages.has(to.name)) {
    return { name: "home" };
  }
});

export default router;
