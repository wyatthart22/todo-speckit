<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const loading = ref(false);
const user = computed(() => Utils.getStore("user"));
const firstName = computed(() => user.value?.fName || "there");

async function signOut() {
  loading.value = true;

  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    loading.value = false;
    await router.push({ name: "login" });
  }
}
</script>

<template>
  <v-container class="py-10">
    <v-card class="pa-6" elevation="2">
      <h1 class="text-h4 mb-4">Welcome, {{ firstName }}</h1>
      <v-btn color="primary" variant="elevated" class="oc-cta" :loading="loading" @click="signOut">
        Sign out
      </v-btn>
    </v-card>
  </v-container>
</template>
