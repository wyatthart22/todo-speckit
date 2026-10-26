<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";
import TodoServices from "../services/todoServices.js";
import { listNameRules, todoTitleRules } from "../config/validation.js";

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

const itemsDialog = ref(false);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const itemsError = ref("");

const addItemDialog = ref(false);
const addItemForm = ref(null);
const newTodoTitle = ref("");
const addItemLoading = ref(false);

const editItemDialog = ref(false);
const editItemForm = ref(null);
const editingTodo = ref(null);
const editTodoTitle = ref("");
const editItemLoading = ref(false);

const deleteItemDialog = ref(false);
const deletingTodo = ref(null);
const deleteItemLoading = ref(false);

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

async function loadTodos() {
  if (!itemsList.value) {
    return;
  }

  todosLoading.value = true;
  itemsError.value = "";

  try {
    const res = await TodoServices.getTodos(itemsList.value.id);
    todos.value = res.data;
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to load todos.";
  } finally {
    todosLoading.value = false;
  }
}

async function openItems(list) {
  itemsList.value = list;
  todos.value = [];
  itemsDialog.value = true;
  await loadTodos();
}

function closeItems() {
  itemsDialog.value = false;
  itemsList.value = null;
  todos.value = [];
  itemsError.value = "";
}

function openAddItem() {
  newTodoTitle.value = "";
  addItemForm.value?.resetValidation?.();
  addItemDialog.value = true;
}

async function createTodo() {
  const { valid } = await addItemForm.value.validate();

  if (!valid) {
    return;
  }

  addItemLoading.value = true;
  itemsError.value = "";

  try {
    await TodoServices.createTodo(itemsList.value.id, { title: newTodoTitle.value });
    addItemDialog.value = false;
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to create todo.";
  } finally {
    addItemLoading.value = false;
  }
}

async function toggleTodo(todo, completed) {
  itemsError.value = "";

  try {
    await TodoServices.updateTodo(todo.id, { completed: Boolean(completed) });
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to update todo.";
  }
}

function openEditItem(todo) {
  editingTodo.value = todo;
  editTodoTitle.value = todo.title;
  editItemForm.value?.resetValidation?.();
  editItemDialog.value = true;
}

async function saveTodo() {
  const { valid } = await editItemForm.value.validate();

  if (!valid) {
    return;
  }

  editItemLoading.value = true;
  itemsError.value = "";

  try {
    await TodoServices.updateTodo(editingTodo.value.id, { title: editTodoTitle.value });
    editItemDialog.value = false;
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to update todo.";
  } finally {
    editItemLoading.value = false;
  }
}

function openDeleteItem(todo) {
  deletingTodo.value = todo;
  deleteItemDialog.value = true;
}

async function confirmDeleteItem() {
  deleteItemLoading.value = true;
  itemsError.value = "";

  try {
    await TodoServices.deleteTodo(deletingTodo.value.id);
    deleteItemDialog.value = false;
    await loadTodos();
  } catch (err) {
    itemsError.value = err.response?.data?.message || "Unable to delete todo.";
  } finally {
    deleteItemLoading.value = false;
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
              <v-btn
                icon
                size="small"
                :aria-label="`View items for ${list.name}`"
                @click="openItems(list)"
              >
                <v-icon>mdi-format-list-checks</v-icon>
              </v-btn>
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

    <v-dialog v-if="itemsDialog" v-model="itemsDialog" max-width="640" attach @update:model-value="(open) => !open && closeItems()">
      <v-card>
        <v-card-item>
          <template #title>{{ itemsList?.name }} — Items</template>
          <template #append>
            <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddItem">+ Add Item</v-btn>
          </template>
        </v-card-item>
        <v-card-text>
          <v-progress-linear v-if="todosLoading" indeterminate class="mb-4" />
          <v-alert v-if="itemsError" type="error" class="mb-4">
            {{ itemsError }}
          </v-alert>
          <p v-if="!todosLoading && todos.length === 0" class="text-body-1">
            No todos in this list yet.
          </p>
          <v-list v-else-if="!todosLoading">
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  density="compact"
                  :aria-label="`Toggle ${todo.title}`"
                  @update:model-value="(value) => toggleTodo(todo, value)"
                />
              </template>
              <v-list-item-title :class="todo.completed ? 'text-decoration-line-through text-medium-emphasis' : ''">
                {{ todo.title }}
              </v-list-item-title>
              <template #append>
                <v-btn icon size="small" aria-label="Edit todo" @click.stop="openEditItem(todo)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" aria-label="Delete todo" @click.stop="openDeleteItem(todo)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItems">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="addItemDialog" v-model="addItemDialog" max-width="480" attach>
      <v-card>
        <v-card-item>
          <template #title>Add item</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="addItemForm" @submit.prevent="createTodo">
            <v-text-field v-model="newTodoTitle" label="Todo title" :rules="todoTitleRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="addItemLoading" @click="createTodo">
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="editItemDialog" v-model="editItemDialog" max-width="480" attach>
      <v-card>
        <v-card-item>
          <template #title>Edit item</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="editItemForm" @submit.prevent="saveTodo">
            <v-text-field v-model="editTodoTitle" label="Todo title" :rules="todoTitleRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="editItemLoading" @click="saveTodo">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="deleteItemDialog" v-model="deleteItemDialog" max-width="480" attach>
      <v-card>
        <v-card-item>
          <template #title>Delete item</template>
        </v-card-item>
        <v-card-text>
          Delete {{ deletingTodo?.title }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteItemDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleteItemLoading" @click="confirmDeleteItem">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
