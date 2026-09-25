<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  working: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  /** `skills` empty means every skill in the package. */
  submit: [pkg: string, skills: string[]]
}>()

const pkg = ref('')
const skills = ref('')

function onSubmit() {
  if (!pkg.value.trim())
    return
  emit('submit', pkg.value.trim(), skills.value.split(/[\s,]+/).filter(Boolean))
}
</script>

<template>
  <form class="add-form" @submit.prevent="onSubmit">
    <h3>Add from source</h3>
    <div class="row">
      <label class="grow">
        Package
        <input v-model="pkg" class="input" placeholder="owner/repo, GitHub URL or git URL" required>
      </label>
      <label>
        Skills <span class="muted">(optional)</span>
        <input v-model="skills" class="input" placeholder="all, or: pr-review commit">
      </label>
    </div>
    <p class="muted note">
      Installs to the agents selected above.
    </p>
    <button class="btn primary" type="submit" :disabled="working || disabled || !pkg.trim()">
      {{ working ? 'Adding…' : 'Add' }}
    </button>
  </form>
</template>

<style scoped>
.add-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
h3 {
  margin: 0;
  font-size: 14px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  flex: 1;
}
label.grow {
  flex: 2;
}
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.note {
  font-size: 12px;
  margin: 0;
}
button {
  align-self: flex-start;
}
</style>
