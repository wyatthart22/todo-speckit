<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";
import { listNameRules } from "../config/validation.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const addForm = ref(null);
const newName = ref("");
const addLoading = ref(false);

const renameDialog = ref(false);
const renameForm = ref(null);
const renameName = ref("");
const renamingList = ref(null);
const renameLoading = ref(false);

const deleteDialog = ref(false);
const deletingList = ref(null);
const deleteLoading = ref(false);

async function loadLists() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await ListServices.getLists();
    lists.value = res.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to load lists.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadLists);

function openAdd() {
  newName.value = "";
  addForm.value?.resetValidation?.();
  addDialog.value = true;
}

async function createList() {
  const { valid } = await addForm.value.validate();

  if (!valid) {
    return;
  }

  addLoading.value = true;
  errorMessage.value = "";

  try {
    await ListServices.createList({ name: newName.value });
    addDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to create list.";
  } finally {
    addLoading.value = false;
  }
}

function openRename(list) {
  renamingList.value = list;
  renameName.value = list.name;
  renameForm.value?.resetValidation?.();
  renameDialog.value = true;
}

async function saveRename() {
  const { valid } = await renameForm.value.validate();

  if (!valid) {
    return;
  }

  renameLoading.value = true;
  errorMessage.value = "";

  try {
    await ListServices.updateList(renamingList.value.id, { name: renameName.value });
    renameDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to rename list.";
  } finally {
    renameLoading.value = false;
  }
}

function openDelete(list) {
  deletingList.value = list;
  deleteDialog.value = true;
}

async function confirmDelete() {
  deleteLoading.value = true;
  errorMessage.value = "";

  try {
    await ListServices.deleteList(deletingList.value.id);
    deleteDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to delete list.";
  } finally {
    deleteLoading.value = false;
  }
}
</script>

<template>
  <v-container class="py-10">
    <v-card elevation="2">
      <v-card-item>
        <template #title>My Lists</template>
        <template #append>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAdd">+ New List</v-btn>
        </template>
      </v-card-item>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <p v-if="!loading && lists.length === 0" class="text-body-1">
          No lists yet. Create your first list.
        </p>
        <v-list v-else-if="!loading">
          <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
            <template #append>
              <v-btn icon size="small" aria-label="Edit list" @click="openRename(list)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" aria-label="Delete list" @click="openDelete(list)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-if="addDialog" v-model="addDialog" max-width="480" attach>
      <v-card>
        <v-card-item>
          <template #title>New list</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field v-model="newName" label="List name" :rules="listNameRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="addLoading" @click="createList">
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="renameDialog" v-model="renameDialog" max-width="480" attach>
      <v-card>
        <v-card-item>
          <template #title>Rename list</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="saveRename">
            <v-text-field v-model="renameName" label="List name" :rules="listNameRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="renameLoading" @click="saveRename">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="deleteDialog" v-model="deleteDialog" max-width="480" attach>
      <v-card>
        <v-card-item>
          <template #title>Delete list</template>
        </v-card-item>
        <v-card-text>
          Delete {{ deletingList?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleteLoading" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
